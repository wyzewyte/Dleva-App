/**
 * RatingDisplay Component
 * Shows rider ratings and reviews from customers
 */

import { Star, MessageSquare, Calendar, User } from 'lucide-react';

const RatingDisplay = ({ ratings, loading }) => {
  if (loading) {
    return <div className="text-center py-8 text-muted">Loading ratings...</div>;
  }

  if (!ratings || ratings.length === 0) {
    return (
      <div className="text-center py-12 text-muted">
        <MessageSquare size={32} className="mx-auto mb-3 opacity-50" />
        <p>No ratings yet</p>
        <p className="text-xs mt-1">Complete deliveries to receive customer ratings</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {ratings.map((rating, idx) => (
        <div key={idx} className="bg-white border border-gray-100 rounded-lg p-4 space-y-2">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                  <User size={14} className="text-gray-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-dark truncate">
                    Customer Rating
                  </p>
                  <p className="text-xs text-muted flex items-center gap-1">
                    <Calendar size={12} />
                    {new Date(rating.created_at).toLocaleDateString('en-NG', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              </div>
            </div>

            {/* Star Rating */}
            <div className="flex gap-1">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  size={14}
                  className={
                    i < rating.rating
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-300'
                  }
                />
              ))}
            </div>
          </div>

          {/* Review Text */}
          {rating.comment && (
            <p className="text-sm text-dark bg-gray-50 rounded p-2">
              "{rating.comment}"
            </p>
          )}
        </div>
      ))}
    </div>
  );
};

export default RatingDisplay;
