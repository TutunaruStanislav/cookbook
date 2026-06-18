import { Alert, Button, Col, Container, Row, Spinner } from 'react-bootstrap';
import { Link, useSearchParams } from 'react-router-dom';
import AppPagination from '../components/AppPagination';
import RecipeCard from '../components/RecipeCard';
import RecipeFiltersBar from '../components/RecipeFilters';
import { useAuth } from '../contexts/AuthContext';
import { useRecipes } from '../hooks/useRecipes';
import type { RecipeFilters } from '../types';

const PAGE_SIZE = 12;

function filtersFromParams(params: URLSearchParams): RecipeFilters {
  return {
    search: params.get('search') ?? undefined,
    difficulty: (params.get('difficulty') as RecipeFilters['difficulty']) ?? undefined,
    category: params.get('category') ? Number(params.get('category')) : undefined,
    ordering: params.get('ordering') ?? undefined,
    favorites: params.get('favorites') === 'true' ? true : undefined,
    page: params.get('page') ? Number(params.get('page')) : 1,
  };
}

function filtersToParams(f: RecipeFilters): Record<string, string> {
  const p: Record<string, string> = {};
  if (f.search) p.search = f.search;
  if (f.difficulty) p.difficulty = f.difficulty;
  if (f.category) p.category = String(f.category);
  if (f.ordering) p.ordering = f.ordering;
  if (f.favorites) p.favorites = 'true';
  if (f.page && f.page > 1) p.page = String(f.page);
  return p;
}

export default function RecipesPage() {
  const { isAuthenticated } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = filtersFromParams(searchParams);

  const { data, isLoading, isError } = useRecipes(filters);

  const handleFiltersChange = (f: RecipeFilters) => setSearchParams(filtersToParams(f));
  const handleReset = () => setSearchParams({});
  const handlePage = (page: number) =>
    setSearchParams(filtersToParams({ ...filters, page }));

  return (
    <Container className="py-4">
      {/* Header */}
      <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
        <h4 className="mb-0 fw-semibold">Рецепты</h4>
        {isAuthenticated && (
          <Button as={Link as React.ElementType} to="/recipes/new" variant="primary" size="sm">
            + Новый рецепт
          </Button>
        )}
      </div>

      {/* Filters */}
      <RecipeFiltersBar
        filters={filters}
        onChange={handleFiltersChange}
        onReset={handleReset}
      />

      {/* Content */}
      {isLoading && (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
        </div>
      )}

      {isError && (
        <Alert variant="danger">Не удалось загрузить рецепты. Попробуйте обновить страницу.</Alert>
      )}

      {data && data.results.length === 0 && (
        <div className="text-center py-5 text-muted">
          <p>Рецепты не найдены. Попробуйте изменить фильтры.</p>
          <Button variant="outline-secondary" size="sm" onClick={handleReset}>
            Сбросить фильтры
          </Button>
        </div>
      )}

      {data && data.results.length > 0 && (
        <>
          <Row xs={1} sm={2} lg={3} className="g-4">
            {data.results.map((recipe) => (
              <Col key={recipe.id}>
                <RecipeCard recipe={recipe} />
              </Col>
            ))}
          </Row>

          <AppPagination
            count={data.count}
            page={filters.page ?? 1}
            pageSize={PAGE_SIZE}
            onChange={handlePage}
          />

          <p className="text-center text-muted small">
            Показано {data.results.length} из {data.count} рецептов
          </p>
        </>
      )}
    </Container>
  );
}
