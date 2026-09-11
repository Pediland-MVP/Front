import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  CHUNK_RELOAD_GUARD_KEY,
  CHUNK_RELOAD_REASON_KEY,
  CHUNK_RELOAD_SCRIPT,
  MAX_RELOADS,
  RELOAD_WINDOW_MS,
  isChunkLoadError,
  reloadForChunkError,
  takeChunkReloadReason,
} from './chunkReload';

const reload = vi.fn();
let uninstall: () => void;

// Runs the exact string the root layout inlines, and tracks its listeners so each test
// (= one page load) starts clean.
function installScript() {
  const added: Array<[string, EventListenerOrEventListenerObject, boolean | undefined]> = [];
  const addEventListener = window.addEventListener.bind(window);
  const spy = vi
    .spyOn(window, 'addEventListener')
    .mockImplementation((type: string, listener: any, options?: any) => {
      added.push([type, listener, options]);
      addEventListener(type, listener, options);
    });
  new Function(CHUNK_RELOAD_SCRIPT)();
  spy.mockRestore();
  return () =>
    added.forEach(([type, listener, options]) =>
      window.removeEventListener(type, listener, options),
    );
}

function failResource(tag: 'script' | 'link', url: string, rel = 'stylesheet') {
  const el = document.createElement(tag);
  if (el instanceof HTMLScriptElement) el.src = url;
  if (el instanceof HTMLLinkElement) {
    el.rel = rel;
    el.href = url;
  }
  document.head.appendChild(el);
  el.dispatchEvent(new Event('error'));
  el.remove();
}

function rejectUnhandled(reason: unknown) {
  const event = new Event('unhandledrejection') as Event & { reason: unknown };
  event.reason = reason;
  window.dispatchEvent(event);
}

beforeEach(() => {
  reload.mockClear();
  sessionStorage.clear();
  Object.defineProperty(window, 'location', {
    configurable: true,
    value: { ...window.location, reload },
  });
  uninstall = installScript();
});

afterEach(() => {
  uninstall();
  delete window.__befChunkReload;
  vi.restoreAllMocks();
});

describe('CHUNK_RELOAD_SCRIPT', () => {
  it('reloads when one of our chunk scripts fails to load (fails before React starts)', () => {
    failResource('script', 'https://my.befroosh.app/_next/static/chunks/ff7f95eeddca4389.js');

    expect(reload).toHaveBeenCalledTimes(1);
    expect(sessionStorage.getItem(CHUNK_RELOAD_REASON_KEY)).toContain('ff7f95eeddca4389.js');
  });

  it('reloads when a chunk stylesheet fails to load', () => {
    failResource('link', 'https://my.befroosh.app/_next/static/chunks/ca798588338c23ec.css');

    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('ignores third-party scripts, fonts and preload hints', () => {
    failResource('script', 'https://www.googletagmanager.com/gtm.js?id=GTM-W86SW8X8');
    failResource('link', 'https://my.befroosh.app/_next/static/media/font.woff2');
    failResource('link', 'https://my.befroosh.app/_next/static/chunks/abc.js', 'preload');

    expect(reload).not.toHaveBeenCalled();
  });

  it('reloads on an unhandled chunk-load rejection (outside React)', () => {
    rejectUnhandled(
      new Error('Failed to load chunk /_next/static/chunks/abc.js from module 457965'),
    );

    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('ignores unrelated rejections and errors', () => {
    rejectUnhandled(new TypeError('Load failed'));
    rejectUnhandled(undefined);
    window.dispatchEvent(new ErrorEvent('error', { message: 'Something else broke' }));

    expect(reload).not.toHaveBeenCalled();
  });

  it('counts a burst of errors from one failure as a single reload', () => {
    failResource('script', 'https://my.befroosh.app/_next/static/chunks/a.js');
    failResource('script', 'https://my.befroosh.app/_next/static/chunks/b.js');

    expect(reload).toHaveBeenCalledTimes(1);
    expect(JSON.parse(sessionStorage.getItem(CHUNK_RELOAD_GUARD_KEY)!).n).toBe(1);
  });

  it(`stops after ${MAX_RELOADS} reloads within the window, so a dead network cannot loop`, () => {
    const results: boolean[] = [];
    for (let load = 0; load <= MAX_RELOADS; load++) {
      // Each reload is a fresh page load running the script again.
      uninstall();
      uninstall = installScript();
      results.push(window.__befChunkReload!('test'));
    }

    expect(results).toEqual([...Array(MAX_RELOADS).fill(true), false]);
    expect(reload).toHaveBeenCalledTimes(MAX_RELOADS);
  });

  it('allows a reload again once the window has passed', () => {
    sessionStorage.setItem(
      CHUNK_RELOAD_GUARD_KEY,
      JSON.stringify({ t: Date.now() - RELOAD_WINDOW_MS - 1, n: MAX_RELOADS }),
    );

    expect(window.__befChunkReload!('test')).toBe(true);
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('never reloads when sessionStorage is unavailable (no loop guard)', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('denied');
    });

    expect(window.__befChunkReload!('test')).toBe(false);
    expect(reload).not.toHaveBeenCalled();
  });
});

describe('isChunkLoadError', () => {
  it.each([
    ['Turbopack', new Error('Failed to load chunk /_next/static/chunks/abc.js from module 1')],
    ['webpack', new Error('Loading chunk 123 failed.')],
    ['webpack css', new Error('Loading CSS chunk 7 failed.')],
    ['Safari', new TypeError('Importing a module script failed.')],
    ['by name', Object.assign(new Error('x'), { name: 'ChunkLoadError' })],
  ])('matches a %s chunk error', (_label, error) => {
    expect(isChunkLoadError(error)).toBe(true);
  });

  it('does not match other errors', () => {
    expect(isChunkLoadError(new TypeError('Load failed'))).toBe(false);
    expect(isChunkLoadError(new Error('Network Error'))).toBe(false);
    expect(isChunkLoadError(null)).toBe(false);
  });
});

describe('reloadForChunkError / takeChunkReloadReason', () => {
  it('returns false when the inline script is missing', () => {
    delete window.__befChunkReload;

    expect(reloadForChunkError('test')).toBe(false);
  });

  it('goes through the inline script guard', () => {
    expect(reloadForChunkError('global-error x')).toBe(true);
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('reads the stored reason once', () => {
    sessionStorage.setItem(CHUNK_RELOAD_REASON_KEY, 'resource /_next/static/chunks/a.js');

    expect(takeChunkReloadReason()).toBe('resource /_next/static/chunks/a.js');
    expect(takeChunkReloadReason()).toBeNull();
  });
});
