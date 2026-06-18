import { fireEvent, render, screen } from '@testing-library/react';
import AppPagination from '../AppPagination';

describe('AppPagination', () => {
  it('renders nothing when total pages is 1', () => {
    const { container } = render(
      <AppPagination count={10} page={1} pageSize={12} onChange={vi.fn()} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders all page numbers when ≤7 pages', () => {
    render(<AppPagination count={60} page={1} pageSize={12} onChange={vi.fn()} />);
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('calls onChange with the correct page number on click', () => {
    const onChange = vi.fn();
    render(<AppPagination count={36} page={1} pageSize={12} onChange={onChange} />);
    fireEvent.click(screen.getByText('3'));
    expect(onChange).toHaveBeenCalledWith(3);
  });

  it('marks current page item as active', () => {
    render(<AppPagination count={36} page={2} pageSize={12} onChange={vi.fn()} />);
    expect(screen.getByText('2').closest('li')).toHaveClass('active');
  });

  it('shows ellipsis for large page counts', () => {
    // 150 items / 12 per page = 13 pages → triggers ellipsis logic
    render(<AppPagination count={150} page={1} pageSize={12} onChange={vi.fn()} />);
    expect(screen.getByText('…')).toBeInTheDocument();
  });
});
