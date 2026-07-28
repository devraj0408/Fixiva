import { useEffect } from 'react';
import SearchableDropdown from './SearchableDropdown';
import { STATES, getDistrictsForState, getLocalitiesForDistrict } from '../data/locationData';
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

  // State Options
  const stateOptions = (states && states.length > 0)
    ? states.filter(s => s.status !== 'Disabled').map(s => s.name)
    : STATES;

  // District Options
  let districtOptions = [];
  if (selectedState) {
    districtOptions = getDistrictsForState(selectedState);
    if (districtOptions.length === 0 && districts && districts.length > 0) {
      districtOptions = districts
        .filter(d => (d.state_name || '').toLowerCase() === selectedState.toLowerCase())
        .map(d => d.name);
    }
  }

  // Locality Options
  let localityOptions = [];
  if (selectedDistrict) {
    const localityObjs = getLocalitiesForDistrict(selectedDistrict, selectedState);
    localityOptions = localityObjs.map(l => l.name);
  }

  return (
    <div className={`flex ${layout === 'row' ? 'flex-col sm:flex-row gap-2.5' : 'flex-col gap-2.5'} ${className}`} id={id}>
      {/* State Selector */}
      <div className="flex-1 min-w-[130px] relative">
        <SearchableDropdown
          options={stateOptions}
          value={selectedState}
          onChange={handleStateChange}
          placeholder={statePlaceholder}
          disabled={disabled}
          icon={MapPin}
          variant={variant}
        />
      </div>

      {/* District Selector */}
      <div className="flex-1 min-w-[130px] relative">
        <SearchableDropdown
          options={districtOptions}
          value={selectedDistrict}
          onChange={handleDistrictChange}
          placeholder={districtPlaceholder}
          disabled={disabled || !selectedState}
          icon={MapPin}
          variant={variant}
        />
      </div>

      {/* Locality Selector (Optional) */}
      {showLocality && (
        <div className="flex-1 min-w-[140px] relative">
          <SearchableDropdown
            options={localityOptions}
            value={selectedLocality}
            onChange={handleLocalityChange}
            placeholder={localityPlaceholder}
            disabled={disabled || !selectedDistrict}
            icon={MapPin}
            variant={variant}
          />
        </div>
      )}
    </div>
  );
};

export default HierarchicalLocationSelector;
