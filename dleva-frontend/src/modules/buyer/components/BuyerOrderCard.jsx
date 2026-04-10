import { Clock3, Receipt, RotateCcw, Star, Truck } from 'lucide-react';
import { formatCurrency } from '../../../utils/formatters';
import { getStatusLabel } from '../../../constants/statusLabels';
import {
  BuyerCard,
  BuyerPrimaryButton,
  BuyerSecondaryButton,
  BuyerStatusBadge,
} from './ui/BuyerPrimitives';

const actionIconMap = {
  'track order': <Truck size={16} />,
  reorder: <RotateCcw size={16} />,
  'view details': <Receipt size={16} />,
  'rate order': <Star size={16} />,
};

const BuyerOrderCard = ({
  order,
  onPrimaryAction,
  primaryActionLabel,
  onSecondaryAction,
  secondaryActionLabel,
  compact = false,
}) => {
  const statusInfo = getStatusLabel(order.status);
  const itemCount = order.items?.length || 0;
  const createdAt = order.created_at ? new Date(order.created_at) : null;
  const orderDate = createdAt
    ? createdAt.toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })
    : 'Recent order';
  const orderTime = createdAt
    ? createdAt.toLocaleTimeString('en-NG', { hour: 'numeric', minute: '2-digit' })
    : null;

  // Get first item name(s) and restaurant
  const firstItems = (order.items || []).slice(0, 1).map(item => item.menu_item?.name || item.name || 'Item').join(', ');
  const restaurantName = order.restaurant_name || order.restaurant?.name || 'Restaurant';
  const itemAndRestaurant = firstItems && restaurantName ? `${firstItems} from ${restaurantName}` : restaurantName;
  
  // Truncate with ellipsis if too long (around 50 chars)
  const displayText = itemAndRestaurant.length > 50 ? itemAndRestaurant.substring(0, 47) + '...' : itemAndRestaurant;

  return (
    <BuyerCard className="p-4 sm:p-5">
{/* Row 1: Order ID only */}
      <div className="flex items-start mb-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">Order #{order.id}</p>
      </div>

      {/* Row 2: Item + Date/Time/Count (left) | Price & Status (right) */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-dark line-clamp-2 break-words mb-1">
            {displayText}
          </h3>
          <div className="flex items-center gap-2 text-xs text-muted flex-wrap">
            <Clock3 size={12} />
            <span>{orderDate}{orderTime ? `, ${orderTime}` : ''}</span>
            <span className="text-gray-300">•</span>
            <span>{itemCount} {itemCount === 1 ? 'item' : 'items'}</span>
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="text-sm font-bold text-dark">{formatCurrency(order.total_price || order.total || 0)}</p>
          <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-md mt-1 ${statusInfo.bgColor} ${statusInfo.color}`}>
            {statusInfo.label}
          </span>
        </div>
      </div>

      {/* Action Buttons - Same Row, Space Between */}
      <div className="flex gap-2 justify-between">
        {primaryActionLabel && onPrimaryAction && (
          <BuyerPrimaryButton
            onClick={() => onPrimaryAction(order)}
            className="flex-1 !min-h-fit px-4 py-2.5 text-xs"
            icon={actionIconMap[primaryActionLabel.toLowerCase()] || <Truck size={12} />}
          >
            {primaryActionLabel}
          </BuyerPrimaryButton>
        )}
        {secondaryActionLabel && onSecondaryAction && (
          <BuyerSecondaryButton
            onClick={() => onSecondaryAction(order)}
            className="flex-1 !min-h-fit px-3 py-1.5 text-xs"
            icon={actionIconMap[secondaryActionLabel.toLowerCase()] || <Receipt size={12} />}
          >
            {secondaryActionLabel}
          </BuyerSecondaryButton>
        )}
      </div>
    </BuyerCard>
  );
};

export default BuyerOrderCard;
