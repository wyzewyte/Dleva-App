import React, { createContext, useContext, useEffect, useState } from 'react';
import buyerCart from '../../../services/buyerCart';
import { logError } from '../../../utils/errorHandler';
import { useAuth } from '../../auth/context/AuthContext';

const STORAGE_KEY = 'dleva_cart';
const PAUSE_KEY = 'cartSyncPaused';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const { user } = useAuth(); // Get authenticated user
  const [cartItems, setCartItemsState] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    } catch {
      return [];
    }
  });

  // NEW: drawer state
  const [isCartOpen, setIsCartOpen] = useState(false);
  const toggleCart = () => setIsCartOpen(!isCartOpen);

  // helpers
  const setCartItems = (items) => {
    setCartItemsState(items || []);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items || []));
  };

  const addLocalItem = async (item) => {
    try {
      // Sync to server first - use correct field name
      await buyerCart.addItem(
        item.vendorId, 
        item.id,              // MenuItem ID
        item.quantity || 1
      );
      
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
    const token = localStorage.getItem('access_token');
    if (!token) return;
    
    if (localStorage.getItem(PAUSE_KEY)) return;

    let cancelled = false;
    const sync = async () => {
      try {
        const server = await buyerCart.getCart().catch(() => null);
        const serverItems = server?.items || [];

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
      } catch (e) {
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
      isCartOpen,
      setIsCartOpen,
      toggleCart
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);