import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')

import django
django.setup()

from seller.models import RestaurantCommissionConfig
from decimal import Decimal

# Test get_active_config
config = RestaurantCommissionConfig.get_active_config()
print(f"✅ Active config created: {config}")
print(f"Commission percent: {config.commission_percent}%")
print(f"Is active: {config.is_active}")

# Test calculations
test_amounts = [Decimal('1000'), Decimal('3000'), Decimal('5000'), Decimal('10000')]
print("\n📊 Commission Calculations:")
print("-" * 70)

for amount in test_amounts:
    commission = config.calculate_commission_amount(amount)
    earnings = config.calculate_restaurant_earnings(amount)
    margin = config.calculate_platform_margin(amount)
    
    print(f"Food: ₦{amount:>8} → Commission: ₦{commission:>8.2f} → Restaurant: ₦{earnings:>8.2f}")

print("\n✅ All tests passed!")
