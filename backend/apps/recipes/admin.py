from django.contrib import admin

from .models import Category, Ingredient, Recipe, RecipeIngredient, RecipeStep, Tag


class RecipeIngredientInline(admin.TabularInline):
    model = RecipeIngredient
    extra = 1


class RecipeStepInline(admin.TabularInline):
    model = RecipeStep
    extra = 1


@admin.register(Recipe)
class RecipeAdmin(admin.ModelAdmin):
    list_display = ['title', 'author', 'difficulty', 'cooking_time', 'is_public', 'created_at']
    list_filter = ['difficulty', 'is_public', 'categories']
    search_fields = ['title', 'description']
    filter_horizontal = ['categories', 'tags']
    inlines = [RecipeIngredientInline, RecipeStepInline]


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    prepopulated_fields = {'slug': ('name',)}


@admin.register(Tag)
class TagAdmin(admin.ModelAdmin):
    prepopulated_fields = {'slug': ('name',)}


admin.site.register(Ingredient)
