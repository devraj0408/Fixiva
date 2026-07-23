import { useState } from 'react';
import { useCms } from '../../context/CmsContext';
import { MapPin, Edit2, Trash2 } from 'lucide-react';

const CoveragePanel = () => {
  const {
    cities,
    createCity,
    updateCity,
    deleteCity,
    coverageRequests,
    filterItems,
    paginateItems,
    showToast,
  } = useCms();

  const [activeTab, setActiveTab] = useState('cities');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [editingCity, setEditingCity] = useState(null);
  const [form, setForm] = useState({ name: '', region: '', status: 'Live' });

  const filteredCities = filterItems(cities, search, ['name', 'region', 'status']);
  const paginatedCities = paginateItems(filteredCities, page, 8);

  const filteredRequests = filterItems(coverageRequests, search, ['city', 'state', 'email']);
  const paginatedRequests = paginateItems(filteredRequests, page, 8);

  const handleSubmitCity = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      showToast('City name is required.', 'error');
      return;
    }

    if (editingCity) {
      await updateCity(editingCity.id, form);
      setEditingCity(null);
    } else {
      await createCity(form);
    }

    setForm({ name: '', region: '', status: 'Live' });
  };

  const handleEditCity = (city) => {
    setEditingCity(city);
    setForm({
      name: city.name || '',
      region: city.region || '',
      status: city.status || 'Live',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-xl font-black text-slate-900">Cities & Coverage Management</h2>
          <p className="text-sm text-slate-500">Manage operational cities and review customer coverage requests.</p>
        </div>

        <div className="flex gap-2 rounded-xl bg-slate-100 p-1">
          <button
            onClick={() => { setActiveTab('cities'); setPage(1); }}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${activeTab === 'cities' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
          >
            Cities ({cities.length})
          </button>
          <button
            onClick={() => { setActiveTab('requests'); setPage(1); }}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${activeTab === 'requests' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
          >
            Requests ({coverageRequests.length})
          </button>
        </div>
      </div>

      <input
        value={search}
        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        placeholder={activeTab === 'cities' ? "Search cities by name or region..." : "Search request by city or email..."}
        className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm font-medium"
      />

      {activeTab === 'cities' ? (
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-3">
            {paginatedCities.data.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 p-8 text-center text-sm text-slate-500">No cities found.</div>
            ) : (
              paginatedCities.data.map((city) => (
                <div key={city.id} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <MapPin size={20} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{city.name}</span>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase ${city.status === 'Live' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                          {city.status || 'Live'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">Region: {city.region || 'Jharkhand'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEditCity(city)}
                      className="rounded-xl border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-50"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm(`Delete city "${city.name}"?`)) {
                          deleteCity(city.id);
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

            {paginatedCities.totalPages > 1 && (
              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-slate-500 font-semibold">Page {paginatedCities.currentPage} of {paginatedCities.totalPages}</span>
                <div className="flex gap-2">
                  <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold disabled:opacity-50">Previous</button>
                  <button disabled={page >= paginatedCities.totalPages} onClick={() => setPage((p) => p + 1)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold disabled:opacity-50">Next</button>
                </div>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmitCity} className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5 space-y-4">
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-500">
              {editingCity ? 'Edit City' : 'Add New City'}
            </h3>

            <div>
              <label className="text-xs font-bold text-slate-600">City Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Ranchi"
                className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm font-semibold"
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-600">State / Region</label>
              <input
                type="text"
                value={form.region}
                onChange={(e) => setForm({ ...form, region: e.target.value })}
                placeholder="e.g. Jharkhand"
                className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm font-semibold"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-600">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm font-semibold bg-white"
              >
                <option value="Live">Live</option>
                <option value="Coming Soon">Coming Soon</option>
                <option value="Disabled">Disabled</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              {editingCity && (
                <button
                  type="button"
                  onClick={() => { setEditingCity(null); setForm({ name: '', region: '', status: 'Live' }); }}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600"
                >
                  Cancel
                </button>
              )}
              <button type="submit" className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white shadow-sm">
                {editingCity ? 'Update City' : 'Add City'}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          {paginatedRequests.data.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500">No coverage requests matching filter.</div>
          ) : (
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-4 py-3">City</th>
                  <th className="px-4 py-3">State</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {paginatedRequests.data.map((req) => (
                  <tr key={req.id} className="border-t border-slate-100">
                    <td className="px-4 py-3 font-semibold text-slate-800">{req.city}</td>
                    <td className="px-4 py-3 text-slate-600">{req.state}</td>
                    <td className="px-4 py-3 text-slate-600">{req.email}</td>
                    <td className="px-4 py-3 font-bold text-amber-600">{req.status || 'Pending'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
};

export default CoveragePanel;
