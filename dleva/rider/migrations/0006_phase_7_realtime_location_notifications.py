"""
Phase 7: Real-Time Infrastructure - Location Tracking & Notifications
"""

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('rider', '0005_phase_6_ratings_performance'),
        ('buyer', '0001_initial'),
    ]

    operations = [
        # Phase 7: RiderLocation model
        migrations.CreateModel(
            name='RiderLocation',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('latitude', models.FloatField()),
                ('longitude', models.FloatField()),
                ('accuracy', models.FloatField(default=0, help_text='Accuracy in meters')),
                ('is_tracking', models.BooleanField(default=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('current_order', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to='buyer.order')),
                ('rider', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='current_location', to='rider.riderprofile')),
            ],
            options={
                'verbose_name': 'Rider Location',
                'verbose_name_plural': 'Rider Locations',
            },
        ),
        
        # Phase 7: RiderNotification model
        migrations.CreateModel(
            name='RiderNotification',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('notification_type', models.CharField(choices=[('assignment', 'Order Assigned'), ('status_update', 'Order Status Update'), ('pickup', 'Order Picked Up'), ('delivery', 'Order Delivered'), ('payout', 'Payout Approved'), ('dispute', 'Dispute Update'), ('suspension', 'Account Suspension'), ('warning', 'Performance Warning')], max_length=20)),
                ('title', models.CharField(max_length=200)),
                ('message', models.TextField()),
                ('is_sent', models.BooleanField(default=False)),
                ('sent_at', models.DateTimeField(blank=True, null=True)),
                ('is_read', models.BooleanField(default=False)),
                ('read_at', models.DateTimeField(blank=True, null=True)),
                ('data', models.JSONField(blank=True, default=dict)),
                ('fcm_token', models.CharField(blank=True, max_length=255, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('related_order', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to='buyer.order')),
                ('rider', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='notifications', to='rider.riderprofile')),
            ],
            options={
                'verbose_name': 'Rider Notification',
                'verbose_name_plural': 'Rider Notifications',
                'ordering': ['-created_at'],
            },
        ),
        
        # Add indexes
        migrations.AddIndex(
            model_name='riderlocation',
            index=models.Index(fields=['rider', 'is_tracking'], name='rider_riderlo_rider_i_idx'),
        ),
        migrations.AddIndex(
            model_name='riderlocation',
            index=models.Index(fields=['current_order'], name='rider_riderlo_current_idx'),
        ),
        migrations.AddIndex(
            model_name='ridernotification',
            index=models.Index(fields=['rider', 'is_read'], name='rider_riderno_rider_i_idx'),
        ),
        migrations.AddIndex(
            model_name='ridernotification',
            index=models.Index(fields=['notification_type'], name='rider_riderno_notifi_idx'),
        ),
    ]
