import { useEffect, useState } from 'react';
import { Button, Col, Form, InputGroup, Row } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';
import { useCategories } from '../hooks/useRecipes';
import type { RecipeFilters } from '../types';

interface Props {
  filters: RecipeFilters;
  onChange: (f: RecipeFilters) => void;
  onReset: () => void;
}

export default function RecipeFiltersBar({ filters, onChange, onReset }: Props) {
  const { isAuthenticated } = useAuth();
  const { data: categories } = useCategories();
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

  return (
    <Row className="g-2 align-items-end mb-4">
      {/* Search */}
      <Col xs={12} md={4}>
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
      <Col xs={6} sm={4} md={2} className="d-flex align-items-center gap-2">
        {isAuthenticated && (
          <Form.Check
            type="switch"
            id="fav-switch"
            label="Моё"
            checked={!!filters.favorites}
            onChange={(e) => set({ favorites: e.target.checked || undefined })}
          />
        )}
        <Button variant="outline-secondary" size="sm" onClick={onReset} className="ms-auto">
          Сброс
        </Button>
      </Col>
    </Row>
  );
}
