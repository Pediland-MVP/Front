import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { FormProvider, useForm } from 'react-hook-form';
import { ButtonContentItem } from '../ContentButtonsItem';
import { ContentsContext } from '../ContentsContext';
import { AutomationContentModeEnum } from '../../constants/automationContent.enum';
import { toast } from 'sonner';

// ButtonContentItem renders several `useTranslations(...)` calls. Without a
// `NextIntlClientProvider` this throws "No intl context found" — stub it to echo the
// translation key back, same approach as other automation-builder tests.
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock('sonner', () => ({
  toast: { error: vi.fn() },
}));

beforeAll(() => {
  // Radix Select relies on PointerEvent capture + scrollIntoView, neither implemented by
  // jsdom — same category of gap Contents.test.tsx already patches for matchMedia.
  Element.prototype.hasPointerCapture = Element.prototype.hasPointerCapture || (() => false);
  Element.prototype.scrollIntoView = Element.prototype.scrollIntoView || (() => {});
});

function Wrapper({
  builderMode = 'automation',
  instagramIds = ['ig-1'],
  apiClient,
}: {
  builderMode?: 'automation' | 'template';
  instagramIds?: string[];
  apiClient?: { get: ReturnType<typeof vi.fn>; upload: ReturnType<typeof vi.fn> };
}) {
  const form = useForm({
    defaultValues: {
      instagramIds,
      contents: [{ buttonTemplate: { text: '', buttons: [{}] } }],
    },
  });
  return (
    <FormProvider {...form}>
      <ContentsContext.Provider
        value={{
          builderMode,
          contents: [],
          updateContents: vi.fn(),
          removeContents: vi.fn(),
        }}
      >
        <ButtonContentItem
          id="btn-1"
          index={0}
          contentIndex={0}
          remove={vi.fn()}
          mode={AutomationContentModeEnum.AUTOMATION}
          contentType="buttonTemplate"
          control={form.control}
          apiClient={apiClient ?? { get: vi.fn(), upload: vi.fn() }}
        />
      </ContentsContext.Provider>
    </FormProvider>
  );
}

const openTypeDropdown = () => fireEvent.click(screen.getByRole('combobox'));

describe('ButtonContentItem — "Instagram Post" button type', () => {
  it('offers "Instagram Post" as a type option in automation builder mode', () => {
    render(<Wrapper builderMode="automation" />);
    openTypeDropdown();
    expect(screen.getByText('instagram_post.label')).toBeInTheDocument();
  });

  it('hides "Instagram Post" in template builder mode (no fixed Instagram account to fetch posts from)', () => {
    render(<Wrapper builderMode="template" />);
    openTypeDropdown();
    expect(screen.queryByText('instagram_post.label')).not.toBeInTheDocument();
  });

  it('shows a guard toast and does not open the post picker when the automation targets more than one Instagram account', () => {
    render(<Wrapper instagramIds={['ig-1', 'ig-2']} />);
    openTypeDropdown();
    fireEvent.click(screen.getByText('instagram_post.label'));

    fireEvent.click(screen.getByRole('button', { name: 'select_post' }));

    expect(toast.error).toHaveBeenCalledWith('specific_post_requires_single_instagram');
    expect(screen.queryByText('select_instagram_post')).not.toBeInTheDocument();
  });

  it('opens the post picker with exactly one Instagram account and fills the url field with the picked post permalink', async () => {
    const get = vi.fn().mockResolvedValue({
      data: {
        media: {
          data: [
            {
              id: 'media-1',
              media_type: 'IMAGE',
              media_url: 'https://img/media-1.jpg',
              permalink: 'https://www.instagram.com/p/media-1/',
            },
          ],
          paging: { cursors: { after: null } },
        },
      },
    });
    render(<Wrapper instagramIds={['ig-1']} apiClient={{ get, upload: vi.fn() }} />);
    openTypeDropdown();
    fireEvent.click(screen.getByText('instagram_post.label'));

    fireEvent.click(screen.getByRole('button', { name: 'select_post' }));
    expect(screen.getByText('select_instagram_post')).toBeInTheDocument();

    await waitFor(() => expect(get).toHaveBeenCalledWith(expect.stringContaining('/posts/pure')));

    // Radix Dialog content renders in a portal attached to `document.body`, not inside the
    // container `render()` returns — query via `document.body`, not `container`.
    const tile = await waitFor(() => {
      const el = document.body.querySelector('[data-postid="media-1"]');
      expect(el).toBeTruthy();
      return el as HTMLElement;
    });
    fireEvent.click(tile);

    // The title field and the url field both resolve to the same
    // `instagram_post.placeholder` translation key (by design — see
    // ContentButtonsItem.tsx), so two inputs share this placeholder text; pick the
    // url one (`type="url"`) specifically.
    const urlInput = await waitFor(() => {
      const inputs = screen
        .getAllByPlaceholderText('instagram_post.placeholder')
        .filter((el) => el.getAttribute('type') === 'url');
      expect(inputs).toHaveLength(1);
      return inputs[0];
    });
    expect(urlInput).toHaveValue('https://www.instagram.com/p/media-1/');
  });

  it('switching the type back to plain URL after picking Instagram Post preserves the underlying `url` postbackPayloadType and clears the post-picker UI', () => {
    render(<Wrapper builderMode="automation" />);

    // Select "Instagram Post" first.
    openTypeDropdown();
    fireEvent.click(screen.getByText('instagram_post.label'));

    // The post-picker icon button is present while "Instagram Post" is selected.
    expect(screen.getByRole('button', { name: 'select_post' })).toBeInTheDocument();

    // Switch back to plain "URL".
    openTypeDropdown();
    fireEvent.click(screen.getByText('url.label'));

    // postbackPayloadType stays 'url' the whole time (both types share the same
    // underlying value), and the UI now reflects the plain URL type: no post-picker
    // button, and the URL input shows the plain URL placeholder.
    expect(screen.queryByRole('button', { name: 'select_post' })).not.toBeInTheDocument();
    const urlInputs = screen
      .getAllByPlaceholderText('url.placeholder')
      .filter((el) => el.getAttribute('type') === 'url');
    expect(urlInputs).toHaveLength(1);

    // Switch forward to "Instagram Post" again — the picker button should reappear,
    // confirming the toggle round-trips cleanly without corrupting state.
    openTypeDropdown();
    fireEvent.click(screen.getByText('instagram_post.label'));
    expect(screen.getByRole('button', { name: 'select_post' })).toBeInTheDocument();
  });
});

describe('ButtonContentItem — locked CONSENT quick reply (cannot be removed while a content follows it)', () => {
  function TextWrapper({
    contents,
    removeMock,
  }: {
    contents: any[];
    removeMock: ReturnType<typeof vi.fn>;
  }) {
    const form = useForm({ defaultValues: { contents } });
    return (
      <FormProvider {...form}>
        <ContentsContext.Provider
          value={{
            builderMode: 'automation',
            contents: [],
            updateContents: vi.fn(),
            removeContents: vi.fn(),
          }}
        >
          <ButtonContentItem
            id="qr-1"
            index={0}
            contentIndex={0}
            remove={removeMock}
            mode={AutomationContentModeEnum.AUTOMATION}
            contentType="text"
            control={form.control}
            apiClient={{ get: vi.fn(), upload: vi.fn() }}
          />
        </ContentsContext.Provider>
      </FormProvider>
    );
  }

  it('shows the locked-explanation dialog instead of removing a CONSENT quick reply while another quick reply on the same content still needs protecting', () => {
    const removeMock = vi.fn();
    render(
      <TextWrapper
        removeMock={removeMock}
        contents={[
          {
            type: 'text',
            quickReplies: [
              { title: 'مکث و ادامه', postbackPayloadType: 'CONSENT' },
              { title: 'اجرای یک پیام خودکار', postbackPayloadType: 'startAutomation' },
            ],
          },
          { type: 'text' },
        ]}
      />,
    );

    fireEvent.click(screen.getByRole('button'));

    expect(removeMock).not.toHaveBeenCalled();
    expect(screen.getByText('consent_locked_description')).toBeInTheDocument();

    fireEvent.click(screen.getByText('consent_locked_close'));
    expect(screen.queryByText('consent_locked_description')).not.toBeInTheDocument();
  });

  // BEF-142: the auto-insert effect in `Contents.tsx` adds the CONSENT button because the
  // content had OTHER quick replies. Deleting every one of those left the user holding a
  // lone CONSENT button that the lock refused to remove — the only escape was deleting the
  // following content, deleting the CONSENT, then re-adding the content.
  it('removes a CONSENT quick reply when it is the only quick reply left, even though another content follows it', () => {
    const removeMock = vi.fn();
    render(
      <TextWrapper
        removeMock={removeMock}
        contents={[
          {
            type: 'text',
            quickReplies: [{ title: 'مکث و ادامه', postbackPayloadType: 'CONSENT' }],
          },
          { type: 'text' },
        ]}
      />,
    );

    fireEvent.click(screen.getByRole('button'));

    expect(removeMock).toHaveBeenCalledWith(0);
    expect(screen.queryByText('consent_locked_description')).not.toBeInTheDocument();
  });

  // A freshly-added quick reply row has no `postbackPayloadType` until the user picks one
  // from the dropdown. It is still a real quick reply that Instagram would hide, so the
  // CONSENT button must stay locked — "nothing left to protect" means an EMPTY list, not
  // "no typed buttons".
  it('keeps the CONSENT quick reply locked when the only other quick reply has no type picked yet', () => {
    const removeMock = vi.fn();
    render(
      <TextWrapper
        removeMock={removeMock}
        contents={[
          {
            type: 'text',
            quickReplies: [{ title: 'مکث و ادامه', postbackPayloadType: 'CONSENT' }, { title: '' }],
          },
          { type: 'text' },
        ]}
      />,
    );

    fireEvent.click(screen.getByRole('button'));

    expect(removeMock).not.toHaveBeenCalled();
    expect(screen.getByText('consent_locked_description')).toBeInTheDocument();
  });

  it('removes a CONSENT quick reply normally when it is the last content (nothing follows it)', () => {
    const removeMock = vi.fn();
    render(
      <TextWrapper
        removeMock={removeMock}
        contents={[
          {
            type: 'text',
            quickReplies: [{ title: 'مکث و ادامه', postbackPayloadType: 'CONSENT' }],
          },
        ]}
      />,
    );

    fireEvent.click(screen.getByRole('button'));

    expect(removeMock).toHaveBeenCalledWith(0);
    expect(screen.queryByText('consent_locked_description')).not.toBeInTheDocument();
  });

  it('removes a non-CONSENT quick reply normally even when another content follows it', () => {
    const removeMock = vi.fn();
    render(
      <TextWrapper
        removeMock={removeMock}
        contents={[
          {
            type: 'text',
            quickReplies: [{ title: 'x', postbackPayloadType: 'TEXT' }],
          },
          { type: 'text' },
        ]}
      />,
    );

    fireEvent.click(screen.getByRole('button'));

    expect(removeMock).toHaveBeenCalledWith(0);
    expect(screen.queryByText('consent_locked_description')).not.toBeInTheDocument();
  });
});
