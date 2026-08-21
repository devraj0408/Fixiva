import { useState } from 'react';
import { useCms } from '../../context/CmsContext';
import { Bell, Send, Trash2, Search, Loader2 } from 'lucide-react';

const NotificationsPanel = () => {
  const {
    notifications,
    createBroadcastNotification,
    deleteNotification,
    filterItems,
    paginateItems,
    showToast,
  } = useCms();

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [isSending, setIsSending] = useState(false);
  const [form, setForm] = useState({ title: '', message: '', target_role: 'all' });
  const [errors, setErrors] = useState({});

  const filtered = filterItems(notifications, search, ['title', 'message', 'target_role']);
  const paginated = paginateItems(filtered, page, 6);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!form.title.trim()) {
      newErrors.title = 'Notification title is required.';
    }
    if (!form.message.trim()) {
      newErrors.message = 'Message is required.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setIsSending(true);

    try {
      const { error } = await createBroadcastNotification({
        title: form.title.trim(),
        message: form.message.trim(),
        target_role: (form.target_role || 'all').toLowerCase(),
      });

      if (!error) {
        showToast('Broadcast alert sent successfully!', 'success');
        setForm({ title: '', message: '', target_role: 'all' });
      } else {
        showToast(`Failed to send broadcast: ${error}`, 'error');
      }
    } catch (err) {
      console.error('Broadcast error:', err);
      showToast('An error occurred while sending broadcast.', 'error');
    } finally {
      setIsSending(false);
    }
  };

  const getTargetBadgeClass = (role) => {
    const r = (role || 'all').toLowerCase();
    if (r === 'customer') return 'bg-blue-50 text-blue-700 border-blue-200';
    if (r === 'worker') return 'bg-amber-50 text-amber-800 border-amber-200';
    if (r === 'contractor') return 'bg-purple-50 text-purple-700 border-purple-200';
    if (r === 'admin') return 'bg-rose-50 text-rose-700 border-rose-200';
    return 'bg-emerald-50 text-emerald-800 border-emerald-200';
  };

  return (
    <div className="space-y-6 pb-16 sm:pb-24">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-2">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Broadcast Notifications Center</h2>
          <p className="text-xs font-semibold text-slate-500 mt-0.5">
            Dispatch system announcements and real-time broadcast alerts across FIXIVA user roles.
          </p>
        </div>
      </div>

      {/* Main Grid: History (Left) | Create Form (Right) */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-[minmax(0,1.2fr)_minmax(380px,0.8fr)] items-start">
        {/* Left Column: Notification History & Search */}
        <div className="space-y-4">
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="🔍 Search notification history..."
              className="h-11 w-full rounded-2xl border border-slate-200 bg-white pl-10 pr-4 text-xs font-semibold focus:outline-none focus:border-primary shadow-2xs"
            />
          </div>

          <div className="space-y-3">
            {paginated.data.length === 0 ? (
              <div className="rounded-3xl border border-slate-200/80 bg-white p-10 text-center space-y-3 shadow-2xs">
                <div className="h-14 w-14 mx-auto rounded-2xl bg-blue-50 text-primary flex items-center justify-center text-2xl font-black">
                  📢
                </div>
                <h4 className="text-base font-black text-slate-900">No broadcast notifications yet</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto font-medium leading-relaxed">
                  Send your first announcement to keep FIXIVA users informed.
                </p>
              </div>
            ) : (
              paginated.data.map((notif) => (
                <div
                  key={notif.id}
                  className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs space-y-2.5 hover:border-slate-300 transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="h-9 w-9 rounded-xl bg-blue-50 text-primary flex items-center justify-center shrink-0">
                        <Bell size={16} />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-extrabold text-slate-900 text-xs truncate">{notif.title}</h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider border ${getTargetBadgeClass(
                              notif.target_role
                            )}`}
                          >
                            Audience: {notif.target_role || 'All Users'}
                          </span>
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            Status: Sent
                          </span>
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm('Delete this notification entry?')) {
                          deleteNotification(notif.id);
                        }
                      }}
                      className="p-1.5 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors shrink-0 cursor-pointer"
                      title="Delete notification"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <p className="text-xs text-slate-700 bg-slate-50/80 p-3 rounded-xl border border-slate-100 font-medium leading-relaxed">
                    {notif.message}
                  </p>
                </div>
              ))
            )}
          </div>

          {/* Pagination Controls */}
          {paginated.totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-slate-500 font-bold">
                Page {paginated.currentPage} of {paginated.totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 disabled:opacity-40 cursor-pointer"
                >
                  Previous
                </button>
                <button
                  disabled={page >= paginated.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 disabled:opacity-40 cursor-pointer"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Dispatch Broadcast Form */}
        <form
          onSubmit={handleSubmit}
          noValidate
          className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-sm space-y-4 min-w-0"
        >
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <span>📢</span> Dispatch Broadcast
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Send an important update to selected FIXIVA users.
            </p>
          </div>

          {/* Target Audience Dropdown */}
          <div>
            <label className="text-xs font-extrabold text-slate-700 block mb-1">Target Audience</label>
            <select
              value={form.target_role}
              onChange={(e) => {
                setForm({ ...form, target_role: e.target.value });
                if (errors.target_role) setErrors((prev) => ({ ...prev, target_role: null }));
              }}
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-800 focus:outline-none focus:border-primary truncate min-w-0"
            >
              <option value="all">All Users (Customers, Workers, Contractors, Admins)</option>
              <option value="customer">Customers</option>
              <option value="worker">Workers</option>
              <option value="contractor">Contractors</option>
              <option value="admin">Admins</option>
            </select>
          </div>

          {/* Notification Title */}
          <div>
            <label className="text-xs font-extrabold text-slate-700 block mb-1">Notification Title</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => {
                setForm({ ...form, title: e.target.value });
                if (errors.title) setErrors((prev) => ({ ...prev, title: null }));
              }}
              placeholder="e.g. Scheduled Maintenance"
              className={`h-11 w-full rounded-xl border px-3 text-xs font-semibold focus:outline-none transition-colors ${
                errors.title ? 'border-rose-400 bg-rose-50/50' : 'border-slate-200 focus:border-primary'
              }`}
            />
            {errors.title && <p className="text-[11px] font-bold text-rose-600 mt-1">{errors.title}</p>}
          </div>

          {/* Broadcast Message */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-extrabold text-slate-700">Broadcast Message</label>
              <span className="text-[11px] font-bold text-slate-400">
                {form.message.length} / 500
              </span>
            </div>
            <textarea
              value={form.message}
              onChange={(e) => {
                if (e.target.value.length <= 500) {
                  setForm({ ...form, message: e.target.value });
                  if (errors.message) setErrors((prev) => ({ ...prev, message: null }));
                }
              }}
              placeholder="Write your message to FIXIVA users..."
              rows={5}
              className={`w-full min-h-[130px] rounded-xl border p-3 text-xs font-semibold focus:outline-none transition-colors ${
                errors.message ? 'border-rose-400 bg-rose-50/50' : 'border-slate-200 focus:border-primary'
              }`}
            />
            {errors.message && <p className="text-[11px] font-bold text-rose-600 mt-1">{errors.message}</p>}
          </div>

          {/* Send Submit Button */}
          <button
            type="submit"
            disabled={isSending}
            className="w-full py-3.5 px-4 rounded-xl bg-primary text-white text-xs font-black uppercase tracking-wider shadow-md hover:bg-blue-700 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed mt-2"
          >
            {isSending ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Sending...</span>
              </>
            ) : (
              <>
                <Send size={15} />
                <span>📨 Send Broadcast Alert</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default NotificationsPanel;
