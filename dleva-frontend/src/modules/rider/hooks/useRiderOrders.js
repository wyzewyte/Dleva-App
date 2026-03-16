/**
 * useRiderOrders Hook
 * Custom hook for managing rider's available and active deliveries
 */

import { useState, useEffect, useCallback } from 'react';
import api from '../../../services/axios';

export const useRiderOrders = () => {
  const [availableOrders, setAvailableOrders] = useState([]);
  const [activeDeliveries, setActiveDeliveries] = useState([]);
  const [completedDeliveries, setCompletedDeliveries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch available orders
  const fetchAvailableOrders = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.get('/rider/available-orders/');
      setAvailableOrders(response.data.results || response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch available orders');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch active deliveries
  const fetchActiveDeliveries = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Use the correct endpoint: /rider/orders/ returns all rider's orders
      // This includes active orders assigned to the rider
      const response = await api.get('/rider/orders/');
      setActiveDeliveries(response.data.results || response.data.orders || response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch active deliveries');
    } finally {
      setLoading(false);
    }
  }, []);

  // Accept an order
  const acceptOrder = useCallback(async (orderId) => {
    try {
      const response = await api.post(`/rider/order/${orderId}/accept/`);
      
      // Remove from available and add to active
      setAvailableOrders(prev => prev.filter(o => o.id !== orderId));
      setActiveDeliveries(prev => [...prev, response.data]);

      return response.data;
    } catch (err) {
      throw err.response?.data?.error || 'Failed to accept order';
    }
  }, []);

  // Start delivery
  const startDelivery = useCallback(async (orderId) => {
    try {
      const response = await api.post(`/rider/order/${orderId}/start-delivery/`);
      
      // Update in active deliveries
      setActiveDeliveries(prev =>
        prev.map(d => d.id === orderId ? response.data : d)
      );

      return response.data;
    } catch (err) {
      throw err.response?.data?.error || 'Failed to start delivery';
    }
  }, []);

  // Complete delivery
  const completeDelivery = useCallback(async (orderId, notes = '') => {
    try {
      const response = await api.post(`/rider/order/${orderId}/complete-delivery/`, {
        delivery_notes: notes,
      });

      // Remove from active and add to completed
      setActiveDeliveries(prev => prev.filter(d => d.id !== orderId));
      setCompletedDeliveries(prev => [...prev, response.data]);

      return response.data;
    } catch (err) {
      throw err.response?.data?.error || 'Failed to complete delivery';
    }
  }, []);

  // Cancel order
  const cancelOrder = useCallback(async (orderId, reason = '') => {
    try {
      const response = await api.post(`/rider/order/${orderId}/cancel/`, {
        cancellation_reason: reason,
      });

      // Remove from active
      setActiveDeliveries(prev => prev.filter(d => d.id !== orderId));

      return response.data;
    } catch (err) {
      throw err.response?.data?.error || 'Failed to cancel order';
    }
  }, []);

  return {
    availableOrders,
    activeDeliveries,
    completedDeliveries,
    loading,
    error,
    fetchAvailableOrders,
    fetchActiveDeliveries,
    acceptOrder,
    startDelivery,
    completeDelivery,
    cancelOrder,
  };
};

export default useRiderOrders;
