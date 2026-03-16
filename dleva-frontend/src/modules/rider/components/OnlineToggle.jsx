import { Power, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import api from '../../../services/axios';
import { API_ENDPOINTS } from '../../../constants/apiConfig';
import MESSAGES from '../../../constants/messages';
import { useRiderAuth } from '../context/RiderAuthContext';

const OnlineToggle = ({ isOnline, onToggle }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { updateProfile } = useRiderAuth();

  const handleToggle = async () => {
    if (isLoading) return;

    setIsLoading(true);
    setError('');

    try {
      console.debug('[OnlineToggle] calling toggle endpoint ->', API_ENDPOINTS.RIDER.TOGGLE_ONLINE, 'payload:', { is_online: !isOnline });
      const resp = await api.post(API_ENDPOINTS.RIDER.TOGGLE_ONLINE, { is_online: !isOnline });

      // If endpoint returned is_online, use it. Otherwise fetch full profile.
      if (resp?.data && typeof resp.data.is_online !== 'undefined') {
        updateProfile({ is_online: Boolean(resp.data.is_online) });
      } else {
        try {
          const res = await api.get(API_ENDPOINTS.RIDER.PROFILE);
          console.debug('[OnlineToggle] fetched updated profile', res.data);
          if (res?.data) updateProfile(res.data);
        } catch (err) {
          console.warn('[OnlineToggle] failed to fetch profile after toggle', err);
        }
      }

      if (typeof onToggle === 'function') onToggle();
    } catch (err) {
      setError(err.response?.data?.error || MESSAGES.ERROR.SOMETHING_WRONG);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-6">
      
      {/* Error Message */}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2 text-sm text-red-700">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Toggle Container */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-muted font-bold uppercase mb-1">Status</p>
          <div className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-green-500' : 'bg-gray-400'}`} />
            <p className="text-lg font-bold text-dark">
              {isOnline ? 'Online' : 'Offline'}
            </p>
          </div>
          <p className="text-xs text-muted mt-1">
            {isOnline ? 'Ready to accept orders' : 'Not accepting orders'}
          </p>
        </div>

        {/* Toggle Button */}
        <button
          onClick={handleToggle}
          disabled={isLoading}
          className={`relative w-16 h-9 rounded-full transition-colors ${
            isOnline ? 'bg-green-500 hover:bg-green-600' : 'bg-gray-300 hover:bg-gray-400'
          } disabled:opacity-50`}
        >
          <div
            className={`absolute top-1 w-7 h-7 bg-white rounded-full shadow-md transition-transform ${
              isOnline ? 'translate-x-8' : 'translate-x-1'
            }`}
          >
            {isLoading && (
              <div className="w-full h-full flex items-center justify-center">
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>
        </button>
      </div>

      {/* Info Text */}
      <p className="text-xs text-muted mt-4">
        {isOnline
          ? 'You will receive notifications for new orders in your service area.'
          : 'Turn on to start receiving delivery requests.'}
      </p>
    </div>
  );
};

export default OnlineToggle;
