import { Loader2, Menu, Power, Settings, ShoppingBag, Store, ToggleLeft, ToggleRight, UtensilsCrossed, Wallet, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import sellerAuth from '../../../services/sellerAuth';
import sellerStore from '../../../services/sellerStore';
import { cn } from '../../../utils/cn';
import logo from '../../../assets/images/logo.svg';
import SellerNotificationButton from './SellerNotificationButton';

const PRIMARY_ITEMS = [
  { label: 'Dashboard', path: '/seller/dashboard', icon: Store },
  { label: 'Orders', path: '/seller/orders', icon: ShoppingBag },
  { label: 'Menu', path: '/seller/menu', icon: UtensilsCrossed },
  { label: 'Wallet', path: '/seller/history', icon: Wallet },
  { label: 'Settings', path: '/seller/settings', icon: Settings },
];

const navLinkClass = ({ isActive }) =>
  cn(
    'inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition-colors',
    isActive ? 'bg-dark text-white' : 'text-muted hover:bg-gray-100 hover:text-dark'
  );

const mobileLinkClass = ({ isActive }) =>
  cn(
    'flex min-w-0 flex-1 flex-col items-center gap-1 rounded-xl px-1 py-2 text-[11px] font-semibold transition-colors',
    isActive ? 'text-primary' : 'text-gray-400'
  );

const StoreToggleButton = ({ isActive, loading, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={loading}
    className={cn(
      'inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white px-2.5 transition-colors disabled:cursor-not-allowed disabled:opacity-60',
      isActive ? 'text-emerald-700 hover:bg-emerald-50' : 'text-red-600 hover:bg-red-50'
    )}
    aria-label={isActive ? 'Close store' : 'Open store'}
    title={isActive ? 'Store open. Tap to close.' : 'Store closed. Tap to open.'}
  >
    {loading ? <Loader2 size={18} className="animate-spin" /> : isActive ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
    <span className="text-xs font-bold">{isActive ? 'Open' : 'Closed'}</span>
  </button>
);

const SellerAppChrome = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [storeStatus, setStoreStatus] = useState({ is_active: false, name: 'Seller workspace' });
  const [isTogglingStore, setIsTogglingStore] = useState(false);

  useEffect(() => {
    const loadStore = async () => {
      try {
        const data = await sellerStore.getStoreStatus();
        setStoreStatus({
          is_active: Boolean(data?.is_active),
          name: data?.name || 'Seller workspace',
        });
      } catch (error) {
        setStoreStatus((previous) => ({ ...previous }));
      }
    };

    loadStore();
  }, [location.pathname]);

  const handleLogout = async () => {
    await sellerAuth.logout();
    navigate('/seller/login', { replace: true });
  };

  const handleNavigate = () => setIsMobileMenuOpen(false);

  const handleToggleStore = async () => {
    if (isTogglingStore) {
      return;
    }

    const nextStatus = !storeStatus.is_active;
    setIsTogglingStore(true);

    try {
      await sellerStore.updateStoreStatus(nextStatus);
      setStoreStatus((previous) => ({
        ...previous,
        is_active: nextStatus,
      }));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('seller-store-status-changed', {
            detail: { is_active: nextStatus },
          })
        );
      }
    } catch (error) {
      setStoreStatus((previous) => ({ ...previous }));
    } finally {
      setIsTogglingStore(false);
    }
  };

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-40 border-b border-gray-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/90">
        <div className="mx-auto flex h-[72px] w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 md:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/seller/dashboard')}
              className="inline-flex items-center gap-3 rounded-xl text-left"
              aria-label="Go to seller dashboard"
            >
              <img src={logo} alt="Dleva" className="h-10 w-auto sm:h-11" />
              <div className="hidden min-w-0 sm:block">
                <p className="truncate text-sm font-bold text-dark">Seller Console</p>
                <p className="truncate text-xs text-muted">{storeStatus.name || 'Manage your store'}</p>
              </div>
            </button>

            <div className="hidden rounded-full border border-gray-200 bg-white px-3 py-1.5 lg:flex lg:items-center lg:gap-2">
              <span className={cn('h-2.5 w-2.5 rounded-full', storeStatus.is_active ? 'bg-emerald-500' : 'bg-red-500')} />
              <span className={cn('text-xs font-bold', storeStatus.is_active ? 'text-emerald-700' : 'text-red-600')}>
                {storeStatus.is_active ? 'Store open' : 'Store closed'}
              </span>
            </div>
          </div>

          <nav className="hidden items-center gap-1 lg:flex">
            {PRIMARY_ITEMS.map((item) => (
              <NavLink key={item.path} to={item.path} className={navLinkClass}>
                <item.icon size={16} />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <StoreToggleButton isActive={storeStatus.is_active} loading={isTogglingStore} onClick={handleToggleStore} />

            <SellerNotificationButton />

            <Link
              to="/seller/settings"
              className="hidden h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-muted transition-colors hover:bg-gray-50 hover:text-dark sm:inline-flex"
              aria-label="Seller settings"
            >
              <Settings size={18} />
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              className="hidden h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-muted transition-colors hover:bg-red-50 hover:text-red-600 sm:inline-flex"
              aria-label="Logout"
            >
              <Power size={18} />
            </button>

            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-dark lg:hidden"
              aria-label="Open seller navigation"
            >
              <Menu size={18} />
            </button>
          </div>
        </div>
      </header>

      {isMobileMenuOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-[min(86vw,20rem)] overflow-y-auto bg-white px-5 pb-6 pt-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary/80">Seller workspace</p>
                <h2 className="mt-1 text-lg font-bold text-dark">{storeStatus.name || 'Your store'}</h2>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-dark"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-4 rounded-2xl border border-gray-200 bg-white px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-gray-500">Store status</p>
                  <p className={cn('mt-2 text-sm font-bold', storeStatus.is_active ? 'text-emerald-700' : 'text-red-600')}>
                    {storeStatus.is_active ? 'Accepting new orders' : 'Currently paused'}
                  </p>
                </div>
                <StoreToggleButton isActive={storeStatus.is_active} loading={isTogglingStore} onClick={handleToggleStore} />
              </div>
            </div>

            <nav className="mt-5 space-y-2">
              {PRIMARY_ITEMS.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={handleNavigate}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition-colors',
                      isActive ? 'bg-dark text-white' : 'bg-white text-dark hover:bg-gray-100'
                    )
                  }
                >
                  <item.icon size={18} />
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </nav>

            <div className="mt-6 space-y-3">
              <Link
                to="/seller/notifications"
                onClick={handleNavigate}
                className="flex items-center justify-center rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-bold text-dark"
              >
                View notifications
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center justify-center rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-600"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white/95 backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-3xl items-stretch justify-between px-2 pb-[calc(env(safe-area-inset-bottom,0px)+8px)] pt-2">
          {PRIMARY_ITEMS.map((item) => (
            <NavLink key={item.path} to={item.path} className={mobileLinkClass}>
              <item.icon size={20} />
              <span className="truncate">{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </>
  );
};

export default SellerAppChrome;
