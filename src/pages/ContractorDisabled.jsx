import { ShieldAlert, ArrowLeft, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ContractorDisabled = () => {
  const { logout } = useAuth();

  return (
    <div className="min-h-[calc(100vh-160px)] bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 p-8 shadow-xl text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto shadow-sm">
          <ShieldAlert size={32} />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-black text-slate-900">Contractor Role Temporarily Disabled</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            Fixiva is currently operating with <strong>Customer</strong>, <strong>Worker</strong>, and <strong>Admin</strong> roles only. Contractor dashboard and agency management flows are temporarily paused.
          </p>
        </div>

        <div className="rounded-2xl bg-slate-50 p-4 border border-slate-200/80 text-left space-y-2">
          <p className="text-xs font-bold text-slate-700">Need assistance?</p>
          <p className="text-[11px] text-slate-500">
            If you need help or have questions regarding existing contractor accounts, please reach out to our operations desk.
          </p>
          <div className="flex items-center gap-2 pt-1 text-xs font-bold text-primary">
            <Mail size={14} />
            <span>support@fixiva.com</span>
          </div>
        </div>

        <div className="flex flex-col gap-2 pt-2">
          <button
            onClick={logout}
            className="w-full py-3 px-4 rounded-2xl bg-primary text-white text-xs font-bold shadow-md hover:bg-blue-700 transition-all cursor-pointer"
          >
            Logout & Switch Account
          </button>
          <Link
            to="/"
            className="w-full py-3 px-4 rounded-2xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 transition-all flex items-center justify-center gap-1.5"
          >
            <ArrowLeft size={14} /> Return to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ContractorDisabled;
