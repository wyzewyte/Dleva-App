"""
Phase 5: GPS Integration - Location History Model
"""

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('buyer', '0006_remove_buyerprofile_latitude_and_more'),
    ]

    operations = [
        migrations.CreateModel(
            name='LocationHistory',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('latitude', models.DecimalField(decimal_places=8, help_text='Buyer GPS latitude', max_digits=10)),
                ('longitude', models.DecimalField(decimal_places=8, help_text='Buyer GPS longitude', max_digits=10)),
                ('accuracy', models.FloatField(default=0, help_text='GPS accuracy in meters')),
                ('is_live_tracking', models.BooleanField(default=False, help_text='Whether buyer has GPS tracking enabled')),
                ('recorded_at', models.DateTimeField(auto_now_add=True, help_text='When location was recorded')),
                ('buyer', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='location_history', to='buyer.buyerprofile')),
                ('order', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='location_history', to='buyer.order')),
            ],
            options={
                'verbose_name': 'Location History',
                'verbose_name_plural': 'Location Histories',
                'ordering': ['-recorded_at'],
            },
        ),
        migrations.AddIndex(
            model_name='locationhistory',
            index=models.Index(fields=['buyer', 'recorded_at'], name='buyer_locat_buyer_i_idx'),
        ),
        migrations.AddIndex(
            model_name='locationhistory',
            index=models.Index(fields=['order', 'recorded_at'], name='buyer_locat_order_i_idx'),
        ),
    ]
