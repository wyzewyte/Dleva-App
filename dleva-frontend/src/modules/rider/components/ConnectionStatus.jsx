/**
 * Connection Status Component
 * Displays real-time WebSocket connection status
 */

import { useEffect, useState } from 'react';
import { Wifi, WifiOff, AlertCircle, Loader } from 'lucide-react';
import riderWebSocket from '../services/riderWebSocket';

const ConnectionStatus = () => {
  const [status, setStatus] = useState('disconnected');

  useEffect(() => {
    // Check connection status every 3 seconds
    const checkStatus = setInterval(() => {
      const currentStatus = riderWebSocket.getStatus();
      setStatus(currentStatus);
    }, 3000);

    // Initial check
    setStatus(riderWebSocket.getStatus());

    return () => clearInterval(checkStatus);
  }, []);

  // Determine display text and styling based on status
  const getStatusDisplay = () => {
    switch (status) {
      case 'connected':
        return {
          icon: <Wifi size={16} />,
          text: 'Connected',
          className: 'bg-green-50 text-green-700 border-green-200 hidden',
          dotClass: 'bg-green-500',
        };
      case 'connecting':
        return {
          icon: <Loader size={16} className="animate-spin" />,
          text: 'Connecting...',
          className: 'bg-yellow-50 text-yellow-700 border-yellow-200',
          dotClass: 'bg-yellow-500 animate-pulse',
        };
      case 'disconnected':
        return {
          icon: <WifiOff size={16} />,
          text: 'Disconnected',
          className: 'bg-red-50 text-red-700 border-red-200',
          dotClass: 'bg-red-500',
        };
      case 'closing':
        return {
          icon: <AlertCircle size={16} />,
          text: 'Closing...',
          className: 'bg-orange-50 text-orange-700 border-orange-200',
          dotClass: 'bg-orange-500 animate-pulse',
        };
      case 'closed':
        return {
          icon: <WifiOff size={16} />,
          text: 'Connection Lost',
          className: 'bg-gray-50 text-gray-700 border-gray-200',
          dotClass: 'bg-gray-500',
        };
      default:
        return {
          icon: <WifiOff size={16} />,
          text: 'Unknown',
          className: 'bg-gray-50 text-gray-700 border-gray-200',
          dotClass: 'bg-gray-500',
        };
    }
  };

  const display = getStatusDisplay();

  return (
    <div
      className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all ${display.className}`}
      title={`WebSocket: ${display.text}`}
    >
      <div className={`w-2 h-2 rounded-full ${display.dotClass}`} />
      <span className="hidden sm:inline">{display.text}</span>
      <span className="sm:hidden">{display.icon}</span>
    </div>
  );
};

export default ConnectionStatus;
