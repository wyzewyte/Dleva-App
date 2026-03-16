import React, { useState, useEffect } from 'react';
import { MapPin, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import gpsPermissionService from '../../../services/gpsPermissionService';

/**
 * GPS Permission Dialog Component
 * Requests user permission to access location during checkout/delivery
 * Shows status and provides fallback options
 */
const GpsPermissionDialog = ({
  isOpen,
  orderId,
  orderStatus = 'pending',
  onConfirm,
  onDismiss,
  onAllow,
  onDeny,
}) => {
  const [isRequesting, setIsRequesting] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  useEffect(() => {
    if (isOpen) {
      checkPermissionStatus();
    }
  }, [isOpen]);

  const checkPermissionStatus = async () => {
    try {
      // Check if browser supports geolocation
      if (!gpsPermissionService.isSupported()) {
        setErrorMessage('Your browser does not support location services');
        setPermissionStatus('unsupported');
        return;
      }

      // Check if HTTPS or localhost
      if (!gpsPermissionService.isSecureContext()) {
        setErrorMessage('Location services require a secure (HTTPS) connection');
        setPermissionStatus('insecure');
        return;
      }

      // Check current permission status
      const status = await gpsPermissionService.checkPermissionStatus();
      setPermissionStatus(status);
    } catch (error) {
      console.error('Error checking permission:', error);
      setPermissionStatus('unknown');
    }
  };

  const handleAllowClick = async () => {
    setIsRequesting(true);
    setErrorMessage(null);

    try {
      await gpsPermissionService.requestAccess();
      setPermissionStatus('granted');
      onAllow?.();
      
      // Auto-close on successful permission
      setTimeout(() => {
        onConfirm?.();
      }, 1000);
    } catch (error) {
      console.error('GPS permission error:', error);
      
      if (error.code === 1) {
        setErrorMessage('You denied location access. You can enable it in browser settings.');
        setPermissionStatus('denied');
      } else if (error.code === 2) {
        setErrorMessage('Location is currently unavailable. Please try again in a moment.');
        setPermissionStatus('unavailable');
      } else if (error.code === 3) {
        setErrorMessage('Location request timed out. Please try again.');
        setPermissionStatus('timeout');
      } else {
        setErrorMessage(error.message || 'Failed to get location');
        setPermissionStatus('error');
      }
      
      onDeny?.();
    } finally {
      setIsRequesting(false);
    }
  };

  const handleContinueWithoutGps = () => {
    onDismiss?.();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-blue-50 border-b border-blue-100 p-6">
          <div className="flex items-center gap-3">
            <MapPin className="text-blue-600" size={28} />
            <div>
              <h2 className="text-lg font-bold text-dark">Share Your Location?</h2>
              <p className="text-sm text-muted">Helps rider find you easily</p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Status Message */}
          {errorMessage ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
              <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
              <p className="text-sm text-red-700">{errorMessage}</p>
            </div>
          ) : (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
              <p className="text-sm text-blue-900">
                <strong>Better Delivery Experience:</strong>
              </p>
              <ul className="text-sm text-blue-800 space-y-1 ml-4 list-disc">
                <li>Rider can locate you quickly</li>
                <li>Real-time tracking of delivery</li>
                <li>Accurate drop-off location</li>
              </ul>
            </div>
          )}

          {/* Permission Status Indicator */}
          {permissionStatus && permissionStatus !== 'prompt' && (
            <div className="flex items-center gap-2 text-sm">
              {permissionStatus === 'granted' && (
                <>
                  <CheckCircle className="text-green-600" size={18} />
                  <span className="text-green-700">
                    Location access granted
                  </span>
                </>
              )}
              {permissionStatus === 'denied' && (
                <>
                  <XCircle className="text-red-600" size={18} />
                  <span className="text-red-700">
                    Location access denied
                  </span>
                </>
              )}
              {permissionStatus === 'unavailable' && (
                <>
                  <AlertCircle className="text-yellow-600" size={18} />
                  <span className="text-yellow-700">
                    Location unavailable
                  </span>
                </>
              )}
            </div>
          )}

          {/* Privacy Notice */}
          <p className="text-xs text-muted border-t pt-3">
            Your location is only used during delivery and is never shared with third parties.
            You can revoke access anytime in browser settings.
          </p>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 border-t p-4 flex gap-3">
          <button
            onClick={handleContinueWithoutGps}
            disabled={isRequesting}
            className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Not Now
          </button>
          <button
            onClick={handleAllowClick}
            disabled={isRequesting || permissionStatus === 'granted'}
            className={`flex-1 px-4 py-2.5 rounded-lg font-semibold text-white transition-all ${
              permissionStatus === 'granted'
                ? 'bg-green-600 hover:bg-green-700'
                : 'bg-primary hover:bg-primary/90'
            } disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
          >
            {isRequesting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Requesting...
              </>
            ) : permissionStatus === 'granted' ? (
              <>
                <CheckCircle size={18} />
                Granted
              </>
            ) : (
              'Allow Access'
            )}
          </button>
        </div>

        {/* Note about insecure context */}
        {!gpsPermissionService.isSecureContext() && (
          <div className="bg-yellow-50 border-t border-yellow-200 p-4 text-xs text-yellow-800">
            ⚠️ Location services require a secure HTTPS connection. Some features may not work on HTTP.
          </div>
        )}
      </div>
    </div>
  );
};

export default GpsPermissionDialog;
