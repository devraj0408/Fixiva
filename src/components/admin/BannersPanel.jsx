import { useState } from 'react';
import { useCms } from '../../context/CmsContext';
import { Image, Edit2, Trash2 } from 'lucide-react';

const BannersPanel = () => {
  const {
    banners,
    createBanner,
    updateBanner,
    deleteBanner,
    filterItems,
    paginateItems,
    uploadImage,
    showToast,
  } = useCms();

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [editingBanner, setEditingBanner] = useState(null);
  const [form, setForm] = useState({
    title: '',
    subtitle: '',
    image_url: '',
    link_url: '',
    position: 'home_hero',
    display_order: 0,
    active: true,
  });
  const [uploading, setUploading] = useState(false);

  const filtered = filterItems(banners, search, ['title', 'subtitle', 'position']);
  const paginated = paginateItems(filtered, page, 6);

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const { success, url, error } = await uploadImage(file, 'cms-assets', 'banners');
    setUploading(false);

    if (url) {
      setForm((prev) => ({ ...prev, image_url: url }));
      if (success) showToast('Banner image uploaded.', 'success');
    } else if (error) {
      showToast('Image upload warning: ' + error, 'error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      showToast('Banner title is required.', 'error');
      return;
    }

    if (editingBanner) {
      await updateBanner(editingBanner.id, form);
      setEditingBanner(null);
    } else {
      await createBanner(form);
    }

    setForm({
      title: '',
      subtitle: '',
      image_url: '',
      link_url: '',
      position: 'home_hero',
      display_order: 0,
      active: true,
    });
  };

  const handleEdit = (banner) => {
    setEditingBanner(banner);
    setForm({
      title: banner.title || '',
      subtitle: banner.subtitle || '',
      image_url: banner.image_url || '',
      link_url: banner.link_url || '',
      position: banner.position || 'home_hero',
      display_order: banner.display_order || 0,
      active: banner.active !== false,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-xl font-black text-slate-900">Banners Management</h2>
          <p className="text-sm text-slate-500">Manage promotional banners for Customer Homepage and App Hero slots.</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4">
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search banners by title, subtitle, or position..."
            className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm font-medium"
          />

          <div className="space-y-3">
            {paginated.data.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 p-8 text-center text-sm text-slate-500">No banners found.</div>
            ) : (
              paginated.data.map((banner) => (
                <div key={banner.id} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    {banner.image_url ? (
                      <img src={banner.image_url} alt={banner.title} className="h-12 w-20 rounded-xl object-cover border border-slate-200" />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Image size={20} />
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{banner.title}</span>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase ${banner.active !== false ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                          {banner.active !== false ? 'Active' : 'Disabled'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">{banner.subtitle || banner.position || 'Hero Banner'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button onClick={() => handleEdit(banner)} className="rounded-xl border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-50">
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm(`Delete banner "${banner.title}"?`)) {
                          deleteBanner(banner.id);
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
            {editingBanner ? 'Edit Banner' : 'Create New Banner'}
          </h3>

          <div>
            <label className="text-xs font-bold text-slate-600">Banner Title</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Festival Super Deal"
              className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm font-semibold"
              required
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-600">Subtitle / Offer Headline</label>
            <input
              type="text"
              value={form.subtitle}
              onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
              placeholder="e.g. Flat ₹150 OFF on first service"
              className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm font-semibold"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-600">Banner Image Upload or Image URL</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="mt-1 block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-white hover:file:bg-primary/90"
            />
            {uploading && <p className="text-[11px] text-slate-400 mt-1">Uploading banner image...</p>}
            <input
              type="url"
              value={form.image_url}
              onChange={(e) => setForm({ ...form, image_url: e.target.value })}
              placeholder="Or enter direct Image URL https://..."
              className="mt-2 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm font-semibold"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-600">Target Link URL</label>
            <input
              type="text"
              value={form.link_url}
              onChange={(e) => setForm({ ...form, link_url: e.target.value })}
              placeholder="/services?category=cleaning"
              className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm font-semibold"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <label className="flex items-center gap-2 text-xs font-bold text-slate-700">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => setForm({ ...form, active: e.target.checked })}
                className="h-4 w-4 rounded border-slate-300 text-primary"
              />
              Active Banner
            </label>

            <div className="flex gap-2">
              {editingBanner && (
                <button
                  type="button"
                  onClick={() => { setEditingBanner(null); setForm({ title: '', subtitle: '', image_url: '', link_url: '', position: 'home_hero', display_order: 0, active: true }); }}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600"
                >
                  Cancel
                </button>
              )}
              <button type="submit" className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white shadow-sm">
                {editingBanner ? 'Update Banner' : 'Create Banner'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BannersPanel;
