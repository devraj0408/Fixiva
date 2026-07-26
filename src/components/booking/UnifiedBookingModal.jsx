import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  X,
  CheckCircle,
  Clock,
  MapPin,
  Calendar,
  Briefcase,
  User,
  Building,
  Star,
  ShieldCheck,
  ChevronRight,
  ChevronLeft,
  Tag,
  Check,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const STATES_LIST = [
  'Jharkhand',
  'Bihar',
  'Uttar Pradesh',
  'West Bengal',
  'Delhi NCR'
];

const CITIES_BY_STATE = {
  'Jharkhand': ['Ranchi', 'Jamshedpur', 'Dhanbad', 'Bokaro', 'Hazaribagh'],
  'Bihar': ['Patna', 'Gaya', 'Muzaffarpur', 'Bhagalpur'],
  'Uttar Pradesh': ['Noida', 'Ghaziabad', 'Lucknow', 'Kanpur', 'Varanasi'],
  'West Bengal': ['Kolkata', 'Howrah', 'Durgapur', 'Siliguri'],
  'Delhi NCR': ['Delhi', 'Gurgaon', 'Faridabad']
};

const UnifiedBookingModal = () => {
  const {
    user,
    services = [],
    workers = [],
    contractors = [],
    addBooking,
    showToast,
    bookingModalState = { isOpen: false, initialData: {} },
    closeBookingModal
  } = useAuth();

  const isOpen = bookingModalState?.isOpen;
  const initialData = bookingModalState?.initialData || {};

  // Form Steps: 1 to 8
  const [step, setStep] = useState(1);

  // Form Fields
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [selectedState, setSelectedState] = useState('Jharkhand');
  const [selectedCity, setSelectedCity] = useState('Ranchi');
  const [partnerType, setPartnerType] = useState('auto'); // 'auto', 'worker', 'contractor'
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('09:00 AM - 12:00 PM');
  const [address, setAddress] = useState('');
  const [landmark, setLandmark] = useState('');
  const [notes, setNotes] = useState('');

  // Status flags
  const [submitting, setSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(null);

  // Initialize form when modal opens
  useEffect(() => {
    if (isOpen) {
      setBookingSuccess(null);
      setSubmitting(false);

      const initSvc = initialData.serviceId || (services[0]?.id || 'plumbing');
      const initState = initialData.state || 'Jharkhand';
      const initCity = initialData.city || user?.city || 'Ranchi';

      setSelectedServiceId(initSvc);
      setSelectedState(initState);
      setSelectedCity(initCity);
      setAddress(user?.city ? `Main Road, ${user.city}` : '');
      setLandmark('');
      setNotes('');
      setSelectedDate(new Date().toISOString().split('T')[0]);

      if (initialData.workerObj) {
        setPartnerType('worker');
        setSelectedPartner(initialData.workerObj);
        setStep(5); // Jump straight to Date & Time
      } else if (initialData.contractorObj) {
        setPartnerType('contractor');
        setSelectedPartner(initialData.contractorObj);
        setStep(5); // Jump straight to Date & Time
      } else if (initialData.serviceId && initialData.city) {
        setStep(4); // Jump to Choose Partner
      } else {
        setStep(1); // Start at Step 1
      }
    }
  }, [isOpen, initialData, services, user]);

  if (!isOpen) return null;

  const currentServiceObj = services.find((s) => s.id === selectedServiceId) || {
    id: selectedServiceId || 'plumbing',
    name: (selectedServiceId || 'Home Service').toUpperCase(),
    base_price: 299,
    platform_fee: 49
  };

  // Filter available partners matching selected city & service
  const availablePartners = useMemo(() => {
    const matchedWorkers = (workers || []).filter(
      (w) => !selectedCity || (w.city || '').toLowerCase() === selectedCity.toLowerCase()
    );
    const matchedContractors = (contractors || []).filter(
      (c) => !selectedCity || (c.city || '').toLowerCase() === selectedCity.toLowerCase()
    );
    return { workers: matchedWorkers, contractors: matchedContractors };
  }, [workers, contractors, selectedCity]);

  // Total tariff calculation
  const partnerPrice = selectedPartner?.starting_price || selectedPartner?.hourly_rate || currentServiceObj.base_price || 299;
  const platformFee = currentServiceObj.platform_fee || 49;
  const totalAmount = Number(partnerPrice) + Number(platformFee);

  // Submit Booking to Supabase
  const handleConfirmBooking = async () => {
    if (!address.trim()) {
      showToast('Please enter your service address', 'error');
      setStep(6);
      return;
    }

    setSubmitting(true);
    const generatedId = `BK-${Math.floor(100000 + Math.random() * 900000)}`;

    const payload = {
      id: generatedId,
      customer_id: user?.id || null,
      customer_name: user?.name || 'Valued Customer',
      customer_phone: user?.phone || '',
      customer_address: `${address}${landmark ? `, Near ${landmark}` : ''}`,
      service_id: currentServiceObj.id,
      service_name: currentServiceObj.name,
      city: selectedCity,
      worker_id: selectedPartner?.id || null,
      worker_name: selectedPartner?.company || selectedPartner?.owner_name || selectedPartner?.name || 'Auto-Assigned Specialist',
      worker_phone: selectedPartner?.phone || selectedPartner?.whatsapp || '',
      preferred_date: new Date(selectedDate).toISOString(),
      booking_date: new Date(selectedDate).toISOString(),
      status: 'Pending',
      price: Number(partnerPrice),
      platform_fee: Number(platformFee),
      address: `${address}${landmark ? `, Near ${landmark}` : ''}${notes ? ` (Notes: ${notes})` : ''} (Slot: ${selectedTimeSlot})`
    };

    const { error } = await addBooking(payload);
    setSubmitting(false);

    if (!error) {
      setBookingSuccess(payload);
      showToast(`Booking ${generatedId} created successfully!`, 'success');
    } else {
      showToast('Failed to create booking: ' + (error?.message || 'Error'), 'error');
    }
  };

  const stepsList = [
    { num: 1, label: 'Service' },
    { num: 2, label: 'State' },
    { num: 3, label: 'City' },
    { num: 4, label: 'Partner' },
    { num: 5, label: 'Date & Time' },
    { num: 6, label: 'Address' },
    { num: 7, label: 'Summary' },
    { num: 8, label: 'Confirm' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full border border-slate-200 shadow-2xl space-y-6 my-6 relative overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <span className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-1">
              <Sparkles size={12} /> Unified Fixiva Booking Workflow
            </span>
            <h2 className="text-lg font-black text-slate-900 mt-0.5">
              {bookingSuccess ? 'Booking Confirmed!' : `Step ${step} of 8: ${stepsList[step - 1]?.label}`}
            </h2>
          </div>
          <button
            onClick={closeBookingModal}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-2xl hover:bg-slate-100 transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* Success Modal View */}
        {bookingSuccess ? (
          <div className="py-8 text-center space-y-5">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle size={36} />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900">Booking Confirmed!</h3>
              <p className="text-xs text-slate-500 font-semibold mt-1">
                Booking ID: <span className="font-extrabold text-primary">{bookingSuccess.id}</span>
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-2 text-left font-semibold text-slate-700 max-w-md mx-auto">
              <div className="flex justify-between">
                <span>Service:</span>
                <span className="font-black text-slate-900">{bookingSuccess.service_name}</span>
              </div>
              <div className="flex justify-between">
                <span>Location:</span>
                <span className="font-black text-slate-900">{bookingSuccess.city}</span>
              </div>
              <div className="flex justify-between">
                <span>Assigned Partner:</span>
                <span className="font-black text-primary">{bookingSuccess.worker_name}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Amount:</span>
                <span className="font-black text-slate-900">₹{totalAmount}</span>
              </div>
            </div>

            <button
              onClick={closeBookingModal}
              className="px-8 py-3 rounded-2xl bg-primary text-xs font-black text-white shadow-md hover:bg-blue-700 transition-all"
            >
              Done & View Dashboard
            </button>
          </div>
        ) : (
          <>
            {/* Step Progress Stepper Bar */}
            <div className="space-y-2">
              <div className="flex justify-between items-center relative">
                <div className="absolute top-1/2 left-0 right-0 h-1 bg-slate-100 -translate-y-1/2 rounded-full"></div>
                <div
                  className="absolute top-1/2 left-0 h-1 bg-primary -translate-y-1/2 rounded-full transition-all duration-300"
                  style={{ width: `${((step - 1) / 7) * 100}%` }}
                ></div>

                {stepsList.map((s) => (
                  <div
                    key={s.num}
                    onClick={() => {
                      if (s.num < step) setStep(s.num);
                    }}
                    className={`relative z-10 w-7 h-7 rounded-full border-2 flex items-center justify-center text-[10px] font-black cursor-pointer transition-all ${
                      s.num === step
                        ? 'bg-primary border-blue-600 text-white shadow-md scale-110'
                        : s.num < step
                        ? 'bg-emerald-500 border-emerald-500 text-white'
                        : 'bg-white border-slate-200 text-slate-400'
                    }`}
                  >
                    {s.num < step ? <Check size={12} /> : s.num}
                  </div>
                ))}
              </div>
            </div>

            {/* Step Content */}
            <div className="min-h-[280px] flex flex-col justify-between pt-2">
              {/* Step 1: Choose Service */}
              {step === 1 && (
                <div className="space-y-3">
                  <h3 className="text-xs font-black uppercase text-slate-500 tracking-wider">Step 1: Choose Required Service</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-64 overflow-y-auto p-1">
                    {services.map((svc) => (
                      <button
                        key={svc.id}
                        type="button"
                        onClick={() => {
                          setSelectedServiceId(svc.id);
                          setStep(2);
                        }}
                        className={`p-3 rounded-2xl border text-left transition-all ${
                          selectedServiceId === svc.id
                            ? 'bg-primary text-white border-primary shadow-md'
                            : 'bg-slate-50 border-slate-200 text-slate-800 hover:border-slate-300'
                        }`}
                      >
                        <p className="text-xs font-black">{svc.name}</p>
                        <p className={`text-[10px] mt-1 font-bold ${selectedServiceId === svc.id ? 'text-blue-100' : 'text-slate-500'}`}>
                          Starting ₹{svc.base_price || 299}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 2: Choose State */}
              {step === 2 && (
                <div className="space-y-3">
                  <h3 className="text-xs font-black uppercase text-slate-500 tracking-wider">Step 2: Select State / Region</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {STATES_LIST.map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => {
                          setSelectedState(st);
                          const citiesInState = CITIES_BY_STATE[st] || ['Ranchi'];
                          setSelectedCity(citiesInState[0]);
                          setStep(3);
                        }}
                        className={`p-4 rounded-2xl border text-left font-extrabold text-xs transition-all flex items-center justify-between ${
                          selectedState === st
                            ? 'bg-primary text-white border-primary shadow-md'
                            : 'bg-slate-50 border-slate-200 text-slate-800 hover:border-slate-300'
                        }`}
                      >
                        <span>{st}</span>
                        <ChevronRight size={16} />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 3: Choose City */}
              {step === 3 && (
                <div className="space-y-3">
                  <h3 className="text-xs font-black uppercase text-slate-500 tracking-wider">Step 3: Select City in {selectedState}</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {(CITIES_BY_STATE[selectedState] || ['Ranchi', 'Patna', 'Jamshedpur']).map((ct) => (
                      <button
                        key={ct}
                        type="button"
                        onClick={() => {
                          setSelectedCity(ct);
                          setStep(4);
                        }}
                        className={`p-4 rounded-2xl border text-center font-extrabold text-xs transition-all ${
                          selectedCity === ct
                            ? 'bg-primary text-white border-primary shadow-md'
                            : 'bg-slate-50 border-slate-200 text-slate-800 hover:border-slate-300'
                        }`}
                      >
                        <MapPin size={16} className="mx-auto mb-1 opacity-75" />
                        <span>{ct}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 4: Choose Partner (Contractor or Worker) */}
              {step === 4 && (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xs font-black uppercase text-slate-500 tracking-wider">Step 4: Select Specialist Partner</h3>
                    <div className="flex gap-1.5 bg-slate-100 p-1 rounded-xl text-[10px] font-black">
                      <button
                        onClick={() => setPartnerType('auto')}
                        className={`px-2.5 py-1 rounded-lg ${partnerType === 'auto' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
                      >
                        Auto-Assign
                      </button>
                      <button
                        onClick={() => setPartnerType('worker')}
                        className={`px-2.5 py-1 rounded-lg ${partnerType === 'worker' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
                      >
                        Workers ({availablePartners.workers.length})
                      </button>
                      <button
                        onClick={() => setPartnerType('contractor')}
                        className={`px-2.5 py-1 rounded-lg ${partnerType === 'contractor' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
                      >
                        Contractors ({availablePartners.contractors.length})
                      </button>
                    </div>
                  </div>

                  {partnerType === 'auto' ? (
                    <div
                      onClick={() => {
                        setSelectedPartner(null);
                        setStep(5);
                      }}
                      className="p-6 bg-blue-50/60 border-2 border-dashed border-blue-200 rounded-3xl text-center space-y-2 cursor-pointer hover:bg-blue-50 transition-all"
                    >
                      <Sparkles size={28} className="mx-auto text-primary" />
                      <h4 className="text-sm font-black text-slate-900">Auto-Assign Best Verified Specialist</h4>
                      <p className="text-xs text-slate-500 font-semibold max-w-sm mx-auto">
                        Fixiva algorithms will instantly match the nearest top-rated technician in {selectedCity} upon booking.
                      </p>
                      <button className="mt-2 px-4 py-2 rounded-xl bg-primary text-white text-xs font-extrabold shadow-sm">
                        Select Auto-Assign & Proceed
                      </button>
                    </div>
                  ) : partnerType === 'worker' ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-60 overflow-y-auto p-1">
                      {availablePartners.workers.map((w) => (
                        <div
                          key={w.id}
                          onClick={() => {
                            setSelectedPartner(w);
                            setStep(5);
                          }}
                          className={`p-3.5 rounded-2xl border cursor-pointer transition-all space-y-2 ${
                            selectedPartner?.id === w.id
                              ? 'bg-blue-50 border-primary shadow-sm'
                              : 'bg-white border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-xl bg-slate-900 text-white font-black text-xs flex items-center justify-center uppercase">
                              {(w.name || 'W').charAt(0)}
                            </div>
                            <div>
                              <h5 className="text-xs font-black text-slate-900">{w.name}</h5>
                              <p className="text-[10px] text-slate-500 font-bold">{w.skills || 'Technician'}</p>
                            </div>
                          </div>
                          <div className="flex justify-between items-center text-[10px] font-extrabold pt-1 border-t border-slate-100">
                            <span className="text-emerald-700 flex items-center gap-0.5"><Star size={10} className="fill-amber-400 text-amber-400" /> {w.rating || 4.9}</span>
                            <span className="text-primary">₹{w.starting_price || w.hourly_rate || 299}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-60 overflow-y-auto p-1">
                      {availablePartners.contractors.map((c) => (
                        <div
                          key={c.id}
                          onClick={() => {
                            setSelectedPartner(c);
                            setStep(5);
                          }}
                          className={`p-3.5 rounded-2xl border cursor-pointer transition-all space-y-2 ${
                            selectedPartner?.id === c.id
                              ? 'bg-blue-50 border-primary shadow-sm'
                              : 'bg-white border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-xl bg-slate-900 text-white font-black text-xs flex items-center justify-center uppercase">
                              {(c.company || c.name || 'C').charAt(0)}
                            </div>
                            <div>
                              <h5 className="text-xs font-black text-slate-900">{c.company || c.name}</h5>
                              <p className="text-[10px] text-slate-500 font-bold">Owner: {c.owner_name || c.name}</p>
                            </div>
                          </div>
                          <div className="flex justify-between items-center text-[10px] font-extrabold pt-1 border-t border-slate-100">
                            <span className="text-slate-600">{c.city || 'Ranchi'}</span>
                            <span className="text-primary">₹{c.starting_price || 999}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Step 5: Choose Date & Time */}
              {step === 5 && (
                <div className="space-y-4">
                  <h3 className="text-xs font-black uppercase text-slate-500 tracking-wider">Step 5: Appointment Schedule</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase">Booking Date</label>
                      <input
                        type="date"
                        value={selectedDate}
                        min={new Date().toISOString().split('T')[0]}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-extrabold text-slate-800 outline-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase">Time Slot</label>
                      <select
                        value={selectedTimeSlot}
                        onChange={(e) => setSelectedTimeSlot(e.target.value)}
                        className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-extrabold text-slate-800 outline-none"
                      >
                        <option value="09:00 AM - 12:00 PM">09:00 AM - 12:00 PM (Morning)</option>
                        <option value="12:00 PM - 03:00 PM">12:00 PM - 03:00 PM (Afternoon)</option>
                        <option value="03:00 PM - 06:00 PM">03:00 PM - 06:00 PM (Evening)</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 6: Enter Address */}
              {step === 6 && (
                <div className="space-y-3">
                  <h3 className="text-xs font-black uppercase text-slate-500 tracking-wider">Step 6: Service Location & Notes</h3>
                  <div className="space-y-3 text-xs font-semibold">
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Street address, house no, building name..."
                      className="w-full h-11 px-4 bg-slate-50 border border-slate-200 focus:border-primary rounded-2xl text-slate-800 outline-none"
                      required
                    />
                    <input
                      type="text"
                      value={landmark}
                      onChange={(e) => setLandmark(e.target.value)}
                      placeholder="Landmark (Optional e.g. Near City Mall)"
                      className="w-full h-11 px-4 bg-slate-50 border border-slate-200 focus:border-primary rounded-2xl text-slate-800 outline-none"
                    />
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Specific work instructions or problem details..."
                      rows="2"
                      className="w-full p-3 bg-slate-50 border border-slate-200 focus:border-primary rounded-2xl text-slate-800 outline-none"
                    ></textarea>
                  </div>
                </div>
              )}

              {/* Step 7: Booking Summary */}
              {step === 7 && (
                <div className="space-y-4">
                  <h3 className="text-xs font-black uppercase text-slate-500 tracking-wider">Step 7: Review Booking Summary</h3>
                  <div className="p-5 bg-slate-50 rounded-3xl border border-slate-200 text-xs space-y-3 font-semibold text-slate-700">
                    <div className="flex justify-between border-b border-slate-200 pb-2">
                      <span>Service Required:</span>
                      <span className="font-black text-slate-900">{currentServiceObj.name}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-200 pb-2">
                      <span>Service Region:</span>
                      <span className="font-black text-slate-900">{selectedCity}, {selectedState}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-200 pb-2">
                      <span>Specialist Partner:</span>
                      <span className="font-black text-primary">
                        {selectedPartner?.company || selectedPartner?.owner_name || selectedPartner?.name || 'Auto-Assigned Specialist'}
                      </span>
                    </div>
                    <div className="flex justify-between border-b border-slate-200 pb-2">
                      <span>Date & Time:</span>
                      <span className="font-black text-slate-900">{selectedDate} ({selectedTimeSlot})</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-200 pb-2">
                      <span>Service Address:</span>
                      <span className="font-black text-slate-900 truncate max-w-xs">{address}</span>
                    </div>
                    <div className="flex justify-between text-slate-900 font-black text-sm pt-1">
                      <span>Total Tariff Amount:</span>
                      <span className="text-primary">₹{totalAmount}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 8: Confirm Booking */}
              {step === 8 && (
                <div className="space-y-4 text-center py-4">
                  <h3 className="text-lg font-black text-slate-900">Step 8: Final Confirmation</h3>
                  <p className="text-xs text-slate-500 font-semibold max-w-md mx-auto">
                    Clicking Confirm will create your booking order and instantly dispatch notifications to the selected specialist in {selectedCity}.
                  </p>
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs font-black text-emerald-900 max-w-md mx-auto">
                    Pay on Service Completion • Verified Background-Checked Partner Guarantee
                  </div>
                </div>
              )}

              {/* Modal Navigation Footer Controls */}
              <div className="flex items-center justify-between pt-6 border-t border-slate-100 mt-6">
                <button
                  type="button"
                  disabled={step === 1}
                  onClick={() => setStep((s) => Math.max(1, s - 1))}
                  className="px-4 py-2.5 rounded-2xl border border-slate-200 text-xs font-extrabold text-slate-600 hover:bg-slate-50 disabled:opacity-30 flex items-center gap-1"
                >
                  <ChevronLeft size={16} /> Back
                </button>

                {step < 8 ? (
                  <button
                    type="button"
                    onClick={() => setStep((s) => Math.min(8, s + 1))}
                    className="px-6 py-2.5 rounded-2xl bg-primary text-xs font-extrabold text-white shadow-md hover:bg-blue-700 transition-all flex items-center gap-1"
                  >
                    Continue <ChevronRight size={16} />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleConfirmBooking}
                    disabled={submitting}
                    className="px-8 py-3 rounded-2xl bg-emerald-600 text-xs font-black text-white shadow-md hover:bg-emerald-700 transition-all flex items-center gap-2"
                  >
                    <CheckCircle size={18} />
                    {submitting ? 'Creating Booking...' : 'Confirm & Place Booking Order'}
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
};

export default UnifiedBookingModal;
