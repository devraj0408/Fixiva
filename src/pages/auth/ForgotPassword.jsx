import { Link } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';

const ForgotPassword = () => (
  <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-16">
    <div className="max-w-lg w-full bg-white rounded-3xl border border-slate-100 p-8 shadow-xl shadow-slate-100/50 text-center space-y-6">
      <div className="mx-auto bg-blue-50 text-primary h-14 w-14 rounded-full flex items-center justify-center"><ShieldCheck size={28} /></div>
      <div className="space-y-2"><h1 className="text-2xl font-black text-slate-900 tracking-tight">Password reset is no longer used</h1><p className="text-sm text-slate-500 font-medium">Fixiva now uses passwordless one-time verification for login and sign-up. Please use the secure OTP flow instead.</p></div>
      <Link to="/login" className="btn-primary inline-flex px-6 py-3 rounded-xl text-sm">Go to login</Link>
    </div>
  </div>
);

export default ForgotPassword;
