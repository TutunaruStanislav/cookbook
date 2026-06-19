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

function usePlannerInvalidate(weekStart: string) {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: [PLAN_KEY, weekStart] });
    qc.invalidateQueries({ queryKey: [SHOPPING_KEY, weekStart] });
  };
}

export function useAddSlotItem(weekStart: string) {
  const invalidate = usePlannerInvalidate(weekStart);
  return useMutation({
    mutationFn: ({ slotId, recipeId }: { slotId: number; recipeId: number }) =>
      plannerApi.addSlotItem(slotId, recipeId),
    onSuccess: invalidate,
  });
}

export function useMoveSlotItem(weekStart: string) {
  const invalidate = usePlannerInvalidate(weekStart);
  return useMutation({
    mutationFn: ({ itemId, targetSlotId }: { itemId: number; targetSlotId: number }) =>
      plannerApi.moveSlotItem(itemId, targetSlotId),
    onSuccess: invalidate,
  });
}

export function useRemoveSlotItem(weekStart: string) {
  const invalidate = usePlannerInvalidate(weekStart);
  return useMutation({
    mutationFn: (itemId: number) => plannerApi.removeSlotItem(itemId),
    onSuccess: invalidate,
  });
}

export function useShoppingList(weekStart: string, enabled: boolean) {
  return useQuery({
    queryKey: [SHOPPING_KEY, weekStart],
    queryFn: () => plannerApi.shoppingList(weekStart).then((r) => r.data),
    enabled: enabled && !!weekStart,
  });
}
