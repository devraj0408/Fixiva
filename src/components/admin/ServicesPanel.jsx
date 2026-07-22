import { useState } from 'react';
import { useCms } from '../../context/CmsContext';
import { Wrench, Edit2, Trash2 } from 'lucide-react';

const ServicesPanel = () => {
  const {
    services,
    categories,
    createService,
    updateService,
    deleteService,
    toggleServiceActive,
    filterItems,
    paginateItems,
    uploadImage,
    showToast,
  } = useCms();

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [page, setPage] = useState(1);
  const [editingService, setEditingService] = useState(null);
  const [form, setForm] = useState({
    name: '',
    category: '',
    description: '',
    base_price: '',
    platform_fee: '',
    inspection_fee: '',
    icon: 'wrench',
    active: true,
  });
  const [uploading, setUploading] = useState(false);

  const filtered = filterItems(services, search, ['name', 'category', 'description']).filter((item) => {
    if (selectedCategory === 'All') return true;
    return (item.category || 'General').toLowerCase() === selectedCategory.toLowerCase();
  });

  const paginated = paginateItems(filtered, page, 6);

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const { success, url, error } = await uploadImage(file, 'cms-assets', 'services');
    setUploading(false);

    if (url) {
      setForm((prev) => ({ ...prev, icon: url }));
      if (success) showToast('Service icon uploaded.', 'success');
    } else if (error) {
      showToast('Image upload warning: ' + error, 'error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      showToast('Service name is required.', 'error');
      return;
    }

    if (editingService) {
      await updateService(editingService.id, form);
      setEditingService(null);
    } else {
      await createService(form);
    }

    setForm({
      name: '',
      category: '',
      description: '',
      base_price: '',
      platform_fee: '',
      inspection_fee: '',
      icon: 'wrench',
      active: true,
    });
  };

  const handleEdit = (service) => {
    setEditingService(service);
    setForm({
      name: service.name || '',
      category: service.category || '',
      description: service.description || '',
      base_price: service.base_price || 0,
      platform_fee: service.platform_fee || 0,
      inspection_fee: service.inspection_fee || 0,
      icon: service.icon || 'wrench',
      active: service.active !== false,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-xl font-black text-slate-900">Services Catalog</h2>
          <p className="text-sm text-slate-500">Manage service pricing, categories, and availability.</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4">
          <div className="flex gap-3">
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search services..."
              className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm font-medium"
            />
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setPage(1);
              }}
              className="h-10 rounded-xl border border-slate-200 px-3 text-sm font-semibold bg-white"
            >
              <option value="All">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id || cat.name} value={cat.name}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-3">
            {paginated.data.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 p-8 text-center text-sm text-slate-500">No services found.</div>
            ) : (
              paginated.data.map((service) => (
                <div key={service.id} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Wrench size={20} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{service.name}</span>
                        <button
                          onClick={() => toggleServiceActive(service.id, service.active === false)}
                          className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase ${service.active !== false ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}
                        >
                          {service.active !== false ? 'Active' : 'Disabled'}
                        </button>
                      </div>
                      <p className="text-xs text-slate-500">
                        {service.category || 'General'} • Base: ₹{service.base_price || 0} • Fee: ₹{service.platform_fee || 0}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEdit(service)}
                      className="rounded-xl border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-50"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={async (e) => {
                        e.stopPropagation();
                        console.log('[ServicesPanel.onClick] Delete button triggered for Service ID:', service.id, 'Name:', service.name);
                        if (
                          window.confirm(
                            `Delete service "${service.name}"?\n\nNote: If this service has existing bookings, pricing rules, or related records, it will be archived (disabled) instead of permanently deleted to preserve business history.\n\nContinue?`
                          )
                        ) {
                          console.log('[ServicesPanel.onClick] User confirmed delete. Invoking deleteService...');
                          const result = await deleteService(service.id);
                          console.log('[ServicesPanel.onClick] deleteService finished with result:', result);
                        } else {
                          console.log('[ServicesPanel.onClick] User cancelled delete dialog.');
                        }
                      }}
                      className="rounded-xl bg-red-50 p-2 text-red-600 hover:bg-red-100"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {paginated.totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-slate-500 font-semibold">
                Page {paginated.currentPage} of {paginated.totalPages} ({paginated.total} items)
              </span>
              <div className="flex gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  disabled={page >= paginated.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5 space-y-4">
          <h3 className="text-sm font-black uppercase tracking-wider text-slate-500">
            {editingService ? 'Edit Service' : 'Create New Service'}
          </h3>

          <div>
            <label className="text-xs font-bold text-slate-600">Service Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. AC Installation"
              className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm font-semibold"
              required
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-600">Category</label>
            <input
              type="text"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              placeholder="e.g. Home Services"
              className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm font-semibold"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-600">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Service details..."
              rows={2}
              className="mt-1 w-full rounded-xl border border-slate-200 p-3 text-sm font-semibold"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-600">Base Price (₹)</label>
              <input
                type="number"
                value={form.base_price}
                onChange={(e) => setForm({ ...form, base_price: e.target.value })}
                placeholder="499"
                className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm font-semibold"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600">Platform Fee (₹)</label>
              <input
                type="number"
                value={form.platform_fee}
                onChange={(e) => setForm({ ...form, platform_fee: e.target.value })}
                placeholder="49"
                className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm font-semibold"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-600">Icon / Image Upload</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="mt-1 block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-white hover:file:bg-primary/90"
            />
            {uploading && <p className="text-[11px] text-slate-400 mt-1">Uploading image to storage...</p>}
          </div>

          <div className="flex items-center justify-between pt-2">
            <label className="flex items-center gap-2 text-xs font-bold text-slate-700">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => setForm({ ...form, active: e.target.checked })}
                className="h-4 w-4 rounded border-slate-300 text-primary"
              />
              Active Service
            </label>

            <div className="flex gap-2">
              {editingService && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingService(null);
                    setForm({
                      name: '',
                      category: '',
                      description: '',
                      base_price: '',
                      platform_fee: '',
                      inspection_fee: '',
                      icon: 'wrench',
                      active: true,
                    });
                  }}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600"
                >
                  Cancel
                </button>
              )}
              <button type="submit" className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white shadow-sm">
                {editingService ? 'Update Service' : 'Create Service'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ServicesPanel;
