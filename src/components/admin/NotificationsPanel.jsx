import { useState } from 'react';
import { useCms } from '../../context/CmsContext';
import { Bell, Send, Trash2 } from 'lucide-react';

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
  const [form, setForm] = useState({ title: '', message: '', target_role: 'all' });

  const filtered = filterItems(notifications, search, ['title', 'message', 'target_role']);
  const paginated = paginateItems(filtered, page, 6);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.message.trim()) {
      showToast('Notification title and message are required.', 'error');
      return;
    }

    await createBroadcastNotification(form);
    setForm({ title: '', message: '', target_role: 'all' });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-xl font-black text-slate-900">Broadcast Notifications Center</h2>
          <p className="text-sm text-slate-500">Dispatch system announcements and broadcast alerts to app user roles.</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4">
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search notifications log..."
            className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm font-medium"
          />

          <div className="space-y-3">
            {paginated.data.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 p-8 text-center text-sm text-slate-500">No dispatched notifications found.</div>
            ) : (
              paginated.data.map((notif) => (
                <div key={notif.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Bell size={18} className="text-primary" />
                      <span className="font-bold text-slate-900">{notif.title}</span>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-extrabold uppercase text-slate-600">
                        Target: {notif.target_role || 'all'}
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        if (window.confirm('Delete this notification log entry?')) {
                          deleteNotification(notif.id);
                        }
                      }}
                      className="rounded-xl bg-red-50 p-2 text-red-600 hover:bg-red-100"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl">{notif.message}</p>
                </div>
              ))
            )}
          </div>

          {paginated.totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-slate-500 font-semibold">Page {paginated.currentPage} of {paginated.totalPages}</span>
              <div className="flex gap-2">
                <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold disabled:opacity-50">Previous</button>
                <button disabled={page >= paginated.totalPages} onClick={() => setPage((p) => p + 1)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold disabled:opacity-50">Next</button>
              </div>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5 space-y-4">
          <h3 className="text-sm font-black uppercase tracking-wider text-slate-500">
            Dispatch Broadcast Notification
          </h3>

          <div>
            <label className="text-xs font-bold text-slate-600">Target Role Audience</label>
            <select
              value={form.target_role}
              onChange={(e) => setForm({ ...form, target_role: e.target.value })}
              className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm font-semibold bg-white"
            >
              <option value="all">All Users (Customers, Workers, Contractors)</option>
              <option value="customer">Customers Only</option>
              <option value="worker">Workers Only</option>
              <option value="contractor">Contractors Only</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-600">Notification Title</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Platform Maintenance Notice"
              className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm font-semibold"
              required
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-600">Broadcast Message</label>
            <textarea
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              placeholder="Write broadcast text..."
              rows={4}
              className="mt-1 w-full rounded-xl border border-slate-200 p-3 text-sm font-semibold"
              required
            />
          </div>

          <button type="submit" className="flex items-center justify-center gap-2 h-10 w-full rounded-xl bg-primary px-4 text-xs font-bold text-white shadow-sm">
            <Send size={14} /> Send Broadcast Alert
          </button>
        </form>
      </div>
    </div>
  );
};

export default NotificationsPanel;
