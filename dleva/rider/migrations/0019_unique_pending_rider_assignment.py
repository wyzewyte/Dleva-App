from django.db import migrations, models
from django.db.models import Count, Q
from django.utils import timezone


def dedupe_pending_assignments(apps, schema_editor):
    RiderOrder = apps.get_model('rider', 'RiderOrder')
    db_alias = schema_editor.connection.alias
    now = timezone.now()

    duplicate_groups = (
        RiderOrder.objects.using(db_alias)
        .filter(status='assigned_pending')
        .values('order_id', 'rider_id')
        .annotate(pending_count=Count('id'))
        .filter(pending_count__gt=1)
    )

    for group in duplicate_groups:
        assignments = list(
            RiderOrder.objects.using(db_alias)
            .filter(
                order_id=group['order_id'],
                rider_id=group['rider_id'],
                status='assigned_pending',
            )
            .order_by('-assigned_at', '-id')
        )

        stale_ids = [assignment.id for assignment in assignments[1:]]
        if stale_ids:
            RiderOrder.objects.using(db_alias).filter(id__in=stale_ids).update(
                status='rejected',
                responded_at=now,
            )


class Migration(migrations.Migration):

    dependencies = [
        ('rider', '0018_riderotp_purpose'),
    ]

    operations = [
        migrations.RunPython(dedupe_pending_assignments, migrations.RunPython.noop),
        migrations.AddConstraint(
            model_name='riderorder',
            constraint=models.UniqueConstraint(
                condition=Q(status='assigned_pending'),
                fields=('order', 'rider'),
                name='unique_pending_rider_assignment',
            ),
        ),
    ]
