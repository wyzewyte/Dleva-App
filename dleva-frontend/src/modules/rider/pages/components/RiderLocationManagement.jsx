import { useCallback, useEffect, useRef, useState } from 'react';
import { AlertCircle, ChevronRight, Clock, Loader2, MapPin, Navigation, Search, X } from 'lucide-react';
import addressSearchService from '../../../../services/addressSearchService';
import riderLocationService from '../../services/riderLocationService';

const RECENT_LOCATIONS_KEY = 'dleva_rider_recent_locations';

const normalizeLocationOption = (location) => {
  if (!location || typeof location !== 'object') return null;

  const addressValue =
    typeof location.address === 'string'
      ? location.address
      : location.address?.display_name || location.address?.address || location.display_name || '';

  return {
    ...location,
    address: addressValue || 'Selected location',
    area:
      typeof location.area === 'string'
        ? location.area
        : location.area?.name || location.city || '',
  };
};

const toLocationErrorMessage = (error) => {
  if (error?.code === 1 || error?.code === 'PERMISSION_DENIED') {
    return 'Location permission denied. Please enable it in your browser settings.';
  }
  if (error?.code === 2 || error?.code === 'POSITION_UNAVAILABLE') {
    return 'Unable to retrieve your current location right now.';
  }
  if (error?.code === 3 || error?.code === 'TIMEOUT') {
    return 'Location request timed out. Please try again.';
  }
  return error?.response?.data?.detail || error?.response?.data?.error || error?.message || 'Unable to update rider location right now.';
};

const RiderLocationManagement = ({ profile, onLocationUpdate, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [recentLocations, setRecentLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [feedback, setFeedback] = useState({ error: '', success: '' });
  const searchInputRef = useRef(null);

  const currentLocation = normalizeLocationOption({
    address: profile?.address,
    latitude: profile?.current_latitude,
    longitude: profile?.current_longitude,
    accuracy: profile?.location_accuracy || 0,
    updated_at: profile?.last_location_update,
  });

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(RECENT_LOCATIONS_KEY) || '[]');
      setRecentLocations(Array.isArray(stored) ? stored.map(normalizeLocationOption).filter(Boolean).slice(0, 5) : []);
    } catch {
      setRecentLocations([]);
    }
  }, []);

  useEffect(() => {
    if (!feedback.success) return undefined;
    const timer = window.setTimeout(() => setFeedback((current) => ({ ...current, success: '' })), 3000);
    return () => window.clearTimeout(timer);
  }, [feedback.success]);

  const persistRecentLocation = (location) => {
    const nextLocation = normalizeLocationOption(location);
    if (!nextLocation) return;

    const next = [nextLocation, ...recentLocations.filter((item) => item.address !== nextLocation.address)].slice(0, 5);
    setRecentLocations(next);
    localStorage.setItem(RECENT_LOCATIONS_KEY, JSON.stringify(next));
  };

  const performSearch = useCallback(async () => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    setSearchLoading(true);
    setSearchError('');

    try {
      const results = await addressSearchService.searchAddresses(searchQuery.trim());
      setSearchResults((results || []).map(normalizeLocationOption).filter(Boolean));
      setShowSearchResults(true);
    } catch {
      setSearchError('Failed to search locations.');
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      setShowSearchResults(false);
      return undefined;
    }

    const timer = window.setTimeout(() => {
      performSearch().catch(() => {});
    }, 300);

    return () => window.clearTimeout(timer);
  }, [performSearch, searchQuery]);

  const handleSelectLocation = (location) => {
    setSelectedLocation(normalizeLocationOption(location));
    setSearchQuery('');
    setShowSearchResults(false);
    setFeedback({ error: '', success: '' });
  };

  const handleUseCurrentLocation = async () => {
    setGpsLoading(true);
    setFeedback({ error: '', success: '' });

    try {
      const coords = await riderLocationService.getCurrentLocation();
      let addressData = null;

      try {
        addressData = await addressSearchService.reverseGeocode(coords.latitude, coords.longitude);
      } catch {
        addressData = null;
      }

      setSelectedLocation(
        normalizeLocationOption({
          address: addressData?.display_name || addressData?.address || 'Current location',
          latitude: coords.latitude,
          longitude: coords.longitude,
          accuracy: coords.accuracy || 0,
          city: addressData?.city || '',
          area: addressData?.area || '',
        })
      );
    } catch (error) {
      setFeedback({ error: toLocationErrorMessage(error), success: '' });
    } finally {
      setGpsLoading(false);
    }
  };

  const handleConfirmLocation = async () => {
    if (!selectedLocation) return;

    setSaveLoading(true);
    setFeedback({ error: '', success: '' });

    try {
      const result = await riderLocationService.updateLocation(
        selectedLocation.latitude,
        selectedLocation.longitude,
        selectedLocation.accuracy || 0
      );

      const nextLocation = normalizeLocationOption({
        ...selectedLocation,
        latitude: result?.latitude ?? selectedLocation.latitude,
        longitude: result?.longitude ?? selectedLocation.longitude,
        accuracy: result?.accuracy ?? selectedLocation.accuracy ?? 0,
      });

      persistRecentLocation(nextLocation);
      setFeedback({ error: '', success: 'Location updated successfully.' });

      if (onLocationUpdate) {
        await onLocationUpdate({
          ...nextLocation,
          timestamp: new Date().toISOString(),
        });
      }

      if (onClose) {
        onClose();
      }
    } catch (error) {
      setFeedback({ error: toLocationErrorMessage(error), success: '' });
    } finally {
      setSaveLoading(false);
    }
  };

  return (
    <div className="space-y-1">
      <div className="relative mb-3">
        <div className="flex items-center gap-3 rounded-xl bg-gray-100 px-4 py-3">
          {searchLoading ? <Loader2 size={18} className="animate-spin text-muted" /> : <Search size={18} className="text-muted" />}
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search for a location"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            onFocus={() => searchResults.length > 0 && setShowSearchResults(true)}
            className="flex-1 bg-transparent text-sm text-dark placeholder:text-muted focus:outline-none"
          />
          {searchQuery ? (
            <button type="button" onClick={() => { setSearchQuery(''); setShowSearchResults(false); }} className="text-muted transition-colors hover:text-dark">
              <X size={16} />
            </button>
          ) : null}
        </div>

        {showSearchResults && searchResults.length > 0 ? (
          <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-56 overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-lg">
            {searchResults.map((result, index) => (
              <button
                key={`${result.address}-${index}`}
                type="button"
                onClick={() => handleSelectLocation(result)}
                className="flex w-full items-start gap-3 border-b border-gray-100 px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-gray-50"
              >
                <MapPin size={16} className="mt-0.5 shrink-0 text-primary" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-dark">{result.address}</p>
                  {result.area ? <p className="text-xs text-muted">{result.area}</p> : null}
                </div>
              </button>
            ))}
          </div>
        ) : null}

        {searchError ? <div className="mt-2 flex items-center gap-2 px-1 text-xs text-red-600"><AlertCircle size={14} />{searchError}</div> : null}
      </div>

      <div className="h-px bg-gray-100" />

      <button
        type="button"
        onClick={handleUseCurrentLocation}
        disabled={gpsLoading}
        className="flex w-full items-center gap-4 rounded-xl px-1 py-3.5 text-left transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <div className="flex h-8 w-8 items-center justify-center">
          {gpsLoading ? <Loader2 size={22} className="animate-spin text-primary" /> : <Navigation size={22} className="text-primary" />}
        </div>
        <span className="text-sm font-semibold text-primary">{gpsLoading ? 'Getting location...' : 'Use your current location'}</span>
      </button>

      <div className="h-px bg-gray-100" />

      {currentLocation?.latitude && currentLocation?.longitude ? (
        <>
          <div className="px-1 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Current saved location</p>
            <div className="mt-3 rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <p className="text-sm font-semibold text-dark">{currentLocation.address || 'Location saved'}</p>
              <p className="mt-1 text-xs text-muted">
                {Number(currentLocation.latitude).toFixed(5)}, {Number(currentLocation.longitude).toFixed(5)}
              </p>
              {currentLocation.updated_at ? (
                <div className="mt-2 flex items-center gap-1.5 text-xs text-muted">
                  <Clock size={12} />
                  <span>{new Date(currentLocation.updated_at).toLocaleString()}</span>
                </div>
              ) : null}
            </div>
          </div>
          <div className="h-px bg-gray-100" />
        </>
      ) : null}

      {recentLocations.length > 0 ? (
        <>
          <div className="px-1 pt-3">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Recent locations</p>
          </div>
          <div className="space-y-1 pt-1">
            {recentLocations.map((location, index) => (
              <button
                key={`${location.address}-${index}`}
                type="button"
                onClick={() => handleSelectLocation(location)}
                className={`flex w-full items-start gap-4 rounded-xl px-1 py-3.5 text-left transition-colors hover:bg-gray-50 ${
                  selectedLocation?.address === location.address ? 'bg-primary/5' : ''
                }`}
              >
                <div className="flex h-8 w-8 items-center justify-center">
                  <MapPin size={20} className={selectedLocation?.address === location.address ? 'text-primary' : 'text-dark'} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-sm font-semibold leading-snug text-dark">{location.address}</p>
                  {location.area ? <p className="mt-0.5 text-xs text-muted">{location.area}</p> : null}
                </div>
              </button>
            ))}
          </div>
        </>
      ) : null}

      {feedback.error ? (
        <div className="mt-3 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <p>{feedback.error}</p>
        </div>
      ) : null}

      {selectedLocation ? (
        <>
          <div className="h-px bg-gray-100" />
          <div className="mt-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-white">
                <MapPin size={16} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Selected location</p>
                <p className="mt-1 text-sm font-bold leading-snug text-dark">{selectedLocation.address}</p>
                {selectedLocation.area ? <p className="mt-0.5 text-xs text-muted">{selectedLocation.area}</p> : null}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSelectedLocation(null)}
              className="mt-3 text-xs font-semibold text-primary transition-colors hover:opacity-80"
            >
              Change selection
            </button>
          </div>

          <button
            type="button"
            onClick={handleConfirmLocation}
            disabled={saveLoading}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-4 font-bold text-white transition-colors hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saveLoading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Updating...
              </>
            ) : (
              <>
                Update rider location
                <ChevronRight size={18} />
              </>
            )}
          </button>
        </>
      ) : null}

      {feedback.success ? <p className="mt-3 text-sm font-medium text-emerald-700">{feedback.success}</p> : null}
    </div>
  );
};

export default RiderLocationManagement;
