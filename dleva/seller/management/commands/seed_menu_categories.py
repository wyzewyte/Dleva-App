from django.core.management.base import BaseCommand
from seller.models import MenuItemCategory


class Command(BaseCommand):
    help = 'Seed initial menu item categories'

    def handle(self, *args, **options):
        categories_data = [
                {"name": "Appetizers", "order": 1, "icon": "appetizers"},
                {"name": "Soups", "order": 2, "icon": "soups"},
                {"name": "Salads", "order": 3, "icon": "salads"},
                {"name": "Main Courses", "order": 4, "icon": "main-courses"},
                {"name": "Proteins", "order": 5, "icon": "proteins"},
                {"name": "Sides", "order": 6, "icon": "sides"},
                {"name": "Beverages", "order": 7, "icon": "beverages"},
                {"name": "Desserts", "order": 8, "icon": "desserts"},
                {"name": "Spices & Condiments", "order": 9, "icon": "spices"},
                {"name": "Breads", "order": 10, "icon": "breads"},
                {"name": "Rice & Grains", "order": 11, "icon": "rice"},
                {"name": "Noodles & Pasta", "order": 12, "icon": "noodles"},
                {"name": "Swallow", "order": 13, "icon": "swallow"},
                {"name": "Special Meals", "order": 14, "icon": "special"},
                {"name": "Extras", "order": 15, "icon": "extras"},
            ]

        self.stdout.write(self.style.SUCCESS('Seeding menu item categories...'))

        for cat_data in categories_data:
            cat, created = MenuItemCategory.objects.get_or_create(
                name=cat_data["name"],
                defaults={
                    "order": cat_data["order"],
                    "icon": cat_data["icon"],
                    "is_active": True,
                }
            )
            if created:
                self.stdout.write(f"  ✓ Created: {cat.name}")
            else:
                self.stdout.write(f"  - Already exists: {cat.name}")

        self.stdout.write(self.style.SUCCESS(f'\n✅ Successfully seeded {len(categories_data)} menu item categories!'))
