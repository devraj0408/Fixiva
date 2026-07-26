import { useState, useMemo } from 'react';
import { useCms } from '../../context/CmsContext';
import { MapPin, Edit2, Trash2, Plus, Search, Check, CheckSquare, Square, X, Layers, Building } from 'lucide-react';

const CoveragePanel = () => {
  const {
    cities,
    services,
    cityControl,
    toggleServiceInCity,
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

  // Modals state
  const [isCityModalOpen, setIsCityModalOpen] = useState(false);
  const [editingCity, setEditingCity] = useState(null);
  const [cityForm, setCityForm] = useState({ name: '', region: '', status: 'Live' });

  // Manage Services Modal state
  const [managingServicesCity, setManagingServicesCity] = useState(null);
  const [selectedServiceIds, setSelectedServiceIds] = useState([]);
  const [savingServices, setSavingServices] = useState(false);

  // Calculate active services count per city
  const getActiveServicesCount = (cityId) => {
    if (!cityControl || !cityControl[cityId]) {
      // Default: if no override, check if cityId is 1..5 or default
      if ([1, 2, 3, 4, 5].includes(cityId)) return services.length;
      return 0;
    }
    const mapping = cityControl[cityId];
    return Object.values(mapping).filter(Boolean).length;
  };

  // Filtered Cities
  const filteredCities = useMemo(() => {
    return filterItems(cities, search, ['name', 'region', 'status']);
  }, [cities, search, filterItems]);

  const paginatedCities = paginateItems(filteredCities, page, 10);

  // Filtered Coverage Requests
  const filteredRequests = useMemo(() => {
    return filterItems(coverageRequests, search, ['city', 'state', 'email']);
  }, [coverageRequests, search, filterItems]);

  const paginatedRequests = paginateItems(filteredRequests, page, 10);

  // Handle City Form Submit (Create / Edit)
  const handleSubmitCity = async (e) => {
    e.preventDefault();
    if (!cityForm.name.trim()) {
      showToast('City name is required.', 'error');
      return;
    }

    const payload = {
      name: cityForm.name.trim(),
      region: cityForm.region.trim() || 'Jharkhand',
      status: cityForm.status || 'Live',
    };

    if (editingCity) {
      await updateCity(editingCity.id, payload);
      showToast(`City "${payload.name}" updated successfully.`, 'success');
    } else {
      await createCity(payload);
      showToast(`New city "${payload.name}" added!`, 'success');
    }

    setIsCityModalOpen(false);
    setEditingCity(null);
    setCityForm({ name: '', region: '', status: 'Live' });
  };

  const handleOpenEditCity = (city) => {
    setEditingCity(city);
    setCityForm({
      name: city.name || '',
      region: city.region || '',
      status: city.status || 'Live',
    });
    setIsCityModalOpen(true);
  };

  // Open Manage Services Checklist Modal
  const handleOpenManageServices = (city) => {
    setManagingServicesCity(city);
    // Initialize checked service IDs for this city
    const mapping = cityControl && cityControl[city.id] ? cityControl[city.id] : {};
    const enabledIds = services.filter((s) => {
      if (mapping[s.id] !== undefined) return mapping[s.id] === true;
      // Default: enabled for cities 1..5
      return [1, 2, 3, 4, 5].includes(city.id);
    }).map((s) => s.id);

    setSelectedServiceIds(enabledIds);
  };

  // Toggle single service in checklist
  const toggleServiceCheck = (serviceId) => {
    if (selectedServiceIds.includes(serviceId)) {
      setSelectedServiceIds(selectedServiceIds.filter((id) => id !== serviceId));
    } else {
      setSelectedServiceIds([...selectedServiceIds, serviceId]);
    }
  };

  // Save Service Checklist for City
  const handleSaveCityServices = async () => {
    if (!managingServicesCity) return;
    setSavingServices(true);

    const cityId = managingServicesCity.id;
    const promises = services.map((service) => {
      const enabled = selectedServiceIds.includes(service.id);
      return toggleServiceInCity(cityId, service.id, enabled);
    });

    await Promise.all(promises);
    setSavingServices(false);
    showToast(`Updated available services for ${managingServicesCity.name}!`, 'success');
    setManagingServicesCity(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-xl font-black text-slate-900">Cities & Coverage Management</h2>
          <p className="text-sm text-slate-500">Manage operational cities, service availability checklists, and coverage requests.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex gap-1 rounded-2xl bg-slate-100 p-1">
            <button
              onClick={() => { setActiveTab('cities'); setPage(1); }}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-extrabold transition-all ${
                activeTab === 'cities' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Cities ({cities.length})
            </button>
            <button
              onClick={() => { setActiveTab('requests'); setPage(1); }}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-extrabold transition-all ${
                activeTab === 'requests' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Requests ({coverageRequests.length})
            </button>
          </div>

          {activeTab === 'cities' && (
            <button
              onClick={() => {
                setEditingCity(null);
                setCityForm({ name: '', region: '', status: 'Live' });
                setIsCityModalOpen(true);
              }}
              className="flex items-center gap-2 rounded-2xl bg-primary px-4 py-2 text-xs font-extrabold text-white shadow-sm hover:bg-blue-700 transition-all"
            >
              <Plus size={16} /> Add City
            </button>
          )}
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder={activeTab === 'cities' ? "Search operational cities by name, state, or status..." : "Search coverage requests by city, state, or email..."}
          className="h-11 w-full rounded-2xl border border-slate-200 bg-white pl-10 pr-4 text-xs font-semibold placeholder-slate-400 focus:border-primary outline-none"
        />
      </div>

      {/* Cities Tab */}
      {activeTab === 'cities' ? (
        <div className="space-y-4">
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            {paginatedCities.data.length === 0 ? (
              <div className="p-12 text-center text-sm font-semibold text-slate-500">
                No operational cities matching search criteria.
              </div>
            ) : (
              <table className="min-w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-extrabold uppercase tracking-wider border-b border-slate-100">
                  <tr>
                    <th className="px-5 py-3.5">City Name</th>
                    <th className="px-5 py-3.5">State / Region</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5">Active Services</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                  {paginatedCities.data.map((city) => {
                    const activeServicesCount = getActiveServicesCount(city.id);
                    return (
                      <tr key={city.id} className="hover:bg-slate-50/60 transition-all">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary font-black">
                              <MapPin size={18} />
                            </div>
                            <span className="font-extrabold text-slate-900 text-sm">{city.name}</span>
                          </div>
                        </td>

                        <td className="px-5 py-4 font-bold text-slate-600">
                          {city.region || 'Jharkhand'}
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${
                              city.status === 'Live'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : city.status === 'Coming Soon'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-slate-100 text-slate-600 border border-slate-200'
                            }`}
                          >
                            {city.status || 'Live'}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <button
                            onClick={() => handleOpenManageServices(city)}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-blue-50 text-primary font-extrabold text-xs hover:bg-blue-100 transition-all"
                          >
                            <Layers size={13} /> {activeServicesCount} Active Services
                          </button>
                        </td>

                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleOpenManageServices(city)}
                              className="rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-extrabold text-white hover:bg-primary transition-all"
                              title="Manage Available Services Checklist"
                            >
                              Manage Services
                            </button>
                            <button
                              onClick={() => handleOpenEditCity(city)}
                              className="rounded-xl border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-50 transition-all"
                              title="Edit City Details"
                            >
                              <Edit2 size={15} />
                            </button>
                            <button
                              onClick={() => {
                                if (window.confirm(`Delete city "${city.name}"?`)) {
                                  deleteCity(city.id);
                                  showToast(`City "${city.name}" deleted.`, 'info');
                                }
                              }}
                              className="rounded-xl bg-red-50 p-2 text-red-600 hover:bg-red-100 transition-all"
                              title="Delete City"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          {paginatedCities.totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-slate-500 font-semibold">
                Page {paginatedCities.currentPage} of {paginatedCities.totalPages} ({filteredCities.length} total cities)
              </span>
              <div className="flex gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="rounded-xl border border-slate-200 px-3.5 py-1.5 text-xs font-bold disabled:opacity-50 hover:bg-slate-50"
                >
                  Previous
                </button>
                <button
                  disabled={page >= paginatedCities.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="rounded-xl border border-slate-200 px-3.5 py-1.5 text-xs font-bold disabled:opacity-50 hover:bg-slate-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Coverage Requests Tab */
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          {paginatedRequests.data.length === 0 ? (
            <div className="p-12 text-center text-sm font-semibold text-slate-500">
              No customer coverage requests matching search filter.
            </div>
          ) : (
            <table className="min-w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-extrabold uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3.5">Requested City</th>
                  <th className="px-5 py-3.5">State</th>
                  <th className="px-5 py-3.5">Customer Email</th>
                  <th className="px-5 py-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                {paginatedRequests.data.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50/60 transition-all">
                    <td className="px-5 py-4 font-extrabold text-slate-900">{req.city}</td>
                    <td className="px-5 py-4 text-slate-600">{req.state}</td>
                    <td className="px-5 py-4 text-slate-600">{req.email}</td>
                    <td className="px-5 py-4">
                      <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 font-black text-[10px] uppercase border border-amber-200">
                        {req.status || 'Pending'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Manage Available Services Checklist Modal */}
      {managingServicesCity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-slate-200 shadow-2xl space-y-6 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-black text-primary uppercase tracking-wider block">Service Availability Manager</span>
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2 mt-0.5">
                  <MapPin size={20} className="text-primary" /> {managingServicesCity.name}
                </h3>
              </div>
              <button
                onClick={() => setManagingServicesCity(null)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs">
                <span className="font-extrabold text-slate-800">Available Services Checklist</span>
                <div className="flex gap-3 text-[11px] font-extrabold">
                  <button
                    onClick={() => setSelectedServiceIds(services.map((s) => s.id))}
                    className="text-primary hover:underline"
                  >
                    Select All
                  </button>
                  <button
                    onClick={() => setSelectedServiceIds([])}
                    className="text-slate-400 hover:underline"
                  >
                    Deselect All
                  </button>
                </div>
              </div>

              {/* Service Checklist Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-72 overflow-y-auto pr-1">
                {services.map((svc) => {
                  const isChecked = selectedServiceIds.includes(svc.id);
                  return (
                    <div
                      key={svc.id}
                      onClick={() => toggleServiceCheck(svc.id)}
                      className={`p-3 rounded-2xl border cursor-pointer flex items-center justify-between transition-all ${
                        isChecked
                          ? 'border-emerald-300 bg-emerald-50/50 text-emerald-950 font-bold'
                          : 'border-slate-200 bg-slate-50/50 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <span className="text-xs font-extrabold">{svc.name}</span>
                      {isChecked ? (
                        <CheckSquare size={18} className="text-emerald-600 shrink-0" />
                      ) : (
                        <Square size={18} className="text-slate-300 shrink-0" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setManagingServicesCity(null)}
                className="rounded-2xl border border-slate-200 px-4 py-2.5 text-xs font-extrabold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveCityServices}
                disabled={savingServices}
                className="rounded-2xl bg-primary px-6 py-2.5 text-xs font-extrabold text-white shadow-sm hover:bg-blue-700 transition-all"
              >
                {savingServices ? 'Saving Availability...' : 'Save Availability'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit City Modal */}
      {isCityModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-slate-200 shadow-2xl space-y-6 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-lg font-black text-slate-900">
                {editingCity ? `Edit City: ${editingCity.name}` : 'Add New Operational City'}
              </h3>
              <button
                onClick={() => setIsCityModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitCity} className="space-y-4 text-xs font-semibold">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">City Name</label>
                <input
                  type="text"
                  value={cityForm.name}
                  onChange={(e) => setCityForm({ ...cityForm, name: e.target.value })}
                  placeholder="e.g. Noida, Ranchi"
                  className="w-full h-11 px-4 bg-slate-50 border border-slate-200 focus:border-primary rounded-2xl text-slate-800 outline-none"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">State / Region</label>
                <input
                  type="text"
                  value={cityForm.region}
                  onChange={(e) => setCityForm({ ...cityForm, region: e.target.value })}
                  placeholder="e.g. Uttar Pradesh, Jharkhand"
                  className="w-full h-11 px-4 bg-slate-50 border border-slate-200 focus:border-primary rounded-2xl text-slate-800 outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Operational Status</label>
                <select
                  value={cityForm.status}
                  onChange={(e) => setCityForm({ ...cityForm, status: e.target.value })}
                  className="w-full h-11 px-4 bg-slate-50 border border-slate-200 focus:border-primary rounded-2xl text-slate-800 outline-none font-bold"
                >
                  <option value="Live">Live (Active Operations)</option>
                  <option value="Coming Soon">Coming Soon</option>
                  <option value="Disabled">Disabled</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCityModalOpen(false)}
                  className="rounded-2xl border border-slate-200 px-4 py-2.5 text-xs font-extrabold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-2xl bg-primary px-6 py-2.5 text-xs font-extrabold text-white shadow-sm hover:bg-blue-700 transition-all"
                >
                  {editingCity ? 'Save City Changes' : 'Add City'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CoveragePanel;
