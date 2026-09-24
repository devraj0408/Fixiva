import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useApp } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

import { Loader2, Mail, User, ShieldCheck, Phone, ArrowRight, LocateFixed, Navigation, MapPin } from 'lucide-react';
import HierarchicalLocationSelector from '../../components/HierarchicalLocationSelector';
import { detectCurrentLocation, saveUserGpsLocation } from '../../services/locationService';

const Register = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialRole = queryParams.get('role') || 'customer';
  const initialEmail = queryParams.get('email') || '';
  const [role, setRole] = useState(initialRole === 'worker' ? 'worker' : 'customer');

  const { requestOtp, verifyOtp, showToast, user, isAuthenticated } = useApp();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoMessage, setGeoMessage] = useState('');

  // Auto-redirect if user is already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      const activeRole = String(user.role || '').trim().toLowerCase();
      if (activeRole === 'admin') {
        navigate('/dashboard/admin', { replace: true });
      } else if (activeRole === 'worker') {
        navigate('/worker-dashboard', { replace: true });
      } else if (activeRole === 'contractor') {
        navigate('/contractor-disabled', { replace: true });
      } else {
        navigate('/dashboard/customer', { replace: true });
      }
    }
  }, [isAuthenticated, user, navigate]);

  // OTP inputs references and states
  const otpRefs = useRef([]);
  const [otpValues, setOtpValues] = useState(['', '', '', '', '', '']);
  const [countdown, setCountdown] = useState(60);
  const resendDisabled = countdown > 0;
  const [attempts, setAttempts] = useState(0);

  const [formData, setFormData] = useState(() => {
    let savedState = '';
    let savedDistrict = '';
    let savedLocality = '';
    try {
      savedState = localStorage.getItem('fixiva:last-state') || '';
      savedDistrict = localStorage.getItem('fixiva:last-district') || '';
      savedLocality = localStorage.getItem('fixiva:last-locality') || '';
    } catch { void 0; }

    return {
      name: '',
      email: initialEmail,
      phone: '',
      city: savedDistrict,
      state: savedState,
      locality: savedLocality,
      pincode: '',
      locationText: '',
      locationLatitude: null,
      locationLongitude: null,
      locationSource: '',
      skills: '',
      experience: '',
      whatsapp: '',
      id_proof_number: '',
      company: '',
      owner_name: '',
      gst: '',
      services_offered: ''
    };
  });

  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');

  // Countdown timer for resend OTP
  useEffect(() => {
    let timer;
    if (otpSent && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [otpSent, countdown]);

  const handleUseCurrentLocation = async (e) => {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
    if (geoLoading) return;

    setGeoLoading(true);
    setGeoMessage('');
    try {
      const loc = await detectCurrentLocation();
      const st = loc.state || '';
      const dist = loc.district || loc.city || '';
      const locName = loc.locality || '';
      const pin = loc.pincode || '';
      const lat = loc.latitude !== null && loc.latitude !== undefined && !isNaN(Number(loc.latitude)) ? Number(loc.latitude) : null;
      const lng = loc.longitude !== null && loc.longitude !== undefined && !isNaN(Number(loc.longitude)) ? Number(loc.longitude) : null;
      const formatted = loc.formattedAddress || [locName, dist, st].filter(Boolean).join(', ');

      if (!st && !dist && !lat && !lng) {
        setGeoMessage('Location permission is unavailable.');
        showToast('Could not access current location. You can select your location manually.', 'error');
        return;
      }

      setFormData((prev) => ({
        ...prev,
        state: st,
        city: dist,
        locality: locName,
        pincode: pin,
        locationLatitude: lat,
        locationLongitude: lng,
        locationText: prev.locationText && prev.locationSource === 'manual' ? prev.locationText : (formatted || [locName, dist].filter(Boolean).join(', ')),
        locationSource: 'gps'
      }));

      try {
        if (st) localStorage.setItem('fixiva:last-state', st);
        if (dist) localStorage.setItem('fixiva:last-district', dist);
        if (locName) localStorage.setItem('fixiva:last-locality', locName);
      } catch { void 0; }

      setErrors((prev) => {
        const next = { ...prev };
        delete next.city;
        return next;
      });

      const displayLabel = [locName, dist, st].filter(Boolean).join(', ');
      setGeoMessage('Current location detected successfully.');
      showToast(`Location detected: ${displayLabel || 'Success'}`, 'success');
    } catch (err) {
      console.warn('GPS detection failed:', err);
      setGeoMessage('Could not detect current location. You can select your location manually.');
      showToast('Could not detect current location. Select manually.', 'error');
    } finally {
      setGeoLoading(false);
    }
  };

  const handleResetLocation = () => {
    setFormData((prev) => ({
      ...prev,
      state: '',
      city: '',
      locality: '',
      pincode: '',
      locationLatitude: null,
      locationLongitude: null,
      locationText: '',
      locationSource: ''
    }));
    try {
      localStorage.removeItem('fixiva:last-state');
      localStorage.removeItem('fixiva:last-district');
      localStorage.removeItem('fixiva:last-locality');
    } catch { void 0; }
    setGeoMessage('');
  };

  const validate = () => {
    const nextErrors = {};
    if (!formData.name) nextErrors.name = 'Full name is required';
    if (!formData.email) nextErrors.email = 'Email address is required';
    if (!formData.city) nextErrors.city = 'Operating city is required';
    if (!formData.phone) nextErrors.phone = 'Mobile number is required';

    if (role === 'worker') {
      if (!formData.skills) nextErrors.skills = 'Please list primary skills';
      if (!formData.whatsapp) nextErrors.whatsapp = 'WhatsApp mobile is required';
    }
    if (role === 'contractor') {
      if (!formData.company) nextErrors.company = 'Company name is required';
      if (!formData.owner_name) nextErrors.owner_name = 'Owner name is required';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleRequestOtp = async (e) => {
    if (e) e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    const { success, error, email, message: resMsg } = await requestOtp(formData.email, 'sign-up', {
      name: formData.name,
      phone: formData.phone,
      role,
      city: formData.city,
      state: formData.state,
      locality: formData.locality,
      pincode: formData.pincode,
      locationText: formData.locationText,
      locationLatitude: formData.locationLatitude,
      locationLongitude: formData.locationLongitude,
      locationSource: formData.locationSource,
      extra: {
        skills: formData.skills,
        experience: formData.experience,
        whatsapp: formData.whatsapp,
        id_proof_number: formData.id_proof_number,
        company: formData.company,
        owner_name: formData.owner_name,
        gst: formData.gst,
        services_offered: formData.services_offered,
      },
    });
    setLoading(false);

    if (!success) {
      setErrors({ email: error?.message || 'Unable to send verification code.' });
      return;
    }

    setOtpSent(true);
    setCountdown(60);
    setAttempts(0);
    setOtpValues(['', '', '', '', '', '']);
    setOtp('');
    setMessage(resMsg || `Verification code sent to ${email}.`);
  };

  const handleResendOtp = async () => {
    if (resendDisabled || loading) return;
    setLoading(true);
    setErrors({});
    setMessage('');
    setOtpValues(['', '', '', '', '', '']);
    setOtp('');
    setAttempts(0);

    const { success, error, email, message: resMsg } = await requestOtp(formData.email, 'sign-up', {
      name: formData.name,
      phone: formData.phone,
      role,
      city: formData.city,
      state: formData.state,
      locality: formData.locality,
      pincode: formData.pincode,
      locationText: formData.locationText,
      locationLatitude: formData.locationLatitude,
      locationLongitude: formData.locationLongitude,
      locationSource: formData.locationSource,
      extra: {
        skills: formData.skills,
        experience: formData.experience,
        whatsapp: formData.whatsapp,
        id_proof_number: formData.id_proof_number,
        company: formData.company,
        owner_name: formData.owner_name,
        gst: formData.gst,
        services_offered: formData.services_offered,
      },
    });
    setLoading(false);

    if (!success) {
      setErrors({ otp: error?.message || 'Unable to resend verification code.' });
      return;
    }

    setCountdown(60);
    setMessage(resMsg || `Verification code sent to ${email}.`);
  };

  const handleVerifyOtp = async (e) => {
    if (e) e.preventDefault();
    setErrors({});
    
    if (otp.length < 6) {
      setErrors({ otp: 'Enter the 6-digit verification code.' });
      return;
    }

    if (attempts >= 5) {
      setErrors({ otp: 'Too many attempts. Please request a new verification code.' });
      return;
    }

    setLoading(true);
    setAttempts(prev => prev + 1);
    
    const registrationPayload = {
      name: formData.name,
      phone: formData.phone,
      role,
      city: formData.city,
      state: formData.state,
      locality: formData.locality,
      pincode: formData.pincode,
      locationText: formData.locationText,
      locationLatitude: formData.locationLatitude,
      locationLongitude: formData.locationLongitude,
      locationSource: formData.locationSource,
      extra: {
        skills: formData.skills,
        experience: formData.experience,
        whatsapp: formData.whatsapp,
        id_proof_number: formData.id_proof_number,
        company: formData.company,
        owner_name: formData.owner_name,
        gst: formData.gst,
        services_offered: formData.services_offered,
      },
    };

    const { success, error, profile } = await verifyOtp(formData.email, otp, 'sign-up', registrationPayload);
    setLoading(false);

    if (!success) {
      const errorMsg = error?.message || '';
      if (errorMsg.includes('expired') || errorMsg.includes('expire')) {
        setErrors({ otp: 'Expired Code. Please request a new verification code.' });
      } else if (errorMsg.includes('too many') || errorMsg.includes('rate limit') || attempts >= 4) {
        setErrors({ otp: 'Too Many Attempts. Please request a new code.' });
      } else if (errorMsg.includes('invalid') || errorMsg.includes('incorrect') || errorMsg.includes('does not match')) {
        setErrors({ otp: `Invalid Code. (${5 - (attempts + 1)} attempts remaining)` });
      } else {
        setErrors({ otp: error?.message || 'Invalid Code.' });
      }
      return;
    }

    showToast('Registration Successful', 'success');

    const activeRole = String(profile?.role || role || '').trim().toLowerCase();

    // Persist GPS location if coordinates are available
    if (profile?.id && formData.locationLatitude && formData.locationLongitude) {
      saveUserGpsLocation({
        userId: profile.id,
        role: activeRole,
        latitude: formData.locationLatitude,
        longitude: formData.locationLongitude,
        address: formData.locationText || [formData.locality, formData.city, formData.state].filter(Boolean).join(', '),
        locationSource: formData.locationSource || 'gps'
      }).catch(() => null);
    }

    if (activeRole === 'admin') {
      navigate('/dashboard/admin');
    } else if (activeRole === 'worker') {
      navigate('/worker-dashboard');
    } else if (activeRole === 'contractor') {
      navigate('/contractor-disabled');
    } else {
      navigate('/dashboard/customer');
    }
  };

  // Paste handler
  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim().replace(/\D/g, '').slice(0, 6);
    if (pastedData.length > 0) {
      const newOtp = [...otpValues];
      for (let i = 0; i < 6; i++) {
        newOtp[i] = pastedData[i] || '';
      }
      setOtpValues(newOtp);
      const code = newOtp.join('');
      setOtp(code);
      
      const focusIdx = Math.min(pastedData.length, 5);
      if (otpRefs.current[focusIdx]) {
        otpRefs.current[focusIdx].focus();
      }
    }
  };

  // Handle digit inputs
  const handleOtpChange = (idx, value) => {
    const cleanValue = value.replace(/\D/g, '');
    if (!cleanValue) {
      const newOtp = [...otpValues];
      newOtp[idx] = '';
      setOtpValues(newOtp);
      setOtp(newOtp.join(''));
      return;
    }

    const newOtp = [...otpValues];
    const val = cleanValue[cleanValue.length - 1];
    newOtp[idx] = val;
    setOtpValues(newOtp);
    const code = newOtp.join('');
    setOtp(code);

    if (idx < 5 && otpRefs.current[idx + 1]) {
      otpRefs.current[idx + 1].focus();
    }
  };

  // Handle backspaces and navigations
  const handleOtpKeyDown = (idx, e) => {
    if (e.key === 'Backspace') {
      if (!otpValues[idx] && idx > 0 && otpRefs.current[idx - 1]) {
        const newOtp = [...otpValues];
        newOtp[idx - 1] = '';
        setOtpValues(newOtp);
        setOtp(newOtp.join(''));
        otpRefs.current[idx - 1].focus();
      } else if (otpValues[idx]) {
        const newOtp = [...otpValues];
        newOtp[idx] = '';
        setOtpValues(newOtp);
        setOtp(newOtp.join(''));
      }
    } else if (e.key === 'ArrowLeft' && idx > 0 && otpRefs.current[idx - 1]) {
      otpRefs.current[idx - 1].focus();
    } else if (e.key === 'ArrowRight' && idx < 5 && otpRefs.current[idx + 1]) {
      otpRefs.current[idx + 1].focus();
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-16">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-8 sm:p-12 shadow-xl shadow-slate-100/50 dark:shadow-none space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{t('registerTitle', 'Create Account')}</h1>
          <p className="text-xs text-slate-400 dark:text-slate-400 font-semibold">{t('registerSubtitle', 'Join Fixiva as a Customer, Worker, or Partner.')}</p>
        </div>

        <div className="flex flex-col items-center justify-center gap-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300">
            <span className="rounded-full bg-primary/10 dark:bg-emerald-950/60 p-1 text-primary dark:text-emerald-400"><User size={12} /></span>
            Joining as {role === 'worker' ? t('workerRole', 'Worker') : role === 'contractor' ? t('contractorRole', 'Contractor') : t('customerRole', 'Customer')}
          </div>
          <div className="grid grid-cols-2 gap-3 w-full max-w-md">
            {['customer', 'worker'].map((option) => (
              <button
                key={option}
                type="button"
                className={`w-full rounded-2xl border px-3 py-2 text-xs font-bold uppercase transition ${role === option ? 'border-primary bg-primary text-white' : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'}`}
                onClick={() => {
                  if (!otpSent) setRole(option);
                }}
                disabled={otpSent}
              >
                {option === 'customer' ? t('customerRole', 'Customer') : t('workerRole', 'Worker')}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={otpSent ? handleVerifyOtp : handleRequestOtp} className="space-y-6">
          {!otpSent ? (
            <div className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider">Account details</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{t('fullNameLabel', 'Full Name')}</label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-3.5 text-slate-400" size={16} />
                      <input type="text" className="w-full h-11 pl-10 pr-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-primary rounded-xl text-xs font-semibold placeholder-slate-400 dark:placeholder-slate-500 outline-none transition-all text-slate-800 dark:text-white" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Rahul Sharma" />
                    </div>
                    {errors.name && <p className="text-danger text-[10px] font-bold text-red-500">{errors.name}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{t('phoneLabel', 'Mobile Number')}</label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-3.5 text-slate-400" size={16} />
                      <input type="text" className="w-full h-11 pl-10 pr-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-primary rounded-xl text-xs font-semibold placeholder-slate-400 dark:placeholder-slate-500 outline-none transition-all text-slate-800 dark:text-white" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="10-digit mobile" />
                    </div>
                    {errors.phone && <p className="text-danger text-[10px] font-bold text-red-500">{errors.phone}</p>}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{t('emailLabel', 'Email Address')}</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3.5 text-slate-400" size={16} />
                    <input type="email" className="w-full h-11 pl-10 pr-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-primary rounded-xl text-xs font-semibold placeholder-slate-400 dark:placeholder-slate-500 outline-none transition-all text-slate-800 dark:text-white" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="name@email.com" />
                  </div>
                  {errors.email && <p className="text-danger text-[10px] font-bold text-red-500">{errors.email}</p>}
                </div>

                {/* Location Section - Unified Location Card matching Home Page */}
                <div className="space-y-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <div className="p-5 bg-slate-50/90 dark:bg-slate-900/90 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-4 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-[11px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <MapPin size={14} className="text-primary dark:text-emerald-400" /> {t('selectYourLocation', 'Select Your Location')}
                      </span>
                      <button
                        type="button"
                        onClick={handleUseCurrentLocation}
                        disabled={geoLoading}
                        className="text-xs font-black text-red-500 hover:text-red-600 inline-flex items-center gap-1.5 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs hover:border-red-300 dark:hover:border-red-800 transition-all cursor-pointer disabled:opacity-50"
                      >
                        <LocateFixed size={13} className={`text-red-500 shrink-0 ${geoLoading ? 'animate-spin' : ''}`} />
                        <span>{geoLoading ? t('locating', 'Detecting...') : t('useCurrentLocation', 'Use Current Location')}</span>
                      </button>
                    </div>

                    <HierarchicalLocationSelector
                      selectedState={formData.state}
                      selectedDistrict={formData.city}
                      selectedLocality={formData.locality}
                      onChange={({ state, district, locality }) => {
                        setFormData((prev) => ({
                          ...prev,
                          state: String(state || ''),
                          city: String(district || ''),
                          locality: String(locality || '')
                        }));
                        if (district) {
                          setErrors((prev) => {
                            const next = { ...prev };
                            delete next.city;
                            return next;
                          });
                        }
                      }}
                      statePlaceholder="Select State"
                      districtPlaceholder="Select District"
                      localityPlaceholder="Select Locality"
                      layout="row"
                      className="w-full"
                    />

                    {/* Selected Location Summary Preview */}
                    {(formData.city || formData.state) && (
                      <div className="p-3 bg-white dark:bg-slate-950 rounded-xl border border-primary/20 dark:border-slate-800 text-xs flex items-center justify-between gap-2 shadow-xs">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 dark:bg-emerald-950/60 text-primary dark:text-emerald-400 flex items-center justify-center shrink-0">
                            <MapPin size={16} />
                          </div>
                          <div className="min-w-0">
                            <p className="font-black text-slate-900 dark:text-white truncate flex items-center gap-1.5">
                              <LocateFixed size={13} className="text-red-500 shrink-0 inline" />
                              <span>{[formData.locality, formData.city].filter(Boolean).join(', ')}</span>
                            </p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold truncate">
                              {[formData.city, formData.state].filter(Boolean).join(', ')} {formData.pincode ? `• ${formData.pincode}` : ''}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={handleResetLocation}
                          className="text-[11px] font-black text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 shrink-0 px-2 py-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                        >
                          Reset
                        </button>
                      </div>
                    )}

                    {/* Precise Locality / Landmark Address */}
                    <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800">
                      <label className="text-[10px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-wider block mb-1">
                        Precise Locality / Landmark Address
                      </label>
                      <input
                        type="text"
                        className="w-full h-11 px-4 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-primary rounded-xl text-xs font-semibold placeholder-slate-400 dark:placeholder-slate-500 outline-none transition-all text-slate-800 dark:text-slate-100 shadow-xs"
                        value={formData.locationText || ''}
                        onChange={(e) => setFormData({ ...formData, locationText: e.target.value, locationSource: e.target.value ? 'manual' : '' })}
                        placeholder="House / Flat No., Street, Landmark (e.g. Near Metro Station)"
                      />
                    </div>
                  </div>

                  {errors.city && <p className="text-danger text-[10px] font-bold text-red-500 mt-1">{errors.city}</p>}

                  {/* Status Message Banner */}
                  {geoMessage && (
                    <div className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
                      geoMessage.includes('successfully')
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                        : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                    }`}>
                      <span>{geoMessage.includes('successfully') ? '✅' : '⚠️'}</span>
                      <span>{geoMessage}</span>
                    </div>
                  )}
                </div>
              </div>

              {role === 'worker' && (
                <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <h3 className="text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider">Professional details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Primary Skills</label><input type="text" className="w-full h-11 px-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-primary rounded-xl text-xs font-semibold placeholder-slate-400 dark:placeholder-slate-500 outline-none transition-all text-slate-800 dark:text-white" value={formData.skills} onChange={(e) => setFormData({ ...formData, skills: e.target.value })} placeholder="Plumber, Electrician" />{errors.skills && <p className="text-danger text-[10px] font-bold text-red-500">{errors.skills}</p>}</div>
                    <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Experience</label><input type="text" className="w-full h-11 px-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-primary rounded-xl text-xs font-semibold placeholder-slate-400 dark:placeholder-slate-500 outline-none transition-all text-slate-800 dark:text-white" value={formData.experience} onChange={(e) => setFormData({ ...formData, experience: e.target.value })} placeholder="5 years" /></div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">WhatsApp Number</label><input type="text" className="w-full h-11 px-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-primary rounded-xl text-xs font-semibold placeholder-slate-400 dark:placeholder-slate-500 outline-none transition-all text-slate-800 dark:text-white" value={formData.whatsapp} onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })} placeholder="WhatsApp number" />{errors.whatsapp && <p className="text-danger text-[10px] font-bold text-red-500">{errors.whatsapp}</p>}</div>
                    <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">ID Proof Number</label><input type="text" className="w-full h-11 px-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-primary rounded-xl text-xs font-semibold placeholder-slate-400 dark:placeholder-slate-500 outline-none transition-all text-slate-800 dark:text-white" value={formData.id_proof_number} onChange={(e) => setFormData({ ...formData, id_proof_number: e.target.value })} placeholder="PAN / Aadhaar" /></div>
                  </div>
                </div>
              )}

              {role === 'contractor' && (
                <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <h3 className="text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider">Business details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Company Name</label><input type="text" className="w-full h-11 px-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-primary rounded-xl text-xs font-semibold placeholder-slate-400 dark:placeholder-slate-500 outline-none transition-all text-slate-800 dark:text-white" value={formData.company} onChange={(e) => setFormData({ ...formData, company: e.target.value })} placeholder="Your firm name" />{errors.company && <p className="text-danger text-[10px] font-bold text-red-500">{errors.company}</p>}</div>
                    <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Owner Name</label><input type="text" className="w-full h-11 px-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-primary rounded-xl text-xs font-semibold placeholder-slate-400 dark:placeholder-slate-500 outline-none transition-all text-slate-800 dark:text-white" value={formData.owner_name} onChange={(e) => setFormData({ ...formData, owner_name: e.target.value })} placeholder="Owner / Proprietor" />{errors.owner_name && <p className="text-danger text-[10px] font-bold text-red-500">{errors.owner_name}</p>}</div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">WhatsApp Number</label><input type="text" className="w-full h-11 px-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-primary rounded-xl text-xs font-semibold placeholder-slate-400 dark:placeholder-slate-500 outline-none transition-all text-slate-800 dark:text-white" value={formData.whatsapp} onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })} placeholder="Company WhatsApp" /></div>
                    <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">GSTIN</label><input type="text" className="w-full h-11 px-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-primary rounded-xl text-xs font-semibold placeholder-slate-400 dark:placeholder-slate-500 outline-none transition-all text-slate-800 dark:text-white" value={formData.gst} onChange={(e) => setFormData({ ...formData, gst: e.target.value })} placeholder="Optional" /></div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-center bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-100/80 dark:border-slate-700">
                <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mb-1.5">
                  Verification code sent to:
                </p>
                <p className="text-xs font-black text-slate-850 dark:text-slate-200 break-all">{formData.email}</p>
                <button
                  type="button"
                  onClick={() => {
                    setOtpSent(false);
                    setOtp('');
                    setOtpValues(['', '', '', '', '', '']);
                    setCountdown(60);
                    setAttempts(0);
                    setErrors({});
                    setMessage('');
                  }}
                  className="text-primary dark:text-emerald-400 hover:underline text-[11px] font-bold mt-2 inline-flex items-center gap-1"
                >
                  Change Email
                </button>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block text-center">Enter Verification Code</label>
                <div className="flex gap-2 justify-center my-4" onPaste={handlePaste}>
                  {otpValues.map((val, idx) => (
                    <input
                      key={idx}
                      id={`otp-input-${idx}`}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength="1"
                      autoComplete="one-time-code"
                      value={val}
                      onChange={(e) => handleOtpChange(idx, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                      className="w-11 h-11 text-center text-base font-black bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:border-primary focus:ring-4 focus:ring-primary/5 rounded-xl outline-none transition-all"
                      ref={(el) => (otpRefs.current[idx] = el)}
                      autoFocus={idx === 0}
                    />
                  ))}
                </div>
                {errors.otp && <p className="text-danger text-xs font-bold text-center">{errors.otp}</p>}
              </div>

              <div className="text-center pt-1">
                {resendDisabled ? (
                  <p className="text-[11px] text-slate-400 font-semibold">
                    Resend code in <span className="text-slate-700 dark:text-slate-300 font-bold">{countdown}s</span>
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={loading}
                    className="text-primary dark:text-emerald-400 hover:underline text-[11px] font-bold disabled:opacity-50"
                  >
                    Resend Verification Code
                  </button>
                )}
              </div>
            </div>
          )}

          {message && <p className="text-xs text-success font-semibold text-center">{message}</p>}

          <div className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-2xl flex gap-3 items-start border border-slate-100 dark:border-slate-800 text-[10px] leading-relaxed text-slate-500 dark:text-slate-400 font-semibold">
            <ShieldCheck className="shrink-0 text-primary dark:text-emerald-400 mt-0.5" size={16} />
            <p>By proceeding, you agree to our terms. Your account will be created with secure 6-digit Email OTP verification powered by Supabase.</p>
          </div>

          <button type="submit" disabled={loading} className="w-full btn-primary text-sm py-3.5 rounded-xl shadow-md flex items-center justify-center gap-1.5">
            {loading ? (
              <Loader2 className="animate-spin" size={16} />
            ) : (
              <>
                {otpSent ? 'Verify & Continue' : 'Continue'}
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        <div className="text-center pt-4 border-t border-slate-100 dark:border-slate-800">
          <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Already registered? <Link to="/login" className="text-primary dark:text-emerald-400 font-bold hover:underline">Sign in instead</Link></p>
        </div>
      </div>
    </div>
  );
};

export default Register;