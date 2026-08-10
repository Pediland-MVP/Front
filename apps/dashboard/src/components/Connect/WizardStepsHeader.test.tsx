import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WizardStepsHeader } from './WizardStepsHeader';

describe('WizardStepsHeader', () => {
  it('shows the current step title', () => {
    render(<WizardStepsHeader titles={['یک', 'دو', 'سه']} currentIndex={1} />);
    expect(screen.getByText('دو')).toBeInTheDocument();
  });

  it('fills the rectangle up to and including the current step, leaves later ones muted', () => {
    const { container } = render(
      <WizardStepsHeader titles={['یک', 'دو', 'سه']} currentIndex={1} />,
    );
    const bars = container.querySelectorAll('[data-testid="wizard-step-bar"]');
    expect(bars).toHaveLength(3);
    expect(bars[0].className).toContain('bg-violet-600');
    expect(bars[1].className).toContain('bg-violet-600');
    expect(bars[2].className).toContain('bg-slate-200');
  });
});
