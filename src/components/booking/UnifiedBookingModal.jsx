import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight } from 'lucide-react';
import { useApp } from '../../context/AuthContext';
import HierarchicalLocationSelector from '../HierarchicalLocationSelector';
import RapidoLocationSelector from '../location/RapidoLocationSelector';
import { findAvailableProfessionals, createBooking } from '../../services/bookingService';
import { submitCoverageRequest } from '../../services/coverageService';

const UnifiedBookingModal = () => {
  const { bookingModalState, closeBookingModal, services = [], user, showToast } = useApp();
  const { isOpen, initialData = {} } = bookingModalState;

  const [prevIsOpen, setPrevIsOpen] = useState(false);
  const [step, setStep] = useState(1);
  const activeServices = (services || []).filter(
    (s) => s.active !== false && s.active !== 'false' && s.active !== 0 && s.active !== '0'
  );

  const [serviceId, setServiceId] = useState(initialData.serviceId || activeServices[0]?.id || 'plumber');
  const [selectedState, setSelectedState] = useState(() => {
    try { return localStorage.getItem('fixiva:last-state') || ''; } catch { return ''; }
  });
  const [selectedDistrict, setSelectedDistrict] = useState(() => {
    try { return localStorage.getItem('fixiva:last-district') || ''; } catch { return ''; }
  });
  const [selectedLocality, setSelectedLocality] = useState(() => {
    try { return localStorage.getItem('fixiva:last-locality') || ''; } catch { return ''; }
  });

  const [matchingLoading, setMatchingLoading] = useState(false);
  const [isDistrictActiveStatus, setIsDistrictActiveStatus] = useState(true);
  const [availablePros, setAvailablePros] = useState([]);
  const [selectedPro, setSelectedPro] = useState(null);

  const [customerName, setCustomerName] = useState(user?.name || '');
  const [customerPhone, setCustomerPhone] = useState(user?.phone || '');
  const [submitting, setSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  if (isOpen && !prevIsOpen) {
    setPrevIsOpen(true);
    setStep(1);
    if (initialData.serviceId) setServiceId(initialData.serviceId);
    else if (activeServices[0]?.id) setServiceId(activeServices[0].id);
    if (initialData.state) setSelectedState(initialData.state);
    if (initialData.district || initialData.city) setSelectedDistrict(initialData.district || initialData.city);
    if (initialData.locality) setSelectedLocality(initialData.locality);
    if (user?.name) setCustomerName(user.name);
    if (user?.phone) setCustomerPhone(user.phone);
  } else if (!isOpen && prevIsOpen) {
    setPrevIsOpen(false);
  }

  if (!isOpen) return null;

  const activeService = activeServices.find(s => s.id === serviceId) || services.find(s => s.id === serviceId) || activeServices[0] || {
    id: serviceId,
    name: 'Service',
    base_price: 199,
    platform_fee: 49
  };

  const handleSearchPros = async () => {
    setMatchingLoading(true);
    try {
      const res = await findAvailableProfessionals({
        serviceId,
        state: selectedState,
        district: selectedDistrict,
        locality: selectedLocality
      });
      setIsDistrictActiveStatus(res.districtActive);
      setAvailablePros(res.professionals || []);
      if (res.professionals && res.professionals.length > 0) {
        setSelectedPro(res.professionals[0]);
      }
      setStep(2);
    } catch {
      showToast('Error matching professionals', 'error');
    } finally {
      setMatchingLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!customerName || !customerPhone) {
      showToast('Please enter your name and phone number', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const res = await createBooking({
        customer_id: user?.id,
        worker_id: selectedPro?.id,
        service_id: activeService.id,
        service_name: activeService.name,
        state: selectedState,
        district: selectedDistrict,
        locality: selectedLocality,
        customer_name: customerName,
        customer_phone: customerPhone,
        price: activeService.base_price || 0,
        platform_fee: 0
      });

      if (res.data) {
        setBookingSuccess(true);
        showToast('Booking submitted successfully!', 'success');
      } else {
        showToast(res.error || 'Failed to place booking.', 'error');
      }
    } catch {
      showToast('Failed to place booking.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 relative overflow-hidden"
        >
          <button
            onClick={closeBookingModal}
            className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all"
          >
            <X size={18} />
          </button>

          <div className="flex items-center gap-3 mb-4">
            {activeService && (activeService.image_url || activeService.image || (activeService.icon && activeService.icon.startsWith('http'))) ? (
              <img
                src={activeService.image_url || activeService.image || activeService.icon}
                alt={activeService.name}
                className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0"
              />
            ) : null}
            <div>
              <span className="text-[10px] font-black uppercase text-primary bg-primary/10 px-2.5 py-0.5 rounded-md">Instant Booking</span>
              <h2 className="text-lg font-black text-slate-900 leading-tight">{activeService?.name || 'Home'} Service</h2>
            </div>
          </div>

          {!bookingSuccess ? (
            <div className="space-y-4">
              {step === 1 && (
                <div className="space-y-4">
                  <RapidoLocationSelector
                    initialState={selectedState}
                    initialDistrict={selectedDistrict}
                    initialLocality={selectedLocality}
                    onLocationConfirmed={async (loc) => {
                      setSelectedState(loc.state);
                      setSelectedDistrict(loc.district);
                      setSelectedLocality(loc.locality);
                      setMatchingLoading(true);
                      try {
                        const res = await findAvailableProfessionals({
                          serviceId,
                          state: loc.state,
                          district: loc.district,
                          locality: loc.locality,
                          userLat: loc.latitude,
                          userLng: loc.longitude
                        });
                        setIsDistrictActiveStatus(res.districtActive);
                        setAvailablePros(res.professionals || []);
                        if (res.professionals && res.professionals.length > 0) {
                          setSelectedPro(res.professionals[0]);
                        }
                        setStep(2);
                      } catch {
                        showToast('Error matching professionals', 'error');
                      } finally {
                        setMatchingLoading(false);
                      }
                    }}
                  />
                </div>
              )}

              {step === 2 && isDistrictActiveStatus && (
                availablePros.length === 0 ? (
                  <div className="p-6 text-center space-y-3 bg-blue-50/50 rounded-2xl border border-blue-100">
                    <span className="px-2.5 py-1 bg-primary/10 text-primary rounded-full text-[10px] font-black uppercase tracking-widest border border-primary/20">
                      Coming Soon
                    </span>
                    <h3 className="text-base font-black text-slate-900 pt-1">
                      Services Coming Soon to {selectedLocality}, {selectedDistrict}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed">
                      No active registered workers or contractors are currently available for this service in your area. Fixiva is expanding rapidly!
                    </p>
                    <button
                      onClick={() => setStep(1)}
                      className="btn-primary w-full py-2.5 text-xs font-bold rounded-xl shadow-sm mt-2"
                    >
                      Change Location / Service
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <span className="text-xs font-bold text-slate-700">Available Professionals near {selectedLocality}</span>
                    
                    <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                      {availablePros.map(pro => (
                        <div
                          key={pro.id}
                          onClick={() => setSelectedPro(pro)}
                          className={`p-3 rounded-2xl border cursor-pointer text-xs flex items-center justify-between transition-all ${
                            selectedPro?.id === pro.id ? 'border-primary bg-primary/5 font-bold' : 'border-slate-100 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <img src={pro.profile_photo_url} alt={pro.name} className="w-9 h-9 rounded-xl object-cover" />
                            <div>
                              <h4 className="font-bold text-slate-900">{pro.name}</h4>
                              <span className="text-[10px] text-slate-500 font-semibold">
                                {pro.distance_km !== null && pro.distance_km !== undefined ? `${pro.distance_km} km away • ETA ${pro.eta_text || 'Nearby'}` : 'Verified Professional'}
                              </span>
                            </div>
                          </div>

                          <span className="font-black text-slate-900">₹{pro.starting_price}</span>
                        </div>
                      ))}
                    </div>

                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <input
                      type="text"
                      placeholder="Your Full Name"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold outline-none focus:border-primary"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                    />
                    <input
                      type="tel"
                      placeholder="Mobile Phone Number"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold outline-none focus:border-primary"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setStep(1)}
                      className="w-1/3 py-2.5 text-xs font-bold rounded-xl border border-slate-200 hover:bg-slate-50"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleConfirm}
                      disabled={submitting}
                      className="btn-primary w-2/3 py-2.5 text-xs font-bold rounded-xl shadow-md"
                    >
                      {submitting ? 'Confirming...' : 'Confirm Booking'}
                    </button>
                  </div>
                </div>
              ))}

              {step === 2 && !isDistrictActiveStatus && (
                <div className="text-center py-6 space-y-4">
                  <span className="text-2xl">🚨</span>
                  <h3 className="text-base font-bold text-slate-900">Fixiva is unavailable in {selectedDistrict} yet.</h3>
                  <p className="text-xs text-slate-500">We are expanding rapidly to your area!</p>
                  <button
                    onClick={() => {
                      submitCoverageRequest({
                        phone: customerPhone || '919876543210',
                        service_name: activeService.name,
                        state: selectedState,
                        district: selectedDistrict,
                        locality: selectedLocality
                      });
                      showToast('Coverage requested!', 'success');
                      closeBookingModal();
                    }}
                    className="btn-primary w-full py-2.5 text-xs font-bold rounded-xl"
                  >
                    Request Coverage
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 space-y-4">
              <span className="text-3xl">🎉</span>
              <h3 className="text-lg font-extrabold text-slate-900">Booking Confirmed!</h3>
              <p className="text-xs text-slate-500">Our specialist has been notified and will arrive in {selectedLocality}.</p>
              <button onClick={closeBookingModal} className="btn-primary w-full py-2.5 text-xs font-bold rounded-xl">
                Close
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default UnifiedBookingModal;
