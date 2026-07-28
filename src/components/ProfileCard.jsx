import { ShieldCheck, Settings, User } from 'lucide-react';

const ProfileCard = ({ user, role = 'customer', isOnline = true, onEditProfile }) => {
  const getBadgeInfo = () => {
    const r = String(role || user?.role || '').trim().toLowerCase();
    if (r === 'worker') {
      return { label: 'Verified Specialist', tone: 'text-amber-400 bg-amber-950/80 border-amber-800/80' };
    }
    if (r === 'contractor') {
      return { label: 'Verified Agency', tone: 'text-sky-400 bg-sky-950/80 border-sky-800/80' };
    }
    if (r === 'admin') {
      return { label: 'System Admin', tone: 'text-purple-400 bg-purple-950/80 border-purple-800/80' };
    }
    return { label: 'Verified Customer', tone: 'text-emerald-400 bg-emerald-950/80 border-emerald-800/80' };
  };

  const badge = getBadgeInfo();
  const displayName = user?.company || user?.name || 'Fixiva User';
  const defaultAvatar = role === 'contractor'
    ? 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=150&auto=format&fit=crop&q=80'
    : role === 'worker'
    ? 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=150&auto=format&fit=crop&q=80'
    : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';

  const avatarUrl = user?.profile_photo_url || defaultAvatar;
  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleString('default', { month: 'short', year: 'numeric' })
    : 'Jan 2026';

  return (
    <div className="rounded-3xl bg-slate-900 p-6 text-white shadow-lg space-y-4 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-2xl -z-0"></div>

      <div className="flex flex-col items-center text-center space-y-3 relative z-10">
        {/* Circular Avatar */}
        <div className="relative">
          <img
            src={avatarUrl}
            alt={displayName}
            className="w-20 h-20 rounded-full object-cover border-4 border-white/20 shadow-md"
          />
          {isOnline && (
            <span className="absolute bottom-0 right-0 w-5 h-5 bg-emerald-500 rounded-full border-2 border-slate-900 flex items-center justify-center text-[10px] text-white font-bold" title="Online Active">
              ✓
            </span>
          )}
        </div>

        <div>
          <h3 className="text-base font-extrabold text-white">{displayName}</h3>
          
          {/* Verified Badge */}
          <div className={`mt-1.5 inline-flex items-center justify-center gap-1 text-[10px] font-black px-2.5 py-0.5 rounded-full border ${badge.tone}`}>
            <ShieldCheck size={12} /> {badge.label}
          </div>

          <p className="text-[11px] text-slate-400 font-medium mt-2">
            Member since {memberSince}
          </p>
        </div>

        {/* Edit Profile Button */}
        {onEditProfile && (
          <button
            onClick={onEditProfile}
            className="w-full py-2 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white border border-white/10 transition-all flex items-center justify-center gap-1.5"
          >
            <Settings size={13} /> Edit Profile
          </button>
        )}
      </div>
    </div>
  );
};

export default ProfileCard;
