import { useState } from 'react';
import { Alert, Button, Card, Col, Container, Form, Row } from 'react-bootstrap';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { authApi } from '../api/auth';
import { useAuth } from '../contexts/AuthContext';
import { applyServerErrors } from '../utils/serverErrors';

const SERVER_FIELDS = ['username', 'email', 'password', 'first_name', 'last_name'] as const;

const schema = z
  .object({
    username: z
      .string()
      .min(3, 'Минимум 3 символа')
      .max(150, 'Максимум 150 символов')
      .regex(/^[\w.@+-]+$/, 'Допустимы только буквы, цифры и символы . @ + - _'),
    email: z.string().email('Введите корректный e-mail').or(z.literal('')),
    first_name: z.string().max(150).optional(),
    last_name: z.string().max(150).optional(),
    password: z.string().min(8, 'Минимум 8 символов'),
    password2: z.string(),
  })
  .refine((d) => d.password === d.password2, {
    message: 'Пароли не совпадают',
    path: ['password2'],
  });

type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const onSubmit = async (data: FormData) => {
    setServerError(null);
    try {
      await authApi.register({
        username: data.username,
        email: data.email || '',
        password: data.password,
        first_name: data.first_name,
        last_name: data.last_name,
      });
      await login(data.username, data.password);
      navigate('/', { replace: true });
    } catch (err: unknown) {
      setServerError(applyServerErrors(err, setError, SERVER_FIELDS));
    }
  };

  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col xs={12} sm={10} md={8} lg={6}>
          <Card className="shadow-sm border-0">
            <Card.Body className="p-4 p-md-5">
              <h4 className="mb-4 text-center fw-semibold">Создать аккаунт</h4>

              {serverError && (
                <Alert variant="danger" className="py-2">
                  {serverError}
                </Alert>
              )}

              <Form onSubmit={handleSubmit(onSubmit)} noValidate>
                <Form.Group className="mb-3">
                  <Form.Label>
                    Имя пользователя <span className="text-danger">*</span>
                  </Form.Label>
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

                <Row className="g-3 mb-3">
                  <Col>
                    <Form.Label>Имя</Form.Label>
                    <Form.Control
                      {...register('first_name')}
                      placeholder="Алиса"
                      isInvalid={!!errors.first_name}
                    />
                  </Col>
                  <Col>
                    <Form.Label>Фамилия</Form.Label>
                    <Form.Control
                      {...register('last_name')}
                      placeholder="Петрова"
                      isInvalid={!!errors.last_name}
                    />
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label>E-mail</Form.Label>
                  <Form.Control
                    {...register('email')}
                    type="email"
                    placeholder="alice@example.com"
                    isInvalid={!!errors.email}
                    autoComplete="email"
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.email?.message}
                  </Form.Control.Feedback>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>
                    Пароль <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    {...register('password')}
                    type="password"
                    placeholder="Минимум 8 символов"
                    isInvalid={!!errors.password}
                    autoComplete="new-password"
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.password?.message}
                  </Form.Control.Feedback>
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label>
                    Подтверждение пароля <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    {...register('password2')}
                    type="password"
                    placeholder="Повторите пароль"
                    isInvalid={!!errors.password2}
                    autoComplete="new-password"
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.password2?.message}
                  </Form.Control.Feedback>
                </Form.Group>

                <Button
                  type="submit"
                  variant="primary"
                  className="w-100"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Регистрация...' : 'Зарегистрироваться'}
                </Button>
              </Form>

              <div className="text-center mt-3">
                <small className="text-muted">
                  Уже есть аккаунт?{' '}
                  <Link to="/login" className="text-decoration-none">
                    Войти
                  </Link>
                </small>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}
