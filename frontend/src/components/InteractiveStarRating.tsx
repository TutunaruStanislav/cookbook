import { useState } from 'react';
import { Spinner } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';
import { useRateRecipe } from '../hooks/useSocial';
import StarRating from './StarRating';

interface Props {
  recipeId: number;
  avgRating: number | null;
  ratingsCount: number;
}

export default function InteractiveStarRating({ recipeId, avgRating, ratingsCount }: Props) {
  const { user } = useAuth();
  const [hovered, setHovered] = useState<number | null>(null);
  const [myRating, setMyRating] = useState<number | null>(null);
  const rateRecipe = useRateRecipe();

  const handleClick = async (value: number) => {
    if (rateRecipe.isPending) return;
    const result = await rateRecipe.mutateAsync({ id: recipeId, value });
    setMyRating(result.value);
  };

  if (!user) {
    return (
      <div>
        <StarRating value={avgRating} count={ratingsCount} size="md" />
        <small className="text-muted d-block mt-1">Войдите, чтобы оценить</small>
      </div>
    );
  }

  const displayValue = hovered ?? myRating ?? 0;

  return (
    <div>
      <div className="d-flex align-items-center gap-1 mb-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <span
            key={i}
            role="button"
            aria-label={`Оценить на ${i}`}
            style={{
              cursor: rateRecipe.isPending ? 'default' : 'pointer',
              fontSize: '1.4rem',
              lineHeight: 1,
              color: i <= displayValue ? '#ffc107' : '#dee2e6',
              transition: 'color 0.1s',
              userSelect: 'none',
            }}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
            onClick={() => handleClick(i)}
          >
            ★
          </span>
        ))}
        {rateRecipe.isPending && <Spinner size="sm" animation="border" className="ms-1" />}
      </div>

      {myRating !== null && !rateRecipe.isPending && (
        <small className="text-success d-block mb-1">Ваша оценка: {myRating}</small>
      )}

      <StarRating value={avgRating} count={ratingsCount} size="sm" />
    </div>
  );
}
