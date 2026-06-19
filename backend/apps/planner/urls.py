from django.urls import path

from .views import (
    MealSlotItemCreateView,
    MealSlotItemView,
    MenuPlanView,
    ShoppingListView,
)

app_name = 'planner'

urlpatterns = [
    path('menu-plan/', MenuPlanView.as_view(), name='menu-plan'),
    path(
        'menu-plan/slots/<int:slot_id>/items/',
        MealSlotItemCreateView.as_view(),
        name='slot-item-create',
    ),
    path('menu-plan/items/<int:item_id>/', MealSlotItemView.as_view(), name='slot-item'),
    path('menu-plan/shopping-list/', ShoppingListView.as_view(), name='shopping-list'),
]
