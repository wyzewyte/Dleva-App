from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('rider', '0015_riderprofile_fcm_token_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='riderbankdetails',
            name='bank_code',
            field=models.CharField(blank=True, default='', max_length=20),
        ),
    ]
