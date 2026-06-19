import { useState } from 'react';
import {
  Alert,
  Badge,
  Button,
  ButtonGroup,
  Col,
  Container,
  ListGroup,
  Row,
  Spinner,
  Table,
} from 'react-bootstrap';
import { Link, useNavigate, useParams } from 'react-router-dom';
import CommentsSection from '../components/CommentsSection';
import InteractiveStarRating from '../components/InteractiveStarRating';
import { useAuth } from '../contexts/AuthContext';
import { useDeleteRecipe, useFavoriteToggle, useRecipe } from '../hooks/useRecipes';
import { DIFFICULTY_LABELS, UNIT_LABELS } from '../types';

export default function RecipeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const recipeId = Number(id);
  const navigate = useNavigate();
  const { user } = useAuth();

  const [servings, setServings] = useState<number | undefined>(undefined);
  const { data: recipe, isLoading, isError } = useRecipe(recipeId, servings);
  const favToggle = useFavoriteToggle();
  const deleteRecipe = useDeleteRecipe();

  if (isLoading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="primary" />
      </Container>
    );
  }

  if (isError || !recipe) {
    return (
      <Container className="py-5">
        <Alert variant="danger">Рецепт не найден или недоступен.</Alert>
        <Link to="/recipes" className="btn btn-outline-secondary">
          К списку рецептов
        </Link>
      </Container>
    );
  }

  const isAuthor = user?.id === recipe.author.id;
  const baseServings = recipe.servings;
  const displayServings = servings ?? baseServings;

  const authorName =
    recipe.author.first_name
      ? `${recipe.author.first_name} ${recipe.author.last_name}`.trim()
      : recipe.author.username;

  const handleDelete = async () => {
    if (!window.confirm(`Удалить рецепт «${recipe.title}»? Это действие нельзя отменить.`)) return;
    await deleteRecipe.mutateAsync(recipe.id);
    navigate('/recipes');
  };

  return (
    <Container className="py-4">
      <Row className="g-4">
        {/* Left column: photo + meta */}
        <Col xs={12} lg={4}>
          {recipe.photo ? (
            <img
              src={recipe.photo}
              alt={recipe.title}
              className="img-fluid rounded shadow-sm w-100"
              style={{ maxHeight: 360, objectFit: 'cover' }}
            />
          ) : (
            <div
              className="rounded shadow-sm w-100 d-flex align-items-center justify-content-center bg-secondary bg-opacity-10"
              style={{ height: 260, fontSize: '4rem', color: '#adb5bd' }}
            >
              {recipe.title.charAt(0)}
            </div>
          )}

          {/* Meta card */}
          <ListGroup variant="flush" className="mt-3 border rounded">
            <ListGroup.Item className="d-flex justify-content-between">
              <span className="text-muted">Автор</span>
              <strong>{authorName}</strong>
            </ListGroup.Item>
            <ListGroup.Item className="d-flex justify-content-between">
              <span className="text-muted">Сложность</span>
              <strong>{DIFFICULTY_LABELS[recipe.difficulty]}</strong>
            </ListGroup.Item>
            <ListGroup.Item className="d-flex justify-content-between">
              <span className="text-muted">Время</span>
              <strong>{recipe.cooking_time} мин</strong>
            </ListGroup.Item>
            <ListGroup.Item>
              <div className="text-muted mb-1">Рейтинг</div>
              <InteractiveStarRating
                recipeId={recipe.id}
                avgRating={recipe.avg_rating}
                ratingsCount={recipe.ratings_count}
              />
            </ListGroup.Item>
            {!recipe.is_public && (
              <ListGroup.Item>
                <Badge bg="secondary">Приватный рецепт</Badge>
              </ListGroup.Item>
            )}
          </ListGroup>

          {/* Categories + Tags */}
          {recipe.categories.length > 0 && (
            <div className="mt-3 d-flex flex-wrap gap-1">
              {recipe.categories.map((c) => (
                <Badge key={c.id} bg="primary" className="fw-normal">
                  {c.name}
                </Badge>
              ))}
            </div>
          )}
          {recipe.tags.length > 0 && (
            <div className="mt-2 d-flex flex-wrap gap-1">
              {recipe.tags.map((t) => (
                <Link
                  key={t.id}
                  to={`/recipes?tag=${encodeURIComponent(t.slug)}`}
                  className="text-decoration-none"
                  title={`Рецепты с тегом «${t.name}»`}
                >
                  <Badge bg="light" text="dark" className="border fw-normal">
                    #{t.name}
                  </Badge>
                </Link>
              ))}
            </div>
          )}

          {/* Action buttons */}
          <div className="mt-3 d-flex gap-2 flex-wrap">
            {user && (
              <Button
                variant={recipe.is_favorited ? 'danger' : 'outline-danger'}
                size="sm"
                onClick={() => favToggle.mutate(recipe.id)}
                disabled={favToggle.isPending}
              >
                {recipe.is_favorited ? '♥ В избранном' : '♡ В избранное'}
              </Button>
            )}
            {isAuthor && (
              <>
                <Link
                  to={`/recipes/${recipe.id}/edit`}
                  className="btn btn-outline-secondary btn-sm"
                >
                  Редактировать
                </Link>
                <Button
                  variant="outline-danger"
                  size="sm"
                  onClick={handleDelete}
                  disabled={deleteRecipe.isPending}
                >
                  Удалить
                </Button>
              </>
            )}
          </div>
        </Col>

        {/* Right column: content */}
        <Col xs={12} lg={8}>
          <h2 className="fw-bold mb-1">{recipe.title}</h2>
          <p className="text-muted mb-4">{recipe.description}</p>

          {/* Servings control */}
          <div className="d-flex align-items-center gap-3 mb-4">
            <span className="fw-semibold">Порций:</span>
            <ButtonGroup size="sm">
              <Button
                variant="outline-secondary"
                onClick={() => setServings(Math.max(1, displayServings - 1))}
                disabled={displayServings <= 1}
              >
                –
              </Button>
              <Button variant="outline-secondary" disabled style={{ minWidth: 40 }}>
                {displayServings}
              </Button>
              <Button
                variant="outline-secondary"
                onClick={() => setServings(displayServings + 1)}
              >
                +
              </Button>
            </ButtonGroup>
            {servings && servings !== baseServings && (
              <Button
                variant="link"
                size="sm"
                className="p-0 text-muted"
                onClick={() => setServings(undefined)}
              >
                (сброс до {baseServings})
              </Button>
            )}
          </div>

          {/* Ingredients */}
          {recipe.ingredients.length > 0 && (
            <section className="mb-4">
              <h5 className="fw-semibold mb-3">Ингредиенты</h5>
              <Table hover size="sm" className="mb-0">
                <tbody>
                  {recipe.ingredients.map((ri) => (
                    <tr key={ri.id}>
                      <td>{ri.ingredient.name}</td>
                      <td className="text-end text-nowrap">
                        <strong>
                          {ri.scaled_amount % 1 === 0
                            ? ri.scaled_amount
                            : ri.scaled_amount.toFixed(2)}
                        </strong>{' '}
                        {UNIT_LABELS[ri.unit] ?? ri.unit}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </section>
          )}

          {/* Steps */}
          {recipe.steps.length > 0 && (
            <section>
              <h5 className="fw-semibold mb-3">Шаги приготовления</h5>
              <ol className="ps-3">
                {recipe.steps.map((step) => (
                  <li key={step.id} className="mb-3">
                    <p className="mb-0">{step.text}</p>
                  </li>
                ))}
              </ol>
            </section>
          )}

          <CommentsSection recipeId={recipe.id} recipeAuthorId={recipe.author.id} />
        </Col>
      </Row>

      <div className="mt-4">
        <Link to="/recipes" className="text-decoration-none text-muted small">
          ← Все рецепты
        </Link>
      </div>
    </Container>
  );
}
