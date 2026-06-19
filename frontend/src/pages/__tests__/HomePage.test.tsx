import { screen } from '@testing-library/react';
import HomePage from '../HomePage';
import { render } from '../../test/utils';

describe('HomePage', () => {
  afterEach(() => {
    localStorage.clear();
  });

  it('renders the main heading', () => {
    render(<HomePage />);
    expect(
      screen.getByRole('heading', { level: 1, name: /кулинарная книга рецептов/i }),
    ).toBeInTheDocument();
  });

  it('shows "Создать аккаунт" button when user is not authenticated', () => {
    render(<HomePage />);
    expect(screen.getByText('Создать аккаунт')).toBeInTheDocument();
  });

  it('hides "Создать аккаунт" button when user is authenticated', () => {
    localStorage.setItem('access', 'fake-token');
    localStorage.setItem(
      'user',
      JSON.stringify({
        id: 1,
        username: 'alice',
        email: 'alice@example.com',
        first_name: 'Alice',
        last_name: 'Smith',
      }),
    );
    render(<HomePage />);
    expect(screen.queryByText('Создать аккаунт')).not.toBeInTheDocument();
  });

  it('shows link to recipes page', () => {
    render(<HomePage />);
    expect(screen.getAllByText('Смотреть рецепты').length).toBeGreaterThan(0);
  });
});
