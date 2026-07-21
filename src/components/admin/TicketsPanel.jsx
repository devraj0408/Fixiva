import { useMemo, useState } from 'react';
import { useApp } from '../../context/AuthContext';

const TicketsPanel = () => {
  const { tickets, updateTicketStatus } = useApp();
  const [search, setSearch] = useState('');

  const filteredTickets = useMemo(() => {
    return (tickets || []).filter((ticket) => `${ticket.subject || ''} ${ticket.message || ''}`.toLowerCase().includes(search.toLowerCase()));
  }, [tickets, search]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-xl font-black text-slate-900">Support Tickets</h2>
          <p className="text-sm text-slate-500">Resolve customer issues quickly and keep the support queue clean.</p>
        </div>
      </div>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search tickets"
        className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"
      />

      <div className="overflow-hidden rounded-2xl border border-slate-200">
        {filteredTickets.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">No tickets to display.</div>
        ) : (
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-4 py-3">Subject</th>
                <th className="px-4 py-3">Message</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredTickets.map((ticket) => (
                <tr key={ticket.id} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-semibold text-slate-800">{ticket.subject || 'Ticket'}</td>
                  <td className="px-4 py-3 text-slate-600">{ticket.message || '-'}</td>
                  <td className="px-4 py-3 text-slate-600">{ticket.status || 'Open'}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => updateTicketStatus(ticket.id, 'Resolved')} className="rounded-lg bg-primary px-3 py-2 text-xs font-bold text-white">Resolve</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default TicketsPanel;
