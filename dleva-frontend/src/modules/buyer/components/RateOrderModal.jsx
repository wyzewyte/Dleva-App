import { useState } from 'react';
import { Star, X, ThumbsUp } from 'lucide-react';

const RateOrderModal = ({ isOpen, onClose, order, onSubmit }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [hoveredStar, setHoveredStar] = useState(0);

  if (!isOpen || !order) return null;

  const handleSubmit = () => {
    // Prepare data for your Django API
    const ratingData = {
        order_id: order.id,
        vendor_id: order.vendorId,
        stars: rating,
        review: comment
    };
    
    onSubmit(ratingData);
    
    // Reset form
    setRating(0);
    setComment("");
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center pointer-events-none">
      
      {/* Backdrop (Click to close) */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm pointer-events-auto transition-opacity"
        onClick={onClose}
      ></div>

      {/* Modal Content */}
      <div className="bg-white w-full max-w-md p-6 rounded-t-3xl sm:rounded-2xl shadow-2xl relative pointer-events-auto animate-in slide-in-from-bottom duration-300">
        
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
            <h3 className="text-xl font-bold text-dark">Rate your meal</h3>
            <p className="text-sm text-muted">How was the food from <span className="font-semibold text-primary">{order.vendorName}</span>?</p>
        </div>

        {/* Star Rating */}
        <div className="flex justify-center gap-2 mb-6">
            {[1, 2, 3, 4, 5].map((star) => (
                <button
                    key={star}
                    onMouseEnter={() => setHoveredStar(star)}
                    onMouseLeave={() => setHoveredStar(0)}
                    onClick={() => setRating(star)}
                    className="transition-transform hover:scale-110 focus:outline-none"
                >
                    <Star 
                        size={32} 
                        weight="fill"
                        className={`${
                            star <= (hoveredStar || rating) 
                                ? "text-warning fill-warning" 
                                : "text-gray-300"
                        } transition-colors duration-200`} 
                    />
                </button>
            ))}
        </div>

        {/* Comment Box */}
        <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Tell us what you liked (or didn't like)..."
            className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary outline-none resize-none h-24 mb-4"
        ></textarea>

        {/* Submit Button */}
        <button
            onClick={handleSubmit}
            disabled={rating === 0}
            className="w-full bg-primary text-white font-bold py-3.5 rounded-xl shadow-lg hover:bg-primary-hover disabled:bg-gray-300 disabled:cursor-not-allowed transition-all active:scale-95"
        >
            Submit Review
        </button>

      </div>
    </div>
  );
};

export default RateOrderModal;