/**
 * Service Area Verification Page
 * Allows riders to select delivery zones/areas
 */

import React, { useState, useEffect } from 'react';
import { MapPin, Check, AlertCircle, Loader2, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useRiderAuth } from '../context/RiderAuthContext';
import riderVerification from '../services/riderVerification';

const ServiceAreaVerification = () => {
  const navigate = useNavigate();
  const { rider } = useRiderAuth();

  const [availableAreas, setAvailableAreas] = useState([]);
  const [selectedAreas, setSelectedAreas] = useState(new Set());
  const [previouslySelected, setPreviouslySelected] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Fetch available areas and rider's current selection
  useEffect(() => {
    fetchData();
  }, []);

  // Redirect on success after 2 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        navigate('/rider/verification-setup');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [success, navigate]);

  // Clear messages after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch available areas
      const areasData = await riderVerification.getAvailableServiceAreas();
      setAvailableAreas(areasData);

      // Fetch rider's current selection
      try {
        const currentAreas = await riderVerification.getRiderServiceAreas();
        const currentAreaCodes = new Set(currentAreas.map(area => area.area_code));
        setSelectedAreas(currentAreaCodes);
        setPreviouslySelected(new Set(currentAreaCodes));
      } catch (err) {
        // No previous selection yet, that's fine
        console.log('No previous service areas:', err);
      }

      setError(null);
    } catch (err) {
      console.error('Failed to fetch areas:', err);
      setError(err.error || 'Failed to load service areas');
    } finally {
      setLoading(false);
    }
  };

  const handleAreaToggle = (areaCode) => {
    setSelectedAreas(prev => {
      const newSet = new Set(prev);
      if (newSet.has(areaCode)) {
        newSet.delete(areaCode);
      } else {
        newSet.add(areaCode);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedAreas.size === availableAreas.length) {
      setSelectedAreas(new Set());
    } else {
      setSelectedAreas(new Set(availableAreas.map(area => area.code)));
    }
  };

  const handleSubmit = async () => {
    try {
      if (selectedAreas.size === 0) {
        setError('Please select at least one service area');
        return;
      }

      setSubmitting(true);
      const response = await riderVerification.setServiceAreas(Array.from(selectedAreas));
      
      setSuccess('✓ Service areas saved successfully!');
      setError(null);
      setPreviouslySelected(new Set(selectedAreas));
    } catch (err) {
      console.error('Failed to save service areas:', err);
      setError(err.error || 'Failed to save service areas');
      setSuccess(null);
    } finally {
      setSubmitting(false);
    }
  };

  const hasChanges = selectedAreas.size !== previouslySelected.size || 
    [...selectedAreas].some(area => !previouslySelected.has(area));

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading service areas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex items-center gap-3 mb-2">
            <MapPin className="w-6 h-6 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">Service Areas</h1>
          </div>
          <p className="text-gray-600">Select the zones where you want to deliver orders</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-800 font-medium">Error</p>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Success Alert */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
            <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-green-800 font-medium">Success</p>
              <p className="text-green-700 text-sm">{success}</p>
              <p className="text-green-700 text-xs mt-1">Redirecting...</p>
            </div>
          </div>
        )}

        {/* Info Box */}
        <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-blue-800 text-sm">
            💡 <strong>Tip:</strong> Select the areas you want to serve. You can update this anytime.
          </p>
        </div>

        {/* Service Areas Grid */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {/* Select All */}
          <div className="border-b p-4 flex items-center gap-3 bg-gray-50">
            <input
              type="checkbox"
              id="select-all"
              checked={selectedAreas.size === availableAreas.length && availableAreas.length > 0}
              onChange={handleSelectAll}
              className="w-5 h-5 text-blue-600 cursor-pointer rounded"
            />
            <label htmlFor="select-all" className="flex-1 cursor-pointer font-medium text-gray-900">
              Select All Areas ({selectedAreas.size}/{availableAreas.length})
            </label>
          </div>

          {/* Areas List */}
          <div className="divide-y">
            {availableAreas.map(area => (
              <div
                key={area.code}
                className="p-4 hover:bg-gray-50 transition-colors"
              >
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedAreas.has(area.code)}
                    onChange={() => handleAreaToggle(area.code)}
                    className="w-5 h-5 text-blue-600 rounded cursor-pointer"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 flex items-center gap-2">
                      <span>{area.icon}</span>
                      {area.name}
                    </div>
                  </div>
                  {previouslySelected.has(area.code) && !selectedAreas.has(area.code) && (
                    <span className="text-xs text-gray-500">(previously selected)</span>
                  )}
                  {selectedAreas.has(area.code) && (
                    <Check className="w-5 h-5 text-green-600" />
                  )}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Selection Summary */}
        {selectedAreas.size > 0 && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-800 text-sm">
              <strong>Selected areas ({selectedAreas.size}):</strong>{' '}
              {availableAreas
                .filter(area => selectedAreas.has(area.code))
                .map(area => area.name)
                .join(', ')}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-8 flex gap-4">
          <button
            onClick={() => navigate('/rider/verification-setup')}
            className="flex-1 px-6 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Back
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || selectedAreas.size === 0 || !hasChanges}
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                Save Selection
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

        {/* Help Text */}
        <div className="mt-6 text-center text-sm text-gray-600">
          <p>You can always update your service areas later from your profile settings.</p>
        </div>
      </div>
    </div>
  );
};

export default ServiceAreaVerification;
