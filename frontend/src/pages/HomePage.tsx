import { Card, Col, Container, Row } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const FEATURES = [
  {
    title: 'Рецепты',
    text: 'Более 25 рецептов с пошаговыми инструкциями, фотографиями и списком ингредиентов. Фильтрация по категориям, тегам и сложности.',
    link: '/recipes',
    label: 'Смотреть рецепты',
  },
  {
    title: 'Планировщик меню',
    text: 'Составляйте план питания на неделю: перетаскивайте рецепты в ячейки сетки. Готовый список покупок генерируется автоматически.',
    link: '/planner',
    label: 'Открыть планировщик',
    requiresAuth: true,
  },
  {
    title: 'Дашборд',
    text: 'Статистика рецептов: топ по рейтингу и избранному, распределение по категориям и сложности, самые популярные теги.',
    link: '/dashboard',
    label: 'Смотреть статистику',
  },
];

export default function HomePage() {
  const { isAuthenticated } = useAuth();

  return (
    <>
      {/* Hero */}
      <div className="bg-dark text-white py-5">
        <Container className="text-center py-3">
          <h1 className="display-4 fw-bold mb-3">Кулинарная книга рецептов</h1>
          <p className="lead mb-4 text-secondary">
            Создавайте, ищите и планируйте любимые блюда. Генерируйте список покупок одним кликом.
          </p>
          <div className="d-flex gap-3 justify-content-center flex-wrap">
            <Link to="/recipes" className="btn btn-primary btn-lg">
              Смотреть рецепты
            </Link>
            {!isAuthenticated && (
              <Link to="/register" className="btn btn-outline-light btn-lg">
                Создать аккаунт
              </Link>
            )}
          </div>
        </Container>
      </div>

      {/* Features */}
      <Container className="py-5">
        <Row className="g-4">
          {FEATURES.map((f) => (
            <Col key={f.title} md={4}>
              <Card className="h-100 shadow-sm border-0">
                <Card.Body className="d-flex flex-column p-4">
                  <Card.Title className="fw-semibold mb-2">{f.title}</Card.Title>
                  <Card.Text className="text-muted flex-grow-1">{f.text}</Card.Text>
                  {f.requiresAuth && !isAuthenticated ? (
                    <Link to="/login" className="btn btn-outline-secondary">
                      Войти для доступа
                    </Link>
                  ) : (
                    <Link to={f.link} className="btn btn-outline-primary">
                      {f.label}
                    </Link>
                  )}
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      </Container>

      {/* Seed accounts hint */}
      <Container className="pb-5">
        <div className="bg-light rounded-3 p-4 text-center">
          <h5 className="mb-2">Демо-аккаунты</h5>
          <p className="text-muted mb-1">
            <code>alice</code> / <code>alice1234</code> &nbsp;&nbsp;
            <code>bob</code> / <code>bob1234</code>
          </p>
          <small className="text-secondary">
            Уже заполнено 28 рецептами, планом меню и комментариями.
          </small>
        </div>
      </Container>
    </>
  );
}
