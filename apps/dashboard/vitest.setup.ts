import '@testing-library/jest-dom/vitest';

/**
 * jsdom ships no ResizeObserver, and Radix measures with it (`@radix-ui/react-use-size`, reached
 * through Switch's thumb among others). Without this, rendering a page that contains one throws
 * `ResizeObserver is not defined` before a single assertion runs.
 *
 * A no-op is the right stub: the tests here assert markup and behaviour, never layout, and jsdom
 * reports zero-size boxes anyway, so a real implementation would have nothing to observe.
 */
if (!('ResizeObserver' in globalThis)) {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
}
