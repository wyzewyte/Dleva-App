"""
Seed initial menu item categories
Run with: python manage.py shell < seed_menu_categories.py
"""
from seller.models import MenuItemCategory

categories_data = [
    {"name": "Appetizers", "order": 1, "icon": "🥗"},
    {"name": "Soups", "order": 2, "icon": "🍲"},
    {"name": "Salads", "order": 3, "icon": "🥗"},
    {"name": "Main Courses", "order": 4, "icon": "🍽️"},
    {"name": "Proteins", "order": 5, "icon": "🍗"},
    {"name": "Sides", "order": 6, "icon": "🍟"},
    {"name": "Beverages", "order": 7, "icon": "🥤"},
    {"name": "Desserts", "order": 8, "icon": "🍰"},
    {"name": "Spices", "order": 9, "icon": "🌶️"},
    {"name": "Breads", "order": 10, "icon": "🍞"},
    {"name": "Rice", "order": 11, "icon": "🍚"},
    {"name": "Noodles", "order": 12, "icon": "🍝"},
    {"name": "Swallow", "order": 13, "icon": "🥄"},
    {"name": "Special Meals", "order": 14, "icon": "⭐"},
    {"name": "Extras", "order": 15, "icon": "✨"},
]

print("Seeding menu item categories...")

for cat_data in categories_data:
    cat, created = MenuItemCategory.objects.get_or_create(
        name=cat_data["name"],
        defaults={
            "order": cat_data["order"],
            "icon": cat_data["icon"],
            "is_active": True,
        }
    )
    status = "✓ Created" if created else "- Already exists"
    print(f"  {status}: {cat.name}")

print(f"\n✅ Seeded {len(categories_data)} menu item categories!")
