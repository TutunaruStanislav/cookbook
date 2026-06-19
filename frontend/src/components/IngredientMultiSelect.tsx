import { useEffect, useRef, useState } from 'react';
import { Badge, Form, ListGroup } from 'react-bootstrap';
import { useIngredients } from '../hooks/useRecipes';

interface Props {
  /** Selected ingredient names. */
  value: string[];
  onChange: (names: string[]) => void;
}

/**
 * Ingredient picker for the «что приготовить из…» search. Suggestions come from
 * the real ingredient catalogue, so the user always selects names that exist in
 * the data — sidestepping Russian word-form mismatches (e.g. «курица» vs
 * «куриное филе») that a free-text icontains search would miss.
 */
export default function IngredientMultiSelect({ value, onChange }: Props) {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const { data } = useIngredients(q);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const add = (name: string) => {
    if (!value.includes(name)) onChange([...value, name]);
    setQ('');
    setOpen(false);
  };

  const remove = (name: string) => onChange(value.filter((n) => n !== name));

  const suggestions = (data?.results ?? []).filter((ing) => !value.includes(ing.name));

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <Form.Control
        placeholder="Что приготовить из… (начните вводить ингредиент)"
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
        }}
        onFocus={() => q.length >= 2 && setOpen(true)}
      />

      {open && q.length >= 2 && suggestions.length > 0 && (
        <ListGroup
          style={{
            position: 'absolute',
            zIndex: 1050,
            width: '100%',
            maxHeight: 220,
            overflowY: 'auto',
            boxShadow: '0 4px 12px rgba(0,0,0,.15)',
          }}
        >
          {suggestions.map((ing) => (
            <ListGroup.Item key={ing.id} action onClick={() => add(ing.name)}>
              {ing.name}
            </ListGroup.Item>
          ))}
        </ListGroup>
      )}

      {open && q.length >= 2 && suggestions.length === 0 && (
        <div
          className="border rounded bg-white p-2 small text-muted"
          style={{ position: 'absolute', width: '100%', zIndex: 1050 }}
        >
          Ничего не найдено
        </div>
      )}

      {value.length > 0 && (
        <div className="d-flex flex-wrap gap-1 mt-2">
          {value.map((name) => (
            <Badge
              key={name}
              bg="primary"
              className="fw-normal"
              style={{ cursor: 'pointer' }}
              onClick={() => remove(name)}
              title="Убрать ингредиент"
            >
              {name} ×
            </Badge>
          ))}
        </div>
      )}

      <Form.Text className="text-muted">
        Найдём рецепты, где есть все выбранные ингредиенты.
      </Form.Text>
    </div>
  );
}
