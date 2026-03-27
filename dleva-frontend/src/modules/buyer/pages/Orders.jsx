import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, ShoppingBag, Package, CheckCircle, LogIn } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../../../modules/auth/context/AuthContext';
import buyerOrders from '../../../services/buyerOrders';
import { formatCurrency } from '../../../utils/formatters';
import { logError } from '../../../utils/errorHandler';
import Cart from './Cart';


const EmptyOrdersIllustration = () => (
  <svg viewBox="0 0 200 160" className="w-48 h-48 mx-auto" fill="none">
    {/* Shadow */}
    <ellipse cx="100" cy="148" rx="55" ry="8" fill="#E8F5E9" />
    {/* Chair legs */}
    <line x1="72" y1="120" x2="65" y2="145" stroke="#388E3C" strokeWidth="4" strokeLinecap="round" />
    <line x1="95" y1="120" x2="92" y2="145" stroke="#388E3C" strokeWidth="4" strokeLinecap="round" />
    <line x1="118" y1="120" x2="125" y2="145" stroke="#388E3C" strokeWidth="4" strokeLinecap="round" />
    <line x1="108" y1="120" x2="110" y2="145" stroke="#388E3C" strokeWidth="4" strokeLinecap="round" />
    {/* Chair seat */}
    <rect x="68" y="108" width="65" height="16" rx="3" fill="#66BB6A" />
    {/* Chair back */}
    <rect x="68" y="72" width="45" height="40" rx="4" fill="#81C784" />
    <rect x="68" y="72" width="45" height="40" rx="4" fill="url(#chairGrad)" />
    {/* Chair armrest */}
    <rect x="110" y="88" width="18" height="8" rx="3" fill="#66BB6A" />
    <line x1="125" y1="96" x2="126" y2="120" stroke="#388E3C" strokeWidth="3.5" strokeLinecap="round" />
    {/* Plant pot */}
    <rect x="30" y="112" width="28" height="22" rx="3" fill="#B0BEC5" opacity="0.5" />
    <rect x="32" y="116" width="24" height="2" fill="#90A4AE" opacity="0.4" />
    <rect x="32" y="120" width="24" height="2" fill="#90A4AE" opacity="0.4" />
    <rect x="32" y="124" width="24" height="2" fill="#90A4AE" opacity="0.4" />
    {/* Leaves */}
    <path d="M44 112 Q30 90 38 75 Q50 88 44 112Z" fill="#A5D6A7" opacity="0.7" />
    <path d="M44 112 Q55 85 48 68 Q36 82 44 112Z" fill="#C8E6C9" opacity="0.7" />
    <path d="M44 112 Q22 95 28 80 Q42 90 44 112Z" fill="#81C784" opacity="0.5" />
    {/* Cloud shapes */}
    <ellipse cx="148" cy="68" rx="22" ry="14" fill="#CFD8DC" opacity="0.4" />
    <ellipse cx="165" cy="72" rx="16" ry="12" fill="#CFD8DC" opacity="0.3" />
    <ellipse cx="138" cy="74" rx="14" ry="10" fill="#ECEFF1" opacity="0.5" />
  </svg>
);

// ─── Order Card ─────────────────────────────────────────────────────────────

const OrderCard = ({ order, onAction, actionLabel, statusColor }) => (
  <div className="bg-surface rounded-2xl p-4 border border-gray-100 shadow-sm active:scale-[0.99] transition-transform">
    <div className="flex items-start justify-between mb-3">
      <div>
        <p className="text-xs text-muted font-semibold uppercase tracking-wide">
          Order #{order.id}
        </p>
        <p className="text-sm font-bold text-dark mt-0.5">
          {order.restaurant_name || 'Restaurant'}
        </p>
        <p className="text-xs text-muted mt-0.5">
          {order.items?.length || 0} {order.items?.length === 1 ? 'item' : 'items'}
        </p>
      </div>
      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${statusColor}`}>
        {order.status || 'Pending'}
      </span>
    </div>
    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
      <p className="text-base font-bold text-dark">
        {formatCurrency(order.total_price)}
      </p>
      <button
        onClick={() => onAction(order.id)}
        className="text-xs font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-lg hover:bg-primary/20 transition-colors"
      >
        {actionLabel}
      </button>
    </div>
  </div>
);

// ─── Guest Prompt ────────────────────────────────────────────────────────────

const GuestPrompt = ({ onLogin, onRegister }) => (
  <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
      <LogIn size={28} className="text-primary" />
    </div>
    <h3 className="text-lg font-bold text-dark mb-1">Login to view orders</h3>
    <p className="text-sm text-muted mb-8 max-w-xs">
      Login or create an account to track your ongoing and completed orders
    </p>
    <div className="w-full space-y-3 max-w-xs">
      <button
        onClick={onLogin}
        className="w-full bg-primary text-white py-3.5 rounded-2xl font-bold text-sm hover:opacity-90 transition-opacity"
      >
        Login
      </button>
      <button
        onClick={onRegister}
        className="w-full border-2 border-primary text-primary py-3.5 rounded-2xl font-bold text-sm hover:bg-primary/5 transition-colors"
      >
        Create Account
      </button>
    </div>
  </div>
);

// ─── Main Component ──────────────────────────────────────────────────────────

const Orders = () => {
  const navigate = useNavigate();
  const { cartItems } = useCart();
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState('cart');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  // Check auth state on mount
  useEffect(() => {
    setAuthChecked(true);
  }, []);

  useEffect(() => {
    if (activeTab === 'cart') return;
    if (!isAuthenticated) return;

    const fetchOrders = async () => {
      try {
        setLoading(true);
        const data = await buyerOrders.listOrders();
        const ordersList = Array.isArray(data) ? data : (data.results || []);
        setOrders(ordersList);
        setError(null);
      } catch (err) {
        logError(err, { context: 'Orders.fetchOrders' });
        setError(err.error || 'Failed to load orders');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [activeTab, isAuthenticated]);

  const ongoingOrders = orders.filter(
    o => o.status !== 'delivered' && o.status !== 'cancelled'
  );
  const completedOrders = orders.filter(o => o.status === 'delivered');

  const tabs = [
    { id: 'cart', label: 'My Cart', badge: cartItems.length },
    { id: 'ongoing', label: 'Ongoing' },
    { id: 'completed', label: 'Completed' },
  ];

  const renderContent = () => {
    // ── Cart ──
    if (activeTab === 'cart') return <Cart />;

    // ── Guest (Only show after auth is checked and user is NOT authenticated) ──
    if (!isAuthenticated && authChecked) {
      return (
        <GuestPrompt
          onLogin={() => navigate('/login')}
          onRegister={() => navigate('/register')}
        />
      );
    }

    // ── Loading (Auth check or orders loading) ──
    if (!authChecked || loading) {
      return (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <Loader2 className="animate-spin text-primary" size={32} />
          <p className="text-sm text-muted">Loading {!authChecked ? 'authentication' : 'orders'}...</p>
        </div>
      );
    }

    // ── Error ──
    if (error) {
      return (
        <div className="mx-1 mt-4 p-4 bg-red-50 text-red-600 rounded-2xl text-sm text-center">
          {error}
          <button
            onClick={() => setActiveTab(activeTab)} // re-trigger useEffect
            className="block mx-auto mt-2 text-xs font-bold underline"
          >
            Try again
          </button>
        </div>
      );
    }

    // ── Ongoing ──
    if (activeTab === 'ongoing') {
      if (ongoingOrders.length === 0) {
        return (
          <div className="flex flex-col items-center px-6 pt-8 pb-32">
            <EmptyOrdersIllustration />
            <p className="text-base text-muted mt-6 mb-10">
              We are waiting for your order
            </p>
            <button
              onClick={() => navigate('/restaurants')}
              className="w-full bg-primary text-white py-4 rounded-2xl font-bold text-sm hover:opacity-90 transition-opacity"
            >
              Order now
            </button>
          </div>
        );
      }

      return (
        <div className="space-y-3 pb-24 md:pb-6">
          {ongoingOrders.map(order => (
            <OrderCard
              key={order.id}
              order={order}
              onAction={(id) => navigate(`/tracking/${id}`)}
              actionLabel="Track Order"
              statusColor="bg-orange-50 text-orange-600"
            />
          ))}
        </div>
      );
    }

    // ── Completed ──
    if (activeTab === 'completed') {
      if (completedOrders.length === 0) {
        return (
          <div className="flex flex-col items-center px-6 pt-8 pb-32">
            <EmptyOrdersIllustration />
            <p className="text-base text-muted mt-6 mb-10">
              We are waiting for your first order
            </p>
            <button
              onClick={() => navigate('/restaurants')}
              className="w-full bg-primary text-white py-4 rounded-2xl font-bold text-sm hover:opacity-90 transition-opacity"
            >
              Order now
            </button>
          </div>
        );
      }

      return (
        <div className="space-y-3 pb-24 md:pb-6">
          {completedOrders.map(order => (
            <OrderCard
              key={order.id}
              order={order}
              onAction={(id) => navigate(`/tracking/${id}`)}
              actionLabel="View Details"
              statusColor="bg-green-50 text-green-600"
            />
          ))}
        </div>
      );
    }

    return null;
  };

  return (
    <div className="max-w-lg mx-auto">

      {/* Page Title */}
      <div className="flex items-center gap-3 mb-4 px-1">
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors md:hidden"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-2xl font-bold text-dark">Orders</h1>
      </div>

      {/* Pill Tab Switcher */}
      <div className="bg-gray-100 rounded-2xl p-1 flex gap-1 mb-5">
        {tabs.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                isActive
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-muted hover:text-dark'
              }`}
            >
              <span className="truncate">{tab.label}</span>
              {tab.badge !== undefined && tab.badge > 0 && (
                <span className={`text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold flex-shrink-0 ${
                  isActive ? 'bg-white text-dark' : 'bg-danger text-white'
                }`}>
                  {tab.badge > 9 ? '9+' : tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div>
        {renderContent()}
      </div>

    </div>
  );
};

export default Orders;