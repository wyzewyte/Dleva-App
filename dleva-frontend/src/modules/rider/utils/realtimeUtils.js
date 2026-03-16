/**
 * Real-Time Utilities
 * Handles notifications, sounds, and vibrations for real-time features
 */

/**
 * Play notification sound
 * Uses Web Audio API to create notification tone
 */
export const playNotificationSound = () => {
  try {
    const context = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(context.destination);

    oscillator.frequency.value = 800;
    gainNode.gain.setValueAtTime(0.3, context.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.2);

    oscillator.start(context.currentTime);
    oscillator.stop(context.currentTime + 0.2);

    console.log('🔔 Notification sound played');
  } catch (error) {
    console.error('Failed to play notification sound:', error);
  }
};

/**
 * Trigger device vibration
 * @param {Array} pattern - Vibration pattern [vibrate, pause, vibrate, ...]
 */
export const vibrate = (pattern = [200, 100, 200]) => {
  try {
    if (navigator.vibrate) {
      navigator.vibrate(pattern);
      console.log('📳 Device vibrated');
    }
  } catch (error) {
    console.error('Vibration not supported:', error);
  }
};

/**
 * Show browser notification
 * @param {Object} options - Notification options
 */
export const showBrowserNotification = (options) => {
  const {
    title = 'D-Leva',
    body = 'New notification',
    icon = '/dleva-icon.png',
    badge = '/dleva-badge.png',
    tag = 'dleva-notification',
    requireInteraction = true,
    data = {},
  } = options;

  try {
    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification(title, {
          body,
          icon,
          badge,
          tag,
          requireInteraction,
          data,
        });
        console.log('🔔 Browser notification shown');
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then((permission) => {
          if (permission === 'granted') {
            new Notification(title, {
              body,
              icon,
              badge,
              tag,
              requireInteraction,
              data,
            });
          }
        });
      }
    }
  } catch (error) {
    console.error('Failed to show browser notification:', error);
  }
};

/**
 * Request notification permission
 */
export const requestNotificationPermission = async () => {
  try {
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return Notification.permission === 'granted';
  } catch (error) {
    console.error('Failed to request notification permission:', error);
    return false;
  }
};

/**
 * Play success sound (two-tone)
 */
export const playSuccessSound = () => {
  try {
    const context = new (window.AudioContext || window.webkitAudioContext)();
    const now = context.currentTime;

    // First tone: 600Hz
    const osc1 = context.createOscillator();
    const gain1 = context.createGain();
    osc1.connect(gain1);
    gain1.connect(context.destination);
    osc1.frequency.value = 600;
    gain1.gain.setValueAtTime(0.2, now);
    gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

    // Second tone: 800Hz
    const osc2 = context.createOscillator();
    const gain2 = context.createGain();
    osc2.connect(gain2);
    gain2.connect(context.destination);
    osc2.frequency.value = 800;
    gain2.gain.setValueAtTime(0, now + 0.1);
    gain2.gain.setValueAtTime(0.2, now + 0.1);
    gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

    osc1.start(now);
    osc1.stop(now + 0.1);
    osc2.start(now + 0.1);
    osc2.stop(now + 0.2);

    console.log('✅ Success sound played');
  } catch (error) {
    console.error('Failed to play success sound:', error);
  }
};

/**
 * Play error sound
 */
export const playErrorSound = () => {
  try {
    const context = new (window.AudioContext || window.webkitAudioContext)();
    const now = context.currentTime;

    const osc = context.createOscillator();
    const gain = context.createGain();
    osc.connect(gain);
    gain.connect(context.destination);

    osc.frequency.value = 300;
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

    osc.start(now);
    osc.stop(now + 0.3);

    console.log('❌ Error sound played');
  } catch (error) {
    console.error('Failed to play error sound:', error);
  }
};

/**
 * Format notification timestamp
 */
export const formatNotificationTime = (timestamp) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now - date;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;

  return date.toLocaleDateString();
};

/**
 * Get notification icon based on type
 */
export const getNotificationIcon = (type) => {
  const icons = {
    'delivery.assigned': '🎁',
    'delivery.status_changed': '📦',
    'delivery.cancelled': '❌',
    'performance.updated': '⭐',
    'notification.new': '🔔',
    'payment.received': '💰',
    'warning': '⚠️',
  };

  return icons[type] || '📢';
};

export default {
  playNotificationSound,
  vibrate,
  showBrowserNotification,
  requestNotificationPermission,
  playSuccessSound,
  playErrorSound,
  formatNotificationTime,
  getNotificationIcon,
};
