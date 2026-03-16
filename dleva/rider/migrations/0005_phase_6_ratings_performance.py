# Generated migration for Phase 6: Ratings and Performance Metrics
# Adds suspension fields to RiderProfile for performance tracking

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('rider', '0004_phase_5_wallet_payouts_disputes'),
    ]

    operations = [
        # Add deactivated to account_status choices
        migrations.AlterField(
            model_name='riderprofile',
            name='account_status',
            field=models.CharField(
                choices=[
                    ('pending_documents', 'Pending Documents'),
                    ('under_review', 'Under Review'),
                    ('approved', 'Approved'),
                    ('rejected', 'Rejected'),
                    ('suspended', 'Suspended'),
                    ('deactivated', 'Deactivated'),
                ],
                default='pending_documents',
                max_length=20
            ),
        ),
        
        # Add Phase 6 suspension fields
        migrations.AddField(
            model_name='riderprofile',
            name='suspension_start_date',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='riderprofile',
            name='warning_issued_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='riderprofile',
            name='suspension_reason',
            field=models.TextField(blank=True, null=True),
        ),
    ]
