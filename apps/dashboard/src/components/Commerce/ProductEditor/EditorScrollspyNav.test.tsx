import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type { MutableRefObject } from 'react';

import { EditorScrollspyNav, type EditorSectionId } from './EditorScrollspyNav';

// jsdom doesn't implement `IntersectionObserver` — stub it with a class that records every
// instance + its callback, so tests can fire a synthetic intersection entry the same way the
// mockup's real browser-side observer would call back on scroll.
class MockIntersectionObserver {
  static instances: MockIntersectionObserver[] = [];
  callback: IntersectionObserverCallback;
  observe = vi.fn();
  disconnect = vi.fn();
  unobserve = vi.fn();

  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback;
    MockIntersectionObserver.instances.push(this);
  }
}

const SECTIONS = [
  { id: 'basic' as EditorSectionId, label: 'اطلاعات پایه' },
  { id: 'shipping' as EditorSectionId, label: 'هزینهٔ ارسال' },
];

let basicEl: HTMLDivElement;
let shippingEl: HTMLDivElement;
let sectionRefs: MutableRefObject<Partial<Record<EditorSectionId, HTMLElement | null>>>;

beforeEach(() => {
  MockIntersectionObserver.instances = [];
  vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);

  basicEl = document.createElement('div');
  shippingEl = document.createElement('div');
  basicEl.scrollIntoView = vi.fn();
  shippingEl.scrollIntoView = vi.fn();

  sectionRefs = { current: { basic: basicEl, shipping: shippingEl } };
});

describe('EditorScrollspyNav', () => {
  it('clicking a nav button selects it and scrolls the matching section ref into view', () => {
    const onSelect = vi.fn();
    render(
      <EditorScrollspyNav
        sections={SECTIONS}
        sectionRefs={sectionRefs}
        activeSection="basic"
        onSelect={onSelect}
        isMobile={false}
      />,
    );

    fireEvent.click(screen.getByText('هزینهٔ ارسال'));

    expect(onSelect).toHaveBeenCalledWith('shipping');
    expect(shippingEl.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' });
    expect(basicEl.scrollIntoView).not.toHaveBeenCalled();
  });

  it('re-highlights whichever section the (mocked) IntersectionObserver reports as intersecting', () => {
    const onSelect = vi.fn();
    const { rerender } = render(
      <EditorScrollspyNav
        sections={SECTIONS}
        sectionRefs={sectionRefs}
        activeSection="basic"
        onSelect={onSelect}
        isMobile={false}
      />,
    );

    expect(screen.getByText('اطلاعات پایه')).toHaveAttribute('data-active', 'true');
    expect(screen.getByText('هزینهٔ ارسال')).toHaveAttribute('data-active', 'false');

    const [observerInstance] = MockIntersectionObserver.instances;
    expect(observerInstance).toBeDefined();

    // Simulate the browser scrolling the "shipping" section into view.
    observerInstance.callback(
      [{ isIntersecting: true, target: shippingEl } as unknown as IntersectionObserverEntry],
      observerInstance as unknown as IntersectionObserver,
    );

    expect(onSelect).toHaveBeenCalledWith('shipping');

    // `onSelect` only updates the parent's state — re-render with the new `activeSection` to
    // observe the resulting active-class/attribute change, same as `ProductEditorPage` would.
    rerender(
      <EditorScrollspyNav
        sections={SECTIONS}
        sectionRefs={sectionRefs}
        activeSection="shipping"
        onSelect={onSelect}
        isMobile={false}
      />,
    );

    expect(screen.getByText('هزینهٔ ارسال')).toHaveAttribute('data-active', 'true');
    expect(screen.getByText('اطلاعات پایه')).toHaveAttribute('data-active', 'false');
  });

  it('does not attach an IntersectionObserver on mobile (single-section tab bar, nothing to scrollspy)', () => {
    render(
      <EditorScrollspyNav
        sections={SECTIONS}
        sectionRefs={sectionRefs}
        activeSection="basic"
        onSelect={vi.fn()}
        isMobile={true}
      />,
    );

    expect(MockIntersectionObserver.instances).toHaveLength(0);
  });
});
