import django.db.models.deletion
from django.db import migrations, models


def forwards_copy_recipes(apps, schema_editor):
    """Move each slot's single recipe into a MealSlotRecipe item (position 0)."""
    MealSlot = apps.get_model('planner', 'MealSlot')
    MealSlotRecipe = apps.get_model('planner', 'MealSlotRecipe')
    items = [
        MealSlotRecipe(slot=slot, recipe_id=slot.recipe_id, position=0)
        for slot in MealSlot.objects.filter(recipe__isnull=False)
    ]
    MealSlotRecipe.objects.bulk_create(items)


def backwards_copy_recipes(apps, schema_editor):
    """Best-effort reverse: put the position-0 dish back onto the slot."""
    MealSlot = apps.get_model('planner', 'MealSlot')
    MealSlotRecipe = apps.get_model('planner', 'MealSlotRecipe')
    for item in MealSlotRecipe.objects.filter(position=0):
        MealSlot.objects.filter(pk=item.slot_id).update(recipe_id=item.recipe_id)


class Migration(migrations.Migration):

    dependencies = [
        ('planner', '0001_initial'),
        ('recipes', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='MealSlotRecipe',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('position', models.PositiveSmallIntegerField(default=0)),
                ('recipe', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='meal_slot_items',
                    to='recipes.recipe',
                )),
                ('slot', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='items',
                    to='planner.mealslot',
                )),
            ],
            options={
                'verbose_name': 'Блюдо в слоте',
                'verbose_name_plural': 'Блюда в слотах',
                'ordering': ['position', 'id'],
                'unique_together': {('slot', 'recipe'), ('slot', 'position')},
            },
        ),
        migrations.RunPython(forwards_copy_recipes, backwards_copy_recipes),
        migrations.RemoveField(
            model_name='mealslot',
            name='recipe',
        ),
    ]
