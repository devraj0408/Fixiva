import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Navigation,
  Search,
  MapPin,
  Map as MapIcon,
  Check,
  RotateCcw,
  Loader2,
  ChevronDown,
  ArrowRight,
  AlertCircle
} from 'lucide-react';
import { detectCurrentLocation, searchAddressNominatim, createLocationObject } from '../../services/locationService';
import OpenStreetMapPicker from './OpenStreetMapPicker';
import HierarchicalLocationSelector from '../HierarchicalLocationSelector';

const RapidoLocationSelector = ({
  initialState = '',
  initialDistrict = '',
  initialLocality = '',
  initialAddress = '',
  initialLat = null,
  initialLng = null,
  onLocationConfirmed,
  className = ''
}) => {
  // Mode: 'initial' | 'detected' | 'change' | 'map'
  const [viewMode, setViewMode] = useState('initial');
  const [detecting, setDetecting] = useState(false);
  const [gpsError, setGpsError] = useState(null);

  // Selected Location State (unified schema)
  const [selectedLoc, setSelectedLoc] = useState(() => {
    return createLocationObject({
      state: initialState || localStorage.getItem('fixiva:last-state') || '',
      district: initialDistrict || localStorage.getItem('fixiva:last-district') || '',
      locality: initialLocality || localStorage.getItem('fixiva:last-locality') || '',
      address: initialAddress || localStorage.getItem('fixiva:last-address') || '',
      latitude: initialLat !== null ? initialLat : parseFloat(localStorage.getItem('fixiva:last-lat')) || null,
      longitude: initialLng !== null ? initialLng : parseFloat(localStorage.getItem('fixiva:last-lng')) || null,
      location_source: 'manual'
    });
  });

  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [showManualDropdowns, setShowManualDropdowns] = useState(false);
  const searchDebounceRef = useRef(null);

  useEffect(() => {
    if (initialAddress && String(initialAddress).trim().length > 0) {
      setViewMode('detected');
    }
  }, [initialAddress]);

  // GPS Current Location handler
  const handleUseCurrentLocation = async () => {
    setDetecting(true);
    setGpsError(null);
    try {
      const res = await detectCurrentLocation();
      if (res && (res.address || res.district || res.state)) {
        const updated = createLocationObject({
          ...res,
          location_source: 'gps'
        });
        setSelectedLoc(updated);
        saveLocationToStorage(updated);
        setViewMode('detected');
      } else {
        setGpsError('Location permission is unavailable.');
      }
    } catch (e) {
      console.warn('GPS detection failed:', e);
      setGpsError('Location permission is unavailable.');
    } finally {
      setDetecting(false);
    }
  };

  // Debounced Search Input Change
  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);

    if (!query || query.trim().length < 3) {
      setSearchResults([]);
      setSearching(false);
      return;
    }

    setSearching(true);
    searchDebounceRef.current = setTimeout(async () => {
      try {
        const results = await searchAddressNominatim(query);
        setSearchResults(results);
      } catch (err) {
        console.warn('Search error:', err);
      } finally {
        setSearching(false);
      }
    }, 300);
  };

  // Select Search Result
  const handleSelectSearchResult = (result) => {
    const updated = createLocationObject({
      ...result,
      location_source: 'search'
    });
    setSelectedLoc(updated);
    saveLocationToStorage(updated);
    setSearchQuery('');
    setSearchResults([]);
    setViewMode('detected');
  };

  // Select Map Pin Location
  const handleConfirmMapPin = (mapLoc) => {
    const updated = createLocationObject({
      ...mapLoc,
      location_source: 'map'
    });
    setSelectedLoc(updated);
    saveLocationToStorage(updated);
    setViewMode('detected');
  };

  // Save unified location to localStorage
  const saveLocationToStorage = (loc) => {
    try {
      if (loc.state) localStorage.setItem('fixiva:last-state', loc.state);
      if (loc.district) localStorage.setItem('fixiva:last-district', loc.district);
      if (loc.locality) localStorage.setItem('fixiva:last-locality', loc.locality);
      if (loc.address) localStorage.setItem('fixiva:last-address', loc.address);
      if (loc.latitude) localStorage.setItem('fixiva:last-lat', String(loc.latitude));
      if (loc.longitude) localStorage.setItem('fixiva:last-lng', String(loc.longitude));
    } catch { void 0; }
  };

  // Final Confirmation to Parent Component
  const handleFinalConfirm = () => {
    saveLocationToStorage(selectedLoc);
    if (onLocationConfirmed) {
      onLocationConfirmed(selectedLoc);
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <AnimatePresence mode="wait">
        
        {/* VIEW 1: INITIAL / SEARCH PROMPT */}
        {viewMode === 'initial' && (
          <motion.div
            key="initial"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white rounded-2xl p-5 sm:p-7 shadow-sm border border-slate-200/80 space-y-5"
          >
            <div className="text-center space-y-1.5">
              <span className="text-[10px] font-black uppercase text-primary bg-primary/10 px-3 py-1 rounded-full border border-primary/20 tracking-wider">
                Service Location
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900">Where do you need service?</h2>
              <p className="text-xs text-slate-500 max-w-sm mx-auto font-medium">
                Choose any option below to set your exact service address
              </p>
            </div>

            {/* Option 1: Search Address Card */}
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                <Search size={15} className="text-primary" /> Search for an Address
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  placeholder="Search area, locality, landmark or address"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm placeholder-slate-400"
                />
                <Search size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
                {searching && (
                  <Loader2 size={16} className="absolute right-3.5 top-3.5 animate-spin text-primary" />
                )}
              </div>

              {/* Autocomplete Results */}
              {searchResults.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden max-h-56 overflow-y-auto space-y-1 p-2">
                  {searchResults.map((res) => (
                    <button
                      key={res.id || res.address}
                      type="button"
                      onClick={() => handleSelectSearchResult(res)}
                      className="w-full p-2.5 rounded-xl hover:bg-blue-50/70 cursor-pointer flex items-start gap-2.5 transition-colors text-left"
                    >
                      <MapPin size={16} className="text-primary shrink-0 mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-slate-900 leading-snug truncate">{res.address}</p>
                        <p className="text-[10px] text-slate-500 font-medium truncate">
                          {[res.locality, res.district, res.state].filter(Boolean).join(' · ')}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* GPS Error Banner if Permission Denied */}
            {gpsError && (
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-2.5 text-xs">
                <AlertCircle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-bold">{gpsError}</p>
                  <p className="text-[11px] text-amber-700 mt-0.5 font-medium">Please search your location above or choose on map below.</p>
                </div>
              </div>
            )}

            {/* Option 2: Use Current Location Card */}
            <button
              type="button"
              onClick={handleUseCurrentLocation}
              disabled={detecting}
              className="w-full p-4 rounded-xl border border-slate-200 hover:border-primary bg-slate-50/80 hover:bg-blue-50/50 flex items-center justify-between transition-all cursor-pointer group text-left shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-all flex items-center justify-center shrink-0">
                  <Navigation size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-900">📍 Use Current Location</h4>
                  <p className="text-[11px] text-slate-500 font-medium">Auto-detect position via browser GPS</p>
                </div>
              </div>
              {detecting ? (
                <Loader2 size={16} className="animate-spin text-primary" />
              ) : (
                <div className="text-xs font-bold text-primary flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                  <span>Detect</span>
                  <ArrowRight size={14} />
                </div>
              )}
            </button>

            {/* Option 3: Choose on Map Card */}
            <button
              type="button"
              onClick={() => setViewMode('map')}
              className="w-full p-4 rounded-xl border border-slate-200 hover:border-primary bg-slate-50/80 hover:bg-blue-50/50 flex items-center justify-between transition-all cursor-pointer group text-left shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-all flex items-center justify-center shrink-0">
                  <MapIcon size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-900">🗺️ Choose on Map</h4>
                  <p className="text-[11px] text-slate-500 font-medium">Drag interactive pin on OpenStreetMap</p>
                </div>
              </div>
              <div className="text-xs font-bold text-emerald-600 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                <span>Open Map</span>
                <ArrowRight size={14} />
              </div>
            </button>

            {/* Collapsible Manual Dropdowns */}
            <div className="pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowManualDropdowns(!showManualDropdowns)}
                className="text-xs font-extrabold text-slate-600 hover:text-primary flex items-center gap-1.5 cursor-pointer py-1"
              >
                <ChevronDown size={14} className={`transform transition-transform ${showManualDropdowns ? 'rotate-180' : ''}`} />
                Or pick via State → District → Locality dropdowns
              </button>

              {showManualDropdowns && (
                <div className="mt-3 p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                  <HierarchicalLocationSelector
                    selectedState={selectedLoc.state}
                    selectedDistrict={selectedLoc.district}
                    selectedLocality={selectedLoc.locality}
                    onChange={({ state, district, locality, customLocationText }) => {
                      const cleanLoc = customLocationText || (locality ? locality.replace(/^Custom:\s*/, '') : '');
                      const updated = createLocationObject({
                        state,
                        district,
                        city: district,
                        locality: cleanLoc,
                        address: cleanLoc ? `${cleanLoc}, ${district}, ${state}` : `${district}, ${state}`,
                        latitude: null,
                        longitude: null,
                        location_source: 'manual'
                      });
                      setSelectedLoc(updated);
                    }}
                    layout="col"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      saveLocationToStorage(selectedLoc);
                      setViewMode('detected');
                    }}
                    className="w-full py-3 text-xs font-black text-white bg-primary hover:bg-primary/90 rounded-xl transition-all shadow-md"
                  >
                    Confirm Dropdown Location
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* VIEW 2: UNIFIED LOCATION PREVIEW CARD */}
        {viewMode === 'detected' && (
          <motion.div
            key="detected"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="bg-white rounded-2xl p-5 sm:p-7 shadow-sm border border-slate-200/80 space-y-5"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Selected Location
              </span>
              <button
                type="button"
                onClick={() => setViewMode('change')}
                className="text-xs font-extrabold text-primary hover:underline flex items-center gap-1 cursor-pointer"
              >
                Change Location
              </button>
            </div>

            {/* Unified Preview Address Card */}
            <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-100 space-y-2">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center shrink-0 shadow-md">
                  <MapPin size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-black text-slate-900 leading-snug">
                    {selectedLoc.address || selectedLoc.location_text || `${selectedLoc.locality}, ${selectedLoc.district}`}
                  </h3>
                  <p className="text-xs font-bold text-slate-500 mt-1 truncate">
                    {[selectedLoc.locality, selectedLoc.district || selectedLoc.city, selectedLoc.state, selectedLoc.pincode].filter(Boolean).join(' · ')}
                  </p>
                  {selectedLoc.location_source && (
                    <span className="inline-block text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">
                      Source: {selectedLoc.location_source}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setViewMode('change')}
                className="w-full py-3.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <RotateCcw size={15} /> Change Location
              </button>
              <button
                type="button"
                onClick={handleFinalConfirm}
                className="w-full py-3.5 px-4 bg-primary hover:bg-primary/90 text-white font-black text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Check size={16} /> Confirm Location
              </button>
            </div>
          </motion.div>
        )}

        {/* VIEW 3: CHANGE LOCATION OPTIONS */}
        {viewMode === 'change' && (
          <motion.div
            key="change"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="bg-white rounded-2xl p-5 sm:p-7 shadow-sm border border-slate-200/80 space-y-5"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-black text-slate-900">Change Service Location</h3>
                <p className="text-xs text-slate-500 font-medium">Select any method to update location</p>
              </div>
              <button
                type="button"
                onClick={() => setViewMode(selectedLoc.address ? 'detected' : 'initial')}
                className="text-xs font-bold text-slate-500 hover:text-slate-900 cursor-pointer"
              >
                Back
              </button>
            </div>

            <div className="space-y-4">
              {/* Option 1: Search Address Input */}
              <div className="space-y-2">
                <label className="text-xs font-extrabold text-slate-700 flex items-center gap-1.5">
                  <Search size={14} className="text-primary" /> 1. Search for an Address
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={handleSearchChange}
                    placeholder="Search area, locality, landmark or address"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm placeholder-slate-400"
                  />
                  <Search size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
                  {searching && (
                    <Loader2 size={16} className="absolute right-3.5 top-3.5 animate-spin text-primary" />
                  )}
                </div>

                {searchResults.length > 0 && (
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden max-h-56 overflow-y-auto space-y-1 p-2">
                    {searchResults.map((res) => (
                      <button
                        key={res.id || res.address}
                        type="button"
                        onClick={() => handleSelectSearchResult(res)}
                        className="w-full p-2.5 rounded-xl hover:bg-blue-50/70 cursor-pointer flex items-start gap-2.5 transition-colors text-left"
                      >
                        <MapPin size={16} className="text-primary shrink-0 mt-0.5" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-slate-900 leading-snug truncate">{res.address}</p>
                          <p className="text-[10px] text-slate-500 font-medium truncate">
                            {[res.locality, res.district, res.state].filter(Boolean).join(' · ')}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Option 2: Use Current Location */}
              <button
                type="button"
                onClick={handleUseCurrentLocation}
                disabled={detecting}
                className="w-full p-4 rounded-xl border border-slate-200 hover:border-primary bg-slate-50/80 hover:bg-blue-50/50 flex items-center justify-between transition-all cursor-pointer group text-left shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-all flex items-center justify-center shrink-0">
                    <Navigation size={18} />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-900">2. Use Current Location</h4>
                    <p className="text-[11px] text-slate-500 font-medium">Detect via GPS automatically</p>
                  </div>
                </div>
                {detecting ? (
                  <Loader2 size={16} className="animate-spin text-primary" />
                ) : (
                  <div className="text-xs font-bold text-primary flex items-center gap-1">
                    <span>Detect</span>
                    <ArrowRight size={14} />
                  </div>
                )}
              </button>

              {/* Option 3: Choose on Map */}
              <button
                type="button"
                onClick={() => setViewMode('map')}
                className="w-full p-4 rounded-xl border border-slate-200 hover:border-primary bg-slate-50/80 hover:bg-blue-50/50 flex items-center justify-between transition-all cursor-pointer group text-left shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-all flex items-center justify-center shrink-0">
                    <MapIcon size={18} />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-900">3. Choose on Map</h4>
                    <p className="text-[11px] text-slate-500 font-medium">Drag interactive pin on OpenStreetMap</p>
                  </div>
                </div>
                <div className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                  <span>Open Map</span>
                  <ArrowRight size={14} />
                </div>
              </button>

              {/* Option 4: Manual Dropdowns */}
              <div className="pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowManualDropdowns(!showManualDropdowns)}
                  className="text-xs font-extrabold text-slate-600 hover:text-primary flex items-center gap-1.5 cursor-pointer py-1"
                >
                  <ChevronDown size={14} className={`transform transition-transform ${showManualDropdowns ? 'rotate-180' : ''}`} />
                  Or pick via State → District → Locality dropdowns
                </button>

                {showManualDropdowns && (
                  <div className="mt-3 p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                    <HierarchicalLocationSelector
                      selectedState={selectedLoc.state}
                      selectedDistrict={selectedLoc.district}
                      selectedLocality={selectedLoc.locality}
                      onChange={({ state, district, locality, customLocationText }) => {
                        const cleanLoc = customLocationText || (locality ? locality.replace(/^Custom:\s*/, '') : '');
                        const updated = createLocationObject({
                          state,
                          district,
                          city: district,
                          locality: cleanLoc,
                          address: cleanLoc ? `${cleanLoc}, ${district}, ${state}` : `${district}, ${state}`,
                          latitude: null,
                          longitude: null,
                          location_source: 'manual'
                        });
                        setSelectedLoc(updated);
                      }}
                      layout="col"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        saveLocationToStorage(selectedLoc);
                        setViewMode('detected');
                      }}
                      className="w-full py-3 text-xs font-black text-white bg-primary hover:bg-primary/90 rounded-xl transition-all shadow-md"
                    >
                      Set Dropdown Location
                    </button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* VIEW 4: MAP VIEW */}
        {viewMode === 'map' && (
          <motion.div
            key="map"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="bg-white rounded-2xl p-5 sm:p-7 shadow-sm border border-slate-200/80 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <MapIcon size={18} className="text-primary" /> Drag Pin on Map
              </h3>
              <button
                type="button"
                onClick={() => setViewMode('change')}
                className="text-xs font-bold text-slate-500 hover:text-slate-900 cursor-pointer"
              >
                Back to Options
              </button>
            </div>

            <OpenStreetMapPicker
              initialLat={selectedLoc.latitude}
              initialLng={selectedLoc.longitude}
              onConfirmLocation={handleConfirmMapPin}
              onCancel={() => setViewMode('change')}
            />
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
};

export default RapidoLocationSelector;
