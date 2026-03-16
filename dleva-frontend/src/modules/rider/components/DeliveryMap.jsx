/**
 * DeliveryMap Component
 * Simple map display for delivery route
 * Note: Requires Leaflet.js installation for full functionality
 */

import { useEffect, useRef } from 'react';
import { MapPin } from 'lucide-react';

const DeliveryMap = ({ riderLocation, delivery, order }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    // Check if Leaflet is available
    if (typeof window.L === 'undefined') {
      console.warn('Leaflet not loaded');
      return;
    }

    if (!containerRef.current || !riderLocation) return;

    // Initialize map
    const map = window.L.map(containerRef.current).setView(
      [riderLocation.latitude, riderLocation.longitude],
      15
    );

    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    // Rider marker (current location)
    window.L.marker([riderLocation.latitude, riderLocation.longitude], {
      icon: window.L.icon({
        iconUrl: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="%23000346"/></svg>',
        iconSize: [24, 24],
      }),
    }).addTo(map).bindPopup('📍 Your Location');

    // Restaurant marker
    if (order?.restaurant_lat && order?.restaurant_lng) {
      window.L.marker([order.restaurant_lat, order.restaurant_lng], {
        icon: window.L.icon({
          iconUrl: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="%23f97316"/></svg>',
          iconSize: [24, 24],
        }),
      }).addTo(map).bindPopup('🏪 Restaurant');
    }

    // Delivery location marker
    if (order?.delivery_lat && order?.delivery_lng) {
      window.L.marker([order.delivery_lat, order.delivery_lng], {
        icon: window.L.icon({
          iconUrl: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="%2310b981"/></svg>',
          iconSize: [24, 24],
        }),
      }).addTo(map).bindPopup('📍 Delivery Location');
    }

    return () => {
      if (map) {
        map.remove();
      }
    };
  }, [riderLocation, order]);

  return (
    <div className="space-y-2">
      <div
        ref={containerRef}
        className="w-full h-64 rounded-lg border border-gray-200 bg-gray-100"
      />
      <div className="grid grid-cols-3 gap-2 text-xs">
        <div className="bg-primary/10 rounded-lg p-2 text-center border border-primary/20">
          <p className="font-bold text-primary">📍 You</p>
          <p className="text-muted">Current Location</p>
        </div>
        <div className="bg-orange-50 rounded-lg p-2 text-center border border-orange-200">
          <p className="font-bold text-orange-600">🏪 Restaurant</p>
          <p className="text-muted">Pickup</p>
        </div>
        <div className="bg-green-50 rounded-lg p-2 text-center border border-green-200">
          <p className="font-bold text-success">📍 Customer</p>
          <p className="text-muted">Delivery</p>
        </div>
      </div>
    </div>
  );
};

export default DeliveryMap;
