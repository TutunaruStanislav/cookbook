from rest_framework.routers import DefaultRouter

from .views import CategoryViewSet, IngredientViewSet, RecipeViewSet, TagViewSet

router = DefaultRouter()
router.register('recipes', RecipeViewSet, basename='recipe')
router.register('categories', CategoryViewSet, basename='category')
router.register('tags', TagViewSet, basename='tag')
router.register('ingredients', IngredientViewSet, basename='ingredient')

app_name = 'recipes'
urlpatterns = router.urls
