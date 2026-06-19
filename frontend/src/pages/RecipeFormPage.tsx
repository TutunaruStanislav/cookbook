import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Badge,
  Button,
  Card,
  Col,
  Container,
  Form,
  ListGroup,
  Row,
  Spinner,
} from 'react-bootstrap';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useParams } from 'react-router-dom';
import { z } from 'zod';
import { useCategories, useIngredients, useRecipe, useTags } from '../hooks/useRecipes';
import { useCreateRecipe, useUpdateRecipe, useUploadRecipePhoto } from '../hooks/useRecipes';
import type { Ingredient } from '../types';
import { UNIT_LABELS } from '../types';
import { applyServerErrors } from '../utils/serverErrors';

// Scalar fields whose server-side errors map directly onto form inputs.
const RECIPE_SERVER_FIELDS = [
  'title',
  'description',
  'cooking_time',
  'servings',
  'difficulty',
] as const;

// ── Zod schema ────────────────────────────────────────────────────────────────

const ingredientRow = z.object({
  ingredientId: z.number().int().positive(),
  ingredientName: z.string().min(1),
  amount: z.coerce.number().positive('Количество должно быть > 0'),
  unit: z.enum(['g', 'ml', 'pcs', 'tbsp', 'tsp', 'kg', 'l', 'pinch']),
});

const stepRow = z.object({
  text: z.string().min(5, 'Минимум 5 символов'),
});

const schema = z.object({
  title: z.string().min(3, 'Минимум 3 символа').max(255, 'Максимум 255 символов'),
  description: z.string().min(10, 'Минимум 10 символов'),
  cooking_time: z.coerce.number().int().min(1, 'Укажите время'),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  servings: z.coerce.number().int().min(1, 'Минимум 1 порция'),
  is_public: z.boolean(),
  categories: z.array(z.number()).default([]),
  tags: z.array(z.number()).default([]),
  ingredients: z.array(ingredientRow).default([]),
  steps: z.array(stepRow).default([]),
});

type FormData = z.infer<typeof schema>;

// ── Ingredient search combobox ────────────────────────────────────────────────

interface IngredientSearchProps {
  onSelect: (ing: Ingredient) => void;
}

function IngredientSearch({ onSelect }: IngredientSearchProps) {
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

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <Form.Control
        placeholder="Введите название ингредиента (мин. 2 символа)..."
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
        }}
        onFocus={() => q.length >= 2 && setOpen(true)}
        size="sm"
      />
      {open && q.length >= 2 && data && data.results.length > 0 && (
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
          {data.results.map((ing) => (
            <ListGroup.Item
              key={ing.id}
              action
              onClick={() => {
                onSelect(ing);
                setQ('');
                setOpen(false);
              }}
            >
              {ing.name}
            </ListGroup.Item>
          ))}
        </ListGroup>
      )}
      {open && q.length >= 2 && (!data || data.results.length === 0) && (
        <div className="border rounded bg-white p-2 small text-muted" style={{ position: 'absolute', width: '100%', zIndex: 1050 }}>
          Ничего не найдено
        </div>
      )}
    </div>
  );
}

// ── Main form page ────────────────────────────────────────────────────────────

export default function RecipeFormPage() {
  const { id } = useParams<{ id?: string }>();
  const isEdit = !!id;
  const recipeId = Number(id) || 0;
  const navigate = useNavigate();

  const { data: existing, isLoading: loadingRecipe } = useRecipe(recipeId);
  const { data: categories } = useCategories();
  const { data: tags } = useTags();

  const createRecipe = useCreateRecipe();
  const updateRecipe = useUpdateRecipe(recipeId);
  const uploadPhoto = useUploadRecipePhoto();

  const [serverError, setServerError] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);

  // Show a local preview of the picked file (revoke the object URL on change).
  useEffect(() => {
    if (!photoFile) {
      setPhotoPreview(null);
      return;
    }
    const url = URL.createObjectURL(photoFile);
    setPhotoPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [photoFile]);

  const onPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (file) {
      if (!file.type.startsWith('image/')) {
        setPhotoError('Файл должен быть изображением.');
        e.target.value = '';
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setPhotoError('Максимальный размер файла — 5 МБ.');
        e.target.value = '';
        return;
      }
    }
    setPhotoError(null);
    setPhotoFile(file);
  };

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      difficulty: 'medium',
      is_public: true,
      servings: 4,
      cooking_time: 30,
      categories: [],
      tags: [],
      ingredients: [],
      steps: [],
    },
  });

  const {
    fields: ingFields,
    append: appendIng,
    remove: removeIng,
  } = useFieldArray({ control, name: 'ingredients' });

  const {
    fields: stepFields,
    append: appendStep,
    remove: removeStep,
  } = useFieldArray({ control, name: 'steps' });

  // Pre-fill form when editing
  useEffect(() => {
    if (!existing || !isEdit) return;
    reset({
      title: existing.title,
      description: existing.description,
      cooking_time: existing.cooking_time,
      difficulty: existing.difficulty,
      servings: existing.servings,
      is_public: existing.is_public,
      categories: existing.categories.map((c) => c.id),
      tags: existing.tags.map((t) => t.id),
      ingredients: existing.ingredients.map((ri) => ({
        ingredientId: ri.ingredient.id,
        ingredientName: ri.ingredient.name,
        amount: ri.amount,
        unit: ri.unit as FormData['ingredients'][0]['unit'],
      })),
      steps: existing.steps.map((s) => ({ text: s.text })),
    });
  }, [existing, isEdit, reset]);

  const selectedCategories = watch('categories');
  const selectedTags = watch('tags');

  const toggleCategory = (id: number) => {
    const cur = selectedCategories;
    setValue('categories', cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]);
  };

  const toggleTag = (id: number) => {
    const cur = selectedTags;
    setValue('tags', cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]);
  };

  const onSubmit = async (data: FormData) => {
    setServerError(null);
    const payload = {
      title: data.title,
      description: data.description,
      cooking_time: data.cooking_time,
      difficulty: data.difficulty,
      servings: data.servings,
      is_public: data.is_public,
      categories: data.categories,
      tags: data.tags,
      ingredients: data.ingredients.map(({ ingredientId, amount, unit }) => ({
        ingredient: ingredientId,
        amount,
        unit,
      })),
      steps: data.steps.map(({ text }, i) => ({ order: i + 1, text })),
    };

    try {
      const result = isEdit
        ? await updateRecipe.mutateAsync(payload)
        : await createRecipe.mutateAsync(payload);
      if (photoFile) {
        await uploadPhoto.mutateAsync({ id: result.id, file: photoFile });
      }
      navigate(`/recipes/${result.id}`);
    } catch (e: unknown) {
      setServerError(applyServerErrors(e, setError, RECIPE_SERVER_FIELDS));
    }
  };

  if (isEdit && loadingRecipe) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="primary" />
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <h4 className="fw-semibold mb-4">{isEdit ? 'Редактировать рецепт' : 'Новый рецепт'}</h4>

      {serverError && <Alert variant="danger">{serverError}</Alert>}

      <Form onSubmit={handleSubmit(onSubmit)} noValidate>
        <Row className="g-4">
          {/* Left column: main fields */}
          <Col xs={12} lg={8}>
            <Card className="border-0 shadow-sm mb-4">
              <Card.Body className="p-4">
                <h6 className="fw-semibold mb-3">Основная информация</h6>

                <Form.Group className="mb-3">
                  <Form.Label>Название *</Form.Label>
                  <Form.Control
                    {...register('title')}
                    placeholder="Борщ классический"
                    isInvalid={!!errors.title}
                  />
                  <Form.Control.Feedback type="invalid">{errors.title?.message}</Form.Control.Feedback>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Описание *</Form.Label>
                  <Form.Control
                    {...register('description')}
                    as="textarea"
                    rows={3}
                    placeholder="Краткое описание рецепта..."
                    isInvalid={!!errors.description}
                  />
                  <Form.Control.Feedback type="invalid">{errors.description?.message}</Form.Control.Feedback>
                </Form.Group>

                <Row className="g-3">
                  <Col xs={6} md={4}>
                    <Form.Group>
                      <Form.Label>Время (мин) *</Form.Label>
                      <Form.Control
                        {...register('cooking_time')}
                        type="number"
                        min={1}
                        isInvalid={!!errors.cooking_time}
                      />
                      <Form.Control.Feedback type="invalid">{errors.cooking_time?.message}</Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  <Col xs={6} md={4}>
                    <Form.Group>
                      <Form.Label>Порций *</Form.Label>
                      <Form.Control
                        {...register('servings')}
                        type="number"
                        min={1}
                        isInvalid={!!errors.servings}
                      />
                      <Form.Control.Feedback type="invalid">{errors.servings?.message}</Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  <Col xs={12} md={4}>
                    <Form.Group>
                      <Form.Label>Сложность *</Form.Label>
                      <Form.Select {...register('difficulty')} isInvalid={!!errors.difficulty}>
                        <option value="easy">Лёгкий</option>
                        <option value="medium">Средний</option>
                        <option value="hard">Сложный</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mt-3">
                  <Form.Check
                    {...register('is_public')}
                    type="switch"
                    label="Публичный рецепт"
                    id="is-public"
                  />
                </Form.Group>
              </Card.Body>
            </Card>

            {/* Ingredients */}
            <Card className="border-0 shadow-sm mb-4">
              <Card.Body className="p-4">
                <h6 className="fw-semibold mb-3">Ингредиенты</h6>

                {ingFields.map((field, i) => (
                  <Row key={field.id} className="g-2 align-items-center mb-2">
                    <Col xs={5}>
                      <Form.Control
                        value={field.ingredientName}
                        disabled
                        size="sm"
                        className="bg-light"
                      />
                    </Col>
                    <Col xs={3}>
                      <Form.Control
                        {...register(`ingredients.${i}.amount`)}
                        type="number"
                        step="0.01"
                        min="0.01"
                        size="sm"
                        placeholder="Кол-во"
                        isInvalid={!!errors.ingredients?.[i]?.amount}
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.ingredients?.[i]?.amount?.message}
                      </Form.Control.Feedback>
                    </Col>
                    <Col xs={3}>
                      <Form.Select {...register(`ingredients.${i}.unit`)} size="sm">
                        {Object.entries(UNIT_LABELS).map(([k, v]) => (
                          <option key={k} value={k}>
                            {v}
                          </option>
                        ))}
                      </Form.Select>
                    </Col>
                    <Col xs={1}>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => removeIng(i)}
                        title="Удалить"
                      >
                        ×
                      </Button>
                    </Col>
                  </Row>
                ))}

                <div className="mt-3">
                  <IngredientSearch
                    onSelect={(ing) =>
                      appendIng({ ingredientId: ing.id, ingredientName: ing.name, amount: 0, unit: 'g' })
                    }
                  />
                </div>
              </Card.Body>
            </Card>

            {/* Steps */}
            <Card className="border-0 shadow-sm">
              <Card.Body className="p-4">
                <h6 className="fw-semibold mb-3">Шаги приготовления</h6>

                {stepFields.map((field, i) => (
                  <div key={field.id} className="d-flex gap-2 mb-2 align-items-start">
                    <span className="mt-2 text-muted fw-semibold" style={{ minWidth: 24 }}>
                      {i + 1}.
                    </span>
                    <div className="flex-grow-1">
                      <Form.Control
                        {...register(`steps.${i}.text`)}
                        as="textarea"
                        rows={2}
                        placeholder={`Шаг ${i + 1}...`}
                        isInvalid={!!errors.steps?.[i]?.text}
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.steps?.[i]?.text?.message}
                      </Form.Control.Feedback>
                    </div>
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => removeStep(i)}
                      title="Удалить шаг"
                    >
                      ×
                    </Button>
                  </div>
                ))}

                <Button
                  variant="outline-secondary"
                  size="sm"
                  className="mt-2"
                  onClick={() => appendStep({ text: '' })}
                >
                  + Добавить шаг
                </Button>
              </Card.Body>
            </Card>
          </Col>

          {/* Right column: photo, categories, tags */}
          <Col xs={12} lg={4}>
            <Card className="border-0 shadow-sm mb-4">
              <Card.Body className="p-4">
                <h6 className="fw-semibold mb-3">Фото</h6>
                {(photoPreview || existing?.photo) && (
                  <img
                    src={photoPreview ?? existing?.photo ?? undefined}
                    alt="Превью рецепта"
                    className="img-fluid rounded mb-3 w-100"
                    style={{ maxHeight: 200, objectFit: 'cover' }}
                  />
                )}
                <Form.Control
                  type="file"
                  accept="image/*"
                  onChange={onPhotoChange}
                  isInvalid={!!photoError}
                  size="sm"
                />
                <Form.Control.Feedback type="invalid">{photoError}</Form.Control.Feedback>
                <Form.Text className="text-muted">
                  JPG/PNG, до 5 МБ.{' '}
                  {isEdit && existing?.photo
                    ? 'Загрузка заменит текущее фото.'
                    : 'Необязательно.'}
                </Form.Text>
              </Card.Body>
            </Card>

            <Card className="border-0 shadow-sm mb-4">
              <Card.Body className="p-4">
                <h6 className="fw-semibold mb-3">Категории</h6>
                <div className="d-flex flex-wrap gap-2">
                  {categories?.map((c) => (
                    <Badge
                      key={c.id}
                      bg={selectedCategories.includes(c.id) ? 'primary' : 'light'}
                      text={selectedCategories.includes(c.id) ? undefined : 'dark'}
                      className="border fw-normal fs-6 cursor-pointer"
                      style={{ cursor: 'pointer' }}
                      onClick={() => toggleCategory(c.id)}
                    >
                      {c.name}
                    </Badge>
                  ))}
                </div>
              </Card.Body>
            </Card>

            <Card className="border-0 shadow-sm mb-4">
              <Card.Body className="p-4">
                <h6 className="fw-semibold mb-3">Теги</h6>
                <div className="d-flex flex-wrap gap-2">
                  {tags?.map((t) => (
                    <Badge
                      key={t.id}
                      bg={selectedTags.includes(t.id) ? 'secondary' : 'light'}
                      text={selectedTags.includes(t.id) ? undefined : 'dark'}
                      className="border fw-normal fs-6"
                      style={{ cursor: 'pointer' }}
                      onClick={() => toggleTag(t.id)}
                    >
                      #{t.name}
                    </Badge>
                  ))}
                </div>
              </Card.Body>
            </Card>

            <Button
              type="submit"
              variant="primary"
              className="w-100"
              size="lg"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Сохранение...' : isEdit ? 'Сохранить изменения' : 'Создать рецепт'}
            </Button>

            <Button
              variant="outline-secondary"
              className="w-100 mt-2"
              onClick={() => navigate(-1)}
            >
              Отмена
            </Button>
          </Col>
        </Row>
      </Form>
    </Container>
  );
}
