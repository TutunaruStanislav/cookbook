interface Props {
  value: number | null;
  count?: number;
  size?: 'sm' | 'md';
}

export default function StarRating({ value, count, size = 'sm' }: Props) {
  const filled = Math.round(value ?? 0);
  const fontSize = size === 'sm' ? '0.85rem' : '1.1rem';

  return (
    <span className="d-inline-flex align-items-center gap-1" style={{ fontSize }}>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} style={{ color: i < filled ? '#ffc107' : '#dee2e6' }}>
          &#9733;
        </span>
      ))}
      {value != null && (
        <span className="text-muted ms-1" style={{ fontSize: '0.8em' }}>
          {value.toFixed(1)}
          {count != null && ` (${count})`}
        </span>
      )}
    </span>
  );
}
