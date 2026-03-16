# Generated migration for adding email field to RiderProfile

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('rider', '0009_riderlocation'),
    ]

    operations = [
        migrations.AddField(
            model_name='riderprofile',
            name='email',
            field=models.EmailField(blank=True, db_index=True, max_length=254, null=True, unique=True),
        ),
    ]
