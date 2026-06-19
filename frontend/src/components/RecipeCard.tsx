import { Badge, Button, Card } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useFavoriteToggle } from '../hooks/useRecipes';
import type { RecipeList } from '../types';
import { DIFFICULTY_LABELS } from '../types';
import { useAuth } from '../contexts/AuthContext';
import StarRating from './StarRating';

const DIFFICULTY_VARIANT: Record<string, string> = {
  easy: 'success',
  medium: 'warning',
  hard: 'danger',
};

interface Props {
  recipe: RecipeList;
}

export default function RecipeCard({ recipe }: Props) {
  const { isAuthenticated } = useAuth();
  const favToggle = useFavoriteToggle();

  const authorName =
    recipe.author.first_name
      ? `${recipe.author.first_name} ${recipe.author.last_name}`.trim()
      : recipe.author.username;

  const handleFav = (e: React.MouseEvent) => {
    // Stop the card's stretched-link from hijacking the click → navigating away.
    e.preventDefault();
    e.stopPropagation();
    favToggle.mutate(recipe.id);
  };

  return (
    <Card className="h-100 shadow-sm border-0 recipe-card">
      {/* Photo */}
      <div style={{ height: 180, overflow: 'hidden', position: 'relative' }}>
        {recipe.photo ? (
          <Card.Img
            variant="top"
            src={recipe.photo}
            alt={recipe.title}
            style={{ objectFit: 'cover', height: '100%', width: '100%' }}
          />
        ) : (
          <div
            className="w-100 h-100 d-flex align-items-center justify-content-center bg-secondary bg-opacity-10"
            style={{ fontSize: '2rem', color: '#adb5bd' }}
          >
            {recipe.title.charAt(0).toUpperCase()}
          </div>
        )}
        {!recipe.is_public && (
          <Badge bg="secondary" className="position-absolute top-0 end-0 m-2">
            Приватный
          </Badge>
        )}
        {isAuthenticated && (
          <Button
            variant="link"
            size="sm"
            className="position-absolute top-0 start-0 m-2 p-0 d-flex align-items-center justify-content-center"
            onClick={handleFav}
            disabled={favToggle.isPending}
            title={recipe.is_favorited ? 'Убрать из избранного' : 'В избранное'}
            style={{
              zIndex: 2, // above the title's stretched-link overlay so the click lands here
              width: 34,
              height: 34,
              borderRadius: '50%',
              backgroundColor: 'rgba(255,255,255,0.85)',
              boxShadow: '0 1px 3px rgba(0,0,0,.2)',
              color: recipe.is_favorited ? '#dc3545' : '#6c757d',
              fontSize: '1.2rem',
              lineHeight: 1,
              textDecoration: 'none',
            }}
          >
            {recipe.is_favorited ? '♥' : '♡'}
          </Button>
        )}
      </div>

      <Card.Body className="d-flex flex-column p-3">
        {/* Title */}
        <Card.Title className="fs-6 fw-semibold mb-1">
          <Link to={`/recipes/${recipe.id}`} className="text-decoration-none text-dark stretched-link">
            {recipe.title}
          </Link>
        </Card.Title>

        {/* Author */}
        <small className="text-muted mb-2">{authorName}</small>

        {/* Meta row */}
        <div className="d-flex align-items-center gap-2 mb-2 flex-wrap">
          <Badge bg={DIFFICULTY_VARIANT[recipe.difficulty] ?? 'secondary'} className="fw-normal">
            {DIFFICULTY_LABELS[recipe.difficulty]}
          </Badge>
          <small className="text-muted">{recipe.cooking_time} мин</small>
        </div>

        {/* Categories */}
        {recipe.categories.length > 0 && (
          <div className="mb-2 d-flex flex-wrap gap-1">
            {recipe.categories.slice(0, 2).map((c) => (
              <Badge key={c.id} bg="light" text="dark" className="border fw-normal">
                {c.name}
              </Badge>
            ))}
            {recipe.categories.length > 2 && (
              <Badge bg="light" text="muted" className="border fw-normal">
                +{recipe.categories.length - 2}
              </Badge>
            )}
          </div>
        )}

        {/* Rating */}
        <div className="mt-auto pt-2">
          {recipe.avg_rating != null ? (
            <StarRating value={recipe.avg_rating} count={recipe.ratings_count} />
          ) : (
            <small className="text-muted">Нет оценок</small>
          )}
        </div>
      </Card.Body>
    </Card>
  );
}
