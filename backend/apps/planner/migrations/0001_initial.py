import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('recipes', '0001_initial'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='MenuPlan',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('week_start', models.DateField(help_text='Понедельник недели (YYYY-MM-DD)')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('user', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='menu_plans',
                    to=settings.AUTH_USER_MODEL,
                )),
            ],
            options={
                'verbose_name': 'План меню',
                'verbose_name_plural': 'Планы меню',
                'ordering': ['-week_start'],
                'unique_together': {('user', 'week_start')},
            },
        ),
        migrations.CreateModel(
            name='MealSlot',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('day', models.PositiveSmallIntegerField(
                    choices=[
                        (0, 'Понедельник'), (1, 'Вторник'), (2, 'Среда'),
                        (3, 'Четверг'), (4, 'Пятница'), (5, 'Суббота'), (6, 'Воскресенье'),
                    ]
                )),
                ('meal_type', models.CharField(
                    choices=[('breakfast', 'Завтрак'), ('lunch', 'Обед'), ('dinner', 'Ужин')],
                    max_length=10,
                )),
                ('plan', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='slots',
                    to='planner.menuplan',
                )),
                ('recipe', models.ForeignKey(
                    blank=True,
                    null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name='meal_slots',
                    to='recipes.recipe',
                )),
            ],
            options={
                'verbose_name': 'Слот приёма пищи',
                'verbose_name_plural': 'Слоты приёма пищи',
                'ordering': ['day', 'meal_type'],
                'unique_together': {('plan', 'day', 'meal_type')},
            },
        ),
    ]
