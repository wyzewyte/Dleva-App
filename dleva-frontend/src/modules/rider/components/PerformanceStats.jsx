/**
 * PerformanceStats Component
 * Displays rider performance metrics and achievements
 */

import { Star, TrendingUp, CheckCircle2, Clock, Percent } from 'lucide-react';

const PerformanceStats = ({ metrics, loading }) => {
  if (loading) {
    return <div className="text-center py-8 text-muted">Loading metrics...</div>;
  }

  if (!metrics) {
    return <div className="text-center py-8 text-muted">No metrics available</div>;
  }

  const stats = [
    {
      label: 'Average Rating',
      value: parseFloat(metrics.average_rating || 0).toFixed(1),
      unit: '/ 5.0',
      icon: Star,
      color: 'bg-yellow-500',
      lightBg: 'bg-yellow-50',
    },
    {
      label: 'Acceptance Rate',
      value: (parseFloat(metrics.acceptance_rate || 0) * 100).toFixed(1),
      unit: '%',
      icon: CheckCircle2,
      color: 'bg-success',
      lightBg: 'bg-green-50',
    },
    {
      label: 'On-Time Rate',
      value: (parseFloat(metrics.on_time_rate || 0) * 100).toFixed(1),
      unit: '%',
      icon: Clock,
      color: 'bg-blue-500',
      lightBg: 'bg-blue-50',
    },
    {
      label: 'Total Deliveries',
      value: metrics.total_deliveries || '0',
      unit: '',
      icon: TrendingUp,
      color: 'bg-purple-500',
      lightBg: 'bg-purple-50',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => (
          <div
            key={idx}
            className={`${stat.lightBg} border border-gray-100 rounded-2xl p-5 space-y-3`}
          >
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted font-bold uppercase tracking-wide">
                {stat.label}
              </p>
              <div className={`${stat.color} p-2.5 rounded-lg`}>
                <stat.icon size={16} className="text-white" />
              </div>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold text-dark">{stat.value}</span>
              {stat.unit && <span className="text-sm text-muted font-bold">{stat.unit}</span>}
            </div>
          </div>
        ))}
      </div>

      {/* Performance Badges */}
      {metrics.badges && metrics.badges.length > 0 && (
        <div className="bg-gradient-to-r from-primary/5 to-success/5 rounded-2xl border border-primary/10 p-6 space-y-3">
          <h3 className="font-bold text-dark text-sm uppercase tracking-wide">Achievements</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {metrics.badges.map((badge, idx) => (
              <div key={idx} className="bg-white rounded-lg p-3 flex items-center gap-3">
                <div className="text-2xl">{badge.icon || '🏆'}</div>
                <div>
                  <p className="text-sm font-bold text-dark">{badge.name}</p>
                  <p className="text-xs text-muted">{badge.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Performance Summary */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6 space-y-4">
        <h3 className="font-bold text-dark text-sm uppercase tracking-wide">Performance Summary</h3>
        
        <div className="space-y-3">
          {/* Rating Breakdown */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted font-bold">Customer Ratings</p>
              <span className="text-primary font-bold">
                {parseFloat(metrics.average_rating || 0).toFixed(1)} / 5.0
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-primary rounded-full h-2 transition-all"
                style={{
                  width: `${((parseFloat(metrics.average_rating) || 0) / 5) * 100}%`,
                }}
              />
            </div>
          </div>

          {/* Acceptance Rate */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted font-bold">Acceptance Rate</p>
              <span className="text-success font-bold">
                {(parseFloat(metrics.acceptance_rate || 0) * 100).toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-success rounded-full h-2 transition-all"
                style={{
                  width: `${Math.min(parseFloat(metrics.acceptance_rate || 0) * 100, 100)}%`,
                }}
              />
            </div>
          </div>

          {/* On-Time Rate */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted font-bold">On-Time Delivery</p>
              <span className="text-blue-600 font-bold">
                {(parseFloat(metrics.on_time_rate || 0) * 100).toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-500 rounded-full h-2 transition-all"
                style={{
                  width: `${Math.min(parseFloat(metrics.on_time_rate || 0) * 100, 100)}%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerformanceStats;
