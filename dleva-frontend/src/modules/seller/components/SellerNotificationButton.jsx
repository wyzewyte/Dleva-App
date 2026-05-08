import { Bell, Wifi, WifiOff } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import useSellerNotifications from '../../../hooks/useSellerNotifications';
import { cn } from '../../../utils/cn';
import SellerNotificationPanel from './SellerNotificationPanel';

const SellerNotificationButton = () => {
  const { unreadCount, isConnected } = useSellerNotifications();
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!wrapperRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleClick = () => {
    if (typeof window !== 'undefined' && window.matchMedia('(max-width: 1023px)').matches) {
      navigate('/seller/notifications');
      return;
    }

    setOpen((previous) => !previous);
  };

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        type="button"
        onClick={handleClick}
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-dark transition-colors hover:bg-gray-50"
        aria-label="Open seller notifications"
      >
        <Bell size={18} />
        <span className="absolute -bottom-1 -right-1">
          {isConnected ? (
            <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-white">
              <Wifi size={10} />
            </span>
          ) : (
            <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-gray-300 text-white">
              <WifiOff size={10} />
            </span>
          )}
        </span>
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          className={cn(
            'absolute right-0 top-[calc(100%+12px)] z-50 w-[min(92vw,26rem)]',
            'origin-top-right animate-in fade-in zoom-in-95 duration-200'
          )}
        >
          <SellerNotificationPanel limit={6} showFooterLink />
        </div>
      ) : null}
    </div>
  );
};

export default SellerNotificationButton;
