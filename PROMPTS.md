# Поток промптов — проект «Кулинарная книга рецептов»

## Используемые инструменты

- **Claude Code** + LLM Sonnet / Opus
- **Qwen Code** + LLM Qwen Coder Next

---

**1.**

```text
# задачи
  разработать архитектуру, которую обязательно сохранить в файле ARCHITECTURE.md, обновлять по мере разработки
  разработать пошаговый план на разработку проекта кулинарная книга рецептов

  # требования
  Создать full‑stack приложение (backend + frontend + БД)

  Общие требования для всех вариантов
Функциональные (базовые):

CRUD основных сущностей с валидацией на клиенте и сервере
Поиск и фильтрация по ключевым полям
Дашборд с визуализацией данных (графики / статистика)
Пагинация списков
Адаптивная вёрстка (desktop + mobile)
Нефункциональные:

Seed‑данные: приложение запускается с реалистичным набором демо‑данных
REST API с OpenAPI/Swagger документацией (в виде живой веб-страницы, а не доки в проекте)
Не менее 10 unit/integration тестов
CI pipeline (GitHub Actions): lint + тесты; сборка Docker‑образа — опционально
Всё приложение запускается одной командой docker compose up (backend + frontend + БД)
файл README.md инструкцией по запуску (формат - markdown)
Файл ARCHITECTURE.md с описанием архитектуры и плана разработки (начните с него, формат - markdown)
(Опционально) Ссылка на видео-демонстрацию работы приложения может упростить и ускорить проверку
Файл REPORT.md с вашим описанием истории создания проекта, с какими ключевыми проблемами вы столкнулись, как решали. Ваши удачные и неудачные шаги. Добавляйте туда данные по мере работы, не в самом конце. Формат - markdown.
Проект создан в новом, пустом GIT репозитории. Существует адекватная история коммитов (не всё разом).

  Вариант 3: Книга рецептов
Общие требования плюс:

Функциональные:

Рецепты: название, описание, время приготовления, сложность, фото (upload), пошаговые инструкции
Ингредиенты с количеством и единицами измерения (граммы, штуки, мл)
Категории и теги (завтрак, десерт, веган, быстрое и т.д.)
Поиск рецептов по названию, ингредиентам («что приготовить из курицы и риса»), тегам
Планировщик меню на неделю: drag‑and‑drop рецептов в слоты (пн‑вс × завтрак/обед/ужин)
Автогенерация списка покупок из плана меню (агрегация ингредиентов с суммированием)
Масштабирование порций: пересчёт ингредиентов на N порций
Избранное: добавление рецептов в закладки
Рейтинг рецептов (1–5 звёзд) с сортировкой по среднему рейтингу
Регистрация / авторизация (JWT), два предзаполненных пользователя; рецепт может быть публичным (виден всем) или приватным (только автор); имя автора отображается на карточке рецепта
Комментарии к рецептам: авторизованный пользователь оставляет комментарии с отметкой времени и автора; владелец рецепта может удалить любой комментарий
Seed‑данные: 25+ рецептов с фото‑заглушками, 50+ ингредиентов, готовый план меню на неделю, 2 пользователя, 20+ комментариев
  дизайн для фронтенда используй простой, лаконичный, bootstrap, адаптивный

  # технологии
  Django + DRF + React + PostgreSQL

  # важно
  если есть вопросы - спрашивай
  коммитить и пушить - только по команде
  СТРОГО следуй требованиям, если есть сомнения - лучше спроси
```

**2.**

```text
добавь .gitignore с базовыми значениями
```

**3.**

```text
сделай коммит шага 0
```

**4.**

```text
приступай к шагу 1
```

**5.**

```text
сделай коммит шага 1
```

**6.**

```text
приступай к шагу 2
```

**7.**

```text
сделай коммит шага 2
```

**8.**

```text
приступай к шагу 3 и 4
```

**9.**

```text
сделай коммит шага 3 и 4
```

**10.**

```text
приступай к шагу 5
```

**11.**

```text
сделай коммит шага 5
```

**12.**

```text
приступай к шагу 6
```

**13.**

```text
сделай коммит шага 6
```

**14.**

```text
приступай к шагу 7
```

**15.**

```text
сделай коммит шага 7
```

**16.**

```text
приступай к шагу 8
```

**17.**

```text
сделай коммит шага 8
```

**18.**

```text
приступай к шагу 9
```

**19.**

```text
сделай коммит шага 9
```

**20.**

```text
приступай к шагу 10
```

**21.**

```text
сделай коммит шага 10
```

**22.**

```text
приступай к шагу 11
```

**23.**

```text
сделай коммит шага 11
```

**24.**

```text
приступай к шагу 12
```

**25.**

```text
сделай коммит шага 12
```

**26.**

```text
приступай к шагу 13
```

**27.**

```text
сделай коммит шага 13
```

**28.**

```text
приступай к шагу 14
```

**29.**

```text
сделай коммит шага 14
```

**30.**

```text
приступай к шагу 15
```

**31.**

```text
сделай коммит шага 15
```

**32.**

```text
приступай к шагу 16
```

**33.**

```text
сделай коммит шага 16
```

**34.**

```text
приступай к шагу 17
```

**35.**

```text
коммит фазы 17
```

**36.**

```text
приступай к шагу 18
```

**37.**

```text
сделай коммит шага 18
```

**38.**

```text
поправь readme, repo: https://github.com/TutunaruStanislav/cookbook
```

**39.**

```text
внешний порт приложения нужно изменить на 8888
```

**40.**

```text
собери проект выполнив единую команду для быстрого старта
  перед этим добавь директиву -d для docker compose и поправь это в readme
```

**41.**

```text
коммить эти изменения
```

**42.**

```text
добавь страницу профиля пользователя:

  возможность сменить отображаемое имя, сбросить пароль, посмотреть список рецептов созданных пользователем
```

**43.**

```text
коммить эти изменения
```

**44.**

```text
у тебя есть 28 рецептов в БД
  нужно найти красивые картинки и залить их
```

**45.**

```text
коммить эти изменения
```

**46.**

```text
проверь, что есть валидация на фронтенде основных сущностей
  а также на бэкенде валидация входных данных: по типу, по содержанию (не должно быть html и других тегов)
  проверь защиту от sql инъекций
```

**47.**

```text
коммить эти изменения
```

**48.**

```text
на странице рецептов переименуй тумблер "мое" в "избранное"
  убери плашку с главной про демо
  валидация:
  - при ответе от бэка вверху выводится плашка с ошибкой, но нужно еще подсвечивать соответствующие поля на фронте
  - при ошибке валидации на клиенте нет конкретной ошибки, только выделяется поле (например Шаги приготовления при создании рецепта)
```

**49.**

```text
коммить эти изменения
```

**50.**

```text
не работает поиск по тегам
  не работает поиск по ингредиентам («что приготовить из курицы и риса»)
```

**51.**

```text
коммить эти изменения
```

**52.**

```text
Планировщик меню на неделю: drag‑and‑drop рецептов в слоты (пн‑вс × завтрак/обед/ужин)
  проблемы:
  - при переносе уже запланированного блюда на завтрак например с понедельника на вторник - все слетает
  - не хватает возможности увидеть названия блюд запланированных, неинформативно
```

**53.**

```text
добавь возможность в одном слоте положить до 3 блюд
```

**54.**

```text
коммить эти изменения
```

**55.**

```text
нужно чтобы в избранное можно было добавить прямо по нажатию на сердечко в списке рецептов - добавление/удаление
```

**56.**

```text
коммить эти изменения
```

**57.**

```text
Рейтинг рецептов (1–5 звёзд) с сортировкой по среднему рейтингу
  кажется сортировка работает неверно
```

**58.**

```text
коммить эти изменения
```

**59.**

```text
приватный рецепт Алисы "хумус домашний" отображается и у Боба
```

**60.**

```text
коммить эти изменения
```

**61.**

```text
нужно чтобы можно было запустить приложение через команду git clone <repo> && cd <repo>
     docker compose up
```

**62.**

```text
коммить эти изменения
```

**63.**

```text
{
    "error": "Параметр week_start обязателен (YYYY-MM-DD)."
  } в swagger
```

**64.**

```text
API — преподаватель открывает Swagger UI по адресу http://localhost:<port>/docs (или /redoc, /api-docs) и проверяет эндпоинты
```

**65.**

```text
коммить эти изменения
```

**66.**

```text
добавь возможность загрузить фото при создании рецепта
```

**67.**

```text
коммить эти изменения
```

**68.**

```text
линтеры в gitlab actions выдали такие ошибки, надо исправить:
    I001 [*] Import block is un-sorted or un-formatted
       --> apps/recipes/management/commands/seed.py:761:9
        |
    760 |       def _reset(self):
    761 | /         from apps.social.models import Comment, Favorite, Rating
    762 | |         from apps.planner.models import MenuPlan
    763 | |         from apps.recipes.models import Recipe, Category, Tag, Ingredient
        | |_________________________________________________________________________^
    764 |           Comment.objects.all().delete()
    765 |           Rating.objects.all().delete()
        |
    help: Organize imports

    I001 [*] Import block is un-sorted or un-formatted
      --> apps/recipes/views.py:72:9
       |
    71 |     def get_queryset(self):
    72 |         from apps.social.models import Favorite  # lazy import — social depends on recipes
       |         ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    73 |
    74 |         user = self.request.user
       |
    help: Organize imports

    F401 [*] `apps.recipes.models.Category` imported but unused
     --> tests/test_dashboard.py:4:33
      |
    2 | import pytest
    3 |
    4 | from apps.recipes.models import Category, Ingredient, Recipe
      |                                 ^^^^^^^^
    5 | from apps.social.models import Comment, Favorite, Rating
      |
    help: Remove unused import

    F401 [*] `apps.recipes.models.Ingredient` imported but unused
     --> tests/test_dashboard.py:4:43
      |
    2 | import pytest
    3 |
    4 | from apps.recipes.models import Category, Ingredient, Recipe
      |                                           ^^^^^^^^^^
    5 | from apps.social.models import Comment, Favorite, Rating
      |
    help: Remove unused import

    F401 [*] `apps.recipes.models.Recipe` imported but unused
     --> tests/test_dashboard.py:4:55
      |
    2 | import pytest
    3 |
    4 | from apps.recipes.models import Category, Ingredient, Recipe
      |                                                       ^^^^^^
    5 | from apps.social.models import Comment, Favorite, Rating
      |
    help: Remove unused import

    F401 [*] `apps.social.models.Comment` imported but unused
     --> tests/test_dashboard.py:5:32
      |
    4 | from apps.recipes.models import Category, Ingredient, Recipe
    5 | from apps.social.models import Comment, Favorite, Rating
      |                                ^^^^^^^
    6 |
    7 | pytestmark = pytest.mark.django_db
      |
    help: Remove unused import: `apps.social.models.Comment`

    F841 Local variable `other_recipe` is assigned to but never used
      --> tests/test_social.py:38:5
       |
    36 | def test_favorites_filter(api_client, alice, bob, make_recipe):
    37 |     fav_recipe = make_recipe(alice, title='Favourite One')
    38 |     other_recipe = make_recipe(alice, title='Not Favourite')
       |     ^^^^^^^^^^^^
    39 |     Favorite.objects.create(user=bob, recipe=fav_recipe)
    40 |     api_client.force_authenticate(user=bob)
       |
    help: Remove assignment to unused variable `other_recipe`

    Found 7 errors.
    [*] 6 fixable with the `--fix` option (1 hidden fix can be enabled with the `--unsafe-fixes` option).
    Error: Process completed with exit code 1.
```

**69.**

```text
коммить изменения
```

**70.**

```text
I001 [*] Import block is un-sorted or un-formatted
  --> apps/recipes/views.py:72:9
   |
71 |     def get_queryset(self):
72 |         from apps.social.models import Favorite  # lazy import — social depends on recipes
   |         ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
73 |         user = self.request.user
74 |         qs = (
   |
help: Organize imports

Found 1 error.
[*] 1 fixable with the `--fix` option.
Error: Process completed with exit code 1.
```

**71.**

```text
коммить изменения
```

**72.**

```text
I001 [*] Import block is un-sorted or un-formatted
  --> apps/recipes/views.py:72:9
   |
71 |     def get_queryset(self):
72 |         from apps.social.models import Favorite  # lazy import — social depends on recipes
   |         ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
73 |
74 |         user = self.request.user
   |
help: Organize imports

Found 1 error.
[*] 1 fixable with the `--fix` option.
Error: Process completed with exit code 1.
```

**73.**

```text
не помогло
```

**74.**

```text
коммить изменения
```

**75.**

```text
добавь .qwen/ в .gitignore
```
