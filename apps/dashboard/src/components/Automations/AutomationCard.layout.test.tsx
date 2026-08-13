import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import messages from '@/messages/fa.json';
import type { Automation } from '@/schemas/automation';
import { AutomationCard } from './AutomationCard';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
}));

vi.mock('@/hooks/usePermissions', () => ({
  usePermissions: () => ({ can: () => true, permissions: [], isLoading: false }),
}));

vi.mock('@/hooks/swr/api-client', () => ({
  default: { get: vi.fn(), post: vi.fn(), delete: vi.fn() },
  fetcher: vi.fn(),
}));

// Two accounts, so the card also renders its instagram-usernames row.
vi.mock('swr/immutable', () => ({
  default: () => ({
    data: { data: [{ id: 'ig-1' }, { id: 'ig-2' }] },
    error: undefined,
    isLoading: false,
  }),
}));

const baseAutomation: Automation = {
  id: 'automation-1',
  createDate: '2026-08-13T00:00:00.000Z',
  updateDate: '2026-08-13T00:00:00.000Z',
  isDirect: true,
  isComment: false,
  commentStartText: '',
  commentStartTitle: '',
  title: 'یک عنوان',
  enabled: true,
  justFollowers: false,
  followCheckMessage: '',
  followMessage: null,
  reminderTime: null,
  isRemindersEnabled: false,
  commentTexts: [],
  instagramLinks: [{ instagramId: 'ig-1', instagram: { id: 'ig-1', username: 'befroosh' } }],
  instagramPost: null,
  contents: [],
  conditions: [{ type: 'EQUAL', value: 'سلام', id: 'condition-1' }],
  sessionsCount: 3,
};

function renderCard(overrides: Partial<Automation> = {}) {
  const { container } = render(
    <NextIntlClientProvider locale="fa" messages={messages}>
      <AutomationCard item={{ ...baseAutomation, ...overrides }} handleDelete={vi.fn()} />
    </NextIntlClientProvider>,
  );

  const card = container.querySelector('[data-slot="card"]') as HTMLElement;
  const content = container.querySelector('[data-slot="card-content"]') as HTMLElement;
  const footer = container.querySelector('[data-slot="card-footer"]') as HTMLElement;
  return { card, content, footer };
}

// jsdom has no layout engine, so we assert the classes that pin the footer instead of
// measuring pixels. The bug: `Card` is `flex flex-col` and the grid stretches every card
// in a row to the same height, but `CardContent` did not grow — so the footer floated up
// by however much shorter the content was (no title, no post image, no conditions).
const VARIANTS: Array<[string, Partial<Automation>]> = [
  ['with a title', { title: 'یک عنوان' }],
  ['without a title', { title: null }],
  ['without a title and disabled', { title: null, enabled: false }],
  [
    'assigned to a post',
    {
      title: null,
      instagramPost: { mediaId: 'media-1', picture: { url: 'https://example.com/p.jpg' } },
    },
  ],
  ['without conditions', { title: null, conditions: [] }],
];

describe('AutomationCard layout stability', () => {
  it.each(VARIANTS)('keeps the footer pinned to the bottom %s', (_label, overrides) => {
    const { card, content, footer } = renderCard(overrides);

    // The card fills its grid cell, so every card in a row is the same height.
    expect(card.className).toContain('h-full');
    // The content absorbs the leftover height...
    expect(content.className).toContain('flex-1');
    // ...which leaves the footer sitting on the card's bottom edge.
    expect(card.lastElementChild).toBe(footer);
  });

  it('keeps the conditions row a fixed height when there are no conditions', () => {
    const { content } = renderCard({ conditions: [] });
    const conditionsRow = content.querySelector('.line-clamp-1') as HTMLElement;
    expect(conditionsRow.className).toContain('min-h-6');
  });

  it('keeps the instagram usernames on a single line', () => {
    const { content } = renderCard({
      instagramLinks: [
        { instagramId: 'ig-1', instagram: { id: 'ig-1', username: 'a-very-long-account-name' } },
        { instagramId: 'ig-2', instagram: { id: 'ig-2', username: 'another-long-account-name' } },
      ],
    });
    const usernames = content.querySelector('span.truncate') as HTMLElement;
    expect(usernames).not.toBeNull();
    expect(usernames.textContent).toContain('@a-very-long-account-name');
  });
});
