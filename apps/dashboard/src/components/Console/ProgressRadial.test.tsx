import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProgressRadial } from './ProgressRadial';

vi.mock('next-intl', () => ({
  useLocale: () => 'fa',
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      credit: 'اعـتـبـار',
      days: 'روز',
      day: 'روز',
      message: 'پیام',
      automation: 'اتوماسیون رایگان',
      automation_line1: 'اتوماسیون',
      automation_line2: 'رایگان',
      of: 'از',
    };
    return translations[key] ?? key;
  },
}));

describe('ProgressRadial', () => {
  it('renders free automation ratio (e.g. 1 از 2) when type is automation', () => {
    render(<ProgressRadial percentage={1} total={2} type="automation" size={95} strokeWidth={9} />);

    expect(screen.getByText('اتوماسیون')).toBeInTheDocument();
    expect(screen.getByText('رایگان')).toBeInTheDocument();
    expect(screen.getByText('1 از 2')).toBeInTheDocument();
  });

  it('renders days when type is days', () => {
    render(<ProgressRadial percentage={15} totalDays={30} type="days" size={95} strokeWidth={9} />);

    expect(screen.getByText('اعـتـبـار')).toBeInTheDocument();
    expect(screen.getByText('15 روز')).toBeInTheDocument();
  });

  it('renders message credit count when type is credit', () => {
    render(<ProgressRadial percentage={300} type="credit" size={95} strokeWidth={9} />);

    expect(screen.getByText('اعـتـبـار')).toBeInTheDocument();
    expect(screen.getByText('300 پیام')).toBeInTheDocument();
  });
});
