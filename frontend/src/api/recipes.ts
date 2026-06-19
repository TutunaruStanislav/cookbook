import type {
  Category,
  Comment,
  DashboardStats,
  Ingredient,
  MealSlot,
  MenuPlan,
  PaginatedResponse,
  RecipeDetail,
  RecipeFilters,
  RecipeList,
  RecipeWriteData,
  ShoppingItem,
  Tag,
} from '../types';
import api from './client';

export const recipesApi = {
  list: (filters: RecipeFilters = {}) => {
    const params: Record<string, string | number | boolean> = {};
    if (filters.search) params.search = filters.search;
    if (filters.difficulty) params.difficulty = filters.difficulty;
    if (filters.category) params.category = filters.category;
    if (filters.tag) params.tag = filters.tag;
    if (filters.min_time) params.min_time = filters.min_time;
    if (filters.max_time) params.max_time = filters.max_time;
    if (filters.ordering) params.ordering = filters.ordering;
    if (filters.favorites) params.favorites = 'true';
    if (filters.ingredients) params.ingredients = filters.ingredients;
    if (filters.author) params.author = filters.author;
    if (filters.page && filters.page > 1) params.page = filters.page;
    return api.get<PaginatedResponse<RecipeList>>('/recipes/', { params });
  },

  detail: (id: number, servings?: number) =>
    api.get<RecipeDetail>(`/recipes/${id}/`, {
      params: servings ? { servings } : undefined,
    }),

  create: (data: RecipeWriteData) => api.post<RecipeDetail>('/recipes/', data),

  update: (id: number, data: Partial<RecipeWriteData>) =>
    api.patch<RecipeDetail>(`/recipes/${id}/`, data),

  remove: (id: number) => api.delete(`/recipes/${id}/`),

  favorite: (id: number) =>
    api.post<{ is_favorited: boolean; recipe_id: number }>(`/recipes/${id}/favorite/`),

  rate: (id: number, value: number) =>
    api.post<{ value: number; avg_rating: number | null; recipe_id: number }>(
      `/recipes/${id}/rate/`,
      { value },
    ),

  comments: (id: number, page = 1) =>
    api.get<PaginatedResponse<Comment>>(`/recipes/${id}/comments/`, {
      params: page > 1 ? { page } : undefined,
    }),

  addComment: (id: number, text: string) =>
    api.post<Comment>(`/recipes/${id}/comments/`, { text }),

  deleteComment: (commentId: number) => api.delete(`/comments/${commentId}/`),
};

export const catalogApi = {
  categories: () => api.get<Category[]>('/categories/'),
  tags: () => api.get<Tag[]>('/tags/'),
  ingredients: (search?: string) =>
    api.get<PaginatedResponse<Ingredient>>('/ingredients/', {
      params: search ? { search } : undefined,
    }),
};

export const plannerApi = {
  plan: (weekStart: string) => api.get<MenuPlan>('/menu-plan/', { params: { week_start: weekStart } }),

  addSlotItem: (slotId: number, recipeId: number) =>
    api.post<MealSlot>(`/menu-plan/slots/${slotId}/items/`, { recipe: recipeId }),

  moveSlotItem: (itemId: number, targetSlotId: number) =>
    api.patch<MealSlot>(`/menu-plan/items/${itemId}/`, { slot: targetSlotId }),

  removeSlotItem: (itemId: number) => api.delete(`/menu-plan/items/${itemId}/`),

  shoppingList: (weekStart: string) =>
    api.get<ShoppingItem[]>('/menu-plan/shopping-list/', { params: { week_start: weekStart } }),
};

export const dashboardApi = {
  stats: () => api.get<DashboardStats>('/dashboard/stats/'),
};
