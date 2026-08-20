import { useEffect } from 'react';
import SearchableDropdown from './SearchableDropdown';
import { STATES, getDistrictsForState, getLocalitiesForDistrict, OTHER_LOCATION_OPTION } from '../data/locationData';
import { MapPin } from 'lucide-react';
import { useApp } from '../context/AuthContext';

const HierarchicalLocationSelector = ({
  selectedState = '',
  selectedDistrict = '',
  selectedLocality = '',
  onChange, // Callback when selection changes: ({ state, district, locality }) => void
  disabled = false,
  statePlaceholder = 'Select State',
  districtPlaceholder = 'Select District',
  localityPlaceholder = 'Select Locality',
  layout = 'row', // 'row' | 'col'
  className = '',
  variant = 'boxed',
  showLocality = true,
  id
}) => {
  const { states = [], districts = [] } = useApp();

  // Load from localStorage on mount if no initial props are provided
  useEffect(() => {
    if (!selectedState && !selectedDistrict) {
      const savedState = localStorage.getItem('fixiva:last-state') || 'Jharkhand';
      const savedDistrict = localStorage.getItem('fixiva:last-district') || 'Ranchi';
      const savedLocality = localStorage.getItem('fixiva:last-locality') || 'Lalpur';
      if (onChange) {
        setTimeout(() => {
          onChange({ state: savedState, district: savedDistrict, locality: savedLocality });
        }, 0);
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleStateChange = (newState) => {
    const finalState = newState || '';
    if (finalState) {
      localStorage.setItem('fixiva:last-state', finalState);
    } else {
      localStorage.removeItem('fixiva:last-state');
    }
    localStorage.removeItem('fixiva:last-district');
    localStorage.removeItem('fixiva:last-locality');
    
    // Auto-select first district for user convenience
    const districtsForState = getDistrictsForState(finalState);
    const defaultDist = districtsForState[0] || '';
    const localities = defaultDist ? getLocalitiesForDistrict(defaultDist, finalState) : [];
    const defaultLoc = localities[0]?.name || '';

    if (onChange) {
      onChange({ state: finalState, district: defaultDist, locality: defaultLoc });
    }
  };

  const handleDistrictChange = (newDistrict) => {
    const finalDistrict = newDistrict || '';
    if (finalDistrict) {
      localStorage.setItem('fixiva:last-district', finalDistrict);
    } else {
      localStorage.removeItem('fixiva:last-district');
    }
    localStorage.removeItem('fixiva:last-locality');

    const localities = finalDistrict ? getLocalitiesForDistrict(finalDistrict, selectedState) : [];
    const defaultLoc = localities[0]?.name || '';
    
    if (onChange) {
      onChange({ state: selectedState, district: finalDistrict, locality: defaultLoc });
    }
  };

  const handleLocalityChange = (newLocality) => {
    const finalLocality = newLocality || '';
    if (finalLocality) {
      localStorage.setItem('fixiva:last-locality', finalLocality);
    } else {
      localStorage.removeItem('fixiva:last-locality');
    }

    if (onChange) {
      onChange({ state: selectedState, district: selectedDistrict, locality: finalLocality });
    }
  };

  const safeSelectedState = typeof selectedState === 'object' && selectedState !== null
    ? String(selectedState.state || selectedState.name || '')
    : String(selectedState || '');

  const safeSelectedDistrict = typeof selectedDistrict === 'object' && selectedDistrict !== null
    ? String(selectedDistrict.district || selectedDistrict.name || '')
    : String(selectedDistrict || '');

  const safeSelectedLocality = typeof selectedLocality === 'object' && selectedLocality !== null
    ? String(selectedLocality.locality || selectedLocality.name || '')
    : String(selectedLocality || '');

  // State Options: All 28 States + 8 UTs sorted alphabetically with OTHER_LOCATION_OPTION at the very end
  const rawStates = (states && states.length > 0)
    ? states.filter(s => s.status !== 'Disabled').map(s => s.name)
    : STATES.filter(s => s !== OTHER_LOCATION_OPTION);

  const cleanStates = Array.from(new Set([
    ...rawStates,
    ...(safeSelectedState && safeSelectedState !== OTHER_LOCATION_OPTION ? [safeSelectedState] : [])
  ].filter(Boolean))).sort();

  const stateOptions = [...cleanStates, OTHER_LOCATION_OPTION];

  // District Options: Belonging to selected State/UT with OTHER_LOCATION_OPTION at the very end
  let districtOptions = [];
  if (safeSelectedState) {
    if (safeSelectedState === OTHER_LOCATION_OPTION) {
      districtOptions = [OTHER_LOCATION_OPTION];
    } else {
      const rawDists = getDistrictsForState(safeSelectedState, safeSelectedDistrict ? [safeSelectedDistrict] : districts)
        .filter(d => d !== OTHER_LOCATION_OPTION);
      if (safeSelectedDistrict && safeSelectedDistrict !== OTHER_LOCATION_OPTION && !rawDists.some(d => d.toLowerCase() === safeSelectedDistrict.toLowerCase())) {
        rawDists.unshift(safeSelectedDistrict);
      }
      districtOptions = [...Array.from(new Set(rawDists)).sort(), OTHER_LOCATION_OPTION];
    }
  }

  // Locality Options: Belonging to selected District with OTHER_LOCATION_OPTION at the very end
  let localityOptions = [];
  if (safeSelectedDistrict) {
    if (safeSelectedDistrict === OTHER_LOCATION_OPTION) {
      localityOptions = [OTHER_LOCATION_OPTION];
    } else {
      const localityObjs = getLocalitiesForDistrict(safeSelectedDistrict, safeSelectedState);
      const rawLocs = Array.isArray(localityObjs) 
        ? localityObjs.map(l => typeof l === 'object' ? l.name : String(l)).filter(l => l !== OTHER_LOCATION_OPTION)
        : [];
      if (safeSelectedLocality && safeSelectedLocality !== OTHER_LOCATION_OPTION && !rawLocs.some(l => l.toLowerCase() === safeSelectedLocality.toLowerCase())) {
        rawLocs.unshift(safeSelectedLocality);
      }
      localityOptions = [...Array.from(new Set(rawLocs)), OTHER_LOCATION_OPTION];
    }
  }

  const isOtherSelected = 
    selectedState === OTHER_LOCATION_OPTION || 
    selectedDistrict === OTHER_LOCATION_OPTION || 
    selectedLocality === OTHER_LOCATION_OPTION ||
    (selectedLocality && (selectedLocality.startsWith('Custom: ') || !localityOptions.includes(selectedLocality)));

  const customValue = isOtherSelected && selectedLocality && selectedLocality !== OTHER_LOCATION_OPTION
    ? selectedLocality.replace(/^Custom:\s*/, '')
    : '';

  const handleCustomTextChange = (text) => {
    const customLoc = text.trim() ? `Custom: ${text}` : OTHER_LOCATION_OPTION;
    if (onChange) {
      onChange({
        state: selectedState || 'Other',
        district: selectedDistrict || 'Other',
        locality: customLoc,
        customLocationText: text,
        latitude: null,
        longitude: null
      });
    }
  };

  return (
    <div className="w-full space-y-2">
      <div className={`flex ${layout === 'row' ? 'flex-col sm:flex-row gap-2' : 'flex-col gap-2'} ${className}`} id={id}>
        {/* State Selector */}
        <div className="flex-1 min-w-0 relative">
          <SearchableDropdown
            options={stateOptions}
            value={selectedState}
            onChange={handleStateChange}
            placeholder={statePlaceholder}
            searchPlaceholder="Search state..."
            disabled={disabled}
            icon={MapPin}
            variant={variant}
          />
        </div>

        {/* District Selector */}
        <div className="flex-1 min-w-0 relative">
          <SearchableDropdown
            options={districtOptions}
            value={selectedDistrict}
            onChange={handleDistrictChange}
            placeholder={districtPlaceholder}
            searchPlaceholder="Search district..."
            disabled={disabled || !selectedState}
            icon={MapPin}
            variant={variant}
          />
        </div>

        {/* Locality Selector (Optional) */}
        {showLocality && (
          <div className="flex-1 min-w-0 relative">
            <SearchableDropdown
              options={localityOptions}
              value={selectedLocality}
              onChange={handleLocalityChange}
              placeholder={localityPlaceholder}
              searchPlaceholder="Search locality..."
              disabled={disabled || !selectedDistrict}
              icon={MapPin}
              variant={variant}
            />
          </div>
        )}
      </div>

      {/* Manual Input Fallback when "Other / Can't find your location?" is selected */}
      {isOtherSelected && (
        <div className="w-full pt-1">
          <label className="block text-[11px] font-bold text-slate-700 mb-1">Enter your location</label>
          <input
            type="text"
            value={customValue}
            onChange={(e) => handleCustomTextChange(e.target.value)}
            placeholder="Enter area, locality, landmark or full address"
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
        </div>
      )}
    </div>
  );
};

export default HierarchicalLocationSelector;
