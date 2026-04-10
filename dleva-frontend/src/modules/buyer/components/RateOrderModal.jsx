import { useState } from 'react';
import { Bike, Star, Store, X, ThumbsUp, CheckCircle } from 'lucide-react';
import { BuyerPrimaryButton, BuyerTextInput } from './ui/BuyerPrimitives';

const RateOrderModal = ({ isOpen, onClose, order, onSubmit }) => {
  const [restaurantRating, setRestaurantRating] = useState(0);
  const [riderRating, setRiderRating] = useState(0);
  const [restaurantComment, setRestaurantComment] = useState("");
  const [riderComment, setRiderComment] = useState("");
  const [hoveredRestaurantStar, setHoveredRestaurantStar] = useState(0);
  const [hoveredRiderStar, setHoveredRiderStar] = useState(0);
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !order) return null;

  // Check if rider exists - handle both direct rider_id and nested rider object
  const hasRider = Boolean(
    order.rider_id || 
    (order.rider && (order.rider.id || order.rider > 0))
  );
  const canSubmit = restaurantRating > 0 || riderRating > 0;

  const handleSubmit = async () => {
    if (!canSubmit) return;

    setIsSubmitting(true);
    setSuccessMessage(""); // Clear any previous message
    
    try {
      const results = await onSubmit({
        orderId: order.id,
        restaurantRating,
        riderRating,
        restaurantComment,
        riderComment,
      });

      // Build arrays of what succeeded and what failed
      const succeededItems = [];
      const failedItems = [];
      
      if (restaurantRating > 0) {
        if (results?.restaurantError) {
          failedItems.push('restaurant');
        } else {
          succeededItems.push('restaurant rating');
        }
      }
      
      if (riderRating > 0) {
        if (results?.riderError) {
          failedItems.push('rider');
        } else {
          succeededItems.push('rider rating');
        }
      }

      // Only show success message if at least one rating succeeded
      if (succeededItems.length > 0) {
        setSuccessMessage(`${succeededItems.join(' and ')} submitted!`);
        
        // Clear only the successful fields from the form
        if (restaurantRating > 0 && !results?.restaurantError) {
          setRestaurantRating(0);
          setRestaurantComment("");
        }
        if (riderRating > 0 && !results?.riderError) {
          setRiderRating(0);
          setRiderComment("");
        }
        
        // Hide success message after 3 seconds
        setTimeout(() => setSuccessMessage(""), 3000);
      } else if (failedItems.length > 0) {
        // All submissions failed - don't show success, errors are already logged
        console.warn(`Failed to submit ${failedItems.join(' and ')} rating`);
      }
    } catch (err) {
      // Submission completely failed
      console.error('Rating submission error:', err);
      setSuccessMessage("");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStars = ({ value, hoveredValue, setValue, setHoveredValue, label }) => (
    <div>
      <p className="mb-2 text-xs font-semibold text-dark sm:text-sm">{label}</p>
      <div className="flex justify-center gap-1.5 sm:gap-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={`${label}-${star}`}
            onMouseEnter={() => setHoveredValue(star)}
            onMouseLeave={() => setHoveredValue(0)}
            onClick={() => setValue(star)}
            className="transition-transform hover:scale-110 focus:outline-none active:scale-95"
            type="button"
          >
            <Star
              size={24}
              className={`sm:size-[30px] ${
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
      <div className="bg-white w-full max-w-md h-auto max-h-screen sm:max-h-[90vh] rounded-t-3xl sm:rounded-2xl shadow-2xl relative pointer-events-auto animate-in slide-in-from-bottom duration-300 flex flex-col overflow-hidden">
        
        {/* Header with Close Button */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white px-4 py-4 sm:px-6 sm:py-5">
          <div className="min-w-0 flex-1">
            <h3 className="text-lg font-bold text-dark sm:text-xl">Rate your order</h3>
          </div>
          <button 
            onClick={onClose}
            className="ml-2 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-gray-50 transition-colors hover:bg-gray-100"
            type="button"
            aria-label="Close"
          >
            <X size={20} className="text-dark" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6">
          <div className="space-y-1 text-center mb-5">
            <p className="text-xs text-muted sm:text-sm">
              Share feedback for <span className="font-semibold text-primary">{order.restaurant_name || order.vendorName || 'the restaurant'}</span>
              {hasRider ? ' and your delivery.' : '.'}
            </p>
          </div>

          <div className="space-y-4 sm:space-y-5">
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-3 sm:p-4">
              <div className="mb-3 flex items-center gap-2 text-dark">
                <Store size={16} className="text-primary shrink-0" />
                <p className="text-xs font-semibold sm:text-sm">Restaurant</p>
              </div>
              {renderStars({
                value: restaurantRating,
                hoveredValue: hoveredRestaurantStar,
                setValue: setRestaurantRating,
                setHoveredValue: setHoveredRestaurantStar,
                label: 'How was the food?'
              })}
              <div className="mt-3 sm:mt-4">
                <BuyerTextInput
                  multiline
                  rows={2}
                  value={restaurantComment}
                  onChange={(e) => setRestaurantComment(e.target.value)}
                  placeholder="Tell us about the food, packaging..."
                />
              </div>
            </div>

            {hasRider ? (
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-3 sm:p-4">
                <div className="mb-3 flex items-center gap-2 text-dark">
                  <Bike size={16} className="text-primary shrink-0" />
                  <p className="text-xs font-semibold sm:text-sm">Rider</p>
                </div>
                {renderStars({
                  value: riderRating,
                  hoveredValue: hoveredRiderStar,
                  setValue: setRiderRating,
                  setHoveredValue: setHoveredRiderStar,
                  label: order.rider_name ? `How was delivery with ${order.rider_name}?` : 'How was the delivery?'
                })}
                <div className="mt-3 sm:mt-4">
                  <BuyerTextInput
                    multiline
                    rows={2}
                    value={riderComment}
                    onChange={(e) => setRiderComment(e.target.value)}
                    placeholder="Tell us about delivery time, condition..."
                  />
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {/* Footer with Button */}
        <div className="sticky bottom-0 border-t border-gray-100 bg-white px-4 py-4 sm:px-6 sm:py-5">
          <BuyerPrimaryButton 
            onClick={handleSubmit} 
            disabled={!canSubmit || isSubmitting}
            className="w-full"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Rating'}
          </BuyerPrimaryButton>

          {successMessage && (
            <div className="mt-3 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 animate-in fade-in slide-in-from-bottom">
              <CheckCircle size={16} className="text-emerald-600 shrink-0 sm:size-[18px]" />
              <p className="text-xs font-semibold text-emerald-700 sm:text-sm">{successMessage}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RateOrderModal;
