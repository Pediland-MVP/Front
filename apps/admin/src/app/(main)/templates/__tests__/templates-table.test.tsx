import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import messages from '@/messages/fa.json';
vi.mock('@/hooks/swr/api-client', () => ({
  default: { delete: vi.fn().mockResolvedValue({}) },
  fetcher: vi.fn(),
}));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));
import TemplatesTable from '../templates-table';

const rows = [
  {
    id: 't1',
    templateTitle: 'خوش‌آمدگویی',
    templateDescription: 'قالب استاندارد',
    templateImage: null,
    templateAppliesToAllCategories: true,
    categories: [],
  },
];

describe('TemplatesTable', () => {
  it('renders a row title and an "all categories" badge', () => {
    render(
      <NextIntlClientProvider locale="fa" messages={messages}>
        <TemplatesTable
          templates={rows as any}
          totalCount={1}
          page={1}
          limit={20}
          onPageChange={vi.fn()}
          onLimitChange={vi.fn()}
          search=""
          onSearchChange={vi.fn()}
          mutate={vi.fn()}
        />
      </NextIntlClientProvider>,
    );
    expect(screen.getByText('خوش‌آمدگویی')).toBeInTheDocument();
    expect(screen.getByText('همه دسته‌بندی‌ها')).toBeInTheDocument();
  });
});
