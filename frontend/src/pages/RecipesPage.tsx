import { Container, Spinner } from 'react-bootstrap';

export default function RecipesPage() {
  return (
    <Container className="py-5 text-center">
      <Spinner animation="border" variant="primary" className="mb-3" />
      <p className="text-muted">Список рецептов — реализуется в фазе 11.</p>
    </Container>
  );
}
