import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { AxiosResponse, InternalAxiosRequestConfig } from 'axios';

type Call = { url?: string; authorization: string | null; timeout?: number };
type Handler = (config: InternalAxiosRequestConfig) => { status: number; data?: unknown } | Error;

let calls: Call[];
let routes: Record<string, Handler>;
let client: typeof import('./api-client');

// Stands in for the network: every request from both axios instances lands here.
async function loadClient() {
  vi.resetModules();
  const axiosModule = await import('axios');
  const { AxiosError } = axiosModule;
  axiosModule.default.defaults.adapter = async (config) => {
    const authorization = config.headers?.get?.('Authorization')?.toString() ?? null;
    calls.push({ url: config.url, authorization, timeout: config.timeout });
    const handler = routes[config.url ?? ''];
    const result = handler ? handler(config) : { status: 404 };
    if (result instanceof Error) throw result;
    const response = {
      data: result.data ?? {},
      status: result.status,
      statusText: String(result.status),
      headers: {},
      config,
    } as AxiosResponse;
    if (result.status >= 400) {
      throw new AxiosError(`HTTP ${result.status}`, undefined, config, {}, response);
    }
    return response;
  };
  client = await import('./api-client');
  return { AxiosError };
}

const ok = (data: unknown = {}) => ({ status: 200, data });
const refreshTo = (token: string) => () => ({
  status: 201,
  data: { data: { accessToken: token } },
});
const requireToken = (token: string) => (config: InternalAxiosRequestConfig) =>
  config.headers.get('Authorization') === `Bearer ${token}`
    ? ok({ data: { id: 'u1' } })
    : { status: 401 };
const urls = () => calls.map((c) => c.url);

beforeEach(async () => {
  calls = [];
  routes = {};
  await loadClient();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('session bootstrap (hard page load)', () => {
  it('refreshes up front instead of 401 -> refresh -> retry', async () => {
    routes['/auth/refresh-token'] = refreshTo('T1');
    routes['/users/me'] = requireToken('T1');
    client.enableSessionBootstrap();

    await expect(client.fetcher('/users/me')).resolves.toEqual({ data: { id: 'u1' } });

    expect(urls()).toEqual(['/auth/refresh-token', '/users/me']);
    expect(calls[1].authorization).toBe('Bearer T1');
  });

  it('makes concurrent first-load requests share a single refresh', async () => {
    routes['/auth/refresh-token'] = refreshTo('T1');
    routes['/users/me'] = requireToken('T1');
    routes['/workspaces'] = requireToken('T1');
    routes['/banners/active'] = requireToken('T1');
    client.enableSessionBootstrap();

    await Promise.all([
      client.fetcher('/users/me'),
      client.fetcher('/workspaces'),
      client.fetcher('/banners/active'),
    ]);

    expect(urls().filter((u) => u === '/auth/refresh-token')).toHaveLength(1);
    expect(
      calls.filter((c) => c.url !== '/auth/refresh-token').map((c) => c.authorization),
    ).toEqual(['Bearer T1', 'Bearer T1', 'Bearer T1']);
  });

  it('is off unless AuthProvider turns it on (the shop checkout never gets a merchant token)', async () => {
    routes['/orders/pending'] = () => ok();

    await client.fetcher('/orders/pending');

    expect(urls()).toEqual(['/orders/pending']);
    expect(calls[0].authorization).toBeNull();
  });

  it('never replaces a caller-provided Authorization header, nor refreshes for it', async () => {
    routes['/auth/refresh-token'] = refreshTo('T1');
    routes['/orders/pending'] = () => ({ status: 401 });
    client.enableSessionBootstrap();

    await expect(
      client.default.get('/orders/pending', { headers: { Authorization: 'Bearer LEAD' } }),
    ).rejects.toMatchObject({ response: { status: 401 } });

    expect(urls()).toEqual(['/orders/pending']);
    expect(calls[0].authorization).toBe('Bearer LEAD');
  });

  it('does not bootstrap for auth endpoints', async () => {
    routes['/auth/prelogin'] = () => ok();
    client.enableSessionBootstrap();

    await client.default.get('/auth/prelogin');

    expect(urls()).toEqual(['/auth/prelogin']);
  });

  it('runs once per page load; after a failed bootstrap the 401 path still refreshes', async () => {
    routes['/auth/refresh-token'] = () => ({ status: 403 });
    routes['/users/me'] = () => ({ status: 401 });
    client.enableSessionBootstrap();

    await expect(client.fetcher('/users/me')).rejects.toMatchObject({ response: { status: 403 } });
    expect(urls()).toEqual(['/auth/refresh-token', '/users/me', '/auth/refresh-token']);

    calls = [];
    await expect(client.fetcher('/users/me')).rejects.toMatchObject({ response: { status: 403 } });
    // No second up-front refresh: the request goes out first.
    expect(urls()).toEqual(['/users/me', '/auth/refresh-token']);
  });
});

describe('401 handling (token expired mid-session)', () => {
  it('refreshes and retries the request once', async () => {
    client.setAccessToken('OLD');
    routes['/auth/refresh-token'] = refreshTo('NEW');
    routes['/users/me'] = requireToken('NEW');

    await client.fetcher('/users/me');

    expect(calls.map((c) => [c.url, c.authorization])).toEqual([
      ['/users/me', 'Bearer OLD'],
      ['/auth/refresh-token', null],
      ['/users/me', 'Bearer NEW'],
    ]);
  });

  it('resends without refreshing when another refresh finished while the request was in flight', async () => {
    client.setAccessToken('OLD');
    routes['/users/me'] = (config) => {
      if (config.headers.get('Authorization') === 'Bearer NEW') return ok();
      client.setAccessToken('NEW'); // a concurrent refresh lands before this 401 comes back
      return { status: 401 };
    };

    await client.fetcher('/users/me');

    expect(calls.map((c) => c.authorization)).toEqual(['Bearer OLD', 'Bearer NEW']);
  });

  it('surfaces the original 401 when the refresh answers without a token', async () => {
    client.setAccessToken('OLD');
    routes['/auth/refresh-token'] = () => ok({ data: {} });
    routes['/users/me'] = () => ({ status: 401 });

    await expect(client.fetcher('/users/me')).rejects.toMatchObject({ response: { status: 401 } });
    expect(client.getAccessToken()).toBeNull();
  });
});

describe('fetcher timeout and retries', () => {
  it('gives reads a timeout that a caller can override', async () => {
    routes['/a'] = () => ok();

    await client.fetcher('/a');
    await client.fetcher(['/a', { timeout: 5_000 }]);

    expect(calls.map((c) => c.timeout)).toEqual([client.READ_TIMEOUT_MS, 5_000]);
  });

  it('retries a 502 and a network drop, then succeeds', async () => {
    vi.useFakeTimers();
    const { AxiosError } = await loadClient();
    const answers: Array<() => ReturnType<Handler>> = [
      () => ({ status: 502 }),
      () => new AxiosError('Network Error', 'ERR_NETWORK'),
      () => ok({ fine: true }),
    ];
    routes['/a'] = () => answers.shift()!();

    const result = client.fetcher('/a');
    await vi.advanceTimersByTimeAsync(client.READ_RETRY_DELAYS_MS[0]);
    await vi.advanceTimersByTimeAsync(client.READ_RETRY_DELAYS_MS[1]);

    await expect(result).resolves.toEqual({ fine: true });
    expect(calls).toHaveLength(3);
  });

  it('retries a timed-out read', async () => {
    vi.useFakeTimers();
    const { AxiosError } = await loadClient();
    let attempt = 0;
    routes['/a'] = () =>
      attempt++ === 0 ? new AxiosError('timeout of 20000ms exceeded', 'ECONNABORTED') : ok();

    const result = client.fetcher('/a');
    await vi.advanceTimersByTimeAsync(client.READ_RETRY_DELAYS_MS[0]);

    await expect(result).resolves.toEqual({});
    expect(calls).toHaveLength(2);
  });

  it('gives up after the last retry', async () => {
    vi.useFakeTimers();
    await loadClient();
    routes['/a'] = () => ({ status: 504 });

    const result = client.fetcher('/a');
    const assertion = expect(result).rejects.toMatchObject({ response: { status: 504 } });
    await vi.advanceTimersByTimeAsync(client.READ_RETRY_DELAYS_MS[0]);
    await vi.advanceTimersByTimeAsync(client.READ_RETRY_DELAYS_MS[1]);

    await assertion;
    expect(calls).toHaveLength(1 + client.READ_RETRY_DELAYS_MS.length);
  });

  it.each([404, 500, 429])(
    'does not retry a %s — that is an answer, not a blip',
    async (status) => {
      routes['/a'] = () => ({ status });

      await expect(client.fetcher('/a')).rejects.toMatchObject({ response: { status } });
      expect(calls).toHaveLength(1);
    },
  );
});
