from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('buyer', '0009_rename_buyer_addre_query_i_hash_buyer_addre_query_h_2e84ff_idx_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='buyerprofile',
            name='fcm_token',
            field=models.CharField(blank=True, db_index=True, help_text='Firebase Cloud Messaging token for push notifications', max_length=500, null=True),
        ),
        migrations.AddField(
            model_name='buyerprofile',
            name='fcm_token_updated_at',
            field=models.DateTimeField(blank=True, help_text='Last time FCM token was updated', null=True),
        ),
    ]
