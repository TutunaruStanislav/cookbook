from django.contrib import admin

from .models import MealSlot, MenuPlan


class MealSlotInline(admin.TabularInline):
    model = MealSlot
    extra = 0
    fields = ['day', 'meal_type', 'recipe']


@admin.register(MenuPlan)
class MenuPlanAdmin(admin.ModelAdmin):
    list_display = ['user', 'week_start', 'created_at']
    list_filter = ['week_start']
    inlines = [MealSlotInline]
