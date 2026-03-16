/**
 * ActiveDelivery Page
 * Main page for active delivery tracking and management
 */

import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useRealTimeDelivery } from '../hooks/useRealTimeDelivery';
import LocationUpdater from '../components/LocationUpdater';
import OrderInfo from '../components/OrderInfo';
import CustomerContact from '../components/CustomerContact';
import RestaurantStatus from '../components/RestaurantStatus';
import DeliveryMap from '../components/DeliveryMap';
import DeliveryActions from '../components/DeliveryActions';
import MESSAGES from '../../../constants/messages';
import { DELIVERY_STATUSES } from '../constants/deliveryConstants';

const ActiveDelivery = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [gpsEnabled, setGpsEnabled] = useState(true);
  const [proofPhoto, setProofPhoto] = useState(null);

  const {
    delivery,
    loading,
    error,
    riderLocation,
    eta,
    actions: {
      fetchDelivery,
      updateLocation,
      arrivedAtPickup,
      confirmPickup,
      markOnTheWay,
      attemptDelivery,
      completeDelivery,
      cancelDelivery,
      startGPSTracking,
      stopGPSTracking,
    },
  } = useRealTimeDelivery(orderId);

  // Start GPS tracking when component mounts
  useEffect(() => {
    if (gpsEnabled) {
      const watchId = startGPSTracking();
      return () => stopGPSTracking(watchId);
    }
  }, [gpsEnabled, startGPSTracking, stopGPSTracking]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-bg">
        <div className="text-center">
          <Loader2 size={40} className="animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted font-medium">Loading delivery details...</p>
        </div>
      </div>
    );
  }

  if (error || !delivery) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-bg">
        <div className="text-center bg-white rounded-2xl p-8 max-w-md w-full mx-4">
          <p className="text-danger font-bold mb-4">❌ {error || 'Delivery not found'}</p>
          <button
            onClick={() => navigate('/rider/dashboard')}
            className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-2 rounded-lg"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg pb-8">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} className="text-dark" />
          </button>
          <div className="flex-1">
            <h1 className="font-bold text-dark">Active Delivery</h1>
            <p className="text-xs text-muted">Order #{delivery.id}</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-md mx-auto px-4 py-6 space-y-6">
        
        {/* GPS Tracking Status */}
        <LocationUpdater
          enabled={gpsEnabled}
          onLocationUpdate={({ latitude, longitude, accuracy }) => {
            updateLocation(latitude, longitude, accuracy);
          }}
          onError={err => {
            console.error('GPS Error:', err);
            setGpsEnabled(false);
          }}
        />

        {/* Map */}
        {riderLocation && (
          <DeliveryMap
            riderLocation={riderLocation}
            delivery={delivery}
            order={delivery.order}
          />
        )}

        {/* ETA Display */}
        {eta && (
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 text-center">
            <p className="text-xs text-muted font-bold">ESTIMATED ARRIVAL</p>
            <p className="text-xl font-bold text-primary">~{Math.ceil(eta / 60)} mins</p>
          </div>
        )}

        {/* Order Details */}
        <section className="space-y-3">
          <h2 className="text-sm font-bold text-muted uppercase">Order Details</h2>
          <OrderInfo order={delivery.order} delivery={delivery} />
        </section>

        {/* Restaurant Status */}
        {delivery.status !== DELIVERY_STATUSES.PICKED_UP && (
          <section className="space-y-3">
            <h2 className="text-sm font-bold text-muted uppercase">Restaurant</h2>
            <RestaurantStatus
              restaurant={delivery.restaurant}
              order={delivery.order}
              delivery={delivery}
              isLoading={loading}
              onArrivedAtPickup={arrivedAtPickup}
              onConfirmPickup={confirmPickup}
            />
          </section>
        )}

        {/* Customer Details */}
        {delivery.status === DELIVERY_STATUSES.PICKED_UP && (
          <section className="space-y-3">
            <h2 className="text-sm font-bold text-muted uppercase">Customer</h2>
            <CustomerContact
              customer={delivery.customer}
              order={delivery.order}
              isLoading={loading}
              onCall={phone => window.location.href = `tel:${phone}`}
              onMessage={phone => window.location.href = `sms:${phone}`}
            />
          </section>
        )}

        {/* Delivery Actions */}
        <section className="space-y-3">
          <h2 className="text-sm font-bold text-muted uppercase">Actions</h2>
          <DeliveryActions
            delivery={delivery}
            isLoading={loading}
            onMarkOnTheWay={markOnTheWay}
            onAttemptDelivery={attemptDelivery}
            onCompleteDelivery={completeDelivery}
            onCancelDelivery={cancelDelivery}
            onPhotoCapture={setProofPhoto}
          />
        </section>

        {/* Delivery History */}
        {delivery.status_history && delivery.status_history.length > 0 && (
          <section className="space-y-3 pb-4">
            <h2 className="text-sm font-bold text-muted uppercase">History</h2>
            <div className="bg-white rounded-lg border border-gray-100 overflow-hidden">
              {delivery.status_history.map((record, idx) => (
                <div
                  key={idx}
                  className="p-3 border-b border-gray-100 last:border-b-0 text-xs"
                >
                  <div className="flex justify-between items-start">
                    <span className="font-bold text-dark capitalize">
                      {record.status?.replace(/_/g, ' ')}
                    </span>
                    <span className="text-muted">
                      {new Date(record.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  {record.notes && (
                    <p className="text-muted mt-1">{record.notes}</p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

      </main>
    </div>
  );
};

export default ActiveDelivery;
