import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Badge, Card, Col, Container, Row, Spinner } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import StarRating from '../components/StarRating';
import { useDashboardStats } from '../hooks/useDashboard';

// ── Helpers ───────────────────────────────────────────────────────────────────

const DIFF_COLORS: Record<string, string> = {
  easy: '#198754',
  medium: '#ffc107',
  hard: '#dc3545',
};

// ── Stat card ─────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: number;
  accent: string;
}

function StatCard({ label, value, accent }: StatCardProps) {
  return (
    <Card className="border-0 shadow-sm text-center h-100">
      <Card.Body className="py-4">
        <div className="fw-bold mb-1" style={{ fontSize: '2.2rem', color: accent }}>
          {value.toLocaleString('ru-RU')}
        </div>
        <div className="text-muted small">{label}</div>
      </Card.Body>
    </Card>
  );
}

// ── Section card wrapper ──────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="border-0 shadow-sm h-100">
      <Card.Body>
        <h6 className="fw-semibold mb-3">{title}</h6>
        {children}
      </Card.Body>
    </Card>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { data: stats, isLoading, isError } = useDashboardStats();

  if (isLoading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="primary" />
      </Container>
    );
  }

  if (isError || !stats) {
    return (
      <Container className="py-5">
        <div className="alert alert-danger">Не удалось загрузить статистику.</div>
      </Container>
    );
  }

  const pieData = stats.by_difficulty.map((d) => ({
    name: d.label,
    value: d.count,
    difficulty: d.difficulty,
  }));

  return (
    <Container className="py-4">
      <div className="mb-4">
        <h4 className="fw-semibold mb-1">Дашборд</h4>
        <p className="text-muted small mb-0">Статистика публичных рецептов</p>
      </div>

      {/* Totals */}
      <Row xs={2} md={4} className="g-3 mb-4">
        <Col>
          <StatCard label="Рецептов" value={stats.totals.recipes} accent="#0d6efd" />
        </Col>
        <Col>
          <StatCard label="Ингредиентов" value={stats.totals.ingredients} accent="#6c757d" />
        </Col>
        <Col>
          <StatCard label="Комментариев" value={stats.totals.comments} accent="#fd7e14" />
        </Col>
        <Col>
          <StatCard label="Пользователей" value={stats.totals.users} accent="#20c997" />
        </Col>
      </Row>

      {/* Charts row 1: categories + difficulty */}
      <Row className="g-4 mb-4">
        <Col xs={12} lg={7}>
          <Section title="Рецепты по категориям">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={stats.by_category} margin={{ top: 4, right: 8, bottom: 48, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11 }}
                  angle={-35}
                  textAnchor="end"
                  interval={0}
                />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} width={28} />
                <Tooltip />
                <Bar dataKey="count" name="Рецептов" fill="#0d6efd" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Section>
        </Col>
        <Col xs={12} lg={5}>
          <Section title="По сложности">
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="45%"
                  innerRadius={52}
                  outerRadius={82}
                >
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={DIFF_COLORS[entry.difficulty] ?? '#6c757d'} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend iconSize={10} wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </Section>
        </Col>
      </Row>

      {/* Charts row 2: cooking time + top tags */}
      <Row className="g-4 mb-4">
        <Col xs={12} lg={6}>
          <Section title="По времени приготовления">
            <ResponsiveContainer width="100%" height={190}>
              <BarChart
                data={stats.by_cooking_time}
                layout="vertical"
                margin={{ top: 4, right: 16, bottom: 4, left: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                <YAxis
                  type="category"
                  dataKey="range"
                  tick={{ fontSize: 11 }}
                  width={75}
                />
                <Tooltip />
                <Bar dataKey="count" name="Рецептов" fill="#0d6efd" radius={[0, 3, 3, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Section>
        </Col>
        <Col xs={12} lg={6}>
          <Section title="Популярные теги">
            <div className="d-flex flex-wrap gap-2">
              {stats.top_tags.map((t) => (
                <Badge
                  key={t.name}
                  bg="light"
                  text="dark"
                  className="border fw-normal"
                  style={{ fontSize: '0.82rem' }}
                >
                  #{t.name}{' '}
                  <span className="text-muted">({t.count})</span>
                </Badge>
              ))}
            </div>
          </Section>
        </Col>
      </Row>

      {/* Top lists */}
      <Row className="g-4">
        <Col xs={12} lg={6}>
          <Section title="Топ-5 по рейтингу">
            {stats.top_by_rating.map((r, i) => (
              <div
                key={r.id}
                className="d-flex align-items-center gap-2 py-2 border-bottom"
              >
                <span className="text-muted fw-semibold" style={{ minWidth: 22 }}>
                  {i + 1}.
                </span>
                <Link
                  to={`/recipes/${r.id}`}
                  className="flex-grow-1 text-decoration-none text-dark small"
                >
                  {r.title}
                </Link>
                <StarRating value={r.avg_rating} count={r.ratings_count} size="sm" />
              </div>
            ))}
          </Section>
        </Col>
        <Col xs={12} lg={6}>
          <Section title="Топ-5 по избранному">
            {stats.top_by_favorites.map((r, i) => (
              <div
                key={r.id}
                className="d-flex align-items-center gap-2 py-2 border-bottom"
              >
                <span className="text-muted fw-semibold" style={{ minWidth: 22 }}>
                  {i + 1}.
                </span>
                <Link
                  to={`/recipes/${r.id}`}
                  className="flex-grow-1 text-decoration-none text-dark small"
                >
                  {r.title}
                </Link>
                <small className="text-muted text-nowrap">♥ {r.favorites_count}</small>
              </div>
            ))}
          </Section>
        </Col>
      </Row>
    </Container>
  );
}
