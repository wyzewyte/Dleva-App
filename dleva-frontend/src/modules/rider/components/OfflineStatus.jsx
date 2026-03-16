/**
 * Offline Status Component
 * Displays offline mode indicator and sync progress
 */

import { useState, useEffect } from 'react';
import { AlertCircle, Loader, CheckCircle, Wifi, WifiOff } from 'lucide-react';
import offlineSyncService from '../services/offlineSyncService';

const OfflineStatus = ({ position = 'bottom-right' }) => {
  const [status, setStatus] = useState('online');
  const [queueCount, setQueueCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    // Initialize service
    offlineSyncService.init();

    // Listen to sync events
    const unsubscribe = offlineSyncService.onSync((syncStatus) => {
      setStatus(syncStatus.status);
      
      if (syncStatus.status === 'connecting' || syncStatus.status === 'syncing') {
        setIsSyncing(true);
      } else if (syncStatus.status === 'complete' || syncStatus.status === 'error') {
        setIsSyncing(false);
      }

      updateQueueCount();
    });

    // Initial status
    updateStatus();

    // Listen to online/offline events
    const handleOnline = () => updateStatus();
    const handleOffline = () => updateStatus();

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Periodic status check
    const interval = setInterval(updateStatus, 5000);

    return () => {
      unsubscribe();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  const updateStatus = () => {
    const isOnline = offlineSyncService.isOnline();
    setStatus(isOnline ? 'online' : 'offline');
    updateQueueCount();
  };

  const updateQueueCount = () => {
    const stats = offlineSyncService.getSyncStatus();
    setQueueCount(stats.queueStats.pending);
  };

  // Only show when offline or syncing
  if (status === 'online' && !isSyncing) {
    return null;
  }

  const positionClasses = {
    'bottom-right': 'bottom-20 right-4',
    'bottom-left': 'bottom-20 left-4',
    'top-right': 'top-20 right-4',
    'top-left': 'top-20 left-4',
  };

  const statusDisplay = {
    offline: {
      icon: <WifiOff size={20} />,
      title: 'Offline Mode',
      message: queueCount > 0 ? `${queueCount} action${queueCount !== 1 ? 's' : ''} queued` : 'No connection',
      bgClass: 'bg-red-50 border-red-200',
      textClass: 'text-red-700',
      badgeClass: 'bg-red-600 text-white',
    },
    connecting: {
      icon: <Loader size={20} className="animate-spin" />,
      title: 'Reconnecting',
      message: 'Trying to connect...',
      bgClass: 'bg-yellow-50 border-yellow-200',
      textClass: 'text-yellow-700',
      badgeClass: 'bg-yellow-600 text-white',
    },
    syncing: {
      icon: <Loader size={20} className="animate-spin" />,
      title: 'Syncing',
      message: 'Syncing offline actions...',
      bgClass: 'bg-blue-50 border-blue-200',
      textClass: 'text-blue-700',
      badgeClass: 'bg-blue-600 text-white',
    },
    success: {
      icon: <CheckCircle size={20} />,
      title: 'Synced',
      message: 'All offline actions synced',
      bgClass: 'bg-green-50 border-green-200',
      textClass: 'text-green-700',
      badgeClass: 'bg-green-600 text-white',
    },
    error: {
      icon: <AlertCircle size={20} />,
      title: 'Sync Failed',
      message: 'Some actions failed to sync',
      bgClass: 'bg-orange-50 border-orange-200',
      textClass: 'text-orange-700',
      badgeClass: 'bg-orange-600 text-white',
    },
  };

  const display = statusDisplay[status] || statusDisplay.offline;

  return (
    <div className={`fixed ${positionClasses[position]} z-50 max-w-sm`}>
      <div
        onClick={() => setShowDetails(!showDetails)}
        className={`border rounded-lg p-4 cursor-pointer transition-all hover:shadow-lg ${display.bgClass} ${display.textClass}`}
      >
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">{display.icon}</div>

          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-sm">{display.title}</h3>
            <p className="text-xs mt-1 opacity-90">{display.message}</p>

            {queueCount > 0 && (
              <span className={`inline-block mt-2 px-2 py-1 rounded text-xxs font-bold ${display.badgeClass}`}>
                {queueCount} queued
              </span>
            )}
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowDetails(!showDetails);
            }}
            className="flex-shrink-0 text-lg leading-none opacity-60 hover:opacity-100"
          >
            ⋮
          </button>
        </div>

        {/* Detailed View */}
        {showDetails && (
          <div className="mt-3 pt-3 border-t border-current border-opacity-20 space-y-2">
            <DetailRow
              label="Connection"
              value={offlineSyncService.isOnline() ? '🟢 Online' : '🔴 Offline'}
            />
            <DetailRow label="Syncing" value={isSyncing ? '⏳ Yes' : '✓ No'} />

            {queueCount > 0 && (
              <DetailRow label="Queued Actions" value={queueCount} />
            )}

            <button
              onClick={() => {
                if (confirm('Clear offline queue?')) {
                  offlineSyncService.clearQueue();
                  updateQueueCount();
                }
              }}
              className="w-full mt-3 px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded text-sm font-medium text-gray-700 transition-colors"
            >
              Clear Queue
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Detail Row Component
 */
const DetailRow = ({ label, value }) => (
  <div className="flex justify-between text-xs">
    <span className="font-medium opacity-70">{label}:</span>
    <span className="opacity-90">{value}</span>
  </div>
);

export default OfflineStatus;
