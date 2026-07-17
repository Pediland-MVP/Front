import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { FormProvider, useForm } from 'react-hook-form';
import { InstagramPostSelectDialog } from '../InstagramPostSelectDialog';
import { AutomationContentModeEnum } from '../../constants/automationContent.enum';

// InstagramPostSelectDialog renders several `useTranslations(...)` calls. Without a
// `NextIntlClientProvider` this throws "No intl context found" — stub it to echo the
// translation key back, same approach as other automation-builder tests.
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

const POSTS_RESPONSE = {
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
};

function Wrapper({
  apiClient,
  open,
  onOpenChange,
  onSelect,
}: {
  apiClient: { get: ReturnType<typeof vi.fn> };
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSelect?: (post: any) => void;
}) {
  const form = useForm({ defaultValues: { instagramIds: ['ig-1'], instagramPost: null } });
  return (
    <FormProvider {...form}>
      <InstagramPostSelectDialog
        index={0}
        mode={AutomationContentModeEnum.AUTOMATION}
        apiClient={apiClient}
        open={open}
        onOpenChange={onOpenChange}
        onSelect={onSelect}
      />
    </FormProvider>
  );
}

describe('InstagramPostSelectDialog — headless/controlled mode (reused by the Instagram Post button type)', () => {
  it('renders no default thumbnail trigger when onSelect is provided', () => {
    render(
      <Wrapper
        apiClient={{ get: vi.fn() }}
        open={false}
        onOpenChange={vi.fn()}
        onSelect={vi.fn()}
      />,
    );
    expect(screen.queryByText('select_post')).not.toBeInTheDocument();
  });

  it('fetches posts when opened via the controlled `open` prop, and calls onSelect with mediaId/mediaUrl/permalink instead of writing the instagramPost form field', async () => {
    const get = vi.fn().mockResolvedValue(POSTS_RESPONSE);
    const onSelect = vi.fn();
    const onOpenChange = vi.fn();
    render(
      <Wrapper apiClient={{ get }} open={true} onOpenChange={onOpenChange} onSelect={onSelect} />,
    );

    await waitFor(() => expect(get).toHaveBeenCalledWith(expect.stringContaining('/posts/pure')));

    const tile = await waitFor(() => {
      const el = document.body.querySelector('[data-postid="media-1"]');
      expect(el).toBeTruthy();
      return el as HTMLElement;
    });
    fireEvent.click(tile);

    expect(onSelect).toHaveBeenCalledWith({
      mediaId: 'media-1',
      mediaUrl: 'https://img/media-1.jpg',
      permalink: 'https://www.instagram.com/p/media-1/',
    });
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('still uses the default thumbnail trigger and writes to the instagramPost form field when onSelect/open are omitted (پست خاص usage, unchanged)', async () => {
    const get = vi.fn().mockResolvedValue(POSTS_RESPONSE);
    render(<Wrapper apiClient={{ get }} />);

    expect(screen.getByText('select_post')).toBeInTheDocument();
  });
});
