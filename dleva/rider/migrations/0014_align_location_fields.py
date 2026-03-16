# Generated migration - Align RiderProfile location fields with BuyerProfile and SellerProfile
# Adds address field and updates latitude/longitude precision for consistency across all profiles

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('rider', '0013_alter_riderprofile_account_status_and_more'),
    ]

    operations = [
        # Add address field to RiderProfile for consistent location data separation
        migrations.AddField(
            model_name='riderprofile',
            name='address',
            field=models.TextField(blank=True, null=True, help_text='Rider service area address'),
        ),
        # Update latitude precision from (9,6) to (10,8) to match BuyerProfile and SellerProfile
        migrations.AlterField(
            model_name='riderprofile',
            name='current_latitude',
            field=models.DecimalField(
                max_digits=10,
                decimal_places=8,
                null=True,
                blank=True,
                help_text='Current latitude for distance calculations'
            ),
        ),
        # Update longitude precision from (9,6) to (10,8) to match BuyerProfile and SellerProfile
        migrations.AlterField(
            model_name='riderprofile',
            name='current_longitude',
            field=models.DecimalField(
                max_digits=10,
                decimal_places=8,
                null=True,
                blank=True,
                help_text='Current longitude for distance calculations'
            ),
        ),
    ]
