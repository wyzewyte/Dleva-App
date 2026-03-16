(function() {
  // Wait for admin to load
  document.addEventListener('DOMContentLoaded', function() {
    const sellerSelect = document.querySelector('#id_seller');
    const addressInput = document.querySelector('#id_address');
    const latInput = document.querySelector('#id_latitude');
    const lngInput = document.querySelector('#id_longitude');
    const deliveryFeeInput = document.querySelector('#id_delivery_fee');
    const deliveryTimeInput = document.querySelector('#id_delivery_time');

    if (sellerSelect) {
      // Store seller data on page load (fetch via data attributes or API)
      const sellerData = {};

      sellerSelect.addEventListener('change', function() {
        const sellerId = this.value;
        // You'd need an endpoint that returns seller details by ID
        // For now, this is a placeholder
        if (sellerData[sellerId]) {
          const seller = sellerData[sellerId];
          addressInput.value = seller.address || '';
          latInput.value = seller.latitude || '';
          lngInput.value = seller.longitude || '';
          deliveryFeeInput.value = seller.delivery_fee || '500';
          deliveryTimeInput.value = seller.delivery_time || '30-45 mins';
        }
      });
    }
  });
})();