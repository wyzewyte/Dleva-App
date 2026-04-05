import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  CircleDollarSign,
  ClipboardList,
  LayoutDashboard,
  LifeBuoy,
  Loader2,
  LogOut,
  Power,
  Settings,
} from 'lucide-react';
import api from '../../../services/axios';
import { API_ENDPOINTS } from '../../../constants/apiConfig';
import { useRiderAuth } from '../context/RiderAuthContext';
import { cn } from '../../../utils/cn';
import logo from '../../../assets/images/logo.svg';

const PRIMARY_ITEMS = [
  { label: 'Dashboard', path: '/rider/dashboard', icon: LayoutDashboard },
  { label: 'Deliveries', path: '/rider/deliveries', icon: ClipboardList },
  { label: 'Earnings', path: '/rider/earnings', icon: CircleDollarSign },
  { label: 'Support', path: '/rider/help', icon: LifeBuoy },
  { label: 'Settings', path: '/rider/settings', icon: Settings },
];

const linkClassName = ({ isActive }) =>
  cn(
    'inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition-colors',
    isActive ? 'bg-dark text-white' : 'text-muted hover:bg-gray-100 hover:text-dark'
  );

const RiderAppChrome = () => {
  const navigate = useNavigate();
  const { rider, logout, updateProfile } = useRiderAuth();
  const [onlineLoading, setOnlineLoading] = useState(false);
  const [onlineError, setOnlineError] = useState('');

  const handleToggleOnline = async () => {
    if (onlineLoading || !rider?.can_go_online) return;

    setOnlineLoading(true);
    setOnlineError('');

    try {
      const response = await api.post(API_ENDPOINTS.RIDER.TOGGLE_ONLINE, {
        is_online: !rider?.is_online,
      });

      updateProfile({
        ...(response?.data || {}),
        is_online:
          typeof response?.data?.is_online === 'boolean'
            ? response.data.is_online
            : !rider?.is_online,
      });
    } catch (error) {
      setOnlineError(error?.response?.data?.error || 'Unable to update your work status right now.');
    } finally {
      setOnlineLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/rider/login', { replace: true });
    } catch (error) {
      console.error('Rider logout failed:', error);
    }
  };

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-40 border-b border-gray-100 bg-white">
        <div className="mx-auto flex h-[72px] w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 md:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/rider/dashboard')}
              className="inline-flex items-center gap-3 rounded-xl text-left"
              aria-label="Go to rider dashboard"
            >
              <img src={logo} alt="Dleva" className="h-10 w-auto sm:h-11" />
              <div className="hidden min-w-0 sm:block">
                <p className="truncate text-sm font-bold text-dark">Rider Console</p>
                <p className="truncate text-xs text-muted">
                  {rider?.full_name || rider?.first_name || 'Delivery partner'}
                </p>
              </div>
            </button>
          </div>

          <nav className="hidden items-center gap-1 lg:flex">
            {PRIMARY_ITEMS.map((item) => (
              <NavLink key={item.path} to={item.path} className={linkClassName}>
                <item.icon size={16} />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-2.5 py-2">
              <span
                className={cn(
                  'h-2.5 w-2.5 rounded-full',
                  rider?.is_online ? 'bg-emerald-500' : 'bg-red-500'
                )}
              />
              <span
                className={cn(
                  'text-xs font-bold',
                  rider?.is_online ? 'text-emerald-700' : 'text-red-600'
                )}
              >
                {rider?.is_online ? 'Online' : 'Offline'}
              </span>
            </div>

            <button
              type="button"
              disabled={onlineLoading || !rider?.can_go_online}
              onClick={handleToggleOnline}
              className={cn(
                'inline-flex min-h-[42px] items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50',
                rider?.is_online
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                  : 'border-gray-200 bg-gray-50 text-dark hover:bg-gray-100'
              )}
            >
              {onlineLoading ? <Loader2 size={16} className="animate-spin" /> : <Power size={16} />}
              <span className="hidden sm:inline">{rider?.is_online ? 'Go offline' : 'Go online'}</span>
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-surface text-muted transition-colors hover:bg-red-50 hover:text-red-600"
              aria-label="Logout"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>

        {onlineError ? (
          <div className="border-t border-red-100 bg-red-50 px-4 py-2 text-center text-xs font-medium text-red-700">
            {onlineError}
          </div>
        ) : null}
      </header>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white lg:hidden">
        <div className="mx-auto flex max-w-3xl items-stretch justify-between px-2 pb-[calc(env(safe-area-inset-bottom,0px)+8px)] pt-2">
          {PRIMARY_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  'flex min-w-0 flex-1 flex-col items-center gap-1 rounded-xl px-1 py-2 text-[11px] font-semibold transition-colors',
                  isActive ? 'text-primary' : 'text-gray-400'
                )
              }
            >
              <item.icon size={20} />
              <span className="truncate">{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </>
  );
};

export default RiderAppChrome;
