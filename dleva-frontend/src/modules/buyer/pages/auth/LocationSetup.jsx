import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Navigation, Loader2 } from 'lucide-react';
import { saveLocation } from '../../../../services/location';

const HOSTELS = [
  { name: 'Male Hostel A', lat: 6.7541, lng: 6.0732 },
  { name: 'Female Hostel B', lat: 6.7545, lng: 6.0740 },
  { name: 'Mariere Hall', lat: 6.7510, lng: 6.0715 },
  { name: 'Jara Plaza Area', lat: 6.7580, lng: 6.0760 },
];

const LocationSetup = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedHostel, setSelectedHostel] = useState('');

  const handleSaveLocation = async () => {
    if (!selectedHostel) return;
    setIsLoading(true);

    const hostelData = HOSTELS.find(h => h.name === selectedHostel);
    const token = localStorage.getItem('buyer_access_token'); // for debug

    try {
      if (token) {
        // Use service to persist to backend
        await saveLocation({
          latitude: hostelData.lat,
          longitude: hostelData.lng,
          address: hostelData.name,
        });
      } else {
        // Guest fallback
        localStorage.setItem('guest_location', JSON.stringify({
          lat: hostelData.lat,
          lng: hostelData.lng,
          address: hostelData.name
        }));
      }

      // remove any old guest cart if user logged in
      if (token) localStorage.removeItem('dleva_cart');

      navigate('/home');
    } catch (error) {
      logError(error, { context: 'LocationSetup.saveLocation' });
      alert('Failed to save location. Try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
      <div className="bg-white w-full max-w-md rounded-3xl p-8 shadow-xl text-center">
        <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <MapPin size={32} />
        </div>

        <h2 className="text-2xl font-bold text-dark mb-2">Set Your Location</h2>
        <p className="text-gray-500 mb-8 text-sm">To see restaurants near you, we need to know which hostel or area you are in.</p>

        <div className="space-y-3 mb-8 text-left">
            <label className="text-xs font-bold text-gray-400 uppercase ml-1">Select Hostel / Area</label>
            <div className="relative">
                <Navigation className="absolute left-4 top-4 text-primary" size={20} />
                <select 
                    className="w-full pl-12 pr-4 py-4 bg-gray-50 rounded-xl border border-gray-200 font-bold text-dark focus:ring-2 focus:ring-primary"
                    value={selectedHostel}
                    onChange={(e) => setSelectedHostel(e.target.value)}
                >
                    <option value="">-- Choose Location --</option>
                    {HOSTELS.map(h => (
                        <option key={h.name} value={h.name}>{h.name}</option>
                    ))}
                </select>
            </div>
        </div>

        <button 
            onClick={handleSaveLocation}
            disabled={!selectedHostel || isLoading}
            className="w-full bg-primary text-white font-bold py-4 rounded-xl hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
            {isLoading ? <Loader2 className="animate-spin mx-auto" /> : 'Start Ordering Food'}
        </button>

      </div>
    </div>
  );
};

export default LocationSetup;