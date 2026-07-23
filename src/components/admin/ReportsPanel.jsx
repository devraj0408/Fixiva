import { useState } from 'react';
import { useCms } from '../../context/CmsContext';
import { Download } from 'lucide-react';

const ReportsPanel = () => {
  const { bookings, customers, workers, reviews, showToast } = useCms();
  const [reportType, setReportType] = useState('bookings');

  const exportCsv = () => {
    let dataToExport = [];
    let filename = `${reportType}_report.csv`;

    if (reportType === 'bookings') {
      dataToExport = bookings.map((b) => ({
        ID: b.id,
        Customer: b.customer_name || 'Customer',
        Service: b.service_name || 'Service',
        City: b.city || 'City',
        Worker: b.worker_name || 'Unassigned',
        Price: b.total_price || b.price || 0,
        Status: b.status || 'New Request',
        Date: b.created_at || '',
      }));
    } else if (reportType === 'customers') {
      dataToExport = customers.map((c) => ({
        ID: c.id,
        Name: c.name || 'Customer',
        Email: c.email || '',
        Phone: c.phone || '',
        City: c.city || 'Ranchi',
        Status: c.account_status || 'active',
      }));
    } else if (reportType === 'workers') {
      dataToExport = workers.map((w) => ({
        ID: w.id,
        Name: w.name || 'Worker',
        Skills: w.skills || '',
        City: w.city || 'Ranchi',
        TrustScore: w.trustScore ?? 100,
        Status: w.status || 'Verified',
      }));
    }

    if (dataToExport.length === 0) {
      showToast('No records to export.', 'error');
      return;
    }

    const headers = Object.keys(dataToExport[0]).join(',');
    const rows = dataToExport.map((row) => Object.values(row).map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','));
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast(`Exported ${dataToExport.length} ${reportType} records to CSV.`, 'success');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-xl font-black text-slate-900">Operational Reports & Data Exports</h2>
          <p className="text-sm text-slate-500">Generate and export system operational data for business intelligence.</p>
        </div>

        <button
          onClick={exportCsv}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-primary/90"
        >
          <Download size={16} /> Export {reportType.toUpperCase()} CSV
        </button>
      </div>

      <div className="flex gap-3">
        <select
          value={reportType}
          onChange={(e) => setReportType(e.target.value)}
          className="h-10 rounded-xl border border-slate-200 px-3 text-sm font-semibold bg-white"
        >
          <option value="bookings">Bookings Ledger Report</option>
          <option value="customers">Customer Accounts Report</option>
          <option value="workers">Worker Specialists Report</option>
        </select>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Bookings Count</p>
          <p className="mt-1 text-2xl font-black text-slate-900">{bookings.length}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Customers Count</p>
          <p className="mt-1 text-2xl font-black text-slate-900">{customers.length}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Workers Count</p>
          <p className="mt-1 text-2xl font-black text-slate-900">{workers.length}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Reviews Moderated</p>
          <p className="mt-1 text-2xl font-black text-slate-900">{reviews.length}</p>
        </div>
      </div>
    </div>
  );
};

export default ReportsPanel;
