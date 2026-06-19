from django.contrib import admin

from .models import MealSlot, MealSlotRecipe, MenuPlan


class MealSlotInline(admin.TabularInline):
    model = MealSlot
    extra = 0
    fields = ['day', 'meal_type']


class MealSlotRecipeInline(admin.TabularInline):
    model = MealSlotRecipe
    extra = 0
    fields = ['recipe', 'position']


@admin.register(MenuPlan)
class MenuPlanAdmin(admin.ModelAdmin):
    list_display = ['user', 'week_start', 'created_at']
    list_filter = ['week_start']
    inlines = [MealSlotInline]


@admin.register(MealSlot)
class MealSlotAdmin(admin.ModelAdmin):
    list_display = ['plan', 'day', 'meal_type']
    list_filter = ['day', 'meal_type']
    inlines = [MealSlotRecipeInline]
