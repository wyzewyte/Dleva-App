/**
 * GPS Permission Dialog
 * Handles permission errors and guides users to enable location
 */

import React from 'react';

const GPSPermissionDialog = ({ error, onRetry, onClose, onOpenSettings }) => {
  if (!error) return null;

  const errorMessages = {
    PERMISSION_DENIED: {
      title: 'Location Permission Denied',
      description:
        'We need your location to show nearby restaurants and calculate delivery fees. Please enable location access in your browser settings.',
      actions: [
        { label: 'Enable in Settings', onClick: onOpenSettings },
        { label: 'Try Again', onClick: onRetry },
      ],
    },
    POSITION_UNAVAILABLE: {
      title: 'Location Unavailable',
      description:
        'Your location could not be determined. Please check your GPS settings or try a different location method.',
      actions: [{ label: 'Dismiss', onClick: onClose }],
    },
    TIMEOUT: {
      title: 'Location Request Timed Out',
      description:
        'It took too long to get your location. Check your GPS and network connection, then try again.',
      actions: [
        { label: 'Try Again', onClick: onRetry },
        { label: 'Dismiss', onClick: onClose },
      ],
    },
    GEO_NOT_SUPPORTED: {
      title: 'Geolocation Not Supported',
      description:
        'Your browser does not support geolocation. Please use a modern browser or search for your address manually.',
      actions: [{ label: 'Dismiss', onClick: onClose }],
    },
  };

  const config = errorMessages[error.code] || {
    title: 'Location Error',
    description: error.message || 'Failed to get your location',
    actions: [
      { label: 'Try Again', onClick: onRetry },
      { label: 'Dismiss', onClick: onClose },
    ],
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-sm w-full">
        {/* Icon */}
        <div className="flex justify-center pt-6">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-orange-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 text-center">
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            {config.title}
          </h2>
          <p className="text-gray-600 text-sm mb-6">{config.description}</p>

          {/* Instructions for Permission Denied */}
          {error.code === 'PERMISSION_DENIED' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left text-sm text-gray-700">
              <p className="font-semibold text-blue-900 mb-2">
                How to enable location:
              </p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Click the location icon in your browser's address bar</li>
                <li>Select "Allow" or "Always Allow"</li>
                <li>Refresh the page and try again</li>
              </ol>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="px-6 pb-6 flex gap-3">
          {config.actions.map((action) => (
            <button
              key={action.label}
              onClick={action.onClick}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition ${
                action.label === 'Enable in Settings' || action.label === 'Try Again'
                  ? 'bg-blue-500 text-white hover:bg-blue-600'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {action.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GPSPermissionDialog;
