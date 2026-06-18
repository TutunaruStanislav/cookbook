import type { ReactNode } from 'react';
import AppNavbar from './AppNavbar';

interface Props {
  children: ReactNode;
}

export default function Layout({ children }: Props) {
  return (
    <div className="d-flex flex-column min-vh-100">
      <AppNavbar />
      <main className="flex-grow-1">{children}</main>
      <footer className="bg-dark text-secondary py-3 text-center">
        <small>Cookbook &copy; 2026</small>
      </footer>
    </div>
  );
}
