from django.contrib.auth.models import User
from django.db import models

from apps.recipes.models import Recipe


class MenuPlan(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='menu_plans')
    week_start = models.DateField(help_text='Понедельник недели (YYYY-MM-DD)')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'План меню'
        verbose_name_plural = 'Планы меню'
        unique_together = [('user', 'week_start')]
        ordering = ['-week_start']

    def __str__(self):
        return f'{self.user.username} — {self.week_start}'


class MealSlot(models.Model):
    DAY_CHOICES = [
        (0, 'Понедельник'),
        (1, 'Вторник'),
        (2, 'Среда'),
        (3, 'Четверг'),
        (4, 'Пятница'),
        (5, 'Суббота'),
        (6, 'Воскресенье'),
    ]
    MEAL_BREAKFAST = 'breakfast'
    MEAL_LUNCH = 'lunch'
    MEAL_DINNER = 'dinner'
    MEAL_CHOICES = [
        (MEAL_BREAKFAST, 'Завтрак'),
        (MEAL_LUNCH, 'Обед'),
        (MEAL_DINNER, 'Ужин'),
    ]

    plan = models.ForeignKey(MenuPlan, on_delete=models.CASCADE, related_name='slots')
    day = models.PositiveSmallIntegerField(choices=DAY_CHOICES)
    meal_type = models.CharField(max_length=10, choices=MEAL_CHOICES)

    class Meta:
        verbose_name = 'Слот приёма пищи'
        verbose_name_plural = 'Слоты приёма пищи'
        unique_together = [('plan', 'day', 'meal_type')]
        ordering = ['day', 'meal_type']

    def __str__(self):
        return f'{self.plan} — {self.get_day_display()} {self.get_meal_type_display()}'


class MealSlotRecipe(models.Model):
    """A single dish placed in a slot. A slot holds up to MAX_PER_SLOT dishes."""

    MAX_PER_SLOT = 3

    slot = models.ForeignKey(MealSlot, on_delete=models.CASCADE, related_name='items')
    recipe = models.ForeignKey(
        Recipe, on_delete=models.CASCADE, related_name='meal_slot_items'
    )
    position = models.PositiveSmallIntegerField(default=0)

    class Meta:
        verbose_name = 'Блюдо в слоте'
        verbose_name_plural = 'Блюда в слотах'
        ordering = ['position', 'id']
        # No duplicate dish in one slot; stable display order per slot.
        unique_together = [('slot', 'recipe'), ('slot', 'position')]

    def __str__(self):
        return f'{self.slot} — {self.recipe.title}'
