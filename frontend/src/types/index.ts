export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
}

export interface Tag {
  id: number;
  name: string;
  slug: string;
}

export interface Ingredient {
  id: number;
  name: string;
}

export interface RecipeIngredient {
  id: number;
  ingredient: Ingredient;
  amount: number;
  scaled_amount: number;
  unit: string;
}

export interface RecipeStep {
  id: number;
  order: number;
  text: string;
}

export type Difficulty = 'easy' | 'medium' | 'hard';

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: 'Лёгкий',
  medium: 'Средний',
  hard: 'Сложный',
};

export const UNIT_LABELS: Record<string, string> = {
  g: 'г',
  ml: 'мл',
  pcs: 'шт',
  tbsp: 'ст.л.',
  tsp: 'ч.л.',
  kg: 'кг',
  l: 'л',
  pinch: 'щепотка',
};

export interface RecipeList {
  id: number;
  title: string;
  description: string;
  cooking_time: number;
  difficulty: Difficulty;
  photo: string | null;
  servings: number;
  author: User;
  is_public: boolean;
  categories: Category[];
  tags: Tag[];
  avg_rating: number | null;
  ratings_count: number;
  is_favorited: boolean;
  created_at: string;
}

export interface RecipeDetail extends RecipeList {
  steps: RecipeStep[];
  ingredients: RecipeIngredient[];
  updated_at: string;
}

export interface RecipeWriteData {
  title: string;
  description: string;
  cooking_time: number;
  difficulty: Difficulty;
  servings: number;
  is_public: boolean;
  categories: number[];
  tags: number[];
  ingredients: { ingredient: number; amount: number; unit: string }[];
  steps: { order: number; text: string }[];
}

export interface Comment {
  id: number;
  author: User;
  text: string;
  created_at: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export type MealType = 'breakfast' | 'lunch' | 'dinner';

export const MEAL_TYPE_LABELS: Record<MealType, string> = {
  breakfast: 'Завтрак',
  lunch: 'Обед',
  dinner: 'Ужин',
};

export const DAY_LABELS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

// Compact recipe shape returned inside a planner slot (`recipe_detail`).
export interface SlotRecipe {
  id: number;
  title: string;
  photo: string | null;
  cooking_time: number;
  difficulty: Difficulty;
  author_name: string;
}

// A single dish placed in a slot. A slot holds up to MAX_DISHES_PER_SLOT items.
export interface SlotItem {
  id: number;
  recipe: number;
  recipe_detail: SlotRecipe;
  position: number;
}

export const MAX_DISHES_PER_SLOT = 3;

export interface MealSlot {
  id: number;
  day: number;
  meal_type: MealType;
  items: SlotItem[];
}

export interface MenuPlan {
  id: number;
  week_start: string;
  slots: MealSlot[];
}

export interface ShoppingItem {
  ingredient_id: number;
  ingredient: string;
  unit: string;
  total_amount: number;
}

export interface DashboardStats {
  totals: {
    recipes: number;
    ingredients: number;
    comments: number;
    users: number;
  };
  by_category: { name: string; count: number }[];
  by_difficulty: { difficulty: string; label: string; count: number }[];
  by_cooking_time: { range: string; count: number }[];
  top_by_rating: { id: number; title: string; avg_rating: number; ratings_count: number }[];
  top_by_favorites: { id: number; title: string; favorites_count: number }[];
  top_tags: { name: string; count: number }[];
}

export interface RecipeFilters {
  search?: string;
  difficulty?: Difficulty | '';
  category?: number | '';
  tag?: string;
  min_time?: number | '';
  max_time?: number | '';
  ordering?: string;
  favorites?: boolean;
  ingredients?: string;
  author?: number;
  page?: number;
}
