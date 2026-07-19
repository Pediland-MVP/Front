import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AutomationBuilder } from '../AutomationBuilder';
import { AutomationContentTypesEnum } from '../constants/automationContent.enum';
import type { AutomationFormType } from '../schemas/automationForm';
import type { AutomationBuilderFormHelpers } from '../AutomationBuilder.types';

// Conditions/Triggers/Contents/ChooseAutomationType all call `useTranslations(...)`.
// Without a `NextIntlClientProvider` this throws "No intl context found" — stub it to
// echo the key back, same approach as Contents.test.tsx and Conditions.test.tsx.
// `contents: [{ type: TEXT }]` in `validInitialValue` below mounts `TextContent`, which
// additionally calls `t.rich(...)` (next-intl's rich-text variant) — attach a `.rich`
// stub too, echoing the translation key the same way the plain call does.
const translate = (key: string) => key;
translate.rich = (key: string) => key;
vi.mock('next-intl', () => ({
  useTranslations: () => translate,
  useLocale: () => 'fa',
}));

// ChooseAutomationType (rendered inside Contents) uses `useMediaQuery`, which calls
// `matchMedia` — jsdom doesn't implement it, so stub a "not mobile" result, same as
// Contents.test.tsx. Radix's `Switch` (used by Triggers/JustFollowers/TargetPostComment)
// measures itself via `ResizeObserver` on mount, which jsdom also doesn't implement.
beforeAll(() => {
  window.matchMedia =
    window.matchMedia ||
    ((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }));

  (global as any).ResizeObserver =
    (global as any).ResizeObserver ||
    class ResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
});

// Both tests submit a form that must pass `AutomationFormSchema` validation (real
// zodResolver, not stubbed) for `onSubmit`/`beforeSubmit` to be reached — the schema
// requires at least one `instagramIds` entry, at least one `contents` entry, and (when
// present) a non-empty `conditions[].value`. This mirrors how the dashboard's real
// `AutomationForm.tsx` only reaches a valid state once a real automation is loaded via
// `form.reset(...)` (edit mode) or the user has filled the form in (create mode) — here
// we simulate that "already filled in" state via `initialValue`, since the test only
// clicks submit without driving the nested Contents/Conditions UI.
const validInitialValue: Partial<AutomationFormType> = {
  instagramIds: ['3fa85f64-5717-4562-b3fc-2c963f66afa6'],
  conditionType: 'EQUAL',
  conditions: [{ type: 'EQUAL', value: 'test' }],
  contents: [{ type: AutomationContentTypesEnum.TEXT, text: 'hello world' }],
  // `AutomationFormSchema` requires at least one of `isDirect`/`isComment` to be true
  // regardless of mode (`Triggers` is shared by both `automation` and `template`
  // modes) — the component only defaults `isDirect` to `mode === 'automation'`, so
  // `mode="template"` needs an explicit override here.
  isDirect: true,
  isComment: false,
};

describe('AutomationBuilder (shared, mode=template)', () => {
  it('renders headerSlot and calls onSubmit with form values when mode=template', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const { container } = render(
      <AutomationBuilder
        mode="template"
        apiClient={{ upload: vi.fn(), get: vi.fn() }}
        initialValue={validInitialValue}
        onSubmit={onSubmit}
        submitLabel="ذخیره"
        cancelLabel="انصراف"
        headerSlot={<div data-testid="template-fields">title/desc/thumbnail</div>}
      />,
    );
    expect(screen.getByTestId('template-fields')).toBeInTheDocument();

    // Mode-gating: `JustFollowers` (identified by its own `_just-followers` root
    // class — a pre-existing, unique className in the production component, not
    // added for this test) is one of the automation-only sections
    // (JustFollowers/CommentLimitAlert) that `AutomationBuilder`
    // gates behind `mode === 'automation'`. In `mode="template"` it must not be
    // mounted at all (not just visually hidden) — a regression like swapping the
    // `&&` gate for `||`, or dropping it, would render it here.
    expect(container.querySelector('._just-followers')).toBeNull();
    // Meanwhile a shared section (`Contents`, rendered in both modes) must still be
    // present — proving the gate excludes only the automation-only block, not
    // everything after it.
    expect(screen.getByDisplayValue('hello world')).toBeInTheDocument();

    fireEvent.click(screen.getByText('ذخیره'));
    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
  });

  it('does NOT render automation-only sections (JustFollowers/CommentLimitAlert) when mode=template', () => {
    const { container } = render(
      <AutomationBuilder
        mode="template"
        apiClient={{ upload: vi.fn(), get: vi.fn() }}
        initialValue={validInitialValue}
        onSubmit={vi.fn()}
        submitLabel="ذخیره"
        cancelLabel="انصراف"
      />,
    );
    expect(container.querySelector('._just-followers')).toBeNull();
  });

  it('honors beforeSubmit returning false to abort submission (used by dashboard free-quota dialog)', async () => {
    const onSubmit = vi.fn();
    const beforeSubmit = vi.fn().mockResolvedValue(false);
    render(
      <AutomationBuilder
        mode="automation"
        // `get` is required here (unlike the template-mode test above): mode="automation"
        // mounts `JustFollowers`, which unconditionally calls `apiClient.get(...)` via
        // useSWR on mount.
        apiClient={{ upload: vi.fn(), get: vi.fn().mockResolvedValue({ data: {} }) }}
        initialValue={validInitialValue}
        onSubmit={onSubmit}
        beforeSubmit={beforeSubmit}
        submitLabel="ذخیره"
        cancelLabel="انصراف"
      />,
    );
    fireEvent.click(screen.getByText('ذخیره'));
    await waitFor(() => expect(beforeSubmit).toHaveBeenCalled());
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('renders automation-only sections (e.g. JustFollowers) when mode=automation', () => {
    const { container } = render(
      <AutomationBuilder
        mode="automation"
        // `JustFollowers` unconditionally calls `apiClient.get(...)` via useSWR on mount.
        apiClient={{ upload: vi.fn(), get: vi.fn().mockResolvedValue({ data: {} }) }}
        initialValue={validInitialValue}
        onSubmit={vi.fn()}
        submitLabel="ذخیره"
        cancelLabel="انصراف"
      />,
    );
    expect(container.querySelector('._just-followers')).toBeInTheDocument();
  });

  it('calls onInvalid (not onSubmit) when the internal zodResolver rejects the submit', async () => {
    const onSubmit = vi.fn();
    const onInvalid = vi.fn();
    render(
      <AutomationBuilder
        mode="template"
        apiClient={{ upload: vi.fn(), get: vi.fn() }}
        // Deliberately missing `instagramIds`/`contents` — required by
        // `AutomationFormSchema` — so `zodResolver` rejects the submit and
        // `form.handleSubmit`'s "onInvalid" branch (this component's `onInvalid` prop)
        // fires instead of `handleSubmit`/`onSubmit`.
        initialValue={{ isDirect: true, isComment: false }}
        onSubmit={onSubmit}
        onInvalid={onInvalid}
        submitLabel="ذخیره"
        cancelLabel="انصراف"
      />,
    );
    fireEvent.click(screen.getByText('ذخیره'));
    await waitFor(() => expect(onInvalid).toHaveBeenCalled());
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("passes working setError/setFocus form helpers as beforeSubmit's second argument", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    let receivedHelpers: AutomationBuilderFormHelpers | undefined;
    const beforeSubmit = vi.fn(
      (_values: AutomationFormType, formHelpers: AutomationBuilderFormHelpers) => {
        receivedHelpers = formHelpers;
        // Exercise both helpers for real — a thrown error here would fail the test,
        // proving they're bound to the live form instance (not stubs).
        formHelpers.setError('commentStartText', { message: 'required' });
        formHelpers.setFocus('commentStartText');
        return true;
      },
    );
    render(
      <AutomationBuilder
        mode="template"
        apiClient={{ upload: vi.fn(), get: vi.fn() }}
        initialValue={validInitialValue}
        onSubmit={onSubmit}
        beforeSubmit={beforeSubmit}
        submitLabel="ذخیره"
        cancelLabel="انصراف"
      />,
    );
    fireEvent.click(screen.getByText('ذخیره'));
    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    expect(receivedHelpers).toBeDefined();
    expect(typeof receivedHelpers?.setError).toBe('function');
    expect(typeof receivedHelpers?.setFocus).toBe('function');
  });
});
