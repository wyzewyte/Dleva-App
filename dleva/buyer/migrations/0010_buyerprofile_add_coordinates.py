# Generated migration to add latitude and longitude back to BuyerProfile

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('buyer', '0009_rename_buyer_addre_query_i_hash_buyer_addre_query_h_2e84ff_idx_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='buyerprofile',
            name='latitude',
            field=models.DecimalField(blank=True, decimal_places=8, help_text='Buyer GPS latitude for delivery', max_digits=10, null=True),
        ),
        migrations.AddField(
            model_name='buyerprofile',
            name='longitude',
            field=models.DecimalField(blank=True, decimal_places=8, help_text='Buyer GPS longitude for delivery', max_digits=10, null=True),
        ),
    ]
