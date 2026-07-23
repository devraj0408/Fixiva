import { useState } from 'react';
import { useCms } from '../../context/CmsContext';
import { MapPin, Edit2, Trash2 } from 'lucide-react';

const AreasPanel = () => {
  const {
    areas,
    cities,
    createArea,
    updateArea,
    deleteArea,
    filterItems,
    paginateItems,
    showToast,
  } = useCms();

  const [search, setSearch] = useState('');
  const [selectedCityId, setSelectedCityId] = useState('All');
  const [page, setPage] = useState(1);
  const [editingArea, setEditingArea] = useState(null);
  const [form, setForm] = useState({ name: '', city_id: '', pincode: '', status: 'Active' });

  const filtered = filterItems(areas, search, ['name', 'pincode']).filter((item) => {
    if (selectedCityId === 'All') return true;
    return String(item.city_id) === String(selectedCityId);
  });

  const paginated = paginateItems(filtered, page, 8);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      showToast('Area locality name is required.', 'error');
      return;
    }

    if (editingArea) {
      await updateArea(editingArea.id, form);
      setEditingArea(null);
    } else {
      await createArea(form);
    }

    setForm({ name: '', city_id: cities[0]?.id || '', pincode: '', status: 'Active' });
  };

  const handleEdit = (area) => {
    setEditingArea(area);
    setForm({
      name: area.name || '',
      city_id: area.city_id || '',
      pincode: area.pincode || '',
      status: area.status || 'Active',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-xl font-black text-slate-900">Area Localities Management</h2>
          <p className="text-sm text-slate-500">Manage pincodes and service coverage areas within cities.</p>
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
              placeholder="Search area by locality name or pincode..."
              className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"
            />
            <select
              value={selectedCityId}
              onChange={(e) => {
                setSelectedCityId(e.target.value);
                setPage(1);
              }}
              className="h-10 rounded-xl border border-slate-200 px-3 text-sm font-semibold bg-white"
            >
              <option value="All">All Cities</option>
              {cities.map((city) => (
                <option key={city.id} value={city.id}>
                  {city.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-3">
            {paginated.data.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 p-8 text-center text-sm text-slate-500">
                No area localities found for the selected filter.
              </div>
            ) : (
              paginated.data.map((area) => {
                const matchedCity = cities.find((c) => String(c.id) === String(area.city_id));
                return (
                  <div key={area.id || area.name} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <MapPin size={20} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{area.name}</span>
                          {area.pincode && (
                            <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                              {area.pincode}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500">City: {matchedCity?.name || 'Unmapped'}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(area)}
                        className="rounded-xl border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-50"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm(`Remove locality "${area.name}"?`)) {
                            deleteArea(area.id);
                          }
                        }}
                        className="rounded-xl bg-red-50 p-2 text-red-600 hover:bg-red-100"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                );
              })
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
            {editingArea ? 'Edit Locality' : 'Add New Locality'}
          </h3>

          <div>
            <label className="text-xs font-bold text-slate-600">Locality / Area Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Kanke Road"
              className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm font-semibold"
              required
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-600">City Mapping</label>
            <select
              value={form.city_id}
              onChange={(e) => setForm({ ...form, city_id: e.target.value })}
              className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm font-semibold bg-white"
            >
              <option value="">Select City</option>
              {cities.map((city) => (
                <option key={city.id} value={city.id}>
                  {city.name} ({city.region})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-600">Pincode (Optional)</label>
            <input
              type="text"
              value={form.pincode}
              onChange={(e) => setForm({ ...form, pincode: e.target.value })}
              placeholder="e.g. 834008"
              className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm font-semibold"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            {editingArea && (
              <button
                type="button"
                onClick={() => {
                  setEditingArea(null);
                  setForm({ name: '', city_id: '', pincode: '', status: 'Active' });
                }}
                className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600"
              >
                Cancel
              </button>
            )}
            <button type="submit" className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white shadow-sm">
              {editingArea ? 'Update Locality' : 'Add Locality'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AreasPanel;
