import { Star, MessageSquare, Calendar, AlertCircle } from 'lucide-react';

const FeedbackDisplay = ({ performance, loading = false }) => {
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-32 animate-pulse rounded-xl bg-gray-100" />
        <div className="h-24 animate-pulse rounded-xl bg-gray-100" />
        <div className="h-24 animate-pulse rounded-xl bg-gray-100" />
      </div>
    );
  }

  if (!performance) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6 text-center">
        <AlertCircle size={32} className="mx-auto mb-2 text-gray-400" />
        <p className="text-sm font-semibold text-dark">No feedback available</p>
        <p className="mt-1 text-xs text-muted">Complete deliveries to receive customer ratings</p>
      </div>
    );
  }

  const { average_rating, total_ratings, recent_ratings = [] } = performance;
  const avgRating = parseFloat(average_rating) || 0;
  const fullStars = Math.floor(avgRating);
  const hasHalfStar = avgRating % 1 >= 0.5;

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 0; i < 5; i++) {
      if (i < Math.floor(rating)) {
        stars.push(
          <Star key={i} size={16} className="fill-amber-400 text-amber-400" />
        );
      } else if (i === Math.floor(rating) && rating % 1 > 0) {
        stars.push(
          <div key={i} className="relative">
            <Star size={16} className="text-gray-300" />
            <div className="absolute inset-0 overflow-hidden" style={{ width: `${(rating % 1) * 100}%` }}>
              <Star size={16} className="fill-amber-400 text-amber-400" />
            </div>
          </div>
        );
      } else {
        stars.push(
          <Star key={i} size={16} className="text-gray-300" />
        );
      }
    }
    return stars;
  };

  return (
    <div className="space-y-6">
      {/* Rating Summary Card */}
      <div className="rounded-2xl border border-amber-100 bg-amber-50/50 p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-amber-900">Overall Rating</p>
            <div className="mt-3 flex items-center gap-3">
              <div className="flex gap-1">{renderStars(avgRating)}</div>
              <span className="text-2xl font-bold text-dark">{avgRating.toFixed(1)}</span>
            </div>
            <p className="mt-2 text-sm text-amber-700">
              Based on <span className="font-bold">{total_ratings}</span> {total_ratings === 1 ? 'rating' : 'ratings'}
            </p>
          </div>
          <div className="rounded-xl bg-amber-100/50 p-3 text-amber-700">
            <Star size={24} className="fill-amber-400 text-amber-400" />
          </div>
        </div>
      </div>

      {/* Recent Feedback */}
      {recent_ratings && recent_ratings.length > 0 ? (
        <div>
          <h4 className="mb-3 text-base font-bold text-dark">Recent Feedback</h4>
          <div className="space-y-3">
            {recent_ratings.map((feedback, idx) => (
              <div 
                key={idx}
                className="flex gap-3 rounded-xl border border-gray-200 bg-white p-4 transition-colors hover:bg-gray-50"
              >
                {/* Rating Stars */}
                <div className="mt-0.5 flex gap-0.5">{renderStars(feedback.rating)}</div>

                {/* Feedback Details */}
                <div className="min-w-0 flex-1">
                  {feedback.comment && (
                    <p className="text-sm leading-5 text-dark">{feedback.comment}</p>
                  )}
                  <div className="mt-2 flex items-center gap-2 text-xs text-muted">
                    <Calendar size={12} />
                    <span>
                      {new Date(feedback.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                </div>

                {/* Rating Badge */}
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100">
                  <span className="text-sm font-bold text-dark">{feedback.rating}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6 text-center">
          <MessageSquare size={32} className="mx-auto mb-2 text-gray-400" />
          <p className="text-sm font-semibold text-dark">No feedback yet</p>
          <p className="mt-1 text-xs text-muted">Your first ratings will appear here after you complete deliveries</p>
        </div>
      )}

      {/* Info Tip */}
      <div className="rounded-xl border border-blue-100 bg-blue-50 p-3 text-xs text-blue-700">
        <p className="font-semibold">💡 Tip:</p>
        <p className="mt-1">Maintain a high rating to stay eligible for premium delivery zones and bonuses. Customers rate based on delivery speed, professionalism, and communication.</p>
      </div>
    </div>
  );
};

export default FeedbackDisplay;
