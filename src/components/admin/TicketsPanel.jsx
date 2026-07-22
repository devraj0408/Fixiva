import { useState } from 'react';
import { useCms } from '../../context/CmsContext';
import { MessageCircle, CheckCircle2, Send } from 'lucide-react';

const TicketsPanel = () => {
  const { tickets, updateTicketStatus, filterItems, paginateItems, showToast } = useCms();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [page, setPage] = useState(1);
  const [activeTicket, setActiveTicket] = useState(null);
  const [replyText, setReplyText] = useState('');

  const filtered = filterItems(tickets, search, ['subject', 'message', 'email', 'name', 'status']).filter((t) => {
    if (statusFilter === 'All') return true;
    return (t.status || 'Open').toLowerCase() === statusFilter.toLowerCase();
  });

  const paginated = paginateItems(filtered, page, 6);

  const handleReplySubmit = async (e) => {
    e.preventDefault();
    if (!activeTicket) return;
    if (!replyText.trim()) {
      showToast('Reply message text is required.', 'error');
      return;
    }

    await updateTicketStatus(activeTicket.id, 'Resolved', replyText.trim());
    setActiveTicket(null);
    setReplyText('');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-xl font-black text-slate-900">Support Desk & User Tickets</h2>
          <p className="text-sm text-slate-500">Resolve customer and worker support tickets, reply to inquiries, and track ticket status.</p>
        </div>
      </div>

      <div className="flex gap-3">
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search tickets by subject, message, or user..."
          className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm font-medium"
        />
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="h-10 rounded-xl border border-slate-200 px-3 text-sm font-semibold bg-white"
        >
          <option value="All">All Statuses</option>
          <option value="Open">Open</option>
          <option value="In Progress">In Progress</option>
          <option value="Resolved">Resolved</option>
          <option value="Closed">Closed</option>
        </select>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-3">
          {paginated.data.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 p-8 text-center text-sm text-slate-500">No support tickets matching filter.</div>
          ) : (
            paginated.data.map((ticket) => (
              <div
                key={ticket.id}
                onClick={() => { setActiveTicket(ticket); setReplyText(ticket.admin_reply || ''); }}
                className={`cursor-pointer rounded-2xl border p-4 shadow-sm transition-all ${activeTicket?.id === ticket.id ? 'border-primary bg-primary/5' : 'border-slate-200 bg-white hover:border-slate-300'}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <MessageCircle size={18} className="text-primary" />
                    <span className="font-bold text-slate-900">{ticket.subject || 'Support Ticket'}</span>
                  </div>
                  <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase ${ticket.status === 'Resolved' ? 'bg-emerald-100 text-emerald-700' : ticket.status === 'In Progress' ? 'bg-sky-100 text-sky-700' : 'bg-amber-100 text-amber-700'}`}>
                    {ticket.status || 'Open'}
                  </span>
                </div>
                <p className="mt-2 text-xs text-slate-600 line-clamp-2">{ticket.message}</p>
              </div>
            ))
          )}

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

        {activeTicket ? (
          <form onSubmit={handleReplySubmit} className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5 space-y-4">
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-500">Ticket Resolution Thread</h3>
            <div className="space-y-1">
              <p className="text-xs font-extrabold text-slate-900">{activeTicket.subject}</p>
              <p className="text-xs text-slate-600 bg-white p-3 rounded-xl border border-slate-200">{activeTicket.message}</p>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-600">Admin Response Message</label>
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Type response to ticket..."
                rows={4}
                className="mt-1 w-full rounded-xl border border-slate-200 p-3 text-sm font-semibold"
                required
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <select
                value={activeTicket.status || 'Open'}
                onChange={(e) => updateTicketStatus(activeTicket.id, e.target.value, replyText)}
                className="h-10 rounded-xl border border-slate-200 px-3 text-xs font-bold bg-white"
              >
                <option value="Open">Open</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
                <option value="Closed">Closed</option>
              </select>

              <button type="submit" className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white shadow-sm">
                <Send size={14} /> Send & Resolve Ticket
              </button>
            </div>
          </form>
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-8 text-center text-xs font-bold text-slate-400">
            Select a ticket from the list to view message thread and reply.
          </div>
        )}
      </div>
    </div>
  );
};

export default TicketsPanel;
