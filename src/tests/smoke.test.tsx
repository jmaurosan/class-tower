import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

describe('Smoke Test', () => {
  it('renders a simple div', () => {
    render(<div>Hello Test</div>);
    expect(screen.getByText('Hello Test')).toBeInTheDocument();
  });
});
