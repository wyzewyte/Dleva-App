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

  return (
    <BuyerCard className="p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Order #{order.id}</p>
          <h3 className="mt-1 truncate text-[1.05rem] font-semibold text-dark">
            {order.restaurant_name || order.restaurant?.name || 'Restaurant'}
          </h3>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted">
            <span>{itemCount} {itemCount === 1 ? 'item' : 'items'}</span>
            <span className="inline-flex items-center gap-1">
              <Clock3 size={12} />
              {orderDate}{orderTime ? `, ${orderTime}` : ''}
            </span>
          </div>
        </div>
        <BuyerStatusBadge status={order.status}>{statusInfo.label}</BuyerStatusBadge>
      </div>

      {Array.isArray(order.items) && order.items.length > 0 && (
        <div className="mt-4 rounded-[16px] border border-gray-100 bg-gray-50/80 px-4 py-3">
          <div className="space-y-1.5">
            {order.items.slice(0, compact ? 1 : 2).map((item, index) => (
              <p key={`${order.id}-item-${index}`} className="text-sm text-dark">
                {item.menu_item?.name || item.name || 'Item'} x{item.quantity || 1}
              </p>
            ))}
            {order.items.length > (compact ? 1 : 2) && (
              <p className="text-xs font-medium text-muted">
                +{order.items.length - (compact ? 1 : 2)} more item{order.items.length - (compact ? 1 : 2) === 1 ? '' : 's'}
              </p>
            )}
          </div>
        </div>
      )}

      <div className="mt-4 flex items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Total</p>
          <p className="mt-1 text-lg font-bold text-dark">{formatCurrency(order.total_price || order.total || 0)}</p>
        </div>

        <div className="flex min-w-[180px] flex-col gap-2 sm:min-w-[220px]">
          {primaryActionLabel && onPrimaryAction && (
            <BuyerPrimaryButton
              onClick={() => onPrimaryAction(order)}
              className="min-h-[44px] py-2.5"
              icon={actionIconMap[primaryActionLabel.toLowerCase()] || <Truck size={16} />}
            >
              {primaryActionLabel}
            </BuyerPrimaryButton>
          )}
          {secondaryActionLabel && onSecondaryAction && (
            <BuyerSecondaryButton
              onClick={() => onSecondaryAction(order)}
              className="min-h-[44px] py-2.5"
              icon={actionIconMap[secondaryActionLabel.toLowerCase()] || <Receipt size={16} />}
            >
              {secondaryActionLabel}
            </BuyerSecondaryButton>
          )}
        </div>
      </div>
    </BuyerCard>
  );
};

export default BuyerOrderCard;
