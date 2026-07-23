import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useApp } from '../../context/AuthContext';

import { Loader2, Mail, User, ShieldCheck, Phone, ArrowRight, LocateFixed } from 'lucide-react';
import HierarchicalLocationSelector from '../../components/HierarchicalLocationSelector';

const Register = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialRole = queryParams.get('role') || 'customer';
  const [role, setRole] = useState(initialRole === 'worker' || initialRole === 'contractor' ? initialRole : 'customer');

  const { requestOtp, verifyOtp, showToast, user, isAuthenticated } = useApp();
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
        navigate('/contractor-dashboard', { replace: true });
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

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    city: '',
    state: '',
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

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setGeoMessage('Geolocation is not supported in this browser.');
      return;
    }

    setGeoLoading(true);
    setGeoMessage('');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData((prev) => ({
          ...prev,
          locationText: `Auto-detected (${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)})`,
          locationLatitude: position.coords.latitude,
          locationLongitude: position.coords.longitude,
          locationSource: 'device'
        }));
        setGeoLoading(false);
        setGeoMessage('Current location detected successfully.');
      },
      () => {
        setGeoLoading(false);
        setGeoMessage('Location access was denied. You can still enter a location manually.');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
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
    const { success, error, email } = await requestOtp(formData.email, 'sign-up', {
      name: formData.name,
      phone: formData.phone,
      role,
      city: formData.city,
      state: formData.state,
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
    setMessage(`Verification code sent to ${email}.`);
  };

  const handleResendOtp = async () => {
    if (resendDisabled || loading) return;
    setLoading(true);
    setErrors({});
    setMessage('');
    setOtpValues(['', '', '', '', '', '']);
    setOtp('');
    setAttempts(0);

    const { success, error, email } = await requestOtp(formData.email, 'sign-up', {
      name: formData.name,
      phone: formData.phone,
      role,
      city: formData.city,
      state: formData.state,
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
    setMessage(`Verification code sent to ${email}.`);
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
    if (activeRole === 'admin') {
      navigate('/dashboard/admin');
    } else if (activeRole === 'worker') {
      navigate('/worker-dashboard');
    } else if (activeRole === 'contractor') {
      navigate('/contractor-dashboard');
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
      <div className="bg-white rounded-3xl border border-slate-100 p-8 sm:p-12 shadow-xl shadow-slate-100/50 space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Create an Account</h1>
          <p className="text-xs text-slate-400 font-semibold">Join Fixiva with a secure one-time verification code.</p>
        </div>

        <div className="flex flex-col items-center justify-center gap-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-[10px] font-black uppercase tracking-wider text-slate-600">
            <span className="rounded-full bg-primary/10 p-1 text-primary"><User size={12} /></span>
            Joining as {role === 'worker' ? 'Worker' : role === 'contractor' ? 'Contractor' : 'Customer'}
          </div>
          <div className="grid grid-cols-3 gap-3 w-full max-w-md">
            {['customer', 'worker', 'contractor'].map((option) => (
              <button
                key={option}
                type="button"
                className={`w-full rounded-2xl border px-3 py-2 text-xs font-bold uppercase transition ${role === option ? 'border-primary bg-primary text-white' : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300'}`}
                onClick={() => {
                  if (!otpSent) setRole(option);
                }}
                disabled={otpSent}
              >
                {option === 'customer' ? 'Customer' : option === 'worker' ? 'Worker' : 'Contractor'}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={otpSent ? handleVerifyOtp : handleRequestOtp} className="space-y-6">
          {!otpSent ? (
            <div className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Account details</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-3.5 text-slate-400" size={16} />
                      <input type="text" className="w-full h-11 pl-10 pr-4 bg-slate-50 border border-slate-200 focus:border-primary rounded-xl text-xs font-semibold placeholder-slate-400 outline-none transition-all text-slate-800" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Rahul Sharma" />
                    </div>
                    {errors.name && <p className="text-danger text-[10px] font-bold text-red-500">{errors.name}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-3.5 text-slate-400" size={16} />
                      <input type="email" className="w-full h-11 pl-10 pr-4 bg-slate-50 border border-slate-200 focus:border-primary rounded-xl text-xs font-semibold placeholder-slate-400 outline-none transition-all text-slate-800" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="name@email.com" />
                    </div>
                    {errors.email && <p className="text-danger text-[10px] font-bold text-red-500">{errors.email}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Operating City</label>
                    <HierarchicalLocationSelector
                      selectedState={formData.state}
                      selectedDistrict={formData.city}
                      onChange={(district, state) => setFormData({ ...formData, city: district, state: state })}
                      statePlaceholder="Select State"
                      districtPlaceholder="Select City"
                      layout="row"
                      className="w-full"
                    />
                    {errors.city && <p className="text-danger text-[10px] font-bold text-red-500">{errors.city}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Mobile Number</label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-3.5 text-slate-400" size={16} />
                      <input type="text" className="w-full h-11 pl-10 pr-4 bg-slate-50 border border-slate-200 focus:border-primary rounded-xl text-xs font-semibold placeholder-slate-400 outline-none transition-all text-slate-800" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="10-digit mobile" />
                    </div>
                    {errors.phone && <p className="text-danger text-[10px] font-bold text-red-500">{errors.phone}</p>}
                  </div>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row">
                  <input type="text" className="flex-1 h-11 px-4 bg-slate-50 border border-slate-200 focus:border-primary rounded-xl text-xs font-semibold placeholder-slate-400 outline-none transition-all text-slate-800" value={formData.locationText} onChange={(e) => setFormData({ ...formData, locationText: e.target.value, locationSource: e.target.value ? 'manual' : '' })} placeholder="Precise locality or landmark" />
                  <button type="button" onClick={handleUseCurrentLocation} disabled={geoLoading} className="h-11 px-4 rounded-xl border border-sky-200/80 bg-gradient-to-r from-sky-200 via-cyan-100 to-sky-100 text-slate-700 text-xs font-black shadow-sm shadow-sky-200/40 flex items-center justify-center gap-2 disabled:opacity-60"><span>{geoLoading ? <Loader2 size={18} className="animate-spin" /> : <LocateFixed size={18} />}</span>{geoLoading ? 'Detecting...' : 'Use Current Location'}</button>
                </div>
                {geoMessage && <p className={`text-[10px] font-semibold ${geoMessage.includes('successfully') ? 'text-green-600' : 'text-amber-600'}`}>{geoMessage}</p>}
              </div>

              {role === 'worker' && (
                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Professional details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Primary Skills</label><input type="text" className="w-full h-11 px-4 bg-slate-50 border border-slate-200 focus:border-primary rounded-xl text-xs font-semibold placeholder-slate-400 outline-none transition-all text-slate-800" value={formData.skills} onChange={(e) => setFormData({ ...formData, skills: e.target.value })} placeholder="Plumber, Electrician" />{errors.skills && <p className="text-danger text-[10px] font-bold text-red-500">{errors.skills}</p>}</div>
                    <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Experience</label><input type="text" className="w-full h-11 px-4 bg-slate-50 border border-slate-200 focus:border-primary rounded-xl text-xs font-semibold placeholder-slate-400 outline-none transition-all text-slate-800" value={formData.experience} onChange={(e) => setFormData({ ...formData, experience: e.target.value })} placeholder="5 years" /></div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">WhatsApp Number</label><input type="text" className="w-full h-11 px-4 bg-slate-50 border border-slate-200 focus:border-primary rounded-xl text-xs font-semibold placeholder-slate-400 outline-none transition-all text-slate-800" value={formData.whatsapp} onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })} placeholder="WhatsApp number" />{errors.whatsapp && <p className="text-danger text-[10px] font-bold text-red-500">{errors.whatsapp}</p>}</div>
                    <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">ID Proof Number</label><input type="text" className="w-full h-11 px-4 bg-slate-50 border border-slate-200 focus:border-primary rounded-xl text-xs font-semibold placeholder-slate-400 outline-none transition-all text-slate-800" value={formData.id_proof_number} onChange={(e) => setFormData({ ...formData, id_proof_number: e.target.value })} placeholder="PAN / Aadhaar" /></div>
                  </div>
                </div>
              )}

              {role === 'contractor' && (
                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Business details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Company Name</label><input type="text" className="w-full h-11 px-4 bg-slate-50 border border-slate-200 focus:border-primary rounded-xl text-xs font-semibold placeholder-slate-400 outline-none transition-all text-slate-800" value={formData.company} onChange={(e) => setFormData({ ...formData, company: e.target.value })} placeholder="Your firm name" />{errors.company && <p className="text-danger text-[10px] font-bold text-red-500">{errors.company}</p>}</div>
                    <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Owner Name</label><input type="text" className="w-full h-11 px-4 bg-slate-50 border border-slate-200 focus:border-primary rounded-xl text-xs font-semibold placeholder-slate-400 outline-none transition-all text-slate-800" value={formData.owner_name} onChange={(e) => setFormData({ ...formData, owner_name: e.target.value })} placeholder="Owner / Proprietor" />{errors.owner_name && <p className="text-danger text-[10px] font-bold text-red-500">{errors.owner_name}</p>}</div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">WhatsApp Number</label><input type="text" className="w-full h-11 px-4 bg-slate-50 border border-slate-200 focus:border-primary rounded-xl text-xs font-semibold placeholder-slate-400 outline-none transition-all text-slate-800" value={formData.whatsapp} onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })} placeholder="Company WhatsApp" /></div>
                    <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">GSTIN</label><input type="text" className="w-full h-11 px-4 bg-slate-50 border border-slate-200 focus:border-primary rounded-xl text-xs font-semibold placeholder-slate-400 outline-none transition-all text-slate-800" value={formData.gst} onChange={(e) => setFormData({ ...formData, gst: e.target.value })} placeholder="Optional" /></div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-center bg-slate-50 p-4 rounded-2xl border border-slate-100/80">
                <p className="text-xs text-slate-500 font-semibold mb-1.5">
                  Verification code sent to:
                </p>
                <p className="text-xs font-black text-slate-850 break-all">{formData.email}</p>
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
                  className="text-primary hover:underline text-[11px] font-bold mt-2 inline-flex items-center gap-1"
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
                      className="w-11 h-11 text-center text-base font-black bg-slate-50 border border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/5 rounded-xl outline-none transition-all text-slate-800"
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
                    Resend code in <span className="text-slate-700 font-bold">{countdown}s</span>
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={loading}
                    className="text-primary hover:underline text-[11px] font-bold disabled:opacity-50"
                  >
                    Resend Verification Code
                  </button>
                )}
              </div>
            </div>
          )}

          {message && <p className="text-xs text-success font-semibold text-center">{message}</p>}

          <div className="p-4 bg-slate-50 rounded-2xl flex gap-3 items-start border border-slate-100 text-[10px] leading-relaxed text-slate-500 font-semibold">
            <ShieldCheck className="shrink-0 text-primary mt-0.5" size={16} />
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

        <div className="text-center pt-4 border-t border-slate-100">
          <p className="text-xs text-slate-500 font-semibold">Already registered? <Link to="/login" className="text-primary font-bold hover:underline">Sign in instead</Link></p>
        </div>
      </div>
    </div>
  );
};

export default Register;