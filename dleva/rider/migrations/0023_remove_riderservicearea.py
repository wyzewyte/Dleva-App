from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('rider', '0022_riderotp_email_riderprofile_email_verified_and_more'),
    ]

    operations = [
        migrations.AlterField(
            model_name='riderprofile',
            name='address',
            field=models.TextField(blank=True, help_text='Rider location address', null=True),
        ),
        migrations.DeleteModel(
            name='RiderServiceArea',
        ),
    ]
