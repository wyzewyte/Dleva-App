from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('buyer', '0018_buyernotification'),
    ]

    operations = [
        migrations.AddField(
            model_name='order',
            name='delivery_attempted_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]
