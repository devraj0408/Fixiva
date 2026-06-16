import React from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Shield, Edit } from 'lucide-react';

const Profile = () => {
  const { user } = useAuth();

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="bg-slate-50 min-h-screen py-16">
      <div className="max-w-2xl mx-auto px-4">
        
        <div className="bg-white rounded-3xl border border-slate-100 p-8 sm:p-10 shadow-xl shadow-slate-100/50 space-y-8 animate-fade-in">
          
          <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-slate-100">
            <div className="h-16 w-16 rounded-full bg-gradient-to-tr from-primary to-blue-500 text-white font-extrabold text-lg flex items-center justify-center uppercase tracking-wider shadow-md">
              {getInitials(user?.name)}
            </div>
            <div className="text-center sm:text-left space-y-1">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">{user?.name || 'Fixiva Member'}</h2>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{user?.role} Account</p>
            </div>
            <button 
              onClick={() => alert("Profile edits are coming soon in next deployment release.")}
              className="mt-4 sm:mt-0 sm:ml-auto btn-secondary text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5"
            >
              <Edit size={14} /> Edit Details
            </button>
          </div>

          <div className="space-y-5 text-xs font-semibold text-slate-650">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Full Name</label>
              <div className="flex items-center gap-3 p-3.5 bg-slate-50 border border-slate-100 rounded-xl">
                <User size={16} className="text-slate-400" />
                <span className="text-slate-800">{user?.name}</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Email Address</label>
              <div className="flex items-center gap-3 p-3.5 bg-slate-50 border border-slate-100 rounded-xl">
                <Mail size={16} className="text-slate-400" />
                <span className="text-slate-800">{user?.email}</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Identity Status</label>
              <div className="flex items-center gap-3 p-3.5 bg-slate-50 border border-slate-100 rounded-xl text-success font-bold">
                <Shield size={16} />
                <span>Verified Account Holder</span>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100">
             <h3 className="font-extrabold text-slate-800 text-sm mb-4">Security</h3>
             <button 
              onClick={() => alert("Password changes reset coordinates dispatched on registered emails.")}
              className="btn-secondary text-xs px-4 py-2 rounded-xl"
             >
              Change Account Password
             </button>
          </div>

        </div>

      </div>
    </div>
  );
};

export default Profile;
