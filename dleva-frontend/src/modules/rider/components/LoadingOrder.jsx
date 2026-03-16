const LoadingOrder = () => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-4 animate-pulse">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="w-24 h-6 bg-gray-200 rounded-lg" />
        <div className="w-16 h-6 bg-gray-200 rounded-lg" />
      </div>

      {/* Restaurant Info Box */}
      <div className="bg-gray-50 rounded-xl p-3 mb-4">
        <div className="w-32 h-5 bg-gray-200 rounded mb-2" />
        <div className="w-48 h-4 bg-gray-200 rounded" />
      </div>

      {/* Buyer Info */}
      <div className="flex items-center gap-2 mb-4 pb-4 border-b border-gray-100">
        <div className="w-8 h-8 bg-gray-200 rounded-full" />
        <div className="flex-1">
          <div className="w-20 h-3 bg-gray-200 rounded mb-2" />
          <div className="w-28 h-4 bg-gray-200 rounded" />
        </div>
        <div className="text-right">
          <div className="w-12 h-3 bg-gray-200 rounded mb-2" />
          <div className="w-16 h-4 bg-gray-200 rounded" />
        </div>
      </div>

      {/* Distance & Time Grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="w-full h-12 bg-gray-200 rounded-lg" />
        <div className="w-full h-12 bg-gray-200 rounded-lg" />
      </div>

      {/* Earnings Box */}
      <div className="bg-gray-200 rounded-xl p-4 mb-4 h-16" />

      {/* Buttons */}
      <div className="flex gap-3">
        <div className="flex-1 h-12 bg-gray-200 rounded-xl" />
        <div className="flex-1 h-12 bg-gray-200 rounded-xl" />
      </div>
    </div>
  );
};

export default LoadingOrder;
