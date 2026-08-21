import { useState, useMemo } from 'react';
import { useCms } from '../../context/CmsContext';
import { Edit2, Trash2, MapPin, X, Search, CheckCircle2, XCircle, Globe, CheckSquare, Square } from 'lucide-react';

const ServicesPanel = () => {
  const {
    services,
    categories,
    cities,
    states,
    cityControl,
    toggleServiceInCity,
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
  const [selectedCityIds, setSelectedCityIds] = useState([]);
  const [form, setForm] = useState({
    name: '',
    category: '',
    category_id: '',
    description: '',
    base_price: '',
    platform_fee: '',
    inspection_fee: '',
    icon: 'wrench',
    image_url: '',
    image: '',
    active: true,
  });
  const [uploading, setUploading] = useState(false);

  // Coverage Modal State for existing services table
  const [coverageService, setCoverageService] = useState(null);
  const [coverageSearch, setCoverageSearch] = useState('');
  const [coverageFilter, setCoverageFilter] = useState('all'); // 'all' | 'active' | 'inactive'

  // Add Coverage Modal State for Service Creation / Edit form
  const [isAddCoverageModalOpen, setIsAddCoverageModalOpen] = useState(false);
  const [modalStateSearch, setModalStateSearch] = useState('');
  const [modalDistrictSearch, setModalDistrictSearch] = useState('');
  const [modalSelectedState, setModalSelectedState] = useState(null); // null = Step 1 (Select State)
  const [tempSelectedCityIds, setTempSelectedCityIds] = useState([]);

  // Compute unique states list from loaded cities & states
  const availableStatesList = useMemo(() => {
    const setOfStates = new Set();
    (states || []).forEach((s) => {
      if (s?.name) setOfStates.add(s.name);
    });
    (cities || []).forEach((c) => {
      const st = c.state_name || c.state || c.region;
      if (st) setOfStates.add(st);
    });
    return Array.from(setOfStates).sort();
  }, [states, cities]);

  // Selected district objects & state grouping for main form card
  const selectedDistrictObjects = useMemo(() => {
    const selectedSet = new Set(selectedCityIds);
    return (cities || []).filter((c) => selectedSet.has(c.id));
  }, [cities, selectedCityIds]);

  const groupedSelectedCoverage = useMemo(() => {
    const map = new Map();
    selectedDistrictObjects.forEach((dist) => {
      const stName = dist.state_name || dist.state || dist.region || 'General Location';
      if (!map.has(stName)) {
        map.set(stName, []);
      }
      map.get(stName).push(dist);
    });
    return map;
  }, [selectedDistrictObjects]);

  // Filtered states for Modal Step 1
  const filteredModalStates = useMemo(() => {
    if (!modalStateSearch.trim()) return availableStatesList;
    const query = modalStateSearch.toLowerCase().trim();
    return availableStatesList.filter((st) => st.toLowerCase().includes(query));
  }, [availableStatesList, modalStateSearch]);

  // Filtered districts for Modal Step 2
  const modalStateDistricts = useMemo(() => {
    if (!modalSelectedState) return [];
    const stateDistricts = (cities || []).filter((c) => {
      const st = c.state_name || c.state || c.region || '';
      return String(st).toLowerCase() === String(modalSelectedState).toLowerCase();
    });
    if (!modalDistrictSearch.trim()) return stateDistricts;
    const query = modalDistrictSearch.toLowerCase().trim();
    return stateDistricts.filter((c) => (c.name || '').toLowerCase().includes(query));
  }, [cities, modalSelectedState, modalDistrictSearch]);

  const handleOpenAddCoverageModal = () => {
    setTempSelectedCityIds([...selectedCityIds]);
    setModalSelectedState(null);
    setModalStateSearch('');
    setModalDistrictSearch('');
    setIsAddCoverageModalOpen(true);
  };

  const handleApplyCoverageFromModal = () => {
    setSelectedCityIds([...tempSelectedCityIds]);
    setIsAddCoverageModalOpen(false);
  };

  const handleModalSelectAllForState = () => {
    const currentDistrictIds = modalStateDistricts.map((c) => c.id);
    setTempSelectedCityIds((prev) => Array.from(new Set([...prev, ...currentDistrictIds])));
  };

  const handleModalClearAllForState = () => {
    const currentDistrictIdsSet = new Set(modalStateDistricts.map((c) => c.id));
    setTempSelectedCityIds((prev) => prev.filter((id) => !currentDistrictIdsSet.has(id)));
  };

  // Helper to check if service is active in a specific city/district
  const isServiceActiveInCity = (serviceId, city) => {
    if (!city) return false;
    if (city.status === 'Disabled' || city.status === 'Coming Soon') {
      return false;
    }

    if (cityControl && Object.keys(cityControl).length > 0) {
      const matchedService = services.find(
        (s) => String(s.id) === String(serviceId) || String(s.name).toLowerCase() === String(serviceId).toLowerCase()
      );

      const cityKeysToTry = [
        city.id,
        String(city.id),
        city.name,
        String(city.name).toLowerCase(),
        `dist-${city.id}`
      ].filter(Boolean);

      const serviceKeysToTry = [
        serviceId,
        String(serviceId).toLowerCase(),
        matchedService?.id,
        matchedService?.name,
        matchedService?.name ? String(matchedService.name).toLowerCase() : null
      ].filter(Boolean);

      for (const cKey of cityKeysToTry) {
        if (cityControl[cKey]) {
          for (const sKey of serviceKeysToTry) {
            if (cityControl[cKey][sKey] !== undefined) {
              return cityControl[cKey][sKey] === true;
            }
          }
        }
      }
    }

    // Default: Active for active districts unless explicitly deactivated
    return true;
  };

  // Helper to get active city count for a service
  const getActiveCityCount = (serviceId) => {
    if (!cities || cities.length === 0) return 0;
    return cities.filter((city) => isServiceActiveInCity(serviceId, city)).length;
  };

  const filtered = filterItems(services, search, ['name', 'category', 'description']).filter((item) => {
    if (selectedCategory === 'All') return true;
    return (item.category || 'General').toLowerCase() === selectedCategory.toLowerCase();
  });

  const paginated = paginateItems(filtered, page, 6);

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const ext = file.name ? file.name.split('.').pop().toLowerCase() : '';
    const allowedExts = ['jpg', 'jpeg', 'png', 'webp'];

    if (!allowedTypes.includes(file.type) && !allowedExts.includes(ext)) {
      showToast('Unsupported format. Please select JPG, JPEG, PNG, or WEBP.', 'error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast('Image file size must be 5MB or less.', 'error');
      return;
    }

    setUploading(true);
    const { success, url, error } = await uploadImage(file, 'cms-assets', 'services');
    setUploading(false);

    if (url && !url.startsWith('blob:')) {
      setForm((prev) => ({ ...prev, icon: url, image_url: url, image: url }));
      if (success) showToast('Service image uploaded to storage.', 'success');
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

    const selectedCategoryObj = categories.find((cat) => String(cat.id) === String(form.category_id));
    const imgUrl = form.image_url || form.image || (form.icon && form.icon.startsWith('http') ? form.icon : '');

    const payload = {
      ...form,
      icon: imgUrl || form.icon || 'wrench',
      image_url: imgUrl || null,
      image: imgUrl || null,
      category: selectedCategoryObj?.name || form.category || 'General',
      category_id: selectedCategoryObj?.id || form.category_id || null,
      base_price: Number(form.base_price) || 0,
      platform_fee: Number(form.platform_fee) || 0,
      inspection_fee: Number(form.inspection_fee) || 0,
    };

    let savedServiceId = editingService?.id;

    if (editingService) {
      await updateService(editingService.id, payload);
      setEditingService(null);
    } else {
      const res = await createService(payload);
      if (res?.data?.id) savedServiceId = res.data.id;
    }

    // Persist city availability checklist for this service
    if (savedServiceId && cities.length > 0) {
      const promises = cities.map((city) => {
        const enabled = selectedCityIds.includes(city.id);
        return toggleServiceInCity(city.id, savedServiceId, enabled);
      });
      await Promise.all(promises);
    }

    setForm({
      name: '',
      category: '',
      category_id: '',
      description: '',
      base_price: '',
      platform_fee: '',
      inspection_fee: '',
      icon: 'wrench',
      image_url: '',
      image: '',
      active: true,
    });
    setSelectedCityIds([]);
  };

  const handleEdit = (service) => {
    const matchingCategory = categories.find((cat) => String(cat.name).toLowerCase() === String(service.category || '').toLowerCase());
    const imgUrl = service.image_url || service.image || (service.icon && service.icon.startsWith('http') ? service.icon : '');
    setEditingService(service);
    setForm({
      name: service.name || '',
      category: service.category || '',
      category_id: matchingCategory?.id || '',
      description: service.description || '',
      base_price: service.base_price || 0,
      platform_fee: service.platform_fee || 0,
      inspection_fee: service.inspection_fee || 0,
      icon: service.icon || 'wrench',
      image_url: imgUrl,
      image: imgUrl,
      active: service.active !== false,
    });

    // Populate active city IDs for this service
    const enabledCityIds = cities.filter((city) => isServiceActiveInCity(service.id, city)).map((c) => c.id);
    setSelectedCityIds(enabledCityIds);
  };

  // Bulk Toggle in Coverage Modal
  const handleBulkToggleCoverage = async (enableAll) => {
    if (!coverageService || !cities.length) return;
    const promises = cities.map((c) => toggleServiceInCity(c.id, coverageService.id, enableAll));
    await Promise.all(promises);
    showToast(
      `${coverageService.name} is now ${enableAll ? 'Active' : 'Not Active'} across all ${cities.length} districts.`,
      'success'
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-xl font-black text-slate-900">Services Catalog</h2>
          <p className="text-sm text-slate-500">Manage service pricing, categories, and city/district availability.</p>
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
              paginated.data.map((service) => {
                const activeCount = getActiveCityCount(service.id);
                const totalCitiesCount = cities.length || 0;

                return (
                  <div
                    key={service.id}
                    className="group flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:border-slate-300 hover:shadow-md transition-all"
                  >
                    {/* Clickable service info */}
                    <div
                      onClick={() => setCoverageService(service)}
                      className="flex items-center gap-3 cursor-pointer flex-1"
                      title="Click to view district availability"
                    >
                      {service.image_url || service.image || (service.icon && service.icon.startsWith('http')) ? (
                        <img src={service.image_url || service.image || service.icon} alt={service.name} className="h-11 w-11 shrink-0 rounded-xl object-cover border border-slate-200" />
                      ) : (
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary font-black uppercase text-xs group-hover:bg-primary group-hover:text-white transition-all">
                          {(service.name || 'S').slice(0, 2)}
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-slate-900 group-hover:text-primary transition-colors">
                            {service.name}
                          </span>
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                            {service.category || 'General'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Price: ₹{service.base_price || 0} • Fee: ₹{service.platform_fee || 0}
                        </p>

                        {/* District Active / Inactive Badge Button */}
                        <div className="mt-1.5 flex items-center gap-1.5">
                          <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-primary bg-primary/10 hover:bg-primary/20 px-2 py-0.5 rounded-md transition-all">
                            <MapPin size={12} />
                            {activeCount} / {totalCitiesCount} Districts Active
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                      <button
                        type="button"
                        onClick={() => setCoverageService(service)}
                        className="rounded-xl border border-primary/20 bg-primary/5 px-2.5 py-1.5 text-xs font-bold text-primary hover:bg-primary hover:text-white transition-all flex items-center gap-1"
                        title="View District Availability"
                      >
                        <Globe size={14} />
                        Districts
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleServiceActive(service.id, !service.active)}
                        className={`rounded-full px-2.5 py-1 text-[11px] font-extrabold ${
                          service.active !== false ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {service.active !== false ? 'Active' : 'Disabled'}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleEdit(service)}
                        className="rounded-xl border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-50"
                        title="Edit Service"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(`Delete service "${service.name}"?`)) {
                            deleteService(service.id);
                          }
                        }}
                        className="rounded-xl bg-red-50 p-2 text-red-600 hover:bg-red-100"
                        title="Delete Service"
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

        {/* Right Panel: Create/Edit Service */}
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
            <select
              value={form.category_id || (categories.find((cat) => String(cat.name).toLowerCase() === String(form.category).toLowerCase())?.id || '')}
              onChange={(e) => {
                const selectedVal = e.target.value;
                const selectedCat = categories.find((cat) => String(cat.id) === String(selectedVal) || cat.name === selectedVal);
                setForm({
                  ...form,
                  category_id: selectedCat?.id || selectedVal,
                  category: selectedCat?.name || selectedVal || '',
                });
              }}
              className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm font-semibold bg-white"
            >
              <option value="">Select category</option>
              {categories.map((cat) => (
                <option key={cat.id || cat.name} value={cat.id || cat.name}>
                  {cat.name}
                </option>
              ))}
            </select>
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

          {/* Compact Rapido-style Service Coverage Card */}
          <div className="space-y-3 pt-3 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs font-black uppercase text-slate-700 tracking-wider block">Service Coverage</label>
                <p className="text-[11px] font-semibold text-slate-400">Choose where this service is available.</p>
              </div>
              {selectedCityIds.length > 0 && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs">
                  <MapPin size={13} className="text-blue-600 shrink-0" />
                  {selectedDistrictObjects.length} {selectedDistrictObjects.length === 1 ? 'District' : 'Districts'} · {groupedSelectedCoverage.size} {groupedSelectedCoverage.size === 1 ? 'State' : 'States'}
                </span>
              )}
            </div>

            <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200 space-y-3">
              {selectedCityIds.length === 0 ? (
                <div className="py-4 text-center space-y-2">
                  <div className="h-10 w-10 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                    <MapPin size={20} />
                  </div>
                  <p className="text-xs font-bold text-slate-500">No locations added yet.</p>
                  <button
                    type="button"
                    onClick={handleOpenAddCoverageModal}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold shadow-sm hover:bg-blue-700 transition-colors cursor-pointer"
                  >
                    + Add Coverage
                  </button>
                </div>
              ) : (
                <>
                  <div className="max-h-52 overflow-y-auto space-y-3 pr-1">
                    {Array.from(groupedSelectedCoverage.entries()).map(([stName, distList]) => (
                      <div key={stName} className="bg-white rounded-xl p-3 border border-slate-200/80 space-y-2 shadow-2xs">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                          <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-primary inline-block"></span>
                            {stName}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400">
                            {distList.length} {distList.length === 1 ? 'district' : 'districts'}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5 pt-0.5">
                          {distList.map((dist) => (
                            <span
                              key={dist.id}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200/60 hover:border-slate-300 transition-colors group"
                            >
                              <span>• {dist.name}</span>
                              <button
                                type="button"
                                onClick={() => setSelectedCityIds((prev) => prev.filter((id) => id !== dist.id))}
                                className="text-slate-400 hover:text-rose-600 transition-colors p-0.5 cursor-pointer"
                                title={`Remove ${dist.name}`}
                              >
                                <X size={12} />
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 border-t border-slate-200/60 flex justify-between items-center">
                    <button
                      type="button"
                      onClick={handleOpenAddCoverageModal}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:text-blue-700 hover:underline cursor-pointer"
                    >
                      + Add another location
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedCityIds([])}
                      className="text-[11px] font-bold text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                    >
                      Clear all locations
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-600 block mb-1">Service Image</label>
            {(form.image_url || form.image || (form.icon && form.icon.startsWith('http'))) ? (
              <div className="p-3 bg-white rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center gap-3">
                  <img
                    src={form.image_url || form.image || form.icon}
                    alt="Service Preview"
                    className="w-16 h-14 rounded-xl object-cover border border-slate-200 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 inline-block mb-1">
                      ✓ Image Active
                    </span>
                    <p className="text-[11px] font-semibold text-slate-500 truncate">{form.image_url || form.image || form.icon}</p>
                  </div>
                </div>
                <div className="flex gap-2 pt-2 border-t border-slate-100">
                  <label className="flex-1 cursor-pointer">
                    <span className="w-full inline-flex items-center justify-center gap-1 py-1.5 px-3 rounded-xl bg-slate-100 text-slate-700 text-xs font-extrabold hover:bg-slate-200 transition-colors">
                      Replace Image
                    </span>
                    <input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, image_url: '', image: '', icon: 'wrench' }))}
                    className="py-1.5 px-3 rounded-xl bg-rose-50 text-rose-700 text-xs font-extrabold hover:bg-rose-100 transition-colors"
                  >
                    Remove Image
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-white rounded-2xl border border-dashed border-slate-300 text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center mx-auto text-base">
                  📷
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-700">Upload Service Image</p>
                  <p className="text-[10px] text-slate-400 font-medium">JPG, JPEG, PNG, WEBP (Max 5MB)</p>
                </div>
                <label className="inline-block cursor-pointer">
                  <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-white text-xs font-extrabold shadow-sm hover:bg-blue-700 transition-colors">
                    Upload Image
                  </span>
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              </div>
            )}
            {uploading && <p className="text-[11px] text-primary font-bold mt-1.5 animate-pulse">Uploading image to storage...</p>}
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
                    setSelectedCityIds([]);
                    setForm({
                      name: '',
                      category: '',
                      category_id: '',
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

      {/* ========================================== */}
      {/* DISTRICT AVAILABILITY BREAKDOWN MODAL      */}
      {/* ========================================== */}
      {coverageService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl bg-white shadow-2xl overflow-hidden border border-slate-100">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary font-black uppercase text-sm">
                  {(coverageService.name || 'S').slice(0, 2)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-black text-slate-900">{coverageService.name}</h3>
                    <span className="rounded-full bg-slate-200 px-2.5 py-0.5 text-[10px] font-extrabold text-slate-700">
                      {coverageService.category || 'General'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    District / City Availability Breakdown & Control
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setCoverageService(null)}
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-all"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-5 flex-1">
              {/* Summary Metrics */}
              {(() => {
                const total = cities.length;
                const activeDistricts = cities.filter((c) => isServiceActiveInCity(coverageService.id, c));
                const activeCount = activeDistricts.length;
                const inactiveCount = total - activeCount;

                const filteredCities = cities.filter((c) => {
                  const matchSearch =
                    (c.name || '').toLowerCase().includes(coverageSearch.toLowerCase()) ||
                    (c.state_name || '').toLowerCase().includes(coverageSearch.toLowerCase());
                  const isActive = isServiceActiveInCity(coverageService.id, c);
                  if (coverageFilter === 'active') return matchSearch && isActive;
                  if (coverageFilter === 'inactive') return matchSearch && !isActive;
                  return matchSearch;
                });

                return (
                  <>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-3.5 text-center">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-600 block">
                          Active Districts
                        </span>
                        <span className="text-2xl font-black text-emerald-700 mt-1 block">
                          {activeCount}
                        </span>
                      </div>

                      <div className="rounded-2xl border border-rose-100 bg-rose-50/60 p-3.5 text-center">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-600 block">
                          Not Active
                        </span>
                        <span className="text-2xl font-black text-rose-700 mt-1 block">
                          {inactiveCount}
                        </span>
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5 text-center">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block">
                          Total Districts
                        </span>
                        <span className="text-2xl font-black text-slate-800 mt-1 block">
                          {total}
                        </span>
                      </div>
                    </div>

                    {/* Controls & Search */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 w-full sm:w-64">
                        <Search size={15} className="text-slate-400 shrink-0" />
                        <input
                          type="text"
                          placeholder="Search district name..."
                          value={coverageSearch}
                          onChange={(e) => setCoverageSearch(e.target.value)}
                          className="w-full bg-transparent border-0 outline-none text-xs font-semibold text-slate-800 placeholder-slate-400"
                        />
                      </div>

                      <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                        <select
                          value={coverageFilter}
                          onChange={(e) => setCoverageFilter(e.target.value)}
                          className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold outline-none bg-white text-slate-700"
                        >
                          <option value="all">All ({total})</option>
                          <option value="active">Active Only ({activeCount})</option>
                          <option value="inactive">Not Active Only ({inactiveCount})</option>
                        </select>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleBulkToggleCoverage(true)}
                            className="btn-primary text-[11px] px-2.5 py-2 rounded-xl font-bold flex items-center gap-1"
                            title="Enable in all districts"
                          >
                            <CheckSquare size={13} /> All On
                          </button>
                          <button
                            type="button"
                            onClick={() => handleBulkToggleCoverage(false)}
                            className="rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-[11px] font-bold text-slate-600 hover:bg-slate-100 flex items-center gap-1"
                            title="Disable in all districts"
                          >
                            <Square size={13} /> All Off
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Districts List Grid */}
                    <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                      {filteredCities.length === 0 ? (
                        <div className="p-8 text-center text-xs font-semibold text-slate-400 border border-slate-100 rounded-2xl">
                          No districts match your filter.
                        </div>
                      ) : (
                        filteredCities.map((city) => {
                          const active = isServiceActiveInCity(coverageService.id, city);

                          return (
                            <div
                              key={city.id}
                              className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                                active
                                  ? 'border-emerald-200/80 bg-emerald-50/30'
                                  : 'border-slate-200 bg-slate-50/50'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <div
                                  className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                                    active
                                      ? 'bg-emerald-100 text-emerald-700'
                                      : 'bg-slate-200 text-slate-500'
                                  }`}
                                >
                                  <MapPin size={15} />
                                </div>
                                <div>
                                  <span className="font-extrabold text-slate-900 text-xs block">
                                    {String(city.name || '').toLowerCase().endsWith('district')
                                      ? city.name
                                      : `${city.name} District`}
                                  </span>
                                  <span className="text-[10px] font-semibold text-slate-400">
                                    {city.state_name || 'Jharkhand'}
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center gap-3">
                                <span
                                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-extrabold ${
                                    active
                                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                      : 'bg-rose-100 text-rose-800 border border-rose-200'
                                  }`}
                                >
                                  {active ? (
                                    <>
                                      <CheckCircle2 size={12} className="text-emerald-600" /> Active
                                    </>
                                  ) : (
                                    <>
                                      <XCircle size={12} className="text-rose-500" /> Not Active
                                    </>
                                  )}
                                </span>

                                <button
                                  type="button"
                                  onClick={async () => {
                                    const nextState = !active;
                                    await toggleServiceInCity(city.id, coverageService.id, nextState);
                                    showToast(
                                      `${coverageService.name} is now ${nextState ? 'Active' : 'Not Active'} in ${city.name}`,
                                      nextState ? 'success' : 'info'
                                    );
                                  }}
                                  className={`rounded-xl px-3 py-1.5 text-xs font-bold shadow-sm transition-all ${
                                    active
                                      ? 'bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100'
                                      : 'bg-emerald-600 text-white hover:bg-emerald-700'
                                  }`}
                                >
                                  {active ? 'Deactivate' : 'Activate'}
                                </button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </>
                );
              })()}
            </div>

            {/* Modal Footer */}
            <div className="border-t border-slate-100 px-6 py-4 bg-slate-50/50 flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-400">
                Changes apply instantly across Fixiva customer booking apps.
              </span>
              <button
                type="button"
                onClick={() => setCoverageService(null)}
                className="btn-primary text-xs px-5 py-2 rounded-xl font-bold"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Service Coverage Modal (State -> District Step Flow) */}
      {isAddCoverageModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-slate-100 max-h-[85vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
              <div>
                <div className="flex items-center gap-2">
                  <MapPin className="text-primary" size={20} />
                  <h3 className="text-lg font-black text-slate-900">Add Service Coverage</h3>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {modalSelectedState ? `Step 2: Select districts in ${modalSelectedState}` : 'Step 1: Select state'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddCoverageModalOpen(false)}
                className="p-1.5 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body Content */}
            <div className="flex-1 overflow-y-auto min-h-0 space-y-4 pr-1">
              {!modalSelectedState ? (
                /* Step 1: Select State */
                <div className="space-y-3">
                  <div className="relative">
                    <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={modalStateSearch}
                      onChange={(e) => setModalStateSearch(e.target.value)}
                      placeholder="🔍 Search state..."
                      className="h-10 w-full rounded-xl border border-slate-200 pl-10 pr-3 text-xs font-semibold focus:outline-none focus:border-primary"
                    />
                  </div>

                  <div className="space-y-1.5 max-h-64 overflow-y-auto">
                    {filteredModalStates.length === 0 ? (
                      <div className="p-8 text-center text-xs font-bold text-slate-400">No states matching search.</div>
                    ) : (
                      filteredModalStates.map((st) => {
                        const stateDistrictsCount = (cities || []).filter(
                          (c) => (c.state_name || c.state || c.region) === st
                        ).length;
                        const selectedInState = (cities || []).filter(
                          (c) => (c.state_name || c.state || c.region) === st && tempSelectedCityIds.includes(c.id)
                        ).length;

                        return (
                          <button
                            key={st}
                            type="button"
                            onClick={() => {
                              setModalSelectedState(st);
                              setModalDistrictSearch('');
                            }}
                            className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-primary/5 hover:border-primary/30 transition-all text-left group cursor-pointer"
                          >
                            <div>
                              <span className="font-extrabold text-xs text-slate-900 group-hover:text-primary transition-colors block">
                                {st}
                              </span>
                              <span className="text-[10px] font-semibold text-slate-400">
                                {stateDistrictsCount} districts available
                              </span>
                            </div>
                            {selectedInState > 0 ? (
                              <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                {selectedInState} selected
                              </span>
                            ) : (
                              <span className="text-xs font-bold text-slate-400 group-hover:text-primary">Select →</span>
                            )}
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              ) : (
                /* Step 2: Select Districts for modalSelectedState */
                <div className="space-y-3">
                  <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setModalSelectedState(null)}
                      className="text-xs font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      ← Back to States
                    </button>
                    <div className="flex items-center gap-2 text-xs font-bold">
                      <button
                        type="button"
                        onClick={handleModalSelectAllForState}
                        className="text-primary hover:underline cursor-pointer"
                      >
                        Select All Districts
                      </button>
                      <span className="text-slate-300">|</span>
                      <button
                        type="button"
                        onClick={handleModalClearAllForState}
                        className="text-slate-400 hover:text-slate-600 hover:underline cursor-pointer"
                      >
                        Clear
                      </button>
                    </div>
                  </div>

                  <div className="relative">
                    <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={modalDistrictSearch}
                      onChange={(e) => setModalDistrictSearch(e.target.value)}
                      placeholder="🔍 Search district in state..."
                      className="h-10 w-full rounded-xl border border-slate-200 pl-10 pr-3 text-xs font-semibold focus:outline-none focus:border-primary"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto p-1">
                    {modalStateDistricts.length === 0 ? (
                      <div className="col-span-2 p-8 text-center text-xs font-bold text-slate-400">
                        No districts matching search.
                      </div>
                    ) : (
                      modalStateDistricts.map((dist) => {
                        const isChecked = tempSelectedCityIds.includes(dist.id);
                        return (
                          <label
                            key={dist.id}
                            className={`flex items-center justify-between gap-2 p-2.5 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                              isChecked
                                ? 'bg-emerald-50/80 border-emerald-300 text-emerald-900 font-bold shadow-2xs'
                                : 'bg-white border-slate-200/80 text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setTempSelectedCityIds((prev) => [...prev, dist.id]);
                                  } else {
                                    setTempSelectedCityIds((prev) => prev.filter((id) => id !== dist.id));
                                  }
                                }}
                                className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary shrink-0 cursor-pointer"
                              />
                              <span className="truncate">{dist.name}</span>
                            </div>
                          </label>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between shrink-0">
              <span className="text-xs font-bold text-slate-500">
                Selected Total: <strong className="text-slate-900">{tempSelectedCityIds.length}</strong> locations
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddCoverageModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleApplyCoverageFromModal}
                  className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-extrabold hover:bg-blue-700 transition-colors shadow-sm cursor-pointer"
                >
                  Add {tempSelectedCityIds.length} {tempSelectedCityIds.length === 1 ? 'Location' : 'Locations'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServicesPanel;

