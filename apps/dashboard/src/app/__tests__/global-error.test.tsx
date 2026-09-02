import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import * as Sentry from '@sentry/nextjs';
import GlobalError from '../global-error';

vi.mock('@sentry/nextjs', () => ({
  captureException: vi.fn(),
}));

const reload = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  sessionStorage.clear();
  Object.defineProperty(window, 'location', {
    configurable: true,
    value: { ...window.location, reload },
  });
});

describe('GlobalError', () => {
  it('reloads once on a chunk load error and tags it in Sentry', () => {
    const error = Object.assign(
      new Error('Failed to load chunk /_next/static/chunks/abc.js from module 1'),
      {
        name: 'ChunkLoadError',
      },
    );

    render(<GlobalError error={error} />);

    expect(reload).toHaveBeenCalledTimes(1);
    expect(Sentry.captureException).toHaveBeenCalledWith(error, {
      tags: { chunkLoadAutoReload: true },
    });
  });

  it('does not reload again for a second chunk load error within the guard window', () => {
    sessionStorage.setItem('chunkLoadErrorReloadAt', String(Date.now()));
    const error = Object.assign(
      new Error('Failed to load chunk /_next/static/chunks/abc.js from module 1'),
      {
        name: 'ChunkLoadError',
      },
    );

    render(<GlobalError error={error} />);

    expect(reload).not.toHaveBeenCalled();
    expect(Sentry.captureException).toHaveBeenCalledWith(error, {
      tags: { chunkLoadAutoReload: false },
    });
  });

  it('does not reload for a non-chunk-load error', () => {
    const error = new Error('Something else broke');

    render(<GlobalError error={error} />);

    expect(reload).not.toHaveBeenCalled();
    expect(Sentry.captureException).toHaveBeenCalledWith(error, {
      tags: { chunkLoadAutoReload: false },
    });
  });
});
