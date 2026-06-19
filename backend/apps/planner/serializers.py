from rest_framework import serializers

from apps.recipes.models import Recipe

from .models import MealSlot, MealSlotRecipe, MenuPlan


class SlotRecipeSerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source='author.username', read_only=True)
    photo = serializers.SerializerMethodField()

    class Meta:
        model = Recipe
        fields = ['id', 'title', 'photo', 'cooking_time', 'difficulty', 'author_name']

    def get_photo(self, obj):
        # Relative URL works both in dev (Vite proxy) and behind the prod proxy.
        return obj.photo.url if obj.photo else None


class MealSlotItemSerializer(serializers.ModelSerializer):
    recipe_detail = SlotRecipeSerializer(source='recipe', read_only=True)

    class Meta:
        model = MealSlotRecipe
        fields = ['id', 'recipe', 'recipe_detail', 'position']
        read_only_fields = ['id', 'recipe_detail', 'position']


class MealSlotItemWriteSerializer(serializers.Serializer):
    """Validates a recipe being added to / moved into a slot."""

    recipe = serializers.PrimaryKeyRelatedField(queryset=Recipe.objects.all())

    def validate_recipe(self, recipe):
        request = self.context.get('request')
        if request and not recipe.is_public and recipe.author != request.user:
            raise serializers.ValidationError('Нельзя добавить чужой приватный рецепт.')
        return recipe


class MealSlotSerializer(serializers.ModelSerializer):
    items = MealSlotItemSerializer(many=True, read_only=True)

    class Meta:
        model = MealSlot
        fields = ['id', 'day', 'meal_type', 'items']


class MenuPlanSerializer(serializers.ModelSerializer):
    slots = MealSlotSerializer(many=True, read_only=True)

    class Meta:
        model = MenuPlan
        fields = ['id', 'week_start', 'slots']
