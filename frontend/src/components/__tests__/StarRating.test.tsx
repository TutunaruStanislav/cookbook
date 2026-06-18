import { render, screen } from '@testing-library/react';
import StarRating from '../StarRating';

describe('StarRating', () => {
  it('renders exactly 5 stars', () => {
    render(<StarRating value={3} />);
    expect(screen.getAllByText('★')).toHaveLength(5);
  });

  it('shows formatted rating value when provided', () => {
    render(<StarRating value={4.5} />);
    expect(screen.getByText(/4\.5/)).toBeInTheDocument();
  });

  it('shows count in parentheses when provided', () => {
    render(<StarRating value={3} count={12} />);
    expect(screen.getByText(/\(12\)/)).toBeInTheDocument();
  });

  it('does not render value text when value is null', () => {
    render(<StarRating value={null} />);
    expect(screen.queryByText(/\d+\.\d/)).not.toBeInTheDocument();
  });

  it('applies larger font size for md variant', () => {
    const { container } = render(<StarRating value={3} size="md" />);
    expect((container.firstChild as HTMLElement).style.fontSize).toBe('1.1rem');
  });
});
