import { useEffect } from 'react';
import SearchableDropdown from './SearchableDropdown';
import { STATES, getDistrictsForState } from '../data/locationData';
import { MapPin } from 'lucide-react';
import { useApp } from '../context/AuthContext';

const HierarchicalLocationSelector = ({
  selectedState = '',
  selectedDistrict = '',
  onChange, // Callback when selection changes: (district, state) => void
  disabled = false,
  statePlaceholder = 'Select State',
  districtPlaceholder = 'Select District/City',
  layout = 'row', // 'row' | 'col'
  className = '',
  showAllOption = false, // Allows selecting "All States" or "All Districts"
  variant = 'boxed',
  adminMode = false,
  id
}) => {
  const { states = [], cities = [] } = useApp();

  // Load from localStorage on mount if no initial props are provided
  useEffect(() => {
    if (!selectedState && !selectedDistrict) {
      const savedState = localStorage.getItem('fixiva:last-state');
      const savedDistrict = localStorage.getItem('fixiva:last-district');
      if (savedState && onChange) {
        setTimeout(() => {
          onChange(savedDistrict || '', savedState);
        }, 0);
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleStateChange = (newState) => {
    let finalState = newState;
    if (newState === 'All States' || newState === 'All Operating Cities') {
      finalState = '';
    }
    if (finalState) {
      localStorage.setItem('fixiva:last-state', finalState);
    } else {
      localStorage.removeItem('fixiva:last-state');
    }
    localStorage.removeItem('fixiva:last-district');
    
    if (onChange) {
      onChange('', finalState);
    }
  };

  const handleDistrictChange = (newDistrict) => {
    let finalDistrict = newDistrict;
    if (newDistrict === 'All Districts') {
      finalDistrict = '';
    }
    if (finalDistrict) {
      localStorage.setItem('fixiva:last-district', finalDistrict);
    } else {
      localStorage.removeItem('fixiva:last-district');
    }
    
    if (onChange) {
      onChange(finalDistrict, selectedState);
    }
  };

  // Configure states options based on DB status and adminMode
  const activeStates = (states && states.length > 0)
    ? states.filter(s => adminMode || s.status !== 'Disabled')
    : [];
  
  const stateNames = activeStates.map(s => s.name);
  const stateOptions = stateNames.length > 0 ? stateNames : STATES;
  const finalStateOptions = showAllOption 
    ? ['All States', ...stateOptions] 
    : stateOptions;

  // Configure districts options based on selected state, DB status, and adminMode
  let districtOptions = [];
  if (selectedState) {
    const matchedState = states.find(s => s.name.toLowerCase() === selectedState.toLowerCase());
    if (matchedState) {
      const stateDistricts = cities.filter(c => 
        c.state_id === matchedState.id && (adminMode || c.status !== 'Disabled')
      );
      districtOptions = stateDistricts.map(c => c.name);
    } else {
      // Fallback matching by region (state name text)
      const stateDistricts = cities.filter(c => 
        (c.region || '').toLowerCase() === selectedState.toLowerCase() && (adminMode || c.status !== 'Disabled')
      );
      districtOptions = stateDistricts.map(c => c.name);
    }
  }

  // Fallback to hardcoded list if database didn't return any districts for the state
  let finalDistrictOptions = districtOptions;
  if (selectedState && finalDistrictOptions.length === 0) {
    finalDistrictOptions = getDistrictsForState(selectedState);
  }

  if (showAllOption && selectedState) {
    finalDistrictOptions = ['All Districts', ...finalDistrictOptions];
  }

  return (
    <div className={`flex ${layout === 'row' ? 'flex-col sm:flex-row gap-3' : 'flex-col gap-3'} ${className}`} id={id}>
      <div className="flex-1 min-w-[140px] relative">
        <SearchableDropdown
          options={finalStateOptions}
          value={selectedState}
          onChange={handleStateChange}
          placeholder={statePlaceholder}
          disabled={disabled}
          icon={MapPin}
          variant={variant}
          isStateDropdown={true}
          totalStatesFromAPI={states.length}
          totalStatesAfterFiltering={activeStates.length}
        />
      </div>
      <div className="flex-1 min-w-[140px] relative">
        <SearchableDropdown
          options={finalDistrictOptions}
          value={selectedDistrict}
          onChange={handleDistrictChange}
          placeholder={districtPlaceholder}
          disabled={disabled || !selectedState}
          icon={MapPin}
          variant={variant}
        />
      </div>
    </div>
  );
};

export default HierarchicalLocationSelector;
