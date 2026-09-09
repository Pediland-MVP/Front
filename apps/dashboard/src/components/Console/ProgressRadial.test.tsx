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

  it('keeps the ring gradient and shows the raw count when under the free automation limit', () => {
    const { container } = render(
      <ProgressRadial percentage={1} total={2} type="automation" size={95} strokeWidth={9} />,
    );

    expect(screen.getByText('1 از 2')).toBeInTheDocument();
    const animatedCircle = container.querySelectorAll('circle')[1];
    expect(animatedCircle).toHaveAttribute('stroke', 'url(#circular-progress-gradient)');
  });

  it('turns the ring red and still shows the exact count when the free automation limit is reached', () => {
    const { container } = render(
      <ProgressRadial percentage={2} total={2} type="automation" size={95} strokeWidth={9} />,
    );

    expect(screen.getByText('2 از 2')).toBeInTheDocument();
    const animatedCircle = container.querySelectorAll('circle')[1];
    expect(animatedCircle).toHaveAttribute('stroke', '#dc2626');
  });

  it('turns the ring red and shows the true (over-limit) count when the count exceeds the limit', () => {
    const { container } = render(
      <ProgressRadial percentage={3} total={2} type="automation" size={95} strokeWidth={9} />,
    );

    expect(screen.getByText('3 از 2')).toBeInTheDocument();
    const animatedCircle = container.querySelectorAll('circle')[1];
    expect(animatedCircle).toHaveAttribute('stroke', '#dc2626');
  });

  it('reverts the ring to normal as soon as the count drops back under the limit (e.g. after deleting an automation)', () => {
    const { container, rerender } = render(
      <ProgressRadial percentage={2} total={2} type="automation" size={95} strokeWidth={9} />,
    );
    expect(container.querySelectorAll('circle')[1]).toHaveAttribute('stroke', '#dc2626');

    rerender(
      <ProgressRadial percentage={1} total={2} type="automation" size={95} strokeWidth={9} />,
    );

    expect(screen.getByText('1 از 2')).toBeInTheDocument();
    expect(container.querySelectorAll('circle')[1]).toHaveAttribute(
      'stroke',
      'url(#circular-progress-gradient)',
    );
  });

  it('does not redden the ring for non-automation types even at/over 100%', () => {
    const { container } = render(
      <ProgressRadial percentage={30} totalDays={30} type="days" size={95} strokeWidth={9} />,
    );

    const animatedCircle = container.querySelectorAll('circle')[1];
    expect(animatedCircle).toHaveAttribute('stroke', 'url(#circular-progress-gradient)');
  });
});
