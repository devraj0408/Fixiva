import { useState } from 'react';
import { useCms } from '../../context/CmsContext';
import { Tag, Edit2, Trash2 } from 'lucide-react';

const CategoriesPanel = () => {
  const {
    categories,
    createCategory,
    updateCategory,
    deleteCategory,
    filterItems,
    paginateItems,
    uploadImage,
    showToast,
  } = useCms();

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [editingCategory, setEditingCategory] = useState(null);
  const [form, setForm] = useState({ name: '', icon: 'tag', description: '', display_order: 0, active: true });
  const [uploading, setUploading] = useState(false);

  const filtered = filterItems(categories, search, ['name', 'description']);
  const paginated = paginateItems(filtered, page, 8);

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const { success, url, error } = await uploadImage(file, 'cms-assets', 'categories');
    setUploading(false);

    if (url) {
      setForm((prev) => ({ ...prev, icon: url }));
      if (success) showToast('Category icon uploaded.', 'success');
    } else if (error) {
      showToast('Image upload warning: ' + error, 'error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      showToast('Category name is required.', 'error');
      return;
    }

    if (editingCategory) {
      await updateCategory(editingCategory.id, form);
      setEditingCategory(null);
    } else {
      await createCategory(form);
    }

    setForm({ name: '', icon: 'tag', description: '', display_order: 0, active: true });
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setForm({
      name: category.name || '',
      icon: category.icon || 'tag',
      description: category.description || '',
      display_order: category.display_order || 0,
      active: category.active !== false,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-xl font-black text-slate-900">Categories Management</h2>
          <p className="text-sm text-slate-500">Create and organize service catalog categories.</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4">
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search categories by name or description..."
            className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"
          />

          <div className="space-y-3">
            {paginated.data.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 p-8 text-center text-sm text-slate-500">No categories found.</div>
            ) : (
              paginated.data.map((cat) => (
                <div key={cat.id} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Tag size={20} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{cat.name}</span>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase ${cat.active !== false ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                          {cat.active !== false ? 'Active' : 'Disabled'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">{cat.description || 'No description provided.'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEdit(cat)}
                      className="rounded-xl border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-50"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm(`Delete category "${cat.name}"?`)) {
                          deleteCategory(cat.id);
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
            {editingCategory ? 'Edit Category' : 'Create New Category'}
          </h3>

          <div>
            <label className="text-xs font-bold text-slate-600">Category Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Home Cleaning"
              className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm font-semibold"
              required
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-600">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Category overview..."
              rows={3}
              className="mt-1 w-full rounded-xl border border-slate-200 p-3 text-sm font-semibold"
            />
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
              Active Category
            </label>

            <div className="flex gap-2">
              {editingCategory && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingCategory(null);
                    setForm({ name: '', icon: 'tag', description: '', display_order: 0, active: true });
                  }}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600"
                >
                  Cancel
                </button>
              )}
              <button type="submit" className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white shadow-sm">
                {editingCategory ? 'Update Category' : 'Create Category'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CategoriesPanel;
