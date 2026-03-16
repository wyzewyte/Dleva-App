/**
 * Performance Page
 * Displays rider statistics, ratings, and performance metrics
 */

import { useState, useEffect } from 'react';
import { ArrowLeft, Loader2, Star, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useRiderAuth } from '../context/RiderAuthContext';
import PerformanceStats from '../components/PerformanceStats';
import RatingDisplay from '../components/RatingDisplay';
import riderWallet from '../services/riderWallet';
import MESSAGES from '../../../constants/messages';

const Performance = () => {
  const navigate = useNavigate();
  const { rider } = useRiderAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [ratings, setRatings] = useState([]);
  const [activeTab, setActiveTab] = useState('metrics'); // 'metrics' or 'ratings'

  useEffect(() => {
    fetchPerformanceData();
  }, []);

  const fetchPerformanceData = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!rider?.id) {
        setError('Rider not found');
        return;
      }

      const [metricsData, ratingsData] = await Promise.all([
        riderWallet.getPerformanceMetrics(rider.id),
        riderWallet.getRiderRatings(rider.id),
      ]);

      setMetrics(metricsData);
      setRatings(ratingsData.recent_ratings || []);
    } catch (err) {
      setError(err.error || MESSAGES.ERROR.SOMETHING_WRONG);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} className="text-dark" />
          </button>
          <div>
            <h1 className="font-bold text-dark text-lg">Performance</h1>
            <p className="text-xs text-muted">Your delivery statistics and ratings</p>
          </div>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6 pb-8">
        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex gap-3">
            <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">{error}</p>
              <button
                onClick={fetchPerformanceData}
                className="text-red-800 font-bold hover:underline text-sm mt-1"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={32} className="animate-spin text-primary" />
            <span className="ml-3 text-muted font-medium">Loading performance...</span>
          </div>
        )}

        {!loading && !error && (
          <>
            {/* Metrics Section */}
            <PerformanceStats metrics={metrics} loading={loading} />

            {/* Ratings Section */}
            <section>
              <h2 className="text-sm font-bold text-muted uppercase tracking-wide mb-4">
                Customer Ratings & Reviews
              </h2>

              {ratings && ratings.length > 0 ? (
                <RatingDisplay ratings={ratings} loading={loading} />
              ) : (
                <div className="bg-white border border-gray-100 rounded-2xl p-8 text-center space-y-3">
                  <Star size={32} className="mx-auto text-gray-300" />
                  <p className="text-muted font-medium">No ratings yet</p>
                  <p className="text-xs text-muted">
                    Complete deliveries to receive customer ratings
                  </p>
                </div>
              )}
            </section>

            {/* Performance Tips */}
            <section className="bg-gradient-to-br from-primary/5 to-success/5 border border-primary/10 rounded-2xl p-6 space-y-4">
              <h3 className="font-bold text-dark text-sm uppercase tracking-wide">
                Tips to Improve Performance
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white/50 rounded-lg p-4 space-y-2">
                  <p className="font-bold text-dark text-sm">⏱️ Deliver On Time</p>
                  <p className="text-xs text-dark">
                    Complete deliveries within estimated time to boost your on-time rating
                  </p>
                </div>

                <div className="bg-white/50 rounded-lg p-4 space-y-2">
                  <p className="font-bold text-dark text-sm">📞 Communicate</p>
                  <p className="text-xs text-dark">
                    Keep customers informed about your arrival and any delays
                  </p>
                </div>

                <div className="bg-white/50 rounded-lg p-4 space-y-2">
                  <p className="font-bold text-dark text-sm">✅ Check Orders</p>
                  <p className="text-xs text-dark">
                    Verify all items before leaving pickup location
                  </p>
                </div>

                <div className="bg-white/50 rounded-lg p-4 space-y-2">
                  <p className="font-bold text-dark text-sm">🎯 Be Professional</p>
                  <p className="text-xs text-dark">
                    Handle orders with care and treat customers respectfully
                  </p>
                </div>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
};

export default Performance;
