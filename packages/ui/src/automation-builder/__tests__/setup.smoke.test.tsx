import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

function Hello() {
  return <div>hello-automation-builder</div>;
}

describe('vitest + RTL smoke test', () => {
  it('renders a component and queries it', () => {
    render(<Hello />);
    expect(screen.getByText('hello-automation-builder')).toBeInTheDocument();
  });
});
