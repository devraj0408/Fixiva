import { useState } from 'react';
import { useCms } from '../../context/CmsContext';
import { Tag, Plus, Edit2, Trash2 } from 'lucide-react';

const OffersPanel = () => {
  const {
    offers,
    createOffer,
    updateOffer,
    deleteOffer,
    filterItems,
    paginateItems,
    uploadImage,
    showToast,
  } = useCms();

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [editingOffer, setEditingOffer] = useState(null);
  const [form, setForm] = useState({
    title: '',
    badge: 'HOT DEAL',
    description: '',
    image_url: '',
    active: true,
  });
  const [uploading, setUploading] = useState(false);

  const filtered = filterItems(offers, search, ['title', 'badge', 'description']);
  const paginated = paginateItems(filtered, page, 6);

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const { success, url, error } = await uploadImage(file, 'cms-assets', 'offers');
    setUploading(false);

    if (url) {
      setForm((prev) => ({ ...prev, image_url: url }));
      if (success) showToast('Offer image uploaded.', 'success');
    } else if (error) {
      showToast('Image upload warning: ' + error, 'error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      showToast('Offer title is required.', 'error');
      return;
    }

    if (editingOffer) {
      await updateOffer(editingOffer.id, form);
      setEditingOffer(null);
    } else {
      await createOffer(form);
    }

    setForm({ title: '', badge: 'HOT DEAL', description: '', image_url: '', active: true });
  };

  const handleEdit = (offer) => {
    setEditingOffer(offer);
    setForm({
      title: offer.title || '',
      badge: offer.badge || 'HOT DEAL',
      description: offer.description || '',
      image_url: offer.image_url || '',
      active: offer.active !== false,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-xl font-black text-slate-900">Promotional Offers Management</h2>
          <p className="text-sm text-slate-500">Manage special deal badges and promotional highlights across the app.</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4">
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search offers by title or badge..."
            className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm font-medium"
          />

          <div className="space-y-3">
            {paginated.data.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 p-8 text-center text-sm text-slate-500">No active offers found.</div>
            ) : (
              paginated.data.map((offer) => (
                <div key={offer.id} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                      <Tag size={20} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{offer.title}</span>
                        <span className="rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-extrabold text-amber-700 uppercase">
                          {offer.badge || 'PROMO'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">{offer.description || 'No description provided.'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button onClick={() => handleEdit(offer)} className="rounded-xl border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-50">
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm(`Delete offer "${offer.title}"?`)) {
                          deleteOffer(offer.id);
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
            {editingOffer ? 'Edit Offer' : 'Create New Offer'}
          </h3>

          <div>
            <label className="text-xs font-bold text-slate-600">Offer Title</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Monsoon Special Plumbing Discount"
              className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm font-semibold"
              required
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-600">Badge Text</label>
            <input
              type="text"
              value={form.badge}
              onChange={(e) => setForm({ ...form, badge: e.target.value })}
              placeholder="e.g. 20% OFF or LIMITED TIME"
              className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm font-semibold"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-600">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Offer details and terms..."
              rows={3}
              className="mt-1 w-full rounded-xl border border-slate-200 p-3 text-sm font-semibold"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-600">Offer Image Upload or URL</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="mt-1 block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-white hover:file:bg-primary/90"
            />
            {uploading && <p className="text-[11px] text-slate-400 mt-1">Uploading image...</p>}
          </div>

          <div className="flex items-center justify-between pt-2">
            <label className="flex items-center gap-2 text-xs font-bold text-slate-700">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => setForm({ ...form, active: e.target.checked })}
                className="h-4 w-4 rounded border-slate-300 text-primary"
              />
              Active Offer
            </label>

            <div className="flex gap-2">
              {editingOffer && (
                <button
                  type="button"
                  onClick={() => { setEditingOffer(null); setForm({ title: '', badge: 'HOT DEAL', description: '', image_url: '', active: true }); }}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600"
                >
                  Cancel
                </button>
              )}
              <button type="submit" className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white shadow-sm">
                {editingOffer ? 'Update Offer' : 'Create Offer'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OffersPanel;
