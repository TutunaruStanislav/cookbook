import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { catalogApi, recipesApi } from '../api/recipes';
import type { RecipeFilters, RecipeWriteData } from '../types';

export const RECIPES_KEY = 'recipes';
export const RECIPE_KEY = 'recipe';

export function useRecipes(filters: RecipeFilters) {
  return useQuery({
    queryKey: [RECIPES_KEY, filters],
    queryFn: () => recipesApi.list(filters).then((r) => r.data),
  });
}

export function useRecipe(id: number, servings?: number) {
  return useQuery({
    queryKey: [RECIPE_KEY, id, servings ?? null],
    queryFn: () => recipesApi.detail(id, servings).then((r) => r.data),
    enabled: id > 0,
  });
}

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: () => catalogApi.categories().then((r) => r.data),
    staleTime: Infinity,
  });
}

export function useTags() {
  return useQuery({
    queryKey: ['tags'],
    queryFn: () => catalogApi.tags().then((r) => r.data),
    staleTime: Infinity,
  });
}

export function useIngredients(search: string) {
  return useQuery({
    queryKey: ['ingredients', search],
    queryFn: () => catalogApi.ingredients(search).then((r) => r.data),
    enabled: search.length >= 2,
    staleTime: 30_000,
  });
}

export function useFavoriteToggle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => recipesApi.favorite(id).then((r) => r.data),
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: [RECIPES_KEY] });
      qc.invalidateQueries({ queryKey: [RECIPE_KEY, id] });
    },
  });
}

export function useCreateRecipe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: RecipeWriteData) => recipesApi.create(data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [RECIPES_KEY] });
    },
  });
}

export function useUpdateRecipe(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<RecipeWriteData>) =>
      recipesApi.update(id, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [RECIPES_KEY] });
      qc.invalidateQueries({ queryKey: [RECIPE_KEY, id] });
    },
  });
}

export function useUploadRecipePhoto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, file }: { id: number; file: File }) =>
      recipesApi.uploadPhoto(id, file).then((r) => r.data),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: [RECIPES_KEY] });
      qc.invalidateQueries({ queryKey: [RECIPE_KEY, id] });
    },
  });
}

export function useDeleteRecipe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => recipesApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [RECIPES_KEY] });
    },
  });
}
