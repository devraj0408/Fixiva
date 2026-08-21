import { useState, useEffect, useRef } from 'react';
import { MapPin, Loader2, Check, Search, Navigation } from 'lucide-react';
import { reverseGeocodeCoords, searchAddressNominatim, createLocationObject } from '../../services/locationService';

const OpenStreetMapPicker = ({
  initialLat = 23.3700,
  initialLng = 85.3300,
  onConfirmLocation,
  onCancel
}) => {
  const mapRef = useRef(null);
  const leafletInstanceRef = useRef(null);
  const markerRef = useRef(null);

  const [loadingMap, setLoadingMap] = useState(true);
  const [geocoding, setGeocoding] = useState(false);
  const [currentLoc, setCurrentLoc] = useState(null);

  // Search inside map state
  const [mapSearchQuery, setMapSearchQuery] = useState('');
  const [mapSearching, setMapSearching] = useState(false);
  const [mapSearchResults, setMapSearchResults] = useState([]);
  const debounceTimerRef = useRef(null);

  // Load Leaflet dynamically if needed
  useEffect(() => {
    let isMounted = true;

    const loadLeaflet = async () => {
      if (!document.getElementById('leaflet-css')) {
        const link = document.createElement('link');
        link.id = 'leaflet-css';
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }

      if (!window.L) {
        await new Promise((resolve, reject) => {
          if (document.getElementById('leaflet-js')) {
            const checkTimer = setInterval(() => {
              if (window.L) {
                clearInterval(checkTimer);
                resolve();
              }
            }, 100);
            return;
          }
          const script = document.createElement('script');
          script.id = 'leaflet-js';
          script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
          script.onload = resolve;
          script.onerror = reject;
          document.body.appendChild(script);
        });
      }

      if (isMounted) {
        setLoadingMap(false);
      }
    };

    loadLeaflet().catch(err => {
      console.warn('Failed to load Leaflet:', err);
      if (isMounted) setLoadingMap(false);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  // Update address when pin moves or map pans
  const updateAddressForCoords = async (lat, lng) => {
    setGeocoding(true);
    try {
      const res = await reverseGeocodeCoords(lat, lng);
      if (res) {
        setCurrentLoc({
          ...res,
          location_source: 'map'
        });
      }
    } catch (e) {
      console.warn('Reverse geocode error on map:', e);
    } finally {
      setGeocoding(false);
    }
  };

  // Initialize Map
  useEffect(() => {
    if (loadingMap || !mapRef.current || leafletInstanceRef.current || !window.L) return;

    const L = window.L;
    const centerLat = Number(initialLat) || 23.3700;
    const centerLng = Number(initialLng) || 85.3300;

    const map = L.map(mapRef.current, {
      center: [centerLat, centerLng],
      zoom: 15,
      zoomControl: true
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    const customIcon = L.divIcon({
      className: 'custom-map-pin',
      html: `
        <div style="
          width: 36px;
          height: 36px;
          background: #2563eb;
          border: 3px solid #ffffff;
          border-radius: 50%;
          box-shadow: 0 6px 16px rgba(37,99,235,0.45);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 18px;
          cursor: move;
          transform: translate(-2px, -2px);
        ">
          📍
        </div>
      `,
      iconSize: [36, 36],
      iconAnchor: [18, 18]
    });

    const marker = L.marker([centerLat, centerLng], {
      draggable: true,
      icon: customIcon
    }).addTo(map);

    markerRef.current = marker;
    leafletInstanceRef.current = map;

    // Trigger invalidateSize to prevent rendering issues in modal/animated containers
    setTimeout(() => {
      if (map) {
        map.invalidateSize();
      }
    }, 150);

    // Initial reverse geocode
    updateAddressForCoords(centerLat, centerLng);

    marker.on('dragend', () => {
      const pos = marker.getLatLng();
      updateAddressForCoords(pos.lat, pos.lng);
    });

    map.on('click', (e) => {
      const { lat, lng } = e.latlng;
      marker.setLatLng([lat, lng]);
      updateAddressForCoords(lat, lng);
    });

    return () => {
      if (leafletInstanceRef.current) {
        leafletInstanceRef.current.remove();
        leafletInstanceRef.current = null;
      }
    };
  }, [loadingMap, initialLat, initialLng]);

  // Handle Search Input in Map
  const handleMapSearchChange = (e) => {
    const query = e.target.value;
    setMapSearchQuery(query);

    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

    if (!query || query.trim().length < 3) {
      setMapSearchResults([]);
      setMapSearching(false);
      return;
    }

    setMapSearching(true);
    debounceTimerRef.current = setTimeout(async () => {
      try {
        const results = await searchAddressNominatim(query);
        setMapSearchResults(results);
      } catch (err) {
        console.warn('Map search error:', err);
      } finally {
        setMapSearching(false);
      }
    }, 300);
  };

  // Select search result inside Map
  const handleSelectMapSearchResult = (item) => {
    const lat = Number(item.latitude);
    const lng = Number(item.longitude);

    if (!isNaN(lat) && !isNaN(lng) && leafletInstanceRef.current && markerRef.current) {
      leafletInstanceRef.current.flyTo([lat, lng], 16, { animate: true, duration: 1.2 });
      markerRef.current.setLatLng([lat, lng]);
      const locObj = createLocationObject({
        ...item,
        location_source: 'map'
      });
      setCurrentLoc(locObj);
    }
    setMapSearchQuery('');
    setMapSearchResults([]);
  };

  // Jump to user's current GPS location on map
  const handleJumpToGPS = () => {
    if (!navigator.geolocation) return;
    setGeocoding(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        if (leafletInstanceRef.current && markerRef.current) {
          leafletInstanceRef.current.flyTo([lat, lng], 16, { animate: true, duration: 1.2 });
          markerRef.current.setLatLng([lat, lng]);
          updateAddressForCoords(lat, lng);
        }
      },
      () => setGeocoding(false),
      { enableHighAccuracy: true, timeout: 5000 }
    );
  };

  return (
    <div className="space-y-4">
      {/* Top Search Bar over Map */}
      <div className="relative z-20">
        <div className="relative">
          <input
            type="text"
            value={mapSearchQuery}
            onChange={handleMapSearchChange}
            placeholder="Search this area, landmark or address..."
            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
          />
          <Search size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
          {mapSearching && (
            <Loader2 size={16} className="absolute right-3.5 top-3.5 animate-spin text-primary" />
          )}
        </div>

        {/* Live Search Suggestions Dropdown */}
        {mapSearchResults.length > 0 && (
          <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden max-h-52 overflow-y-auto z-30 p-2 space-y-1">
            {mapSearchResults.map((res) => (
              <button
                key={res.id || res.address}
                type="button"
                onClick={() => handleSelectMapSearchResult(res)}
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

      {/* Map Container */}
      <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-inner bg-slate-100 min-h-[300px] h-80 w-full">
        {loadingMap && (
          <div className="absolute inset-0 z-10 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center gap-2 text-slate-500 text-xs font-bold">
            <Loader2 size={24} className="animate-spin text-primary" />
            Loading Map...
          </div>
        )}

        <div ref={mapRef} className="w-full h-full min-h-[300px]" />

        {/* In-Map GPS Jump Button */}
        <button
          type="button"
          onClick={handleJumpToGPS}
          title="Jump to my location"
          className="absolute bottom-4 right-4 z-[400] p-3 bg-white hover:bg-slate-50 text-primary rounded-xl shadow-lg border border-slate-200 transition-all active:scale-95 flex items-center gap-1.5 text-xs font-bold"
        >
          <Navigation size={15} />
          <span>My GPS</span>
        </button>
      </div>

      {/* Bottom Selected Location Preview Banner */}
      <div className="p-4 rounded-2xl bg-blue-50/80 border border-blue-100 flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-primary text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
          <MapPin size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-black uppercase tracking-wide text-primary bg-white px-2 py-0.5 rounded border border-blue-200">
              Selected Map Location
            </span>
            {geocoding && (
              <span className="text-[11px] text-slate-500 flex items-center gap-1 font-semibold">
                <Loader2 size={12} className="animate-spin text-primary" /> Reverse geocoding...
              </span>
            )}
          </div>
          <p className="text-xs font-black text-slate-900 mt-1 truncate">
            {currentLoc?.address || 'Drag pin or click map to select location'}
          </p>
          {currentLoc && (
            <p className="text-[11px] font-medium text-slate-500 mt-0.5 truncate">
              {[currentLoc.locality, currentLoc.district, currentLoc.state, currentLoc.pincode].filter(Boolean).join(' · ')}
            </p>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-3">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-3 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
          >
            Cancel
          </button>
        )}
        <button
          type="button"
          disabled={!currentLoc || geocoding}
          onClick={() => currentLoc && onConfirmLocation(currentLoc)}
          className="flex-1 py-3 text-xs font-black text-white bg-primary hover:bg-primary/90 rounded-xl shadow-md flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
        >
          <Check size={16} />
          Confirm Location
        </button>
      </div>
    </div>
  );
};

export default OpenStreetMapPicker;
