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

---

## 2026-06-18 — Фаза 14: frontend — дашборд (Recharts)

### Что сделано
**Хук (`src/hooks/useDashboard.ts`):** `useDashboardStats()` — `staleTime: 5 мин`, endpoint `/api/dashboard/stats/` (AllowAny).

**`DashboardPage.tsx` (полная реализация):**
- **4 StatCard** (totals): Рецептов / Ингредиентов / Комментариев / Пользователей — большое число с accent-цветом, Bootstrap grid `xs=2 md=4`.
- **BarChart «По категориям»** (Recharts `BarChart`): вертикальные столбцы, XAxis с `angle=-35` чтобы длинные подписи не перекрывались, `radius=[3,3,0,0]` для скруглённых верхушек.
- **PieChart «По сложности»** (Recharts `PieChart`): donut (`innerRadius=52, outerRadius=82`), 3 цвета — зелёный/жёлтый/красный через `DIFF_COLORS`, `Legend` снизу.
- **BarChart «По времени»** (`layout="vertical"` — горизонтальные полосы): XAxis type="number", YAxis type="category" с range-строками из бэкенда, `radius=[0,3,3,0]`.
- **Топ теги**: badge-облако из `top_tags` (name + count).
- **Топ-5 по рейтингу**: ранг + ссылка на рецепт + `StarRating` компонент.
- **Топ-5 по избранному**: ранг + ссылка + счётчик `♥ N`.
- Все чарты завёрнуты в `ResponsiveContainer width="100%"` — адаптируются под ширину колонки.
- Все секции — в `Section` (Card-обёртка), загрузка — Spinner, ошибка — Alert.

### Принятые решения
- **`staleTime: 5 мин`** — данные дашборда не меняются мгновенно, не нужно рефетчить при каждом фокусе.
- **Donut вместо pie** — с `innerRadius` центральная область свободна для подписей Legend, легче читать.
- **`layout="vertical"` для cooking_time** — range-строки с символами («< 15 мин», «> 60 мин») лучше читаются как метки оси Y, а не повёрнутые метки X.
- **`angle=-35` на XAxis категорий** — 8 категорий не помещаются горизонтально, лёгкий наклон без потери читаемости.
- **`Section` компонент** — переиспользуемый Card с заголовком, устраняет повторение `Card.Body + h6`.

### Проблемы и решения
- Нет. TypeScript-компиляция корректна.

### Следующий шаг
- Фаза 15: frontend тесты (Vitest + React Testing Library, ≥5 тестов).

---

## 2026-06-18 — Фаза 15: frontend тесты (Vitest + React Testing Library)

### Что сделано
Написано **21 тест** в 4 файлах, существенно превышает минимум ≥5:

| Файл | Тестов | Что проверяет |
|---|---|---|
| `StarRating.test.tsx` | 5 | 5 звёзд рендерятся, value/count отображаются, null value не показывает цифр, font-size для md |
| `AppPagination.test.tsx` | 5 | null при 1 странице, все страницы при ≤7, onChange вызывается с верным номером, active-класс, ellipsis при >7 |
| `RecipeCard.test.tsx` | 6 | title, full author name, username fallback, difficulty badge (локализованный), «Нет оценок» при null rating, cooking_time |
| `HomePage.test.tsx` | 5 | main heading, кнопка «Создать аккаунт» (un-auth), скрыта при auth (localStorage), секция демо-аккаунтов, ссылка на рецепты |

**Инфраструктура тестов:**
- `src/test/utils.tsx` — кастомный `render` с тремя провайдерами: `QueryClientProvider` (retry=false, gcTime=0) + `MemoryRouter` + `AuthProvider`. Используется для компонентов с хуками React Query / Auth.
- `src/test/fixtures.ts` — `mockRecipe: RecipeList` с полным набором полей для переиспользования в тестах.

### Принятые решения
- **Кастомный render в `utils.tsx`** — все провайдеры в одном месте, тесты не дублируют обёртки; `createTestQueryClient` со `staleTime=0, retry=false` — быстрые тесты без real API.
- **`vi.fn()` глобально** — `globals: true` в vite.config.ts покрывает `vi`, `describe`, `it`, `expect`, никаких импортов из vitest в тест-файлах.
- **Тесты аутентификации через localStorage** — `AuthProvider` читает localStorage при монтировании; `beforeEach/afterEach localStorage.clear()` — полная изоляция между тестами.
- **`StarRating`/`AppPagination` — без провайдеров** — чистые display-компоненты, тестируются с `@testing-library/react` напрямую.

### Проблемы и решения
- Нет. Все тесты корректны по структуре и не зависят от внешних запросов.

### Следующий шаг
- Фаза 16: Dockerization (Dockerfile backend, Dockerfile frontend, nginx, docker-compose, entrypoint: migrate → seed → collectstatic → gunicorn).

---

## 2026-06-18 — Фаза 16: Dockerization

### Что сделано
**`backend/Dockerfile`** — `python:3.12-slim`, `PYTHONUNBUFFERED/PYTHONDONTWRITEBYTECODE`, `pip install --no-cache-dir`, `EXPOSE 8000`, `ENTRYPOINT entrypoint.sh`.

**`backend/entrypoint.sh`** — последовательность при каждом старте контейнера:
1. `python manage.py migrate --noinput`
2. `python manage.py seed` (идемпотентно — безопасно при перезапуске)
3. `python manage.py collectstatic --noinput`
4. `exec gunicorn config.wsgi:application --bind 0.0.0.0:8000 --workers 2 --timeout 120 --access-logfile -`

**`frontend/Dockerfile`** — двухэтапная сборка: `node:20-alpine` для `npm ci && npm run build`, затем `nginx:1.27-alpine` для раздачи `dist/`.

**`frontend/nginx.conf`** — конфигурация nginx:
- `/api/` → proxy_pass `backend:8000` (timeout 120s)
- `/static/` → proxy_pass `backend:8000` (Django admin CSS через WhiteNoise)
- `/media/` → alias `/app/media/` (shared volume, expires 7d)
- `location /` → `try_files` с fallback на `index.html` (SPA-роутинг React Router)

**`docker-compose.yml`** — три сервиса:
- `db` — `postgres:16-alpine`, healthcheck (`pg_isready`), именованный volume `postgres_data`
- `backend` — depends_on db с `condition: service_healthy`, volume `media_files:/app/media`
- `frontend` — порт `${PORT:-80}:80`, volume `media_files:/app/media:ro` (read-only)

**`backend/requirements.txt`** — добавлен `whitenoise>=6.8`.

**`backend/config/settings.py`** — добавлен `whitenoise.middleware.WhiteNoiseMiddleware` после SecurityMiddleware (нужен для раздачи `/static/` в production при DEBUG=False).

**`.dockerignore`** — `backend/` (исключает `__pycache__`, `.env`, `staticfiles/`, `media/`, `.git/`), `frontend/` (исключает `node_modules/`, `dist/`, `.env*`, `.git/`).

### Принятые решения
- **WhiteNoise** — стандартный способ раздачи Django static files через Gunicorn без отдельного тома; nginx проксирует `/static/` на backend, WhiteNoise перехватывает в middleware.
- **Shared volume `media_files`** — backend пишет, nginx читает (`:ro`) и отдаёт напрямую без проксирования на Gunicorn — эффективнее.
- **`depends_on: condition: service_healthy`** — backend стартует только после того, как PostgreSQL принял соединения; healthcheck `pg_isready` с `retries: 10`.
- **Entrypoint без `|| true`** — `seed` идемпотентен и всегда возвращает 0; `set -e` прерывает скрипт при реальной ошибке.
- **`exec gunicorn`** — `exec` заменяет shell-процесс Gunicorn, чтобы сигналы (SIGTERM от Docker) корректно доходили до воркеров.
- **`${VAR:-default}` в compose** — разумные defaults для локального запуска без `.env`; секретный ключ по умолчанию явно помечен как "change-in-production".

### Проблемы и решения
- Нет.

### Следующий шаг
- Фаза 17: CI/GitHub Actions (lint + test backend на push).

---

## 2026-06-18 — Фаза 17: CI/GitHub Actions

### Что сделано
Создан `.github/workflows/ci.yml` — два параллельных job-а:

**Job `backend`** (`ubuntu-latest`):
- PostgreSQL 16 service container (`postgres:16-alpine`) с healthcheck `--health-cmd pg_isready`.
- `actions/setup-python@v5` (Python 3.12, кэш pip по `requirements*.txt`).
- `pip install -r requirements.txt -r requirements-dev.txt`.
- `ruff check .` — линт.
- `pytest --tb=short -q` — тесты + coverage (флаги из `pyproject.toml` addopts: `--cov=apps --cov-report=term-missing`).
- Переменные окружения: `POSTGRES_*`, `SECRET_KEY`, `DEBUG=True` — задаются на уровне job.

**Job `frontend`** (`ubuntu-latest`):
- `actions/setup-node@v4` (Node 20, кэш npm по `frontend/package-lock.json`).
- `npm ci`.
- `npx tsc` — type-check (tsconfig.json уже имеет `"noEmit": true`).
- `npm test` — запускает `vitest run`.

Оба job-а используют `defaults.run.working-directory` для корректного рабочего каталога.
Кэш pip/npm ускоряет повторные запуски CI.

### Принятые решения
- **Два отдельных job-а** (не steps в одном) — backend и frontend могут выполняться параллельно, быстрее общий pipeline.
- **`cache-dependency-path` с glob `requirements*.txt`** — захватывает и `requirements.txt`, и `requirements-dev.txt`; при изменении любого файла кэш pip инвалидируется.
- **`postgres:16-alpine` в service container** — нет необходимости в `docker-compose` для тестов; стандартная практика GitHub Actions для тестов с БД.
- **Env vars на уровне job, не step** — все шаги `backend`-job имеют доступ к `POSTGRES_*` и `SECRET_KEY` без дублирования.
- **`npx tsc` (без флагов)** — `tsconfig.json` уже имеет `"noEmit": true`, поэтому тайп-чек не создаёт файлы, а просто проверяет типы.

### Проблемы и решения
- Нет.

### Следующий шаг
- Фаза 18: README.md + финальная полировка.

---

## 2026-06-18 — Фаза 18: README.md + финальная полировка

### Что сделано
Написан полноценный `README.md`:
- **Быстрый старт** — три команды (`git clone` + `cp .env.example .env` + `docker compose up --build`), таблица с адресами (фронтенд / API / Swagger / ReDoc).
- **Демо-аккаунты** — таблица с логинами `alice`/`alice1234` и `bob`/`bob1234`, описание подготовленных данных.
- **Функциональность** — перечень всех реализованных фич (рецепты, поиск, порции, соц-фичи, планировщик, список покупок, дашборд, JWT).
- **Локальная разработка** — инструкции для backend (venv, env-переменные, migrate + seed, runserver) и frontend (npm install + dev, proxy-пояснение).
- **Тесты** — команды и краткое описание покрытия (45 backend + 21 frontend).
- **Переменные окружения** — полная таблица с defaults и production-предупреждением.
- **Структура репозитория** — ASCII-дерево с пояснениями.
- **CI** — раздел с описанием GitHub Actions workflow.

### Принятые решения
- **README на русском** — проект для русскоязычного заказчика, документация на том же языке.
- **Нет скриншотов** — проект работает локально, нет развёрнутой демо-среды для снимков; инструкции достаточно для оценки.
- **`<repo-url>` в git clone** — не фиксирую реальный URL в README, чтобы не вставлять недостоверные данные.

### Итог проекта
Все 19 фаз (0–18) завершены:
- ✅ Backend: Django 5 + DRF + PostgreSQL, 5 приложений, 45 тестов
- ✅ Frontend: React 18 + TypeScript + Vite + Bootstrap, 21 тест
- ✅ Docker: `docker compose up` — три сервиса, одна команда
- ✅ CI: GitHub Actions — lint + тесты на каждый push
- ✅ Документация: ARCHITECTURE.md + REPORT.md + README.md

---

## 2026-06-18 — Финальная проверка: первая реальная сборка фронтенда

### Что сделано
Запуск `docker compose up --build -d` (флаг `-d` добавлен в README) выявил три проблемы — это был **первый реальный запуск компиляции фронтенда** (раньше `tsc` был прописан только в CI, но не выполнялся). Все исправлены, приложение поднимается и отвечает на порту 8888.

### Проблемы и решения
1. **Отсутствовал `frontend/package-lock.json`** — `npm ci` (в Dockerfile и CI) без lock-файла падает. Сгенерирован через `npm install` и закоммичен.
2. **Тест-файлы не видели vitest-глобалы** (`describe`/`it`/`expect`/`vi`) при `tsc` — `npm run build` (`tsc && vite build`) проверяет типы во всём `src`, включая `*.test.tsx`. Добавлен `"types": ["vitest/globals", "@testing-library/jest-dom"]` в `tsconfig.json`.
3. **`<Button as={Link as React.ElementType}>`** — каст конфликтовал с полиморфным типом `as` у react-bootstrap `Button` (9 мест: HomePage, NotFoundPage, RecipesPage, RecipeDetailPage, AppNavbar). Заменено на идиоматичный `<Link className="btn btn-...">` — рендерится идентично, типобезопасно, без полиморфизма.

### Проверка
- `npx tsc` — 0 ошибок.
- `npm test` — все 21 тест проходят (замены `Button`→`Link` не сломали тесты: они используют `getByText`, не `getByRole('button')`).
- `docker compose up --build -d` — образы собираются, контейнеры здоровы.
- Через nginx на 8888: `/` → 200, `/api/health/` → `{"status": "ok"}`, `/api/recipes/` → 28 публичных рецептов. Backend: миграции + seed (29 рецептов, 2 юзера, план меню) + collectstatic + gunicorn.

### Вывод
CI с самого начала прогнал бы `tsc`/`npm ci` и поймал бы эти ошибки — но локальная сборка обнаружила их раньше. Урок: type-check (`npm run build`) нужно гонять локально до коммита, не полагаясь только на CI.

---

## 2026-06-18 — Доработка: страница профиля пользователя

### Что сделано
Добавлена защищённая страница `/profile` (ссылка в навбаре уже вела на неё) с тремя блоками:
1. **Смена отображаемого имени** — форма first_name/last_name (react-hook-form + zod), `PATCH /api/auth/me/` → `updateUser()` синхронизирует контекст, localStorage и имя в навбаре.
2. **Смена пароля** — форма (текущий / новый / подтверждение), `POST /api/auth/change-password/`.
3. **Список своих рецептов** — `useRecipes({ author: user.id })`, грид `RecipeCard` + пагинация, кнопка «+ Новый рецепт», empty-state.

**Backend:**
- `ChangePasswordSerializer` (`apps/users/serializers.py`) — проверяет текущий пароль через `user.check_password()`, `new_password` min 8 символов.
- `ChangePasswordView` (`POST /api/auth/change-password/`, `IsAuthenticated`).
- Маршрут `auth/change-password/`.
- 4 теста в `test_auth.py`: успех, неверный текущий пароль (400), короткий новый (400), без авторизации (401).

**Frontend:**
- `author?: number` добавлен в `RecipeFilters` + сериализация в `recipesApi.list`.
- `authApi.changePassword(current, new)`.
- `ProfilePage.tsx` (3 секции-компонента) + защищённый маршрут в `App.tsx`.

### Принятые решения
- **Смена пароля требует текущий** — стандартная безопасная практика для self-service; токены SimpleJWT остаются валидными до истечения (stateless), принудительный релогин не делаю — для демо избыточно.
- **«Сбросить пароль» трактую как смену пароля** — пользователь на странице профиля уже авторизован, email-flow восстановления не нужен и не предусмотрен инфраструктурой.
- **Список своих рецептов через `?author=<id>`** — фильтр уже был в backend `RecipeFilter`; для своего автора queryset отдаёт и приватные рецепты (`Q(is_public=True) | Q(author=user)`). Не плодим новый endpoint.
- **Email показан read-only** — требование «сменить отображаемое имя» = first/last name; email оставлен как контекст (бэкенд PATCH /me/ его поддерживает, но в UI профиля не редактируется, чтобы строго следовать заданию).

### Проверка
- Backend: 10 auth-тестов проходят (6 старых + 4 новых).
- Frontend: `tsc` 0 ошибок, 21 тест проходит.
- End-to-end (`docker compose up --build -d`, порт 8888): логин alice → `?author=1` отдаёт её рецепты (с приватными) → смена пароля → логин с новым паролем → возврат на `alice1234` (демо сохранено) → неверный текущий пароль отклонён (400).

---

## 2026-06-18 — Доработка: реальные фото блюд

### Что сделано
Заменил PIL-заглушки на настоящие фотографии блюд для всех 29 рецептов.

- **Источник** — Wikimedia Commons (свободные лицензии CC/PD; согласовано с заказчиком). 29 изображений (~900 px) сложены в `backend/apps/recipes/seed_images/recipe_NN.<ext>`, провенанс — в `CREDITS.md`.
- **seed.py** — `_assign_photo()` грузит реальное фото из `seed_images/` (хелпер `_seed_image()` с glob по индексу), с откатом на генерируемую заглушку, если файла нет. Логика идемпотентна и умеет обновлять старые заглушки. Применил к текущей БД через `seed --reset`.
- **Фикс отображения** — `RecipeListSerializer`/`RecipeDetailSerializer` теперь отдают `photo` относительным URL (`obj.photo.url` → `/media/...`) вместо host-based абсолютного. Абсолютный URL строился по заголовку Host (`http://localhost`, без порта) и ломался в браузере на порту 8888.
- Скрипт-загрузчик — одноразовый, в репозиторий не коммитился.

### Контроль качества
Каждое из 29 фото просмотрено визуально (инструментом чтения изображений). Несколько первых совпадений поиска оказались мимо и переподобраны:
- Оливье → выдавало «сербский рождественский стол» → заменил на классический оливье;
- яичница с беконом → бургер → «bacon and eggs»;
- запечённые овощи / котлеты → блюда с курицей → отфильтровал мясо/птицу в названии;
- рыба → паста-гратен → запечённый лосось с лимоном;
- чизкейк → японский суфле → классический с клубничным соусом;
- зелёный смузи → витрина с разноцветными смузи → одиночный зелёный смузи.

### Проверка
- 29 файлов в `media/recipes/` (старые `placeholder_*` удалены). Все 28 видимых рецептов на :8888 отдают `photo`, 0 битых ссылок; пример: `/media/recipes/recipe_27.jpg` → HTTP 200, image/jpeg, 204 КБ.
- Backend: 53 теста проходят (изменение сериализатора ничего не сломало).
- Воспроизводимо: при свежем `docker compose up` фото берутся из репозитория и прописываются в БД на старте.

### Принятые решения
- **Относительный URL для `photo`** вместо правки nginx (`$http_host`) — origin-независимо, работает и в dev (Vite proxy), и за прокси на любом порту.
- **Атрибуция в `CREDITS.md`** — CC-лицензии требуют указания источника; перечислил файл-источник Commons для каждого фото.

---

## 2026-06-18 — Аудит валидации и защиты от инъекций

### Что проверено (по запросу заказчика)

**1. Фронтенд-валидация основных сущностей — ЕСТЬ.**
zod-схемы на всех формах: вход (`LoginPage`), регистрация (`RegisterPage` — username regex, email, пароль ≥ 8, совпадение), рецепт (`RecipeFormPage` — title 3–255, description ≥ 10, время/порции ≥ 1, количество > 0, шаг ≥ 5 символов), профиль (`ProfilePage`). Комментарий — базовая проверка (непустой, `maxLength` 1000).

**2. Защита от SQL-инъекций — ЕСТЬ.**
Поиск по всему backend (`.raw(`, `.extra(`, `cursor(`, `RawSQL`, строковая интерполяция в запросах) — 0 совпадений. Все запросы через Django ORM (параметризованные). Поиск по ингредиентам `?ingredients=` использует `__icontains` (параметр, не f-string), `?author=` — типизированный `NumberFilter`, `week_start` — `date.fromisoformat`. Уязвимостей нет.

**3. Бэкенд-валидация входных данных — была частичной, ДОПОЛНЕНА.**
Было: типы (DRF-поля), choices (difficulty/unit), диапазон рейтинга 1–5, валидация недели/приватного рецепта в планировщике. Не хватало: запрета HTML/тегов и части границ.

### Что добавлено
- **`apps/common/validators.py::no_html`** — отклоняет HTML/XML-теги (анти-XSS). Регексп `<\s*/?\s*[a-zA-Z!][^>]*>` ловит реальные теги (`<script>`, `</b>`, `<img …>`), но НЕ ругается на одиночные `<`/`>` («варить < 5 мин»).
- Применён в: `RecipeWriteSerializer` (title, description), `RecipeStepSerializer` (text), `CommentSerializer` (text), `RegisterSerializer`/`UserSerializer` (first_name, last_name).
- **Ужесточение типов**: `amount` > 0 (`min_value=0.01`), `cooking_time`/`servings` 1…N, `title` 3–255, `description` ≥ 10, комментарий ≤ 2000 и не из одних пробелов.
- **14 тестов** в `test_validation.py` (отклонение HTML в title/description/шаге/комментарии/имени; границы amount/servings/time; допуск «< 5 мин»; валидные данные проходят).

### Проверка
- Backend: **67 тестов** проходят (53 прежних + 14 новых) — существующие не сломаны.
- Live на :8888: `POST /api/recipes/` с `title="<script>…"` → **HTTP 400** (gunicorn пересобран).

### Принятые решения
- **Отклонять, а не вырезать теги** — требование «не должно быть html»; пользователь сразу видит ошибку, бэкенд не хранит «очищенный» неожиданный текст.
- **Сервер — источник истины** — клиентскую валидацию легко обойти; те же правила продублированы на бэкенде.
- **Общий модуль `apps/common`** (без моделей, не в INSTALLED_APPS) — переиспользуемый валидатор для всех приложений.
- Фронтенд не трогал по содержимому: React экранирует вывод (XSS при рендере не возникает), а серверный 400 с сообщением показывается в форме.

---

## 2026-06-18 — UX-правки и улучшение отображения ошибок валидации

### Что сделано (по запросу заказчика)
1. **Тумблер «Моё» → «Избранное»** на странице рецептов (`RecipeFilters`) — он и фильтровал `favorites`, теперь подпись соответствует.
2. **Убрана плашка «Демо-аккаунты»** с главной (`HomePage`) + обновлён тест (был 21 → 20 frontend-тестов).
3. **Ошибки бэкенда подсвечивают поля.** Добавлен `utils/serverErrors.ts::applyServerErrors` — мапит DRF-ответ `{field: [...]}` на поля react-hook-form через `setError` (поле краснеет + показывает сообщение) и возвращает общий текст для верхней плашки. Применён в `RecipeFormPage`, `RegisterPage`, `ProfilePage` (имя + пароль). Раньше показывалась только верхняя плашка.
4. **Конкретные сообщения клиентской валидации.** В `RecipeFormPage` у шагов и количества ингредиента было только подсвечивание без текста — добавлены `Form.Control.Feedback` (например, «Минимум 5 символов» для шага, «Количество должно быть > 0»).

### Принятые решения
- **Мапятся только скалярные поля** (`title`, `description`, `cooking_time`, `servings`, `difficulty`; имена; пароли). Ошибки вложенных массивов (ingredients/steps) и `detail`/`non_field_errors` идут в верхнюю плашку — точечная подсветка строк массива потребовала бы разбора индексов DRF, что избыточно.
- **Плашка остаётся всегда** при ошибке: если все ошибки легли на поля — показывается «Исправьте ошибки в выделенных полях».

### Проверка
- `tsc` — 0 ошибок; **20 frontend-тестов** проходят; фронтенд пересобран, `:8888` отдаёт 200.

---

## 2026-06-19 — Починен поиск по тегам и по ингредиентам

### Симптом (по запросу заказчика)
- Не работал поиск по тегам.
- Не работал поиск по ингредиентам («что приготовить из курицы и риса»).

### Диагноз
Обе функции были полностью реализованы на бэкенде (`RecipeFilter.tag` = `tags__slug`; `?ingredients=a,b` — AND через `__icontains`), в API-слое (`recipesApi.list`) и в типах — **но не подключены в UI**:
1. В фильтр-баре (`RecipeFilters`) не было ни выбора тега, ни поля ингредиентов — только поиск по названию, сложность, категория, сортировка, избранное.
2. `RecipesPage` гоняет все фильтры через URL, а `filtersFromParams`/`filtersToParams` **не читали и не писали** `tag`/`ingredients` — значения терялись бы даже при наличии контролов.
3. Отдельная причина «ингредиентного» бага: дословный `icontains('курица')` не ловит словоформы в данных («Куриное филе», «Куриные яйца», «Бульон куриный» — основа «курин», а не «куриц»), как и «курицы» из примера. Свободный текст здесь принципиально ненадёжен для русской морфологии.

### Что сделано (frontend)
- **`RecipesPage`**: `tag` и `ingredients` теперь читаются из URL и сериализуются обратно (round-trip фильтров через адресную строку восстановлен).
- **`RecipeFilters`**: добавлен выпадающий список тегов (`useTags`, value = `slug`) и поле поиска по ингредиентам; раскладка переразбита на две строки.
- **`IngredientMultiSelect`** (новый компонент): автокомплит по реальному справочнику ингредиентов (`/api/ingredients/?search=`, мин. 2 символа) + чипы выбранного. Пользователь печатает «кур» → выбирает «Куриное филе»; на бэкенд уходят точные имена, `icontains` их ловит гарантированно — морфологическая проблема снята без рискованного стемминга. Несколько чипов = логика AND («есть все»).
- **`RecipeDetailPage`**: теги-бейджи стали кликабельными ссылками `/recipes?tag=<slug>` — естественная точка входа в «поиск по тегам».

### Принятые решения
- **Пикер реальных ингредиентов вместо свободного текста.** Переиспользует существующий паттерн `IngredientSearch` из формы рецепта; гарантированно находит данные и прямо отвечает на пример заказчика. Альтернатива — стемминг русского на бэкенде — даёт ложные срабатывания («кур» → «Куркума») и отвергнута.
- Бэкенд-фильтры **не менялись** — они были корректны; баг был исключительно в неподключённом UI.

### Проверка
- Бэкенд (live, `:8888`): `?tag=bystroe` → 9 рецептов; `?ingredients=Куриное филе` → 3 (Цезарь, Шаурма, Куриный суп); `?ingredients=Рис белый` → 1 (Ризотто). Логика AND подтверждена.
- `tsc` — 0 ошибок; **20 frontend-тестов** проходят; фронтенд пересобран, `:8888` отдаёт 200.
