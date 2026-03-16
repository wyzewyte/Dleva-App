/**
 * Promotion Page
 * Displays available promotions, bonus offers, and incentives for riders
 */

import { useState, useEffect } from 'react';
import { ArrowLeft, Loader2, AlertCircle, Zap, Gift, TrendingUp, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useRiderAuth } from '../context/RiderAuthContext';
import riderWallet from '../services/riderWallet';
import MESSAGES from '../../../constants/messages';

const Promotion = () => {
  const navigate = useNavigate();
  const { rider } = useRiderAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [promotions, setPromotions] = useState([]);
  const [claimedPromotions, setClaimedPromotions] = useState([]);

  useEffect(() => {
    fetchPromotions();
  }, []);

  const fetchPromotions = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!rider?.id) {
        setError('Rider not found');
        return;
      }

      // Mock promotions data
      const mockPromotions = [
        {
          id: 1,
          title: 'First 10 Deliveries Bonus',
          description: 'Get $5 bonus for every delivery in your first 10 deliveries',
          bonus: '$50',
          type: 'new_rider',
          condition: 'Complete 10 deliveries',
          expiresAt: '2025-02-28',
          claimed: false,
          progress: '2/10',
        },
        {
          id: 2,
          title: 'Weekend Bonus',
          description: 'Earn 20% extra on all orders delivered on Saturday and Sunday',
          bonus: '20%',
          type: 'weekend',
          condition: 'Valid every weekend',
          expiresAt: null,
          claimed: true,
          progress: null,
        },
        {
          id: 3,
          title: 'Peak Hours Surge',
          description: 'Get 30% bonus for deliveries between 12-2 PM and 6-8 PM',
          bonus: '30%',
          type: 'surge',
          condition: 'During peak hours',
          expiresAt: null,
          claimed: true,
          progress: null,
        },
        {
          id: 4,
          title: 'Perfect Rating Reward',
          description: 'Earn $100 bonus when you maintain 4.8+ rating for 30 days',
          bonus: '$100',
          type: 'rating',
          condition: 'Maintain 4.8+ rating',
          expiresAt: '2025-03-15',
          claimed: false,
          progress: null,
        },
        {
          id: 5,
          title: 'Monthly Milestone',
          description: 'Complete 100 deliveries this month and get $200 bonus',
          bonus: '$200',
          type: 'milestone',
          condition: 'Complete 100 deliveries',
          expiresAt: '2025-02-28',
          claimed: false,
          progress: '67/100',
        },
      ];

      setPromotions(mockPromotions);
      setClaimedPromotions(mockPromotions.filter((p) => p.claimed));
    } catch (err) {
      setError(err.error || MESSAGES.ERROR.SOMETHING_WRONG);
    } finally {
      setLoading(false);
    }
  };

  const handleClaimPromotion = async (promotionId) => {
    try {
      // Call API to claim promotion
      // await riderWallet.claimPromotion(promotionId);
      
      // Update local state
      setPromotions((prev) =>
        prev.map((p) => (p.id === promotionId ? { ...p, claimed: true } : p))
      );
    } catch (err) {
      setError(err.error || 'Failed to claim promotion');
    }
  };

  const getPromotionIcon = (type) => {
    switch (type) {
      case 'new_rider':
        return <Gift size={24} className="text-primary" />;
      case 'weekend':
        return <Zap size={24} className="text-orange-500" />;
      case 'surge':
        return <TrendingUp size={24} className="text-success" />;
      case 'rating':
        return <Zap size={24} className="text-secondary" />;
      case 'milestone':
        return <Gift size={24} className="text-purple-500" />;
      default:
        return <Gift size={24} className="text-primary" />;
    }
  };

  const getPromotionColor = (type) => {
    switch (type) {
      case 'new_rider':
        return 'from-primary/5 to-primary/10';
      case 'weekend':
        return 'from-orange-500/5 to-orange-500/10';
      case 'surge':
        return 'from-success/5 to-success/10';
      case 'rating':
        return 'from-secondary/5 to-secondary/10';
      case 'milestone':
        return 'from-purple-500/5 to-purple-500/10';
      default:
        return 'from-primary/5 to-primary/10';
    }
  };

  const daysUntilExpiry = (expiresAt) => {
    if (!expiresAt) return null;
    const days = Math.ceil(
      (new Date(expiresAt) - new Date()) / (1000 * 60 * 60 * 24)
    );
    return days > 0 ? days : 0;
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
            <h1 className="font-bold text-dark text-lg">Promotions & Bonuses</h1>
            <p className="text-xs text-muted">Available offers and incentives</p>
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
                onClick={fetchPromotions}
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
            <span className="ml-3 text-muted font-medium">Loading promotions...</span>
          </div>
        )}

        {!loading && !error && (
          <>
            {/* Active Promotions */}
            <section>
              <h2 className="text-sm font-bold text-muted uppercase tracking-wide mb-4">
                Active Promotions
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {promotions
                  .filter((p) => !p.claimed)
                  .map((promotion) => (
                    <div
                      key={promotion.id}
                      className={`bg-gradient-to-br ${getPromotionColor(
                        promotion.type
                      )} border border-gray-200 rounded-2xl p-5 space-y-4 hover:shadow-md transition-shadow`}
                    >
                      {/* Header */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="p-2 bg-white rounded-lg">
                          {getPromotionIcon(promotion.type)}
                        </div>
                        {promotion.expiresAt && (
                          <div className="text-right">
                            <p className="text-xs font-bold text-red-600">
                              {daysUntilExpiry(promotion.expiresAt)}d left
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="space-y-2">
                        <p className="font-bold text-dark">{promotion.title}</p>
                        <p className="text-xs text-muted leading-relaxed">
                          {promotion.description}
                        </p>
                      </div>

                      {/* Bonus Amount */}
                      <div className="bg-white/60 rounded-lg p-3">
                        <p className="text-xs text-muted mb-1">Bonus</p>
                        <p className="text-lg font-bold text-dark">{promotion.bonus}</p>
                      </div>

                      {/* Progress or Condition */}
                      {promotion.progress ? (
                        <div className="space-y-2">
                          <div className="flex justify-between text-xs">
                            <span className="text-muted">{promotion.condition}</span>
                            <span className="font-bold text-dark">{promotion.progress}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-success h-2 rounded-full transition-all"
                              style={{
                                width: `${
                                  (parseInt(promotion.progress.split('/')[0]) /
                                    parseInt(promotion.progress.split('/')[1])) *
                                  100
                                }%`,
                              }}
                            />
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-muted">{promotion.condition}</p>
                      )}

                      {/* Claim Button */}
                      <button
                        onClick={() => handleClaimPromotion(promotion.id)}
                        className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-2 rounded-lg transition-colors text-sm"
                      >
                        Claim Offer
                      </button>
                    </div>
                  ))}
              </div>

              {promotions.filter((p) => !p.claimed).length === 0 && (
                <div className="bg-white border border-gray-100 rounded-2xl p-8 text-center">
                  <Gift size={32} className="mx-auto text-gray-300 mb-3" />
                  <p className="text-muted font-medium">No active promotions</p>
                </div>
              )}
            </section>

            {/* Claimed Promotions */}
            {claimedPromotions.length > 0 && (
              <section>
                <h2 className="text-sm font-bold text-muted uppercase tracking-wide mb-4">
                  Ongoing Benefits
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {promotions
                    .filter((p) => p.claimed)
                    .map((promotion) => (
                      <div
                        key={promotion.id}
                        className={`bg-gradient-to-br ${getPromotionColor(
                          promotion.type
                        )} border border-gray-200 rounded-2xl p-5 space-y-4 opacity-75`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="p-2 bg-white rounded-lg">
                            {getPromotionIcon(promotion.type)}
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-bold bg-success/20 text-success px-2 py-1 rounded">
                              Active
                            </span>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <p className="font-bold text-dark">{promotion.title}</p>
                          <p className="text-xs text-muted leading-relaxed">
                            {promotion.description}
                          </p>
                        </div>

                        <div className="bg-white/60 rounded-lg p-3">
                          <p className="text-xs text-muted mb-1">Bonus</p>
                          <p className="text-lg font-bold text-dark">{promotion.bonus}</p>
                        </div>
                      </div>
                    ))}
                </div>
              </section>
            )}

            {/* How It Works */}
            <section className="bg-gradient-to-br from-primary/5 to-secondary/5 border border-primary/10 rounded-2xl p-6 space-y-4">
              <h3 className="font-bold text-dark text-sm uppercase tracking-wide">
                How to Earn More
              </h3>

              <div className="space-y-3">
                {[
                  {
                    num: '1',
                    title: 'Complete Deliveries',
                    desc: 'Each delivery earns you base pay plus bonuses',
                  },
                  {
                    num: '2',
                    title: 'Maintain Ratings',
                    desc: 'High ratings unlock premium bonuses',
                  },
                  {
                    num: '3',
                    title: 'Hit Milestones',
                    desc: 'Complete challenges for monthly rewards',
                  },
                  {
                    num: '4',
                    title: 'Work Peak Hours',
                    desc: 'Surge pricing during busy times means more earnings',
                  },
                ].map((item) => (
                  <div key={item.num} className="flex gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-white flex items-center justify-center">
                      <span className="text-xs font-bold text-primary">{item.num}</span>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-dark">{item.title}</p>
                      <p className="text-xs text-dark leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
};

export default Promotion;
