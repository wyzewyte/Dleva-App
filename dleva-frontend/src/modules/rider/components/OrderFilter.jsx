import { Search, Sliders, X } from 'lucide-react';
import { useState } from 'react';

const OrderFilter = ({ onFilterChange, totalOrders }) => {
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [maxDistance, setMaxDistance] = useState(10);
  const [minEarnings, setMinEarnings] = useState(0);
  const [sorting, setSorting] = useState('distance');

  const handleApplyFilters = () => {
    onFilterChange({
      distance: maxDistance,
      min_earnings: minEarnings,
      sorting: sorting,
      search: searchTerm,
    });
    setShowFilters(false);
  };

  const handleReset = () => {
    setSearchTerm('');
    setMaxDistance(10);
    setMinEarnings(0);
    setSorting('distance');
    onFilterChange({
      distance: 10,
      min_earnings: 0,
      sorting: 'distance',
      search: '',
    });
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-4 sticky top-20 z-30">
      
      {/* Search & Filter Row */}
      <div className="flex gap-3 items-center mb-4">
        {/* Search */}
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Search restaurant..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm font-medium"
          />
        </div>

        {/* Filter Toggle */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`p-2.5 rounded-xl transition-colors ${
            showFilters
              ? 'bg-primary text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <Sliders size={18} />
        </button>
      </div>

      {/* Orders Count */}
      <p className="text-xs text-muted font-medium">
        {totalOrders} order{totalOrders !== 1 ? 's' : ''} available
      </p>

      {/* Filter Panel */}
      {showFilters && (
        <div className="mt-4 pt-4 border-t border-gray-100 space-y-4">
          
          {/* Max Distance */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-bold text-gray-600 uppercase">Max Distance</label>
              <span className="text-sm font-bold text-primary">{maxDistance}km</span>
            </div>
            <input
              type="range"
              min="1"
              max="50"
              value={maxDistance}
              onChange={(e) => setMaxDistance(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
            />
          </div>

          {/* Min Earnings */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-bold text-gray-600 uppercase">Min Earnings</label>
              <span className="text-sm font-bold text-primary">₦{minEarnings}</span>
            </div>
            <select
              value={minEarnings}
              onChange={(e) => setMinEarnings(parseInt(e.target.value))}
              className="w-full px-3 py-2 bg-gray-50 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm font-medium"
            >
              <option value={0}>Any earnings</option>
              <option value={1000}>₦1,000+</option>
              <option value={2000}>₦2,000+</option>
              <option value={3000}>₦3,000+</option>
              <option value={5000}>₦5,000+</option>
            </select>
          </div>

          {/* Sorting */}
          <div>
            <label className="text-xs font-bold text-gray-600 uppercase block mb-2">Sort By</label>
            <select
              value={sorting}
              onChange={(e) => setSorting(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm font-medium"
            >
              <option value="distance">Closest to furthest</option>
              <option value="-distance">Furthest to closest</option>
              <option value="earnings">Lowest to highest earnings</option>
              <option value="-earnings">Highest to lowest earnings</option>
              <option value="time_created">Newest first</option>
            </select>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2 border-t border-gray-100">
            <button
              onClick={handleReset}
              className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 text-gray-600 font-bold hover:bg-gray-50 transition-colors text-sm"
            >
              Reset
            </button>
            <button
              onClick={handleApplyFilters}
              className="flex-1 px-4 py-2.5 rounded-lg bg-primary text-white font-bold hover:bg-primary-hover transition-colors text-sm"
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderFilter;
