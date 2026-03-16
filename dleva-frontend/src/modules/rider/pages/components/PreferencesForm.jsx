import React, { useState } from 'react';
import { Edit2, Save, X } from 'lucide-react';
import {
  DISTANCE_RANGE,
  ORDER_TYPE_LABELS,
  NOTIFICATION_LABELS,
  ORDER_TYPE_PREFERENCES,
  NOTIFICATION_TYPES,
  SETTINGS_INFO,
  SETTINGS_LABELS,
} from '../../constants/settingsConstants';

const PreferencesForm = ({ preferences, onSave, loading }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    max_delivery_distance: preferences?.max_delivery_distance || DISTANCE_RANGE.DEFAULT,
    accepts_food_orders: preferences?.accepts_food_orders !== false,
    accepts_grocery_orders: preferences?.accepts_grocery_orders !== false,
    accepts_short_deliveries: preferences?.accepts_short_deliveries !== false,
    notification_push: preferences?.notification_push !== false,
    notification_sms: preferences?.notification_sms === true,
    notification_email: preferences?.notification_email === true,
  });

  const handleToggle = (field) => {
    setFormData((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const handleDistanceChange = (value) => {
    setFormData((prev) => ({
      ...prev,
      max_delivery_distance: parseInt(value),
    }));
  };

  const handleSave = async () => {
    await onSave(formData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setFormData({
      max_delivery_distance: preferences?.max_delivery_distance || DISTANCE_RANGE.DEFAULT,
      accepts_food_orders: preferences?.accepts_food_orders !== false,
      accepts_grocery_orders: preferences?.accepts_grocery_orders !== false,
      accepts_short_deliveries: preferences?.accepts_short_deliveries !== false,
      notification_push: preferences?.notification_push !== false,
      notification_sms: preferences?.notification_sms === true,
      notification_email: preferences?.notification_email === true,
    });
    setIsEditing(false);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{SETTINGS_LABELS.DELIVERY_PREFERENCES}</h3>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="text-gray-600 hover:text-primary transition-colors"
          >
            <Edit2 size={18} />
          </button>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-6">
          {/* Delivery Distance Section */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <label className="block text-sm font-medium text-gray-900 mb-3">
              {SETTINGS_INFO.MAX_DELIVERY_DISTANCE}
            </label>
            <div className="space-y-2">
              <input
                type="range"
                min={DISTANCE_RANGE.MIN}
                max={DISTANCE_RANGE.MAX}
                step={DISTANCE_RANGE.STEP}
                value={formData.max_delivery_distance}
                onChange={(e) => handleDistanceChange(e.target.value)}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-gray-600">
                <span>{DISTANCE_RANGE.MIN} km</span>
                <span className="font-semibold text-primary text-lg">
                  {formData.max_delivery_distance} km
                </span>
                <span>{DISTANCE_RANGE.MAX} km</span>
              </div>
            </div>
          </div>

          {/* Order Types Section */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-900 mb-3">{SETTINGS_INFO.ORDER_TYPES_HEADER}</h4>
            <div className="space-y-3">
              {[
                ORDER_TYPE_PREFERENCES.FOOD,
                ORDER_TYPE_PREFERENCES.GROCERY,
                ORDER_TYPE_PREFERENCES.SHORT_DELIVERY,
              ].map((prefKey) => (
                <label key={prefKey} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData[prefKey]}
                    onChange={() => handleToggle(prefKey)}
                    className="w-4 h-4 text-primary rounded focus:ring-2 focus:ring-primary accent-primary"
                  />
                  <span className="text-sm text-gray-700">{ORDER_TYPE_LABELS[prefKey]}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Notifications Section */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-900 mb-3">{SETTINGS_INFO.NOTIFICATIONS_HEADER}</h4>
            <div className="space-y-3">
              {[
                NOTIFICATION_TYPES.PUSH,
                NOTIFICATION_TYPES.SMS,
                NOTIFICATION_TYPES.EMAIL,
              ].map((notifKey) => (
                <label key={notifKey} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData[notifKey]}
                    onChange={() => handleToggle(notifKey)}
                    className="w-4 h-4 text-primary rounded focus:ring-2 focus:ring-primary accent-primary"
                  />
                  <span className="text-sm text-gray-700">{NOTIFICATION_LABELS[notifKey]}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex-1 bg-primary text-white py-2 rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              <Save size={16} />
              {loading ? SETTINGS_LABELS.SAVING : SETTINGS_LABELS.SAVE_CHANGES}
            </button>
            <button
              onClick={handleCancel}
              disabled={loading}
              className="flex-1 bg-gray-200 text-gray-900 py-2 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              <X size={16} />
              {SETTINGS_LABELS.CANCEL}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Distance Display */}
          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
            <span className="text-sm text-gray-700">📍 Maximum Distance</span>
            <span className="font-semibold text-primary text-lg">
              {formData.max_delivery_distance} km
            </span>
          </div>

          {/* Order Types Display */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Order Types</h4>
            <div className="space-y-2">
              {[
                ORDER_TYPE_PREFERENCES.FOOD,
                ORDER_TYPE_PREFERENCES.GROCERY,
                ORDER_TYPE_PREFERENCES.SHORT_DELIVERY,
              ].map((prefKey) => (
                <div key={prefKey} className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">{ORDER_TYPE_LABELS[prefKey]}</span>
                  <span
                    className={`text-xs font-semibold py-1 px-2 rounded ${
                      formData[prefKey]
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-200 text-gray-800'
                    }`}
                  >
                    {formData[prefKey] ? 'ON' : 'OFF'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Notifications Display */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Notifications</h4>
            <div className="space-y-2">
              {[
                NOTIFICATION_TYPES.PUSH,
                NOTIFICATION_TYPES.SMS,
                NOTIFICATION_TYPES.EMAIL,
              ].map((notifKey) => (
                <div key={notifKey} className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">{NOTIFICATION_LABELS[notifKey]}</span>
                  <span
                    className={`text-xs font-semibold py-1 px-2 rounded ${
                      formData[notifKey]
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-200 text-gray-800'
                    }`}
                  >
                    {formData[notifKey] ? 'ON' : 'OFF'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PreferencesForm;
