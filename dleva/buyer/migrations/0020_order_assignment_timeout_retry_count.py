from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('buyer', '0019_order_delivery_attempted_at'),
    ]

    operations = [
        migrations.AddField(
            model_name='order',
            name='assignment_timeout_retry_count',
            field=models.PositiveSmallIntegerField(default=0),
        ),
    ]
