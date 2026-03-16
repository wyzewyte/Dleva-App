/**
 * LocationUpdater Component
 * Handles automatic GPS location updates
 */

import { useEffect, useState } from 'react';
import { MapPin, AlertCircle } from 'lucide-react';

const LocationUpdater = ({ enabled, onLocationUpdate, onError }) => {
  const [status, setStatus] = useState('idle');
  const [accuracy, setAccuracy] = useState(null);
  const [watchId, setWatchId] = useState(null);

  useEffect(() => {
    if (!enabled || !navigator.geolocation) {
      return;
    }

    const id = navigator.geolocation.watchPosition(
      position => {
        const { latitude, longitude, accuracy: acc } = position.coords;
        setAccuracy(Math.round(acc));
        setStatus('tracking');
        onLocationUpdate?.({ latitude, longitude, accuracy: acc });
      },
      error => {
        console.error('GPS error:', error);
        setStatus('error');
        onError?.(error.message);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 10000,
      }
    );

    setWatchId(id);
    setStatus('tracking');

    return () => {
      if (id) {
        navigator.geolocation.clearWatch(id);
      }
    };
  }, [enabled, onLocationUpdate, onError]);

  if (!enabled) return null;

  if (status === 'error') {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
        <AlertCircle size={18} className="text-red-600 mt-0.5 shrink-0" />
        <p className="text-sm text-red-700">GPS tracking failed. Please enable location access.</p>
      </div>
    );
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center gap-2">
      <MapPin size={16} className="text-blue-600 animate-pulse" />
      <div className="flex-1">
        <p className="text-xs font-bold text-blue-900">GPS Tracking Active</p>
        {accuracy && <p className="text-xs text-blue-700">Accuracy: ±{accuracy}m</p>}
      </div>
    </div>
  );
};

export default LocationUpdater;
