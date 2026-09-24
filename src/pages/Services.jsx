/* eslint-disable react-hooks/set-state-in-effect */
import { useMemo, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap, Droplets, Paintbrush, Hammer, Wind, Tv, Sparkles, Bug,
  Trash2, Truck, HardHat, Home as HomeIcon, Search, ShieldCheck,
  ArrowRight, Star, Filter, RotateCcw, X, MapPin, Mail, LocateFixed
} from 'lucide-react';
import { useApp } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { scrollToFeatureContent } from '../components/ScrollToTop';
import HierarchicalLocationSelector from '../components/HierarchicalLocationSelector';
import { detectCurrentLocation } from '../services/locationService';

const IconMap = {
  zap: Zap,
  droplets: Droplets,
  paintbrush: Paintbrush,
  hammer: Hammer,
  wind: Wind,
  tv: Tv,
  sparkles: Sparkles,
  bug: Bug,
  trash2: Trash2,
  truck: Truck,
  hardhat: HardHat,
  home: HomeIcon,
  Electrician: Zap,
  Plumber: Droplets,
  Painting: Paintbrush,
  Carpenter: Hammer,
  Cleaning: Sparkles,
  "AC Repair": Wind
};



const Services = () => {
  const { services, reviews = [], cities, districts = [], cityControl, submitCoverageRequest, showToast, user, openBookingModal } = useApp();
  const { t } = useLanguage();
  const location = useLocation();
  const [submittedCoverages, setSubmittedCoverages] = useState([]);
  const queryParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  
  const initialSearch = queryParams.get('search') || '';
  const initialCity = queryParams.get('city') || '';
  const initialState = queryParams.get('state') || '';

  // Filter States
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [selectedCity, setSelectedCity] = useState(initialCity);
  const [selectedState, setSelectedState] = useState(initialState);
  const [selectedLocality, setSelectedLocality] = useState(() => queryParams.get('locality') || '');
  const [activeCategory, setActiveCategory] = useState('all');
  const [detectingLocationState, setDetectingLocationState] = useState('default'); // 'default' | 'loading' | 'success' | 'error'

  const handleDetectLocation = async () => {
    setDetectingLocationState('loading');
    try {
      const loc = await detectCurrentLocation();
      const st = loc.state || '';
      const dist = loc.district || '';
      const locName = loc.locality || '';

      if (st) setSelectedState(st);
      if (dist) setSelectedCity(dist);
      if (locName) setSelectedLocality(locName);

      try {
        if (st) localStorage.setItem('fixiva:last-state', st);
        if (dist) localStorage.setItem('fixiva:last-district', dist);
        if (locName) localStorage.setItem('fixiva:last-locality', locName);
      } catch { void 0; }

      setDetectingLocationState('success');
      showToast(`Location detected: ${[locName, dist, st].filter(Boolean).join(', ')}`, 'success');
    } catch {
      setDetectingLocationState('error');
      showToast('Could not detect current location. Try again.', 'error');
    }
  };

  // Modal State for Coverage Request
  const [coverageModalService, setCoverageModalService] = useState(null);
  const [coverageFormCity, setCoverageFormCity] = useState('');
  const [coverageFormState, setCoverageFormState] = useState('');
  const [coverageFormContact, setCoverageFormContact] = useState('');
  const [isSubmittingCoverage, setIsSubmittingCoverage] = useState(false);

  // Sync with query params changes (e.g. from Hero)
  useEffect(() => {
    setSearchTerm(queryParams.get('search') || '');
    setSelectedCity(queryParams.get('city') || '');
    setSelectedState(queryParams.get('state') || '');
    setSelectedLocality(queryParams.get('locality') || '');
  }, [location.search, queryParams]);

  const isServiceAvailable = (serviceId) => {
    if (!selectedCity) return true;

    const safeCity = String(selectedCity).trim().toLowerCase();
    const cityList = (cities && cities.length > 0) ? cities : (districts || []);

    const matchedCity = cityList.find(c => {
      if (!c) return false;
      const cName = String(c.name || '').trim().toLowerCase();
      return cName === safeCity || safeCity.includes(cName) || cName.includes(safeCity);
    });

    if (matchedCity && (matchedCity.status === 'Disabled' || matchedCity.status === 'Coming Soon')) {
      return false;
    }

    if (cityControl && Object.keys(cityControl).length > 0) {
      const matchedService = (services || []).find(
        (s) => String(s.id) === String(serviceId) || String(s.name).toLowerCase() === String(serviceId).toLowerCase()
      );

      const cityKeysToTry = [
        matchedCity?.id,
        matchedCity?.name,
        selectedCity,
        safeCity,
        `dist-${safeCity}`
      ].filter(Boolean);

      const serviceKeysToTry = [
        serviceId,
        String(serviceId).toLowerCase(),
        matchedService?.id,
        matchedService?.name,
        matchedService?.name ? String(matchedService.name).toLowerCase() : null
      ].filter(Boolean);

      for (const cKey of cityKeysToTry) {
        if (cityControl[cKey]) {
          for (const sKey of serviceKeysToTry) {
            if (cityControl[cKey][sKey] !== undefined) {
              return cityControl[cKey][sKey] === true;
            }
          }
        }
      }
    }

    // Default: Available for active districts unless explicitly disabled
    return true;
  };

  const handleCardRequestCoverage = async (e, serviceName, serviceId) => {
    e.preventDefault();
    e.stopPropagation();

    const matchedCity = (cities || []).find(c => c.name === selectedCity || c.id === selectedCity || String(c.name).toLowerCase() === String(selectedCity).toLowerCase());
    const cityToUse = selectedCity || '';
    const stateToUse = selectedState || matchedCity?.region || 'Jharkhand';
    const emailToUse = user?.email || '';

    // If both city and email are available, submit directly
    if (cityToUse && emailToUse) {
      setIsSubmittingCoverage(true);
      try {
        const res = await submitCoverageRequest({
          customer_id: user?.id,
          customer_name: user?.user_metadata?.full_name || user?.name || user?.email?.split('@')[0] || 'Customer',
          email: emailToUse,
          phone: user?.phone || emailToUse,
          service_id: serviceId,
          service_name: serviceName,
          district: cityToUse,
          state: stateToUse
        });

        if (res.success || res.error === 'duplicate') {
          setSubmittedCoverages(prev => [...prev, serviceId]);
          showToast(res.message || "Coverage request submitted successfully!", 'success');
        } else {
          showToast(res.error || "Failed to request coverage.", 'error');
        }
      } catch {
        showToast("Failed to request coverage.", 'error');
      } finally {
        setIsSubmittingCoverage(false);
      }
    } else {
      // Open coverage modal to collect missing city or contact email/phone
      setCoverageFormCity(cityToUse);
      setCoverageFormState(stateToUse);
      setCoverageFormContact(emailToUse);
      setCoverageModalService({ id: serviceId, name: serviceName });
    }
  };

  const submitCoverageModal = async (e) => {
    e.preventDefault();
    if (!coverageFormCity.trim()) {
      showToast("Please enter your city/district.", 'error');
      return;
    }
    if (!coverageFormContact.trim()) {
      showToast("Please enter your email or phone number.", 'error');
      return;
    }

    setIsSubmittingCoverage(true);
    try {
      const res = await submitCoverageRequest({
        customer_id: user?.id,
        customer_name: user?.user_metadata?.full_name || user?.name || coverageFormContact.split('@')[0] || 'Customer',
        email: coverageFormContact.includes('@') ? coverageFormContact.trim() : (user?.email || ''),
        phone: coverageFormContact.trim(),
        service_id: coverageModalService.id,
        service_name: coverageModalService.name,
        district: coverageFormCity.trim(),
        state: coverageFormState.trim() || 'Jharkhand'
      });

      if (res.success || res.error === 'duplicate') {
        setSubmittedCoverages(prev => [...prev, coverageModalService.id]);
        showToast(res.message || "Coverage request submitted successfully!", 'success');
        setCoverageModalService(null);
      } else {
        showToast(res.error || "Failed to request coverage.", 'error');
      }
    } catch {
      showToast("Failed to request coverage.", 'error');
    } finally {
      setIsSubmittingCoverage(false);
    }
  };

  const activeServices = useMemo(() => {
    return (services || []).filter(
      (s) => s.active !== false && s.active !== 'false' && s.active !== 0 && s.active !== '0'
    );
  }, [services]);

  // Unique categories list
  const categories = ['all', ...new Set(activeServices.map(s => s.category || 'General').filter(Boolean))];

  // Filtering Logic
  const filteredServices = activeServices.filter(service => {
    const matchesSearch = !searchTerm.trim() ||
                          service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (service.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = activeCategory === 'all' || 
                            (service.category || '').toLowerCase() === activeCategory.toLowerCase();

    return matchesSearch && matchesCategory;
  });

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedCity('');
    setSelectedState('');
    setSelectedLocality('');
    setActiveCategory('all');
    setDetectingLocationState('default');
    try {
      localStorage.removeItem('fixiva:last-state');
      localStorage.removeItem('fixiva:last-district');
      localStorage.removeItem('fixiva:last-locality');
    } catch { void 0; }
  };

  return (
    <div className="bg-slate-50 dark:bg-slate-950 min-h-screen pb-24 text-slate-900 dark:text-slate-100">
      {/* Header Banner */}
      <section className="bg-white dark:bg-slate-900/80 border-b border-slate-200/80 dark:border-slate-800 py-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-radial from-[#2F6B5F]/5 dark:from-emerald-500/5 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4 relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#E8F0ED] dark:bg-emerald-950/60 text-[#2F6B5F] dark:text-emerald-400 rounded-full text-xs font-extrabold uppercase tracking-wider border border-[#2F6B5F]/20 dark:border-emerald-800/40 shadow-2xs">
            <ShieldCheck size={14} /> {t('satisfactionProtect', '100% Satisfaction Protect Policy')}
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
            {t('everyHomeSolution', 'Every Home Solution, On Demand')}
          </h1>
          <p className="text-slate-600 dark:text-slate-300 font-medium text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
            {t('everyHomeSolutionSub', 'Book top-rated home service professionals on demand. Standardized base tariffs. Pay only on-site after job completion.')}
          </p>
        </div>
      </section>

      {/* Catalog Workspace */}
      <div id="feature-content" className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Left Sidebar Filters */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5">
              <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
                <span className="font-bold text-slate-800 dark:text-slate-100 text-xs sm:text-sm flex items-center gap-1.5 uppercase tracking-wider">
                  <Filter size={16} className="text-slate-400 dark:text-slate-500" /> {t('filterOptions', 'FILTER OPTIONS')}
                </span>
                <button 
                  type="button"
                  onClick={resetFilters}
                  className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 hover:text-primary dark:hover:text-emerald-400 transition-colors uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw size={10} /> {t('reset', 'RESET')}
                </button>
              </div>

              {/* Text Search Input */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-wider block">{t('searchKeyword', 'SEARCH KEYWORD')}</label>
                <div className="relative">
                  <Search size={16} className="absolute left-3.5 top-3.5 text-slate-400 dark:text-slate-500" />
                  <input 
                    type="text" 
                    placeholder={t('searchPlaceholder', 'Search services...')}
                    className="w-full h-11 pl-10 pr-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-primary dark:focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-xl text-xs font-semibold placeholder-slate-400 dark:placeholder-slate-500 outline-none transition-all"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              {/* Target Location */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-wider block">{t('targetLocation', 'TARGET LOCATION')}</label>
                <HierarchicalLocationSelector
                  selectedState={selectedState}
                  selectedDistrict={selectedCity}
                  selectedLocality={selectedLocality}
                  onChange={({ state, district, locality }) => {
                    setSelectedState(state || '');
                    setSelectedCity(district || '');
                    setSelectedLocality(locality || '');
                  }}
                  statePlaceholder={t('selectState', 'Select State')}
                  districtPlaceholder={t('selectDistrict', 'Select District')}
                  localityPlaceholder={t('selectLocality', 'Select Locality')}
                  showLocality={true}
                  layout="col"
                  className="w-full"
                />

                <button
                  type="button"
                  onClick={handleDetectLocation}
                  disabled={detectingLocationState === 'loading'}
                  className="w-full text-xs font-extrabold py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-red-500/50 text-slate-700 dark:text-slate-200 hover:text-red-500 dark:hover:text-red-400 flex items-center justify-center gap-2 transition-all bg-slate-50 dark:bg-slate-800 hover:bg-red-50/50 dark:hover:bg-slate-700 active:scale-95 disabled:opacity-50 mt-3 cursor-pointer shadow-2xs group"
                >
                  <LocateFixed size={16} className={`text-red-500 shrink-0 ${detectingLocationState === 'loading' ? 'animate-spin' : 'group-hover:scale-110 transition-transform'}`} />
                  {detectingLocationState === 'loading'
                    ? t('detectingLocation', 'Detecting location...')
                    : detectingLocationState === 'success'
                    ? t('locationDetected', 'Location detected')
                    : detectingLocationState === 'error'
                    ? t('unableDetectLocation', 'Unable to detect location. Try again')
                    : t('useCurrentLocation', 'Use Current Location')}
                </button>
              </div>
            </div>
          </div>

          {/* Right Main Grid */}
          <div className="lg:col-span-3 space-y-8">
            
            {/* Category pills inside main layout */}
            {categories.length > 1 && (
              <div className="flex gap-2 flex-wrap pb-2">
                {categories.map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      setActiveCategory(cat);
                      scrollToFeatureContent();
                    }}
                    className={`px-4 py-2.5 rounded-xl text-xs capitalize transition-all ${
                      activeCategory === cat 
                        ? 'btn-primary shadow-md' 
                        : 'btn-secondary'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}

            {/* Services Cards List Grid */}
            <AnimatePresence mode="wait">
              {filteredServices.length > 0 ? (
                <motion.div 
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  {filteredServices.map(service => {
                    const Icon = IconMap[service.name] || IconMap[service.icon] || Zap;
                    const startingPrice = service.base_price || service.inspection_fee || 0;
                    const serviceImg = service.image_url || service.image || (service.icon && (service.icon.startsWith('http') || service.icon.startsWith('data:')) ? service.icon : null);
                    const available = isServiceAvailable(service.id);
                    const isSubmitted = submittedCoverages.includes(service.id);
                    
                    const serviceReviews = (reviews || []).filter(r => 
                      String(r.service_id) === String(service.id) || 
                      (r.service_type && service.name && String(r.service_type).toLowerCase().trim() === String(service.name).toLowerCase().trim())
                    );
                    const hasReviews = serviceReviews.length > 0;
                    const calcRating = hasReviews 
                      ? (serviceReviews.reduce((sum, r) => sum + (Number(r.rating) || 5), 0) / serviceReviews.length).toFixed(1)
                      : null;
                    const calcReviewCount = serviceReviews.length;
                    
                    return (
                      <div key={service.id} className="h-full flex">
                        {available ? (
                          <div 
                            onClick={() => openBookingModal({ serviceId: service.id, city: selectedCity, state: selectedState })} 
                            className="group relative overflow-hidden bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 flex flex-col justify-between h-full w-full hover:-translate-y-1 hover:border-primary dark:hover:border-emerald-500 hover:shadow-xl dark:hover:shadow-2xl transition-all duration-300 cursor-pointer"
                          >
                            {/* Top Image / Media Area (~55% card height) */}
                            <div className="relative h-44 w-full bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0">
                              {serviceImg ? (
                                <img 
                                  src={serviceImg} 
                                  alt={service.name} 
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                                />
                              ) : (
                                <div className="w-full h-full bg-[#E8F0ED] dark:bg-slate-800 flex items-center justify-center">
                                  <div className="h-14 w-14 rounded-2xl bg-white dark:bg-slate-900 text-[#2F6B5F] dark:text-emerald-400 flex items-center justify-center shadow-xs border border-[#E7E9E6] dark:border-slate-700 group-hover:scale-110 transition-transform">
                                    <Icon size={28} />
                                  </div>
                                </div>
                              )}
                              
                              {/* Category Badge overlay */}
                              {service.category && (
                                <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-[#171918]/75 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-wider">
                                  {service.category}
                                </span>
                              )}

                              {/* Price tag badge top-right */}
                              {startingPrice > 0 ? (
                                <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-[#2F6B5F] text-white text-xs font-extrabold shadow-sm">
                                  {t('startsFromPrice', 'Starts ₹')}{startingPrice}
                                </div>
                              ) : (
                                <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-[#171918]/75 backdrop-blur-md text-white text-[10px] font-bold shadow-sm">
                                  {t('priceOnSelection', 'Price on selection')}
                                </div>
                              )}
                            </div>

                            {/* Card Content Body */}
                            <div className="p-5 flex flex-col justify-between flex-1 space-y-4">
                              <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                  <h3 className="font-bold text-slate-900 dark:text-white text-base leading-snug group-hover:text-primary dark:group-hover:text-emerald-400 transition-colors">
                                    {service.name}
                                  </h3>
                                </div>
                                {service.description ? (
                                  <p className="text-slate-600 dark:text-slate-300 text-xs leading-relaxed font-normal line-clamp-2">
                                    {service.description}
                                  </p>
                                ) : null}
                              </div>

                              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                <div className="flex items-center gap-1 text-[11px] font-semibold">
                                  {hasReviews ? (
                                    <>
                                      <Star size={13} fill="currentColor" className="text-amber-500" />
                                      <span className="text-amber-600 dark:text-amber-400">{calcRating} ({calcReviewCount})</span>
                                    </>
                                  ) : (
                                    <span className="text-slate-400 dark:text-slate-500 font-medium">{t('fixivaVerified', 'Fixiva Verified')}</span>
                                  )}
                                </div>
                                <button
                                  type="button"
                                  className="btn-primary px-4 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 shadow-xs"
                                >
                                  <span>{t('bookNow', 'Book Now')}</span>
                                  <ArrowRight size={14} />
                                </button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 overflow-hidden flex flex-col justify-between h-full w-full">
                            {/* Top Media Area */}
                            <div className="relative h-44 w-full bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0 opacity-75">
                              {serviceImg ? (
                                <img 
                                  src={serviceImg} 
                                  alt={service.name} 
                                  className="w-full h-full object-cover grayscale" 
                                />
                              ) : (
                                <div className="w-full h-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                  <Icon size={28} className="text-slate-400 dark:text-slate-500" />
                                </div>
                              )}
                              <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-slate-700 text-white text-[10px] font-bold uppercase tracking-wider">
                                {t('comingSoon', 'Coming Soon')}
                              </span>
                            </div>

                            {/* Body Area */}
                            <div className="p-5 flex flex-col justify-between flex-1 space-y-4">
                              <div className="space-y-1.5">
                                <h3 className="font-bold text-slate-900 dark:text-white text-base leading-snug">
                                  {service.name}
                                </h3>
                                <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed font-normal line-clamp-2">
                                  {t('currentlyExpanding', 'Currently expanding coverage to your area. Request coverage to get notified first.')}
                                </p>
                              </div>

                              <div className="pt-3 border-t border-[#E7E9E6] flex items-center justify-between">
                                <span className="text-xs font-medium text-slate-500">{t('notInCityYet', 'Not in city yet')}</span>
                                <button
                                  type="button"
                                  disabled={isSubmittingCoverage || isSubmitted}
                                  onClick={(e) => handleCardRequestCoverage(e, service.name, service.id)}
                                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                                    isSubmitted
                                      ? 'bg-[#E8F0ED] text-[#2F6B5F] border border-[#2F6B5F]/30'
                                      : 'bg-slate-100 hover:bg-slate-200 text-[#171918]'
                                  }`}
                                >
                                  {isSubmitted ? `✓ ${t('requested', 'Requested')}` : t('notifyMe', 'Notify Me')}
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </motion.div>
              ) : (
                <motion.div 
                  className="py-20 text-center bg-white border border-dashed border-slate-200 rounded-2xl max-w-md mx-auto"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <Search size={36} className="mx-auto text-slate-300 mb-4" />
                  <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wider">{t('noMatchingServices', 'No matching service')}</h3>
                  <p className="text-slate-400 text-xs mt-1.5 font-medium px-6">
                    {t('noMatchingServicesDesc', "We couldn't find any services matching your search filter rules. Please try resetting your filters.")}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>
      </div>

      {/* Coverage Request Modal */}
      <AnimatePresence>
        {coverageModalService && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-5 border border-slate-100 relative"
            >
              <button
                onClick={() => setCoverageModalService(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-lg hover:bg-slate-100"
              >
                <X size={18} />
              </button>

              <div className="space-y-1 text-left">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[11px] font-bold border border-amber-200">
                  🚀 {t('expansionRequest', 'Expansion Request')}
                </div>
                <h3 className="text-xl font-extrabold text-slate-900">
                  {t('requestCoverageFor', 'Request Coverage for')} {coverageModalService.name}
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  {t('requestCoverageDesc', 'We are expanding rapidly! Let us know where you need service so we can notify you as soon as we launch.')}
                </p>
              </div>

              <form onSubmit={submitCoverageModal} className="space-y-4 pt-1">
                <div className="space-y-1 text-left">
                  <label className="text-xs font-bold text-slate-700 block">
                    {t('enterCityDistrict', 'City / District')} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <MapPin size={16} className="absolute left-3 top-3 text-slate-400" />
                    <input
                      type="text"
                      placeholder={t('selectCity', 'Select City')}
                      required
                      value={coverageFormCity}
                      onChange={(e) => setCoverageFormCity(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 focus:border-primary focus:bg-white rounded-xl text-xs font-semibold text-slate-800 outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1 text-left">
                  <label className="text-xs font-bold text-slate-700 block">
                    {t('enterState', 'State')}
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Jharkhand"
                    value={coverageFormState}
                    onChange={(e) => setCoverageFormState(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-primary focus:bg-white rounded-xl text-xs font-semibold text-slate-800 outline-none transition-all"
                  />
                </div>

                <div className="space-y-1 text-left">
                  <label className="text-xs font-bold text-slate-700 block">
                    {t('emailOrPhone', 'Email or Mobile Number')} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3 top-3 text-slate-400" />
                    <input
                      type="text"
                      placeholder="you@example.com / 9876543210"
                      required
                      value={coverageFormContact}
                      onChange={(e) => setCoverageFormContact(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 focus:border-primary focus:bg-white rounded-xl text-xs font-semibold text-slate-800 outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="pt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setCoverageModalService(null)}
                    className="w-1/3 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    {t('cancel', 'Cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingCoverage}
                    className="w-2/3 btn-primary py-2.5 rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    {isSubmittingCoverage ? t('submitting', 'Submitting...') : t('submitRequest', 'Submit Request')}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Services;
