import { fireEvent, screen } from '@testing-library/react';
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

  it('shows the count against the cap in Persian digits', () => {
    renderWithForm(<DescriptionSection />);

    fireEvent.change(screen.getByTestId('description-input'), { target: { value: 'کفش' } });

    expect(screen.getByTestId('description-count')).toHaveTextContent('۳ / ۶۰');
  });

  it('caps the field at 60 characters via maxLength', () => {
    renderWithForm(<DescriptionSection />);
    const input = screen.getByTestId('description-input') as HTMLTextAreaElement;

    // `fireEvent.change` sets `.value` directly and bypasses `maxLength` (real typing does not),
    // so this cannot assert an over-length value gets truncated. It asserts the mechanism that
    // stops a real keystroke instead — the schema-level cap (61 rejected, 60 accepted) is covered
    // in `productEditor.schema.test.ts`.
    expect(input).toHaveAttribute('maxLength', '60');
    expect(input.maxLength).toBe(60);
  });

  it('marks the counter as an error when the form reports one', () => {
    renderWithForm(<DescriptionSection />, {
      errors: { description: { type: 'too_big', message: 'حداکثر ۶۰ کاراکتر' } },
    });

    expect(screen.getByTestId('description-count')).toHaveTextContent('حداکثر ۶۰ کاراکتر');
  });
});
