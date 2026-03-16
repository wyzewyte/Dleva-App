/**
 * Toast Component
 * Displays toast notifications at the top or bottom of the screen
 * Supports success, error, warning, info, and loading types
 */

import { useEffect, useState } from 'react';
import toast from '../../../services/toast';
import { X, Check, AlertCircle, Info, Loader } from 'lucide-react';
import '../../../styles/toast.css';

const Toast = () => {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    // Subscribe to toast changes
    const unsubscribe = toast.subscribe((activeToasts) => {
      setToasts(activeToasts);
    });

    return unsubscribe;
  }, []);

  const getIcon = (type) => {
    const iconClass = 'w-5 h-5';
    
    switch (type) {
      case 'success':
        return <Check className={iconClass} />;
      case 'error':
        return <AlertCircle className={iconClass} />;
      case 'warning':
        return <AlertCircle className={iconClass} />;
      case 'loading':
        return <Loader className={`${iconClass} animate-spin`} />;
      case 'info':
      default:
        return <Info className={iconClass} />;
    }
  };

  const getToastClass = (type) => {
    const baseClass = 'toast flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg text-white animate-slide-in';
    
    switch (type) {
      case 'success':
        return `${baseClass} bg-green-500`;
      case 'error':
        return `${baseClass} bg-red-500`;
      case 'warning':
        return `${baseClass} bg-yellow-500`;
      case 'loading':
        return `${baseClass} bg-blue-500`;
      case 'info':
      default:
        return `${baseClass} bg-blue-400`;
    }
  };

  if (toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map((t) => (
        <div key={t.id} className={getToastClass(t.type)}>
          <div className="flex items-center gap-3 flex-1">
            <div className="flex-shrink-0">
              {getIcon(t.type)}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">{t.message}</p>
            </div>
          </div>
          {t.dismissible && (
            <button
              onClick={() => toast.dismiss(t.id)}
              className="flex-shrink-0 ml-2 text-white hover:text-gray-200 transition-colors"
              type="button"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      ))}
    </div>
  );
};

export default Toast;
