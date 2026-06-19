import { useEffect, useState } from 'react';
import { Button, Col, Form, InputGroup, Row } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';
import { useCategories, useTags } from '../hooks/useRecipes';
import type { RecipeFilters } from '../types';
import IngredientMultiSelect from './IngredientMultiSelect';

interface Props {
  filters: RecipeFilters;
  onChange: (f: RecipeFilters) => void;
  onReset: () => void;
}

export default function RecipeFiltersBar({ filters, onChange, onReset }: Props) {
  const { isAuthenticated } = useAuth();
  const { data: categories } = useCategories();
  const { data: tags } = useTags();
  const [search, setSearch] = useState(filters.search ?? '');

  // Debounce search input 400 ms
  useEffect(() => {
    const t = setTimeout(() => {
      onChange({ ...filters, search: search || undefined, page: 1 });
    }, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  // Sync external reset
  useEffect(() => {
    setSearch(filters.search ?? '');
  }, [filters.search]);

  const set = (partial: Partial<RecipeFilters>) =>
    onChange({ ...filters, ...partial, page: 1 });

  const selectedIngredients = filters.ingredients
    ? filters.ingredients.split(',').map((s) => s.trim()).filter(Boolean)
    : [];

  return (
    <div className="mb-4">
      {/* Text search row */}
      <Row className="g-2 mb-2">
        {/* Search by title */}
        <Col xs={12} md={6}>
          <InputGroup>
            <InputGroup.Text>
              <span style={{ fontSize: '0.9rem' }}>&#128269;</span>
            </InputGroup.Text>
            <Form.Control
              placeholder="Поиск по названию..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </InputGroup>
        </Col>

        {/* Search by ingredients — «что приготовить из…» */}
        <Col xs={12} md={6}>
          <IngredientMultiSelect
            value={selectedIngredients}
            onChange={(names) => set({ ingredients: names.length ? names.join(',') : undefined })}
          />
        </Col>
      </Row>

      {/* Selects row */}
      <Row className="g-2 align-items-end">
        {/* Difficulty */}
        <Col xs={6} sm={4} md={2}>
          <Form.Select
            value={filters.difficulty ?? ''}
            onChange={(e) => set({ difficulty: e.target.value as RecipeFilters['difficulty'] })}
          >
            <option value="">Сложность</option>
            <option value="easy">Лёгкий</option>
            <option value="medium">Средний</option>
            <option value="hard">Сложный</option>
          </Form.Select>
        </Col>

        {/* Category */}
        <Col xs={6} sm={4} md={2}>
          <Form.Select
            value={filters.category ?? ''}
            onChange={(e) =>
              set({ category: e.target.value ? Number(e.target.value) : undefined })
            }
          >
            <option value="">Категория</option>
            {categories?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Form.Select>
        </Col>

        {/* Tag */}
        <Col xs={6} sm={4} md={2}>
          <Form.Select
            value={filters.tag ?? ''}
            onChange={(e) => set({ tag: e.target.value || undefined })}
          >
            <option value="">Тег</option>
            {tags?.map((t) => (
              <option key={t.id} value={t.slug}>
                {t.name}
              </option>
            ))}
          </Form.Select>
        </Col>

        {/* Ordering */}
        <Col xs={6} sm={4} md={2}>
          <Form.Select
            value={filters.ordering ?? ''}
            onChange={(e) => set({ ordering: e.target.value || undefined })}
          >
            <option value="">Сортировка</option>
            <option value="-created_at">Новые</option>
            <option value="created_at">Старые</option>
            <option value="-avg_rating">Рейтинг ↓</option>
            <option value="cooking_time">Время ↑</option>
            <option value="-cooking_time">Время ↓</option>
          </Form.Select>
        </Col>

        {/* Favorites + Reset */}
        <Col xs={12} sm={8} md={4} className="d-flex align-items-center gap-2">
          {isAuthenticated && (
            <Form.Check
              type="switch"
              id="fav-switch"
              label="Избранное"
              checked={!!filters.favorites}
              onChange={(e) => set({ favorites: e.target.checked || undefined })}
            />
          )}
          <Button variant="outline-secondary" size="sm" onClick={onReset} className="ms-auto">
            Сброс
          </Button>
        </Col>
      </Row>
    </div>
  );
}
