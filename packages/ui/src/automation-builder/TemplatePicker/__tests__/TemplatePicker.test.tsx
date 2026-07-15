import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TemplatePicker } from '../TemplatePicker';

// TemplatePicker uses `useMediaQuery`, which calls `matchMedia` — jsdom doesn't
// implement it, so stub a "not mobile" result, same as AutomationBuilder.test.tsx /
// Contents.test.tsx.
beforeAll(() => {
  window.matchMedia =
    window.matchMedia ||
    ((query: string) =>
      ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener: () => {},
        removeEventListener: () => {},
        addListener: () => {},
        removeListener: () => {},
        dispatchEvent: () => false,
      }) as unknown as MediaQueryList);
});

const templates = [
  {
    id: 't1',
    templateTitle: 'خوش‌آمدگویی',
    templateDescription: 'قالب استاندارد',
    templateImage: null,
  },
  { id: 't2', templateTitle: 'فروش محصول', templateDescription: null, templateImage: null },
];

describe('TemplatePicker', () => {
  it('renders each template card and calls onSelect with the right template on click', () => {
    const onSelect = vi.fn();
    render(
      <TemplatePicker
        open
        onOpenChange={vi.fn()}
        templates={templates}
        search=""
        onSearchChange={vi.fn()}
        onSelect={onSelect}
        searchPlaceholder="جستجو"
        emptyLabel="قالبی یافت نشد"
      />,
    );
    fireEvent.click(screen.getByText('فروش محصول'));
    expect(onSelect).toHaveBeenCalledWith(templates[1]);
  });

  it('shows the empty label when the list is empty', () => {
    render(
      <TemplatePicker
        open
        onOpenChange={vi.fn()}
        templates={[]}
        search="xyz"
        onSearchChange={vi.fn()}
        onSelect={vi.fn()}
        searchPlaceholder="جستجو"
        emptyLabel="قالبی یافت نشد"
      />,
    );
    expect(screen.getByText('قالبی یافت نشد')).toBeInTheDocument();
  });

  it('renders footerSlot inside the dialog content, not detached from it', () => {
    render(
      <TemplatePicker
        open
        onOpenChange={vi.fn()}
        templates={templates}
        search=""
        onSearchChange={vi.fn()}
        onSelect={vi.fn()}
        searchPlaceholder="جستجو"
        emptyLabel="قالبی یافت نشد"
        footerSlot={<button type="button">شروع از ابتدا</button>}
      />,
    );
    const footerButton = screen.getByText('شروع از ابتدا');
    const dialogContent = screen.getByRole('dialog');
    expect(dialogContent).toContainElement(footerButton);
  });
});
