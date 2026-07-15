import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import messages from '@/messages/fa.json';

vi.mock('@/hooks/swr/api-client', () => ({
  default: {
    post: vi.fn().mockResolvedValue({ data: { data: { id: 't1' } } }),
    patch: vi.fn().mockResolvedValue({ data: { data: { id: 't1' } } }),
    get: vi.fn().mockResolvedValue({ data: {} }),
  },
  fetcher: vi.fn(),
}));
// Controllable (like `swr/immutable` below) rather than a fixed factory value, so the
// edit-mode race test can simulate `/workspace-categories` resolving AFTER the template —
// the two fetches are independent and can resolve in either order (see TemplateForm.tsx).
const { useSWRMock } = vi.hoisted(() => ({ useSWRMock: vi.fn() }));
vi.mock('swr', () => ({
  default: useSWRMock,
}));

// `swr/immutable` backs both the create-mode (`data: undefined`) and edit-mode (a real
// `GET /templates/:id`-shaped `data`) fixtures used across these tests — a plain factory
// object can only ever return one fixed value for the whole file, so a controllable mock
// function (reset per test in `beforeEach`) is used instead, same technique as the
// dashboard's own `AutomationForm.test.tsx` uses for `swr/immutable`.
const { useSWRImmutableMock } = vi.hoisted(() => ({ useSWRImmutableMock: vi.fn() }));
vi.mock('swr/immutable', () => ({
  default: useSWRImmutableMock,
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

// ChooseAutomationType (rendered inside the shared Contents section) uses `useMediaQuery`,
// which calls `matchMedia` — jsdom doesn't implement it. Radix's `Switch` (Triggers/
// TargetPostComment, and this form's own "applies to all categories" toggle) measures
// itself via `ResizeObserver` on mount, which jsdom also doesn't implement. Same stubs
// `packages/ui`'s own `AutomationBuilder.test.tsx` and the dashboard's `AutomationForm.test.tsx` use.
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

  (global as any).ResizeObserver =
    (global as any).ResizeObserver ||
    class ResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
});

beforeEach(() => {
  // Default (create-mode): no template loaded yet.
  useSWRImmutableMock.mockReturnValue({ data: undefined, isLoading: false, error: undefined });
  // Default: categories already loaded — matches every existing test's expectations. Tests
  // that specifically need to simulate the categories-not-loaded-yet race override this.
  useSWRMock.mockReturnValue({
    data: { items: [{ id: 'c1', nameFa: 'فروشگاهی' }] },
    isLoading: false,
  });
});

import TemplateForm from '../TemplateForm';

// Adds a TEXT content item to the (currently empty) `contents` array via the real
// ChooseAutomationType picker UI — TEXT is the first option in the picker, matching
// `packages/ui/src/automation-builder/Contents/ContentTypeOptions.tsx`'s ordering — then
// fills its textarea. After the headerSlot's `templateDescription` textarea, the newly
// added content's own textarea is the next (and, with a single content, last) `<textarea>`
// in the document — `Contents`/`TextContent` don't expose a stable test id, so this reads
// the DOM directly rather than relying on `getByRole('textbox')` (which would also match
// the `templateTitle` `<input>`).
const addTextContent = (text: string) => {
  fireEvent.click(screen.getByText('افزودن محتوای دیگر'));
  fireEvent.click(screen.getByText('پیام متنی'));
  const textareas = document.querySelectorAll('textarea');
  fireEvent.change(textareas[textareas.length - 1], { target: { value: text } });
};

describe('TemplateForm (admin create)', () => {
  it('hides the category multi-select when "applies to all categories" is toggled on', () => {
    render(
      <NextIntlClientProvider locale="fa" messages={messages}>
        <TemplateForm />
      </NextIntlClientProvider>,
    );
    fireEvent.click(screen.getByRole('switch', { name: 'اعمال روی همه دسته‌بندی‌ها' }));
    expect(screen.queryByPlaceholderText('انتخاب دسته‌بندی')).not.toBeInTheDocument();
  });

  it('blocks save and shows field errors when templateTitle/templateDescription are blank, even with valid content (Fix 2)', async () => {
    render(
      <NextIntlClientProvider locale="fa" messages={messages}>
        <TemplateForm />
      </NextIntlClientProvider>,
    );
    const api = (await import('@/hooks/swr/api-client')).default as any;
    addTextContent('سلام خوش آمدید');

    fireEvent.click(screen.getByText('ذخیره'));

    await waitFor(() => {
      expect(screen.getByText(messages.Templates.templateTitleRequired)).toBeInTheDocument();
      expect(screen.getByText(messages.Templates.templateDescriptionRequired)).toBeInTheDocument();
    });
    expect(api.post).not.toHaveBeenCalled();
  });

  it('cannot save a contentless template (Fix 1): only submits once real content has been authored', async () => {
    const api = (await import('@/hooks/swr/api-client')).default as any;
    render(
      <NextIntlClientProvider locale="fa" messages={messages}>
        <TemplateForm />
      </NextIntlClientProvider>,
    );
    fireEvent.change(screen.getByLabelText('عنوان'), { target: { value: 'خوش‌آمدگویی' } });
    fireEvent.change(screen.getByLabelText('توضیحات'), {
      target: { value: 'توضیحات قالب خوش‌آمدگویی' },
    });

    // A title-only save must NOT reach the backend — `contents` is still empty, so the
    // shared `AutomationFormSchema`'s `contents.min(1)` blocks the submit (`onInvalid`
    // fires instead of `onSubmit`/`onSubmitTemplate`).
    fireEvent.click(screen.getByText('ذخیره'));
    await waitFor(() => expect(api.post).not.toHaveBeenCalled());

    // Only after authoring real content does the save actually go through.
    addTextContent('سلام خوش آمدید');
    fireEvent.click(screen.getByText('ذخیره'));

    await waitFor(() =>
      expect(api.post).toHaveBeenCalledWith(
        '/templates',
        expect.objectContaining({
          templateTitle: 'خوش‌آمدگویی',
          templateDescription: 'توضیحات قالب خوش‌آمدگویی',
          contents: expect.arrayContaining([
            expect.objectContaining({ type: 'text', text: 'سلام خوش آمدید' }),
          ]),
        }),
      ),
    );
  });
});

describe('TemplateForm (admin edit)', () => {
  const mockTemplate = {
    id: 't1',
    templateTitle: 'قالب خوش‌آمدگویی',
    templateDescription: 'توضیحات قالب خوش‌آمدگویی',
    templateAppliesToAllCategories: false,
    categoryIds: ['c1'],
    isDirect: true,
    isComment: false,
    isNoCondition: true,
    justFollowers: false,
    conditions: [],
    templateImage: {
      id: 5,
      url: 'https://cdn.example.com/template-thumb.png',
      name: 'thumb.png',
      mimeType: 'image/png',
    },
    contents: [
      {
        id: 'content-1',
        step: 0,
        type: 'text',
        text: 'سلام! به فروشگاه ما خوش آمدید',
        haveConsent: false,
        quickReplies: [],
        buttonTemplate: null,
        file: null,
        vitrins: [],
      },
      {
        id: 'content-2',
        step: 1,
        type: 'button_template',
        text: null,
        haveConsent: false,
        quickReplies: [],
        file: null,
        vitrins: [],
        buttonTemplate: {
          id: 'bt-1',
          text: 'دکمه‌ها',
          buttons: [
            {
              id: 'btn-1',
              title: 'مشاهده سایت',
              type: 'web_url',
              postbackPayloadType: 'url',
              url: 'https://befroosh.app',
              priority: 1,
            },
          ],
        },
      },
    ],
  };

  beforeEach(() => {
    useSWRImmutableMock.mockReturnValue({
      data: mockTemplate,
      isLoading: false,
      error: undefined,
    });
  });

  it('prefills templateTitle/templateDescription from the loaded template (metaForm.reset ran)', async () => {
    render(
      <NextIntlClientProvider locale="fa" messages={messages}>
        <TemplateForm id="t1" />
      </NextIntlClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByLabelText('عنوان')).toHaveValue(mockTemplate.templateTitle);
      expect(screen.getByLabelText('توضیحات')).toHaveValue(mockTemplate.templateDescription);
    });
  });

  it('saves edits via PATCH /templates/:id with the loaded + edited payload', async () => {
    const api = (await import('@/hooks/swr/api-client')).default as any;
    render(
      <NextIntlClientProvider locale="fa" messages={messages}>
        <TemplateForm id="t1" />
      </NextIntlClientProvider>,
    );

    await waitFor(() =>
      expect(screen.getByLabelText('عنوان')).toHaveValue(mockTemplate.templateTitle),
    );

    fireEvent.click(screen.getByText('ذخیره'));

    await waitFor(() =>
      expect(api.patch).toHaveBeenCalledWith(
        '/templates/t1',
        expect.objectContaining({
          templateTitle: mockTemplate.templateTitle,
          templateDescription: mockTemplate.templateDescription,
          categoryIds: ['c1'],
        }),
      ),
    );
  });

  it('does not clobber an in-progress templateTitle edit when categories resolve late (the race from the review)', async () => {
    // Simulate `template` resolving BEFORE `/workspace-categories` — the two fetches are
    // independent (`useSWRImmutable('/templates/:id')` vs `useSWR('/workspace-categories...')`)
    // and can resolve in either order. With categories not loaded yet, the category label
    // falls back to the raw id (`transformTemplateToFormValues`'s fallback).
    useSWRMock.mockReturnValue({ data: undefined, isLoading: true });

    const { rerender } = render(
      <NextIntlClientProvider locale="fa" messages={messages}>
        <TemplateForm id="t1" />
      </NextIntlClientProvider>,
    );

    // Full prefill (effect 1) has run: templateTitle is populated, and the category badge
    // shows the raw id fallback ("c1") since categories haven't loaded yet.
    await waitFor(() =>
      expect(screen.getByLabelText('عنوان')).toHaveValue(mockTemplate.templateTitle),
    );
    expect(screen.getByText('c1')).toBeInTheDocument();

    // The admin starts editing the title before categories have resolved.
    const editedTitle = 'عنوان ویرایش شده توسط ادمین';
    fireEvent.change(screen.getByLabelText('عنوان'), { target: { value: editedTitle } });
    expect(screen.getByLabelText('عنوان')).toHaveValue(editedTitle);

    // `/workspace-categories` now resolves. Re-render with the same props so the mocked
    // `useSWR` is re-invoked and picks up the new (resolved) return value — this is the
    // same "hook value changed" transition a real SWR revalidation causes.
    useSWRMock.mockReturnValue({
      data: { items: [{ id: 'c1', nameFa: 'فروشگاهی' }] },
      isLoading: false,
    });
    rerender(
      <NextIntlClientProvider locale="fa" messages={messages}>
        <TemplateForm id="t1" />
      </NextIntlClientProvider>,
    );

    // The label backfill (effect 2) should swap the category badge's raw-id fallback for the
    // real `nameFa` label...
    await waitFor(() => expect(screen.getByText('فروشگاهی')).toBeInTheDocument());
    expect(screen.queryByText('c1')).not.toBeInTheDocument();

    // ...WITHOUT reverting the admin's in-progress title edit back to the loaded template's
    // original title (the bug: a second full `metaForm.reset(meta)` used to clobber this).
    expect(screen.getByLabelText('عنوان')).toHaveValue(editedTitle);
    expect(screen.getByLabelText('توضیحات')).toHaveValue(mockTemplate.templateDescription);
  });
});
