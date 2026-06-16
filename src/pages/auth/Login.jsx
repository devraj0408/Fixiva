import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Loader2, Mail, Lock, ShieldCheck, ArrowRight } from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    let newErrors = {};
    if (!formData.email) newErrors.email = 'Email address is required';
    if (!formData.password) newErrors.password = 'Password is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validate()) {
      setLoading(true);
      const { success, error } = await login(formData.email, formData.password);
      setLoading(false);
      if (success) {
        // Direct navigation using window location or defer to dashboard role
        navigate('/');
      } else {
        setErrors({ email: 'Login failed: ' + (error?.message || 'Invalid credentials') });
      }
    }
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
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Welcome Back</h1>
            <p className="text-xs text-slate-400 font-semibold">Enter your credentials to access your Fixiva dashboard.</p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            {/* Email Address */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 text-slate-400" size={16} />
                <input 
                  type="email" 
                  className="w-full h-11 pl-10 pr-4 bg-slate-50 border border-slate-200 focus:border-primary rounded-xl text-xs font-semibold placeholder-slate-400 outline-none transition-all"
                  placeholder="name@email.com"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  required
                />
              </div>
              {errors.email && <p className="text-danger text-xs font-bold">{errors.email}</p>}
            </div>

            {/* Password */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Password</label>
                <Link to="/forgot-password" className="text-[10px] font-bold text-primary hover:underline">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 text-slate-400" size={16} />
                <input 
                  type="password" 
                  className="w-full h-11 pl-10 pr-4 bg-slate-50 border border-slate-200 focus:border-primary rounded-xl text-xs font-semibold placeholder-slate-400 outline-none transition-all"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  required
                />
              </div>
              {errors.password && <p className="text-danger text-xs font-bold">{errors.password}</p>}
            </div>

            {/* Remember Me checkbox */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-600">
                <input 
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary/20 accent-primary"
                />
                <span>Remember me</span>
              </label>
            </div>

            <button 
              type="submit" 
              className="w-full btn-primary text-sm py-3.5 rounded-xl shadow-md flex items-center justify-center gap-1.5"
              disabled={loading}
            >
              {loading ? <Loader2 className="animate-spin" size={16} /> : (
                <>
                  Sign In
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Social login placeholders */}
          <div className="space-y-4 pt-4 border-t border-slate-100 text-center">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Or login with</span>
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => alert("Google Auth placeholder. Supabase dynamic controls ready.")}
                className="flex justify-center items-center gap-2 btn-secondary py-2.5 rounded-xl text-xs"
              >
                Google
              </button>
              <button 
                onClick={() => alert("Apple Auth placeholder. Supabase dynamic controls ready.")}
                className="flex justify-center items-center gap-2 btn-secondary py-2.5 rounded-xl text-xs"
              >
                Apple
              </button>
            </div>
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
  );
};

export default Login;
