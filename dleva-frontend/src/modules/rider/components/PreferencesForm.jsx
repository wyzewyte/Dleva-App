/**
 * PreferencesForm Component
 * Handles delivery preferences and notification settings
 */

import { useState } from 'react';
import { Loader2, Sliders, Bell, MapPin, Package } from 'lucide-react';

const PreferencesForm = ({ preferences = {}, onSave, loading }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    max_distance: preferences?.max_distance || 10,
    prefer_short_deliveries: preferences?.prefer_short_deliveries || false,
    prefer_food_orders: preferences?.prefer_food_orders || true,
    prefer_grocery_orders: preferences?.prefer_grocery_orders || true,
    notifications_enabled: preferences?.notifications_enabled !== false,
    sms_notifications: preferences?.sms_notifications !== false,
    email_notifications: preferences?.email_notifications !== false,
  });

  const handleToggle = (field) => {
    setFormData((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const handleSliderChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onSave(formData);
    setIsEditing(false);
  };

  return (
    <div className="bg-white rounded-2xl p-6 space-y-4 border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Sliders size={22} className="text-primary" />
          <h3 className="font-bold text-dark text-lg">Preferences</h3>
        </div>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="text-sm font-bold text-primary hover:underline"
          >
            Edit
          </button>
        )}
      </div>

      {!isEditing ? (
        // View Mode
        <div className="space-y-4">
          {/* Delivery Preferences */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-dark">Delivery Preferences</h4>
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin size={18} className="text-blue-600" />
                  <span className="font-bold text-dark">Maximum Distance</span>
                </div>
                <span className="font-bold text-primary text-lg">
                  {formData.max_distance} km
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-dark">Prefer short deliveries only</span>
                <span
                  className={`text-xs font-bold px-2 py-1 rounded ${
                    formData.prefer_short_deliveries
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {formData.prefer_short_deliveries ? 'ON' : 'OFF'}
                </span>
              </div>
            </div>
          </div>

          {/* Order Types */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-dark">Order Types</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Package size={18} className="text-primary" />
                  <span className="font-bold text-dark">Food Orders</span>
                </div>
                <span
                  className={`text-xs font-bold px-2 py-1 rounded ${
                    formData.prefer_food_orders
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {formData.prefer_food_orders ? 'ON' : 'OFF'}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Package size={18} className="text-primary" />
                  <span className="font-bold text-dark">Grocery Orders</span>
                </div>
                <span
                  className={`text-xs font-bold px-2 py-1 rounded ${
                    formData.prefer_grocery_orders
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {formData.prefer_grocery_orders ? 'ON' : 'OFF'}
                </span>
              </div>
            </div>
          </div>

          {/* Notifications */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-dark">Notification Settings</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Bell size={18} className="text-primary" />
                  <span className="font-bold text-dark">Push Notifications</span>
                </div>
                <span
                  className={`text-xs font-bold px-2 py-1 rounded ${
                    formData.notifications_enabled
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {formData.notifications_enabled ? 'ON' : 'OFF'}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="font-bold text-dark">SMS Notifications</span>
                <span
                  className={`text-xs font-bold px-2 py-1 rounded ${
                    formData.sms_notifications
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {formData.sms_notifications ? 'ON' : 'OFF'}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="font-bold text-dark">Email Notifications</span>
                <span
                  className={`text-xs font-bold px-2 py-1 rounded ${
                    formData.email_notifications
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {formData.email_notifications ? 'ON' : 'OFF'}
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        // Edit Mode
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Delivery Preferences */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-dark">Delivery Preferences</h4>

            <div>
              <label className="block text-xs font-bold text-muted uppercase mb-2">
                Maximum Delivery Distance
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="5"
                  max="50"
                  value={formData.max_distance}
                  onChange={(e) => handleSliderChange('max_distance', parseInt(e.target.value))}
                  className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
                />
                <span className="text-lg font-bold text-primary min-w-fit">{formData.max_distance} km</span>
              </div>
            </div>

            <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
              <input
                type="checkbox"
                checked={formData.prefer_short_deliveries}
                onChange={() => handleToggle('prefer_short_deliveries')}
                className="w-4 h-4 text-primary rounded cursor-pointer"
              />
              <span className="font-bold text-dark">Prefer short deliveries only</span>
            </label>
          </div>

          {/* Order Types */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-dark">Order Types</h4>

            <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
              <input
                type="checkbox"
                checked={formData.prefer_food_orders}
                onChange={() => handleToggle('prefer_food_orders')}
                className="w-4 h-4 text-primary rounded cursor-pointer"
              />
              <span className="font-bold text-dark">Accept Food Orders</span>
            </label>

            <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
              <input
                type="checkbox"
                checked={formData.prefer_grocery_orders}
                onChange={() => handleToggle('prefer_grocery_orders')}
                className="w-4 h-4 text-primary rounded cursor-pointer"
              />
              <span className="font-bold text-dark">Accept Grocery Orders</span>
            </label>
          </div>

          {/* Notifications */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-dark">Notification Settings</h4>

            <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
              <input
                type="checkbox"
                checked={formData.notifications_enabled}
                onChange={() => handleToggle('notifications_enabled')}
                className="w-4 h-4 text-primary rounded cursor-pointer"
              />
              <span className="font-bold text-dark">Push Notifications</span>
            </label>

            <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
              <input
                type="checkbox"
                checked={formData.sms_notifications}
                onChange={() => handleToggle('sms_notifications')}
                className="w-4 h-4 text-primary rounded cursor-pointer"
              />
              <span className="font-bold text-dark">SMS Notifications</span>
            </label>

            <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
              <input
                type="checkbox"
                checked={formData.email_notifications}
                onChange={() => handleToggle('email_notifications')}
                className="w-4 h-4 text-primary rounded cursor-pointer"
              />
              <span className="font-bold text-dark">Email Notifications</span>
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="flex-1 px-4 py-2 border-2 border-gray-200 text-dark font-bold rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-primary hover:bg-primary-hover disabled:opacity-50 text-white font-bold rounded-lg flex items-center justify-center gap-2"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading ? 'Saving...' : 'Save Preferences'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default PreferencesForm;
