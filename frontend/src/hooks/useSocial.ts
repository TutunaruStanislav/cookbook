import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { recipesApi } from '../api/recipes';
import { RECIPE_KEY, RECIPES_KEY } from './useRecipes';

export function useRateRecipe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, value }: { id: number; value: number }) =>
      recipesApi.rate(id, value).then((r) => r.data),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: [RECIPE_KEY, id] });
      qc.invalidateQueries({ queryKey: [RECIPES_KEY] });
    },
  });
}

export function useComments(recipeId: number, page = 1) {
  return useQuery({
    queryKey: ['comments', recipeId, page],
    queryFn: () => recipesApi.comments(recipeId, page).then((r) => r.data),
    enabled: recipeId > 0,
  });
}

export function useAddComment(recipeId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (text: string) => recipesApi.addComment(recipeId, text).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['comments', recipeId] });
    },
  });
}

export function useDeleteComment(recipeId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (commentId: number) => recipesApi.deleteComment(commentId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['comments', recipeId] });
    },
  });
}
