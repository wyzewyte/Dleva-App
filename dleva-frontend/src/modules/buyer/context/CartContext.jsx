import React, { createContext, useContext, useEffect, useState } from 'react';
import buyerCart from '../../../services/buyerCart';
import { logError } from '../../../utils/errorHandler';
import { useAuth } from '../../auth/context/AuthContext';

const STORAGE_KEY = 'dleva_cart';
const PAUSE_KEY = 'cartSyncPaused';
const LAST_ADDED_AT_KEY = 'dleva_cart_last_added_at';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const { token } = useAuth(); // Get authenticated user token
  const [cartItems, setCartItemsState] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    } catch {
      return [];
    }
  });
  const [lastAddedAt, setLastAddedAt] = useState(() => localStorage.getItem(LAST_ADDED_AT_KEY));

  // NEW: drawer state
  const [isCartOpen, setIsCartOpen] = useState(false);
  const toggleCart = () => setIsCartOpen(!isCartOpen);

  // helpers
  const setCartItems = (items) => {
    setCartItemsState(items || []);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items || []));
  };

  const markCartUpdated = () => {
    const timestamp = new Date().toISOString();
    setLastAddedAt(timestamp);
    localStorage.setItem(LAST_ADDED_AT_KEY, timestamp);
  };

  const addLocalItem = async (item) => {
    try {
      // For authenticated users: sync to server first
      if (token) {
        await buyerCart.addItem(
          item.vendorId, 
          item.id,              // MenuItem ID
          item.quantity || 1
        );
      }
      // For guests: skip API call, just save locally
      
      // Then update local state
      setCartItemsState(prev => {
        // ✅ CHECK if item already exists (same id AND vendorId)
        const existingItem = prev.find(i => 
          String(i.id) === String(item.id) && 
          String(i.vendorId) === String(item.vendorId)
        );
        
        let next;
        if (existingItem) {
          // ✅ Item exists - INCREMENT quantity instead of duplicating
          next = prev.map(i =>
            String(i.id) === String(item.id) && String(i.vendorId) === String(item.vendorId)
              ? { ...i, quantity: (i.quantity || 1) + (item.quantity || 1) }
              : i
          );
          console.log(`✅ Updated item quantity:`, next.find(i => String(i.id) === String(item.id)));
        } else {
          // ✅ Item doesn't exist - ADD as new
          next = [...prev, item];
          console.log(`✅ Added new item to cart:`, item.name);
        }
        
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        return next;
      });
      markCartUpdated();
      
      return true; // success
    } catch (e) {
      logError(e, { context: 'CartContext.addLocalItem' });
      throw e; // propagate error so UI can show it
    }
  };

  const clearVendor = (vendorId) => {
    setCartItemsState(prev => {
      const filtered = prev.filter(i => String(i.vendorId) !== String(vendorId));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
      return filtered;
    });
  };

  // NEW: remove single item
  const removeFromCart = (itemId, vendorId) => {
    setCartItemsState(prev => {
      const filtered = prev.filter(i => 
        !(String(i.id) === String(itemId) && String(i.vendorId) === String(vendorId))
      );
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
      if (filtered.length === 0) {
        localStorage.removeItem(LAST_ADDED_AT_KEY);
        setLastAddedAt(null);
      }
      return filtered;
    });
  };

  // NEW: update quantity
  const updateQuantity = (itemId, vendorId, action) => {
    setCartItemsState(prev => {
      const updated = prev.map(i => {
        if (String(i.id) === String(itemId) && String(i.vendorId) === String(vendorId)) {
          const newQty = action === 'plus' ? i.quantity + 1 : Math.max(1, i.quantity - 1);
          return { ...i, quantity: newQty };
        }
        return i;
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  // Auto-sync local -> server but respect pause flag
  useEffect(() => {
    // Only sync if user is authenticated (check for access token)
    const token = localStorage.getItem('buyer_access_token');
    if (!token) return;
    
    if (localStorage.getItem(PAUSE_KEY)) return;

    let cancelled = false;
    const sync = async () => {
      try {
        const server = await buyerCart.getCart().catch(() => null);
        const serverItems = Array.isArray(server)
          ? server.flatMap((cart) =>
              (cart?.items || []).map((item) => ({
                ...item,
                restaurant_id: cart?.restaurant,
                vendorId: cart?.restaurant,
                menu_item_id: item?.menu_item?.id,
              }))
            )
          : server?.items || [];

        for (const it of cartItems) {
          if (cancelled) break;
          const menuId = it.menu_item_id || it.menuItemId || it.id;
          const exists = serverItems.some(si =>
            String(si.menu_item_id || si.menuItemId || si.id) === String(menuId) &&
            String(si.restaurant_id || si.vendorId) === String(it.vendorId)
          );
          if (!exists) {
            await buyerCart.addItem(it.vendorId, menuId, it.quantity || 1).catch(() => {});
          }
        }
      } catch {
        // ignore
      }
    };

    sync();
    return () => { cancelled = true; };
  }, [cartItems]);

  return (
    <CartContext.Provider value={{
      cartItems,
      setCartItems,
      addLocalItem,
      clearVendor,
      removeFromCart,
      updateQuantity,
      lastAddedAt,
      isCartOpen,
      setIsCartOpen,
      toggleCart
    }}>
      {children}
    </CartContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useCart = () => useContext(CartContext);
