import { MessageSquare, Star } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import sellerAnalytics from '../../../services/sellerAnalytics';
import { logError } from '../../../utils/errorHandler';
import {
  SellerCard,
  SellerEmptyState,
  SellerFeedbackState,
  SellerPageHeader,
  SellerStatusBadge,
} from '../components/ui/SellerPrimitives';
import SellerPageLoading from '../components/ui/SellerPageLoading';

const formatReviewDate = (value) => {
  if (!value) return 'Unknown date';
  return new Date(value).toLocaleDateString('en-NG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const SellerReviewsContent = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setLoading(true);
        const response = await sellerAnalytics.getReviews();
        setReviews(Array.isArray(response) ? response : []);
        setError(null);
      } catch (err) {
        logError(err, { context: 'SellerReviews.fetchReviews' });
        setError(err.error || 'Failed to load reviews');
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, []);

  const summary = useMemo(() => {
    if (!reviews.length) {
      return {
        averageRating: '0.0',
        totalReviews: 0,
        withComments: 0,
      };
    }

    const total = reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0);
    const withComments = reviews.filter((review) => review.comment && review.comment.trim()).length;

    return {
      averageRating: (total / reviews.length).toFixed(1),
      totalReviews: reviews.length,
      withComments,
    };
  }, [reviews]);

  if (loading) {
    return <SellerPageLoading variant="history" />;
  }

  return (
    <div className="space-y-6">
      {error ? <SellerFeedbackState type="error" title="Could not load reviews" message={error} /> : null}

      {!error ? (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <SellerCard className="p-5">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-gray-500">Average rating</p>
              <div className="mt-3 flex items-center gap-2">
                <Star size={20} className="fill-amber-400 text-amber-400" />
                <span className="text-3xl font-bold text-dark">{summary.averageRating}</span>
              </div>
            </SellerCard>

            <SellerCard className="p-5">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-gray-500">Total reviews</p>
              <p className="mt-3 text-3xl font-bold text-dark">{summary.totalReviews}</p>
            </SellerCard>

            <SellerCard className="p-5">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-gray-500">Reviews with comments</p>
              <p className="mt-3 text-3xl font-bold text-dark">{summary.withComments}</p>
            </SellerCard>
          </div>

          {reviews.length === 0 ? (
            <SellerEmptyState
              icon={<MessageSquare size={24} />}
              title="No reviews yet"
              description="Once buyers rate completed orders, their scores and comments will show up here."
            />
          ) : (
            <div className="space-y-3">
              {reviews.map((review, index) => (
                <SellerCard key={review.id || `${review.order_id}-${index}`} className="p-5">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-dark">{review.buyer_name || review.buyer || 'Guest'}</p>
                        <p className="mt-1 text-xs text-muted">
                          Order #{review.order_id} - {formatReviewDate(review.created_at || review.order_date)}
                        </p>
                      </div>
                      <SellerStatusBadge status="active" className="gap-1">
                        {review.rating}
                        <Star size={12} className="fill-current" />
                      </SellerStatusBadge>
                    </div>

                    <div className="flex items-center gap-1 text-amber-400">
                      {Array.from({ length: 5 }).map((_, starIndex) => {
                        const filled = starIndex < Number(review.rating || 0);
                        return (
                          <Star
                            key={`${review.order_id}-${starIndex}`}
                            size={16}
                            className={filled ? 'fill-current text-amber-400' : 'text-gray-200'}
                          />
                        );
                      })}
                    </div>

                    <p className="text-sm leading-relaxed text-muted">
                      {review.comment && review.comment.trim() ? review.comment : 'No written comment left for this order.'}
                    </p>
                  </div>
                </SellerCard>
              ))}
            </div>
          )}
        </>
      ) : null}
    </div>
  );
};

const SellerReviews = () => (
  <div className="space-y-6">
    <SellerPageHeader
      eyebrow="Seller feedback"
      title="Reviews"
      subtitle="See exactly how buyers rate your restaurant and what they said about each order."
    />
    <SellerReviewsContent />
  </div>
);

export default SellerReviews;
