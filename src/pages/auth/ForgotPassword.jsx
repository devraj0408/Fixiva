import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Loader2, ArrowLeft, Mail } from 'lucide-react';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const { forgotPassword } = useAuth();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      setError('Email is required');
      return;
    }
    setLoading(true);
    setError('');
    const { success: ok, error: err } = await forgotPassword(email);
    setLoading(false);
    if (ok) {
      setSuccess(true);
    } else {
      setError(err?.message || 'Failed to send reset email. Please try again.');
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <div className="bg-white rounded-3xl border border-slate-100 p-8 sm:p-10 shadow-xl shadow-slate-100/50 space-y-6">
        
        <div className="space-y-1">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Reset Password</h1>
          <p className="text-xs text-slate-400 font-semibold">We will dispatch an authentication link to restore access.</p>
        </div>

        {success ? (
          <div className="space-y-4 animate-fade-in">
            <div className="p-4 bg-green-50 text-success border border-green-100 rounded-xl text-xs font-semibold leading-relaxed">
              Password recovery link successfully sent! Check your inbox for coordinates.
            </div>
            <Link 
              to="/login" 
              className="w-full btn-primary text-sm py-3.5 rounded-xl shadow-md flex items-center justify-center"
            >
              Back to Login
            </Link>
          </div>
        ) : (
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 text-slate-400" size={16} />
                <input
                  type="email"
                  className="w-full h-11 pl-10 pr-4 bg-slate-50 border border-slate-200 focus:border-primary rounded-xl text-xs font-semibold placeholder-slate-400 outline-none transition-all"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              {error && <span className="text-danger text-xs font-bold">{error}</span>}
            </div>

            <button 
              type="submit" 
              className="w-full btn-primary text-sm py-3.5 rounded-xl shadow-md flex items-center justify-center gap-1.5"
              disabled={loading}
            >
              {loading ? <Loader2 className="animate-spin" size={16} /> : 'Send Recovery Link'}
            </button>
          </form>
        )}

        <div className="text-center pt-4 border-t border-slate-100">
          <Link 
            to="/login" 
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 font-bold hover:text-primary transition-colors"
          >
            <ArrowLeft size={14} /> Back to Login
          </Link>
        </div>

      </div>
    </div>
  );
};

export default ForgotPassword;
