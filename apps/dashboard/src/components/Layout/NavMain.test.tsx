import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { GearIcon } from '@phosphor-icons/react/dist/ssr/Gear';
import { HouseIcon } from '@phosphor-icons/react/dist/ssr/House';

// The component reads the active route off usePathname to decide highlighting.
const pathnameMock = vi.fn(() => '/settings/workspace');
vi.mock('next/navigation', () => ({ usePathname: () => pathnameMock() }));

// SidebarProvider uses `useMediaQuery`, which calls `matchMedia` — jsdom doesn't implement it.
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
});

import { NavMain } from './NavMain';

const renderNav = (items: any) =>
  render(
    <SidebarProvider>
      <NavMain items={items} />
    </SidebarProvider>,
  );

describe('NavMain — sub-item icons', () => {
  it('renders an icon for a sub-item that declares one', () => {
    renderNav([
      {
        title: 'Settings',
        url: '/settings',
        icon: GearIcon,
        items: [{ title: 'Business', url: '/settings/workspace', icon: HouseIcon }],
      },
    ]);

    const link = screen.getByRole('link', { name: /Business/ });
    // Phosphor renders an <svg>; assert one exists inside the sub-item link.
    expect(link.querySelector('svg')).not.toBeNull();
  });

  it('still renders a sub-item that declares no icon', () => {
    renderNav([
      {
        title: 'Settings',
        url: '/settings',
        icon: GearIcon,
        items: [{ title: 'Plain', url: '/settings/workspace' }],
      },
    ]);

    const link = screen.getByRole('link', { name: /Plain/ });
    expect(link).toBeInTheDocument();
    expect(link.querySelector('svg')).toBeNull();
  });

  it('renders a badge dot on a sub-item with a positive badge count', () => {
    renderNav([
      {
        title: 'Settings',
        url: '/settings',
        icon: GearIcon,
        items: [{ title: 'Business', url: '/settings/workspace', icon: HouseIcon, badge: 3 }],
      },
    ]);

    const link = screen.getByRole('link', { name: /Business/ });
    expect(link.querySelector('[data-testid="nav-sub-badge"]')).not.toBeNull();
  });

  it('renders no badge dot when the count is zero', () => {
    renderNav([
      {
        title: 'Settings',
        url: '/settings',
        icon: GearIcon,
        items: [{ title: 'Business', url: '/settings/workspace', icon: HouseIcon, badge: 0 }],
      },
    ]);

    const link = screen.getByRole('link', { name: /Business/ });
    expect(link.querySelector('[data-testid="nav-sub-badge"]')).toBeNull();
  });
});
