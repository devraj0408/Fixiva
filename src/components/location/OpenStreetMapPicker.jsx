import { useState, useEffect, useRef } from 'react';
import { MapPin, Loader2, Check } from 'lucide-react';
import { reverseGeocodeCoords } from '../../services/locationService';

const OpenStreetMapPicker = ({
  initialLat = 23.3700,
  initialLng = 85.3300,
  onConfirmLocation, // ({ latitude, longitude, formattedAddress, state, district, locality, pincode }) => void
  onCancel
}) => {
  const mapRef = useRef(null);
  const leafletInstanceRef = useRef(null);
  const markerRef = useRef(null);

  const [loadingMap, setLoadingMap] = useState(true);
  const [geocoding, setGeocoding] = useState(false);
  const [currentLoc, setCurrentLoc] = useState(null);

  // Load Leaflet dynamically if not already available
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

  // Handle Location Reverse Geocode when coordinates change
  const updateAddressForCoords = async (lat, lng) => {
    setGeocoding(true);
    try {
      const res = await reverseGeocodeCoords(lat, lng);
      if (res) {
        setCurrentLoc(res);
      }
    } catch (e) {
      console.warn('Reverse geocode error on map drag:', e);
    } finally {
      setGeocoding(false);
    }
  };

  // Initialize Map once Leaflet is ready
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

    // Custom pulse marker icon
    const customIcon = L.divIcon({
      className: 'custom-map-pin',
      html: `
        <div style="
          width: 32px;
          height: 32px;
          background: #2563eb;
          border: 3px solid #ffffff;
          border-radius: 50%;
          box-shadow: 0 4px 12px rgba(37,99,235,0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          cursor: move;
        ">
          📍
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });

    const marker = L.marker([centerLat, centerLng], {
      draggable: true,
      icon: customIcon
    }).addTo(map);

    markerRef.current = marker;
    leafletInstanceRef.current = map;

    // Initial reverse geocode
    updateAddressForCoords(centerLat, centerLng);

    // Marker drag end event
    marker.on('dragend', () => {
      const pos = marker.getLatLng();
      updateAddressForCoords(pos.lat, pos.lng);
    });

    // Map click event (moves pin to click location)
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

  return (
    <div className="space-y-4">
      {/* Readable Address Banner */}
      <div className="p-4 rounded-2xl bg-blue-50/80 border border-blue-100 flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-primary text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
          <MapPin size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase text-primary bg-white px-2 py-0.5 rounded border border-blue-200">
              Drag Pin to Adjust
            </span>
            {geocoding && (
              <span className="text-[11px] text-slate-500 flex items-center gap-1 font-semibold">
                <Loader2 size={12} className="animate-spin text-primary" /> Resolving address...
              </span>
            )}
          </div>
          <p className="text-xs font-black text-slate-900 mt-1 truncate">
            {currentLoc?.formattedAddress || 'Tap map or drag pin to select location'}
          </p>
          {currentLoc && (
            <p className="text-[11px] font-medium text-slate-500 mt-0.5">
              {currentLoc.locality}, {currentLoc.district}, {currentLoc.state} {currentLoc.pincode}
            </p>
          )}
        </div>
      </div>

      {/* Map Container */}
      <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-inner bg-slate-100 min-h-[260px] h-64">
        {loadingMap && (
          <div className="absolute inset-0 z-10 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center gap-2 text-slate-500 text-xs font-bold">
            <Loader2 size={24} className="animate-spin text-primary" />
            Loading Map...
          </div>
        )}
        <div ref={mapRef} className="w-full h-full" />
      </div>

      {/* Confirmation Actions */}
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
          Confirm Map Location
        </button>
      </div>
    </div>
  );
};

export default OpenStreetMapPicker;
