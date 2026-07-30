import { useState, useEffect, useMemo, useCallback } from 'react';
import { MapPin, Search, Edit2, X, Plus } from 'lucide-react';
import { getDistrictCoverageList, updateDistrictStatus } from '../../services/coverageService';
import { createDistrict } from '../../services/locationService';
import { useToast } from '../../context/ToastContext';

const CoveragePanel = () => {
  const { showToast } = useToast();
  const [districts, setDistricts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedStateFilter, setSelectedStateFilter] = useState('All');

  // Modal State for Edit Radius / District
  const [editingDistrict, setEditingDistrict] = useState(null);
  const [editStatus, setEditStatus] = useState('Active');
  const [editRadius, setEditRadius] = useState(15);
  const [updating, setUpdating] = useState(false);

  // New District Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newDistrictName, setNewDistrictName] = useState('');
  const [newStateName, setNewStateName] = useState('Jharkhand');
  const [adding, setAdding] = useState(false);

  const fetchCoverage = useCallback(async () => {
    setLoading(true);
    const res = await getDistrictCoverageList();
    if (res.data) {
      setDistricts(res.data);
    } else {
      showToast('Failed to load district coverage', 'error');
    }
    setLoading(false);
  }, [showToast]);

  useEffect(() => {
    queueMicrotask(() => {
      fetchCoverage();
    });
  }, [fetchCoverage]);

  // Filtered Districts
  const filteredDistricts = useMemo(() => {
    return districts.filter(d => {
      const matchSearch = (d.name || '').toLowerCase().includes(search.toLowerCase()) ||
                          (d.state_name || '').toLowerCase().includes(search.toLowerCase());
      const matchState = selectedStateFilter === 'All' || d.state_name === selectedStateFilter;
      return matchSearch && matchState;
    });
  }, [districts, search, selectedStateFilter]);

  // Unique States list for filter
  const uniqueStates = useMemo(() => {
    const set = new Set(districts.map(d => d.state_name));
    return ['All', ...Array.from(set).sort()];
  }, [districts]);

  // Quick Toggle Status
  const handleToggleStatus = async (district, newStatus) => {
    const res = await updateDistrictStatus(district.id, newStatus, district.coverage_radius_km);
    if (res.data || !res.error) {
      showToast(`District ${district.name} set to ${newStatus}`, 'success');
      fetchCoverage();
    } else {
      showToast(res.error || 'Failed to update status', 'error');
    }
  };

  // Update District Radius Modal Submit
  const handleSaveEdit = async () => {
    if (!editingDistrict) return;
    setUpdating(true);
    const res = await updateDistrictStatus(editingDistrict.id, editStatus, editRadius);
    if (res.data || !res.error) {
      showToast(`Updated coverage for ${editingDistrict.name}`, 'success');
      setEditingDistrict(null);
      fetchCoverage();
    } else {
      showToast(res.error || 'Failed to update radius', 'error');
    }
    setUpdating(false);
  };

  // Create District
  const handleCreateDistrict = async (e) => {
    e.preventDefault();
    if (!newDistrictName.trim()) {
      showToast('District name is required', 'error');
      return;
    }
    setAdding(true);
    const res = await createDistrict({
      state_name: newStateName,
      name: newDistrictName.trim(),
      status: 'Active',
      coverage_radius_km: 15
    });
    if (res.data) {
      showToast(`District ${newDistrictName} added successfully!`, 'success');
      setNewDistrictName('');
      setIsAddModalOpen(false);
      fetchCoverage();
    } else {
      showToast(res.error || 'Failed to add district', 'error');
    }
    setAdding(false);
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <span className="text-[10px] font-black text-primary uppercase tracking-widest">Marketplace Coverage Engine</span>
          <h2 className="text-2xl font-black text-slate-900">District Coverage Management</h2>
          <p className="text-xs text-slate-500">Manage operational status and service radius at the District level (State → District).</p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="btn-primary text-xs px-4 py-2.5 rounded-xl font-bold flex items-center gap-1.5 shadow-md shrink-0"
        >
          <Plus size={16} /> Add District Coverage
        </button>
      </div>

      {/* Controls & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200/80 w-full sm:w-80">
          <Search size={16} className="text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Search district or state..."
            className="w-full bg-transparent border-0 outline-none text-xs font-semibold text-slate-800 placeholder-slate-400"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* State Filter */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-bold text-slate-500">Filter State:</span>
          <select
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold outline-none focus:border-primary bg-white"
            value={selectedStateFilter}
            onChange={(e) => setSelectedStateFilter(e.target.value)}
          >
            {uniqueStates.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Districts Table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs font-bold text-slate-500">Loading district coverage data...</div>
        ) : filteredDistricts.length === 0 ? (
          <div className="p-12 text-center text-xs font-bold text-slate-500">No districts match your filter.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-extrabold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3.5 px-4">State & District</th>
                  <th className="py-3.5 px-4">Coverage Status</th>
                  <th className="py-3.5 px-4 text-center">Coverage Radius</th>
                  <th className="py-3.5 px-4 text-center">Workers</th>
                  <th className="py-3.5 px-4 text-center">Contractors</th>
                  <th className="py-3.5 px-4 text-center">Active Bookings</th>
                  <th className="py-3.5 px-4 text-center">Requests</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                {filteredDistricts.map(dist => (
                  <tr key={dist.id} className="hover:bg-slate-50/80 transition-all">
                    {/* State & District */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                          <MapPin size={16} />
                        </div>
                        <div>
                          <span className="font-extrabold text-slate-900 text-sm block">{dist.name} District</span>
                          <span className="text-[11px] text-slate-400">{dist.state_name}</span>
                        </div>
                      </div>
                    </td>

                    {/* Coverage Status Badge */}
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black tracking-wide ${
                        dist.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                        dist.status === 'Coming Soon' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        ● {dist.status || 'Active'}
                      </span>
                    </td>

                    {/* Coverage Radius */}
                    <td className="py-3.5 px-4 text-center">
                      <span className="font-extrabold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg">
                        {dist.coverage_radius_km} km
                      </span>
                    </td>

                    {/* Counts */}
                    <td className="py-3.5 px-4 text-center font-extrabold text-slate-900">{dist.workerCount || 0}</td>
                    <td className="py-3.5 px-4 text-center font-extrabold text-slate-900">{dist.contractorCount || 0}</td>
                    <td className="py-3.5 px-4 text-center font-extrabold text-slate-900">{dist.bookingCount || 0}</td>
                    <td className="py-3.5 px-4 text-center font-extrabold text-indigo-600">{dist.requestCount || 0}</td>

                    {/* Action Controls */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {dist.status !== 'Active' ? (
                          <button
                            onClick={() => handleToggleStatus(dist, 'Active')}
                            className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold text-[11px] transition-all"
                          >
                            Activate
                          </button>
                        ) : (
                          <button
                            onClick={() => handleToggleStatus(dist, 'Disabled')}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 font-bold text-[11px] transition-all"
                          >
                            Disable
                          </button>
                        )}

                        <button
                          onClick={() => {
                            setEditingDistrict(dist);
                            setEditStatus(dist.status || 'Active');
                            setEditRadius(dist.coverage_radius_km || 15);
                          }}
                          className="p-1.5 rounded-lg border border-slate-200 hover:border-primary text-slate-600 hover:text-primary transition-all"
                          title="Edit Coverage Radius"
                        >
                          <Edit2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit District Radius Modal */}
      {editingDistrict && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-900 text-base">Edit {editingDistrict.name} Coverage Radius</h3>
              <button onClick={() => setEditingDistrict(null)} className="text-slate-400 hover:text-slate-700"><X size={18} /></button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Status</label>
                <select
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold outline-none focus:border-primary"
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                >
                  <option value="Active">Active</option>
                  <option value="Coming Soon">Coming Soon</option>
                  <option value="Disabled">Disabled</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Coverage Radius (in KM)</label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="5"
                    max="50"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold outline-none focus:border-primary"
                    value={editRadius}
                    onChange={(e) => setEditRadius(e.target.value)}
                  />
                  <span className="text-xs font-bold text-slate-600 shrink-0">km</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button onClick={() => setEditingDistrict(null)} className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl">Cancel</button>
              <button onClick={handleSaveEdit} disabled={updating} className="btn-primary text-xs px-5 py-2 rounded-xl font-bold shadow-md">
                {updating ? 'Saving...' : 'Save Radius'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add New District Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <form onSubmit={handleCreateDistrict} className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-900 text-base">Add New District Coverage</h3>
              <button type="button" onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-700"><X size={18} /></button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">State Name</label>
                <select
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold outline-none focus:border-primary"
                  value={newStateName}
                  onChange={(e) => setNewStateName(e.target.value)}
                >
                  <option value="Jharkhand">Jharkhand</option>
                  <option value="Bihar">Bihar</option>
                  <option value="Uttar Pradesh">Uttar Pradesh</option>
                  <option value="West Bengal">West Bengal</option>
                  <option value="Delhi NCR">Delhi NCR</option>
                  <option value="Odisha">Odisha</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">District Name</label>
                <input
                  type="text"
                  placeholder="e.g. Hazaribagh"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold outline-none focus:border-primary"
                  value={newDistrictName}
                  onChange={(e) => setNewDistrictName(e.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl">Cancel</button>
              <button type="submit" disabled={adding} className="btn-primary text-xs px-5 py-2 rounded-xl font-bold shadow-md">
                {adding ? 'Adding...' : 'Add & Activate'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default CoveragePanel;
