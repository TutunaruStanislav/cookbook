from decimal import ROUND_HALF_UP, Decimal

from django.contrib.auth.models import User
from rest_framework import serializers

from .models import Category, Ingredient, Recipe, RecipeIngredient, RecipeStep, Tag


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'slug']


class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ['id', 'name', 'slug']


class IngredientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ingredient
        fields = ['id', 'name']


class AuthorSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name']


class RecipeStepSerializer(serializers.ModelSerializer):
    class Meta:
        model = RecipeStep
        fields = ['id', 'order', 'text']


class RecipeIngredientReadSerializer(serializers.ModelSerializer):
    ingredient = IngredientSerializer(read_only=True)
    scaled_amount = serializers.SerializerMethodField()

    def get_scaled_amount(self, obj):
        target = self.context.get('target_servings')
        base = self.context.get('base_servings')
        if target and base:
            scaled = obj.amount * Decimal(str(target)) / Decimal(str(base))
            return float(scaled.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP))
        return float(obj.amount)

    class Meta:
        model = RecipeIngredient
        fields = ['id', 'ingredient', 'amount', 'scaled_amount', 'unit']


class RecipeIngredientWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = RecipeIngredient
        fields = ['ingredient', 'amount', 'unit']


class RecipeListSerializer(serializers.ModelSerializer):
    author = AuthorSerializer(read_only=True)
    categories = CategorySerializer(many=True, read_only=True)
    tags = TagSerializer(many=True, read_only=True)
    avg_rating = serializers.SerializerMethodField()

    def get_avg_rating(self, obj):
        return getattr(obj, 'avg_rating', None)

    class Meta:
        model = Recipe
        fields = [
            'id', 'title', 'description', 'cooking_time', 'difficulty',
            'photo', 'servings', 'author', 'is_public',
            'categories', 'tags', 'avg_rating', 'created_at',
        ]


class RecipeDetailSerializer(serializers.ModelSerializer):
    author = AuthorSerializer(read_only=True)
    categories = CategorySerializer(many=True, read_only=True)
    tags = TagSerializer(many=True, read_only=True)
    steps = RecipeStepSerializer(many=True, read_only=True)
    ingredients = serializers.SerializerMethodField()
    avg_rating = serializers.SerializerMethodField()

    def get_avg_rating(self, obj):
        return getattr(obj, 'avg_rating', None)

    def get_ingredients(self, obj):
        qs = obj.recipe_ingredients.select_related('ingredient')
        return RecipeIngredientReadSerializer(qs, many=True, context=self.context).data

    class Meta:
        model = Recipe
        fields = [
            'id', 'title', 'description', 'cooking_time', 'difficulty',
            'photo', 'servings', 'author', 'is_public',
            'categories', 'tags', 'steps', 'ingredients',
            'avg_rating', 'created_at', 'updated_at',
        ]


class RecipeWriteSerializer(serializers.ModelSerializer):
    ingredients = RecipeIngredientWriteSerializer(
        many=True, source='recipe_ingredients', required=False
    )
    steps = RecipeStepSerializer(many=True, required=False)

    class Meta:
        model = Recipe
        fields = [
            'title', 'description', 'cooking_time', 'difficulty',
            'photo', 'servings', 'is_public', 'categories', 'tags',
            'ingredients', 'steps',
        ]

    def _save_ingredients(self, recipe, data):
        recipe.recipe_ingredients.all().delete()
        RecipeIngredient.objects.bulk_create(
            [RecipeIngredient(recipe=recipe, **d) for d in data]
        )

    def _save_steps(self, recipe, data):
        recipe.steps.all().delete()
        RecipeStep.objects.bulk_create(
            [RecipeStep(recipe=recipe, **d) for d in data]
        )

    def create(self, validated_data):
        ingredients_data = validated_data.pop('recipe_ingredients', [])
        steps_data = validated_data.pop('steps', [])
        categories = validated_data.pop('categories', [])
        tags = validated_data.pop('tags', [])

        recipe = Recipe.objects.create(**validated_data)
        recipe.categories.set(categories)
        recipe.tags.set(tags)
        self._save_ingredients(recipe, ingredients_data)
        self._save_steps(recipe, steps_data)
        return recipe

    def update(self, instance, validated_data):
        ingredients_data = validated_data.pop('recipe_ingredients', None)
        steps_data = validated_data.pop('steps', None)
        categories = validated_data.pop('categories', None)
        tags = validated_data.pop('tags', None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if categories is not None:
            instance.categories.set(categories)
        if tags is not None:
            instance.tags.set(tags)
        if ingredients_data is not None:
            self._save_ingredients(instance, ingredients_data)
        if steps_data is not None:
            self._save_steps(instance, steps_data)

        return instance

    def to_representation(self, instance):
        from django.db.models import Avg

        instance = (
            Recipe.objects.annotate(avg_rating=Avg('ratings__value'))
            .select_related('author')
            .prefetch_related('categories', 'tags', 'recipe_ingredients__ingredient', 'steps')
            .get(pk=instance.pk)
        )
        return RecipeDetailSerializer(instance, context=self.context).data
