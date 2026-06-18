import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '../api/recipes';

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => dashboardApi.stats().then((r) => r.data),
    staleTime: 5 * 60_000,
  });
}
