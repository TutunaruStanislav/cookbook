import { useState } from 'react';
import { Button, Form, ListGroup, Modal, Spinner } from 'react-bootstrap';
import { useRecipes } from '../hooks/useRecipes';
import type { RecipeList } from '../types';
import { DIFFICULTY_LABELS } from '../types';

interface Props {
  show: boolean;
  onHide: () => void;
  onSelect: (recipe: RecipeList) => void;
}

export default function RecipePickerModal({ show, onHide, onSelect }: Props) {
  const [search, setSearch] = useState('');
  const { data, isLoading } = useRecipes({ search: search || undefined, page: 1 });

  const handleHide = () => {
    setSearch('');
    onHide();
  };

  return (
    <Modal show={show} onHide={handleHide} size="lg" scrollable>
      <Modal.Header closeButton>
        <Modal.Title>Выбрать рецепт</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form.Control
          placeholder="Поиск рецепта..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mb-3"
          autoFocus
        />
        {isLoading && (
          <div className="text-center py-3">
            <Spinner animation="border" size="sm" variant="secondary" />
          </div>
        )}
        {data && (
          <ListGroup>
            {data.results.map((recipe) => (
              <ListGroup.Item
                key={recipe.id}
                action
                className="d-flex justify-content-between align-items-center"
                onClick={() => {
                  onSelect(recipe);
                  setSearch('');
                }}
              >
                <span>
                  <strong>{recipe.title}</strong>
                  <small className="text-muted ms-2">{recipe.cooking_time} мин</small>
                </span>
                <small className="text-muted">{DIFFICULTY_LABELS[recipe.difficulty]}</small>
              </ListGroup.Item>
            ))}
            {data.results.length === 0 && (
              <div className="text-center py-3 text-muted small">Ничего не найдено</div>
            )}
          </ListGroup>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="outline-secondary" onClick={handleHide}>
          Отмена
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
