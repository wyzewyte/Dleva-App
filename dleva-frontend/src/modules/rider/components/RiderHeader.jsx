import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Wallet, MapPin, Settings, LogOut, Menu, X, Power, AlertCircle } from 'lucide-react';
import { useRiderAuth } from '../context/RiderAuthContext';
import api from '../../../services/axios';
import { API_ENDPOINTS, ROUTES } from '../../../constants/apiConfig';
import MESSAGES from '../../../constants/messages';
import riderLocationService from '../services/riderLocationService';
import NotificationBell from './NotificationBell';
import ConnectionStatus from './ConnectionStatus';

const MENU_ITEMS = [
  { icon: LayoutDashboard, label: 'Dashboard', path: ROUTES.RIDER.DASHBOARD },
  { icon: MapPin, label: 'Active Deliveries', path: ROUTES.RIDER.ACTIVE_ORDERS },
  { icon: Wallet, label: 'Earnings', path: ROUTES.RIDER.EARNINGS },
  { icon: Settings, label: 'Settings', path: ROUTES.RIDER.SETTINGS },
];

const RiderHeader = () => {
  const navigate = useNavigate();
  const { rider, logout, updateProfile } = useRiderAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [onlineLoading, setOnlineLoading] = useState(false);
  const [onlineError, setOnlineError] = useState('');
  const [locationStatus, setLocationStatus] = useState('idle'); // idle, tracking, error
  const [accuracy, setAccuracy] = useState(null);

  // Start location tracking when rider comes online
  useEffect(() => {
    if (rider?.is_online && rider?.can_go_online) {
      startLocationTracking();
    } else {
      stopLocationTracking();
    }

    return () => stopLocationTracking();
  }, [rider?.is_online, rider?.can_go_online]);

  const startLocationTracking = () => {
    try {
      riderLocationService.startTracking(
        (location) => {
          setLocationStatus('tracking');
          setAccuracy(Math.round(location.accuracy));
        },
        (error) => {
          setLocationStatus('error');
          console.error('Location tracking error:', error);
        }
      );
    } catch (err) {
      setLocationStatus('error');
      console.error('Failed to start location tracking:', err);
    }
  };

  const stopLocationTracking = () => {
    riderLocationService.stopTracking();
    setLocationStatus('idle');
    setAccuracy(null);
  };

  const handleToggleOnline = async () => {
    if (!rider || onlineLoading) return;

    setOnlineLoading(true);
    setOnlineError('');

    try {
      const response = await api.post(API_ENDPOINTS.RIDER.TOGGLE_ONLINE);
      updateProfile({ is_online: response.data.is_online });
    } catch (err) {
      setOnlineError(err.response?.data?.error || MESSAGES.ERROR.SOMETHING_WRONG);
    } finally {
      setOnlineLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/rider/login');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">

        {/* Logo */}
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-primary tracking-tighter hidden sm:block">
            Dleva<span className="text-dark">Rider</span>
          </h1>
          <h1 className="text-xl font-bold text-primary tracking-tighter sm:hidden">
            DR
          </h1>
        </div>

        {/* Location Status (Center - Desktop) */}
        <div className="hidden lg:flex items-center gap-2">
          {locationStatus === 'tracking' && (
            <div className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
              <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></div>
              <span className="font-medium">Live Tracking</span>
              {accuracy && <span className="text-gray-500">±{accuracy}m</span>}
            </div>
          )}
          {locationStatus === 'error' && (
            <div className="flex items-center gap-1 text-xs text-red-600 bg-red-50 px-2 py-1 rounded-full">
              <AlertCircle size={14} />
              <span>Location unavailable</span>
            </div>
          )}
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {MENU_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `
                flex items-center gap-2 px-3 py-2 rounded-lg font-medium text-sm transition-colors
                ${isActive ? "bg-primary text-white" : "text-gray-600 hover:bg-gray-100 hover:text-dark"}
              `}
            >
              <item.icon size={18} />
              <span className="hidden lg:inline">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Online Toggle & Profile (Desktop) */}
        <div className="hidden md:flex items-center gap-3">
          {/* Connection Status */}
          <ConnectionStatus />

          {/* Notifications Bell */}
          <NotificationBell />

          {/* Online Toggle */}
          {!!rider?.can_go_online && (
            <div className="flex items-center gap-2">
              {onlineError && (
                <div className="text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle size={14} />
                  {onlineError}
                </div>
              )}
              <button
                onClick={handleToggleOnline}
                disabled={onlineLoading}
                className={`
                  flex items-center gap-2 px-3 py-2 rounded-lg font-medium text-sm transition-all
                  ${rider?.is_online
                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }
                  disabled:opacity-50
                `}
              >
                <div className={`w-2 h-2 rounded-full ${rider?.is_online ? 'bg-green-500' : 'bg-gray-400'}`} />
                <span className="hidden lg:inline">{rider?.is_online ? 'Online' : 'Offline'}</span>
                {onlineLoading && <span className="text-xs">...</span>}
              </button>
            </div>
          )}

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg font-medium text-sm transition-colors active:scale-95"
          >
            <LogOut size={18} />
            <span className="hidden lg:inline">Logout</span>
          </button>
        </div>

        <div className="md:hidden flex items-center gap-2">
          <NotificationBell />
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg hover:bg-gray-100"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200 p-4 space-y-2">
          {MENU_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) => `
                flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors
                ${isActive ? "bg-primary text-white" : "text-gray-600 hover:bg-gray-100 hover:text-dark"}
              `}
            >
              <item.icon size={20} />
              {item.label}
            </NavLink>
          ))}

          {/* Mobile Online Toggle */}
          {!!rider?.can_go_online && (
            <button
              onClick={async () => {
                await handleToggleOnline();
                setMobileMenuOpen(false);
              }}
              disabled={onlineLoading}
              className={`
                w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors
                ${rider?.is_online
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-600'
                }
                disabled:opacity-50
              `}
            >
              <Power size={20} />
              {rider?.is_online ? 'Go Offline' : 'Go Online'}
            </button>
          )}

          {/* Mobile Logout */}
          <button
            onClick={() => {
              handleLogout();
              setMobileMenuOpen(false);
            }}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl font-medium transition-colors active:scale-95"
          >
            <LogOut size={20} />
            Logout
          </button>
        </div>
      )}
    </header>
  );
};

export default RiderHeader;
