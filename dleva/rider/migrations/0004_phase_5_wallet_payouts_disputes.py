# Generated migration for Phase 5: Wallet, Payouts, and Disputes
# Manual creation to handle balance → available_balance rename

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('buyer', '0005_order_arrived_at_pickup_order_delivery_attempted_at_and_more'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('rider', '0003_riderprofile_username'),
    ]

    operations = [
        # ===== Update RiderWallet =====
        # Rename balance to available_balance
        migrations.RenameField(
            model_name='riderwallet',
            old_name='balance',
            new_name='available_balance',
        ),
        # Add new wallet fields for Phase 5
        migrations.AddField(
            model_name='riderwallet',
            name='last_withdrawal_date',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='riderwallet',
            name='is_frozen',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='riderwallet',
            name='frozen_reason',
            field=models.TextField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='riderwallet',
            name='frozen_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
        
        # ===== Update RiderTransaction =====
        # Add description and admin_note fields
        migrations.AddField(
            model_name='ridertransaction',
            name='description',
            field=models.TextField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='ridertransaction',
            name='admin_note',
            field=models.TextField(blank=True, null=True),
        ),
        # Update transaction_type to include 'adjustment'
        migrations.AlterField(
            model_name='ridertransaction',
            name='transaction_type',
            field=models.CharField(
                choices=[
                    ('delivery_earning', 'Delivery Earning'),
                    ('bonus', 'Bonus'),
                    ('penalty', 'Penalty'),
                    ('withdrawal', 'Withdrawal'),
                    ('adjustment', 'Admin Adjustment'),
                ],
                max_length=20
            ),
        ),
        
        # ===== Create PayoutRequest Model =====
        migrations.CreateModel(
            name='PayoutRequest',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('amount', models.DecimalField(decimal_places=2, max_digits=10)),
                ('status', models.CharField(
                    choices=[
                        ('pending', 'Pending'),
                        ('approved', 'Approved'),
                        ('rejected', 'Rejected'),
                        ('completed', 'Completed'),
                    ],
                    default='pending',
                    max_length=20
                )),
                ('bank_name', models.CharField(blank=True, max_length=100)),
                ('account_number', models.CharField(blank=True, max_length=50)),
                ('account_name', models.CharField(blank=True, max_length=150)),
                ('rejection_reason', models.TextField(blank=True, null=True)),
                ('approved_at', models.DateTimeField(blank=True, null=True)),
                ('completed_at', models.DateTimeField(blank=True, null=True)),
                ('requested_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('approved_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='approved_payouts', to=settings.AUTH_USER_MODEL)),
                ('rider', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='payout_requests', to='rider.riderprofile')),
            ],
            options={
                'verbose_name': 'Payout Request',
                'verbose_name_plural': 'Payout Requests',
                'ordering': ['-requested_at'],
            },
        ),
        
        # ===== Create Dispute Model =====
        migrations.CreateModel(
            name='Dispute',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('lodged_by_type', models.CharField(
                    choices=[('buyer', 'Buyer'), ('seller', 'Seller'), ('rider', 'Rider')],
                    max_length=20
                )),
                ('reason', models.CharField(
                    choices=[
                        ('quality_issue', 'Quality Issue'),
                        ('delivery_delay', 'Delivery Delay'),
                        ('incomplete_order', 'Incomplete Order'),
                        ('wrong_order', 'Wrong Order Delivered'),
                        ('rider_misconduct', 'Rider Misconduct'),
                        ('seller_issue', 'Seller Issue'),
                        ('other', 'Other'),
                    ],
                    max_length=50
                )),
                ('description', models.TextField()),
                ('evidence_photo', models.ImageField(blank=True, null=True, upload_to='dispute_evidence/')),
                ('status', models.CharField(
                    choices=[
                        ('open', 'Open'),
                        ('under_review', 'Under Review'),
                        ('resolved', 'Resolved'),
                        ('rejected', 'Rejected'),
                    ],
                    default='open',
                    max_length=20
                )),
                ('admin_decision', models.CharField(
                    choices=[
                        ('full_refund', 'Full Refund'),
                        ('partial_refund', 'Partial Refund'),
                        ('no_action', 'No Action'),
                        ('rider_penalty', 'Rider Penalty'),
                        ('seller_penalty', 'Seller Penalty'),
                        ('pending', 'Pending Admin Decision'),
                    ],
                    default='pending',
                    max_length=30
                )),
                ('admin_note', models.TextField(blank=True, null=True)),
                ('refund_amount', models.DecimalField(blank=True, decimal_places=2, max_digits=10, null=True)),
                ('refund_reason', models.TextField(blank=True, null=True)),
                ('refund_processed_at', models.DateTimeField(blank=True, null=True)),
                ('penalty_amount', models.DecimalField(blank=True, decimal_places=2, max_digits=10, null=True)),
                ('penalty_type', models.CharField(blank=True, max_length=50, null=True)),
                ('lodged_at', models.DateTimeField(auto_now_add=True)),
                ('resolved_at', models.DateTimeField(blank=True, null=True)),
                ('reviewed_at', models.DateTimeField(blank=True, null=True)),
                ('lodged_by', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='disputes_lodged', to=settings.AUTH_USER_MODEL)),
                ('order', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='disputes', to='buyer.order')),
                ('reviewed_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='disputes_reviewed', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'verbose_name': 'Dispute',
                'verbose_name_plural': 'Disputes',
                'ordering': ['-lodged_at'],
            },
        ),
    ]
