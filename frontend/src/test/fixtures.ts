import type { RecipeList } from '../types';

export const mockRecipe: RecipeList = {
  id: 1,
  title: 'Борщ классический',
  description: 'Традиционный борщ',
  cooking_time: 90,
  difficulty: 'medium',
  photo: null,
  servings: 4,
  author: {
    id: 1,
    username: 'alice',
    email: 'alice@example.com',
    first_name: 'Alice',
    last_name: 'Smith',
  },
  is_public: true,
  categories: [{ id: 1, name: 'Супы', slug: 'soups' }],
  tags: [{ id: 1, name: 'Семейное', slug: 'family' }],
  avg_rating: 4.5,
  ratings_count: 10,
  is_favorited: false,
  created_at: '2026-06-18T10:00:00Z',
};
