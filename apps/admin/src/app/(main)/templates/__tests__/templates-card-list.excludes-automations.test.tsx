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

import TemplatesCardList from '../templates-card-list';

// `TemplatesCardList` itself is a dumb `TemplateRow[]` renderer (see `template-card.tsx`)
// — it does no filtering of its own. The real "template rows never appear in the
// workspace automation list, and vice versa" guarantee lives one layer up:
// `client-page.tsx` fetches strictly `/templates` (never `/contentCycle`), and the
// backend's own list query (Part 1, Task 5's guard) only ever returns template rows
// from that endpoint. This test locks in the frontend half of that contract from the
// list's own perspective: a real template row (template-only fields: `templateTitle`,
// `templateDescription`, `templateImage`, `templateAppliesToAllCategories`,
// `categories` — never `contents`/`conditions`/`instagramIds`, which is what an
// automation row would carry) renders correctly end to end through
// `TemplatesCardList` -> `TemplateCard`, with nothing else mixed in.
describe('Admin templates list never mixes in real workspace automations', () => {
  it('renders exactly one card for the one template row', () => {
    const rows = [
      {
        id: 't1',
        templateTitle: 'قالب واقعی',
        templateDescription: null,
        templateImage: null,
        templateAppliesToAllCategories: true,
        categories: [],
      },
    ];

    render(
      <NextIntlClientProvider locale="fa" messages={messages}>
        <TemplatesCardList
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

    expect(screen.getByText('قالب واقعی')).toBeInTheDocument();
    // Exactly one card rendered — nothing extra (e.g. an accidentally-mixed-in
    // automation row) sneaked into the grid. Each card renders exactly one "edit"
    // action button, so counting those pins the card count.
    expect(screen.getAllByText(messages.Templates.edit)).toHaveLength(1);
  });
});
