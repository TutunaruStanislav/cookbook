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

---

## 2026-06-18 — Фаза 6: планировщик меню + список покупок

### Что сделано
- Модели `MenuPlan` (user + week_start, unique_together) и `MealSlot` (plan + day + meal_type, recipe nullable).
- `GET /api/menu-plan/?week_start=YYYY-MM-DD` — возвращает план со всеми 21 слотами, автоматически создаёт план и слоты если не существует (`bulk_create`). Валидация: дата должна быть понедельником.
- `PATCH /api/menu-plan/slots/{id}/` — назначает или очищает рецепт в слоте. Валидация: нельзя добавить чужой приватный рецепт.
- `GET /api/menu-plan/shopping-list/?week_start=YYYY-MM-DD` — агрегирует ингредиенты из всех заполненных слотов. Если один рецепт использован в нескольких слотах — его ингредиенты суммируются кратно числу слотов.
- Масштабирование порций (`?servings=N`) реализовано ещё в Фазе 2, отдельной работы не потребовалось.

### Принятые решения
- **Список покупок в Python, не SQL**: агрегация с учётом кратности (один рецепт в 3 слотах → тройное количество ингредиентов) сложно выразима в ORM через `Sum`, поэтому подсчёт ведётся в Python-словаре. Запросов к БД — всего два (слоты + ингредиенты).
- **Слоты создаются при первом обращении к плану** (`get_or_create` + `bulk_create`), не при создании модели — меньше ответственности у модели, логика изолирована во вьюхе.

### Проблемы и решения
- Нет. `manage.py check` — 0 ошибок.

### Следующий шаг
- Фаза 7: дашборд — endpoint с агрегатами для графиков.

---

## 2026-06-18 — Фаза 7: дашборд

### Что сделано
- `GET /api/dashboard/stats/` — один endpoint, доступен всем (включая анонимов), возвращает:
  - `totals`: кол-во публичных рецептов, ингредиентов, комментариев, активных пользователей
  - `by_category`: рецепты по категориям (для bar-чарта)
  - `by_difficulty`: распределение по сложности (для pie-чарта), с русскими подписями
  - `by_cooking_time`: 4 диапазона по времени (< 15 / 15–30 / 30–60 / > 60 мин)
  - `top_by_rating`: топ-5 по среднему рейтингу
  - `top_by_favorites`: топ-5 по числу добавлений в избранное
  - `top_tags`: топ-10 тегов по числу рецептов
- Новых моделей нет — всё через агрегацию (`Count`, `Avg`, `Q`-фильтры).

### Принятые решения
- **Один жирный endpoint** вместо нескольких узких — фронтенд делает один запрос при загрузке дашборда, а не 7. Данные небольшие, кэшировать не нужно.
- **AllowAny** — дашборд показывает только публичные рецепты, скрытых данных нет.

### Проблемы и решения
- Нет. `manage.py check` — 0 ошибок.

### Следующий шаг
- Фаза 8: seed-данные (25+ рецептов, 50+ ингредиентов, план меню, 2 пользователя, 20+ комментариев, фото-заглушки).

---

## 2026-06-18 — Фаза 8: seed-данные

### Что сделано
- Создана структура `apps/recipes/management/commands/` с `seed.py` — Django management command.
- **2 пользователя:** `alice` (alice1234) и `bob` (bob1234) с именами и email.
- **8 категорий:** Завтраки, Супы, Салаты, Горячее, Гарниры, Десерты, Закуски, Напитки.
- **8 тегов:** Быстрое, Веган, Вегетарианское, Острое, Без глютена, Диетическое, Семейное, На праздник.
- **64 ингредиента** — от «Морковь» до «Маскарпоне», охватывают все рецепты.
- **28 рецептов** с полными шагами и ингредиентами (1 приватный — «Пельмени домашние» у bob):
  Борщ, Щи, Куриный суп, Оливье, Греческий салат, Паста Карбонара/Болоньезе, Ризотто, Пицца Маргарита, Яичница с беконом, Овсяная каша с бананом, Блины, Сырники, Омлет французский, Гречневая каша, Картофельное пюре, Запечённые овощи, Котлеты домашние, Рыба с лимоном, Тирамису, Шоколадный торт, Яблочный пирог, Чизкейк без выпечки, Зелёный смузи, Гуакамоле, Хумус, Шаурма, Цезарь с курицей, Пельмени.
- **Фото-заглушки:** PIL генерирует JPEG 400×300 с уникальным цветом и сеткой для каждого рецепта. Сохраняются в `media/recipes/`.
- **22 комментария** — распределены по 12 рецептам, с реалистичным текстом.
- **15 рейтингов** 4–5 звёзд от обоих пользователей.
- **10 избранных** — перекрёстно: alice добавляет рецепты bob и наоборот.
- **Готовый план меню для alice** на текущую неделю (понедельник сегодня): 21 заполненный слот (3 приёма пищи × 7 дней), полное покрытие.
- Команда **идемпотентна** — при повторном запуске выводит предупреждение. Опция `--reset` позволяет начисто пересоздать данные.

### Принятые решения
- **PIL для фото** — генерирует JPEG локально, без внешних зависимостей и интернета. Каждый рецепт — свой уникальный цвет из предопределённой палитры.
- **`get_or_create` везде** — защита от дублирования при многократном запуске. `--reset` как escape hatch для полного сброса.
- **28 рецептов вместо 25** — требование «25+» выполнено с запасом, рецепты покрывают все 8 категорий.
- **22 комментария** — превышают требуемые 20, распределены реалистично по нескольким рецептам.

### Проблемы и решения
- Нет. Команда проверена синтаксически (`manage.py check` — 0 ошибок).

### Следующий шаг
- Фаза 9: backend-тесты (≥10 pytest-тестов с pytest-cov).

---

## 2026-06-18 — Фаза 9: backend-тесты

### Что сделано
Написано **45 pytest-тестов** в 5 файлах (`backend/tests/`):

| Файл | Тестов | Что покрыто |
|---|---|---|
| `test_auth.py` | 6 | register (201, нет password в ответе), login (токены + user), невалидный login (401), GET /me/, PATCH /me/, auth guard |
| `test_recipes.py` | 12 | видимость public/private (анон/авторизован), CRUD (create/update/delete), права не-автора (403), поиск по ингредиентам, поиск по названию, масштабирование порций (×0.5, ×2, без масштабирования) |
| `test_social.py` | 13 | toggle favorite (add/remove), auth guard избранного, фильтр ?favorites=true, rating upsert, avg по нескольким пользователям, валидация value>5/value=0, auth guard рейтинга, создание комментария, список публичен, удаление автором/владельцем рецепта/запрет чужому |
| `test_planner.py` | 7 | auth guard, отсутствие week_start (400), не-понедельник (400), автосоздание 21 слота, идемпотентность, список покупок (пустой план, агрегация, двойное количество за 2 слота) |
| `test_dashboard.py` | 7 | доступ анониму, все required keys, структура totals, считает только публичные, 4 диапазона cooking_time, top_by_rating и top_by_favorites |

- `conftest.py` с фикстурами: `api_client`, `make_user`, `alice`, `bob`, `make_recipe`.
- Тесты используют `force_authenticate` — не зависят от JWT-времени жизни.
- Каждый тест изолирован (django_db транзакции откатываются).

### Принятые решения
- **Один модуль `conftest.py`** с общими фикстурами — не повторяем setup в каждом файле.
- **`force_authenticate` вместо JWT-токенов** в тестах — быстрее, нет зависимости от времени.
- **Уникальные имена ингредиентов** в тестах (Мука_test, Соль_дважды и т.д.) — изолируют тесты между собой при запуске одной транзакцией.
- **45 тестов >> 10** — покрыт весь основной business logic.

### Проблемы и решения
- Нет. Все тесты написаны в соответствии с реальным поведением endpoints.

### Следующий шаг
- Фаза 10: frontend foundation (Vite + React + TypeScript + Bootstrap 5, роутинг, AuthContext, API-клиент, layout/Navbar).

---

## 2026-06-18 — Фаза 10: frontend foundation

### Что сделано
- **Scaffold**: `frontend/` — Vite 5 + React 18 + TypeScript 5, `package.json`, `tsconfig.json`, `vite.config.ts` (proxy `/api` и `/media` → localhost:8000), `.eslintrc.cjs`, `.prettierrc`.
- **Типы** (`src/types/index.ts`): все интерфейсы — User, RecipeList, RecipeDetail, RecipeIngredient, RecipeStep, Category, Tag, Ingredient, Comment, MenuPlan, MealSlot, ShoppingItem, DashboardStats, RecipeFilters, вспомогательные словари DIFFICULTY_LABELS / UNIT_LABELS / MEAL_TYPE_LABELS.
- **API-клиент** (`src/api/client.ts`): axios с базовым URL `/api`, request interceptor (Authorization header из localStorage), response interceptor — на 401 пробует refresh, при неудаче чистит localStorage и редиректит на `/login`.
- **API-модули**:
  - `src/api/auth.ts`: login, register, me, updateMe
  - `src/api/recipes.ts`: list (с фильтрами), detail (?servings=N), create, update, remove, favorite, rate, comments, addComment, deleteComment; catalogApi (categories/tags/ingredients); plannerApi (plan/updateSlot/shoppingList); dashboardApi (stats)
- **AuthContext** (`src/contexts/AuthContext.tsx`): user state из localStorage, login/logout/updateUser; `useAuth()` hook.
- **Компоненты**:
  - `AppNavbar.tsx`: Bootstrap 5 responsive Navbar, collapse на md, показывает имя/кнопку «Выйти» или «Войти»/«Регистрация», планировщик — только авторизованным.
  - `Layout.tsx`: flex-column min-vh-100, sticky Navbar + main + footer.
  - `ProtectedRoute.tsx`: redirect на /login с сохранением location.state.from.
- **Страницы**:
  - `LoginPage.tsx`: react-hook-form + zod, показывает ошибку сервера, редиректит на from-path.
  - `RegisterPage.tsx`: полная форма (username / имя / фамилия / email / пароль / подтверждение), zod-валидация включая regex и password.refine, серверные ошибки из detail.
  - `HomePage.tsx`: hero-секция, три feature-карточки, блок с демо-аккаунтами.
  - `NotFoundPage.tsx`: 404 с кнопкой «На главную».
  - Placeholder-страницы: RecipesPage, DashboardPage, PlannerPage.
- **App.tsx**: QueryClientProvider + BrowserRouter + AuthProvider + Routes, ProtectedRoute для /planner.
- **vitest setup**: `src/test/setup.ts` с `@testing-library/jest-dom`.

### Принятые решения
- **Token refresh в axios interceptor** — прозрачен для всех вызовов API, не нужно обрабатывать 401 в каждом компоненте.
- **`force_authenticate` через `localStorage`** — при перезагрузке страницы user восстанавливается из localStorage без запроса к `/me/`. Консистентность за счёт обновления хранилища при каждом `updateUser`.
- **Весь API в трёх файлах** (`auth.ts`, `recipes.ts` с catalogApi/plannerApi/dashboardApi) — единая точка входа, легко тестировать/мокировать.
- **Placeholder-страницы** — сразу видно где какая фаза, роутинг полностью работает.

### Проблемы и решения
- Нет. TypeScript компиляция корректна (`tsc --noEmit` не имеет ошибок по структуре).

### Следующий шаг
- Фаза 11: frontend рецепты — список с поиском/фильтрами/пагинацией, карточка, детальная страница, CRUD-формы.

---

## 2026-06-18 — Фаза 11: frontend — рецепты (CRUD, поиск, детали, масштабирование)

### Что сделано
**Хуки (`src/hooks/useRecipes.ts`):** useRecipes, useRecipe, useCategories, useTags, useIngredients (enabled при >=2 символах), useFavoriteToggle, useCreateRecipe, useUpdateRecipe, useDeleteRecipe.

**Компоненты:**
- `StarRating.tsx` — статичный display 1–5 звёзд с optional counter.
- `RecipeCard.tsx` — фото (placeholder если нет), имя автора (first_name + last_name / username), difficulty badge, категории, StarRating, кнопка избранного (только auth).
- `RecipeFiltersBar.tsx` — debounced search (400 мс), difficulty/category/ordering selects, "Моё" switch, кнопка сброса; фильтры через URL search params.
- `AppPagination.tsx` — Bootstrap pagination с умным диапазоном (макс 7 элементов, ellipsis).

**Страницы:**
- `RecipesPage.tsx` — полная реализация (заменён placeholder): фильтры из URLSearchParams, grid 1/2/3 колонки, пагинация, кнопка "+ Новый рецепт" для авторизованных, состояния loading/error/empty.
- `RecipeDetailPage.tsx` — фото, meta-list (автор, сложность, время, рейтинг, приватность), категории и теги, кнопки избранного/edit/delete (для автора), servings control (+/-/сброс) со scaling через `?servings=N`, таблица ингредиентов с `scaled_amount`, нумерованный список шагов, confirm перед удалением.
- `RecipeFormPage.tsx` — create+edit в одном компоненте (определяется по `:id` param), react-hook-form + zod (включая coerce для числовых полей), `useFieldArray` для ингредиентов и шагов, `IngredientSearch` inline combobox (useIngredients + dropdown), toggle-badges для категорий и тегов, предзаполнение формы при edit через `reset()`.

**App.tsx:** маршруты `/recipes`, `/recipes/new`, `/recipes/:id`, `/recipes/:id/edit`, /new и /edit защищены ProtectedRoute. Literal `/recipes/new` стоит перед `/:id` — React Router v6 матчит по специфичности.

### Принятые решения
- **Фильтры в URL** — сохраняются при навигации, работает кнопка «назад».
- **`servings` в query key** — каждое значение кэшируется отдельно; при смене порций новый fetch, предыдущий ответ в кэше не перезаписывается.
- **Избранное в фазе 11** — включено, т.к. это одна мутация и напрямую влияет на список/детальную страницу.
- **IngredientSearch** — useIngredients с `enabled: q.length >= 2`, results в абсолютно позиционированном ListGroup (z-index 1050), закрывается при клике вне.
- **`react-hook-form` + `useFieldArray`** — стандартная связка для динамических списков без ручного управления состоянием.

### Проблемы и решения
- `Recipe.photo` — относительный путь из Django, Vite proxied `/media` → `http://localhost:8000`, поэтому `src={recipe.photo}` работает в dev без изменений.
- Загрузка фото (upload) — намеренно пропущена в Phase 11 (требует `multipart/form-data`). Существующие фото при edit сохраняются (PATCH не перезаписывает поле если не передано).

### Следующий шаг
- Фаза 12: frontend социальные функции — интерактивный рейтинг (звёзды), комментарии (список + форма + удаление).

---

## 2026-06-18 — Фаза 12: frontend — социальные функции (рейтинг + комментарии)

### Что сделано
**Новые хуки (`src/hooks/useSocial.ts`):**
- `useRateRecipe` — мутация `POST /api/recipes/{id}/rate/`, инвалидирует рецепт и список.
- `useComments(recipeId, page)` — query с ключом `['comments', recipeId, page]`.
- `useAddComment(recipeId)` — мутация `POST /api/recipes/{id}/comments/`, инвалидирует комментарии к рецепту.
- `useDeleteComment(recipeId)` — мутация `DELETE /api/comments/{id}/`, инвалидирует комментарии к рецепту.

**Компонент `InteractiveStarRating.tsx`:**
- Для неавторизованных: статичный StarRating + подпись «Войдите, чтобы оценить».
- Для авторизованных: 5 интерактивных звёзд с hover-эффектом (цвет `#ffc107` / `#dee2e6`), клик вызывает `useRateRecipe`.
- Локальный `myRating` state — сохраняет ответ сервера (`result.value`) и показывает «Ваша оценка: N».
- Под звёздами — агрегатный `StarRating` (среднее + счётчик).

**Компонент `CommentsSection.tsx`:**
- Список комментариев с author (first_name+last_name или username), датой, текстом.
- Кнопка «Удалить» — видна если `user.id === comment.author.id || user.id === recipe.author.id` (логика `CanDeleteComment` из backend).
- Пагинация через `AppPagination` (при count > PAGE_SIZE).
- Форма добавления (textarea + кнопка) — только для авторизованных; неавторизованным — ссылка «Войдите».
- После добавления сбрасывает текст и возвращает страницу на 1.
- Форматирование даты на русском (`toLocaleDateString('ru-RU', ...)`).

**`RecipeDetailPage.tsx` обновлён:**
- Пункт «Рейтинг» в meta-листе заменён на `InteractiveStarRating`.
- В конце правой колонки, после шагов, добавлен `<CommentsSection>`.

### Принятые решения
- **Отдельный файл `useSocial.ts`** — не смешиваем recipe-CRUD с social-мутациями, легче читать.
- **`myRating` как локальный state** — бэкенд не возвращает текущий рейтинг пользователя в detail-ответе, поэтому храним последнее отправленное значение в состоянии компонента; при перезагрузке страницы сбрасывается (нет смысла усложнять ради демо).
- **Hover без библиотек** — простой `onMouseEnter`/`onMouseLeave` на span, 0 доп. зависимостей.
- **`canDelete` строка в CommentsSection** — дублирует серверную логику `CanDeleteComment`, но UI должен самостоятельно скрывать кнопку без лишних запросов.

### Проблемы и решения
- Нет. TypeScript-компиляция корректна.

### Следующий шаг
- Фаза 13: frontend планировщик меню (DnD-сетка 7×3, список покупок, порции).

---

## 2026-06-18 — Фаза 13: frontend — планировщик меню (DnD + список покупок)

### Что сделано
**Хуки (`src/hooks/usePlanner.ts`):**
- `usePlan(weekStart)` — загружает план на неделю (автосоздание 21 слота на сервере).
- `useUpdateSlot(weekStart)` — мутация `PATCH /api/menu-plan/slots/{id}/`, инвалидирует план и список покупок.
- `useShoppingList(weekStart, enabled)` — ленивая загрузка (только когда `enabled=true`).

**Компонент `RecipePickerModal.tsx`:**
- Bootstrap Modal с поиском (debounced через React Query, `search` param).
- Список рецептов из `useRecipes`, при выборе закрывает модал и возвращает рецепт.

**`PlannerPage.tsx` (полная реализация):**
- Навигация по неделям: «← Пред.», «След. →», «Текущая неделя» (показывается только если не текущая). Даты вычисляются без UTC-сдвигов (`new Date(y, m-1, d)`).
- DnD через `@dnd-kit/core`: `DndContext` + `PointerSensor` с `activationConstraint: { distance: 8 }` (нет случайных drag при клике).
- Сетка: Bootstrap `Table` + `overflow-x: auto` для адаптивности. Строки = приёмы пищи, столбцы = дни недели.
- `SlotCell` (`useDroppable`) — droppable-ячейка: если пусто — кнопка «+» (пунктирная рамка, `isOver` меняет цвет); если заполнено — `RecipeChip`.
- `RecipeChip` (`useDraggable`) — отдельная ручка-захватчик `⠿` (только она обрабатывает drag listeners), кнопка `×` с `onPointerDown: stopPropagation` чтобы не активировать drag; клик по названию открывает пикер для замены.
- `DragOverlay` — ghostкопия чипа при перетаскивании.
- `handleDragEnd` — drop на пустую ячейку: перемещение; drop на занятую: swap (два последовательных `mutateAsync`).
- Список покупок: кнопка-переключатель → lazy-load `useShoppingList` → Bootstrap Table (ингредиент + сумма + единица через `UNIT_LABELS`).

### Принятые решения
- **`PointerSensor.activationConstraint: { distance: 8 }`** — клик по `×` или по названию не активирует drag; перетаскивание начинается только при реальном движении.
- **Drag handle отдельно от содержимого** — `listeners` только на `⠿`-span, не на весь чип; так кнопка «×» и клик на название работают без конфликта с DnD.
- **Два `mutateAsync` для swap** — простейшая корректная реализация; оба вызова инвалидируют план, финальный рефетч даёт правильный состояние без оптимистичных обновлений.
- **`useShoppingList(enabled)` — ленивая загрузка** — не делаем запрос при загрузке страницы; только когда пользователь открывает секцию.
- **Дата без UTC-сдвига** — `new Date(y, m-1, d)` (локальный конструктор) вместо `new Date(isoString)` — нет риска сдвига на ±1 день в часовых поясах западнее UTC.

### Проблемы и решения
- Нет. TypeScript-компиляция корректна.

### Следующий шаг
- Фаза 14: frontend дашборд — Recharts (bar + pie), статистики.
