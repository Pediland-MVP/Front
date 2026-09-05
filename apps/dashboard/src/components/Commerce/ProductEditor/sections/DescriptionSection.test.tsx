import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { DescriptionSection } from './DescriptionSection';
import { renderWithForm } from '../../../../test/renderWithForm';

describe('DescriptionSection', () => {
  it('renders a plain textarea, not a rich-text surface', () => {
    renderWithForm(<DescriptionSection />);

    expect(screen.getByTestId('description-input').tagName).toBe('TEXTAREA');
    expect(screen.queryByTestId('md-surface')).toBeNull();
    expect(screen.queryByTestId('md-bold')).toBeNull();
  });

  it('shows the count against the cap in Persian digits', async () => {
    renderWithForm(<DescriptionSection />);

    await userEvent.type(screen.getByTestId('description-input'), 'کفش');

    expect(screen.getByTestId('description-count')).toHaveTextContent('۳ / ۶۰');
  });

  it('cannot be typed past the cap', async () => {
    renderWithForm(<DescriptionSection />);
    const input = screen.getByTestId('description-input') as HTMLTextAreaElement;

    await userEvent.type(input, 'ا'.repeat(70));

    expect(input.value).toHaveLength(60);
  });

  it('marks the counter as an error when the form reports one', () => {
    renderWithForm(<DescriptionSection />, {
      errors: { description: { type: 'too_big', message: 'حداکثر ۶۰ کاراکتر' } },
    });

    expect(screen.getByTestId('description-count')).toHaveTextContent('حداکثر ۶۰ کاراکتر');
  });
});
