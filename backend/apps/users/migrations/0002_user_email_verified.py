from django.db import migrations, models


def mark_existing_users_verified(apps, schema_editor):
    User = apps.get_model('users', 'User')
    User.objects.all().update(email_verified=True)


def noop_reverse(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='email_verified',
            field=models.BooleanField(default=False),
        ),
        migrations.RunPython(mark_existing_users_verified, noop_reverse),
    ]
