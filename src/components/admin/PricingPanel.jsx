import { useState } from 'react';
import { useCms } from '../../context/CmsContext';
import { Tag, Save } from 'lucide-react';

const PricingPanel = () => {
  const { services, updateService, showToast } = useCms();
  const [editingId, setEditingId] = useState(null);
  const [basePrice, setBasePrice] = useState(0);
  const [platformFee, setPlatformFee] = useState(0);

  const handleEdit = (service) => {
    setEditingId(service.id);
    setBasePrice(service.base_price || 0);
    setPlatformFee(service.platform_fee || 0);
  };

  const handleSave = async (serviceId) => {
    const res = await updateService(serviceId, {
      base_price: Number(basePrice || 0),
      platform_fee: Number(platformFee || 0),
    });

    if (!res.error) {
      setEditingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-xl font-black text-slate-900">Service Pricing & Fees</h2>
          <p className="text-sm text-slate-500">Configure base rates, platform commission, and service pricing tiers.</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Active Services</p>
          <p className="mt-1 text-2xl font-black text-slate-900">{services.filter((s) => s.active !== false).length}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Average Base Price</p>
          <p className="mt-1 text-2xl font-black text-slate-900">
            ₹{services.length > 0 ? Math.round(services.reduce((acc, curr) => acc + Number(curr.base_price || 0), 0) / services.length) : 0}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Average Platform Fee</p>
          <p className="mt-1 text-2xl font-black text-slate-900">
            ₹{services.length > 0 ? Math.round(services.reduce((acc, curr) => acc + Number(curr.platform_fee || 0), 0) / services.length) : 0}
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs font-black uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Service Name</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Base Price (₹)</th>
              <th className="px-4 py-3">Platform Fee (₹)</th>
              <th className="px-4 py-3">Total Cost (₹)</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {services.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-400">No services configured.</td>
              </tr>
            ) : (
              services.map((service) => {
                const isEditing = editingId === service.id;
                const total = isEditing
                  ? Number(basePrice || 0) + Number(platformFee || 0)
                  : Number(service.base_price || 0) + Number(service.platform_fee || 0);

                return (
                  <tr key={service.id} className="border-t border-slate-100 hover:bg-slate-50/50">
                    <td className="px-4 py-3 font-bold text-slate-800 flex items-center gap-2">
                      <Tag size={16} className="text-primary" />
                      {service.name || 'Service'}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{service.category || 'General'}</td>
                    <td className="px-4 py-3">
                      {isEditing ? (
                        <input
                          type="number"
                          value={basePrice}
                          onChange={(e) => setBasePrice(e.target.value)}
                          className="h-9 w-24 rounded-lg border border-slate-300 px-2 text-sm font-semibold"
                        />
                      ) : (
                        <span className="font-semibold text-slate-700">₹{service.base_price || 0}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {isEditing ? (
                        <input
                          type="number"
                          value={platformFee}
                          onChange={(e) => setPlatformFee(e.target.value)}
                          className="h-9 w-24 rounded-lg border border-slate-300 px-2 text-sm font-semibold"
                        />
                      ) : (
                        <span className="font-semibold text-slate-700">₹{service.platform_fee || 0}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-black text-slate-900">₹{total}</td>
                    <td className="px-4 py-3 text-right">
                      {isEditing ? (
                        <button
                          onClick={() => handleSave(service.id)}
                          className="inline-flex items-center gap-1 rounded-xl bg-primary px-3 py-1.5 text-xs font-bold text-white shadow-sm"
                        >
                          <Save size={14} /> Save
                        </button>
                      ) : (
                        <button
                          onClick={() => handleEdit(service)}
                          className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
                        >
                          Edit Price
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PricingPanel;
