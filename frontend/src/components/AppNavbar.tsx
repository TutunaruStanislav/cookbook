import { Button, Container, Nav, Navbar } from 'react-bootstrap';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function AppNavbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <Navbar bg="dark" variant="dark" expand="md" sticky="top">
      <Container>
        <Navbar.Brand as={Link} to="/" className="fw-bold">
          Cookbook
        </Navbar.Brand>

        <Navbar.Toggle aria-controls="main-nav" />

        <Navbar.Collapse id="main-nav">
          <Nav className="me-auto">
            <Nav.Link as={NavLink} to="/recipes">
              Рецепты
            </Nav.Link>
            <Nav.Link as={NavLink} to="/dashboard">
              Дашборд
            </Nav.Link>
            {user && (
              <Nav.Link as={NavLink} to="/planner">
                Планировщик
              </Nav.Link>
            )}
          </Nav>

          <Nav className="align-items-center gap-2">
            {user ? (
              <>
                <Nav.Link as={NavLink} to="/profile" className="text-light pe-0">
                  {user.first_name || user.username}
                </Nav.Link>
                <Button variant="outline-light" size="sm" onClick={handleLogout}>
                  Выйти
                </Button>
              </>
            ) : (
              <>
                <Nav.Link as={NavLink} to="/login">
                  Войти
                </Nav.Link>
                <Link to="/register" className="btn btn-primary btn-sm">
                  Регистрация
                </Link>
              </>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}
