# Generated migration for RiderServiceArea model

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('rider', '0011_riderprofile_current_latitude_and_more'),
    ]

    operations = [
        migrations.CreateModel(
            name='RiderServiceArea',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('area_code', models.CharField(choices=[('lekki', 'Lekki'), ('ikoyi', 'Ikoyi'), ('vi', 'Victoria Island'), ('yaba', 'Yaba'), ('ikeja', 'Ikeja'), ('surulere', 'Surulere'), ('mushin', 'Mushin'), ('apapa', 'Apapa'), ('bariga', 'Bariga'), ('mainland', 'Mainland')], max_length=50)),
                ('area_name', models.CharField(max_length=100)),
                ('is_selected', models.BooleanField(default=True)),
                ('added_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('rider', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='service_areas', to='rider.riderprofile')),
            ],
            options={
                'verbose_name': 'Rider Service Area',
                'verbose_name_plural': 'Rider Service Areas',
                'ordering': ['added_at'],
            },
        ),
        migrations.AlterUniqueTogether(
            name='riderservicearea',
            unique_together={('rider', 'area_code')},
        ),
    ]
