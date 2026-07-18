/* eslint-disable react-hooks/set-state-in-effect */
import { Fragment, useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin, Calendar, CheckSquare, ArrowRight,
  Loader2, Info, ShieldCheck, Phone, Mail, User, ShieldAlert, LocateFixed
} from 'lucide-react';
import { useApp } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { INDIA_CITIES, getCityOptions } from '../data/mockData';

const DEFAULT_CITIES = INDIA_CITIES;

const BookingFlow = () => {
  const { serviceId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { services, addBooking, user, isAuthenticated, showToast } = useApp();
  const [cities, setCities] = useState(DEFAULT_CITIES);

  useEffect(() => {
    const fetchCities = async () => {
      const { data, error } = await supabase.from('cities').select('*');
      if (!error) {
        setCities(getCityOptions(data || []));
      }
    };
    fetchCities();
  }, []);

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [bookingId, setBookingId] = useState('');
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoMessage, setGeoMessage] = useState('');

  // Pre-fill user data if logged in
  const [formData, setFormData] = useState({
    city: '',
    service: serviceId || '',
    address: '',
    name: '',
    email: '',
    phone: '',
    date: '',
    payment: 'Cash on Service',
    notes: '',
    timeSlot: '',
    locationText: '',
    locationLatitude: null,
    locationLongitude: null,
    locationSource: ''
  });

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const cityFromUrl = queryParams.get('city');
    if (cityFromUrl) {
      setFormData(prev => ({ ...prev, city: cityFromUrl }));
    }
  }, [location.search]);

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || ''
      }));
    }
  }, [user]);

  const [errors, setErrors] = useState({});

  const selectedService = services.find(s => s.id === formData.service);
  const basePrice = selectedService?.base_price || selectedService?.inspection_fee || 0;
  const platformFee = selectedService?.platform_fee || 0;
  const totalAmount = basePrice + platformFee;

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setGeoMessage('Geolocation is not supported in this browser.');
      return;
    }

    setGeoLoading(true);
    setGeoMessage('');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData(prev => ({
          ...prev,
          locationText: `Auto-detected (${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)})`,
          locationLatitude: position.coords.latitude,
          locationLongitude: position.coords.longitude,
          locationSource: 'device'
        }));
        setGeoLoading(false);
        setGeoMessage('Current location detected successfully.');
      },
      (error) => {
        setGeoLoading(false);
        const message = error.code === error.PERMISSION_DENIED
          ? 'Location access was denied. You can still enter a location manually.'
          : 'Unable to detect your location right now. You can still enter a location manually.';
        setGeoMessage(message);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  const validateStep = (s) => {
    let newErrors = {};
    if (s === 1) {
      if (!formData.city) newErrors.city = 'Please select a city';
      if (!formData.service) newErrors.service = 'Please select a service';
    } else if (s === 2) {
      if (!isAuthenticated) {
        newErrors.auth = 'You must be logged in to book a service';
      }
      if (!formData.name) newErrors.name = 'Contact name is required';
      if (!formData.address) newErrors.address = 'Full address is required';
      if (!formData.email) newErrors.email = 'Email address is required';
      if (!formData.phone) newErrors.phone = 'Mobile phone is required';
    } else if (s === 3) {
      if (!formData.date) newErrors.date = 'Appointment date is required';
      if (!formData.timeSlot) newErrors.timeSlot = 'Time slot selection is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(step)) {
      setStep(step + 1);
    }
  };

  const prevStep = () => setStep(step - 1);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      showToast("Please login first to book a service.", 'error');
      navigate('/login');
      return;
    }
    if (validateStep(3)) {
      setLoading(true);
      const generatedId = `BK-${Math.floor(100000 + Math.random() * 900000)}`;
      setBookingId(generatedId);
      
      setTimeout(async () => {
        try {
          const combinedAddress = `${formData.address}${formData.notes ? ` (Notes: ${formData.notes})` : ''}${formData.timeSlot ? ` (Slot: ${formData.timeSlot})` : ''}`;
          const displayCities = cities && cities.length > 0 ? cities : DEFAULT_CITIES;
          const selectedCityRecord = displayCities.find((city) => (city.name || '').toLowerCase() === (formData.city || '').trim().toLowerCase());
          const payload = {
            id: generatedId,
            customer_id: user?.id,
            service_id: formData.service,
            city_id: selectedCityRecord?.id ?? null,
            address: combinedAddress,
            preferred_date: formData.date,
            status: "New Request",
            
            // Sync schema properties
            customer_name: formData.name,
            customer_phone: formData.phone,
            customer_address: combinedAddress,
            worker_id: null,
            worker_name: null,
            worker_phone: null,
            service_name: selectedService?.name || formData.service,
            city: formData.city,
            booking_date: formData.date,
            price: basePrice,
            platform_fee: platformFee,
            location_text: formData.locationText || '',
            location_latitude: formData.locationLatitude,
            location_longitude: formData.locationLongitude,
            location_source: formData.locationSource || (formData.locationText ? 'manual' : '')
          };
          
          const { error } = await addBooking(payload);
          setLoading(false);
          if (error) {
            showToast('Booking creation failed: ' + error.message, 'error');
          } else {
            setSuccess(true);
          }
        } catch {
          setLoading(false);
          showToast('Booking dispatch failed.', 'error');
        }
      }, 1000);
    }
  };

  const displayCities = cities && cities.length > 0 ? cities : DEFAULT_CITIES;
  const allCities = displayCities.map(c => c.name).sort();

  if (success) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16">
        <motion.div 
          className="bg-white rounded-3xl border border-slate-100 p-10 md:p-16 text-center shadow-xl shadow-slate-100 space-y-8"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 20 }}
        >
          <div className="mx-auto bg-green-50 text-success h-20 w-20 rounded-full flex items-center justify-center shadow-inner">
            <CheckSquare size={40} />
          </div>

          <div className="space-y-2">
            <h2 className="text-3xl font-black text-slate-900">Booking Confirmed!</h2>
            <p className="text-slate-500 font-medium text-sm max-w-md mx-auto">
              Your request has been registered. Our system is auto-dispatching a verified home professional in your area.
            </p>
          </div>

          {/* Checkout billing table summaries */}
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 text-left text-xs font-semibold space-y-3">
            <div className="flex justify-between pb-2.5 border-b border-slate-200/60">
              <span className="text-slate-400 uppercase tracking-wider">Booking ID</span>
              <span className="text-primary font-bold">{bookingId}</span>
            </div>
            <div className="flex justify-between pb-2.5 border-b border-slate-200/60">
              <span className="text-slate-400 uppercase tracking-wider">Requested service</span>
              <span className="text-slate-800">{selectedService?.name}</span>
            </div>
            <div className="flex justify-between pb-2.5 border-b border-slate-200/60">
              <span className="text-slate-400 uppercase tracking-wider">Convenience City</span>
              <span className="text-slate-800">{formData.city}</span>
            </div>
            <div className="flex justify-between pt-1">
              <span className="text-slate-500 font-bold uppercase tracking-wider">Total Settlement Payout</span>
              <span className="text-primary font-black text-sm">₹{totalAmount}</span>
            </div>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
            <Link 
              to="/dashboard/customer" 
              className="btn-primary text-sm px-8 py-3.5 rounded-xl shadow-md text-center"
            >
              Track booking Progress
            </Link>
            <Link 
              to="/" 
              className="btn-secondary text-sm px-8 py-3.5 rounded-xl text-center"
            >
              Back to Home
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
      
      {/* Visual Step Stepper */}
      <div className="max-w-lg mx-auto mb-16 flex items-center justify-between">
        {[1, 2, 3].map((num) => (
          <Fragment key={num}>
            <div className="flex flex-col items-center">
              <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                step >= num 
                  ? 'bg-primary text-white ring-4 ring-primary-light shadow-md' 
                  : 'bg-white border border-slate-200 text-slate-400'
              }`}>
                {num}
              </div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-2">
                {num === 1 ? 'Service' : num === 2 ? 'Details' : 'Schedule'}
              </span>
            </div>
            {num < 3 && (
              <div className={`flex-1 h-0.5 mx-2 transition-all duration-500 ${
                step > num ? 'bg-primary' : 'bg-slate-200'
              }`} />
            )}
          </Fragment>
        ))}
      </div>

      {/* Main Flow Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Interactive Wizard steps */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm min-h-[450px] flex flex-col justify-between">
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div 
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div>
                    <h2 className="text-xl font-black text-slate-900 tracking-tight">Select Service & Operating City</h2>
                    <p className="text-xs text-slate-400 mt-1 font-semibold">Choose where and what type of expert assistance is needed.</p>
                  </div>

                  {/* Select City */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Convenience City</label>
                    <div className="relative">
                      <MapPin className="absolute left-3.5 top-3.5 text-slate-400" size={16} />
                      <select
                        className="w-full h-11 pl-10 pr-4 bg-slate-50 border border-slate-200 focus:border-primary rounded-xl text-xs font-bold text-slate-700 cursor-pointer outline-none transition-all"
                        value={formData.city}
                        onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                      >
                        <option value="">Select Target City</option>
                        {allCities.map(city => <option key={city} value={city}>{city}</option>)}
                      </select>
                    </div>
                    {errors.city && <p className="text-danger text-xs font-bold">{errors.city}</p>}
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Precise Location (Optional)</label>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <input
                        className="flex-1 h-11 px-4 bg-slate-50 border border-slate-200 focus:border-primary rounded-xl text-xs font-semibold placeholder-slate-400 outline-none transition-all"
                        placeholder="Enter landmark, locality, or area"
                        value={formData.locationText}
                        onChange={(e) => setFormData(prev => ({ ...prev, locationText: e.target.value, locationSource: e.target.value ? 'manual' : '' }))}
                      />
                      <button
                        type="button"
                        onClick={handleUseCurrentLocation}
                        disabled={geoLoading}
                        className="h-11 px-4 rounded-xl border border-sky-200/80 bg-gradient-to-r from-sky-200 via-cyan-100 to-sky-100 text-slate-700 text-xs font-black shadow-sm shadow-sky-200/40 flex items-center justify-center gap-2 disabled:opacity-60 hover:shadow-md hover:shadow-sky-200/50 transition-all"
                      >
                        {geoLoading ? (
                          <Loader2 size={18} className="animate-spin" />
                        ) : (
                          <span className="rounded-full bg-white/15 p-1.5">
                            <LocateFixed size={18} />
                          </span>
                        )}
                        {geoLoading ? 'Detecting...' : 'Use Current Location'}
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-400 font-semibold">We use your city first, then your precise location to find the best nearby worker.</p>
                    {geoMessage && <p className={`text-[10px] font-semibold ${geoMessage.includes('successfully') ? 'text-green-600' : 'text-amber-600'}`}>{geoMessage}</p>}
                  </div>

                  {/* Select Service */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Choose Service Category</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      {services.map(s => (
                        <div 
                          key={s.id}
                          onClick={() => setFormData(prev => ({ ...prev, service: s.id }))}
                          className={`p-4 border rounded-xl cursor-pointer hover:border-slate-300 transition-all flex justify-between items-center ${
                            formData.service === s.id 
                              ? 'border-primary bg-blue-50/50 ring-2 ring-primary/10' 
                              : 'border-slate-100 bg-slate-50/20'
                          }`}
                        >
                          <div>
                            <h4 className="text-xs font-bold text-slate-800">{s.name}</h4>
                            <p className="text-[10px] text-slate-400 mt-1 font-bold">Starts ₹{s.base_price || s.inspection_fee || 0}</p>
                          </div>
                          <div className={`h-4 w-4 rounded-full border flex items-center justify-center shrink-0 ${
                            formData.service === s.id ? 'border-primary bg-primary' : 'border-slate-300'
                          }`}>
                            {formData.service === s.id && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                          </div>
                        </div>
                      ))}
                    </div>
                    {errors.service && <p className="text-danger text-xs font-bold">{errors.service}</p>}
                  </div>

                  <div className="pt-6">
                    <button 
                      onClick={nextStep}
                      disabled={!formData.city || !formData.service}
                      className="w-full btn-primary text-sm py-3.5 rounded-xl shadow-md flex items-center justify-center gap-1.5"
                    >
                      Continue to Details <ArrowRight size={16} />
                    </button>
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div 
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div>
                    <h2 className="text-xl font-black text-slate-900 tracking-tight">Deployment Coordinates</h2>
                    <p className="text-xs text-slate-400 mt-1 font-semibold">Verify contact options and full delivery coordinates.</p>
                  </div>

                  {/* Auth Warning banner */}
                  {!isAuthenticated && (
                    <div className="p-4 bg-red-50 rounded-xl flex gap-3 items-start border border-red-100/50 text-xs font-semibold text-danger">
                      <ShieldAlert className="shrink-0 mt-0.5" size={16} />
                      <div>
                        <h5 className="font-bold mb-0.5">Authentication Required</h5>
                        <p className="text-red-700/80">Please <Link to="/login" className="underline font-bold text-danger">Login</Link> or <Link to="/register" className="underline font-bold text-danger">Register</Link> to secure booking protection features.</p>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Full Name</label>
                      <div className="relative">
                        <User className="absolute left-3.5 top-3.5 text-slate-400" size={16} />
                        <input
                          className="w-full h-11 pl-10 pr-4 bg-slate-50 border border-slate-200 focus:border-primary rounded-xl text-xs font-semibold placeholder-slate-400 outline-none transition-all"
                          placeholder="Contact name"
                          value={formData.name}
                          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        />
                      </div>
                      {errors.name && <p className="text-danger text-xs font-bold">{errors.name}</p>}
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Email Address</label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-3.5 text-slate-400" size={16} />
                        <input
                          className="w-full h-11 pl-10 pr-4 bg-slate-50 border border-slate-200 focus:border-primary rounded-xl text-xs font-semibold placeholder-slate-400 outline-none transition-all"
                          placeholder="name@email.com"
                          value={formData.email}
                          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        />
                      </div>
                      {errors.email && <p className="text-danger text-xs font-bold">{errors.email}</p>}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Mobile Number</label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-3.5 text-slate-400" size={16} />
                      <input
                        className="w-full h-11 pl-10 pr-4 bg-slate-50 border border-slate-200 focus:border-primary rounded-xl text-xs font-semibold placeholder-slate-400 outline-none transition-all"
                        placeholder="10-digit phone number"
                        value={formData.phone}
                        onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      />
                    </div>
                    {errors.phone && <p className="text-danger text-xs font-bold">{errors.phone}</p>}
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Deployment Address</label>
                    <textarea
                      className="w-full p-4 bg-slate-50 border border-slate-200 focus:border-primary rounded-xl text-xs font-semibold placeholder-slate-400 outline-none transition-all"
                      rows="2"
                      placeholder="Flat/House number, Street name, Landmark coordinates..."
                      value={formData.address}
                      onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                    />
                    {errors.address && <p className="text-danger text-xs font-bold">{errors.address}</p>}
                  </div>

                  {/* Additional Notes Field */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Additional Notes / Instructions (Optional)</label>
                    <textarea
                      className="w-full p-4 bg-slate-50 border border-slate-200 focus:border-primary rounded-xl text-xs font-semibold placeholder-slate-400 outline-none transition-all"
                      rows="2"
                      placeholder="Any specific requests, entry instructions, or details about the issue..."
                      value={formData.notes}
                      onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    />
                  </div>

                  {errors.auth && <p className="text-danger text-xs font-bold text-center mt-2">{errors.auth}</p>}

                  <div className="pt-6 flex gap-4">
                    <button 
                      onClick={prevStep}
                      className="flex-1 btn-secondary text-sm py-3.5 rounded-xl"
                    >
                      Back
                    </button>
                    <button 
                      onClick={nextStep}
                      className="flex-1 btn-primary text-sm py-3.5 rounded-xl shadow-md"
                      disabled={!isAuthenticated}
                    >
                      Continue to Schedule
                    </button>
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div 
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div>
                    <h2 className="text-xl font-black text-slate-900 tracking-tight">Schedule Date & Slot</h2>
                    <p className="text-xs text-slate-400 mt-1 font-semibold">Select appointment arrival timeline details.</p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Preferred Date</label>
                    <div className="relative">
                      <Calendar className="absolute left-3.5 top-3.5 text-slate-400" size={16} />
                      <input
                        type="date"
                        className="w-full h-11 pl-10 pr-4 bg-slate-50 border border-slate-200 focus:border-primary rounded-xl text-xs font-bold text-slate-700 outline-none transition-all"
                        min={new Date().toISOString().split('T')[0]}
                        value={formData.date}
                        onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                      />
                    </div>
                    {errors.date && <p className="text-danger text-xs font-bold">{errors.date}</p>}
                  </div>

                  {/* Time Slot Selection */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Preferred Time Slot</label>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { id: 'morning', label: 'Morning', time: '8 AM - 12 PM' },
                        { id: 'afternoon', label: 'Afternoon', time: '12 PM - 4 PM' },
                        { id: 'evening', label: 'Evening', time: '4 PM - 8 PM' }
                      ].map((slot) => (
                        <div
                          key={slot.id}
                          onClick={() => setFormData(prev => ({ ...prev, timeSlot: slot.label + ' (' + slot.time + ')' }))}
                          className={`p-3 border rounded-xl cursor-pointer text-center hover:border-slate-300 transition-all ${
                            formData.timeSlot.includes(slot.label)
                              ? 'border-primary bg-blue-50/50 ring-2 ring-primary/10 font-bold'
                              : 'border-slate-200 bg-slate-50/20'
                          }`}
                        >
                          <span className="block text-xs text-slate-800">{slot.label}</span>
                          <span className="block text-[8px] text-slate-400 mt-0.5">{slot.time}</span>
                        </div>
                      ))}
                    </div>
                    {errors.timeSlot && <p className="text-danger text-xs font-bold">{errors.timeSlot}</p>}
                  </div>

                  <div className="p-4 bg-blue-50/50 rounded-xl flex gap-3 items-start border border-blue-100/50 text-xs font-semibold text-primary">
                    <ShieldCheck className="shrink-0 mt-0.5" size={16} />
                    <div>
                      <h5 className="font-bold mb-0.5">Transparent Tariffs Protection</h5>
                      <p className="text-blue-700/80">Every expert holds verified background credentials. Pay flat rates after complete satisfaction check.</p>
                    </div>
                  </div>

                  <div className="pt-6 flex gap-4">
                    <button 
                      onClick={prevStep}
                      className="flex-1 btn-secondary text-sm py-3.5 rounded-xl"
                      disabled={loading}
                    >
                      Back
                    </button>
                    <button 
                      onClick={handleSubmit}
                      className="flex-1 btn-primary text-sm py-3.5 rounded-xl shadow-md flex items-center justify-center gap-1.5"
                      disabled={loading}
                    >
                      {loading ? <Loader2 className="animate-spin" size={16} /> : (
                        <>
                          Confirm Booking
                          <ArrowRight size={16} />
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right Sticky Invoice Checkout summary */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
            <div className="p-5 bg-slate-900 text-white text-xs font-extrabold uppercase tracking-wider">
              Checkout pricing summary
            </div>
            <div className="p-6 space-y-6">
              {selectedService ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-xs font-semibold text-slate-500">
                    <span>Base professional fee</span>
                    <span className="text-slate-800">₹{basePrice}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs font-semibold text-slate-500">
                    <span className="flex items-center gap-1">
                      Convenience convenience fee <Info size={12} className="text-slate-300" />
                    </span>
                    <span className="text-slate-800">₹{platformFee}</span>
                  </div>
                  
                  <div className="border-t border-slate-100 pt-4 flex justify-between items-center text-xs">
                    <span className="font-extrabold text-slate-900 uppercase">Estimated Invoice</span>
                    <span className="font-black text-primary text-base">₹{totalAmount}</span>
                  </div>

                  <div className="p-3 bg-amber-50/50 text-warning text-xs font-extrabold border border-amber-100/50 rounded-xl text-center">
                    CASH ON SERVICE ONLY
                  </div>
                  
                  <p className="text-[9px] text-slate-400 text-center font-bold uppercase tracking-wider">
                    Digital online billing coming soon
                  </p>
                </div>
              ) : (
                <div className="text-center py-12 space-y-2">
                  <Info className="mx-auto text-slate-200" size={32} />
                  <p className="text-xs text-slate-400 font-semibold">Select service category to compute checkout total invoice.</p>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default BookingFlow;
