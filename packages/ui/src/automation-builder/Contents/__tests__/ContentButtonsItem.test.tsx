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
});
