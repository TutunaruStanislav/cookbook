import { useState } from 'react';
import { Alert, Button, Card, Col, Container, Form, Row, Spinner } from 'react-bootstrap';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { z } from 'zod';
import { authApi } from '../api/auth';
import AppPagination from '../components/AppPagination';
import RecipeCard from '../components/RecipeCard';
import { useAuth } from '../contexts/AuthContext';
import { useRecipes } from '../hooks/useRecipes';
import { applyServerErrors } from '../utils/serverErrors';

const PAGE_SIZE = 12;

const nameSchema = z.object({
  first_name: z.string().max(150, 'Максимум 150 символов'),
  last_name: z.string().max(150, 'Максимум 150 символов'),
});
type NameForm = z.infer<typeof nameSchema>;

const passwordSchema = z
  .object({
    current_password: z.string().min(1, 'Введите текущий пароль'),
    new_password: z.string().min(8, 'Минимум 8 символов'),
    confirm: z.string(),
  })
  .refine((d) => d.new_password === d.confirm, {
    message: 'Пароли не совпадают',
    path: ['confirm'],
  });
type PasswordForm = z.infer<typeof passwordSchema>;

function DisplayNameSection() {
  const { user, updateUser } = useAuth();
  const [done, setDone] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<NameForm>({
    resolver: zodResolver(nameSchema),
    defaultValues: { first_name: user?.first_name ?? '', last_name: user?.last_name ?? '' },
  });

  const onSubmit = async (data: NameForm) => {
    setDone(false);
    setServerError(null);
    try {
      const { data: updated } = await authApi.updateMe(data);
      updateUser(updated);
      setDone(true);
    } catch (err: unknown) {
      setServerError(applyServerErrors(err, setError, ['first_name', 'last_name']));
    }
  };

  return (
    <Card className="shadow-sm border-0 mb-4">
      <Card.Body className="p-4">
        <h5 className="fw-semibold mb-3">Отображаемое имя</h5>

        {done && (
          <Alert variant="success" className="py-2" onClose={() => setDone(false)} dismissible>
            Имя обновлено.
          </Alert>
        )}
        {serverError && (
          <Alert variant="danger" className="py-2">
            {serverError}
          </Alert>
        )}

        <Form onSubmit={handleSubmit(onSubmit)} noValidate>
          <Row className="g-3 mb-3">
            <Col md={6}>
              <Form.Label>Имя</Form.Label>
              <Form.Control
                {...register('first_name')}
                placeholder="Алиса"
                isInvalid={!!errors.first_name}
              />
              <Form.Control.Feedback type="invalid">
                {errors.first_name?.message}
              </Form.Control.Feedback>
            </Col>
            <Col md={6}>
              <Form.Label>Фамилия</Form.Label>
              <Form.Control
                {...register('last_name')}
                placeholder="Петрова"
                isInvalid={!!errors.last_name}
              />
              <Form.Control.Feedback type="invalid">
                {errors.last_name?.message}
              </Form.Control.Feedback>
            </Col>
          </Row>
          <Button type="submit" variant="primary" disabled={isSubmitting}>
            {isSubmitting ? 'Сохранение...' : 'Сохранить имя'}
          </Button>
        </Form>
      </Card.Body>
    </Card>
  );
}

function ChangePasswordSection() {
  const [done, setDone] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<PasswordForm>({ resolver: zodResolver(passwordSchema) });

  const onSubmit = async (data: PasswordForm) => {
    setDone(false);
    setServerError(null);
    try {
      await authApi.changePassword(data.current_password, data.new_password);
      reset({ current_password: '', new_password: '', confirm: '' });
      setDone(true);
    } catch (err: unknown) {
      setServerError(applyServerErrors(err, setError, ['current_password', 'new_password']));
    }
  };

  return (
    <Card className="shadow-sm border-0 mb-4">
      <Card.Body className="p-4">
        <h5 className="fw-semibold mb-3">Сменить пароль</h5>

        {done && (
          <Alert variant="success" className="py-2" onClose={() => setDone(false)} dismissible>
            Пароль изменён.
          </Alert>
        )}
        {serverError && (
          <Alert variant="danger" className="py-2">
            {serverError}
          </Alert>
        )}

        <Form onSubmit={handleSubmit(onSubmit)} noValidate>
          <Form.Group className="mb-3">
            <Form.Label>Текущий пароль</Form.Label>
            <Form.Control
              {...register('current_password')}
              type="password"
              isInvalid={!!errors.current_password}
              autoComplete="current-password"
            />
            <Form.Control.Feedback type="invalid">
              {errors.current_password?.message}
            </Form.Control.Feedback>
          </Form.Group>

          <Row className="g-3 mb-3">
            <Col md={6}>
              <Form.Label>Новый пароль</Form.Label>
              <Form.Control
                {...register('new_password')}
                type="password"
                placeholder="Минимум 8 символов"
                isInvalid={!!errors.new_password}
                autoComplete="new-password"
              />
              <Form.Control.Feedback type="invalid">
                {errors.new_password?.message}
              </Form.Control.Feedback>
            </Col>
            <Col md={6}>
              <Form.Label>Подтверждение</Form.Label>
              <Form.Control
                {...register('confirm')}
                type="password"
                placeholder="Повторите новый пароль"
                isInvalid={!!errors.confirm}
                autoComplete="new-password"
              />
              <Form.Control.Feedback type="invalid">
                {errors.confirm?.message}
              </Form.Control.Feedback>
            </Col>
          </Row>
          <Button type="submit" variant="primary" disabled={isSubmitting}>
            {isSubmitting ? 'Сохранение...' : 'Сменить пароль'}
          </Button>
        </Form>
      </Card.Body>
    </Card>
  );
}

function MyRecipesSection({ authorId }: { authorId: number }) {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError } = useRecipes({ author: authorId, page });

  return (
    <Card className="shadow-sm border-0">
      <Card.Body className="p-4">
        <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
          <h5 className="fw-semibold mb-0">
            Мои рецепты{data ? <span className="text-muted"> ({data.count})</span> : null}
          </h5>
          <Link to="/recipes/new" className="btn btn-primary btn-sm">
            + Новый рецепт
          </Link>
        </div>

        {isLoading && (
          <div className="text-center py-4">
            <Spinner animation="border" variant="primary" />
          </div>
        )}

        {isError && (
          <Alert variant="danger">Не удалось загрузить рецепты.</Alert>
        )}

        {data && data.results.length === 0 && (
          <div className="text-center py-4 text-muted">
            <p className="mb-2">Вы ещё не создали ни одного рецепта.</p>
            <Link to="/recipes/new" className="btn btn-outline-primary btn-sm">
              Создать первый рецепт
            </Link>
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
              page={page}
              pageSize={PAGE_SIZE}
              onChange={setPage}
            />
          </>
        )}
      </Card.Body>
    </Card>
  );
}

export default function ProfilePage() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <Container className="py-4">
      <Row className="justify-content-center">
        <Col xs={12} lg={10} xl={9}>
          <div className="mb-4">
            <h4 className="fw-semibold mb-1">Профиль</h4>
            <div className="text-muted">
              <span className="me-3">
                Логин: <code>{user.username}</code>
              </span>
              {user.email && <span>E-mail: {user.email}</span>}
            </div>
          </div>

          <DisplayNameSection />
          <ChangePasswordSection />
          <MyRecipesSection authorId={user.id} />
        </Col>
      </Row>
    </Container>
  );
}
