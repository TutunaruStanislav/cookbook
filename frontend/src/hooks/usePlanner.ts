import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { plannerApi } from '../api/recipes';

export const PLAN_KEY = 'menu-plan';
export const SHOPPING_KEY = 'shopping-list';

export function usePlan(weekStart: string) {
  return useQuery({
    queryKey: [PLAN_KEY, weekStart],
    queryFn: () => plannerApi.plan(weekStart).then((r) => r.data),
    enabled: !!weekStart,
  });
}

export function useUpdateSlot(weekStart: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ slotId, recipeId }: { slotId: number; recipeId: number | null }) =>
      plannerApi.updateSlot(slotId, recipeId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [PLAN_KEY, weekStart] });
      qc.invalidateQueries({ queryKey: [SHOPPING_KEY, weekStart] });
    },
  });
}

export function useShoppingList(weekStart: string, enabled: boolean) {
  return useQuery({
    queryKey: [SHOPPING_KEY, weekStart],
    queryFn: () => plannerApi.shoppingList(weekStart).then((r) => r.data),
    enabled: enabled && !!weekStart,
  });
}
