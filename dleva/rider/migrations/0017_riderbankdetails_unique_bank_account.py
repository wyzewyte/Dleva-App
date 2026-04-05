from django.db import migrations, models
from django.db.models import Q


class Migration(migrations.Migration):

    dependencies = [
        ('rider', '0008_riderbankdetails_bank_code'),
    ]

    operations = [
        migrations.AddConstraint(
            model_name='riderbankdetails',
            constraint=models.UniqueConstraint(
                condition=~Q(bank_code=''),
                fields=('bank_code', 'account_number'),
                name='unique_rider_bank_account_per_bank',
            ),
        ),
    ]
