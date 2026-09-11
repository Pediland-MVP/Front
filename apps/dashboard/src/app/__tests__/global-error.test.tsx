import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import * as Sentry from '@sentry/nextjs';
import GlobalError from '../global-error';

vi.mock('@sentry/nextjs', () => ({
  captureException: vi.fn(),
}));

const chunkLoadError = () =>
  Object.assign(new Error('Failed to load chunk /_next/static/chunks/abc.js from module 1'), {
    name: 'ChunkLoadError',
  });

beforeEach(() => {
  vi.clearAllMocks();
  delete window.__befChunkReload;
});

describe('GlobalError', () => {
  it('asks the inline script to reload on a chunk load error and tags it in Sentry', () => {
    const reload = vi.fn(() => true);
    window.__befChunkReload = reload;
    const error = chunkLoadError();

    render(<GlobalError error={error} />);

    expect(reload).toHaveBeenCalledTimes(1);
    expect(reload).toHaveBeenCalledWith(expect.stringContaining('Failed to load chunk'));
    expect(Sentry.captureException).toHaveBeenCalledWith(error, {
      tags: { chunkLoadAutoReload: true },
    });
  });

  it('still reports when the loop guard refuses another reload', () => {
    window.__befChunkReload = vi.fn(() => false);
    const error = chunkLoadError();

    render(<GlobalError error={error} />);

    expect(Sentry.captureException).toHaveBeenCalledWith(error, {
      tags: { chunkLoadAutoReload: false },
    });
  });

  it('does not reload for a non-chunk-load error', () => {
    const reload = vi.fn(() => true);
    window.__befChunkReload = reload;
    const error = new Error('Something else broke');

    render(<GlobalError error={error} />);

    expect(reload).not.toHaveBeenCalled();
    expect(Sentry.captureException).toHaveBeenCalledWith(error, {
      tags: { chunkLoadAutoReload: false },
    });
  });

  it('does not throw when the inline script never ran', () => {
    const error = chunkLoadError();

    render(<GlobalError error={error} />);

    expect(Sentry.captureException).toHaveBeenCalledWith(error, {
      tags: { chunkLoadAutoReload: false },
    });
  });
});
