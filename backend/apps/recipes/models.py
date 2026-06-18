from django.contrib.auth.models import User
from django.db import models


class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=100, unique=True)

    class Meta:
        verbose_name = 'Категория'
        verbose_name_plural = 'Категории'
        ordering = ['name']

    def __str__(self):
        return self.name


class Tag(models.Model):
    name = models.CharField(max_length=50, unique=True)
    slug = models.SlugField(max_length=50, unique=True)

    class Meta:
        verbose_name = 'Тег'
        verbose_name_plural = 'Теги'
        ordering = ['name']

    def __str__(self):
        return self.name


class Ingredient(models.Model):
    name = models.CharField(max_length=150, unique=True)

    class Meta:
        verbose_name = 'Ингредиент'
        verbose_name_plural = 'Ингредиенты'
        ordering = ['name']

    def __str__(self):
        return self.name


class Recipe(models.Model):
    DIFFICULTY_EASY = 'easy'
    DIFFICULTY_MEDIUM = 'medium'
    DIFFICULTY_HARD = 'hard'
    DIFFICULTY_CHOICES = [
        (DIFFICULTY_EASY, 'Лёгкий'),
        (DIFFICULTY_MEDIUM, 'Средний'),
        (DIFFICULTY_HARD, 'Сложный'),
    ]

    title = models.CharField(max_length=255)
    description = models.TextField()
    cooking_time = models.PositiveIntegerField(help_text='Время приготовления в минутах')
    difficulty = models.CharField(
        max_length=10, choices=DIFFICULTY_CHOICES, default=DIFFICULTY_MEDIUM
    )
    photo = models.ImageField(upload_to='recipes/', null=True, blank=True)
    servings = models.PositiveIntegerField(default=4)
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='recipes')
    is_public = models.BooleanField(default=True)
    categories = models.ManyToManyField(Category, blank=True, related_name='recipes')
    tags = models.ManyToManyField(Tag, blank=True, related_name='recipes')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Рецепт'
        verbose_name_plural = 'Рецепты'
        ordering = ['-created_at']

    def __str__(self):
        return self.title


class RecipeIngredient(models.Model):
    UNIT_G = 'g'
    UNIT_ML = 'ml'
    UNIT_PCS = 'pcs'
    UNIT_TBSP = 'tbsp'
    UNIT_TSP = 'tsp'
    UNIT_KG = 'kg'
    UNIT_L = 'l'
    UNIT_PINCH = 'pinch'
    UNIT_CHOICES = [
        (UNIT_G, 'г'),
        (UNIT_ML, 'мл'),
        (UNIT_PCS, 'шт'),
        (UNIT_TBSP, 'ст.л.'),
        (UNIT_TSP, 'ч.л.'),
        (UNIT_KG, 'кг'),
        (UNIT_L, 'л'),
        (UNIT_PINCH, 'щепотка'),
    ]

    recipe = models.ForeignKey(
        Recipe, on_delete=models.CASCADE, related_name='recipe_ingredients'
    )
    ingredient = models.ForeignKey(
        Ingredient, on_delete=models.PROTECT, related_name='recipe_ingredients'
    )
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    unit = models.CharField(max_length=10, choices=UNIT_CHOICES)

    class Meta:
        verbose_name = 'Ингредиент рецепта'
        verbose_name_plural = 'Ингредиенты рецепта'
        unique_together = [('recipe', 'ingredient')]

    def __str__(self):
        return f'{self.ingredient.name} — {self.amount} {self.unit}'


class RecipeStep(models.Model):
    recipe = models.ForeignKey(Recipe, on_delete=models.CASCADE, related_name='steps')
    order = models.PositiveIntegerField()
    text = models.TextField()

    class Meta:
        verbose_name = 'Шаг рецепта'
        verbose_name_plural = 'Шаги рецепта'
        ordering = ['order']
        unique_together = [('recipe', 'order')]

    def __str__(self):
        return f'{self.recipe.title} — шаг {self.order}'
