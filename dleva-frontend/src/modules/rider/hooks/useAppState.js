/**
 * useAppState Hook
 * Tracks app visibility and focus state
 * Prevents unnecessary re-renders and manages real-time connection based on app state
 */

import { useEffect, useState, useCallback } from 'react';

export const useAppState = () => {
  const [isVisible, setIsVisible] = useState(!document.hidden);
  const [isFocused, setIsFocused] = useState(true);

  useEffect(() => {
    const handleVisibilityChange = () => {
      const nowVisible = !document.hidden;
      setIsVisible(nowVisible);
      
      if (nowVisible) {
        console.log('📱 App foreground - enabling notifications');
      } else {
        console.log('📱 App backgrounded - notifications will be silent');
      }
    };

    const handleFocus = () => {
      setIsFocused(true);
      console.log('👁️ App focused');
    };

    const handleBlur = () => {
      setIsFocused(false);
      console.log('👁️ App blurred');
    };

    // Add listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);

    // Set initial state
    setIsVisible(!document.hidden);
    setIsFocused(document.hasFocus?.() ?? true);

    // Cleanup
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
    };
  }, []);

  // Combine both states - app is active only if BOTH visible and focused
  const isActive = useCallback(() => isVisible && isFocused, [isVisible, isFocused]);

  return {
    isVisible,
    isFocused,
    isActive: isActive(),
  };
};

export default useAppState;
