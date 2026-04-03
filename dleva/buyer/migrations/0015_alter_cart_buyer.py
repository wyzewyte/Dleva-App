import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('buyer', '0014_waitlist_waitlistentry'),
    ]

    operations = [
        migrations.AlterField(
            model_name='cart',
            name='buyer',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='carts', to='buyer.buyerprofile'),
        ),
    ]
