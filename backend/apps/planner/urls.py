from django.urls import path

from .views import MealSlotUpdateView, MenuPlanView, ShoppingListView

app_name = 'planner'

urlpatterns = [
    path('menu-plan/', MenuPlanView.as_view(), name='menu-plan'),
    path('menu-plan/slots/<int:pk>/', MealSlotUpdateView.as_view(), name='meal-slot-update'),
    path('menu-plan/shopping-list/', ShoppingListView.as_view(), name='shopping-list'),
]
