import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Navigation,
  Search,
  MapPin,
  Map as MapIcon,
  Check,
  RotateCcw,
  Loader2,
  ChevronDown
} from 'lucide-react';
import { detectCurrentLocation, searchAddressNominatim, reverseGeocodeCoords } from '../../services/locationService';
import OpenStreetMapPicker from './OpenStreetMapPicker';
import HierarchicalLocationSelector from '../HierarchicalLocationSelector';

const RapidoLocationSelector = ({
  initialState = 'Jharkhand',
  initialDistrict = 'Ranchi',
  initialLocality = 'Lalpur',
  initialAddress = '',
  initialLat = null,
  initialLng = null,
  onLocationConfirmed, // ({ state, district, locality, address, latitude, longitude, pincode }) => void
  className = ''
}) => {
  // Mode: 'initial' | 'detected' | 'change' | 'map'
  const [viewMode, setViewMode] = useState('initial');
  const [detecting, setDetecting] = useState(false);

  // Selected Location State
  const [selectedLoc, setSelectedLoc] = useState({
    state: initialState,
    district: initialDistrict,
    locality: initialLocality,
    formattedAddress: initialAddress || `${initialLocality}, ${initialDistrict}, ${initialState}`,
    latitude: initialLat || 23.3700,
    longitude: initialLng || 85.3300,
    pincode: '834001'
  });

  // Address Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [showManualDropdowns, setShowManualDropdowns] = useState(false);

  // Auto-detect GPS on first load if no custom address passed
  useEffect(() => {
    if (initialAddress) {
      setViewMode('detected');
    }
  }, [initialAddress]);

  // Handle "Use Current Location" (Primary Rapido CTA)
  const handleUseCurrentLocation = async () => {
    setDetecting(true);
    try {
      const res = await detectCurrentLocation();
      if (res) {
        const updated = {
          state: res.state || 'Jharkhand',
          district: res.district || 'Ranchi',
          locality: res.locality || 'Lalpur',
          formattedAddress: res.formattedAddress || `${res.locality}, ${res.district}`,
          latitude: res.latitude || 23.3700,
          longitude: res.longitude || 85.3300,
          pincode: res.pincode || '834001'
        };
        setSelectedLoc(updated);
        setViewMode('detected');
      }
    } catch (e) {
      console.warn('GPS detection failed:', e);
    } finally {
      setDetecting(false);
    }
  };

  // Handle Search Input Change
  const handleSearchChange = async (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (!query || query.trim().length < 3) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const results = await searchAddressNominatim(query);
      setSearchResults(results);
    } catch (err) {
      console.warn('Search error:', err);
    } finally {
      setSearching(false);
    }
  };

  // Select a search result
  const handleSelectSearchResult = (result) => {
    const updated = {
      state: result.state || selectedLoc.state,
      district: result.district || selectedLoc.district,
      locality: result.locality || selectedLoc.locality,
      formattedAddress: result.formattedAddress,
      latitude: result.latitude,
      longitude: result.longitude,
      pincode: result.pincode || '834001'
    };
    setSelectedLoc(updated);
    setSearchQuery('');
    setSearchResults([]);
    setViewMode('detected');
  };

  // Select location from Map Pin
  const handleConfirmMapPin = (mapLoc) => {
    const updated = {
      state: mapLoc.state || selectedLoc.state,
      district: mapLoc.district || selectedLoc.district,
      locality: mapLoc.locality || selectedLoc.locality,
      formattedAddress: mapLoc.formattedAddress,
      latitude: mapLoc.latitude,
      longitude: mapLoc.longitude,
      pincode: mapLoc.pincode || '834001'
    };
    setSelectedLoc(updated);
    setViewMode('detected');
  };

  // Final confirmation to parent flow
  const handleFinalConfirm = () => {
    if (onLocationConfirmed) {
      onLocationConfirmed(selectedLoc);
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <AnimatePresence mode="wait">
        
        {/* VIEW 1: INITIAL RAPIDO PROMPT */}
        {viewMode === 'initial' && (
          <motion.div
            key="initial"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100 space-y-6"
          >
            <div className="text-center space-y-2">
              <span className="text-[10px] font-black uppercase text-primary bg-primary/10 px-3 py-1 rounded-full border border-primary/20 tracking-wider">
                Instant Location
              </span>
              <h2 className="text-2xl font-black text-slate-900">Where should we provide the service?</h2>
              <p className="text-xs text-slate-500 max-w-sm mx-auto font-medium leading-relaxed">
                Fixiva automatically dispatches verified specialists nearby your location.
              </p>
            </div>

            {/* Primary CTA: Use Current Location */}
            <button
              type="button"
              onClick={handleUseCurrentLocation}
              disabled={detecting}
              className="w-full py-4 px-6 bg-primary hover:bg-primary/90 text-white rounded-2xl font-black text-sm shadow-lg shadow-primary/25 flex items-center justify-center gap-3 transition-all cursor-pointer transform active:scale-95 disabled:opacity-75"
            >
              {detecting ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  <span>Detecting exact location...</span>
                </>
              ) : (
                <>
                  <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
                    <Navigation size={16} />
                  </div>
                  <span>Use Current Location</span>
                </>
              )}
            </button>

            {/* Secondary Option: Change / Pick Location */}
            <div className="flex items-center justify-center gap-4 text-xs font-bold text-slate-500 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setViewMode('change')}
                className="hover:text-primary transition-colors flex items-center gap-1.5 cursor-pointer py-1"
              >
                <Search size={14} /> Search address or pick on map
              </button>
            </div>
          </motion.div>
        )}

        {/* VIEW 2: LOCATION FOUND / DETECTED CARD */}
        {viewMode === 'detected' && (
          <motion.div
            key="detected"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100 space-y-6"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Location Found
              </span>
              <button
                type="button"
                onClick={() => setViewMode('change')}
                className="text-xs font-extrabold text-primary hover:underline flex items-center gap-1 cursor-pointer"
              >
                Change Location
              </button>
            </div>

            {/* Address Card */}
            <div className="p-5 rounded-2xl bg-blue-50/70 border border-blue-100 space-y-2">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center shrink-0 shadow-md">
                  <MapPin size={22} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-black text-slate-900 leading-snug">
                    {selectedLoc.formattedAddress || `${selectedLoc.locality}, ${selectedLoc.district}`}
                  </h3>
                  <p className="text-xs font-bold text-slate-500 mt-1">
                    Locality: <span className="text-slate-800">{selectedLoc.locality}</span> | District: <span className="text-slate-800">{selectedLoc.district}</span> ({selectedLoc.state})
                  </p>
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

        {/* VIEW 3: CHANGE LOCATION SCREEN */}
        {viewMode === 'change' && (
          <motion.div
            key="change"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100 space-y-6"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-xl font-black text-slate-900">Change Service Location</h3>
                <p className="text-xs text-slate-500 mt-0.5 font-medium">Choose any of the simple options below</p>
              </div>
              <button
                type="button"
                onClick={() => setViewMode('detected')}
                className="text-xs font-bold text-slate-500 hover:text-slate-900"
              >
                Back
              </button>
            </div>

            <div className="space-y-4">
              {/* Option 1: Search Address */}
              <div className="space-y-2">
                <label className="text-xs font-extrabold text-slate-700 flex items-center gap-1.5">
                  <Search size={14} className="text-primary" /> 1. Search for an Address
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={handleSearchChange}
                    placeholder="Type area, locality, or landmark (e.g. Lalpur, Ranchi)..."
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  />
                  <Search size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
                  {searching && (
                    <Loader2 size={16} className="absolute right-3.5 top-3.5 animate-spin text-primary" />
                  )}
                </div>

                {/* Search Results Dropdown */}
                {searchResults.length > 0 && (
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden max-h-56 overflow-y-auto space-y-1 p-2">
                    {searchResults.map((res) => (
                      <div
                        key={res.id}
                        onClick={() => handleSelectSearchResult(res)}
                        className="p-2.5 rounded-xl hover:bg-blue-50/70 cursor-pointer flex items-start gap-2.5 transition-colors text-left"
                      >
                        <MapPin size={16} className="text-primary shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-bold text-slate-900 leading-snug">{res.formattedAddress}</p>
                          <p className="text-[10px] text-slate-500 font-medium">{res.locality}, {res.district}, {res.state}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Option 2: Use Current Location */}
              <button
                type="button"
                onClick={handleUseCurrentLocation}
                disabled={detecting}
                className="w-full p-4 rounded-2xl border border-slate-200 hover:border-primary bg-slate-50 hover:bg-blue-50/50 flex items-center justify-between transition-all cursor-pointer group text-left"
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
                  <span className="text-xs font-bold text-primary">Detect $\rightarrow$</span>
                )}
              </button>

              {/* Option 3: Choose on Map */}
              <button
                type="button"
                onClick={() => setViewMode('map')}
                className="w-full p-4 rounded-2xl border border-slate-200 hover:border-primary bg-slate-50 hover:bg-blue-50/50 flex items-center justify-between transition-all cursor-pointer group text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-all flex items-center justify-center shrink-0">
                    <MapIcon size={18} />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-900">3. Choose on Map</h4>
                    <p className="text-[11px] text-slate-500 font-medium">Drag interactive pin on Leaflet + OpenStreetMap</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-emerald-600">Open Map $\rightarrow$</span>
              </button>

              {/* Collapsible Manual Dropdown Selector */}
              <div className="pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowManualDropdowns(!showManualDropdowns)}
                  className="text-xs font-extrabold text-slate-500 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
                >
                  <ChevronDown size={14} className={`transform transition-transform ${showManualDropdowns ? 'rotate-180' : ''}`} />
                  Or pick via State $\rightarrow$ District $\rightarrow$ Locality dropdowns
                </button>

                {showManualDropdowns && (
                  <div className="mt-3 p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                    <HierarchicalLocationSelector
                      selectedState={selectedLoc.state}
                      selectedDistrict={selectedLoc.district}
                      selectedLocality={selectedLoc.locality}
                      onChange={({ state, district, locality }) => {
                        setSelectedLoc((prev) => ({
                          ...prev,
                          state,
                          district,
                          locality,
                          formattedAddress: `${locality}, ${district}, ${state}`
                        }));
                      }}
                      layout="col"
                    />
                    <button
                      type="button"
                      onClick={() => setViewMode('detected')}
                      className="w-full py-2.5 text-xs font-bold text-white bg-primary rounded-xl"
                    >
                      Set Dropdown Location
                    </button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* VIEW 4: INTERACTIVE MAP PICKER VIEW */}
        {viewMode === 'map' && (
          <motion.div
            key="map"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <MapIcon size={18} className="text-primary" /> Drag Pin on Map
              </h3>
              <button
                type="button"
                onClick={() => setViewMode('change')}
                className="text-xs font-bold text-slate-500 hover:text-slate-900"
              >
                Cancel Map
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
