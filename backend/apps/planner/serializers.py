from rest_framework import serializers

from apps.recipes.models import Recipe

from .models import MealSlot, MenuPlan


class SlotRecipeSerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source='author.username', read_only=True)

    class Meta:
        model = Recipe
        fields = ['id', 'title', 'photo', 'cooking_time', 'difficulty', 'author_name']


class MealSlotSerializer(serializers.ModelSerializer):
    recipe_detail = SlotRecipeSerializer(source='recipe', read_only=True)

    class Meta:
        model = MealSlot
        fields = ['id', 'day', 'meal_type', 'recipe', 'recipe_detail']
        read_only_fields = ['id', 'day', 'meal_type', 'recipe_detail']

    def validate_recipe(self, recipe):
        if recipe is None:
            return recipe
        request = self.context.get('request')
        if request and not recipe.is_public and recipe.author != request.user:
            raise serializers.ValidationError('Нельзя добавить чужой приватный рецепт.')
        return recipe


class MenuPlanSerializer(serializers.ModelSerializer):
    slots = MealSlotSerializer(many=True, read_only=True)

    class Meta:
        model = MenuPlan
        fields = ['id', 'week_start', 'slots']
