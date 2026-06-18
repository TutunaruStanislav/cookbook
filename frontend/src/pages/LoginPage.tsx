import { useState } from 'react';
import { Alert, Button, Card, Container, Form } from 'react-bootstrap';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useAuth } from '../contexts/AuthContext';

const schema = z.object({
  username: z.string().min(1, 'Введите имя пользователя'),
  password: z.string().min(1, 'Введите пароль'),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [serverError, setServerError] = useState<string | null>(null);

  const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname ?? '/';

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  if (isAuthenticated) {
    return <Navigate to={from} replace />;
  }

  const onSubmit = async (data: FormData) => {
    setServerError(null);
    try {
      await login(data.username, data.password);
      navigate(from, { replace: true });
    } catch {
      setServerError('Неверное имя пользователя или пароль.');
    }
  };

  return (
    <Container
      className="d-flex justify-content-center align-items-center"
      style={{ minHeight: '80vh' }}
    >
      <Card style={{ width: '100%', maxWidth: 420 }} className="shadow-sm border-0">
        <Card.Body className="p-4 p-md-5">
          <h4 className="mb-4 text-center fw-semibold">Войти в аккаунт</h4>

          {serverError && (
            <Alert variant="danger" className="py-2">
              {serverError}
            </Alert>
          )}

          <Form onSubmit={handleSubmit(onSubmit)} noValidate>
            <Form.Group className="mb-3">
              <Form.Label>Имя пользователя</Form.Label>
              <Form.Control
                {...register('username')}
                placeholder="alice"
                isInvalid={!!errors.username}
                autoComplete="username"
              />
              <Form.Control.Feedback type="invalid">
                {errors.username?.message}
              </Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-4">
              <Form.Label>Пароль</Form.Label>
              <Form.Control
                {...register('password')}
                type="password"
                placeholder="••••••••"
                isInvalid={!!errors.password}
                autoComplete="current-password"
              />
              <Form.Control.Feedback type="invalid">
                {errors.password?.message}
              </Form.Control.Feedback>
            </Form.Group>

            <Button
              type="submit"
              variant="primary"
              className="w-100"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Вход...' : 'Войти'}
            </Button>
          </Form>

          <div className="text-center mt-3">
            <small className="text-muted">
              Нет аккаунта?{' '}
              <Link to="/register" className="text-decoration-none">
                Зарегистрироваться
              </Link>
            </small>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
}
