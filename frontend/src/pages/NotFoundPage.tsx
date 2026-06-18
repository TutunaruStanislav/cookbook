import { Button, Container } from 'react-bootstrap';
import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <Container className="text-center py-5">
      <h1 className="display-1 fw-bold text-muted">404</h1>
      <h4 className="mb-3">Страница не найдена</h4>
      <p className="text-muted mb-4">Такой страницы не существует или она была перемещена.</p>
      <Button as={Link as React.ElementType} to="/" variant="primary">
        На главную
      </Button>
    </Container>
  );
}
