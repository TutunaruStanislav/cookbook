import { screen } from '@testing-library/react';
import RecipeCard from '../RecipeCard';
import { render } from '../../test/utils';
import { mockRecipe } from '../../test/fixtures';

describe('RecipeCard', () => {
  it('renders recipe title', () => {
    render(<RecipeCard recipe={mockRecipe} />);
    expect(screen.getByText('Борщ классический')).toBeInTheDocument();
  });

  it('shows full author name when first_name is set', () => {
    render(<RecipeCard recipe={mockRecipe} />);
    expect(screen.getByText('Alice Smith')).toBeInTheDocument();
  });

  it('falls back to username when first_name is empty', () => {
    const recipe = {
      ...mockRecipe,
      author: { ...mockRecipe.author, first_name: '', last_name: '' },
    };
    render(<RecipeCard recipe={recipe} />);
    expect(screen.getByText('alice')).toBeInTheDocument();
  });

  it('shows difficulty badge with localised label', () => {
    render(<RecipeCard recipe={mockRecipe} />);
    expect(screen.getByText('Средний')).toBeInTheDocument();
  });

  it('shows "Нет оценок" when avg_rating is null', () => {
    render(<RecipeCard recipe={{ ...mockRecipe, avg_rating: null }} />);
    expect(screen.getByText('Нет оценок')).toBeInTheDocument();
  });

  it('renders cooking time in minutes', () => {
    render(<RecipeCard recipe={mockRecipe} />);
    expect(screen.getByText('90 мин')).toBeInTheDocument();
  });
});
