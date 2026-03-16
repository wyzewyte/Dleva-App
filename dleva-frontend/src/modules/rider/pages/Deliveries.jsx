import { MapPin } from 'lucide-react';

const RiderDeliveries = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-4 pb-16">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
          <MapPin size={32} className="text-gray-400 mx-auto mb-3" />
          <h2 className="text-2xl font-bold text-dark mb-2">Active Deliveries</h2>
          <p className="text-gray-600">Your active deliveries will appear here.</p>
        </div>
      </div>
    </div>
  );
};

export default RiderDeliveries;
