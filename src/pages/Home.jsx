import { useState, useMemo, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap, Droplets, Paintbrush, Hammer, Wind, Tv, Sparkles, Bug,
  Trash2, Truck, HardHat, Home as HomeIcon,
  Star, Users, ShieldCheck, ArrowRight, Clock, ThumbsUp, Search, Lock, HelpCircle, MapPin, Navigation, ChevronLeft, ChevronRight
} from 'lucide-react';
import { useApp } from '../context/AuthContext';
import { useCms } from '../context/CmsContext';
import { useLanguage } from '../context/LanguageContext';
import HierarchicalLocationSelector from '../components/HierarchicalLocationSelector';
import HeroSlideshow from '../components/HeroSlideshow';
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

const HomePromotionalBanner = ({ banners, navigate }) => {
  const activeBanners = useMemo(() => {
    return (banners || []).filter((b) => {
      if (!b || b.active === false || b.active === 'false' || b.active === 0 || b.active === '0') return false;
      if (!b.image_url) return false;
      const now = new Date();
      if (b.start_date && new Date(b.start_date) > now) return false;
      if (b.end_date && new Date(b.end_date) < now) return false;
      return true;
    }).sort((a, b) => (Number(a.display_order) || 0) - (Number(b.display_order) || 0));
  }, [banners]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [touchStart, setTouchStart] = useState(null);

  useEffect(() => {
    if (activeBanners.length <= 1 || isHovered) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activeBanners.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [activeBanners.length, isHovered]);

  if (activeBanners.length === 0) return null;

  const safeIndex = currentIndex < activeBanners.length ? currentIndex : 0;
  const banner = activeBanners[safeIndex];

  const handleTouchStart = (e) => setTouchStart(e.targetTouches[0].clientX);
  const handleTouchEnd = (e) => {
    if (!touchStart) return;
    const touchEnd = e.changedTouches[0].clientX;
    if (touchStart - touchEnd > 50) {
      setCurrentIndex((prev) => (prev + 1) % activeBanners.length);
    } else if (touchEnd - touchStart > 50) {
      setCurrentIndex((prev) => (prev === 0 ? activeBanners.length - 1 : prev - 1));
    }
    setTouchStart(null);
  };

  const handleCtaClick = () => {
    const target = banner.link_url || banner.url || '/services';
    if (target.startsWith('http')) {
      window.open(target, '_blank');
    } else {
      navigate(target);
    }
  };

  return (
    <section className="py-6 bg-slate-50/60 border-y border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="relative overflow-hidden rounded-[1.8rem] bg-[#171918] text-white shadow-md border border-slate-800"
        >
          <div className="flex flex-col md:flex-row items-center justify-between p-6 sm:p-8 gap-6">
            {banner.image_url ? (
              <div className="w-full md:w-1/2 h-44 sm:h-56 rounded-2xl overflow-hidden shrink-0 border border-slate-700/60 shadow-lg relative bg-slate-800">
                <img
                  src={banner.image_url}
                  alt={banner.title || 'Promotional Banner'}
                  className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                />
              </div>
            ) : null}

            <div className="flex-1 space-y-3.5 text-left">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/20 text-primary text-[10px] font-black uppercase tracking-wider border border-primary/30">
                <span>✨ Special Promotion</span>
              </div>

              <h3 className="text-xl sm:text-2xl font-black text-white leading-tight tracking-tight">
                {banner.title}
              </h3>

              {(banner.subtitle || banner.description) && (
                <p className="text-xs sm:text-sm text-slate-300 font-semibold leading-relaxed line-clamp-2">
                  {banner.subtitle || banner.description}
                </p>
              )}

              {(banner.cta_text || banner.link_url) && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleCtaClick}
                    className="btn-primary px-6 py-2.5 rounded-xl text-xs font-black shadow-lg inline-flex items-center gap-2 hover:gap-3 transition-all"
                  >
                    <span>{banner.cta_text || 'Explore Offer'}</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              )}
            </div>
          </div>

          {activeBanners.length > 1 && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-slate-900/80 backdrop-blur-md px-3 py-1 rounded-full border border-slate-700/60 shadow-sm">
              {activeBanners.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setCurrentIndex(idx)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    idx === safeIndex ? 'w-6 bg-primary' : 'w-2 bg-slate-500 hover:bg-slate-300'
                  }`}
                  aria-label={`Go to banner ${idx + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
const HeroServiceSlideshow = HeroSlideshow;

const Home = () => {
  const { services, reviews: appReviews, cities = [], showToast, submitCoverageRequest } = useApp();
  const { reviews: cmsReviews, banners, cities: cmsCities } = useCms();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const activeServices = useMemo(() => {
    return (services || []).filter(
      (s) => s.active !== false && s.active !== 'false' && s.active !== 0 && s.active !== '0'
    );
  }, [services]);

  const reviews = (cmsReviews || []).length > 0 ? cmsReviews : appReviews;

  
  // Search & Location selectors inside the Hero initialized from localStorage
  const [selectedState, setSelectedState] = useState(() => {
    try { return localStorage.getItem('fixiva:last-state') || ''; } catch { return ''; }
  });
  const [selectedDistrict, setSelectedDistrict] = useState(() => {
    try { return localStorage.getItem('fixiva:last-district') || ''; } catch { return ''; }
  });
  const [selectedLocality, setSelectedLocality] = useState(() => {
    try { return localStorage.getItem('fixiva:last-locality') || ''; } catch { return ''; }
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [detectingGps, setDetectingGps] = useState(false);

  // Coverage Request Form States
  const [reqDistrict, setReqDistrict] = useState('');
  const [reqLocality, setReqLocality] = useState('');
  const [reqState, setReqState] = useState('');
  const [reqPincode, setReqPincode] = useState('');
  const [reqLat, setReqLat] = useState(null);
  const [reqLng, setReqLng] = useState(null);
  const [reqPhone, setReqPhone] = useState('');
  const [reqEmail, setReqEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [detectingCoverageGps, setDetectingCoverageGps] = useState(false);

  const handleDetectLocation = async () => {
    setDetectingGps(true);
    try {
      const loc = await detectCurrentLocation();
      const st = loc.state || '';
      const dist = loc.district || '';
      const locName = loc.locality || '';

      if (st) setSelectedState(st);
      if (dist) setSelectedDistrict(dist);
      if (locName) setSelectedLocality(locName);

      try {
        if (st) localStorage.setItem('fixiva:last-state', st);
        if (dist) localStorage.setItem('fixiva:last-district', dist);
        if (locName) localStorage.setItem('fixiva:last-locality', locName);
      } catch { void 0; }

      showToast(`📍 Location set: ${[locName, dist, st].filter(Boolean).join(', ')}`, 'success');
    } catch {
      showToast('Could not access current location. You can select your location manually.', 'error');
    } finally {
      setDetectingGps(false);
    }
  };

  const handleDetectCoverageLocation = async () => {
    setDetectingCoverageGps(true);
    try {
      const loc = await detectCurrentLocation();
      if (loc.state) setReqState(loc.state);
      if (loc.district) setReqDistrict(loc.district);
      if (loc.locality) setReqLocality(loc.locality);
      if (loc.pincode) setReqPincode(loc.pincode);
      if (loc.latitude) setReqLat(loc.latitude);
      if (loc.longitude) setReqLng(loc.longitude);
      showToast(`📍 Location detected: ${[loc.locality, loc.district, loc.state].filter(Boolean).join(', ')}`, 'success');
    } catch {
      showToast('Could not detect current location. Select manually.', 'error');
    } finally {
      setDetectingCoverageGps(false);
    }
  };

  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    if (!reqDistrict.trim() || (!reqPhone.trim() && !reqEmail.trim())) {
      showToast("Please select a city/district and provide your email.", 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await submitCoverageRequest({
        state: reqState.trim(),
        district: reqDistrict.trim(),
        locality: reqLocality.trim(),
        pincode: reqPincode.trim(),
        latitude: reqLat,
        longitude: reqLng,
        phone: reqPhone.trim() || reqEmail.trim(),
        email: reqEmail.trim(),
        service_name: searchQuery.trim() || 'Home Services'
      });

      if (res.success) {
        setIsSuccess(true);
        setReqDistrict('');
        setReqLocality('');
        setReqPhone('');
        setReqEmail('');
        showToast(res.message || "Coverage request submitted successfully!", 'success');
      } else {
        showToast(res.error || "Failed to submit request.", 'error');
      }
    } catch {
      showToast("Failed to submit request.", 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const matchedService = services.find(s => 
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      s.id === searchQuery.toLowerCase()
    );

    const params = new URLSearchParams();
    if (selectedState) params.set('state', selectedState);
    if (selectedDistrict) params.set('city', selectedDistrict);
    if (selectedLocality) params.set('locality', selectedLocality);
    if (searchQuery) params.set('search', searchQuery);

    const queryString = params.toString() ? `?${params.toString()}` : '';

    if (matchedService) {
      navigate(`/book/${matchedService.id}${queryString}`);
    } else {
      navigate(`/services${queryString}`);
    }
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 100 } }
  };

  return (
    <div className="bg-slate-50 dark:bg-slate-950 min-h-screen text-slate-900 dark:text-slate-100">
      {/* Hero Section */}
      <section className="relative py-12 sm:py-16 lg:py-20 hero-shell overflow-hidden border-b border-slate-200/80 dark:border-slate-800">

        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          {/* Hero Left Content */}
          <motion.div 
            className="lg:col-span-6 space-y-6"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#E8F0ED] dark:bg-emerald-950/60 text-[#2F6B5F] dark:text-emerald-400 text-xs font-extrabold uppercase tracking-wider border border-[#2F6B5F]/20 dark:border-emerald-800/40 shadow-2xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#2F6B5F] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#2F6B5F]"></span>
              </span>
              <ShieldCheck size={14} /> {t('heroBadge', 'TRUSTED CONSUMER MARKETPLACE')}
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-[#171918] dark:text-white leading-[1.08]">
              {t('heroTitle1', 'Trusted home services,')}<br/>
              <span className="bg-gradient-to-r from-[#2F6B5F] to-[#3D8068] dark:from-[#3D8068] dark:to-[#4FA387] bg-clip-text text-transparent">
                {t('heroTitle2', 'simply booked.')}
              </span>
            </h1>

            <p className="text-base sm:text-lg text-[#6B716E] dark:text-slate-300 font-semibold max-w-xl leading-relaxed">
              {t('heroSubtitle', 'Book professional home services with instant dispatch, verified experts, and a clear experience from first click to final service.')}
            </p>

            {/* Premium Search & Location Card Container */}
            <form onSubmit={handleSearchSubmit} className="p-5 sm:p-6 rounded-2xl flex flex-col gap-4 max-w-2xl w-full border border-[#E7E9E6] dark:border-slate-800 bg-white dark:bg-slate-900 shadow-md hover:shadow-lg transition-all duration-300">
              {/* Search Input Field */}
              <div className="flex items-center gap-3 px-4 py-3 bg-[#FAFAF8] dark:bg-slate-950 rounded-xl border border-[#E7E9E6] dark:border-slate-800 focus-within:border-[#2F6B5F] focus-within:bg-white dark:focus-within:bg-slate-900 focus-within:ring-3 focus-within:ring-[#2F6B5F]/15 transition-all">
                <Search size={18} className="text-[#2F6B5F] dark:text-emerald-400 shrink-0" />
                <input 
                  type="text" 
                  placeholder={t('searchPlaceholder', 'What service do you need? (e.g. Electrician, Plumber, AC Repair)')} 
                  className="w-full bg-transparent border-0 outline-none text-[#171918] dark:text-slate-100 text-sm font-bold placeholder-slate-400 dark:placeholder-slate-500"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Hierarchical Location Selector */}
              <div className="w-full">
                <HierarchicalLocationSelector
                  selectedState={selectedState}
                  selectedDistrict={selectedDistrict}
                  selectedLocality={selectedLocality}
                  onChange={({ state, district, locality }) => {
                    setSelectedState(state);
                    setSelectedDistrict(district);
                    setSelectedLocality(locality);
                    try {
                      if (state) localStorage.setItem('fixiva:last-state', state);
                      if (district) localStorage.setItem('fixiva:last-district', district);
                      if (locality) localStorage.setItem('fixiva:last-locality', locality);
                    } catch { void 0; }
                  }}
                  statePlaceholder="State"
                  districtPlaceholder="District"
                  localityPlaceholder="Locality"
                  variant="borderless"
                  layout="row"
                  className="w-full"
                />
              </div>

              {/* Quick Tags shortcut */}
              {activeServices.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Popular:</span>
                  {activeServices.slice(0, 4).map((service) => (
                    <button
                      key={service.id}
                      type="button"
                      onClick={() => {
                        setSearchQuery(service.name);
                      }}
                      className="text-xs font-bold text-slate-600 hover:text-primary px-2.5 py-1 rounded-lg bg-slate-100/70 hover:bg-primary/10 border border-slate-200/60 hover:border-primary/30 transition-all cursor-pointer"
                    >
                      ⚡ {service.name}
                    </button>
                  ))}
                </div>
              )}

              {/* Action Bar */}
              <div className="flex items-center justify-between gap-3 pt-3 border-t border-[#E7E9E6] dark:border-slate-800">
                <button
                  type="button"
                  onClick={handleDetectLocation}
                  disabled={detectingGps}
                  className="text-xs font-extrabold px-3.5 py-2.5 rounded-xl border border-[#E7E9E6] dark:border-slate-700 hover:border-[#2F6B5F] text-[#171918] dark:text-slate-200 hover:text-[#2F6B5F] dark:hover:text-emerald-400 flex items-center gap-2 transition-all bg-[#FAFAF8] dark:bg-slate-800 hover:bg-[#E8F0ED] dark:hover:bg-slate-700 disabled:opacity-50 cursor-pointer shadow-2xs"
                >
                  <span className="text-[#2F6B5F] dark:text-emerald-400 text-sm">📍</span>
                  {detectingGps ? 'Locating...' : 'Use Location'}
                </button>

                <button 
                  type="submit" 
                  className="btn-primary text-sm font-extrabold px-7 py-2.5 rounded-xl flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all shrink-0 cursor-pointer"
                >
                  {t('bookNowBtn', 'Book Now')}
                  <ArrowRight size={16} />
                </button>
              </div>
            </form>
          </motion.div>

          {/* Hero Right Media */}
          <motion.div 
            className="lg:col-span-6 relative flex justify-center lg:justify-end"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <HeroServiceSlideshow services={services} />
          </motion.div>
        </div>
      </section>

      {/* Trust & Readiness Section */}
      <section className="py-20 bg-slate-50 dark:bg-slate-950 border-b border-slate-100 dark:border-slate-900/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <span className="text-[10px] font-black uppercase tracking-widest text-primary">Uncompromising Reliability</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              We're Ready to Serve You
            </h2>
            <p className="text-slate-600 dark:text-slate-400 font-medium text-sm sm:text-base leading-relaxed">
              FIXIVA connects customers with verified professionals for fast, reliable, and hassle-free home services across your city. Book trusted experts in minutes and get quality service at your doorstep.
            </p>
          </div>

          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
          >
            {[
              {
                icon: ShieldCheck,
                title: "Verified Workers Badge",
                desc: "Every service professional undergoes mandatory identity verification and strict background checks before active assignment.",
                color: "from-blue-500 to-indigo-500"
              },
              {
                icon: Users,
                title: "Trusted Service Partners",
                desc: "We onboard experienced local experts and contractors holding consistent high trust ratings and performance credentials.",
                color: "from-indigo-500 to-purple-500"
              },
              {
                icon: Clock,
                title: "Fast Response Times",
                desc: "Automated routing engines dispatch the nearest available professional to ensure timely arrival at your home.",
                color: "from-amber-500 to-orange-500"
              },
              {
                icon: Lock,
                title: "Secure Booking Experience",
                desc: "A secure verification workflow ensures your service requests, pricing structures, and payouts remain completely safe.",
                color: "from-teal-500 to-emerald-500"
              },
              {
                icon: HelpCircle,
                title: "Customer Support Available",
                desc: "Our operations desk monitors every dispatch, offering responsive support to resolve tickets and disputes immediately.",
                color: "from-cyan-500 to-blue-500"
              },
              {
                icon: Star,
                title: "Quality Assured Services",
                desc: "We prioritize user experience, standardizing tariffs and checking completions to deliver clean, premium craftsmanship.",
                color: "from-rose-500 to-red-500"
              }
            ].map((item, idx) => {
              const IconComp = item.icon;
              return (
                <motion.div 
                  key={idx} 
                  variants={itemVariants}
                  whileHover={{ y: -6, transition: { duration: 0.2 } }}
                  className="p-7 sm:p-8 rounded-[1.65rem] bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-xl hover:border-primary/40 dark:hover:border-emerald-500/40 transition-all duration-300 flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    <div className="h-12 w-12 rounded-2xl bg-primary/10 dark:bg-emerald-950/60 text-primary dark:text-emerald-400 flex items-center justify-center border border-primary/20 dark:border-emerald-800/40 shadow-2xs">
                      <IconComp size={22} />
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-black text-slate-900 dark:text-white text-base tracking-tight">{item.title}</h4>
                      <p className="text-slate-600 dark:text-slate-300 text-xs leading-relaxed font-semibold">{item.desc}</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* Admin Controlled Promotional Banner */}
      <HomePromotionalBanner banners={banners} navigate={navigate} />

      {/* Popular Services Horizontal Showcase */}
      <section className="py-20 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-10">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-primary">Catalog Categories</span>
              <h2 className="text-3xl font-extrabold text-slate-900 mt-2 tracking-tight">Popular Home Services</h2>
            </div>
            <Link to="/services" className="text-sm font-bold text-primary flex items-center gap-1 hover:gap-2 transition-all">
              Browse All Services <ArrowRight size={16} />
            </Link>
          </div>

          {activeServices.length === 0 ? (
            <div className="py-16 text-center border-2 border-dashed border-slate-200 bg-slate-50/50 rounded-2xl">
              <Zap size={36} className="mx-auto text-slate-300 mb-2" />
              <p className="text-slate-500 text-sm font-semibold">No active services available right now.</p>
            </div>
          ) : (
            <div className="relative">
              <div className="flex overflow-x-auto no-scrollbar scroll-smooth snap-x snap-mandatory gap-5 pb-4 pt-1 px-1 -mx-1">
                {/* Show up to 7 active services from Admin Catalog */}
                {activeServices.slice(0, 7).map(s => {
                  const Icon = IconMap[s.name] || IconMap[s.icon] || Zap;
                  const serviceImg = s.image_url || s.image || (s.icon && (s.icon.startsWith('http') || s.icon.startsWith('data:')) ? s.icon : null);
                  return (
                    <div key={s.id} className="w-[220px] sm:w-[250px] shrink-0 snap-start">
                      <Link 
                        to={`/book/${s.id}`} 
                        className="group relative overflow-hidden section-surface p-6 rounded-[1.35rem] hover:shadow-[0_20px_40px_-20px_rgba(15,23,42,0.24)] hover:-translate-y-1 hover:border-primary transition-all text-center flex flex-col items-center justify-between h-full min-h-[220px] border border-slate-200/80 bg-white"
                      >
                        {serviceImg ? (
                          <>
                            {/* Service background image auto-adjusted to cover full card */}
                            <img 
                              src={serviceImg} 
                              alt={s.name} 
                              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                            />
                            {/* Dark gradient overlay for text readability */}
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-900/55 to-slate-900/30 group-hover:from-slate-950/95 transition-colors" />

                            <div className="relative z-10 flex flex-col items-center justify-between h-full w-full">
                              <div className="h-10 w-10 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 text-white flex items-center justify-center shrink-0 shadow-sm">
                                <Icon size={20} />
                              </div>
                              <h4 className="font-extrabold text-sm text-white leading-tight drop-shadow-md line-clamp-2 mt-2">
                                {s.name}
                              </h4>
                              <div className="mt-auto pt-3">
                                {(s.base_price || s.inspection_fee) > 0 ? (
                                  <span className="inline-block px-3 py-1 rounded-full bg-primary/95 text-white text-[10px] font-black uppercase tracking-wider shadow-md backdrop-blur-xs">
                                    Starts ₹{s.base_price || s.inspection_fee}
                                  </span>
                                ) : (
                                  <span className="inline-block px-3 py-1 rounded-full bg-[#171918]/75 text-white text-[10px] font-bold shadow-sm">
                                    Price on selection
                                  </span>
                                )}
                              </div>
                            </div>
                          </>
                        ) : (
                          <div className="flex flex-col items-center justify-between h-full w-full">
                            <div className="h-16 w-16 rounded-2xl bg-slate-50 text-primary flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-white transition-all overflow-hidden border border-slate-100 shadow-xs shrink-0">
                              <Icon size={26} />
                            </div>
                            <h4 className="font-extrabold text-sm text-slate-900 leading-tight group-hover:text-primary transition-colors line-clamp-2">
                              {s.name}
                            </h4>
                            <div className="mt-auto pt-4">
                              {(s.base_price || s.inspection_fee) > 0 ? (
                                <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">
                                  Starts ₹{s.base_price || s.inspection_fee}
                                </p>
                              ) : (
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                  Price on selection
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                      </Link>
                    </div>
                  );
                })}

                {/* Final Card: View More Services CTA */}
                <div className="w-[220px] sm:w-[250px] shrink-0 snap-start">
                  <Link
                    to="/services"
                    className="group p-6 rounded-[1.35rem] bg-[#171918] text-white hover:shadow-md hover:-translate-y-1 border border-slate-800 transition-all text-center flex flex-col items-center justify-center h-full min-h-[220px] relative overflow-hidden"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-[#2F6B5F] text-white flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                      <ArrowRight size={22} className="text-white group-hover:translate-x-1 transition-transform" />
                    </div>
                    <h4 className="font-bold text-base text-white leading-tight">
                      View More Services
                    </h4>
                    <p className="text-[11px] text-slate-300 font-semibold mt-1 flex items-center gap-1 group-hover:text-[#2F6B5F] transition-colors">
                      Explore full catalog →
                    </p>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-16">
            <span className="text-[10px] font-black uppercase tracking-widest text-primary">Simple Booking</span>
            <h2 className="text-3xl font-extrabold text-slate-900 mt-2 tracking-tight">How It Works</h2>
            <p className="text-slate-500 font-medium text-sm mt-3">Book home services with pricing guarantee in 4 quick steps.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { step: '01', title: 'Select Service', desc: 'Choose a service from our dynamic checklist app catalog.' },
              { step: '02', title: 'Book Appointment', desc: 'Confirm scheduled date slot, deployment details and submit request.' },
              { step: '03', title: 'Professional Dispatched', desc: 'A background-verified pro accepts and arrives at your site.' },
              { step: '04', title: 'Done & Settlement', desc: 'Pay Cash-on-Service directly after complete inspection approval.' }
            ].map((item, idx) => (
              <div 
                key={idx} 
                className="elevated-card p-8 rounded-[1.4rem] transition-all text-center flex flex-col items-center"
              >
                <div className="h-12 w-12 rounded-full bg-primary/10 text-primary font-black text-base flex items-center justify-center mb-6">
                  {item.step}
                </div>
                <h3 className="font-extrabold text-slate-900 text-base mb-2">{item.title}</h3>
                <p className="text-slate-500 text-xs leading-relaxed font-semibold">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Service Region & Expansion Hub */}
      <section className="py-24 bg-white dark:bg-slate-950 border-b border-slate-100 dark:border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Bring Fixiva to Your City Section */}
          <div className="bg-slate-50 dark:bg-slate-900 rounded-[2rem] border border-slate-200/60 dark:border-slate-800 p-8 sm:p-12 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-5 space-y-4">
              <h3 className="text-2xl font-black text-slate-900 dark:text-white">Bring Fixiva to Your City</h3>
              <p className="text-slate-500 dark:text-slate-300 text-xs sm:text-sm font-medium leading-relaxed font-semibold">
                Can't find your city? Tell us where you need Fixiva. Every request helps us decide where to expand next, and you'll be among the first to know when our services launch in your area.
              </p>
            </div>

            <div className="lg:col-span-7 bg-white dark:bg-slate-950 p-6 sm:p-8 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
              {isSuccess ? (
                <div className="text-center space-y-4 py-4">
                  <div className="text-4xl">🎉</div>
                  <h4 className="text-lg font-extrabold text-slate-950 dark:text-white">Thank you!</h4>
                  <p className="text-slate-500 dark:text-slate-300 text-xs sm:text-sm font-semibold max-w-md mx-auto leading-relaxed">
                    Your city has been added to our expansion wishlist. Our team reviews every request carefully, and we'll notify you as soon as Fixiva launches in your area.
                  </p>
                  <button 
                    onClick={() => setIsSuccess(false)}
                    className="btn-secondary text-xs px-4 py-2 rounded-xl mt-2 cursor-pointer dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700"
                  >
                    Submit another request
                  </button>
                </div>
              ) : (
                <form onSubmit={handleRequestSubmit} className="space-y-5">
                  {/* Unified Location Card */}
                  <div className="p-5 bg-slate-50/90 dark:bg-slate-900/90 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-4 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-[11px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <MapPin size={14} className="text-primary dark:text-emerald-400" /> Select Your Location
                      </span>
                      <button
                        type="button"
                        onClick={handleDetectCoverageLocation}
                        disabled={detectingCoverageGps}
                        className="text-xs font-black text-primary dark:text-emerald-400 hover:text-[#285C52] inline-flex items-center gap-1.5 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs hover:border-primary/40 dark:hover:border-emerald-500/40 transition-all cursor-pointer disabled:opacity-50"
                      >
                        <Navigation size={12} className={detectingCoverageGps ? 'animate-spin' : ''} />
                        <span>{detectingCoverageGps ? 'Detecting...' : 'Use Current Location'}</span>
                      </button>
                    </div>

                    <HierarchicalLocationSelector
                      selectedState={reqState}
                      selectedDistrict={reqDistrict}
                      selectedLocality={reqLocality}
                      onChange={({ state, district, locality }) => {
                        setReqDistrict(district);
                        setReqState(state);
                        if (locality) setReqLocality(locality);
                      }}
                      statePlaceholder="Select State"
                      districtPlaceholder="Select District"
                      localityPlaceholder="Select Locality"
                      layout="row"
                      className="w-full"
                    />

                    {/* Selected Location Summary Preview */}
                    {(reqDistrict || reqState) && (
                      <div className="p-3 bg-white dark:bg-slate-950 rounded-xl border border-primary/20 dark:border-slate-800 text-xs flex items-center justify-between gap-2 shadow-xs">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 dark:bg-emerald-950/60 text-primary dark:text-emerald-400 flex items-center justify-center shrink-0">
                            <MapPin size={16} />
                          </div>
                          <div className="min-w-0">
                            <p className="font-black text-slate-900 dark:text-white truncate">
                              📍 {[reqLocality, reqDistrict].filter(Boolean).join(', ')}
                            </p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold truncate">
                              {[reqDistrict, reqState].filter(Boolean).join(', ')} {reqPincode ? `• ${reqPincode}` : ''}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => { setReqState(''); setReqDistrict(''); setReqLocality(''); setReqPincode(''); setReqLat(null); setReqLng(null); }}
                          className="text-[11px] font-black text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 shrink-0 px-2 py-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                        >
                          Reset
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">Email Address</label>
                    <input 
                      type="email" 
                      required
                      placeholder="Enter your email address..."
                      value={reqEmail}
                      onChange={(e) => setReqEmail(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-primary/50 shadow-xs"
                    />
                  </div>

                  <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="w-full btn-primary font-black text-xs py-3.5 rounded-xl shadow-md disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span>{isSubmitting ? 'Submitting request...' : 'Request My City'}</span>
                    <ArrowRight size={14} />
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Premium Statistics Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { emoji: '🏠', title: 'Expanding Across India', desc: 'Active growth focus' },
              { emoji: '👨‍🔧', title: 'Verified Professionals', desc: 'Strict identity check' },
              { emoji: '📍', title: 'Multiple Cities Covered', desc: 'Growing footprint' },
              { emoji: '⚡', title: 'New Cities Added Regularly', desc: 'Based on demand' }
            ].map((stat, idx) => (
              <div 
                key={idx} 
                className="p-5 rounded-2xl border border-slate-100 bg-slate-50/50 flex flex-col items-center text-center space-y-2 hover:shadow-[0_8px_20px_-6px_rgba(0,0,0,0.05)] transition-shadow"
              >
                <span className="text-2xl">{stat.emoji}</span>
                <h4 className="font-extrabold text-slate-800 text-xs">{stat.title}</h4>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{stat.desc}</p>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* Guarantee Banner */}
      <section className="py-16 bg-slate-900 text-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="flex gap-4 items-start">
            <div className="p-3 bg-white/10 rounded-xl text-primary"><ShieldCheck size={28} /></div>
            <div className="space-y-1">
              <h3 className="font-bold text-sm text-white">Identity Checked Experts</h3>
              <p className="text-xs text-slate-400 font-semibold leading-relaxed">Strict Aadhaar identity uploads check verification on all local workers.</p>
            </div>
          </div>
          <div className="flex gap-4 items-start border-t md:border-t-0 md:border-l border-slate-800 pt-6 md:pt-0 md:pl-8">
            <div className="p-3 bg-white/10 rounded-xl text-primary"><Clock size={28} /></div>
            <div className="space-y-1">
              <h3 className="font-bold text-sm text-white">Late Protection</h3>
              <p className="text-xs text-slate-400 font-semibold leading-relaxed">Automated reassignment tools protect bookings from partner delays.</p>
            </div>
          </div>
          <div className="flex gap-4 items-start border-t md:border-t-0 md:border-l border-slate-800 pt-6 md:pt-0 md:pl-8">
            <div className="p-3 bg-white/10 rounded-xl text-primary"><ThumbsUp size={28} /></div>
            <div className="space-y-1">
              <h3 className="font-bold text-sm text-white">Settlement Protections</h3>
              <p className="text-xs text-slate-400 font-semibold leading-relaxed">Upfront pricing details mean you only pay flat rates directly on-site.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-16">
            <span className="text-[10px] font-black uppercase tracking-widest text-primary">Reviews & Feedback</span>
            <h2 className="text-3xl font-extrabold text-slate-900 mt-2 tracking-tight">Verified Testimonials</h2>
          </div>

          {reviews.length === 0 ? (
            <div className="py-16 text-center bg-white rounded-3xl border border-slate-200/60 max-w-lg mx-auto shadow-sm">
              <Star size={36} className="mx-auto text-slate-300 mb-2" />
              <p className="text-slate-400 text-sm font-semibold">No reviews registered in the system yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {reviews.slice(0, 3).map((r, idx) => (
                <div key={idx} className="elevated-card p-8 rounded-[1.5rem] flex flex-col justify-between h-full">
                  <div>
                    <div className="flex gap-1 text-warning mb-4">
                      {[...Array(5)].map((_, j) => (
                        <Star key={j} size={14} fill={j < r.rating ? "currentColor" : "none"} />
                      ))}
                    </div>
                    <p className="text-slate-600 italic text-sm leading-relaxed">
                      "{r.comment}"
                    </p>
                  </div>
                  <div className="flex justify-between items-center pt-6 mt-6 border-t border-slate-50">
                    <span className="font-bold text-sm text-slate-900">{r.userName || 'Customer'}</span>
                    <span className="text-[9px] uppercase font-black tracking-widest text-primary">
                      {r.serviceType}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Book CTA callout */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-[#171918] rounded-[2rem] p-10 sm:p-12 text-center text-white shadow-md border border-slate-800 relative overflow-hidden">
            <div className="relative z-10 space-y-5 max-w-xl mx-auto">
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Ready to clear your tasks list?</h2>
              <p className="text-slate-300 text-sm font-medium leading-relaxed">
                Book professional assistance in a few clicks. Verified professionals, transparent platform billing.
              </p>
              <div className="pt-2">
                <Link 
                  to="/services" 
                  className="inline-flex btn-primary px-8 py-3.5 rounded-[10px] text-sm text-center"
                >
                  Book Your First Service
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
