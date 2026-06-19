import { fireEvent, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider, useAuth } from '../AuthContext';

function LogoutProbe() {
  const { logout } = useAuth();
  return (
    <button type="button" onClick={logout}>
      logout
    </button>
  );
}

describe('AuthContext', () => {
  it('clears the React Query cache on logout so the next user cannot see cached data', () => {
    const qc = new QueryClient();
    // Simulate data fetched as a previous user (incl. their private recipe).
    qc.setQueryData(['recipes', {}], [{ id: 85, title: 'Хумус домашний' }]);
    qc.setQueryData(['recipe', 85], { id: 85, title: 'Хумус домашний' });

    render(
      <QueryClientProvider client={qc}>
        <MemoryRouter>
          <AuthProvider>
            <LogoutProbe />
          </AuthProvider>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(qc.getQueryData(['recipes', {}])).toBeTruthy();

    fireEvent.click(screen.getByText('logout'));

    expect(qc.getQueryData(['recipes', {}])).toBeUndefined();
    expect(qc.getQueryData(['recipe', 85])).toBeUndefined();
  });
});
