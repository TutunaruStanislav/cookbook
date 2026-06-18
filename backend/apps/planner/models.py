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
    recipe = models.ForeignKey(
        Recipe,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='meal_slots',
    )

    class Meta:
        verbose_name = 'Слот приёма пищи'
        verbose_name_plural = 'Слоты приёма пищи'
        unique_together = [('plan', 'day', 'meal_type')]
        ordering = ['day', 'meal_type']

    def __str__(self):
        return f'{self.plan} — {self.get_day_display()} {self.get_meal_type_display()}'
