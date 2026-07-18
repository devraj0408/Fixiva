import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Loader2, Mail, ArrowRight, Smartphone } from 'lucide-react';

const Login = ({ adminMode = false }) => {
  const navigate = useNavigate();
  const { requestOtp, verifyOtp } = useAuth();
  const [loading, setLoading] = useState(false);
  const [identifier, setIdentifier] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');

  const title = adminMode ? 'Admin Access' : 'Welcome Back';
  const subtitle = adminMode
    ? 'Enter your administrator email to receive a secure OTP.'
    : 'Enter your email or mobile number to receive a secure OTP.';

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setErrors({});
    if (!identifier.trim()) {
      setErrors({ identifier: 'Enter your email or mobile number.' });
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
    setMessage(`Verification code sent to ${email || 'your inbox'}.`);
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setErrors({});
    if (!identifier.trim()) {
      setErrors({ identifier: 'Enter your email or mobile number.' });
      return;
    }
    if (!otp.trim()) {
      setErrors({ otp: 'Enter the OTP code.' });
      return;
    }

    setLoading(true);
    const { success, error, profile } = await verifyOtp(identifier, otp, 'sign-in');
    setLoading(false);

    if (!success) {
      setErrors({ otp: error?.message || 'Unable to verify the code.' });
      return;
    }

    if (adminMode) {
      if (profile?.role === 'admin') {
        navigate('/dashboard/admin');
        return;
      }
      setErrors({ identifier: 'Access denied. Only administrators can use this entry point.' });
      return;
    }

    navigate(`/dashboard/${profile?.role || 'customer'}`);
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-white">
      {/* Left split-screen Illustration & Brand Info */}
      <div className="hidden lg:flex lg:col-span-5 bg-gradient-to-tr from-slate-950 via-slate-900 to-indigo-950 p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-10 left-10 w-[300px] h-[300px] bg-indigo-500/10 rounded-full blur-3xl"></div>

        <div className="relative z-10 flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-primary to-blue-500 flex items-center justify-center shadow-md">
            <span className="text-white font-extrabold text-sm tracking-wider">F</span>
          </div>
          <span className="text-xl font-extrabold tracking-tight text-white">
            FIXIVA
          </span>
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
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Email or Mobile Number</label>
              <div className="relative">
                {identifier.includes('@') ? (
                  <Mail className="absolute left-3.5 top-3.5 text-slate-400" size={16} />
                ) : (
                  <Smartphone className="absolute left-3.5 top-3.5 text-slate-400" size={16} />
                )}
                <input
                  type="text"
                  className="w-full h-11 pl-10 pr-4 bg-slate-50 border border-slate-200 focus:border-primary rounded-xl text-xs font-semibold placeholder-slate-400 outline-none transition-all"
                  placeholder="name@email.com or mobile number"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                />
              </div>
              {errors.identifier && <p className="text-danger text-xs font-bold">{errors.identifier}</p>}
            </div>

            {otpSent && (
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Verification Code</label>
                <input
                  type="text"
                  inputMode="numeric"
                  className="w-full h-11 px-4 bg-slate-50 border border-slate-200 focus:border-primary rounded-xl text-xs font-semibold placeholder-slate-400 outline-none transition-all"
                  placeholder="Enter 6-digit code"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                />
                {errors.otp && <p className="text-danger text-xs font-bold">{errors.otp}</p>}
              </div>
            )}

            {message && <p className="text-xs text-success font-semibold">{message}</p>}

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
                  Send Verification Code
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
