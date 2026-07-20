import { useState, useMemo, useRef } from 'react';
import { useApp } from '../context/AuthContext';
import { 
  Plus, Trash2, Edit2, Search, ArrowUpDown, 
  Upload, Download, MapPin, TrendingUp, Users, Briefcase, 
  Calendar, Star, CheckCircle, AlertTriangle 
} from 'lucide-react';

const LocationManagementPanel = () => {
  const { 
    states, 
    cities, 
    bookings, 
    workers, 
    contractors, 
    profiles, 
    reviews, 
    services, 
    cityControl, 
    coverageRequests,
    addState, 
    updateState, 
    deleteState, 
    addDistrict, 
    updateDistrict, 
    deleteDistrict, 
    toggleServiceInCity,
    showToast 
  } = useApp();

  // Selected Items
  const [selectedStateId, setSelectedStateId] = useState('');
  const [selectedCityId, setSelectedCityId] = useState('');

  // Search & Filters
  const [stateSearch, setStateSearch] = useState('');
  const [districtSearch, setDistrictSearch] = useState('');
  const [sortStateAsc, setSortStateAsc] = useState(true);
  const [sortDistrictAsc, setSortDistrictAsc] = useState(true);

  // Forms
  const [newStateName, setNewStateName] = useState('');
  const [newDistrictName, setNewDistrictName] = useState('');
  const [newDistrictStatus, setNewDistrictStatus] = useState('Coming Soon');

  // Inline Edits
  const [editingStateId, setEditingStateId] = useState('');
  const [editingStateName, setEditingStateName] = useState('');
  const [editingStateOrder, setEditingStateOrder] = useState(0);

  const [editingCityId, setEditingCityId] = useState('');
  const [editingCityName, setEditingCityName] = useState('');
  const [editingCityOrder, setEditingCityOrder] = useState(0);
  const [editingCityStatus, setEditingCityStatus] = useState('');

  const fileInputRef = useRef(null);

  // Find active State & City objects
  const activeState = useMemo(() => states.find(s => s.id === selectedStateId), [states, selectedStateId]);
  const activeCity = useMemo(() => cities.find(c => c.id === selectedCityId), [cities, selectedCityId]);

  // List of states filtered & sorted
  const filteredStates = useMemo(() => {
    let result = [...states];
    if (stateSearch) {
      result = result.filter(s => s.name.toLowerCase().includes(stateSearch.toLowerCase()));
    }
    result.sort((a, b) => {
      const cmp = (a.display_order - b.display_order) || a.name.localeCompare(b.name);
      return sortStateAsc ? cmp : -cmp;
    });
    return result;
  }, [states, stateSearch, sortStateAsc]);

  // List of districts filtered & sorted for selected state
  const filteredDistricts = useMemo(() => {
    if (!selectedStateId) return [];
    let result = cities.filter(c => c.state_id === selectedStateId || (activeState && c.region === activeState.name));
    if (districtSearch) {
      result = result.filter(c => c.name.toLowerCase().includes(districtSearch.toLowerCase()));
    }
    result.sort((a, b) => {
      const cmp = (a.display_order - b.display_order) || a.name.localeCompare(b.name);
      return sortDistrictAsc ? cmp : -cmp;
    });
    return result;
  }, [cities, selectedStateId, activeState, districtSearch, sortDistrictAsc]);

  // Analytics helper for a selected district
  const districtStats = useMemo(() => {
    if (!activeCity) return null;
    const nameLower = activeCity.name.trim().toLowerCase();

    const dWorkers = workers.filter(w => (w.city || '').trim().toLowerCase() === nameLower);
    const dContractors = contractors.filter(c => (c.city || '').trim().toLowerCase() === nameLower);
    
    // bookings match by city_id
    const dBookings = bookings.filter(b => b.city_id === activeCity.id);
    const totalRev = dBookings.reduce((acc, curr) => acc + Number(curr.price || 0) + Number(curr.platform_fee || 0), 0);
    
    const dBookingsIds = dBookings.map(b => b.id);
    const dReviews = reviews.filter(r => dBookingsIds.includes(r.booking_id));
    const avgRat = dReviews.length > 0
      ? (dReviews.reduce((acc, curr) => acc + (curr.rating || 0), 0) / dReviews.length).toFixed(1)
      : '0.0';

    const dCustomers = profiles.filter(p => p.role === 'customer' && (p.city || '').trim().toLowerCase() === nameLower);
    
    const activeServs = services.filter(s => cityControl[activeCity.id] && cityControl[activeCity.id][s.id] === true).length;
    const dRequests = (coverageRequests || []).filter(r => (r.city || '').trim().toLowerCase() === nameLower).length;

    return {
      workersCount: dWorkers.length,
      contractorsCount: dContractors.length,
      bookingsCount: dBookings.length,
      revenue: totalRev,
      rating: avgRat,
      customersCount: dCustomers.length,
      activeServicesCount: activeServs,
      requestsCount: dRequests
    };
  }, [activeCity, workers, contractors, bookings, reviews, profiles, services, cityControl, coverageRequests]);

  // State handlers
  const handleAddState = async (e) => {
    e.preventDefault();
    if (!newStateName.trim()) return;
    const { error } = await addState(newStateName.trim());
    if (error) {
      showToast(error.message || "Failed to add state.", 'error');
    } else {
      showToast("State added successfully.", 'success');
      setNewStateName('');
    }
  };

  const handleSaveStateEdit = async (sId) => {
    if (!editingStateName.trim()) return;
    const { error } = await updateState(sId, {
      name: editingStateName.trim(),
      display_order: parseInt(editingStateOrder) || 0
    });
    if (error) {
      showToast(error.message || "Failed to update state.", 'error');
    } else {
      showToast("State updated.", 'success');
      setEditingStateId('');
    }
  };

  const handleToggleStateStatus = async (s) => {
    const nextStatus = s.status === 'Live' ? 'Disabled' : 'Live';
    const { error } = await updateState(s.id, { status: nextStatus });
    if (error) {
      showToast(error.message || "Failed to toggle state status.", 'error');
    } else {
      showToast(`State marked as ${nextStatus}.`, 'success');
    }
  };

  const handleDeleteStateClick = async (sId) => {
    const ok = confirm("Are you sure? Deleting a state will also delete all its associated districts/cities.");
    if (!ok) return;
    const { error } = await deleteState(sId);
    if (error) {
      showToast(error.message || "Failed to delete state.", 'error');
    } else {
      showToast("State deleted.", 'success');
      if (selectedStateId === sId) {
        setSelectedStateId('');
        setSelectedCityId('');
      }
    }
  };

  // District handlers
  const handleAddDistrict = async (e) => {
    e.preventDefault();
    if (!selectedStateId || !newDistrictName.trim()) return;
    const { error } = await addDistrict(selectedStateId, activeState.name, newDistrictName.trim(), newDistrictStatus);
    if (error) {
      showToast(error.message || "Failed to add district.", 'error');
    } else {
      showToast("District/City created.", 'success');
      setNewDistrictName('');
    }
  };

  const handleSaveDistrictEdit = async (dId) => {
    if (!editingCityName.trim()) return;
    const { error } = await updateDistrict(dId, {
      name: editingCityName.trim(),
      display_order: parseInt(editingCityOrder) || 0,
      status: editingCityStatus
    });
    if (error) {
      showToast(error.message || "Failed to update district.", 'error');
    } else {
      showToast("District/City updated.", 'success');
      setEditingCityId('');
    }
  };

  const handleOneClickLaunch = async (d) => {
    const { error } = await updateDistrict(d.id, { status: 'Live' });
    if (error) {
      showToast(error.message || "Failed to launch district.", 'error');
    } else {
      showToast(`🚀 ${d.name} is now LIVE across the entire platform!`, 'success');
    }
  };

  const handleDeleteDistrictClick = async (dId) => {
    const ok = confirm("Are you sure you want to delete this district/city?");
    if (!ok) return;
    const { error } = await deleteDistrict(dId);
    if (error) {
      showToast(error.message || "Failed to delete district.", 'error');
    } else {
      showToast("District/City deleted.", 'success');
      if (selectedCityId === dId) {
        setSelectedCityId('');
      }
    }
  };

  // Export CSV
  const handleExport = () => {
    try {
      let csvContent = "\ufeffState,District,Status,DisplayOrder\n";
      cities.forEach(c => {
        csvContent += `"${c.region || 'India'}","${c.name}","${c.status || 'Coming Soon'}","${c.display_order || 0}"\n`;
      });
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `fixiva_locations_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast("Locations exported successfully.", 'success');
    } catch (err) {
      console.error(err);
      showToast("Failed to export location data.", 'error');
    }
  };

  // Import CSV
  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const text = evt.target.result;
        const lines = text.split("\n");
        let importCount = 0;

        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;

          const parts = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(p => p.replace(/^"|"$/g, '').trim());
          if (parts.length < 2) continue;

          const stateName = parts[0];
          const districtName = parts[1];
          const status = parts[2] || 'Coming Soon';
          const displayOrder = parseInt(parts[3]) || 0;

          // Resolve State
          let matchedState = states.find(s => s.name.toLowerCase() === stateName.toLowerCase());
          let stateId;
          if (!matchedState) {
            const res = await addState(stateName);
            if (res.data && res.data[0]) {
              stateId = res.data[0].id;
            } else {
              continue;
            }
          } else {
            stateId = matchedState.id;
          }

          // Resolve District
          let matchedCity = cities.find(c => 
            c.name.toLowerCase() === districtName.toLowerCase() && 
            (c.region || '').toLowerCase() === stateName.toLowerCase()
          );

          if (matchedCity) {
            await updateDistrict(matchedCity.id, {
              status,
              display_order: displayOrder
            });
          } else {
            await addDistrict(stateId, stateName, districtName, status);
          }
          importCount++;
        }
        showToast(`Successfully imported ${importCount} states/districts!`, 'success');
      } catch (err) {
        console.error(err);
        showToast("Error parsing or loading CSV data.", 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = null; // Reset file input
  };

  return (
    <div className="space-y-8 text-slate-700">
      
      {/* Top Console Action Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Location Management</h2>
          <p className="text-slate-400 text-xs font-semibold mt-0.5">Control live states, operating districts, bulk imports, and service coverages.</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={handleExport}
            className="btn-secondary text-[11px] font-bold px-3 py-2 rounded-xl flex items-center gap-1.5"
          >
            <Download size={13} /> Export CSV/Excel
          </button>
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="btn-secondary text-[11px] font-bold px-3 py-2 rounded-xl flex items-center gap-1.5"
          >
            <Upload size={13} /> Import CSV/Excel
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleImport} 
            accept=".csv" 
            className="hidden" 
          />
        </div>
      </div>

      {/* Main Double Grid: States & Districts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: State Panel */}
        <div className="lg:col-span-5 bg-slate-50 border border-slate-200/60 p-5 rounded-2xl space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-1">
              <span>📍 States</span>
              <span className="text-[10px] text-slate-400 bg-slate-200/60 px-1.5 py-0.5 rounded-full font-bold">
                {states.length}
              </span>
            </h3>
            <button 
              onClick={() => setSortStateAsc(!sortStateAsc)} 
              className="text-slate-400 hover:text-primary transition-colors cursor-pointer"
            >
              <ArrowUpDown size={14} />
            </button>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-3 text-slate-400" size={14} />
            <input 
              type="text" 
              placeholder="Search states..." 
              value={stateSearch}
              onChange={(e) => setStateSearch(e.target.value)}
              className="w-full h-9 pl-9 pr-3 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 outline-none focus:border-primary/50 transition-all placeholder-slate-400"
            />
          </div>

          {/* Add State Form */}
          <form onSubmit={handleAddState} className="flex gap-2">
            <input 
              type="text" 
              placeholder="New State Name (e.g. Jharkhand)" 
              value={newStateName}
              onChange={(e) => setNewStateName(e.target.value)}
              className="flex-1 h-9 px-3 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 outline-none focus:border-primary/50 transition-all"
            />
            <button 
              type="submit" 
              className="h-9 w-9 bg-primary text-white hover:bg-primary-dark transition-colors rounded-lg flex items-center justify-center shrink-0 cursor-pointer"
            >
              <Plus size={16} />
            </button>
          </form>

          {/* States Scroll List */}
          <div className="max-h-[300px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
            {filteredStates.length === 0 ? (
              <p className="text-center text-slate-400 text-xs py-8 font-medium">No states found.</p>
            ) : (
              filteredStates.map(s => {
                const isSelected = selectedStateId === s.id;
                const isEditing = editingStateId === s.id;

                return (
                  <div 
                    key={s.id}
                    onClick={() => {
                      if (!isEditing) {
                        setSelectedStateId(s.id);
                        setSelectedCityId('');
                      }
                    }}
                    className={`p-3 rounded-xl border flex flex-col gap-2 transition-all cursor-pointer ${
                      isSelected 
                        ? 'bg-white border-primary/50 shadow-md shadow-primary/5' 
                        : 'bg-white border-slate-100 hover:border-slate-300 shadow-sm'
                    }`}
                  >
                    {isEditing ? (
                      <div className="flex flex-col gap-2" onClick={(e) => e.stopPropagation()}>
                        <div className="flex gap-2">
                          <input 
                            type="text" 
                            value={editingStateName}
                            onChange={(e) => setEditingStateName(e.target.value)}
                            className="flex-1 h-8 px-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 outline-none focus:border-primary/50"
                          />
                          <input 
                            type="number" 
                            value={editingStateOrder}
                            onChange={(e) => setEditingStateOrder(e.target.value)}
                            placeholder="Sort order"
                            className="w-16 h-8 px-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 outline-none text-center"
                          />
                        </div>
                        <div className="flex justify-end gap-1.5">
                          <button 
                            onClick={() => setEditingStateId('')}
                            className="p-1 px-2 text-[10px] border border-slate-200 text-slate-650 hover:bg-slate-50 rounded-md font-bold transition-all cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button 
                            onClick={() => handleSaveStateEdit(s.id)}
                            className="p-1 px-2 text-[10px] btn-primary rounded-md font-bold transition-all cursor-pointer"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-between items-center gap-3">
                        <div className="space-y-0.5">
                          <h4 className="font-extrabold text-slate-800 text-xs">{s.name}</h4>
                          <div className="flex items-center gap-1.5">
                            <span className={`text-[8px] font-extrabold uppercase px-1 py-0.2 rounded-md ${
                              s.status === 'Live' ? 'bg-green-50 text-green-700' : 'bg-rose-50 text-rose-700'
                            }`}>
                              {s.status}
                            </span>
                            <span className="text-[9px] text-slate-400 font-bold">Order: {s.display_order}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <button 
                            onClick={() => {
                              setEditingStateId(s.id);
                              setEditingStateName(s.name);
                              setEditingStateOrder(s.display_order);
                            }}
                            className="p-1.5 text-slate-400 hover:text-primary transition-colors cursor-pointer"
                            title="Edit State"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button 
                            onClick={() => handleToggleStateStatus(s)}
                            className={`p-1 px-2 rounded-lg text-[9px] font-extrabold uppercase tracking-wide transition-all cursor-pointer ${
                              s.status === 'Live' ? 'bg-rose-50 hover:bg-rose-100/60 text-rose-700' : 'bg-green-50 hover:bg-green-100/60 text-green-700'
                            }`}
                          >
                            {s.status === 'Live' ? 'Disable' : 'Enable'}
                          </button>
                          <button 
                            onClick={() => handleDeleteStateClick(s.id)}
                            className="p-1.5 text-slate-450 hover:text-red-650 transition-colors cursor-pointer"
                            title="Delete State"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: District Panel */}
        <div className="lg:col-span-7 bg-slate-50 border border-slate-200/60 p-5 rounded-2xl space-y-4">
          {selectedStateId ? (
            <>
              <div className="flex justify-between items-center">
                <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-1">
                  <span>🏢 Operating Districts in {activeState?.name}</span>
                  <span className="text-[10px] text-slate-400 bg-slate-200/60 px-1.5 py-0.5 rounded-full font-bold">
                    {filteredDistricts.length}
                  </span>
                </h3>
                <button 
                  onClick={() => setSortDistrictAsc(!sortDistrictAsc)} 
                  className="text-slate-400 hover:text-primary transition-colors cursor-pointer"
                >
                  <ArrowUpDown size={14} />
                </button>
              </div>

              {/* Search bar */}
              <div className="relative">
                <Search className="absolute left-3 top-3 text-slate-400" size={14} />
                <input 
                  type="text" 
                  placeholder={`Search districts in ${activeState?.name}...`} 
                  value={districtSearch}
                  onChange={(e) => setDistrictSearch(e.target.value)}
                  className="w-full h-9 pl-9 pr-3 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 outline-none focus:border-primary/50 transition-all placeholder-slate-400"
                />
              </div>

              {/* Add District Form */}
              <form onSubmit={handleAddDistrict} className="flex gap-2 items-center">
                <input 
                  type="text" 
                  placeholder="New District Name (e.g. Ranchi)" 
                  value={newDistrictName}
                  onChange={(e) => setNewDistrictName(e.target.value)}
                  className="flex-1 h-9 px-3 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 outline-none focus:border-primary/50 transition-all"
                />
                <select
                  value={newDistrictStatus}
                  onChange={(e) => setNewDistrictStatus(e.target.value)}
                  className="h-9 px-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 outline-none cursor-pointer"
                >
                  <option value="Live">Live</option>
                  <option value="Coming Soon">Coming Soon</option>
                  <option value="Disabled">Disabled</option>
                </select>
                <button 
                  type="submit" 
                  className="h-9 w-9 bg-primary text-white hover:bg-primary-dark transition-colors rounded-lg flex items-center justify-center shrink-0 cursor-pointer"
                >
                  <Plus size={16} />
                </button>
              </form>

              {/* Districts Scroll List */}
              <div className="max-h-[300px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                {filteredDistricts.length === 0 ? (
                  <p className="text-center text-slate-400 text-xs py-8 font-medium">No districts found for this state.</p>
                ) : (
                  filteredDistricts.map(d => {
                    const isSelected = selectedCityId === d.id;
                    const isEditing = editingCityId === d.id;

                    return (
                      <div 
                        key={d.id}
                        onClick={() => {
                          if (!isEditing) {
                            setSelectedCityId(d.id);
                          }
                        }}
                        className={`p-3 rounded-xl border flex flex-col gap-2 transition-all cursor-pointer ${
                          isSelected 
                            ? 'bg-white border-primary/50 shadow-md shadow-primary/5' 
                            : 'bg-white border-slate-100 hover:border-slate-300 shadow-sm'
                        }`}
                      >
                        {isEditing ? (
                          <div className="flex flex-col gap-2" onClick={(e) => e.stopPropagation()}>
                            <div className="flex gap-2">
                              <input 
                                type="text" 
                                value={editingCityName}
                                onChange={(e) => setEditingCityName(e.target.value)}
                                className="flex-1 h-8 px-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 outline-none focus:border-primary/50"
                              />
                              <select
                                value={editingCityStatus}
                                onChange={(e) => setEditingCityStatus(e.target.value)}
                                className="h-8 px-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 outline-none"
                              >
                                <option value="Live">Live</option>
                                <option value="Coming Soon">Coming Soon</option>
                                <option value="Disabled">Disabled</option>
                              </select>
                              <input 
                                type="number" 
                                value={editingCityOrder}
                                onChange={(e) => setEditingCityOrder(e.target.value)}
                                className="w-16 h-8 px-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 outline-none text-center"
                              />
                            </div>
                            <div className="flex justify-end gap-1.5">
                              <button 
                                onClick={() => setEditingCityId('')}
                                className="p-1 px-2 text-[10px] border border-slate-200 text-slate-650 hover:bg-slate-50 rounded-md font-bold transition-all cursor-pointer"
                              >
                                Cancel
                              </button>
                              <button 
                                onClick={() => handleSaveDistrictEdit(d.id)}
                                className="p-1 px-2 text-[10px] btn-primary rounded-md font-bold transition-all cursor-pointer"
                              >
                                Save
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex justify-between items-center gap-3">
                            <div className="space-y-0.5">
                              <h4 className="font-extrabold text-slate-800 text-xs">{d.name}</h4>
                              <div className="flex items-center gap-1.5">
                                <span className={`text-[8px] font-extrabold uppercase px-1 py-0.2 rounded-md ${
                                  d.status === 'Live' 
                                    ? 'bg-green-50 text-green-700 border border-green-150' 
                                    : d.status === 'Coming Soon'
                                      ? 'bg-amber-50 text-amber-700 border border-amber-150'
                                      : 'bg-rose-50 text-rose-700 border border-rose-150'
                                }`}>
                                  {d.status}
                                </span>
                                <span className="text-[9px] text-slate-400 font-bold font-semibold">Order: {d.display_order}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                              {d.status === 'Coming Soon' && (
                                <button 
                                  onClick={() => handleOneClickLaunch(d)}
                                  className="btn-primary text-[8px] font-black uppercase tracking-wider px-2 py-1.5 rounded-lg flex items-center gap-0.5"
                                  title="Launch District Live"
                                >
                                  🚀 Launch Live
                                </button>
                              )}
                              <button 
                                onClick={() => {
                                  setEditingCityId(d.id);
                                  setEditingCityName(d.name);
                                  setEditingCityOrder(d.display_order);
                                  setEditingCityStatus(d.status);
                                }}
                                className="p-1.5 text-slate-400 hover:text-primary transition-colors cursor-pointer"
                                title="Edit District"
                              >
                                <Edit2 size={13} />
                              </button>
                              <button 
                                onClick={() => handleDeleteDistrictClick(d.id)}
                                className="p-1.5 text-slate-450 hover:text-red-650 transition-colors cursor-pointer"
                                title="Delete District"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-20">
              <MapPin size={36} className="mx-auto text-slate-300 mb-3" />
              <h4 className="font-bold text-slate-700 text-sm uppercase tracking-wider">Select a State</h4>
              <p className="text-slate-400 text-xs mt-1 max-w-xs mx-auto font-medium">Please select a state from the left column to view, add, or manage operating districts.</p>
            </div>
          )}
        </div>

      </div>

      {/* LOWER PANEL: Service Control & Analytics (Visible only when district is selected) */}
      {selectedCityId && activeCity && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-fade-in">
          
          {/* Service Control ON/OFF Toggles */}
          <div className="lg:col-span-6 bg-white border border-slate-150 p-6 rounded-2xl shadow-sm space-y-4">
            <h3 className="font-extrabold text-slate-900 text-sm border-b border-slate-100 pb-3 flex items-center gap-1.5">
              <Briefcase size={16} className="text-primary" />
              <span>Service Control: {activeCity.name}</span>
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[350px] overflow-y-auto pr-1 custom-scrollbar">
              {services.map(s => {
                const isEnabled = cityControl[activeCity.id] && cityControl[activeCity.id][s.id] === true;
                
                return (
                  <div 
                    key={s.id}
                    className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between shadow-sm"
                  >
                    <div>
                      <h4 className="font-extrabold text-slate-800 text-xs">{s.name}</h4>
                      <span className="text-[9px] text-slate-400 font-bold">{s.category}</span>
                    </div>
                    
                    {/* Toggle Switch */}
                    <button
                      onClick={() => toggleServiceInCity(activeCity.id, s.id, !isEnabled)}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-0 ${
                        isEnabled ? 'bg-primary' : 'bg-slate-200'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          isEnabled ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* District Analytics Dashboard */}
          <div className="lg:col-span-6 bg-white border border-slate-150 p-6 rounded-2xl shadow-sm space-y-4">
            <h3 className="font-extrabold text-slate-900 text-sm border-b border-slate-100 pb-3 flex items-center gap-1.5">
              <TrendingUp size={16} className="text-primary" />
              <span>District Dashboard: {activeCity.name}</span>
            </h3>

            {districtStats && (
              <div className="grid grid-cols-2 gap-4">
                
                {/* Workers count */}
                <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl flex items-center gap-3">
                  <div className="h-10 w-10 bg-blue-50 text-blue-650 rounded-xl flex items-center justify-center">
                    <Users size={18} />
                  </div>
                  <div>
                    <span className="block text-[8px] font-extrabold text-slate-400 uppercase tracking-wide">Workers</span>
                    <span className="text-sm font-black text-slate-850 block">{districtStats.workersCount}</span>
                  </div>
                </div>

                {/* Contractors count */}
                <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl flex items-center gap-3">
                  <div className="h-10 w-10 bg-indigo-50 text-indigo-650 rounded-xl flex items-center justify-center">
                    <Briefcase size={18} />
                  </div>
                  <div>
                    <span className="block text-[8px] font-extrabold text-slate-400 uppercase tracking-wide">Contractors</span>
                    <span className="text-sm font-black text-slate-850 block">{districtStats.contractorsCount}</span>
                  </div>
                </div>

                {/* Active Services */}
                <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl flex items-center gap-3">
                  <div className="h-10 w-10 bg-green-50 text-green-650 rounded-xl flex items-center justify-center">
                    <CheckCircle size={18} />
                  </div>
                  <div>
                    <span className="block text-[8px] font-extrabold text-slate-400 uppercase tracking-wide">Active Services</span>
                    <span className="text-sm font-black text-slate-850 block">{districtStats.activeServicesCount} / {services.length}</span>
                  </div>
                </div>

                {/* Bookings */}
                <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl flex items-center gap-3">
                  <div className="h-10 w-10 bg-purple-50 text-purple-650 rounded-xl flex items-center justify-center">
                    <Calendar size={18} />
                  </div>
                  <div>
                    <span className="block text-[8px] font-extrabold text-slate-400 uppercase tracking-wide">Bookings</span>
                    <span className="text-sm font-black text-slate-850 block">{districtStats.bookingsCount}</span>
                  </div>
                </div>

                {/* Average rating */}
                <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl flex items-center gap-3">
                  <div className="h-10 w-10 bg-amber-50 text-amber-500 rounded-xl flex items-center justify-center">
                    <Star size={18} fill="currentColor" />
                  </div>
                  <div>
                    <span className="block text-[8px] font-extrabold text-slate-400 uppercase tracking-wide">Avg Rating</span>
                    <span className="text-sm font-black text-slate-850 block">{districtStats.rating} ⭐</span>
                  </div>
                </div>

                {/* Revenue */}
                <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl flex items-center gap-3 col-span-2 sm:col-span-1">
                  <div className="h-10 w-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                    <span className="text-base font-black">₹</span>
                  </div>
                  <div>
                    <span className="block text-[8px] font-extrabold text-slate-400 uppercase tracking-wide">Revenue Generated</span>
                    <span className="text-sm font-black text-slate-850 block">₹{districtStats.revenue}</span>
                  </div>
                </div>

                {/* Coverage Requests */}
                <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl flex items-center gap-3">
                  <div className="h-10 w-10 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center">
                    <AlertTriangle size={18} />
                  </div>
                  <div>
                    <span className="block text-[8px] font-extrabold text-slate-400 uppercase tracking-wide">Coverage Requests</span>
                    <span className="text-sm font-black text-slate-850 block">{districtStats.requestsCount}</span>
                  </div>
                </div>

                {/* Registered Customers */}
                <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl flex items-center gap-3">
                  <div className="h-10 w-10 bg-teal-50 text-teal-650 rounded-xl flex items-center justify-center">
                    <Users size={18} />
                  </div>
                  <div>
                    <span className="block text-[8px] font-extrabold text-slate-400 uppercase tracking-wide">Customers</span>
                    <span className="text-sm font-black text-slate-850 block">{districtStats.customersCount}</span>
                  </div>
                </div>

              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
};

export default LocationManagementPanel;
