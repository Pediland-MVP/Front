import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { FormProvider, useForm } from 'react-hook-form';
import { MediaContent } from '../MediaContent';
import { ContentsUploaderContextProvider } from '../ContentsUploaderContext';
import {
  AutomationContentModeEnum,
  AutomationContentTypesEnum,
} from '../../constants/automationContent.enum';

// MediaContent/MediaUploader render several `useTranslations(...)` calls. Without a
// `NextIntlClientProvider` this throws "No intl context found", so stub the hook to just
// echo the translation key back.
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

function Wrapper() {
  const form = useForm({
    defaultValues: { contents: [{ type: AutomationContentTypesEnum.IMAGE }] },
  });
  const apiClient = {
    upload: vi.fn().mockResolvedValue({ id: 1, url: 'http://x/y.png', mimeType: 'image/png' }),
  };
  return (
    <FormProvider {...form}>
      <ContentsUploaderContextProvider defaultValue={null}>
        <MediaContent
          index={0}
          mode={AutomationContentModeEnum.AUTOMATION}
          type={AutomationContentTypesEnum.IMAGE}
          appendContents={vi.fn()}
          content={{ type: AutomationContentTypesEnum.IMAGE } as any}
          apiClient={apiClient}
        />
      </ContentsUploaderContextProvider>
    </FormProvider>
  );
}

describe('MediaContent (shared)', () => {
  it('renders without throwing when an apiClient prop is provided', () => {
    render(<Wrapper />);
    expect(document.body).toBeTruthy();
  });
});
