import { useCallback, useEffect, useRef, useState } from 'react';
import { AlertCircle, Check, ChevronRight, Loader2, MapPin, Navigation, Search, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import addressSearchService from '../../../services/addressSearchService';
import locationManager from '../../../services/locationManager';
import riderVerification from '../services/riderVerification';
import {
  RiderCard,
  RiderPageHeader,
  RiderPageShell,
} from '../components/ui/RiderPrimitives';

const normalizeLocationOption = (location) => {
  if (!location || typeof location !== 'object') return null;

  const address =
    typeof location.address === 'string'
      ? location.address
      : location.address?.display_name || location.address?.address || location.display_name || '';

  return {
    ...location,
    address: address || 'Selected location',
    area: typeof location.area === 'string' ? location.area : location.area?.name || location.city || '',
  };
};

const LocationSetup = () => {
  const navigate = useNavigate();
  const searchInputRef = useRef(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState('');
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [savedLocation, setSavedLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const loadLocation = async () => {
      try {
        const response = await riderVerification.getLocationSetup();
        if (response.location) {
          const current = normalizeLocationOption(response.location);
          setSavedLocation(current);
          setSelectedLocation(current);
        }
      } catch (err) {
        setError(err.error || 'Failed to load your saved location.');
      } finally {
        setLoading(false);
      }
    };

    loadLocation();
  }, []);

  const performSearch = useCallback(async () => {
    if (searchQuery.trim().length < 2) return;

    setSearchLoading(true);
    setSearchError('');

    try {
      const results = await addressSearchService.searchAddresses(searchQuery);
      setSearchResults((results || []).map(normalizeLocationOption).filter(Boolean));
      setShowSearchResults(true);
    } catch {
      setSearchError('Failed to search addresses.');
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

    const searchTimeout = window.setTimeout(() => {
      performSearch();
    }, 300);

    return () => window.clearTimeout(searchTimeout);
  }, [performSearch, searchQuery]);

  const handleSelectLocation = (location) => {
    setSelectedLocation(normalizeLocationOption(location));
    setSearchQuery('');
    setShowSearchResults(false);
    setError('');
    setSuccess('');
  };

  const handleUseCurrentLocation = async () => {
    setGpsLoading(true);
    setGpsError('');
    setError('');
    setSuccess('');

    try {
      const gpsLocation = await locationManager.requestGPSLocation();
      const addressData = await locationManager.reverseGeocode(gpsLocation.latitude, gpsLocation.longitude);
      setSelectedLocation(normalizeLocationOption({
        address: addressData.display_name || addressData.address || 'Current location',
        latitude: gpsLocation.latitude,
        longitude: gpsLocation.longitude,
        accuracy: gpsLocation.accuracy,
        city: addressData.city,
        area: addressData.area,
      }));
    } catch (err) {
      setGpsError(err.message || err.error || 'Could not get your current location. Please search for your address instead.');
    } finally {
      setGpsLoading(false);
    }
  };

  const handleConfirmLocation = async () => {
    if (!selectedLocation) return;

    setSaveLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await riderVerification.saveLocationSetup(selectedLocation);
      const location = normalizeLocationOption(response.location);
      setSavedLocation(location);
      setSelectedLocation(location);
      setSuccess('Location saved successfully.');
      window.setTimeout(() => navigate('/rider/verification-setup'), 900);
    } catch (err) {
      setError(err.error || 'Failed to save location. Please try again.');
    } finally {
      setSaveLoading(false);
    }
  };

  if (loading) {
    return (
      <RiderPageShell maxWidth="max-w-3xl">
        <RiderPageHeader title="Location setup" showBack onBack={() => navigate('/rider/verification-setup')} sticky />
        <RiderCard className="mt-6 p-6">
          <div className="flex items-center gap-3 text-muted">
            <Loader2 size={18} className="animate-spin text-primary" />
            <p className="text-sm font-medium">Loading your location...</p>
          </div>
        </RiderCard>
      </RiderPageShell>
    );
  }

  return (
    <RiderPageShell maxWidth="max-w-3xl">
      <RiderPageHeader
        title="Location setup"
        subtitle="Set the location you want Dleva to use for rider matching and delivery requests."
        showBack
        onBack={() => navigate('/rider/verification-setup')}
        sticky
      />

      <div className="space-y-5 py-6">
        {error ? (
          <RiderCard className="border-red-100 bg-red-50 p-4">
            <div className="flex items-start gap-3 text-red-700">
              <AlertCircle size={18} className="mt-0.5 shrink-0" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          </RiderCard>
        ) : null}

        {success ? (
          <RiderCard className="border-emerald-100 bg-emerald-50 p-4">
            <div className="flex items-start gap-3 text-emerald-700">
              <Check size={18} className="mt-0.5 shrink-0" />
              <p className="text-sm font-medium">{success}</p>
            </div>
          </RiderCard>
        ) : null}

        <RiderCard className="p-5 sm:p-6">
          <div className="relative mb-3">
            <div className="flex items-center gap-3 rounded-xl bg-gray-100 px-4 py-3">
              {searchLoading ? (
                <Loader2 size={18} className="shrink-0 animate-spin text-muted" />
              ) : (
                <Search size={18} className="shrink-0 text-muted" />
              )}
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Enter a new address"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                onFocus={() => searchResults.length > 0 && setShowSearchResults(true)}
                className="flex-1 bg-transparent text-sm text-dark placeholder:text-muted focus:outline-none"
              />
              {searchQuery ? (
                <button type="button" onClick={() => { setSearchQuery(''); setShowSearchResults(false); }} className="text-muted hover:text-dark">
                  <X size={16} />
                </button>
              ) : null}
            </div>

            {showSearchResults && searchResults.length > 0 ? (
              <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-56 overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-lg">
                {searchResults.map((result) => (
                  <button
                    key={`${result.latitude}-${result.longitude}-${result.address}`}
                    type="button"
                    onClick={() => handleSelectLocation(result)}
                    className="w-full border-b border-gray-100 px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-gray-50"
                  >
                    <div className="flex items-start gap-3">
                      <MapPin size={16} className="mt-0.5 shrink-0 text-primary" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-dark">{result.address}</p>
                        {result.area ? <p className="text-xs text-muted">{result.area}</p> : null}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : null}

            {searchError ? (
              <div className="mt-2 flex items-center gap-2 px-1 text-xs text-red-600">
                <AlertCircle size={14} />
                {searchError}
              </div>
            ) : null}
          </div>

          <div className="h-px bg-gray-100" />

          <button
            type="button"
            onClick={handleUseCurrentLocation}
            disabled={gpsLoading}
            className="flex w-full items-center gap-4 rounded-xl px-1 py-3.5 text-left transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center">
              {gpsLoading ? <Loader2 size={22} className="animate-spin text-primary" /> : <Navigation size={22} className="text-primary" />}
            </div>
            <span className="text-sm font-semibold text-primary">{gpsLoading ? 'Getting location...' : 'Use your current location'}</span>
          </button>

          {gpsError ? (
            <div className="mx-1 mb-2 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-3">
              <AlertCircle size={15} className="mt-0.5 shrink-0 text-red-600" />
              <p className="text-xs text-red-700">{gpsError}</p>
            </div>
          ) : null}

          <div className="h-px bg-gray-100" />

          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setShowSearchResults(false);
              setSelectedLocation(null);
              searchInputRef.current?.focus();
            }}
            className="flex w-full items-center gap-4 rounded-xl px-1 py-3.5 text-left transition-colors hover:bg-gray-50"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center">
              <MapPin size={22} className="text-primary" />
            </div>
            <span className="text-sm font-semibold text-primary">Save new address</span>
          </button>

          {savedLocation ? (
            <>
              <div className="h-px bg-gray-100" />
              <button type="button" onClick={() => handleSelectLocation(savedLocation)} className="flex w-full items-start gap-4 rounded-xl px-1 py-3.5 text-left transition-colors hover:bg-gray-50">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center">
                  <MapPin size={20} className="text-dark" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold leading-snug text-dark">{savedLocation.address}</p>
                  {savedLocation.area ? <p className="mt-0.5 text-xs text-muted">{savedLocation.area}</p> : null}
                </div>
              </button>
            </>
          ) : null}

          {selectedLocation ? (
            <>
              <div className="h-px bg-gray-100" />
              <div className="mt-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary">
                    <MapPin size={16} className="text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted">Selected</p>
                    <p className="mt-0.5 text-sm font-bold leading-snug text-dark">{selectedLocation.address}</p>
                    {selectedLocation.area ? <p className="mt-0.5 text-xs text-muted">{selectedLocation.area}</p> : null}
                  </div>
                </div>
                <button type="button" onClick={() => setSelectedLocation(null)} className="mt-3 text-xs font-semibold text-primary hover:opacity-80">
                  Change location
                </button>
              </div>

              <button
                type="button"
                onClick={handleConfirmLocation}
                disabled={saveLoading}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-4 font-bold text-white transition-all hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saveLoading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    Save location
                    <ChevronRight size={18} />
                  </>
                )}
              </button>
            </>
          ) : null}
        </RiderCard>
      </div>
    </RiderPageShell>
  );
};

export default LocationSetup;
