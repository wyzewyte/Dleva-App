/**
 * EarningsSummary Component
 * Displays earnings overview with multiple time periods
 */

import { TrendingUp, Calendar, Clock, Zap } from 'lucide-react';
import { formatCurrency } from '../../../utils/formatters';

const EarningsSummary = ({ 
  today, 
  weekly, 
  monthly, 
  allTime, 
  loading 
}) => {
  const summaryCards = [
    {
      label: 'Today',
      value: today,
      icon: Zap,
      color: 'bg-yellow-500',
      lightBg: 'bg-yellow-50',
    },
    {
      label: 'This Week',
      value: weekly,
      icon: Calendar,
      color: 'bg-blue-500',
      lightBg: 'bg-blue-50',
    },
    {
      label: 'This Month',
      value: monthly,
      icon: Clock,
      color: 'bg-purple-500',
      lightBg: 'bg-purple-50',
    },
    {
      label: 'All-Time',
      value: allTime,
      icon: TrendingUp,
      color: 'bg-success',
      lightBg: 'bg-green-50',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {summaryCards.map((card, idx) => (
        <div
          key={idx}
          className={`${card.lightBg} border border-gray-100 rounded-2xl p-5 space-y-3`}
        >
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted font-bold uppercase tracking-wide">
              {card.label}
            </p>
            <div className={`${card.color} p-2.5 rounded-lg`}>
              <card.icon size={16} className="text-white" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-dark">
            {loading ? '...' : formatCurrency(card.value || 0)}
          </h3>
        </div>
      ))}
    </div>
  );
};

export default EarningsSummary;
