/* eslint-disable react-refresh/only-export-components */
/**
 * Order Context
 * Manages rider order state including available, active, and history orders
 */

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { riderOrders } from '../services';
import MESSAGES from '../../../constants/messages';

const OrderContext = createContext();

export const OrderProvider = ({ children }) => {
  // Available Orders
  const [availableOrders, setAvailableOrders] = useState([]);
  
  // Active Orders (accepted but not completed)
  const [activeOrders, setActiveOrders] = useState([]);
  
  // Order History (completed/cancelled)
  const [orderHistory, setOrderHistory] = useState([]);
  
  // Currently selected/viewing order
  const [selectedOrder, setSelectedOrder] = useState(null);
  
  // Loading and error states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [operationLoading, setOperationLoading] = useState(false);

  /**
   * Fetch available orders
   * @param {Object} filters - Optional filters (distance, min_earnings, sorting)
   */
  const fetchAvailableOrders = useCallback(async (filters = {}) => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await riderOrders.getAvailableOrders(filters);
      const orders = Array.isArray(data.orders) ? data.orders : data.results || [];
      
      setAvailableOrders(orders);
      return orders;
    } catch (err) {
      const errorMsg = err.error || MESSAGES.ERROR.SOMETHING_WRONG;
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Fetch active orders for rider
   */
  const fetchActiveOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await riderOrders.getActiveOrders();

      const orders = Array.isArray(data.active_orders) ? data.active_orders : data.results || [];

      setActiveOrders(orders);
      return orders;
    } catch (err) {
      const errorMsg = err.error || MESSAGES.ERROR.SOMETHING_WRONG;
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Fetch order history
   * @param {Object} params - Query parameters (limit, offset, status, date_from, date_to)
   */
  const fetchOrderHistory = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await riderOrders.getOrderHistory(params);
      const orders = Array.isArray(data.orders) ? data.orders : data.results || [];
      
      setOrderHistory(orders);
      return orders;
    } catch (err) {
      const errorMsg = err.error || MESSAGES.ERROR.SOMETHING_WRONG;
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get order details
   * @param {number|string} orderId
   */
  const fetchOrderDetails = useCallback(async (orderId) => {
    try {
      setOperationLoading(true);
      setError(null);
      
      const data = await riderOrders.getOrderDetails(orderId);
      const order = data.order || data;
      
      setSelectedOrder(order);
      return order;
    } catch (err) {
      const errorMsg = err.error || MESSAGES.ERROR.SOMETHING_WRONG;
      setError(errorMsg);
      throw err;
    } finally {
      setOperationLoading(false);
    }
  }, []);

  /**
   * Accept an available order
   * @param {number|string} orderId
   */
  const acceptOrder = useCallback(async (orderId) => {
    try {
      setOperationLoading(true);
      setError(null);
      
      const data = await riderOrders.acceptOrder(orderId);
      const acceptedOrder = data.order || data;
      
      // Remove from available orders
      setAvailableOrders(prev => prev.filter(o => o.id !== orderId));
      
      // Add to active orders
      setActiveOrders(prev => [...prev, acceptedOrder]);
      
      return acceptedOrder;
    } catch (err) {
      const errorMsg = err.error || MESSAGES.ERROR.SOMETHING_WRONG;
      setError(errorMsg);
      throw err;
    } finally {
      setOperationLoading(false);
    }
  }, []);

  /**
   * Reject an order
   * @param {number|string} orderId
   * @param {string} reason - Optional reason
   */
  const rejectOrder = useCallback(async (orderId, reason = '') => {
    try {
      setOperationLoading(true);
      setError(null);
      
      await riderOrders.rejectOrder(orderId, reason);
      
      // Remove from available orders
      setAvailableOrders(prev => prev.filter(o => o.id !== orderId));
      
      return true;
    } catch (err) {
      const errorMsg = err.error || MESSAGES.ERROR.SOMETHING_WRONG;
      setError(errorMsg);
      throw err;
    } finally {
      setOperationLoading(false);
    }
  }, []);

  /**
   * Update order status
   * @param {number|string} orderId
   * @param {string} status - New status (arrived_at_pickup, pickup, on_the_way, delivered, etc.)
   * @param {Object} data - Optional additional data
   */
  const updateOrderStatus = useCallback(async (orderId, status, data = {}) => {
    try {
      setOperationLoading(true);
      setError(null);
      
      const result = await riderOrders.updateOrderStatus(orderId, status, data);
      const updatedOrder = result.order || result;
      
      // Update in selected order
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(updatedOrder);
      }
      
      // Update in active orders
      setActiveOrders(prev =>
        prev.map(o => o.id === orderId ? updatedOrder : o)
      );
      
      return updatedOrder;
    } catch (err) {
      const errorMsg = err.error || MESSAGES.ERROR.SOMETHING_WRONG;
      setError(errorMsg);
      throw err;
    } finally {
      setOperationLoading(false);
    }
  }, [selectedOrder]);

  /**
   * Complete order delivery
   * @param {number|string} orderId
   * @param {Object} data - Completion data (optional)
   */
  const completeOrder = useCallback(async (orderId, data = {}) => {
    try {
      setOperationLoading(true);
      setError(null);
      
      const result = await riderOrders.completeOrder(orderId, data);
      const completedOrder = result.order || result;
      
      // Remove from active orders
      setActiveOrders(prev => prev.filter(o => o.id !== orderId));
      
      // Add to order history
      setOrderHistory(prev => [completedOrder, ...prev]);
      
      // Clear selected order if it's the completed one
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(null);
      }
      
      return completedOrder;
    } catch (err) {
      const errorMsg = err.error || MESSAGES.ERROR.SOMETHING_WRONG;
      setError(errorMsg);
      throw err;
    } finally {
      setOperationLoading(false);
    }
  }, [selectedOrder]);

  /**
   * Cancel active order
   * @param {number|string} orderId
   * @param {string} reason - Reason for cancellation
   */
  const cancelOrder = useCallback(async (orderId, reason = '') => {
    try {
      setOperationLoading(true);
      setError(null);
      
      const result = await riderOrders.cancelOrder(orderId, reason);
      const cancelledOrder = result.order || result;
      
      // Remove from active orders
      setActiveOrders(prev => prev.filter(o => o.id !== orderId));
      
      // Add to order history
      setOrderHistory(prev => [cancelledOrder, ...prev]);
      
      // Clear selected order if it's the cancelled one
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(null);
      }
      
      return cancelledOrder;
    } catch (err) {
      const errorMsg = err.error || MESSAGES.ERROR.SOMETHING_WRONG;
      setError(errorMsg);
      throw err;
    } finally {
      setOperationLoading(false);
    }
  }, [selectedOrder]);

  /**
   * Update rider location for active order
   * @param {number|string} orderId
   * @param {number} latitude
   * @param {number} longitude
   */
  const updateOrderLocation = useCallback(async (orderId, latitude, longitude) => {
    try {
      await riderOrders.updateOrderLocation(orderId, latitude, longitude);
      return true;
    } catch (err) {
      // Location updates are not critical, log silently
      console.warn('Location update failed:', err);
      return false;
    }
  }, []);

  /**
   * Clear error message
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Clear selected order
   */
  const clearSelectedOrder = useCallback(() => {
    setSelectedOrder(null);
  }, []);

  /**
   * Refresh all data
   */
  const refreshAllData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      await Promise.all([
        fetchAvailableOrders(),
        fetchActiveOrders(),
      ]);
      
      return true;
    } catch (err) {
      const errorMsg = err.error || MESSAGES.ERROR.SOMETHING_WRONG;
      setError(errorMsg);
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchAvailableOrders, fetchActiveOrders]);

  const actionsValue = useMemo(() => ({
    fetchAvailableOrders,
    fetchActiveOrders,
    fetchOrderHistory,
    fetchOrderDetails,
    acceptOrder,
    rejectOrder,
    updateOrderStatus,
    completeOrder,
    cancelOrder,
    updateOrderLocation,
    clearError,
    clearSelectedOrder,
    refreshAllData,
  }), [
    fetchAvailableOrders,
    fetchActiveOrders,
    fetchOrderHistory,
    fetchOrderDetails,
    acceptOrder,
    rejectOrder,
    updateOrderStatus,
    completeOrder,
    cancelOrder,
    updateOrderLocation,
    clearError,
    clearSelectedOrder,
    refreshAllData,
  ]);

  const value = useMemo(() => ({
    availableOrders,
    activeOrders,
    orderHistory,
    selectedOrder,
    loading,
    operationLoading,
    error,
    actions: actionsValue,
  }), [
    availableOrders,
    activeOrders,
    orderHistory,
    selectedOrder,
    loading,
    operationLoading,
    error,
    actionsValue,
  ]);

  return (
    <OrderContext.Provider value={value}>
      {children}
    </OrderContext.Provider>
  );
};

export const useOrder = () => {
  const context = useContext(OrderContext);
  
  if (!context) {
    console.warn('⚠️ useOrder called outside OrderProvider. Returning default context.');
    return {
      availableOrders: [],
      activeOrders: [],
      orderHistory: [],
      selectedOrder: null,
      loading: false,
      operationLoading: false,
      error: null,
      actions: {
        fetchAvailableOrders: async () => [],
        fetchActiveOrders: async () => [],
        fetchOrderHistory: async () => [],
        fetchOrderDetails: async () => null,
        acceptOrder: async () => { throw new Error('useOrder: Provider not initialized'); },
        rejectOrder: async () => { throw new Error('useOrder: Provider not initialized'); },
        updateOrderStatus: async () => { throw new Error('useOrder: Provider not initialized'); },
        completeOrder: async () => { throw new Error('useOrder: Provider not initialized'); },
        cancelOrder: async () => { throw new Error('useOrder: Provider not initialized'); },
        updateOrderLocation: async () => false,
        clearError: () => {},
        clearSelectedOrder: () => {},
        refreshAllData: async () => false,
      },
    };
  }
  
  return context;
};
