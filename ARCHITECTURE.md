# ARCHITECTURE.md — Кулинарная книга рецептов

> Документ описывает архитектуру приложения и пошаговый план разработки.
> Обновляется по мере работы над проектом. См. раздел [18. Журнал изменений документа](#18-журнал-изменений-документа).

---

## 1. Назначение и цели

Full-stack веб-приложение «Кулинарная книга рецептов»: пользователи создают, ищут,
оценивают и комментируют рецепты, планируют меню на неделю и автоматически
получают список покупок.

**Технологический стек (задан заказчиком):** Django + Django REST Framework (DRF) +
React + PostgreSQL.

**Ключевые принятые решения (согласованы с заказчиком):**

| Решение | Выбор | Обоснование |
|---|---|---|
| Язык фронтенда | **TypeScript** | Типобезопасность, меньше runtime-ошибок, лучше поддержка. |
| Хранение JWT | **localStorage** | Стандартная связка с DRF SimpleJWT, простая реализация, достаточно для демо/локального деплоя. |
| Workflow | Сначала документы → ревью → код | Заказчик контролирует направление до начала реализации. |
| UI-фреймворк | **Bootstrap 5** (react-bootstrap) | Требование заказчика: простой, лаконичный, адаптивный дизайн. |

**Решения, принятые по умолчанию (без отдельного вопроса, описаны здесь):**

| Область | Выбор | Обоснование |
|---|---|---|
| Сборка фронтенда | **Vite** | Современный быстрый бандлер, нативная поддержка TS/React. |
| Данные/запросы | **TanStack Query (React Query)** + axios | Кэш, инвалидация, состояния загрузки «из коробки». |
| Формы/валидация | **react-hook-form + zod** | Декларативная валидация на клиенте, синхронизация с серверной. |
| Drag-and-drop | **@dnd-kit** | Современная, поддерживаемая библиотека (react-beautiful-dnd заброшена). |
| Графики | **Recharts** | Простой декларативный API, хватает для дашборда. |
| OpenAPI/Swagger | **drf-spectacular** | Живая Swagger UI страница из кода, стандарт для DRF. |
| Тесты backend | **pytest + pytest-django** | Лаконичнее стандартного `unittest`, фикстуры. |
| Тесты frontend | **Vitest + React Testing Library** | Нативно дружит с Vite. |
| Линтеры | **ruff** (backend), **ESLint + Prettier** (frontend) | Быстро, стандарт индустрии. |
| WSGI-сервер | **gunicorn** | Прод-режим backend в Docker. |
| Раздача фронтенда | **nginx** | Отдаёт собранный React и проксирует `/api`, `/media`. |

---

## 2. Технологический стек

### Backend
- **Python 3.12**, **Django 5.x**, **Django REST Framework**
- **PostgreSQL 16** (через `psycopg`)
- **djangorestframework-simplejwt** — JWT-аутентификация
- **drf-spectacular** — OpenAPI 3 схема + Swagger UI / ReDoc
- **django-filter** — фильтрация списков
- **Pillow** — обработка загружаемых изображений
- **pytest, pytest-django, pytest-cov, factory_boy / Faker** — тесты и фабрики данных
- **ruff** — линтер/форматтер
- **gunicorn** — прод WSGI

### Frontend
- **React 18 + TypeScript**, сборка **Vite**
- **react-bootstrap + Bootstrap 5** — UI и адаптивная сетка
- **react-router-dom** — маршрутизация
- **@tanstack/react-query + axios** — работа с API
- **react-hook-form + zod** — формы и валидация
- **@dnd-kit/core** — drag-and-drop планировщика меню
- **recharts** — графики дашборда
- **vitest + @testing-library/react** — тесты
- **ESLint + Prettier** — линт/формат

### Инфраструктура
- **Docker / docker-compose** — `db` + `backend` + `frontend`
- **nginx** — статика фронтенда + reverse proxy на backend
- **GitHub Actions** — CI: lint + тесты (+ опционально сборка Docker-образов)

---

## 3. Соответствие требованиям (чек-лист)

### Базовые функциональные
- [ ] CRUD сущностей + валидация (клиент + сервер) → рецепты, ингредиенты, комментарии и др.
- [ ] Поиск и фильтрация по ключевым полям
- [ ] Дашборд с визуализацией (графики/статистика)
- [ ] Пагинация списков
- [ ] Адаптивная вёрстка (desktop + mobile)

### Нефункциональные
- [ ] Seed-данные (реалистичный демо-набор)
- [ ] REST API + живая OpenAPI/Swagger страница
- [ ] ≥ 10 unit/integration тестов
- [ ] CI (GitHub Actions): lint + тесты; Docker-образ — опционально
- [ ] Запуск одной командой `docker compose up`
- [ ] README.md с инструкцией
- [ ] ARCHITECTURE.md (этот файл)
- [ ] REPORT.md (ведётся по мере работы)
- [ ] Адекватная история коммитов (не всё разом)

### Вариант 3 — функциональные
- [ ] Рецепты: название, описание, время, сложность, фото (upload), пошаговые инструкции
- [ ] Ингредиенты: количество + единицы (граммы, штуки, мл)
- [ ] Категории и теги
- [ ] Поиск по названию, ингредиентам («что приготовить из курицы и риса»), тегам
- [ ] Планировщик меню на неделю (drag-and-drop: пн–вс × завтрак/обед/ужин)
- [ ] Автогенерация списка покупок (агрегация + суммирование ингредиентов)
- [ ] Масштабирование порций (пересчёт на N порций)
- [ ] Избранное (закладки)
- [ ] Рейтинг 1–5 звёзд + сортировка по среднему
- [ ] Регистрация/авторизация (JWT), 2 предзаполненных пользователя; публичные/приватные рецепты; имя автора на карточке
- [ ] Комментарии (автор + время; владелец рецепта удаляет любой комментарий)
- [ ] Seed: 25+ рецептов с фото-заглушками, 50+ ингредиентов, готовый план меню, 2 пользователя, 20+ комментариев

> Чек-боксы отмечаются по мере реализации фаз (см. раздел 17).

---

## 4. Высокоуровневая архитектура

```
                    ┌─────────────────────────────────────────────┐
                    │                  Браузер                     │
                    │   React + TS (Vite) + Bootstrap (SPA)        │
                    │   React Query / axios  •  JWT в localStorage │
                    └───────────────┬─────────────────────────────┘
                                    │ HTTP (REST/JSON)
                                    ▼
                    ┌─────────────────────────────────────────────┐
                    │                 nginx                        │
                    │  • статика фронтенда (build)                 │
                    │  • /api  → proxy → backend                   │
                    │  • /media → proxy → backend (или volume)     │
                    └───────────────┬─────────────────────────────┘
                                    │
                                    ▼
                    ┌─────────────────────────────────────────────┐
                    │        Backend: Django + DRF (gunicorn)      │
                    │  • ViewSets / Serializers / Permissions      │
                    │  • SimpleJWT (auth)                          │
                    │  • drf-spectacular (/api/docs)               │
                    │  • django-filter (поиск/фильтры)            │
                    └───────────────┬─────────────────────────────┘
                                    │ ORM (psycopg)
                                    ▼
                    ┌─────────────────────────────────────────────┐
                    │              PostgreSQL 16                    │
                    └─────────────────────────────────────────────┘

         Медиа (загруженные фото) ──► volume `media/` (раздаётся backend/nginx)
```

Контейнеры docker-compose: **db** (postgres) ← **backend** (django/gunicorn) ← **frontend** (nginx со встроенным build + proxy).

---

## 5. Модель данных

### ER-обзор

```
User (Django auth)
  ├─< Recipe (author)
  ├─< Rating
  ├─< Favorite
  ├─< Comment (author)
  └─< MenuPlan

Recipe
  ├─< RecipeIngredient >── Ingredient
  ├─< RecipeStep
  ├─>< Category  (M2M)
  ├─>< Tag       (M2M)
  ├─< Rating
  ├─< Favorite
  ├─< Comment
  └─< MealSlot

MenuPlan
  └─< MealSlot >── Recipe
```

### Сущности

**User** — стандартная Django `auth.User` (username, email, password). Имя автора берётся отсюда. Два seed-пользователя.

**Recipe**
| Поле | Тип | Примечание |
|---|---|---|
| id | PK | |
| title | CharField | обязательное, валидация длины |
| description | TextField | |
| cooking_time | PositiveInteger | минуты |
| difficulty | Choice | `easy` / `medium` / `hard` |
| photo | ImageField | upload в `media/recipes/`, заглушка по умолчанию |
| servings | PositiveInteger | базовое число порций (для масштабирования) |
| author | FK → User | |
| is_public | Boolean | публичный/приватный |
| created_at / updated_at | DateTime | auto |
| *avg_rating* | computed | аннотация (`Avg`) для сортировки |

**Ingredient** — справочник: `name` (unique). 50+ записей в seed.

**RecipeIngredient** (through)
| Поле | Тип |
|---|---|
| recipe | FK → Recipe |
| ingredient | FK → Ingredient |
| amount | Decimal |
| unit | Choice: `g` / `ml` / `pcs` (граммы / мл / штуки) |

**RecipeStep** — `recipe FK`, `order` (Integer), `text` (TextField). Пошаговые инструкции (упорядочены).

**Category** — `name` (unique), `slug`. M2M с Recipe (завтрак, десерт …).

**Tag** — `name` (unique), `slug`. M2M с Recipe (веган, быстрое …).

**Rating** — `recipe FK`, `user FK`, `value` (1–5). `unique_together (recipe, user)`.

**Favorite** — `recipe FK`, `user FK`, `created_at`. `unique_together (recipe, user)`.

**Comment** — `recipe FK`, `author FK`, `text`, `created_at`. Удалять может автор комментария **или** владелец рецепта.

**MenuPlan** — `user FK`, `week_start` (Date, понедельник недели). `unique_together (user, week_start)`.

**MealSlot** — `plan FK`, `day` (0–6, пн–вс), `meal_type` (`breakfast`/`lunch`/`dinner`), `recipe FK (nullable)`. `unique_together (plan, day, meal_type)`. 7×3 = 21 слот на неделю.

> **Список покупок** не хранится отдельной таблицей — вычисляется агрегацией `RecipeIngredient` всех рецептов из слотов плана (суммирование по `(ingredient, unit)`).

---

## 6. REST API

Базовый префикс: `/api/`. Формат — JSON. Пагинация — `PageNumberPagination` (`?page=`, `?page_size=`).

### Аутентификация
| Метод | Путь | Назначение |
|---|---|---|
| POST | `/api/auth/register/` | регистрация |
| POST | `/api/auth/login/` | получить access/refresh токены |
| POST | `/api/auth/refresh/` | обновить access-токен |
| GET | `/api/auth/me/` | текущий пользователь |

### Рецепты
| Метод | Путь | Назначение |
|---|---|---|
| GET | `/api/recipes/` | список (поиск/фильтры/пагинация/сортировка) |
| POST | `/api/recipes/` | создать (авторизован) |
| GET | `/api/recipes/{id}/` | детали; `?servings=N` — масштабирование порций |
| PATCH/PUT | `/api/recipes/{id}/` | изменить (автор) |
| DELETE | `/api/recipes/{id}/` | удалить (автор) |
| POST | `/api/recipes/{id}/rate/` | поставить/изменить рейтинг |
| POST | `/api/recipes/{id}/favorite/` | добавить/убрать из избранного (toggle) |
| GET | `/api/recipes/{id}/comments/` | комментарии рецепта |
| POST | `/api/recipes/{id}/comments/` | добавить комментарий |
| DELETE | `/api/comments/{id}/` | удалить (автор комментария или владелец рецепта) |

**Параметры списка рецептов:**
- `?search=` — по названию/описанию (DRF SearchFilter)
- `?ingredients=курица,рис` — «что приготовить из …» (рецепты, содержащие все указанные ингредиенты)
- `?tags=`, `?category=`, `?difficulty=`, `?author=`, `?is_public=`
- `?ordering=avg_rating` / `-avg_rating` / `created_at` / `cooking_time`
- `?favorites=true` — только избранное текущего пользователя

### Справочники
| Метод | Путь |
|---|---|
| GET | `/api/ingredients/` (поиск `?search=`) |
| GET | `/api/categories/` |
| GET | `/api/tags/` |

### Планировщик меню и список покупок
| Метод | Путь | Назначение |
|---|---|---|
| GET | `/api/menu-plan/?week_start=YYYY-MM-DD` | план недели текущего пользователя |
| PUT/PATCH | `/api/menu-plan/slots/{id}/` | назначить/очистить рецепт в слоте |
| GET | `/api/menu-plan/shopping-list/?week_start=` | сгенерированный список покупок |

### Дашборд
| Метод | Путь | Назначение |
|---|---|---|
| GET | `/api/dashboard/stats/` | агрегаты для графиков |

Примеры метрик дашборда: количество рецептов по категориям, распределение по сложности,
топ по среднему рейтингу, топ по избранному, распределение по времени приготовления,
общее число рецептов/ингредиентов/комментариев.

### Документация API (живая)
| Путь | Что |
|---|---|
| `/api/schema/` | OpenAPI 3 (YAML/JSON) |
| `/api/docs/` | **Swagger UI** (живая страница) |
| `/api/redoc/` | ReDoc (альтернатива) |

---

## 7. Аутентификация и авторизация

- **JWT** через `djangorestframework-simplejwt`: пара access (короткий) + refresh.
- Токены хранятся в **localStorage**; axios-интерсептор добавляет `Authorization: Bearer`,
  при 401 пытается refresh, иначе — logout.
- **Права (permissions):**
  - Чтение публичных рецептов — всем (в т.ч. анонимам).
  - Приватный рецепт виден только автору.
  - Создание — только авторизованным.
  - Изменение/удаление рецепта — только автор (`IsAuthorOrReadOnly`).
  - Удаление комментария — автор комментария **или** владелец рецепта (`CanDeleteComment`).
  - Рейтинг/избранное/комментарий — только авторизованным.

---

## 8. Ключевые фичи — детали реализации

**Поиск «что приготовить из …»** — `?ingredients=` парсится в список; queryset фильтруется
так, чтобы рецепт содержал **все** указанные ингредиенты (последовательные `filter` или
аннотация `Count` совпадений). Поиск по названию — `SearchFilter`; по тегам/категориям — `django-filter`.

**Масштабирование порций** — на сервере при `?servings=N`: коэффициент `N / recipe.servings`,
каждое `RecipeIngredient.amount` умножается и возвращается пересчитанным (исходные данные не меняются).
Дублируется на клиенте для мгновенного отклика.

**Рейтинг + сортировка** — `Rating` уникален на пару (user, recipe). Список рецептов
аннотируется `Avg('ratings__value')` → сортировка `?ordering=-avg_rating`.

**Избранное** — toggle-эндпоинт; в списке — флаг `is_favorited` для текущего пользователя.

**Планировщик меню (DnD)** — фронтенд: сетка 7×3, перетаскивание карточек рецептов в слоты
через `@dnd-kit`; drop → PATCH слота. Бэкенд хранит `MealSlot` с FK на рецепт.

**Список покупок** — бэкенд собирает все `RecipeIngredient` из заполненных слотов плана,
группирует по `(ingredient, unit)`, суммирует `amount`. Возвращает список
`{ingredient, unit, total_amount}`.

**Загрузка фото** — `ImageField` (Pillow), сохранение в `MEDIA_ROOT/recipes/`,
раздача через `/media/`. В seed — фото-заглушки.

**Дашборд** — отдельный endpoint с агрегатами (ORM `annotate`/`aggregate`),
визуализация через Recharts (bar/pie).

---

## 9. Фронтенд-архитектура

```
frontend/src/
  api/            # axios-инстанс, интерсепторы, типизированные API-функции
  components/     # переиспользуемые UI (RecipeCard, StarRating, Pagination, Navbar…)
  features/
    auth/         # login, register, AuthContext
    recipes/      # список, детали, форма CRUD, поиск/фильтры
    favorites/
    menu-planner/ # DnD-сетка, список покупок
    dashboard/    # графики
  hooks/          # useAuth, useDebounce …
  pages/          # роуты-страницы
  types/          # общие TS-типы (Recipe, Ingredient …)
  App.tsx, main.tsx
```

- **Маршрутизация:** публичные (список/детали публичных рецептов, login/register) и
  приватные (создание/редактирование, избранное, планировщик, дашборд) роуты;
  `ProtectedRoute` редиректит неавторизованных.
- **Состояние сервера:** React Query (кэш, инвалидация после мутаций).
- **Состояние авторизации:** `AuthContext` + localStorage.
- **Адаптивность:** сетка Bootstrap (`Container/Row/Col`), бургер-меню в `Navbar`,
  карточки перестраиваются в одну колонку на mobile. Проверка на desktop и mobile breakpoints.
- **Валидация форм:** zod-схемы, ошибки полей под инпутами; серверные ошибки маппятся на поля.

---

## 10. Загрузка файлов / медиа

- `MEDIA_ROOT=/app/media`, `MEDIA_URL=/media/`.
- В Docker — volume `media` между backend и nginx; nginx отдаёт `/media/` напрямую.
- Валидация: тип (изображение) и максимальный размер на сервере; превью на клиенте.

---

## 11. Seed-данные

Менеджмент-команда `python manage.py seed` (идемпотентная), запускается при старте контейнера
(entrypoint), наполняет:
- **2 пользователя** (например `alice` / `bob`, известные пароли — указать в README).
- **50+ ингредиентов**, **категории**, **теги**.
- **25+ рецептов** с пошаговыми инструкциями, ингредиентами и **фото-заглушками**
  (генерируемые/локальные placeholder-изображения, копируемые в media).
- **Готовый план меню** на неделю для одного пользователя.
- **20+ комментариев**, рейтинги, избранное.

Данные — реалистичные (Faker + курируемый список реальных блюд/ингредиентов).

---

## 12. Тестирование

**Backend (pytest, цель ≥ 10 тестов):**
- модели/валидация (рейтинг 1–5, unique-ограничения);
- auth (register/login, доступ к приватным рецептам);
- CRUD рецептов и права (только автор редактирует/удаляет);
- поиск по ингредиентам, фильтры, пагинация, сортировка по рейтингу;
- масштабирование порций (математика пересчёта);
- генерация списка покупок (агрегация + суммирование);
- удаление комментария владельцем рецепта;
- дашборд-метрики.

**Frontend (vitest + RTL):** несколько компонентных тестов (RecipeCard, StarRating, форма с валидацией).

Покрытие через `pytest-cov`. Тесты гоняются в CI.

---

## 13. CI/CD (GitHub Actions)

Pipeline на push / pull request:
1. **lint** — `ruff` (backend) + `eslint` (frontend).
2. **backend tests** — поднять Postgres (service container), `pytest`.
3. **frontend tests** — `vitest run`.
4. *(опционально)* **docker build** — сборка образов backend/frontend.

---

## 14. Docker и запуск

`docker-compose.yml`, сервисы:
- **db** — `postgres:16`, volume для данных, healthcheck.
- **backend** — образ из `backend/Dockerfile`; entrypoint: `migrate` → `seed` →
  `collectstatic` → `gunicorn`. Ждёт healthy `db`.
- **frontend** — multi-stage: build (node/vite) → `nginx`, отдаёт статику и проксирует
  `/api`, `/media` на backend.

**Запуск одной командой:** `docker compose up` → доступны:
- фронтенд: `http://localhost:3000` (или `:80`)
- API: `http://localhost:3000/api/`
- Swagger: `http://localhost:3000/api/docs/`

Конфигурация через `.env` (с примером `.env.example`).

---

## 15. Структура репозитория

```
cookbook/
├── ARCHITECTURE.md
├── README.md
├── REPORT.md
├── docker-compose.yml
├── .env.example
├── .github/workflows/ci.yml
├── backend/
│   ├── Dockerfile
│   ├── entrypoint.sh
│   ├── pyproject.toml / requirements.txt
│   ├── manage.py
│   ├── config/                # settings, urls, wsgi
│   └── apps/
│       ├── users/
│       ├── recipes/           # Recipe, Ingredient, Step, Category, Tag, RecipeIngredient
│       ├── social/            # Rating, Favorite, Comment
│       ├── planner/           # MenuPlan, MealSlot, shopping list
│       └── dashboard/
└── frontend/
    ├── Dockerfile
    ├── nginx.conf
    ├── package.json
    ├── vite.config.ts
    └── src/                   # (см. раздел 9)
```

---

## 16. Безопасность

- Секреты (`SECRET_KEY`, пароли БД) — через переменные окружения, не в репозитории.
- `DEBUG=False` в прод-режиме; `ALLOWED_HOSTS` из env.
- CORS настраивается под фронтенд-origin.
- Валидация загружаемых файлов (тип/размер).
- Права доступа на каждом endpoint (раздел 7).
- Пароли — стандартное хеширование Django; JWT с разумным TTL и refresh.

---

## 17. Пошаговый план разработки

Каждая фаза = осмысленный коммит (история «не всё разом»). **Коммит/пуш — только по команде заказчика.**

| # | Фаза | Содержание | Связанные требования |
|---|---|---|---|
| 0 | **Документы и каркас** | ARCHITECTURE.md, REPORT.md, README-черновик, .gitignore | docs |
| 1 | **Backend foundation** | Django+DRF+Postgres, settings/env, SimpleJWT, drf-spectacular, базовая структура apps | стек, API-доки |
| 2 | **Домен и CRUD** | модели recipes/ingredients/steps/categories/tags + миграции; сериализаторы, viewsets, права (public/private, author); пагинация | CRUD, валидация, пагинация |
| 3 | **Поиск и фильтры** | search по названию, по ингредиентам, по тегам/категориям/сложности; ordering | поиск/фильтрация |
| 4 | **Auth** | register/login/refresh/me, 2 seed-пользователя, защита приватных рецептов | JWT, пользователи |
| 5 | **Соц-фичи** | favorites, ratings (+avg, сортировка), comments (+удаление владельцем) | избранное, рейтинг, комментарии |
| 6 | **Планировщик + покупки + порции** | MenuPlan/MealSlot API, генерация списка покупок, масштабирование порций | планировщик, список покупок, порции |
| 7 | **Дашборд (API)** | endpoint агрегатов/статистики | дашборд |
| 8 | **Seed-данные** | команда seed: 25+ рецептов, 50+ ингредиентов, план, 2 юзера, 20+ комментариев, фото-заглушки | seed |
| 9 | **Backend-тесты** | ≥10 pytest-тестов + cov | тесты |
| 10 | **Frontend foundation** | Vite+React+TS+Bootstrap, роутинг, AuthContext, API-клиент, layout/Navbar, адаптивность | стек, адаптив |
| 11 | **Frontend: рецепты** | список+поиск/фильтры/пагинация, детали, CRUD-формы с валидацией, имя автора, public/private | CRUD, поиск, валидация |
| 12 | **Frontend: соц-фичи** | избранное, рейтинг (звёзды+сортировка), комментарии | избранное, рейтинг, комментарии |
| 13 | **Frontend: планировщик** | DnD-сетка 7×3, список покупок, переключатель порций | планировщик, покупки, порции |
| 14 | **Frontend: дашборд** | графики (Recharts), статистика | дашборд |
| 15 | **Frontend-тесты** | vitest + RTL | тесты |
| 16 | **Dockerization** | Dockerfiles, nginx, docker-compose, entrypoint (migrate+seed), `docker compose up` | one-command |
| 17 | **CI** | GitHub Actions: lint + тесты (+ опц. docker build) | CI |
| 18 | **README + полировка** | инструкция запуска, учётки seed, скриншоты; (опц.) видео-демо | README |

> Порядок инкрементальный: сначала рабочий backend с API и Swagger, затем frontend, затем
> инфраструктура. REPORT.md пополняется на каждой фазе.

---

## 18. Журнал изменений документа

| Дата | Изменение |
|---|---|
| 2026-06-18 | Создан документ: архитектура, модель данных, API, план разработки. Зафиксированы решения: TypeScript, JWT в localStorage, Bootstrap, workflow «документы → ревью → код». |
