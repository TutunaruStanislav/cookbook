# Кулинарная книга рецептов

[![CI](https://github.com/TutunaruStanislav/cookbook/actions/workflows/ci.yml/badge.svg)](https://github.com/TutunaruStanislav/cookbook/actions/workflows/ci.yml)

Full-stack веб-приложение для хранения, поиска и планирования рецептов. Пользователи создают и оценивают рецепты, планируют меню на неделю с drag-and-drop и получают автоматически сформированный список покупок.

**Стек:** Django 5 + DRF + PostgreSQL 16 · React 18 + TypeScript + Vite · Bootstrap 5 · Docker

---

## Быстрый старт (Docker)

Нужен только установленный Docker. Из чистого клона:

```bash
git clone https://github.com/TutunaruStanislav/cookbook.git && cd cookbook
docker compose up
```

Эта команда сама соберёт образы и поднимет всё (db → backend с миграциями и seed → frontend). Никакой настройки не требуется — все переменные окружения имеют значения по умолчанию.

```bash
docker compose up -d            # то же самое, но в фоне
cp .env.example .env            # опционально: задать свои SECRET_KEY/порт/БД
```

После запуска доступно:

| Адрес | Что |
|---|---|
| http://localhost:8888 | Фронтенд (React) |
| http://localhost:8888/api/ | REST API |
| http://localhost:8888/api/docs/ | Swagger UI (интерактивная документация) |
| http://localhost:8888/api/redoc/ | ReDoc |

> Первый запуск занимает ~1–2 минуты: `db` стартует с healthcheck, затем backend запускает миграции и seed-данные.

---

## Демо-аккаунты

Seed-команда создаёт двух пользователей с готовыми данными:

| Пользователь | Пароль | Что подготовлено |
|---|---|---|
| `alice` | `alice1234` | 28 рецептов, заполненный план меню на текущую неделю (21 слот), 10 избранных |
| `bob` | `bob1234` | 1 приватный рецепт «Пельмени домашние», рейтинги и комментарии |

---

## Функциональность

- **Рецепты** — CRUD с фото, пошаговыми инструкциями, ингредиентами (кол-во + единицы), категориями и тегами
- **Поиск и фильтры** — по названию, ингредиентам («что приготовить из курицы и риса»), сложности, категории, тегу, времени, автору
- **Масштабирование порций** — ползунок ±порции пересчитывает количества ингредиентов
- **Социальные функции** — рейтинг 1–5 звёзд (среднее + сортировка), избранное, комментарии
- **Планировщик меню** — DnD-сетка 7×3 (7 дней × завтрак/обед/ужин), навигация по неделям
- **Список покупок** — автоагрегация ингредиентов из плана (с учётом кратности рецептов)
- **Дашборд** — графики Recharts: по категориям, сложности, времени приготовления; топ по рейтингу и избранному
- **Аутентификация** — JWT (access + refresh), публичные/приватные рецепты

---

## Локальная разработка (без Docker)

### Backend

```bash
cd backend

# Создать виртуальное окружение
python -m venv .venv
source .venv/bin/activate       # Windows: .venv\Scripts\activate

# Установить зависимости
pip install -r requirements.txt -r requirements-dev.txt

# Переменные окружения (скопировать .env.example → backend/.env или задать вручную)
export POSTGRES_DB=cookbook
export POSTGRES_USER=cookbook
export POSTGRES_PASSWORD=cookbook
export POSTGRES_HOST=localhost
export POSTGRES_PORT=5432
export SECRET_KEY=dev-secret-key
export DEBUG=True

# Миграции + seed
python manage.py migrate
python manage.py seed

# Запуск сервера
python manage.py runserver        # http://localhost:8888:8000
```

### Frontend

```bash
cd frontend

npm install
npm run dev                       # http://localhost:8888:5173
```

Vite автоматически проксирует `/api` и `/media` на `http://localhost:8888:8000`.

---

## Тесты

### Backend (pytest)

```bash
cd backend
pytest --tb=short -q
# Покрытие выводится автоматически (--cov=apps в pyproject.toml)
```

45 тестов: auth, CRUD рецептов, права, поиск, масштабирование порций, социальные функции, планировщик, список покупок, дашборд.

### Frontend (Vitest + React Testing Library)

```bash
cd frontend
npm test
```

21 тест: StarRating, AppPagination, RecipeCard, HomePage.

---

## Переменные окружения

Файл `.env.example` содержит все переменные с безопасными defaults для локального запуска:

| Переменная | По умолчанию | Назначение |
|---|---|---|
| `SECRET_KEY` | `change-me-in-production` | Django secret key |
| `DEBUG` | `True` | Режим отладки |
| `ALLOWED_HOSTS` | `localhost,127.0.0.1` | Разрешённые хосты |
| `POSTGRES_DB` | `cookbook` | Имя БД |
| `POSTGRES_USER` | `cookbook` | Пользователь БД |
| `POSTGRES_PASSWORD` | `cookbook` | Пароль БД |
| `POSTGRES_HOST` | `localhost` | Хост БД (`db` в Docker) |
| `POSTGRES_PORT` | `5432` | Порт БД |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:8888:5173,...` | CORS для фронтенда |
| `PORT` | `8888` | Внешний порт Docker (nginx) |

> В production обязательно задать `SECRET_KEY`, `DEBUG=False`, `ALLOWED_HOSTS` и `CORS_ALLOWED_ORIGINS`.

---

## Структура репозитория

```
cookbook/
├── .github/workflows/ci.yml   # CI: lint + тесты (GitHub Actions)
├── docker-compose.yml
├── .env.example
├── ARCHITECTURE.md            # Архитектура, модель данных, план разработки
├── REPORT.md                  # Журнал разработки по фазам
├── backend/
│   ├── Dockerfile
│   ├── entrypoint.sh          # migrate → seed → collectstatic → gunicorn
│   ├── requirements.txt
│   ├── requirements-dev.txt
│   ├── pyproject.toml         # ruff + pytest конфиг
│   ├── config/                # settings, urls, wsgi
│   ├── apps/
│   │   ├── users/             # User auth
│   │   ├── recipes/           # Recipe, Ingredient, Category, Tag, Step
│   │   ├── social/            # Rating, Favorite, Comment
│   │   ├── planner/           # MenuPlan, MealSlot, shopping list
│   │   └── dashboard/         # агрегаты для графиков
│   └── tests/                 # 45 pytest-тестов
└── frontend/
    ├── Dockerfile             # node:20 build → nginx:1.27 serve
    ├── nginx.conf
    ├── src/
    │   ├── api/               # axios клиент + API-функции
    │   ├── components/        # RecipeCard, StarRating, Pagination, Navbar…
    │   ├── contexts/          # AuthContext (JWT)
    │   ├── hooks/             # useRecipes, useSocial, usePlanner, useDashboard
    │   ├── pages/             # RecipesPage, RecipeDetailPage, PlannerPage, DashboardPage…
    │   ├── types/             # TypeScript интерфейсы
    │   └── test/              # utils, fixtures, 21 тест
    └── package.json
```

---

## CI

GitHub Actions запускается на каждый push и pull request в `master`:

- **backend** — `ruff check` + `pytest` с PostgreSQL 16 service container
- **frontend** — `tsc` (type-check) + `vitest run`

Конфигурация: `.github/workflows/ci.yml`
