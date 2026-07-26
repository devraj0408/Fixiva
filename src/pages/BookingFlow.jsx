import { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate, useLocation, Navigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Filter,
  Star,
  ShieldCheck,
  CheckCircle,
  MapPin,
  Clock,
  Award,
  Phone,
  User,
  Briefcase,
  IndianRupee,
  Calendar,
  ArrowRight,
  X,
  ChevronRight,
  Sparkles,
  SlidersHorizontal,
  LocateFixed,
  Building,
  Check,
  Package,
  AlertTriangle,
  Info
} from 'lucide-react';
import { useApp } from '../context/AuthContext';
import HierarchicalLocationSelector from '../components/HierarchicalLocationSelector';

const BookingFlow = () => {
  const { serviceId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const {
    services,
    workers = [],
    contractors = [],
    reviews = [],
    addBooking,
    user,
    isAuthenticated,
    showToast,
    cities = [],
    cityControl,
    submitCoverageRequest,
    openBookingModal
  } = useApp();

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedService, setSelectedService] = useState(serviceId || 'all');
  const [selectedCity, setSelectedCity] = useState('');
  const [experienceFilter, setExperienceFilter] = useState('all');
  const [ratingFilter, setRatingFilter] = useState('all');
  const [maxPriceFilter, setMaxPriceFilter] = useState(5000);
  const [availabilityFilter, setAvailabilityFilter] = useState('all');
  const [sortBy, setSortBy] = useState('recommended');

  // Location / Geolocation state
  const [userLat, setUserLat] = useState(null);
  const [userLng, setUserLng] = useState(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoMessage, setGeoMessage] = useState('');

  // Selected Worker & Drawer/Modal state
  const [activeWorkerProfile, setActiveWorkerProfile] = useState(null);
  const [bookingModalWorker, setBookingModalWorker] = useState(null);

  // Booking Flow state
  const [step, setStep] = useState(1); // 1: Service & City, 2: Select Worker, 3: Date & Time, 4: Address, 5: Review & Confirm
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTimeSlot, setBookingTimeSlot] = useState('09:00 AM - 12:00 PM');
  const [bookingAddress, setBookingAddress] = useState(user?.city ? `Main Road, ${user.city}` : '');
  const [bookingNotes, setBookingNotes] = useState('');
  const [customerName, setCustomerName] = useState(user?.name || '');
  const [customerPhone, setCustomerPhone] = useState(user?.phone || '');
  const [bookingSubmitting, setBookingSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [createdBookingId, setCreatedBookingId] = useState('');

  // Coverage Request Modal State
  const [coverageEmail, setCoverageEmail] = useState('');
  const [isSubmittingCoverage, setIsSubmittingCoverage] = useState(false);
  const [isCoverageSubmitted, setIsCoverageSubmitted] = useState(false);

  // Pre-fill user data
  useEffect(() => {
    if (user) {
      setCustomerName(user.name || '');
      setCustomerPhone(user.phone || '');
      if (user.city && !selectedCity) setSelectedCity(user.city);
    }
  }, [user]);

  // Read URL query parameters
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const cityFromUrl = queryParams.get('city');
    const workerFromUrl = queryParams.get('workerId');

    if (cityFromUrl) setSelectedCity(cityFromUrl);
    if (workerFromUrl && workers.length > 0) {
      const w = workers.find((item) => item.id === workerFromUrl);
      if (w) setBookingModalWorker(w);
    }
  }, [location.search, workers]);

  // Role validation
  const userRole = String(user?.role || '').trim().toLowerCase();
  if (isAuthenticated && user && userRole !== 'customer') {
    if (userRole === 'admin') return <Navigate to="/dashboard/admin" replace />;
    if (userRole === 'worker') return <Navigate to="/worker-dashboard" replace />;
    if (userRole === 'contractor') return <Navigate to="/contractor-dashboard" replace />;
  }

  // Geolocation Handler
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setGeoMessage('Geolocation is not supported in this browser.');
      return;
    }

    setGeoLoading(true);
    setGeoMessage('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLat(pos.coords.latitude);
        setUserLng(pos.coords.longitude);
        setGeoLoading(false);
        setGeoMessage(`Location detected (${pos.coords.latitude.toFixed(2)}, ${pos.coords.longitude.toFixed(2)})`);
        showToast('Current location detected successfully!', 'success');
      },
      (err) => {
        setGeoLoading(false);
        setGeoMessage('Unable to access device location. You can select your city manually.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Distance calculator helper (Haversine formula in km)
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return null;
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 10) / 10;
  };

  // Coverage Request Handler
  const handleRequestCoverage = async () => {
    const email = user?.email || coverageEmail;
    if (!email || !email.includes('@')) {
      showToast('Please enter a valid email address', 'error');
      return;
    }
    setIsSubmittingCoverage(true);
    const res = await submitCoverageRequest(selectedCity || 'Unknown', 'Jharkhand', email);
    setIsSubmittingCoverage(false);
    if (res.success) {
      setIsCoverageSubmitted(true);
      showToast('Coverage request submitted!', 'success');
    } else {
      showToast('Coverage request recorded.', 'info');
    }
  };

  // Filter & Sort Worker Pool
  const filteredWorkers = useMemo(() => {
    const list = (workers || []).filter((w) => {
      // Search query filter
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        (w.name || '').toLowerCase().includes(q) ||
        (w.skills || '').toLowerCase().includes(q) ||
        (w.city || '').toLowerCase().includes(q);

      // Service filter
      const matchesService =
        selectedService === 'all' ||
        !w.skills ||
        w.skills.toLowerCase().includes(selectedService.toLowerCase()) ||
        selectedService.toLowerCase().includes('clean') ||
        selectedService.toLowerCase().includes('repair');

      // City filter
      const matchesCity =
        !selectedCity ||
        (w.city || '').toLowerCase().includes(selectedCity.toLowerCase()) ||
        selectedCity.toLowerCase().includes((w.city || '').toLowerCase());

      // Experience filter
      const years = parseInt(w.experience) || 5;
      const matchesExp =
        experienceFilter === 'all' ||
        (experienceFilter === '1-3' && years >= 1 && years <= 3) ||
        (experienceFilter === '3-5' && years >= 3 && years <= 5) ||
        (experienceFilter === '5+' && years >= 5);

      // Rating filter
      const rating = w.rating || 4.9;
      const matchesRating =
        ratingFilter === 'all' ||
        (ratingFilter === '4.5+' && rating >= 4.5) ||
        (ratingFilter === '4.0+' && rating >= 4.0);

      // Price filter
      const price = w.starting_price || w.hourly_rate || 299;
      const matchesPrice = price <= maxPriceFilter;

      // Availability filter
      const matchesAvail =
        availabilityFilter === 'all' || (w.status || 'Active').toLowerCase() === 'active';

      return (
        matchesSearch &&
        matchesService &&
        matchesCity &&
        matchesExp &&
        matchesRating &&
        matchesPrice &&
        matchesAvail
      );
    });

    // Sorting logic
    return [...list].sort((a, b) => {
      if (sortBy === 'highest-rated') {
        return (b.rating || 4.9) - (a.rating || 4.9);
      }
      if (sortBy === 'lowest-price') {
        return (a.starting_price || a.hourly_rate || 299) - (b.starting_price || b.hourly_rate || 299);
      }
      if (sortBy === 'most-experienced') {
        return (parseInt(b.experience) || 5) - (parseInt(a.experience) || 5);
      }
      if (sortBy === 'nearest' && userLat && userLng) {
        const distA = calculateDistance(userLat, userLng, a.location_latitude, a.location_longitude) || 999;
        const distB = calculateDistance(userLat, userLng, b.location_latitude, b.location_longitude) || 999;
        return distA - distB;
      }
      // Recommended default: trust score & rating
      return (b.trustScore || 98) - (a.trustScore || 98);
    });
  }, [
    workers,
    searchQuery,
    selectedService,
    selectedCity,
    experienceFilter,
    ratingFilter,
    maxPriceFilter,
    availabilityFilter,
    sortBy,
    userLat,
    userLng
  ]);



  // Render Success Screen
  if (bookingSuccess) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 text-center shadow-sm space-y-6">
          <div className="h-20 w-20 mx-auto rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <CheckCircle size={44} />
          </div>
          <div className="space-y-2">
            <span className="text-xs font-black uppercase tracking-[0.2em] text-primary">Booking Submitted</span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900">Booking #{createdBookingId} Confirmed!</h2>
            <p className="text-slate-500 text-sm max-w-md mx-auto font-medium">
              Your service request has been transmitted to our verified specialist. You can track real-time progress on your dashboard.
            </p>
          </div>

          {/* 7-Step Status Timeline Preview */}
          <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 space-y-4 max-w-2xl mx-auto text-left">
            <h4 className="text-xs font-black uppercase tracking-[0.15em] text-slate-500 text-center">Live Status Timeline</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 text-center">
              {[
                { label: 'Pending', active: true },
                { label: 'Accepted', active: false },
                { label: 'Assigned', active: false },
                { label: 'On The Way', active: false },
                { label: 'Work Started', active: false },
                { label: 'Completed', active: false },
                { label: 'Reviewed', active: false }
              ].map((stepItem, idx) => (
                <div key={idx} className="p-2 bg-white rounded-2xl border border-slate-200">
                  <div className={`w-3 h-3 mx-auto rounded-full mb-1 ${stepItem.active ? 'bg-primary animate-pulse' : 'bg-slate-300'}`}></div>
                  <span className={`text-[9px] font-extrabold uppercase block ${stepItem.active ? 'text-primary' : 'text-slate-400'}`}>
                    {stepItem.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-4 justify-center pt-4">
            <button
              onClick={() => navigate('/dashboard/customer?tab=bookings')}
              className="rounded-2xl bg-primary px-8 py-3.5 text-xs font-extrabold text-white shadow-sm hover:bg-blue-700 transition-all"
            >
              Go to Customer Dashboard
            </button>
            <button
              onClick={() => {
                setBookingSuccess(false);
                setStep(1);
              }}
              className="rounded-2xl border border-slate-200 bg-white px-6 py-3.5 text-xs font-extrabold text-slate-700 shadow-sm hover:bg-slate-50 transition-all"
            >
              Book Another Service
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Header Banner - Urban Company Style */}
      <div className="rounded-3xl bg-slate-900 p-8 sm:p-10 text-white shadow-sm space-y-6 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-primary/20 rounded-full blur-3xl"></div>
        <div className="relative z-10 max-w-2xl space-y-3">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-extrabold uppercase tracking-wider text-amber-400">
            <Sparkles size={14} /> Urban Company Experience
          </span>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
            Book Verified Home Service Professionals
          </h1>
          <p className="text-slate-300 text-sm font-medium">
            Background-checked electricians, plumbers, painters, and technicians available for instant booking in your city.
          </p>
        </div>

        {/* Search & Location Bar */}
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-3 pt-2">
          <div className="md:col-span-6 relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by worker name, skill (e.g. Electrician, Plumbing), or city..."
              className="h-12 w-full rounded-2xl bg-white/10 border border-white/20 pl-11 pr-4 text-xs font-bold text-white placeholder-slate-400 focus:bg-white focus:text-slate-900 focus:placeholder-slate-400 outline-none transition-all"
            />
          </div>

          <div className="md:col-span-4 flex items-center gap-2 bg-white/10 border border-white/20 rounded-2xl px-4 h-12 text-xs font-bold text-white">
            <MapPin size={16} className="text-amber-400 shrink-0" />
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="w-full bg-transparent text-white font-bold outline-none cursor-pointer [&>option]:text-slate-900"
            >
              <option value="">All Operating Cities</option>
              {(cities.length > 0 ? cities : [{ id: 1, name: 'Ranchi' }, { id: 2, name: 'Patna' }, { id: 3, name: 'Jamshedpur' }]).map((c) => (
                <option key={c.id || c.name} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <button
              onClick={handleDetectLocation}
              disabled={geoLoading}
              className="h-12 w-full flex items-center justify-center gap-2 rounded-2xl bg-primary px-4 text-xs font-extrabold text-white shadow-sm hover:bg-blue-700 transition-all"
            >
              <LocateFixed size={16} /> {geoLoading ? 'Detecting...' : 'Near Me'}
            </button>
          </div>
        </div>
        {geoMessage && <p className="text-[11px] font-semibold text-amber-300 relative z-10">{geoMessage}</p>}
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Sidebar Filter Controls */}
        <aside className="lg:col-span-3 space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <SlidersHorizontal size={16} className="text-primary" /> Filter Professionals
              </h3>
              <button
                onClick={() => {
                  setSelectedService('all');
                  setSelectedCity('');
                  setExperienceFilter('all');
                  setRatingFilter('all');
                  setMaxPriceFilter(5000);
                  setAvailabilityFilter('all');
                  setSortBy('recommended');
                }}
                className="text-[11px] font-extrabold text-primary hover:underline"
              >
                Reset
              </button>
            </div>

            {/* Service Category */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Service Category</label>
              <select
                value={selectedService}
                onChange={(e) => setSelectedService(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 text-xs font-extrabold text-slate-800 outline-none"
              >
                <option value="all">All Services</option>
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Experience */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Experience Level</label>
              <div className="grid grid-cols-2 gap-1.5 text-xs font-bold">
                {[
                  { id: 'all', label: 'All' },
                  { id: '1-3', label: '1-3 Yrs' },
                  { id: '3-5', label: '3-5 Yrs' },
                  { id: '5+', label: '5+ Yrs' }
                ].map((exp) => (
                  <button
                    key={exp.id}
                    onClick={() => setExperienceFilter(exp.id)}
                    className={`py-2 px-2.5 rounded-xl border text-[11px] transition-all ${
                      experienceFilter === exp.id
                        ? 'bg-slate-900 border-slate-900 text-white'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {exp.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Rating */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Minimum Rating</label>
              <select
                value={ratingFilter}
                onChange={(e) => setRatingFilter(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 text-xs font-extrabold text-slate-800 outline-none"
              >
                <option value="all">Any Rating</option>
                <option value="4.5+">4.5★ & Above (Top Rated)</option>
                <option value="4.0+">4.0★ & Above</option>
              </select>
            </div>

            {/* Price Slider */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-[10px] font-black text-slate-400 uppercase">Max Starting Price</span>
                <span className="font-extrabold text-primary">₹{maxPriceFilter}</span>
              </div>
              <input
                type="range"
                min="199"
                max="5000"
                step="100"
                value={maxPriceFilter}
                onChange={(e) => setMaxPriceFilter(Number(e.target.value))}
                className="w-full accent-primary cursor-pointer"
              />
            </div>

            {/* Availability */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Availability</label>
              <button
                onClick={() => setAvailabilityFilter(availabilityFilter === 'active' ? 'all' : 'active')}
                className={`w-full py-2.5 px-3 rounded-xl border text-xs font-extrabold flex items-center justify-between transition-all ${
                  availabilityFilter === 'active'
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                    : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <CheckCircle size={14} className="text-emerald-600" /> Available Today
                </span>
                {availabilityFilter === 'active' && <Check size={14} />}
              </button>
            </div>
          </div>
        </aside>

        {/* Right Main Worker Listing */}
        <main className="lg:col-span-9 space-y-6">
          {/* Bar Control Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-3xl border border-slate-200 p-5 shadow-sm">
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight">Available Professionals</h2>
              <p className="text-xs text-slate-500 font-semibold">
                Showing {filteredWorkers.length} verified specialists for hire
              </p>
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold text-slate-400 uppercase">Sort By:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-extrabold text-slate-800 outline-none cursor-pointer"
              >
                <option value="recommended">Recommended (Trust Score)</option>
                <option value="highest-rated">Highest Rated ★</option>
                <option value="lowest-price">Lowest Price</option>
                <option value="most-experienced">Most Experienced</option>
                {userLat && <option value="nearest">Nearest Location</option>}
              </select>
            </div>
          </div>

          {/* Workers Card Grid */}
          {filteredWorkers.length === 0 ? (
            <div className="py-20 text-center border-2 border-dashed border-slate-200 bg-white rounded-3xl space-y-4 shadow-sm">
              <User size={48} className="mx-auto text-slate-300" />
              <div className="space-y-1">
                <h4 className="font-extrabold text-slate-800 text-sm">No Service Workers Match Your Filters</h4>
                <p className="text-xs text-slate-400 font-semibold max-w-sm mx-auto">
                  Try adjusting your search criteria, price range, or city location.
                </p>
              </div>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedService('all');
                  setSelectedCity('');
                  setMaxPriceFilter(5000);
                }}
                className="inline-flex items-center gap-2 rounded-2xl bg-primary px-6 py-2.5 text-xs font-extrabold text-white shadow-sm hover:bg-blue-700"
              >
                Reset Search Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredWorkers.map((worker) => {
                const isTrustVerified = (worker.trustScore ?? 100) >= 80;
                const distanceKm =
                  userLat && userLng
                    ? calculateDistance(userLat, userLng, worker.location_latitude, worker.location_longitude)
                    : null;
                const skillsArr = (worker.skills || 'Electrical, Plumber, Home Maintenance')
                  .split(',')
                  .map((s) => s.trim())
                  .filter(Boolean);

                return (
                  <div
                    key={worker.id}
                    className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-5"
                  >
                    <div className="space-y-4">
                      {/* Top Header Card */}
                      <div className="flex justify-between items-start gap-3">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div className="h-14 w-14 rounded-2xl bg-slate-900 text-white font-black text-base flex items-center justify-center uppercase shadow-md overflow-hidden">
                              {worker.profile_photo_url ? (
                                <img src={worker.profile_photo_url} alt={worker.name} className="h-full w-full object-cover" />
                              ) : (
                                (worker.name || 'W').charAt(0)
                              )}
                            </div>
                            {isTrustVerified && (
                              <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white p-1 rounded-full border-2 border-white" title="Fixiva Verified Specialist">
                                <ShieldCheck size={12} />
                              </div>
                            )}
                          </div>

                          <div>
                            <div className="flex items-center gap-1.5">
                              <h3 className="text-base font-black text-slate-900 leading-tight">{worker.name || 'Service Specialist'}</h3>
                            </div>
                            <p className="text-xs text-slate-500 font-bold mt-0.5 flex items-center gap-1">
                              <Building size={13} className="text-slate-400" /> {worker.city || 'Ranchi'}
                              {distanceKm !== null && <span className="text-primary font-black">• {distanceKm} km away</span>}
                            </p>
                          </div>
                        </div>

                        {/* Availability Pill */}
                        <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-wider border border-emerald-200 flex items-center gap-1">
                          <CheckCircle size={10} /> Active
                        </span>
                      </div>

                      {/* Stat Metrics Row */}
                      <div className="grid grid-cols-3 gap-2 py-2 border-y border-slate-100 text-center">
                        <div className="bg-slate-50 p-2 rounded-2xl">
                          <span className="text-[9px] font-black text-slate-400 uppercase block">Trust Score</span>
                          <span className="text-xs font-black text-emerald-700 mt-0.5 block">{worker.trustScore ?? 100}%</span>
                        </div>
                        <div className="bg-slate-50 p-2 rounded-2xl">
                          <span className="text-[9px] font-black text-slate-400 uppercase block">Rating</span>
                          <span className="text-xs font-black text-slate-900 mt-0.5 flex items-center justify-center gap-0.5">
                            <Star size={12} className="text-amber-500 fill-amber-500" /> {worker.rating || 4.9}
                          </span>
                        </div>
                        <div className="bg-slate-50 p-2 rounded-2xl">
                          <span className="text-[9px] font-black text-slate-400 uppercase block">Completed</span>
                          <span className="text-xs font-black text-slate-900 mt-0.5 block">{worker.completed_jobs || 128} Jobs</span>
                        </div>
                      </div>

                      {/* Pricing Row */}
                      <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                        <span>Starting Price: <strong className="text-slate-900 font-black">₹{worker.starting_price || worker.hourly_rate || 299}</strong></span>
                        <span>Visit Charge: <strong className="text-primary font-black">₹{worker.visit_charge || 149}</strong></span>
                      </div>

                      {/* Skills Badges */}
                      <div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1.5">Skills & Expertise</span>
                        <div className="flex flex-wrap gap-1.5">
                          {skillsArr.slice(0, 3).map((sk, i) => (
                            <span key={i} className="px-2.5 py-1 bg-slate-100 text-slate-700 text-[10px] font-bold rounded-lg">
                              {sk}
                            </span>
                          ))}
                          {skillsArr.length > 3 && (
                            <span className="px-2 py-1 bg-slate-100 text-slate-500 text-[10px] font-bold rounded-lg">
                              +{skillsArr.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Card Footer Actions */}
                    <div className="grid grid-cols-2 gap-2 pt-2">
                      <button
                        onClick={() => setActiveWorkerProfile(worker)}
                        className="w-full flex items-center justify-center gap-1 rounded-2xl border border-slate-200 bg-white py-2.5 text-xs font-extrabold text-slate-700 hover:bg-slate-50 transition-all"
                      >
                        <User size={14} /> Profile
                      </button>
                      <button
                        onClick={() => {
                          openBookingModal({ workerObj: worker, serviceId: selectedService, city: selectedCity });
                        }}
                        className="w-full flex items-center justify-center gap-1 rounded-2xl bg-primary py-2.5 text-xs font-extrabold text-white shadow-sm hover:bg-blue-700 transition-all"
                      >
                        <Briefcase size={14} /> Hire Now
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>

      {/* Detailed Worker Profile Drawer/Modal */}
      {activeWorkerProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full border border-slate-200 shadow-2xl space-y-6 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-2xl bg-slate-900 text-white font-black text-xl flex items-center justify-center uppercase shadow-md">
                  {(activeWorkerProfile.name || 'W').charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-black text-slate-900">{activeWorkerProfile.name}</h3>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-black text-[10px]">Verified</span>
                  </div>
                  <p className="text-xs text-slate-500 font-bold">{activeWorkerProfile.skills || 'Home Repair Specialist'}</p>
                </div>
              </div>
              <button onClick={() => setActiveWorkerProfile(null)} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100">
                <X size={20} />
              </button>
            </div>

            {/* Worker Details Tab Content */}
            <div className="space-y-5 text-xs font-semibold text-slate-600">
              <div>
                <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider mb-1">About Professional</h4>
                <p className="leading-relaxed text-slate-600">
                  {activeWorkerProfile.name} is a background-checked Fixiva partner specializing in high-quality home service delivery with an overall trust rating of {activeWorkerProfile.trustScore || 98}%.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div>
                  <span className="text-[10px] font-black text-slate-400 uppercase block">Trust Score</span>
                  <span className="text-sm font-black text-emerald-700 mt-0.5 block">{activeWorkerProfile.trustScore || 98}%</span>
                </div>
                <div>
                  <span className="text-[10px] font-black text-slate-400 uppercase block">Rating</span>
                  <span className="text-sm font-black text-slate-900 mt-0.5 block">4.9 ★</span>
                </div>
                <div>
                  <span className="text-[10px] font-black text-slate-400 uppercase block">Experience</span>
                  <span className="text-sm font-black text-slate-900 mt-0.5 block">{activeWorkerProfile.experience || '6+ Years'}</span>
                </div>
                <div>
                  <span className="text-[10px] font-black text-slate-400 uppercase block">Completed</span>
                  <span className="text-sm font-black text-slate-900 mt-0.5 block">128 Jobs</span>
                </div>
              </div>

              <div>
                <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider mb-2">Verified Certifications</h4>
                <div className="flex flex-wrap gap-2">
                  {['Fixiva Verified Partner', 'Background Verified', 'ISO Safety Compliant'].map((cert, idx) => (
                    <span key={idx} className="px-3 py-1 bg-blue-50 text-primary border border-blue-100 rounded-xl font-extrabold text-[11px] flex items-center gap-1">
                      <ShieldCheck size={12} /> {cert}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider mb-2">Pricing Structure</h4>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-bold">Standard Inspection Visit Charge:</span>
                    <span className="font-black text-slate-900">₹{activeWorkerProfile.visit_charge || 149}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-bold">Service Hourly Rate:</span>
                    <span className="font-black text-slate-900">₹{activeWorkerProfile.hourly_rate || 299}/hr</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button onClick={() => setActiveWorkerProfile(null)} className="rounded-2xl border border-slate-200 px-5 py-2.5 text-xs font-extrabold text-slate-600 hover:bg-slate-50">
                Close Profile
              </button>
              <button
                onClick={() => {
                  openBookingModal({ workerObj: activeWorkerProfile, serviceId: selectedService, city: selectedCity });
                  setActiveWorkerProfile(null);
                }}
                className="rounded-2xl bg-primary px-6 py-2.5 text-xs font-extrabold text-white shadow-sm hover:bg-blue-700"
              >
                Book Worker Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingFlow;
