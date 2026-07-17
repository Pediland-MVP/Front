import * as React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AutoResizeTextarea } from '../AutoResizeTextarea';

// jsdom does no layout: scrollHeight is always 0 and getComputedStyle resolves no
// lineHeight. Both are stubbed so the clamp arithmetic is actually exercised.
const LINE_HEIGHT = 20;
const PADDING = 8;
const BORDER = 1;
const CHROME = PADDING * 2 + BORDER * 2; // 18

// minRows=4  -> 4  * 20 + 18 =  98
// maxRows=12 -> 12 * 20 + 18 = 258
const MIN_HEIGHT = 98;
const MAX_HEIGHT = 258;

let fakeScrollHeight = 0;
let originalScrollHeight: PropertyDescriptor | undefined;

beforeEach(() => {
  originalScrollHeight = Object.getOwnPropertyDescriptor(
    HTMLTextAreaElement.prototype,
    'scrollHeight',
  );
  Object.defineProperty(HTMLTextAreaElement.prototype, 'scrollHeight', {
    configurable: true,
    get: () => fakeScrollHeight,
  });

  const realGetComputedStyle = window.getComputedStyle.bind(window);
  vi.spyOn(window, 'getComputedStyle').mockImplementation((el, pseudo) => {
    if ((el as HTMLElement).tagName === 'TEXTAREA') {
      return {
        lineHeight: `${LINE_HEIGHT}px`,
        fontSize: '16px',
        paddingTop: `${PADDING}px`,
        paddingBottom: `${PADDING}px`,
        borderTopWidth: `${BORDER}px`,
        borderBottomWidth: `${BORDER}px`,
      } as unknown as CSSStyleDeclaration;
    }
    return realGetComputedStyle(el as Element, pseudo);
  });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  if (originalScrollHeight) {
    Object.defineProperty(HTMLTextAreaElement.prototype, 'scrollHeight', originalScrollHeight);
  } else {
    delete (HTMLTextAreaElement.prototype as unknown as Record<string, unknown>).scrollHeight;
  }
  fakeScrollHeight = 0;
});

describe('AutoResizeTextarea', () => {
  it('renders at the 4-row floor when empty, even though the content is one line tall', () => {
    fakeScrollHeight = LINE_HEIGHT + PADDING * 2; // 36 — a single empty line
    render(<AutoResizeTextarea value="" onChange={() => {}} />);

    const el = screen.getByRole('textbox');
    expect(el.style.height).toBe(`${MIN_HEIGHT}px`);
    expect(el.style.overflowY).toBe('hidden');
  });

  it('grows to fit content between the floor and the cap', () => {
    fakeScrollHeight = 150;
    render(<AutoResizeTextarea value="several lines" onChange={() => {}} />);

    const el = screen.getByRole('textbox');
    expect(el.style.height).toBe(`${150 + BORDER * 2}px`);
    expect(el.style.overflowY).toBe('hidden');
  });

  it('stops at the 12-row cap and scrolls internally past it', () => {
    fakeScrollHeight = 400;
    render(<AutoResizeTextarea value="a very long message" onChange={() => {}} />);

    const el = screen.getByRole('textbox');
    expect(el.style.height).toBe(`${MAX_HEIGHT}px`);
    expect(el.style.overflowY).toBe('auto');
  });

  it('resizes when value is replaced externally (react-hook-form reset / edit-load)', () => {
    fakeScrollHeight = 36;
    const { rerender } = render(<AutoResizeTextarea value="" onChange={() => {}} />);
    expect(screen.getByRole('textbox').style.height).toBe(`${MIN_HEIGHT}px`);

    fakeScrollHeight = 200;
    rerender(<AutoResizeTextarea value="a long saved message" onChange={() => {}} />);

    expect(screen.getByRole('textbox').style.height).toBe(`${200 + BORDER * 2}px`);
  });

  it('honours explicit minRows/maxRows overrides', () => {
    fakeScrollHeight = 1000;
    render(<AutoResizeTextarea value="x" onChange={() => {}} minRows={2} maxRows={3} />);

    expect(screen.getByRole('textbox').style.height).toBe(`${3 * LINE_HEIGHT + CHROME}px`);
  });

  it('forwards its ref to the underlying textarea so RHF keeps focus-on-error', () => {
    const ref = React.createRef<HTMLTextAreaElement>();
    render(<AutoResizeTextarea ref={ref} value="" onChange={() => {}} />);

    expect(ref.current).toBeInstanceOf(HTMLTextAreaElement);
    expect(ref.current).toBe(screen.getByRole('textbox'));
  });

  it('passes through native textarea props', () => {
    render(<AutoResizeTextarea value="" onChange={() => {}} maxLength={640} placeholder="سلام" />);

    const el = screen.getByPlaceholderText('سلام');
    expect(el).toHaveAttribute('maxLength', '640');
  });
});
