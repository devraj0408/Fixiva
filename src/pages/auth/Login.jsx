import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getConfiguredAdminList, isAdminEmail } from '../../lib/adminAccess';
import { getAdminDashboardRoute } from '../../lib/routePaths';
import { Loader2, Mail, ArrowRight } from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();
  const { requestOtp, verifyOtp, user, isAuthenticated, showToast } = useAuth();
  const [loading, setLoading] = useState(false);
  const [identifier, setIdentifier] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');

  // OTP inputs references and states
  const otpRefs = useRef([]);
  const [otpValues, setOtpValues] = useState(['', '', '', '', '', '']);
  const [countdown, setCountdown] = useState(60);
  const resendDisabled = countdown > 0;
  const [attempts, setAttempts] = useState(0);

  const title = 'Welcome Back';
  const subtitle = 'Enter your email to receive a secure OTP.';

  // Redirect automatically if already logged in
  useEffect(() => {
    if (isAuthenticated && user) {
      const role = String(user.role || '').trim().toLowerCase();
      if (role === 'admin') {
        navigate(getAdminDashboardRoute());
      } else if (role === 'worker') {
        navigate('/worker-dashboard');
      } else if (role === 'contractor') {
        navigate('/contractor-dashboard');
      } else {
        navigate('/dashboard');
      }
    }
  }, [isAuthenticated, user, navigate]);

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

  const handleRequestOtp = async (e) => {
    if (e) e.preventDefault();
    setErrors({});
    setMessage('');
    
    const normalizedIdentifier = identifier.trim();
    if (!normalizedIdentifier) {
      setErrors({ identifier: 'Enter your email address.' });
      return;
    }

    setLoading(true);
    const { success, error, email } = await requestOtp(identifier, 'sign-in');
    setLoading(false);

    if (!success) {
      setErrors({ identifier: error?.message || 'Unable to send verification code.' });
      return;
    }

    setOtpSent(true);
    setCountdown(60);
    setAttempts(0);
    setOtpValues(['', '', '', '', '', '']);
    setOtp('');
    setMessage(`Verification code sent to ${email || 'your inbox'}.`);
  };

  const handleResendOtp = async () => {
    if (resendDisabled || loading) return;
    setLoading(true);
    setErrors({});
    setMessage('');
    setOtpValues(['', '', '', '', '', '']);
    setOtp('');
    setAttempts(0);
    
    const { success, error, email } = await requestOtp(identifier, 'sign-in');
    setLoading(false);
    
    if (!success) {
      setErrors({ otp: error?.message || 'Unable to resend verification code.' });
      return;
    }
    
    setCountdown(60);
    setMessage(`Verification code sent to ${email || 'your inbox'}.`);
  };

  const handleVerifyOtp = async (e) => {
    if (e) e.preventDefault();
    setErrors({});
    
    if (!identifier.trim()) {
      setErrors({ identifier: 'Enter your email address.' });
      return;
    }
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
    const { success, error, profile } = await verifyOtp(identifier, otp, 'sign-in');
    setLoading(false);

    if (!success) {
      const errorMsg = error?.message || '';
      if (errorMsg.includes('OTP failure') || errorMsg.includes('Session failure') || errorMsg.includes('Profile query failure') || errorMsg.includes('RLS failure') || errorMsg.includes('Role mismatch') || errorMsg.includes('Redirect failure')) {
        setErrors({ otp: errorMsg });
      } else if (errorMsg.includes('expired') || errorMsg.includes('expire')) {
        setErrors({ otp: 'Expired Code. Please request a new verification code.' });
      } else if (errorMsg.includes('too many') || errorMsg.includes('rate limit') || attempts >= 4) {
        setErrors({ otp: 'Too Many Attempts. Please request a new code.' });
      } else if (errorMsg.includes('invalid') || errorMsg.includes('incorrect') || errorMsg.includes('does not match')) {
        setErrors({ otp: `Invalid Code. (${5 - (attempts + 1)} attempts remaining)` });
      } else {
        setErrors({ otp: errorMsg || 'Invalid Code.' });
      }
      return;
    }

    showToast('Login Successful', 'success');

    try {
      const role = String(profile?.role || '').trim().toLowerCase();
      const configuredAdmins = getConfiguredAdminList();
      const emailToCheck = profile?.email || identifier;
      const isConfiguredAdminEmail = isAdminEmail(emailToCheck, configuredAdmins.join(','));

      if (role === 'admin' || isConfiguredAdminEmail) {
        navigate(getAdminDashboardRoute());
      } else if (role === 'worker') {
        navigate('/worker-dashboard');
      } else if (role === 'contractor') {
        navigate('/contractor-dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (redirectErr) {
      console.error("Navigation redirect error:", redirectErr);
      setErrors({ otp: 'Redirect failure: Unable to route to dashboard.' });
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
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-white">
      {/* Left split-screen Illustration & Brand Info */}
      <div className="hidden lg:flex lg:col-span-5 bg-gradient-to-tr from-slate-950 via-slate-900 to-indigo-950 p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-10 left-10 w-[300px] h-[300px] bg-indigo-500/10 rounded-full blur-3xl"></div>

        <div className="relative z-10 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="144" height="36" viewBox="0 0 160 40" className="shrink-0">
            {/* Icon Mark Background */}
            <rect x="0" y="0" width="40" height="40" rx="10" fill="#F8FAFC" />
            
            {/* Screwdriver Chimney */}
            <rect x="24.5" y="6" width="3.5" height="5.5" rx="0.8" fill="#F59E0B" />
            <rect x="25.5" y="11.5" width="1.5" height="4.5" fill="#F59E0B" />

            {/* Amber Shield-Roof */}
            <polygon points="8,19 20,9 32,19 29,19 20,12.5 11,19" fill="#F59E0B" />

            {/* Blue House-Shield Body */}
            <path d="M 11 19 L 29 19 L 29 27 C 29 32.5 20 35 20 35 C 20 35 11 32.5 11 27 Z" fill="#2563EB" />

            {/* Connected Service Windows */}
            <line x1="15" y1="21.5" x2="25" y2="21.5" stroke="#FFFFFF" strokeWidth="1" />
            <circle cx="15" cy="21.5" r="1.5" fill="#FFFFFF" />
            <circle cx="20" cy="21.5" r="1.5" fill="#FFFFFF" />
            <circle cx="25" cy="21.5" r="1.5" fill="#FFFFFF" />

            {/* White Door */}
            <rect x="15" y="24" width="10" height="9.5" rx="1" fill="#FFFFFF" />

            {/* Success Green Door Checkmark */}
            <path d="M17.5 28.5 L19.5 30.5 L22.5 26" stroke="#10B981" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />

            {/* Foundation Beam */}
            <rect x="12" y="32.5" width="16" height="1.2" rx="0.6" fill="#FFFFFF" opacity="0.3" />

            {/* Wordmark */}
            <g id="wordmark" fill="none" strokeWidth="3.3" strokeLinecap="round" strokeLinejoin="round">
              <path id="letter-f" d="M60 13.5 H53.6 V26.5 M53.6 19.5 H58.5" stroke="#2563EB" />
              <path id="letter-i-1" d="M65.5 13.5 V26.5" stroke="#FFFFFF" />
              <path id="letter-x" d="M71.5 13.5 L79.5 26.5 M79.5 13.5 L71.5 26.5" stroke="#FFFFFF" />
              <path id="letter-i-2" d="M85.5 13.5 V26.5" stroke="#10B981" />
              <path id="letter-v" d="M91.5 13.5 L96.5 26.5 L101.5 13.5" stroke="#F59E0B" />
              <path id="letter-a" d="M107.5 26.5 L112.5 13.5 L117.5 26.5 M110.1 21 H114.9" stroke="#FFFFFF" />
            </g>
          </svg>
        </div>

        <div className="relative z-10 space-y-6">
          <h2 className="text-4xl font-extrabold text-white leading-tight">
            One App.<br/>
            <span className="text-primary">Every Solution.</span>
          </h2>
          <p className="text-slate-400 font-medium text-sm leading-relaxed max-w-sm">
            Sign in to access your dashboard, monitor schedules list, track verified workers, and manage platform support.
          </p>
        </div>

        <div className="relative z-10 text-xs text-slate-500 font-semibold uppercase tracking-wider">
          &copy; {new Date().getFullYear()} Fixiva Services. All rights reserved.
        </div>
      </div>

      {/* Right split-screen Form */}
      <div className="lg:col-span-7 flex flex-col justify-center px-4 py-12 sm:px-6 lg:px-20 xl:px-24 bg-slate-50/50">
        <div className="max-w-md w-full mx-auto space-y-8 bg-white p-8 sm:p-10 rounded-3xl border border-slate-100 shadow-xl shadow-slate-100/50">
          <div className="space-y-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">{title}</h1>
            <p className="text-xs text-slate-400 font-semibold">{subtitle}</p>
          </div>

          <form className="space-y-5" onSubmit={otpSent ? handleVerifyOtp : handleRequestOtp}>
            {!otpSent ? (
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3.5 text-slate-400" size={16} />
                  <input
                    type="email"
                    className="w-full h-11 pl-10 pr-4 bg-slate-50 border border-slate-200 focus:border-primary rounded-xl text-xs font-semibold placeholder-slate-400 outline-none transition-all"
                    placeholder="name@email.com"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                  />
                </div>
                {errors.identifier && <p className="text-danger text-xs font-bold">{errors.identifier}</p>}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-center bg-slate-50 p-4 rounded-2xl border border-slate-100/80">
                  <p className="text-xs text-slate-500 font-semibold mb-1.5">
                    Verification code sent to:
                  </p>
                  <p className="text-xs font-black text-slate-850 break-all">{identifier}</p>
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

            <button
              type="submit"
              className="w-full btn-primary text-sm py-3.5 rounded-xl shadow-md flex items-center justify-center gap-1.5"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="animate-spin" size={16} />
              ) : otpSent ? (
                <>
                  Verify Code
                  <ArrowRight size={16} />
                </>
              ) : (
                <>
                  Continue
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <div className="space-y-4 pt-4 border-t border-slate-100 text-center">
            <div className="flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-wider text-slate-400">
              Passwordless secure access
            </div>
            <div className="text-center pt-2">
              <p className="text-xs text-slate-500 font-medium">
                Don't have an account?{' '}
                <Link to="/register" className="text-primary font-bold hover:underline">
                  Create one now
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
