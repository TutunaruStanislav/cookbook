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
- **drf-spectacular 0.29+** — OpenAPI 3 схема + Swagger UI (`SpectacularSwaggerView`) / ReDoc
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
- [x] CRUD сущностей + валидация (клиент + сервер) → backend: Recipe/Ingredient/Category/Tag (Phase 2)
- [x] Поиск и фильтрация по ключевым полям — backend: SearchFilter + django-filter + ingredient search (Phase 2–3)
- [x] Дашборд с визуализацией — /api/dashboard/stats/ (totals, by_category, by_difficulty, cooking_time, top ratings/favorites, top tags) (Phase 7)
- [x] Пагинация списков — PageNumberPagination (PAGE_SIZE=12, Phase 1)
- [x] Адаптивная вёрстка (desktop + mobile) — Bootstrap grid, responsive Navbar (Phase 10–14)

### Нефункциональные
- [x] Seed-данные (реалистичный демо-набор) — 28 рецептов, 64 ингредиента, план меню (Phase 8)
- [x] REST API + живая OpenAPI/Swagger страница — `/api/docs/` (drf-spectacular 0.29)
- [x] ≥ 10 unit/integration тестов — 45 pytest-тестов (5 файлов, Phase 9)
- [x] CI (GitHub Actions): lint + тесты — `.github/workflows/ci.yml` (backend: ruff+pytest, frontend: tsc+vitest, Phase 17)
- [x] Запуск одной командой `docker compose up` — Phase 16
- [x] README.md с инструкцией — быстрый старт, демо-аккаунты, env, тесты, структура (Phase 18)
- [x] ARCHITECTURE.md (этот файл)
- [x] REPORT.md (ведётся по мере работы)
- [x] Адекватная история коммитов (не всё разом)

### Вариант 3 — функциональные
- [x] Рецепты: название, описание, время, сложность, фото (upload), пошаговые инструкции — Phase 2, 11
- [x] Ингредиенты: количество + единицы (граммы, штуки, мл) — Phase 2, 11
- [x] Категории и теги — Phase 2, 11
- [x] Поиск по названию, ингредиентам («что приготовить из курицы и риса»), тегам — Phase 2–3, 11
- [x] Планировщик меню на неделю — MenuPlan/MealSlot, auto-create 21 slots, PATCH slot (Phase 6)
- [x] Автогенерация списка покупок — агрегация с учётом кратности рецептов (Phase 6)
- [x] Масштабирование порций — ?servings=N на /api/recipes/{id}/, Decimal ROUND_HALF_UP (Phase 2)
- [x] Избранное (закладки) — toggle endpoint, фильтр ?favorites=true (Phase 5)
- [x] Рейтинг 1–5 звёзд + сортировка по среднему — upsert, avg_rating аннотация, ?ordering=avg_rating (Phase 5)
- [x] Регистрация/авторизация (JWT) — register/login/refresh/me (Phase 4); 2 предзаполненных пользователя — Phase 8 (seed); публичные/приватные рецепты — Phase 2; имя автора на карточке — Phase 2
- [x] Комментарии (автор + время; владелец рецепта удаляет любой комментарий) — CanDeleteComment (Phase 5)
- [x] Seed: 28 рецептов с реальными фото (Wikimedia Commons, свободные лицензии), 64 ингредиента, готовый план меню для alice, 2 пользователя (alice/bob), 22 комментария, 15 рейтингов, 10 избранных (Phase 8 + замена фото)

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
| GET/PATCH | `/api/auth/me/` | текущий пользователь (PATCH — смена отображаемого имени) |
| POST | `/api/auth/change-password/` | смена пароля (нужен текущий пароль) |

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
раздача через `/media/`. В seed — реальные фото блюд (Wikimedia Commons, свободные лицензии), с откатом на генерируемую PIL-заглушку, если файл отсутствует. API отдаёт `photo` относительным URL (`/media/...`), чтобы он резолвился к текущему origin за прокси.

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
- **25+ рецептов** с пошаговыми инструкциями, ингредиентами и **реальными фото**
  (Wikimedia Commons, свободные лицензии; `backend/apps/recipes/seed_images/`,
  атрибуция в `CREDITS.md`). Если файл фото отсутствует — генерируется PIL-заглушка.
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
| 2026-06-18 | Фаза 1 завершена: отмечены выполненные пункты чек-листа. Исправлено: `SpectacularSwaggerView` (breaking change drf-spectacular 0.29, было `SpectacularSwaggerUIView`). |
| 2026-06-18 | Фаза 2 завершена: модели рецептов, миграция, сериализаторы (list/detail/write), ViewSets, права, поиск по ингредиентам, масштабирование порций. Миграция написана вручную (нет локального PostgreSQL). |
| 2026-06-18 | Фазы 3+4 завершены: поиск/фильтры подтверждены (были готовы в Phase 2). Auth: register/login/refresh/me, кастомный LoginView возвращает user в ответе. |
| 2026-06-18 | Фаза 5 завершена: Favorite (toggle), Rating (upsert, avg), Comment (CanDeleteComment). is_favorited/ratings_count через Exists-аннотацию в queryset. |
| 2026-06-18 | Фаза 6 завершена: MenuPlan/MealSlot, auto-create slots, shopping list с учётом кратности рецептов. |
| 2026-06-18 | Фаза 7 завершена: /api/dashboard/stats/ — 7 агрегатов в одном endpoint (Count/Avg/Q). Новых моделей нет. |
| 2026-06-18 | Фаза 8 завершена: management command `seed.py` — 28 рецептов (1 приватный), 64 ингредиента, 8 категорий, 8 тегов, 22 комментария, 15 рейтингов, 10 избранных, PIL-заглушки 400×300. Готовый план меню для alice на текущую неделю (21 слот). Идемпотентность через `get_or_create`. |
| 2026-06-18 | Фаза 9 завершена: 45 pytest-тестов в 5 файлах (test_auth / test_recipes / test_social / test_planner / test_dashboard). Покрыты: auth, CRUD, права, видимость, поиск, масштабирование порций, избранное, рейтинги, комментарии, планировщик, список покупок, дашборд. |
| 2026-06-18 | Фаза 10 завершена: frontend-фундамент — Vite+React+TS+Bootstrap5, React Query, react-router-dom v6, AuthContext (JWT в localStorage, login/logout, token refresh через axios interceptor), API-клиент (client.ts + auth.ts + recipes.ts), AppNavbar (responsive, collapse на md), Layout, ProtectedRoute, Login/RegisterPage (react-hook-form + zod), HomePage, placeholder-страницы для фаз 11–14. |
| 2026-06-18 | Фаза 11 завершена: frontend рецепты — RecipesPage (фильтры/поиск/пагинация через URL params), RecipeCard (фото, автор, difficulty badge, рейтинг, избранное), RecipeDetailPage (масштабирование порций, ингредиенты, шаги, избранное, delete confirm), RecipeFormPage (create+edit, react-hook-form+zod, динамические ингредиенты/шаги, IngredientSearch combobox, теги/категории click-badges), маршруты обновлены. |
| 2026-06-18 | Фаза 12 завершена: frontend социальные функции — useSocial.ts (useRateRecipe/useComments/useAddComment/useDeleteComment), InteractiveStarRating (hover + клик + myRating state + StarRating aggregate), CommentsSection (пагинированный список, delete (автор/владелец рецепта), форма добавления, локализованная дата). RecipeDetailPage: рейтинг заменён на интерактивный, CommentsSection добавлена после шагов. |
| 2026-06-18 | Фаза 13 завершена: frontend планировщик — usePlanner.ts (usePlan/useUpdateSlot/useShoppingList), RecipePickerModal (поиск+выбор рецепта), PlannerPage: DnD сетка 7×3 (@dnd-kit/core, PointerSensor activationConstraint=8px), SlotCell (useDroppable, isOver подсветка), RecipeChip (useDraggable, drag handle ⠿, × без drag-конфликта), DragOverlay, swap/move через два mutateAsync, недельная навигация (без UTC-сдвига), ленивый список покупок. |
| 2026-06-18 | Фаза 14 завершена: frontend дашборд — useDashboard.ts (staleTime 5 мин), DashboardPage: 4 StatCard (totals), BarChart по категориям (angle=-35), PieChart по сложности (donut, DIFF_COLORS), BarChart по времени (layout=vertical), badge-облако топ тегов, топ-5 по рейтингу (StarRating), топ-5 по избранному. Recharts ResponsiveContainer. |
| 2026-06-18 | Фаза 15 завершена: 21 frontend-тест (Vitest + RTL) — StarRating (5), AppPagination (5), RecipeCard (6), HomePage (5). Инфраструктура: test/utils.tsx (кастомный render с QueryClient+MemoryRouter+AuthProvider), test/fixtures.ts (mockRecipe). Auth-тесты через localStorage pre-population. |
| 2026-06-18 | Фаза 16 завершена: Dockerization — backend/Dockerfile (python:3.12-slim), entrypoint.sh (migrate→seed→collectstatic→gunicorn с exec), frontend/Dockerfile (node:20 build → nginx:1.27 serve, двухэтапная сборка), frontend/nginx.conf (proxy /api/+/static/ → backend, alias /media/ → shared volume, SPA fallback), docker-compose.yml (db+backend+frontend, healthcheck pg_isready, volumes postgres_data+media_files), whitenoise добавлен в requirements+settings. |
| 2026-06-18 | Фаза 17 завершена: `.github/workflows/ci.yml` — два параллельных job-а. `backend`: postgres:16 service container, Python 3.12, pip cache, ruff check, pytest (coverage из pyproject.toml). `frontend`: Node 20, npm cache, npx tsc (type-check), npm test (vitest run). Триггеры: push + pull_request на master. |
| 2026-06-18 | Фаза 18 завершена: `README.md` — быстрый старт (docker compose up --build), демо-аккаунты (alice/bob), функциональность, локальная разработка, тесты, переменные окружения, структура репозитория, CI. Чек-лист требований закрыт полностью. |
| 2026-06-18 | Доработка: страница профиля (`/profile`, protected). Backend — `POST /api/auth/change-password/` (ChangePasswordSerializer проверяет текущий пароль, min 8 символов) + 4 теста. Frontend — ProfilePage: смена отображаемого имени (PATCH /me/ → updateUser), смена пароля, список своих рецептов (`?author=<id>`, включая приватные, с пагинацией). Добавлен `author` в RecipeFilters. |
| 2026-06-18 | Доработка: реальные фото блюд вместо PIL-заглушек. 29 изображений с Wikimedia Commons (свободные лицензии) в `backend/apps/recipes/seed_images/` (+ `CREDITS.md`); seed.py загружает их (откат на заглушку). Каждое фото визуально проверено. Исправлен баг: `photo` теперь отдаётся относительным URL (`/media/...`) — host-based абсолютный URL ломался за прокси на порту 8888. |
