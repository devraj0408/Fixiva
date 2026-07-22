import { useMemo, useState } from 'react';
import { useApp } from '../../context/AuthContext';

const ServicesPanel = () => {
  const { services, deleteService, createService, showToast } = useApp();
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ name: '', category: '', description: '', base_price: '', platform_fee: '' });

  const filteredServices = useMemo(() => {
    return (services || []).filter((service) => {
      const text = `${service.name || ''} ${service.category || ''}`.toLowerCase();
      return text.includes(search.toLowerCase());
    });
  }, [services, search]);

  const submitService = async (e) => {
    e.preventDefault();
    await createService({
      name: form.name,
      category: form.category,
      description: form.description,
      base_price: Number(form.base_price || 0),
      platform_fee: Number(form.platform_fee || 0),
    });
    setForm({ name: '', category: '', description: '', base_price: '', platform_fee: '' });
    showToast('Service created.', 'success');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-xl font-black text-slate-900">Services Management</h2>
          <p className="text-sm text-slate-500">Create and maintain the service catalog.</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-2xl border border-slate-200 p-4">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search services"
            className="mb-4 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"
          />
          <div className="space-y-3">
            {filteredServices.length === 0 ? (
              <p className="text-sm text-slate-500">No services available.</p>
            ) : (
              filteredServices.map((service) => (
                <div key={service.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-800">{service.name || 'Service'}</p>
                      <p className="text-xs text-slate-500">{service.category || '-'} • ₹{service.base_price || 0}</p>
                    </div>
                    <button onClick={() => deleteService(service.id)} className="rounded-lg bg-red-50 px-3 py-2 text-xs font-bold text-red-700">Delete</button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <form onSubmit={submitService} className="rounded-2xl border border-slate-200 p-4 space-y-3">
          <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-500">Create Service</h3>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Service name" className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm" required />
          <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Category" className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm" />
          <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description" className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm" />
          <div className="flex gap-3">
            <input type="number" value={form.base_price} onChange={(e) => setForm({ ...form, base_price: e.target.value })} placeholder="Base price" className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm" />
            <input type="number" value={form.platform_fee} onChange={(e) => setForm({ ...form, platform_fee: e.target.value })} placeholder="Platform fee" className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm" />
          </div>
          <button type="submit" className="h-10 w-full rounded-xl bg-primary px-3 text-sm font-bold text-white">Create Service</button>
        </form>
      </div>
    </div>
  );
};

export default ServicesPanel;
