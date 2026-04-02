import { useState } from 'react';
import { Bike, Star, Store, X, ThumbsUp } from 'lucide-react';
import { BuyerPrimaryButton, BuyerTextInput } from './ui/BuyerPrimitives';

const RateOrderModal = ({ isOpen, onClose, order, onSubmit }) => {
  const [restaurantRating, setRestaurantRating] = useState(0);
  const [riderRating, setRiderRating] = useState(0);
  const [comment, setComment] = useState("");
  const [hoveredRestaurantStar, setHoveredRestaurantStar] = useState(0);
  const [hoveredRiderStar, setHoveredRiderStar] = useState(0);

  if (!isOpen || !order) return null;

  const hasRider = Boolean(order.rider_id);

  const handleSubmit = () => {
    onSubmit({
      orderId: order.id,
      restaurantRating,
      riderRating,
      comment,
    });
  };

  const renderStars = ({ value, hoveredValue, setValue, setHoveredValue, label }) => (
    <div>
      <p className="mb-3 text-sm font-semibold text-dark">{label}</p>
      <div className="flex justify-center gap-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={`${label}-${star}`}
            onMouseEnter={() => setHoveredValue(star)}
            onMouseLeave={() => setHoveredValue(0)}
            onClick={() => setValue(star)}
            className="transition-transform hover:scale-110 focus:outline-none"
          >
            <Star
              size={30}
              className={`${
                star <= (hoveredValue || value)
                  ? "fill-warning text-warning"
                  : "text-gray-300"
              } transition-colors duration-200`}
            />
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center pointer-events-none">
      
      {/* Backdrop (Click to close) */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm pointer-events-auto transition-opacity"
        onClick={onClose}
      ></div>

      {/* Modal Content */}
      <div className="bg-white w-full max-w-md p-6 rounded-t-2xl sm:rounded-2xl shadow-2xl relative pointer-events-auto animate-in slide-in-from-bottom duration-300">
        
        {/* Close Button */}
        <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
        >
            <X size={20} className="text-dark" />
        </button>

        <div className="text-center mb-6">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3 text-primary">
                <ThumbsUp size={32} />
            </div>
            <h3 className="text-xl font-bold text-dark">Rate your order</h3>
            <p className="text-sm text-muted">
              Share feedback for <span className="font-semibold text-primary">{order.restaurant_name || order.vendorName || 'the restaurant'}</span>
              {hasRider ? ' and your delivery experience.' : '.'}
            </p>
        </div>

        <div className="space-y-5 mb-6">
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
            <div className="mb-3 flex items-center gap-2 text-dark">
              <Store size={16} className="text-primary" />
              <p className="text-sm font-semibold">Restaurant</p>
            </div>
            {renderStars({
              value: restaurantRating,
              hoveredValue: hoveredRestaurantStar,
              setValue: setRestaurantRating,
              setHoveredValue: setHoveredRestaurantStar,
              label: 'How was the food?'
            })}
          </div>

          {hasRider ? (
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <div className="mb-3 flex items-center gap-2 text-dark">
                <Bike size={16} className="text-primary" />
                <p className="text-sm font-semibold">Rider</p>
              </div>
              {renderStars({
                value: riderRating,
                hoveredValue: hoveredRiderStar,
                setValue: setRiderRating,
                setHoveredValue: setHoveredRiderStar,
                label: order.rider_name ? `How was delivery with ${order.rider_name}?` : 'How was the delivery experience?'
              })}
            </div>
          ) : null}
        </div>

        {/* Comment Box */}
        <BuyerTextInput
          multiline
          rows={4}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Tell us what you liked (or didn't like)..."
          className="mb-4"
        />

        <BuyerPrimaryButton onClick={handleSubmit} disabled={restaurantRating === 0}>
          Submit Rating
        </BuyerPrimaryButton>

      </div>
    </div>
  );
};

export default RateOrderModal;
