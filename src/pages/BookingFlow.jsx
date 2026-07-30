import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Star,
  CheckCircle,
  ArrowRight,
  Sparkles,
  ArrowLeft,
  Check
} from 'lucide-react';
import { useApp } from '../context/AuthContext';
import HierarchicalLocationSelector from '../components/HierarchicalLocationSelector';
import { detectCurrentLocation } from '../services/locationService';
import { findAvailableProfessionals, createBooking } from '../services/bookingService';
import { submitCoverageRequest } from '../services/coverageService';

const BookingFlow = () => {
  const { serviceId: paramServiceId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const {
    services = [],
    user,
    showToast
  } = useApp();

  // Parse URL query parameters
  const queryParams = new URLSearchParams(location.search);
  const initialServiceId = paramServiceId || queryParams.get('service') || 'electrician';
  const initialParamState = queryParams.get('state') || 'Jharkhand';
  const initialParamDistrict = queryParams.get('district') || 'Ranchi';
  const initialParamLocality = queryParams.get('locality') || 'Lalpur';

  // Step state: 1: Service, 2: Location, 3: Match Pros, 4: Schedule & Contact, 5: Confirmation
  const [step, setStep] = useState(2);
  const [selectedServiceId, setSelectedServiceId] = useState(initialServiceId);

  // Location state
  const [selectedState, setSelectedState] = useState(initialParamState);
  const [selectedDistrict, setSelectedDistrict] = useState(initialParamDistrict);
  const [selectedLocality, setSelectedLocality] = useState(initialParamLocality);
  const [userLat, setUserLat] = useState(null);
  const [userLng, setUserLng] = useState(null);
  const [detectingGps, setDetectingGps] = useState(false);

  // Matching Engine state
  const [matchingLoading, setMatchingLoading] = useState(false);
  const [isDistrictActiveStatus, setIsDistrictActiveStatus] = useState(true);
  const [availablePros, setAvailablePros] = useState([]);
  const [selectedPro, setSelectedPro] = useState(null);

  // Service Unavailable & Coverage Request state
  const [coverageRequested, setCoverageRequested] = useState(false);
  const [coveragePhone, setCoveragePhone] = useState(user?.phone || '');
  const [submittingCoverage, setSubmittingCoverage] = useState(false);

  // Booking Details state
  const [bookingDate, setBookingDate] = useState(new Date().toISOString().split('T')[0]);
  const [bookingTimeSlot, setBookingTimeSlot] = useState('09:00 AM - 12:00 PM');
  const [customerName, setCustomerName] = useState(user?.name || '');
  const [customerPhone, setCustomerPhone] = useState(user?.phone || '');
  const [addressLine, setAddressLine] = useState('');
  const [bookingSubmitting, setBookingSubmitting] = useState(false);
  const [createdBooking, setCreatedBooking] = useState(null);

  // Pre-fill user data
  useEffect(() => {
    if (user) {
      queueMicrotask(() => {
        if (user.name) setCustomerName(user.name);
        if (user.phone) {
          setCustomerPhone(user.phone);
          setCoveragePhone(user.phone);
        }
      });
    }
  }, [user]);

  // Active Service object
  const activeService = services.find(s => s.id === selectedServiceId) || {
    id: selectedServiceId,
    name: selectedServiceId ? selectedServiceId.charAt(0).toUpperCase() + selectedServiceId.slice(1) : 'Electrician',
    base_price: 199,
    platform_fee: 49
  };

  // Run Locality Matching Engine when step 3 or location/service changes
  const runMatchingEngine = useCallback(async () => {
    setMatchingLoading(true);
    setCoverageRequested(false);
    try {
      const res = await findAvailableProfessionals({
        serviceId: selectedServiceId,
        state: selectedState,
        district: selectedDistrict,
        locality: selectedLocality,
        userLat,
        userLng
      });

      setIsDistrictActiveStatus(res.districtActive);
      setAvailablePros(res.professionals || []);
      if (res.professionals && res.professionals.length > 0) {
        setSelectedPro(res.professionals[0]);
      }
    } catch {
      showToast('Error matching nearby professionals', 'error');
    } finally {
      setMatchingLoading(false);
    }
  }, [selectedServiceId, selectedState, selectedDistrict, selectedLocality, userLat, userLng, showToast]);

  useEffect(() => {
    queueMicrotask(() => {
      runMatchingEngine();
    });
  }, [runMatchingEngine]);

  // Handle GPS location detection (Optional)
  const handleDetectGps = async () => {
    setDetectingGps(true);
    try {
      const loc = await detectCurrentLocation();
      setSelectedState(loc.state || 'Jharkhand');
      setSelectedDistrict(loc.district || 'Ranchi');
      setSelectedLocality(loc.locality || 'Lalpur');
      setUserLat(loc.latitude);
      setUserLng(loc.longitude);
      showToast('📍 Current location auto-detected!', 'success');
    } catch {
      showToast('Location permission denied or unavailable. Please select manually.', 'error');
    } finally {
      setDetectingGps(false);
    }
  };

  // Explicit Coverage Request Click
  const handleRequestCoverage = async () => {
    if (!coveragePhone.trim()) {
      showToast('Please enter your mobile number.', 'error');
      return;
    }
    setSubmittingCoverage(true);
    try {
      const res = await submitCoverageRequest({
        customer_id: user?.id,
        customer_name: customerName || user?.name || 'Customer',
        phone: coveragePhone.trim(),
        email: user?.email || '',
        service_id: activeService.id,
        service_name: activeService.name,
        state: selectedState,
        district: selectedDistrict,
        locality: selectedLocality,
        latitude: userLat,
        longitude: userLng
      });

      if (res.success) {
        setCoverageRequested(true);
        showToast(res.message || 'Coverage request submitted! We will notify you when services launch.', 'success');
      } else {
        showToast(res.error || 'Failed to submit request.', 'error');
      }
    } catch {
      showToast('Failed to submit coverage request.', 'error');
    } finally {
      setSubmittingCoverage(false);
    }
  };

  // Submit Final Booking
  const handleConfirmBooking = async () => {
    if (!customerName.trim() || !customerPhone.trim()) {
      showToast('Please fill in your name and phone number.', 'error');
      return;
    }

    setBookingSubmitting(true);
    try {
      const res = await createBooking({
        customer_id: user?.id,
        worker_id: selectedPro?.id,
        service_id: activeService.id,
        service_name: activeService.name,
        state: selectedState,
        district: selectedDistrict,
        locality: selectedLocality,
        address: addressLine ? `${addressLine}, ${selectedLocality}, ${selectedDistrict}` : `${selectedLocality}, ${selectedDistrict}, ${selectedState}`,
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim(),
        worker_name: selectedPro?.name || 'Assigned Specialist',
        worker_phone: selectedPro?.whatsapp || '',
        price: activeService.base_price || 199,
        platform_fee: activeService.platform_fee || 49,
        booking_date: bookingDate
      });

      if (res.data) {
        setCreatedBooking(res.data);
        setStep(5);
        showToast('🎉 Service booked successfully!', 'success');
      } else {
        showToast(res.error || 'Failed to place booking.', 'error');
      }
    } catch {
      showToast('An error occurred while booking.', 'error');
    } finally {
      setBookingSubmitting(false);
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen py-10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        
        {/* Top Header & Progress Stepper */}
        <div className="mb-8 bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
            <div>
              <span className="text-[10px] font-black tracking-widest text-primary uppercase">Fixiva Dispatch</span>
              <h1 className="text-2xl font-black text-slate-900">Book {activeService.name}</h1>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full">
                Step {step} of 5
              </span>
            </div>
          </div>

          {/* Stepper Steps */}
          <div className="grid grid-cols-5 gap-2">
            {[
              { id: 1, name: 'Service' },
              { id: 2, name: 'Location' },
              { id: 3, name: 'Match Pros' },
              { id: 4, name: 'Details' },
              { id: 5, name: 'Confirmed' }
            ].map(s => (
              <div 
                key={s.id} 
                className={`flex flex-col items-center gap-1 cursor-pointer transition-all ${
                  s.id <= step ? 'text-primary font-bold' : 'text-slate-400 font-medium'
                }`}
                onClick={() => s.id < step && setStep(s.id)}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black border ${
                  s.id < step ? 'bg-primary text-white border-primary' : s.id === step ? 'bg-primary/10 text-primary border-primary' : 'bg-slate-50 text-slate-400 border-slate-200'
                }`}>
                  {s.id < step ? <Check size={14} /> : s.id}
                </div>
                <span className="text-[11px] hidden sm:block">{s.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* STEP 1: SELECT SERVICE */}
        {step === 1 && (
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
              <h2 className="text-lg font-bold text-slate-900 mb-4">Choose Required Service</h2>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {services.map(s => (
                  <button
                    key={s.id}
                    onClick={() => {
                      setSelectedServiceId(s.id);
                      setStep(2);
                    }}
                    className={`p-4 rounded-2xl border text-left flex flex-col items-start gap-2 transition-all ${
                      selectedServiceId === s.id 
                        ? 'border-primary bg-primary/5 text-slate-900 shadow-md ring-2 ring-primary/20'
                        : 'border-slate-100 hover:border-slate-200 bg-white text-slate-700'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold">
                      <Sparkles size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm">{s.name}</h3>
                      <span className="text-xs text-slate-500">Starting ₹{s.base_price || 199}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* STEP 2: CHOOSE LOCATION */}
        {step === 2 && (
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100 space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-xl font-black text-slate-900">Select Service Location</h2>
                <p className="text-xs text-slate-500 mt-1">We match verified experts available in your locality.</p>
              </div>

              {/* Option A: Use Current Location */}
              <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center shrink-0 shadow-md">
                    📍
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Option A: Use Current Location (Optional)</h3>
                    <p className="text-xs text-slate-500">Auto-detect your State, District, and Locality instantly.</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleDetectGps}
                  disabled={detectingGps}
                  className="btn-primary text-xs px-4 py-2.5 rounded-xl shrink-0 flex items-center gap-1.5 shadow-sm"
                >
                  {detectingGps ? 'Detecting...' : 'Detect My Location'}
                </button>
              </div>

              {/* Option B: Manual Location Selection */}
              <div className="space-y-4 pt-2">
                <h3 className="text-sm font-bold text-slate-900">Option B: Manual Location Selection</h3>
                
                <HierarchicalLocationSelector
                  selectedState={selectedState}
                  selectedDistrict={selectedDistrict}
                  selectedLocality={selectedLocality}
                  onChange={({ state, district, locality }) => {
                    setSelectedState(state);
                    setSelectedDistrict(district);
                    setSelectedLocality(locality);
                  }}
                  statePlaceholder="Select State"
                  districtPlaceholder="Select District"
                  localityPlaceholder="Select Locality"
                  variant="boxed"
                  layout="col"
                />
              </div>

              <div className="pt-4 flex justify-between items-center border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1"
                >
                  <ArrowLeft size={14} /> Back
                </button>

                <button
                  type="button"
                  onClick={() => setStep(3)}
                  disabled={!selectedDistrict || !selectedLocality}
                  className="btn-primary text-xs px-6 py-3 rounded-xl flex items-center gap-1.5 shadow-md"
                >
                  Search Nearby Pros
                  <ArrowRight size={15} />
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* STEP 3: LOCALITY MATCHING / RESULTS */}
        {step === 3 && (
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            
            {/* Matching Engine Loading State */}
            {matchingLoading && (
              <div className="bg-white rounded-3xl p-12 text-center shadow-sm border border-slate-100 space-y-4">
                <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin mx-auto"></div>
                <h3 className="text-base font-bold text-slate-900">Matching Nearby Professionals...</h3>
                <p className="text-xs text-slate-500">Checking active coverage and distance parameters for {selectedLocality}, {selectedDistrict}</p>
              </div>
            )}

            {/* IF DISTRICT IS NOT ACTIVE: SERVICE UNAVAILABLE SCREEN */}
            {!matchingLoading && !isDistrictActiveStatus && (
              <div className="bg-white rounded-3xl p-8 sm:p-12 text-center shadow-sm border border-slate-100 space-y-6 max-w-2xl mx-auto">
                <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center mx-auto text-2xl">
                  🚨
                </div>

                <div className="space-y-2">
                  <h2 className="text-2xl font-black text-slate-900">Fixiva is currently unavailable in your district.</h2>
                  <p className="text-sm text-slate-600 font-medium leading-relaxed">
                    We're expanding rapidly! Would you like us to launch Fixiva home services in <span className="font-bold text-slate-900">{selectedDistrict}</span>?
                  </p>
                </div>

                {!coverageRequested ? (
                  <div className="space-y-4 pt-2 max-w-md mx-auto">
                    <input
                      type="tel"
                      placeholder="Enter mobile number for notification"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-semibold outline-none focus:border-primary"
                      value={coveragePhone}
                      onChange={(e) => setCoveragePhone(e.target.value)}
                    />

                    <div className="flex flex-col sm:flex-row gap-3">
                      <button
                        type="button"
                        onClick={handleRequestCoverage}
                        disabled={submittingCoverage}
                        className="btn-primary flex-1 text-xs py-3 rounded-xl shadow-md font-extrabold"
                      >
                        {submittingCoverage ? 'Submitting...' : 'Request Coverage'}
                      </button>

                      <button
                        type="button"
                        onClick={() => setStep(2)}
                        className="flex-1 text-xs py-3 rounded-xl border border-slate-200 font-bold text-slate-700 hover:bg-slate-50"
                      >
                        Change Location
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-100">
                    ✔ Coverage requested! We will alert you when services launch in {selectedDistrict}.
                  </div>
                )}
              </div>
            )}

            {/* IF DISTRICT IS ACTIVE: DISPLAY MATCHED PROFESSIONALS */}
            {!matchingLoading && isDistrictActiveStatus && (
              <div className="space-y-6">
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-[10px] font-black uppercase text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md">District Active</span>
                    <h2 className="text-lg font-extrabold text-slate-900 mt-1">Available Professionals near {selectedLocality}</h2>
                    <p className="text-xs text-slate-500">Sorted by Nearest Distance → Rating → Completed Jobs → Availability</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="text-xs font-bold text-primary hover:underline"
                  >
                    Change Locality ({selectedLocality})
                  </button>
                </div>

                {/* Professional Cards List */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {availablePros.map(pro => (
                    <div
                      key={pro.id}
                      onClick={() => setSelectedPro(pro)}
                      className={`bg-white rounded-3xl p-5 border cursor-pointer transition-all flex flex-col justify-between space-y-4 ${
                        selectedPro?.id === pro.id
                          ? 'border-primary ring-2 ring-primary/20 shadow-lg'
                          : 'border-slate-100 hover:border-slate-200 shadow-sm'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <img
                          src={pro.profile_photo_url}
                          alt={pro.name}
                          className="w-14 h-14 rounded-2xl object-cover border border-slate-100 shrink-0"
                        />

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <h3 className="font-extrabold text-sm text-slate-900 truncate">{pro.name}</h3>
                            <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700">
                              {pro.status}
                            </span>
                          </div>

                          <p className="text-xs text-slate-500 font-medium">{pro.role}</p>

                          <div className="flex items-center gap-3 text-xs mt-2 text-slate-600 font-semibold">
                            <span className="flex items-center gap-1 text-amber-500 font-bold">
                              <Star size={13} fill="currentColor" /> {pro.rating}
                            </span>
                            <span>•</span>
                            <span>{pro.completed_jobs} Jobs</span>
                            <span>•</span>
                            <span>{pro.experience}</span>
                          </div>
                        </div>
                      </div>

                      {/* Distance & ETA Info (No Exact Address Exposed!) */}
                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-slate-700 flex items-center gap-1">
                            📍 {pro.distance_km} km away
                          </span>
                          <span className="font-semibold text-slate-500 flex items-center gap-1">
                            ⏱ ETA: {pro.eta_text}
                          </span>
                        </div>

                        <span className="font-black text-sm text-slate-900">
                          ₹{pro.starting_price}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-4 flex justify-between items-center">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1"
                  >
                    <ArrowLeft size={14} /> Change Location
                  </button>

                  <button
                    type="button"
                    onClick={() => setStep(4)}
                    disabled={!selectedPro}
                    className="btn-primary text-xs px-6 py-3 rounded-xl flex items-center gap-1.5 shadow-md"
                  >
                    Proceed with {selectedPro?.name || 'Selected Pro'}
                    <ArrowRight size={15} />
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* STEP 4: SCHEDULE & CONTACT DETAILS */}
        {step === 4 && (
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100 space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-xl font-black text-slate-900">Booking & Contact Details</h2>
                <p className="text-xs text-slate-500 mt-1">Provide schedule and service address in {selectedLocality}, {selectedDistrict}.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Schedule & Time */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-slate-900">1. Preferred Schedule</h3>
                  
                  <div>
                    <label className="text-xs font-bold text-slate-600 block mb-1">Date</label>
                    <input
                      type="date"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold outline-none focus:border-primary"
                      value={bookingDate}
                      onChange={(e) => setBookingDate(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-600 block mb-1">Time Slot</label>
                    <select
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold outline-none focus:border-primary"
                      value={bookingTimeSlot}
                      onChange={(e) => setBookingTimeSlot(e.target.value)}
                    >
                      <option value="09:00 AM - 12:00 PM">09:00 AM - 12:00 PM (Morning)</option>
                      <option value="12:00 PM - 03:00 PM">12:00 PM - 03:00 PM (Afternoon)</option>
                      <option value="03:00 PM - 06:00 PM">03:00 PM - 06:00 PM (Evening)</option>
                      <option value="06:00 PM - 09:00 PM">06:00 PM - 09:00 PM (Night)</option>
                    </select>
                  </div>
                </div>

                {/* Contact & Address */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-slate-900">2. Customer Info & Address</h3>

                  <div>
                    <label className="text-xs font-bold text-slate-600 block mb-1">Full Name</label>
                    <input
                      type="text"
                      placeholder="Your Name"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold outline-none focus:border-primary"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-600 block mb-1">Phone Number</label>
                    <input
                      type="tel"
                      placeholder="10-digit mobile number"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold outline-none focus:border-primary"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-600 block mb-1">House / Flat No / Street Address</label>
                    <input
                      type="text"
                      placeholder={`e.g. House #42, Main Road near Landmark`}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold outline-none focus:border-primary"
                      value={addressLine}
                      onChange={(e) => setAddressLine(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Order Price Summary */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                <div>
                  <span className="font-extrabold text-slate-900">{activeService.name} Service Charge</span>
                  <p className="text-slate-500 font-medium">Assigned Pro: {selectedPro?.name}</p>
                </div>

                <div className="text-right">
                  <span className="text-base font-black text-slate-900">₹{(activeService.base_price || 199) + (activeService.platform_fee || 49)}</span>
                  <p className="text-[10px] text-slate-400">Includes ₹{activeService.platform_fee || 49} Platform Fee</p>
                </div>
              </div>

              <div className="pt-4 flex justify-between items-center border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1"
                >
                  <ArrowLeft size={14} /> Back
                </button>

                <button
                  type="button"
                  onClick={handleConfirmBooking}
                  disabled={bookingSubmitting}
                  className="btn-primary text-xs px-8 py-3 rounded-xl flex items-center gap-1.5 shadow-md font-black"
                >
                  {bookingSubmitting ? 'Confirming...' : 'Confirm & Book Service'}
                  <CheckCircle size={15} />
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* STEP 5: CONFIRMATION & RECEIPT */}
        {step === 5 && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6 max-w-xl mx-auto">
            <div className="bg-white rounded-3xl p-8 text-center shadow-lg border border-slate-100 space-y-6">
              <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center mx-auto text-3xl shadow-sm">
                🎉
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase text-emerald-600 tracking-widest">Booking Confirmed</span>
                <h2 className="text-2xl font-black text-slate-900">Your Booking is Placed!</h2>
                <p className="text-xs text-slate-500 font-medium">Booking ID: <span className="font-bold text-slate-900">{createdBooking?.id}</span></p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-left text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold">Service</span>
                  <span className="font-extrabold text-slate-900">{createdBooking?.service_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold">Assigned Specialist</span>
                  <span className="font-extrabold text-slate-900">{createdBooking?.worker_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold">Location</span>
                  <span className="font-extrabold text-slate-900">{selectedLocality}, {selectedDistrict}</span>
                </div>
                <div className="flex justify-between border-t border-slate-200/60 pt-2">
                  <span className="text-slate-700 font-extrabold">Total Payable</span>
                  <span className="font-black text-slate-900 text-sm">₹{createdBooking?.price ? Number(createdBooking.price) + Number(createdBooking.platform_fee || 49) : 248}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="btn-primary w-full text-xs py-3 rounded-xl font-bold shadow-md"
              >
                Go to Dashboard
              </button>
            </div>
          </motion.div>
        )}

      </div>
    </div>
  );
};

export default BookingFlow;
