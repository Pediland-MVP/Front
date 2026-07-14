import { describe, it, expect } from 'vitest';
import { DndContext } from '@dnd-kit/core';
import { render } from '@testing-library/react';

describe('admin can import @dnd-kit (needed by shared Contents tree)', () => {
  it('renders a DndContext without throwing', () => {
    const { container } = render(<DndContext>{null}</DndContext>);
    expect(container).toBeTruthy();
  });
});
