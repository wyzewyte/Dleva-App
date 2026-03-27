import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { 
  ArrowLeft, Loader2, MapPin, Phone, Clock, AlertCircle, CheckCircle, 
  Package, ChefHat, Truck, Gift, RotateCw, MapPinCheck, Zap
} from 'lucide-react';
import buyerCheckout from '../../../services/buyerCheckout';
import { useTracking } from '../../../context/TrackingContext';
import { getStatusLabel } from '../../../constants/statusLabels';
import { getMessage } from '../../../constants/messages';
import { formatCurrency } from '../../../utils/formatters';
import { logError } from '../../../utils/errorHandler';
import liveLocationService from '../../../services/liveLocationService';

const Tracking = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { subscribeToOrder, getOrderData } = useTracking();
  
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [unsubscribe, setUnsubscribe] = useState(null);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true);
        const data = await buyerCheckout.getOrderDetails(orderId);
        setOrder(data);
        setError(null);

        if (data && data.status !== 'delivered' && data.status !== 'cancelled') {
          const unsubFunc = subscribeToOrder(orderId, data);
          setUnsubscribe(() => unsubFunc);
        }
      } catch (err) {
        logError(err, { context: 'Tracking.fetchOrder' });
        setError(err.error || 'Failed to load order details');
      } finally {
        setLoading(false);
      }
    };

    if (orderId) {
      fetchOrder();
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
      if (order?.status !== 'delivered' && order?.status !== 'cancelled') {
        liveLocationService.stopTracking();
      }
    };
  }, [orderId, subscribeToOrder]);

  useEffect(() => {
    if (!orderId) return;

    const pollInterval = setInterval(() => {
      const liveData = getOrderData(orderId);
      if (liveData) {
        setOrder(prev => ({
          ...prev,
          ...liveData.order,
          rider_location: liveData.riderLocation,
          eta_seconds: liveData.etaSeconds,
          is_tracking_live: liveData.isLive,
        }));
      }
    }, 500);

    return () => clearInterval(pollInterval);
  }, [orderId, getOrderData]);

  useEffect(() => {
    if (!order || !orderId) return;

    const isDeliveryActive = ['assigned', 'arrived_at_pickup', 'picked_up'].includes(order.status);

    if (isDeliveryActive && !liveLocationService.isActive()) {
      liveLocationService
        .startTracking(orderId, order.status)
        .catch(err => {
          console.error('Failed to start GPS tracking:', err);
          logError(err, { context: 'Tracking.startGps' });
        });
    } else if (!isDeliveryActive && liveLocationService.isActive()) {
      liveLocationService.stopTracking();
    } else if (isDeliveryActive && liveLocationService.getStatus() === 'tracking') {
      liveLocationService.updateTrackingFrequency(order.status);
    }

    return () => {
      if (liveLocationService.isActive()) {
        liveLocationService.stopTracking();
      }
    };
  }, [order?.status, order?.id, orderId]);

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      const data = await buyerCheckout.getOrderDetails(orderId);
      setOrder(data);
    } catch (err) {
      logError(err, { context: 'Tracking.handleRefresh' });
      setError('Failed to refresh order');
    } finally {
      setRefreshing(false);
    }
  };

  const formatETA = (seconds) => {
    if (!seconds) return '...';
    const mins = Math.ceil(seconds / 60);
    return `~${mins} min${mins !== 1 ? 's' : ''}`;
  };

  if (loading) {
    return (
      <div style={styles.loadingScreen}>
        <div style={styles.loadingInner}>
          <div style={styles.loadingSpinnerWrap}>
            <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: '#1a5e3a' }} />
          </div>
          <p style={styles.loadingText}>Loading your order...</p>
          <p style={styles.loadingSubtext}>Just a moment</p>
        </div>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div style={styles.errorScreen}>
        <div style={styles.errorIconWrap}>
          <AlertCircle size={36} color="#dc2626" />
        </div>
        <p style={styles.errorTitle}>{error || 'Order not found'}</p>
        <p style={styles.errorSubtext}>We couldn't load this order. Please try again.</p>
        <button onClick={() => navigate(-1)} style={styles.errorBtn}>
          Go Back
        </button>
      </div>
    );
  }

  const status = getStatusLabel(order.status) || getStatusLabel('pending');

  const getStatusConfig = (s) => {
    const configs = {
      delivered:        { icon: Gift,         bg: '#f0fdf4', accent: '#1a5e3a', pill: '#dcfce7', pillText: '#166534', emoji: '🎉' },
      cancelled:        { icon: AlertCircle,   bg: '#fef2f2', accent: '#dc2626', pill: '#fee2e2', pillText: '#991b1b', emoji: '❌' },
      pending:          { icon: Package,       bg: '#f0fdf4', accent: '#1a5e3a', pill: '#dcfce7', pillText: '#166534', emoji: '📦' },
      preparing:        { icon: ChefHat,       bg: '#fff7ed', accent: '#ea580c', pill: '#ffedd5', pillText: '#9a3412', emoji: '👨‍🍳' },
      ready_for_pickup: { icon: CheckCircle,   bg: '#f0fdf4', accent: '#16a34a', pill: '#dcfce7', pillText: '#166534', emoji: '✅' },
      assigned:         { icon: Truck,         bg: '#eff6ff', accent: '#2563eb', pill: '#dbeafe', pillText: '#1d4ed8', emoji: '🛵' },
      arrived_at_pickup:{ icon: Truck,         bg: '#eff6ff', accent: '#2563eb', pill: '#dbeafe', pillText: '#1d4ed8', emoji: '📍' },
      picked_up:        { icon: Truck,         bg: '#eff6ff', accent: '#2563eb', pill: '#dbeafe', pillText: '#1d4ed8', emoji: '🚀' },
      on_the_way:       { icon: Truck,         bg: '#eff6ff', accent: '#2563eb', pill: '#dbeafe', pillText: '#1d4ed8', emoji: '🛵' },
    };
    return configs[s] || configs.pending;
  };

  const cfg = getStatusConfig(order.status);
  const StatusIcon = cfg.icon;

  const progressSteps = [
    { key: 'pending',          label: 'Order Placed',     icon: Package,      step: 1 },
    { key: 'preparing',        label: 'Preparing',        icon: ChefHat,      step: 2 },
    { key: 'ready_for_pickup', label: 'Ready for Pickup', icon: CheckCircle,  step: 3 },
    { key: 'picked_up',        label: 'On the Way',       icon: Truck,        step: 4 },
    { key: 'delivered',        label: 'Delivered',        icon: Gift,         step: 5 },
  ];

  return (
    <div style={styles.root}>
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes liveRing { 0% { box-shadow: 0 0 0 0 rgba(34,197,94,0.5); } 100% { box-shadow: 0 0 0 10px rgba(34,197,94,0); } }
        .track-card { animation: slideUp 0.35s ease both; }
        .track-card:nth-child(1) { animation-delay: 0.05s; }
        .track-card:nth-child(2) { animation-delay: 0.1s; }
        .track-card:nth-child(3) { animation-delay: 0.15s; }
        .track-card:nth-child(4) { animation-delay: 0.2s; }
        .track-card:nth-child(5) { animation-delay: 0.25s; }
        .track-card:nth-child(6) { animation-delay: 0.3s; }
        .refresh-btn:active { transform: scale(0.92); }
        .cancel-btn:active { transform: scale(0.97); }
        .call-btn:hover { background: #f0fdf4; }
      `}</style>

      {/* ── Header ── */}
      <div style={styles.header}>
        <div style={styles.headerInner}>
          <button onClick={() => navigate(-1)} style={styles.iconBtn}>
            <ArrowLeft size={22} color="#111827" />
          </button>
          <div style={styles.headerCenter}>
            <span style={styles.headerTitle}>Track Order</span>
            <span style={styles.headerOrderId}>#{order.id}</span>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            style={{ ...styles.iconBtn, opacity: refreshing ? 0.5 : 1 }}
            className="refresh-btn"
          >
            <RotateCw
              size={19}
              color="#1a5e3a"
              style={refreshing ? { animation: 'spin 0.8s linear infinite' } : {}}
            />
          </button>
        </div>
      </div>

      <div style={styles.scrollArea}>

        {/* ── Status Hero Card ── */}
        <div style={{ ...styles.heroCard, background: cfg.bg }} className="track-card">
          <div style={{ ...styles.heroIconRing, background: cfg.accent + '18', border: `2px solid ${cfg.accent}22` }}>
            <StatusIcon size={30} color={cfg.accent} />
          </div>
          <div style={styles.heroContent}>
            <span style={{ ...styles.statusPill, background: cfg.pill, color: cfg.pillText }}>
              {cfg.emoji} {status.label}
            </span>
            <p style={styles.heroOrderId}>Order #{order.id}</p>
          </div>
          {order.is_tracking_live && (
            <div style={styles.liveBadge}>
              <span style={styles.liveDot} />
              <span style={styles.liveText}>LIVE</span>
            </div>
          )}
        </div>

        {/* ── ETA Card ── */}
        {order.status !== 'delivered' && order.status !== 'cancelled' && (
          <div
            style={{
              ...styles.card,
              background: order.is_tracking_live
                ? 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)'
                : 'linear-gradient(135deg, #f8faff 0%, #eff6ff 100%)',
              border: order.is_tracking_live ? '1.5px solid #86efac' : '1.5px solid #bfdbfe',
            }}
            className="track-card"
          >
            <div style={styles.etaRow}>
              <div style={{
                ...styles.etaIconBox,
                background: order.is_tracking_live ? '#dcfce7' : '#dbeafe',
              }}>
                <Clock size={22} color={order.is_tracking_live ? '#16a34a' : '#2563eb'} />
              </div>
              <div>
                <p style={{
                  ...styles.etaLabel,
                  color: order.is_tracking_live ? '#16a34a' : '#2563eb',
                }}>
                  {order.is_tracking_live ? 'Live ETA' : 'Estimated Delivery'}
                </p>
                <p style={{
                  ...styles.etaValue,
                  color: order.is_tracking_live ? '#166534' : '#1d4ed8',
                }}>
                  {formatETA(order.eta_seconds || order.estimated_time)}
                </p>
              </div>
              {order.is_tracking_live && (
                <div style={styles.updatingBadge}>
                  <span style={styles.updatingDot} />
                  <span style={styles.updatingLabel}>Updating</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Rider Location Card ── */}
        {order.status === 'picked_up' && order.rider_location && (
          <div style={styles.card} className="track-card">
            <div style={styles.cardHeader}>
              <div style={styles.cardHeaderLeft}>
                <div style={styles.cardIconSmall}>
                  <MapPin size={16} color="#1a5e3a" />
                </div>
                <span style={styles.cardTitle}>Rider Location</span>
              </div>
              {order.is_tracking_live && (
                <span style={styles.liveChip}>
                  <Zap size={11} />
                  LIVE
                </span>
              )}
            </div>
            <div style={styles.coordGrid}>
              {[
                { label: 'Latitude',  value: order.rider_location.latitude.toFixed(6) },
                { label: 'Longitude', value: order.rider_location.longitude.toFixed(6) },
                ...(order.rider_location.accuracy
                  ? [{ label: 'Accuracy', value: `±${order.rider_location.accuracy.toFixed(1)}m`, full: true }]
                  : []),
              ].map((c) => (
                <div key={c.label} style={{ ...styles.coordCell, gridColumn: c.full ? '1 / -1' : undefined }}>
                  <p style={styles.coordLabel}>{c.label}</p>
                  <p style={styles.coordValue}>{c.value}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Confirmation Code ── */}
        {order.confirmation_code && ['picked_up', 'on_the_way', 'delivery_attempted'].includes(order.status) && (
          <div style={styles.card} className="track-card">
            <div style={styles.cardHeader}>
              <div style={styles.cardHeaderLeft}>
                <div style={styles.cardIconSmall}>
                  <MapPinCheck size={16} color="#1a5e3a" />
                </div>
                <span style={styles.cardTitle}>Delivery Code</span>
              </div>
            </div>
            <p style={styles.codeHint}>Share this code with your delivery rider on arrival</p>
            <div style={styles.codeBox}>
              <p style={styles.codeText}>{order.confirmation_code}</p>
            </div>
            <p style={styles.codeFooter}>This protects your order from fraud</p>
          </div>
        )}

        {/* ── Progress Steps ── */}
        <div style={styles.card} className="track-card">
          <span style={styles.cardTitle}>Delivery Progress</span>
          <div style={{ marginTop: 20 }}>
            {progressSteps.map((item, idx) => {
              const isActive  = status.step >= item.step;
              const isLast    = idx === progressSteps.length - 1;
              const Icon      = item.icon;
              const isCurrent = status.step === item.step;
              return (
                <div key={item.step} style={styles.stepRow}>
                  {/* Left: icon + connector */}
                  <div style={styles.stepLeft}>
                    <div style={{
                      ...styles.stepCircle,
                      background: isActive ? '#1a5e3a' : '#f3f4f6',
                      border: isCurrent ? '2.5px solid #4ade80' : isActive ? '2.5px solid #1a5e3a' : '2px solid #e5e7eb',
                      boxShadow: isCurrent ? '0 0 0 4px rgba(74,222,128,0.2)' : 'none',
                    }}>
                      <Icon size={16} color={isActive ? '#fff' : '#9ca3af'} />
                    </div>
                    {!isLast && (
                      <div style={{
                        ...styles.stepConnector,
                        background: status.step > item.step ? '#1a5e3a' : '#e5e7eb',
                      }} />
                    )}
                  </div>
                  {/* Right: label */}
                  <div style={styles.stepRight}>
                    <p style={{
                      ...styles.stepLabel,
                      color: isActive ? '#111827' : '#9ca3af',
                      fontWeight: isCurrent ? 700 : isActive ? 600 : 400,
                    }}>
                      {item.label}
                    </p>
                    {/* Show 'In progress' only for non-final step */}
                    {isCurrent && !isLast && (
                      <p style={styles.stepCurrentTag}>In progress</p>
                    )}
                    {/* For the last step, show 'Done' if active */}
                    {isLast && isActive && (
                      <p style={styles.stepDoneTag}>Done</p>
                    )}
                    {/* For other steps, show 'Done' if active and not current */}
                    {!isLast && isActive && !isCurrent && (
                      <p style={styles.stepDoneTag}>Done</p>
                    )}
                  </div>
                  {isActive && (
                    <CheckCircle size={18} color={isCurrent ? '#4ade80' : '#1a5e3a'} style={{ flexShrink: 0, marginBottom: isLast ? 0 : 28 }} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Restaurant Card ── */}
        {order.restaurant && (
          <div style={styles.card} className="track-card">
            <span style={styles.cardTitle}>Restaurant</span>
            <div style={styles.restaurantRow}>
              <img
                src={order.restaurant_obj.image || 'https://via.placeholder.com/72'}
                alt={order.restaurant.name}
                style={styles.restaurantImg}
              />
              <div style={styles.restaurantInfo}>
                <p style={styles.restaurantName}>{order.restaurant.name}</p>
                <p style={styles.restaurantAddr}>{order.restaurant.address}</p>
                <button className="call-btn" style={styles.callBtn}>
                  <Phone size={14} color="#1a5e3a" />
                  Call Restaurant
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Order Items ── */}
        <div style={styles.card} className="track-card">
          <span style={styles.cardTitle}>Order Summary</span>
          <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {order.items?.map((item) => (
              <div key={item.id} style={styles.itemRow}>
                <div style={styles.itemQtyBadge}>
                  <span style={styles.itemQtyText}>{item.quantity}×</span>
                </div>
                <p style={styles.itemName}>{item.menu_item?.name}</p>
                <p style={styles.itemPrice}>{formatCurrency(item.price * item.quantity)}</p>
              </div>
            ))}
          </div>
          <div style={styles.divider} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { label: 'Subtotal',     value: formatCurrency(order.subtotal) },
              { label: 'Delivery Fee', value: `₦${order.delivery_fee?.toLocaleString()}` },
            ].map(r => (
              <div key={r.label} style={styles.summaryRow}>
                <span style={styles.summaryLabel}>{r.label}</span>
                <span style={styles.summaryValue}>{r.value}</span>
              </div>
            ))}
            <div style={styles.totalRow}>
              <span style={styles.totalLabel}>Total</span>
              <span style={styles.totalValue}>₦{order.total_price?.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* ── Cancel Button ── */}
        {(order.status === 'pending' || order.status === 'preparing') && (
          <button className="cancel-btn" style={styles.cancelBtn}>
            Cancel Order
          </button>
        )}

        <div style={{ height: 24 }} />
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────
   Styles — all inline, zero external deps
───────────────────────────────────────── */
const styles = {
  root: {
    minHeight: '100vh',
    background: '#f6f7f9',
    display: 'flex',
    flexDirection: 'column',
    fontFamily: "'DM Sans', 'Helvetica Neue', Arial, sans-serif",
  },

  /* Loading */
  loadingScreen: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    height: '100vh', background: '#f6f7f9',
  },
  loadingInner: { textAlign: 'center' },
  loadingSpinnerWrap: {
    width: 64, height: 64, borderRadius: 20, background: '#f0fdf4',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    margin: '0 auto 16px', boxShadow: '0 4px 16px rgba(26,94,58,0.12)',
  },
  loadingText: { fontSize: 16, fontWeight: 700, color: '#111827', margin: '0 0 4px' },
  loadingSubtext: { fontSize: 13, color: '#6b7280', margin: 0 },

  /* Error */
  errorScreen: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', height: '100vh', background: '#f6f7f9', padding: '0 24px',
  },
  errorIconWrap: {
    width: 72, height: 72, borderRadius: 24, background: '#fef2f2',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    marginBottom: 16, boxShadow: '0 4px 16px rgba(220,38,38,0.1)',
  },
  errorTitle: { fontSize: 17, fontWeight: 700, color: '#dc2626', textAlign: 'center', margin: '0 0 6px' },
  errorSubtext: { fontSize: 13, color: '#6b7280', textAlign: 'center', margin: '0 0 24px' },
  errorBtn: {
    padding: '13px 32px', background: '#1a5e3a', color: '#fff',
    border: 'none', borderRadius: 14, fontSize: 15, fontWeight: 700, cursor: 'pointer',
  },

  /* Header */
  header: {
    position: 'sticky', top: 0, zIndex: 50,
    background: 'rgba(255,255,255,0.96)',
    backdropFilter: 'blur(12px)',
    borderBottom: '1px solid #f0f0f0',
  },
  headerInner: {
    maxWidth: 600, margin: '0 auto',
    padding: '12px 16px',
    display: 'flex', alignItems: 'center', gap: 12,
  },
  iconBtn: {
    width: 40, height: 40, borderRadius: 12,
    background: '#f9fafb', border: '1px solid #e5e7eb',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', flexShrink: 0, transition: 'transform 0.15s',
  },
  headerCenter: {
    flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
  },
  headerTitle: { fontSize: 16, fontWeight: 800, color: '#111827', letterSpacing: '-0.3px' },
  headerOrderId: { fontSize: 11, color: '#9ca3af', fontWeight: 500, marginTop: 1 },

  /* Scroll area */
  scrollArea: {
    flex: 1, maxWidth: 600, margin: '0 auto', width: '100%',
    padding: '16px 16px 0',
    display: 'flex', flexDirection: 'column', gap: 12,
  },

  /* Hero card */
  heroCard: {
    borderRadius: 20, padding: '20px 18px',
    display: 'flex', alignItems: 'center', gap: 14,
    border: '1px solid rgba(0,0,0,0.06)',
    boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
    position: 'relative', overflow: 'hidden',
  },
  heroIconRing: {
    width: 56, height: 56, borderRadius: 18, flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  heroContent: { flex: 1 },
  statusPill: {
    display: 'inline-flex', alignItems: 'center', gap: 5,
    padding: '5px 12px', borderRadius: 100,
    fontSize: 13, fontWeight: 700, letterSpacing: '-0.2px',
  },
  heroOrderId: { fontSize: 12, color: '#6b7280', margin: '6px 0 0', fontWeight: 500 },
  liveBadge: {
    display: 'flex', alignItems: 'center', gap: 5,
    background: '#dcfce7', borderRadius: 100, padding: '5px 10px',
    flexShrink: 0,
  },
  liveDot: {
    width: 7, height: 7, borderRadius: '50%', background: '#22c55e',
    display: 'block', animation: 'pulse 1.5s ease-in-out infinite',
  },
  liveText: { fontSize: 11, fontWeight: 800, color: '#166534', letterSpacing: '0.5px' },

  /* Generic card */
  card: {
    background: '#fff', borderRadius: 20,
    padding: '18px 16px',
    border: '1px solid #f0f0f0',
    boxShadow: '0 1px 6px rgba(0,0,0,0.04)',
  },
  cardHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  cardHeaderLeft: { display: 'flex', alignItems: 'center', gap: 8 },
  cardIconSmall: {
    width: 30, height: 30, borderRadius: 9, background: '#f0fdf4',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  cardTitle: { fontSize: 15, fontWeight: 800, color: '#111827', letterSpacing: '-0.2px' },
  liveChip: {
    display: 'flex', alignItems: 'center', gap: 4,
    background: '#1a5e3a', color: '#fff',
    padding: '4px 10px', borderRadius: 100,
    fontSize: 11, fontWeight: 700,
  },

  /* ETA */
  etaRow: { display: 'flex', alignItems: 'center', gap: 14 },
  etaIconBox: {
    width: 48, height: 48, borderRadius: 14, flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  etaLabel: { fontSize: 12, fontWeight: 600, margin: '0 0 2px' },
  etaValue: { fontSize: 28, fontWeight: 800, margin: 0, letterSpacing: '-1px' },
  updatingBadge: {
    marginLeft: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
  },
  updatingDot: {
    width: 9, height: 9, borderRadius: '50%', background: '#22c55e',
    animation: 'liveRing 1.2s ease-out infinite',
  },
  updatingLabel: { fontSize: 10, fontWeight: 700, color: '#16a34a', letterSpacing: '0.3px' },

  /* Coord grid */
  coordGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 4 },
  coordCell: { background: '#f8faff', borderRadius: 12, padding: '10px 12px' },
  coordLabel: { fontSize: 11, color: '#6b7280', fontWeight: 600, margin: '0 0 3px', textTransform: 'uppercase', letterSpacing: '0.4px' },
  coordValue: { fontSize: 13, fontFamily: 'monospace', fontWeight: 700, color: '#1e3a5f', margin: 0 },

  /* Code */
  codeHint: { fontSize: 13, color: '#6b7280', margin: '0 0 14px' },
  codeBox: {
    background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
    border: '2px dashed #86efac', borderRadius: 16,
    padding: '20px 16px', textAlign: 'center',
  },
  codeText: { fontSize: 38, fontWeight: 900, color: '#1a5e3a', letterSpacing: '10px', margin: 0 },
  codeFooter: { fontSize: 11, color: '#9ca3af', textAlign: 'center', marginTop: 10, marginBottom: 0 },

  /* Progress steps */
  stepRow: {
    display: 'flex', alignItems: 'flex-start', gap: 12, position: 'relative',
  },
  stepLeft: { display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 },
  stepCircle: {
    width: 40, height: 40, borderRadius: 13,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'all 0.2s',
  },
  stepConnector: { width: 2, flexGrow: 1, minHeight: 20, borderRadius: 2, margin: '3px 0' },
  stepRight: { flex: 1, paddingBottom: 20, paddingTop: 8 },
  stepLabel: { fontSize: 14, margin: '0 0 2px', transition: 'color 0.2s' },
  stepCurrentTag: { fontSize: 11, color: '#1a5e3a', fontWeight: 600, margin: 0 },
  stepDoneTag: { fontSize: 11, color: '#9ca3af', fontWeight: 500, margin: 0 },

  /* Restaurant */
  restaurantRow: { display: 'flex', gap: 14, marginTop: 14, alignItems: 'flex-start' },
  restaurantImg: { width: 68, height: 68, borderRadius: 16, objectFit: 'cover', flexShrink: 0 },
  restaurantInfo: { flex: 1 },
  restaurantName: { fontSize: 15, fontWeight: 800, color: '#111827', margin: '0 0 3px' },
  restaurantAddr: { fontSize: 12, color: '#6b7280', margin: '0 0 10px', lineHeight: 1.4 },
  callBtn: {
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '7px 14px', borderRadius: 10, background: '#f0fdf4',
    border: '1.5px solid #bbf7d0', color: '#1a5e3a',
    fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'background 0.15s',
  },

  /* Order items */
  itemRow: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '10px 12px', background: '#f9fafb', borderRadius: 12,
  },
  itemQtyBadge: {
    width: 28, height: 28, borderRadius: 8, background: '#1a5e3a',
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  itemQtyText: { fontSize: 12, fontWeight: 800, color: '#fff' },
  itemName: { flex: 1, fontSize: 13, fontWeight: 600, color: '#111827', margin: 0 },
  itemPrice: { fontSize: 13, fontWeight: 700, color: '#111827', margin: 0, flexShrink: 0 },

  /* Summary */
  divider: { height: 1, background: '#f0f0f0', margin: '14px 0' },
  summaryRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  summaryLabel: { fontSize: 13, color: '#6b7280' },
  summaryValue: { fontSize: 13, fontWeight: 600, color: '#374151' },
  totalRow: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: 10, marginTop: 4, borderTop: '1.5px solid #f0f0f0',
  },
  totalLabel: { fontSize: 16, fontWeight: 800, color: '#111827' },
  totalValue: { fontSize: 18, fontWeight: 900, color: '#1a5e3a', letterSpacing: '-0.5px' },

  /* Cancel */
  cancelBtn: {
    width: '100%', padding: '15px', border: '2px solid #ef4444',
    background: '#fff', color: '#ef4444', borderRadius: 16,
    fontSize: 15, fontWeight: 800, cursor: 'pointer',
    transition: 'all 0.15s', letterSpacing: '-0.2px',
  },
};

export default Tracking;