# REPORT.md — История создания проекта

> Журнал ведётся **по мере работы**, а не в конце. Сюда добавляются ключевые решения,
> проблемы и способы их решения, удачные и неудачные шаги.

---

## 2026-06-18 — Фаза 0: планирование и архитектура

### Что сделано
- Изучены требования (Вариант 3: Книга рецептов), стек задан: Django + DRF + React + PostgreSQL.
- Согласованы с заказчиком ключевые развилки (через уточняющие вопросы):
  - **Frontend на TypeScript** (а не JS) — ради типобезопасности и поддерживаемости.
  - **JWT хранится в localStorage** — стандартная связка с DRF SimpleJWT, проще для демо/локального деплоя.
  - **Workflow:** сначала пишу `ARCHITECTURE.md` + план → пауза на ревью заказчика → затем код.
- Написан `ARCHITECTURE.md`: стек с обоснованием, чек-лист требований, модель данных (ER),
  REST API, авторизация, детали ключевых фич, фронтенд-архитектура, тесты, CI, Docker,
  структура репозитория, пошаговый план из 19 фаз (0–18).
- Заведён этот `REPORT.md`.

### Принятые по умолчанию решения (без отдельного вопроса)
Vite, React Query + axios, react-hook-form + zod, @dnd-kit (вместо заброшенной
react-beautiful-dnd), Recharts, drf-spectacular, pytest, Vitest+RTL, ruff/ESLint, nginx+gunicorn.
Обоснования — в разделе 1 ARCHITECTURE.md.

### Заметки / риски на будущее
- Список покупок решено **не хранить** в БД, а вычислять агрегацией ингредиентов из слотов
  плана — меньше рассинхронизации.
- Масштабирование порций считается на сервере (`?servings=N`) и дублируется на клиенте для отклика.
- Фото-заглушки для seed: нужно подготовить локальные placeholder-изображения, чтобы не
  зависеть от внешних URL при offline-сборке.

### Удачные шаги
- Уточнил развилки до написания документа — архитектура сразу учитывает выбранные решения.

### Неудачные шаги / сложности
- Пока нет.

### Следующий шаг
- Фаза 1 (backend foundation).

---

## 2026-06-18 — Фаза 1: backend foundation

### Что сделано
- Создана структура `backend/`: `config/` (settings, urls, wsgi, asgi), `apps/` (users, recipes, social, planner, dashboard).
- `config/settings.py` — все настройки из env-переменных: БД, JWT, CORS, пагинация (PAGE_SIZE=12), фильтры, схема OpenAPI.
- SimpleJWT: access 60 мин / refresh 7 дней / rotate refresh tokens.
- drf-spectacular: `/api/schema/`, `/api/docs/` (Swagger UI), `/api/redoc/`.
- Health check: `GET /api/health/` → `{"status": "ok"}`.
- `requirements.txt` + `requirements-dev.txt` (pytest, factory-boy, ruff, Faker).
- `pyproject.toml`: конфиг ruff + pytest с `DJANGO_SETTINGS_MODULE`.
- `.env.example` с шаблоном всех переменных.
- `manage.py check` — **0 ошибок** на Python 3.14 + Django 5.2.

### Проблемы и решения
- **Breaking change в drf-spectacular 0.29:** класс `SpectacularSwaggerUIView` переименован в `SpectacularSwaggerView`. Обнаружено при `manage.py check`, исправлено немедленно, зафиксировано в ARCHITECTURE.md. Причина: документация на PyPI отстаёт от changelog пакета.

### Удачные шаги
- `psycopg[binary]` для Python 3.14 оказался доступен — бинарные wheels уже есть, никаких проблем с установкой.
- Проверка через `manage.py check` сразу выявила проблему с импортом — не пришлось поднимать сервер.

### Неудачные шаги
- Нет.

### Следующий шаг
- Фаза 2: модели (Recipe, Ingredient, Category, Tag, RecipeStep, RecipeIngredient) + миграции + сериализаторы + ViewSets + права доступа + пагинация.

---

## 2026-06-18 — Фаза 2: домен рецептов — модели, CRUD, права

### Что сделано
- Модели: `Category`, `Tag`, `Ingredient`, `Recipe`, `RecipeIngredient`, `RecipeStep` в `apps/recipes/models.py`.
- `RecipeIngredient`: 8 единиц измерения (г, мл, шт, ст.л., ч.л., кг, л, щепотка); `UniqueConstraint` на пару `(recipe, ingredient)`.
- `RecipeStep`: упорядочены по `order`, `UniqueConstraint` на `(recipe, order)`.
- Сериализаторы: `RecipeListSerializer` (лёгкий), `RecipeDetailSerializer` (полный), `RecipeWriteSerializer` (вложенный write с `bulk_create`).
- Масштабирование порций: `?servings=N` в `GET /api/recipes/{id}/` — пересчитывает `scaled_amount` в `RecipeIngredientReadSerializer` через `Decimal` с ROUND_HALF_UP.
- `RecipeViewSet`: CRUD + `IsAuthorOrReadOnly`, `get_queryset` с фильтрацией public/private через `Q`, поиск по ингредиентам `?ingredients=`, фильтр `?favorites=true`.
- `CategoryViewSet`, `TagViewSet` — read-only без пагинации (для дропдаунов).
- `IngredientViewSet` — read-only + `SearchFilter` по имени.
- `django-filter` через `RecipeFilter`: difficulty, category, tag, min/max_time, author, is_public.
- `admin.py`: инлайны для IngredientInline и StepInline, prepopulated slugs.
- Начальная миграция `0001_initial.py`.

### Проблемы и решения
- **`makemigrations` зависает без PostgreSQL**: команда пытается проверить историю миграций в БД и ждёт таймаута TCP. Решение — написал миграцию `0001_initial.py` вручную. `manage.py check` подтверждает корректность (0 ошибок).
- **`avg_rating` и `is_favorited` на несохранённых инстансах**: после `create`/`update` в `RecipeWriteSerializer.to_representation` делаю повторный SELECT с аннотацией, чтобы поле всегда присутствовало. Один дополнительный запрос, зато корректный ответ.

### Удачные шаги
- Ingredient-based search через цепочку `.filter()` на разных JOIN-ах — корректно реализует логику «содержит ВСЕ указанные ингредиенты».
- `bulk_create` для ингредиентов и шагов при обновлении рецепта.

### Неудачные шаги
- Забыл добавить `DjangoFilterBackend` в `filter_backends` `RecipeViewSet` — обнаружил при ревью кода, исправил до коммита.

### Следующий шаг
- Фазы 3 + 4: поиск/фильтры (доработка) + Auth.

---

## 2026-06-18 — Фазы 3 + 4: поиск/фильтры + аутентификация

### Что сделано

**Фаза 3 — поиск и фильтры:**
Реализована ещё в Фазе 2, подтверждена как полная:
- `?search=` — по `title` и `description` (DRF `SearchFilter`)
- `?ingredients=курица,рис` — «что приготовить из…», цепочка `.filter()` для логики AND
- `?difficulty=`, `?category=`, `?tag=`, `?min_time=`, `?max_time=`, `?author=`, `?is_public=` — через `RecipeFilter`
- `?ordering=avg_rating` / `-avg_rating` / `cooking_time` / `created_at` — через `OrderingFilter` + аннотация `Avg`
- `?favorites=true` — только избранное текущего пользователя

**Фаза 4 — Auth:**
- `POST /api/auth/register/` — регистрация, возвращает данные пользователя (без пароля)
- `POST /api/auth/login/` — кастомный `LoginView` на базе SimpleJWT, возвращает `{access, refresh, user: {...}}` — фронтенд получает данные пользователя сразу, без доп. запроса к `/me/`
- `POST /api/auth/refresh/` — обновление access-токена
- `GET/PATCH /api/auth/me/` — текущий пользователь, частичное обновление профиля
- `admin.py` — кастомный `UserAdmin` с удобным `list_display`

### Принятые решения
- **Логин возвращает user-данные** — расширил `TokenObtainPairSerializer`, добавив `user` в ответ. Это избавляет фронтенд от двух запросов при логине.
- **`read_only_fields = ['id', 'username']` в `UserSerializer`** — username не меняется через PATCH /me/, только email/имя.

### Проблемы и решения
- Нет. Фаза прошла чисто — `manage.py check` 0 ошибок.

### Удачные шаги
- Поиск/фильтры оказались полностью готовы ещё с Фазы 2, не потребовалось дополнительной работы.

### Следующий шаг
- Фаза 5: социальные функции — Favorite, Rating, Comment (модели + API + права).

---

## 2026-06-18 — Фаза 5: социальные функции — Favorite, Rating, Comment

### Что сделано
- Модели `Favorite`, `Rating`, `Comment` в `apps/social/models.py`.
- `Rating.value` — `PositiveSmallIntegerField` с `MinValueValidator(1)` / `MaxValueValidator(5)`.
- `unique_together` на (user, recipe) у `Favorite` и `Rating`.
- `POST /api/recipes/{id}/favorite/` — toggle: создаёт или удаляет, возвращает `{is_favorited, recipe_id}`.
- `POST /api/recipes/{id}/rate/` — upsert через `update_or_create`, возвращает `{value, avg_rating, recipe_id}`.
- `GET/POST /api/recipes/{id}/comments/` — список + создание комментария.
- `DELETE /api/comments/{id}/` — удаление: автор комментария **или** владелец рецепта (`CanDeleteComment`).
- Обновлены `RecipeListSerializer` и `RecipeDetailSerializer`: добавлены поля `is_favorited`, `ratings_count`.
- `RecipeViewSet.get_queryset` — аннотации `avg_rating`, `ratings_count`, `is_favorited` через `Exists`-подзапрос (один SQL, без N+1).

### Принятые решения
- **`is_favorited` через `Exists`-аннотацию** (а не `SerializerMethodField` с запросом на каждый объект) — один дополнительный подзапрос на весь list вместо N запросов.
- **Ленивый импорт `Favorite`** в `apps/recipes/views.py` — избегает потенциального циклического импорта на уровне модуля (`social` зависит от `recipes`).
- **`RatingView` возвращает обновлённый `avg_rating`** — фронтенд обновляет UI без повторного запроса рецепта.

### Проблемы и решения
- Нет. `manage.py check` — 0 ошибок.

### Следующий шаг
- Фаза 6: планировщик меню (MenuPlan, MealSlot) + список покупок + масштабирование порций (API).
