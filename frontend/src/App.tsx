import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardPage from './pages/DashboardPage';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import NotFoundPage from './pages/NotFoundPage';
import PlannerPage from './pages/PlannerPage';
import ProfilePage from './pages/ProfilePage';
import RecipeDetailPage from './pages/RecipeDetailPage';
import RecipeFormPage from './pages/RecipeFormPage';
import RecipesPage from './pages/RecipesPage';
import RegisterPage from './pages/RegisterPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 60_000,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Layout>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              {/* Recipes — order matters: /new before /:id */}
              <Route path="/recipes" element={<RecipesPage />} />
              <Route
                path="/recipes/new"
                element={
                  <ProtectedRoute>
                    <RecipeFormPage />
                  </ProtectedRoute>
                }
              />
              <Route path="/recipes/:id" element={<RecipeDetailPage />} />
              <Route
                path="/recipes/:id/edit"
                element={
                  <ProtectedRoute>
                    <RecipeFormPage />
                  </ProtectedRoute>
                }
              />

              <Route path="/dashboard" element={<DashboardPage />} />
              <Route
                path="/planner"
                element={
                  <ProtectedRoute>
                    <PlannerPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Layout>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
