"""
Phase 6: Geolocation & Address Validation - AddressCache Model
"""

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('buyer', '0007_locationhistory'),
    ]

    operations = [
        migrations.CreateModel(
            name='AddressCache',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('query_hash', models.CharField(db_index=True, help_text='Hash of original query', max_length=64, unique=True)),
                ('query_text', models.TextField(blank=True, help_text='Original address string searched')),
                ('display_name', models.TextField(help_text='Full formatted address')),
                ('latitude', models.DecimalField(decimal_places=8, max_digits=10)),
                ('longitude', models.DecimalField(decimal_places=8, max_digits=10)),
                ('cache_type', models.CharField(choices=[('search', 'Search Result'), ('reverse', 'Reverse Geocode'), ('validated', 'Validated Address')], default='search', max_length=20)),
                ('address_type', models.CharField(default='unknown', max_length=50)),
                ('importance', models.FloatField(default=0)),
                ('raw_data', models.JSONField(default=dict, help_text='Full response from Nominatim')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('last_accessed', models.DateTimeField(auto_now=True)),
                ('access_count', models.PositiveIntegerField(default=1, help_text='How many times this cached result was used')),
            ],
            options={
                'verbose_name': 'Address Cache',
                'verbose_name_plural': 'Address Caches',
                'ordering': ['-last_accessed'],
            },
        ),
        migrations.AddIndex(
            model_name='addresscache',
            index=models.Index(fields=['query_hash'], name='buyer_addre_query_i_hash'),
        ),
        migrations.AddIndex(
            model_name='addresscache',
            index=models.Index(fields=['latitude', 'longitude'], name='buyer_addre_latitu_idx'),
        ),
    ]
