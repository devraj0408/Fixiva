import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart3, Users, Briefcase, FileText,
  MessageCircle, Settings, CheckCircle, Clock,
  ShieldCheck, IndianRupee, MapPin, CheckSquare,
  HelpCircle, LogOut, Award, ShieldAlert, TrendingUp, DollarSign
} from 'lucide-react';
import { useApp } from '../../context/AuthContext';
import { supabase } from '../../lib/supabaseClient';

const AdminDashboard = () => {
  const {
    bookings, workers, contractors, tickets,
    services, updateServicePrice, updateWorkerStatus,
    updateContractorStatus, updateBookingStatus, updateTicketStatus,
    refreshData, logout
  } = useApp();

  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const tabParam = searchParams.get('tab');

  const [activeTab, setActiveTab] = useState(tabParam || 'overview');
  const [priceInputs, setPriceInputs] = useState({});
  const [citiesList, setCitiesList] = useState([]);
  const [allProfiles, setAllProfiles] = useState([]);
  
  // City creation
  const [newCityName, setNewCityName] = useState('');
  const [newCityRegion, setNewCityRegion] = useState('');

  // Sync tab param from URL
  useEffect(() => {
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  useEffect(() => {
    const fetchData = async () => {
      const { data: cData } = await supabase.from('cities').select('*');
      if (cData) setCitiesList(cData);

      const { data: pData } = await supabase.from('profiles').select('*');
      if (pData) setAllProfiles(pData);
    };
    fetchData();
  }, [bookings, workers, contractors]);

  const handlePriceChange = (id, field, value) => {
    setPriceInputs(prev => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
  };

  const savePrice = async (id, originalBase, originalPlatform) => {
    const base = priceInputs[id]?.base ?? originalBase;
    const platform = priceInputs[id]?.platform ?? originalPlatform;
    await updateServicePrice(id, base, platform);
    await refreshData();
  };

  const handleAssignWorker = async (bookingId, workerId) => {
    if (!workerId) return;
    const worker = workers.find(w => w.id === workerId);
    if (!worker) return;

    const { error } = await supabase.from('bookings').update({
      worker_id: worker.id,
      worker_name: worker.name,
      worker_phone: worker.phone,
      status: 'Assigned'
    }).eq('id', bookingId);

    if (!error) {
      alert(`Assigned ${worker.name} to booking.`);
      await refreshData();
    } else {
      alert("Failed to assign worker: " + error.message);
    }
  };

  const handleAddCity = async (e) => {
    e.preventDefault();
    if (!newCityName || !newCityRegion) return;
    const { error } = await supabase.from('cities').insert({
      name: newCityName,
      region: newCityRegion
    });
    if (!error) {
      alert('City added successfully!');
      setNewCityName('');
      setNewCityRegion('');
      // Refresh cities
      const { data } = await supabase.from('cities').select('*');
      if (data) setCitiesList(data);
      await refreshData();
    } else {
      alert('Error adding city: ' + error.message);
    }
  };

  // Stats computation
  const pendingBookings = bookings.filter(b => b.status === 'New Request').length;
  const completedBookings = bookings.filter(b => b.status === 'Completed').length;
  const pendingWorkers = workers.filter(w => w.status === 'Pending Verification' && !w.isContractor).length;
  const pendingContractors = contractors.filter(c => c.status === 'Pending Approval').length;
  const openTickets = tickets.filter(t => t.status === 'Open' || t.status === 'In Progress').length;

  // Revenues (Revenue Protection)
  const validBookings = bookings.filter(b => b.status !== 'Cancelled');
  const expectedRevenue = validBookings.reduce((acc, curr) => acc + Number(curr.price || 0) + Number(curr.platform_fee || 0), 0);
  const collectedRevenue = bookings.filter(b => b.status === 'Completed').reduce((acc, curr) => acc + Number(curr.price || 0) + Number(curr.platform_fee || 0), 0);
  const outstandingRevenue = expectedRevenue - collectedRevenue;
  
  const expectedCommission = validBookings.reduce((acc, curr) => acc + Number(curr.platform_fee || 0), 0);
  const collectedCommission = bookings.filter(b => b.status === 'Completed').reduce((acc, curr) => acc + Number(curr.platform_fee || 0), 0);
  const outstandingCommission = expectedCommission - collectedCommission;

  const stats = [
    { label: 'Pending Bookings', value: pendingBookings, icon: <Clock className="text-warning" />, color: 'bg-amber-50 text-warning' },
    { label: 'Completed Jobs', value: completedBookings, icon: <CheckCircle className="text-success" />, color: 'bg-green-50 text-success' },
    { label: 'Worker Approvals', value: pendingWorkers, icon: <ShieldCheck className="text-primary" />, color: 'bg-blue-50 text-primary' },
    { label: 'Support Tickets', value: openTickets, icon: <MessageCircle className="text-danger" />, color: 'bg-red-50 text-danger' },
  ];

  const handleLogoutClick = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Sidebar Navigation */}
        <aside className="lg:col-span-3 space-y-6">
          {/* Profile Card */}
          <div className="bg-slate-900 rounded-3xl p-6 text-center space-y-4 shadow-sm text-white">
            <div className="h-14 w-14 mx-auto rounded-xl bg-gradient-to-tr from-primary to-blue-500 text-white font-extrabold text-lg flex items-center justify-center uppercase shadow-md">
              A
            </div>
            <div className="space-y-0.5">
              <h3 className="font-extrabold text-sm leading-tight text-white">Fixora Operations Desk</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Super Administrator</p>
            </div>
          </div>

          {/* Navigation Options */}
          <nav className="bg-white rounded-3xl border border-slate-100 p-3 shadow-sm flex flex-col gap-1 text-slate-600 text-xs">
            <button 
              onClick={() => { setActiveTab('overview'); navigate(`${location.pathname}?tab=overview`); }}
              className={`flex items-center gap-2.5 p-3 rounded-xl ${
                activeTab === 'overview' ? 'btn-primary shadow-md' : 'btn-secondary'
              }`}
            >
              <BarChart3 size={16} /> Hub Overview
            </button>
            <button 
              onClick={() => { setActiveTab('bookings'); navigate(`${location.pathname}?tab=bookings`); }}
              className={`flex items-center gap-2.5 p-3 rounded-xl ${
                activeTab === 'bookings' ? 'btn-primary shadow-md' : 'btn-secondary'
              }`}
            >
              <FileText size={16} /> Dispatch Board
            </button>
            <button 
              onClick={() => { setActiveTab('users'); navigate(`${location.pathname}?tab=users`); }}
              className={`flex items-center gap-2.5 p-3 rounded-xl ${
                activeTab === 'users' ? 'btn-primary shadow-md' : 'btn-secondary'
              }`}
            >
              <Users size={16} /> Directory List
            </button>
            <button 
              onClick={() => { setActiveTab('verification'); navigate(`${location.pathname}?tab=verification`); }}
              className={`flex items-center gap-2.5 p-3 rounded-xl ${
                activeTab === 'verification' ? 'btn-primary shadow-md' : 'btn-secondary'
              }`}
            >
              <ShieldCheck size={16} /> Verifications
            </button>
            <button 
              onClick={() => { setActiveTab('pricing'); navigate(`${location.pathname}?tab=pricing`); }}
              className={`flex items-center gap-2.5 p-3 rounded-xl ${
                activeTab === 'pricing' ? 'btn-primary shadow-md' : 'btn-secondary'
              }`}
            >
              <IndianRupee size={16} /> Tariffs & Cities
            </button>
            <button 
              onClick={() => { setActiveTab('tickets'); navigate(`${location.pathname}?tab=tickets`); }}
              className={`flex items-center gap-2.5 p-3 rounded-xl ${
                activeTab === 'tickets' ? 'btn-primary shadow-md' : 'btn-secondary'
              }`}
            >
              <MessageCircle size={16} /> Resolve Tickets
            </button>
            <button 
              onClick={() => { setActiveTab('revenue'); navigate(`${location.pathname}?tab=revenue`); }}
              className={`flex items-center gap-2.5 p-3 rounded-xl ${
                activeTab === 'revenue' ? 'btn-primary shadow-md' : 'btn-secondary'
              }`}
            >
              <TrendingUp size={16} /> Finance Ledger
            </button>
            <div className="h-px bg-slate-100 my-2"></div>
            <button 
              onClick={handleLogoutClick}
              className="flex items-center gap-2.5 p-3 rounded-xl btn-danger"
            >
              <LogOut size={16} /> Logout
            </button>
          </nav>
        </aside>

        {/* Main Work panel */}
        <main className="lg:col-span-9 bg-white rounded-3xl border border-slate-100 p-8 shadow-sm min-h-[550px]">
          <AnimatePresence mode="wait">
            
            {activeTab === 'overview' && (
              <motion.div 
                key="overview"
                className="space-y-8"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <h2 className="text-xl font-black text-slate-900 tracking-tight border-b pb-4">Operations Hub Overview</h2>

                {/* Metrics */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {stats.map((stat, idx) => (
                    <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
                      <div className={`p-2.5 rounded-xl shrink-0 ${stat.color}`}>{stat.icon}</div>
                      <div className="space-y-0.5">
                        <span className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">{stat.label}</span>
                        <span className="text-xl font-black text-slate-900 block">{stat.value || 0}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Dispatcher checklist */}
                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-4">
                    <h3 className="font-extrabold text-slate-800 text-sm">Dispatches Pending Assignee</h3>
                    {bookings.filter(b => b.status === 'New Request').length === 0 ? (
                      <p className="text-slate-400 text-xs font-semibold text-center py-8">No requests currently in pipeline.</p>
                    ) : (
                      <div className="space-y-3">
                        {bookings.filter(b => b.status === 'New Request').map(b => (
                          <div key={b.id} className="p-4 bg-white border border-slate-100 rounded-xl space-y-3 text-xs font-semibold text-slate-600 shadow-sm">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-extrabold text-slate-800 text-sm">{b.service_name}</h4>
                                <p className="text-[10px] text-slate-400 font-bold">{b.city} • Customer: {b.customer_name}</p>
                              </div>
                            </div>
                            <select 
                              className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-primary outline-none cursor-pointer"
                              onChange={(e) => handleAssignWorker(b.id, e.target.value)}
                              defaultValue=""
                            >
                              <option value="" disabled>Assign verified specialist...</option>
                              {workers.filter(w => w.status === 'Verified' && w.city === b.city).map(w => (
                                <option key={w.id} value={w.id}>{w.name} ({w.skills})</option>
                              ))}
                            </select>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Verifications checklist */}
                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-4">
                    <h3 className="font-extrabold text-slate-800 text-sm">Approvals Queue Alert</h3>
                    {pendingWorkers + pendingContractors === 0 ? (
                      <p className="text-slate-400 text-xs font-semibold text-center py-8">Verification directory queue is empty.</p>
                    ) : (
                      <div className="space-y-2">
                        {workers.filter(w => w.status === 'Pending Verification' && !w.isContractor).map(w => (
                          <div key={w.id} className="p-3 bg-white border border-slate-100 rounded-xl text-xs font-semibold flex justify-between items-center shadow-sm">
                            <span className="text-slate-700">Worker: {w.name} ({w.skills})</span>
                            <button onClick={() => updateWorkerStatus(w.id, 'Verified')} className="btn-success text-[10px] px-2.5 py-1 rounded-lg shadow-sm font-bold">Verify</button>
                          </div>
                        ))}
                        {contractors.filter(c => c.status === 'Pending Approval').map(c => (
                          <div key={c.id} className="p-3 bg-white border border-slate-100 rounded-xl text-xs font-semibold flex justify-between items-center shadow-sm">
                            <span className="text-slate-700">Contractor: {c.company}</span>
                            <button onClick={() => updateContractorStatus(c.id, 'Approved')} className="btn-success text-[10px] px-2.5 py-1 rounded-lg shadow-sm font-bold">Approve</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'bookings' && (
              <motion.div 
                key="bookings"
                className="space-y-6"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <h2 className="text-xl font-black text-slate-900 border-b pb-4">System Dispatch Board</h2>
                <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                  {bookings.length === 0 ? (
                    <p className="p-8 text-center text-slate-400 font-semibold text-xs">No bookings logged in database.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs font-semibold text-slate-600">
                        <thead>
                          <tr className="bg-slate-50 text-slate-400 text-[10px] uppercase tracking-wider border-b border-slate-100">
                            <th className="p-4">Booking ID</th>
                            <th className="p-4">Customer</th>
                            <th className="p-4">Service Type</th>
                            <th className="p-4">Scheduled</th>
                            <th className="p-4">Assigned Partner</th>
                            <th className="p-4">Status</th>
                            <th className="p-4">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {bookings.map(b => (
                            <tr key={b.id} className="hover:bg-slate-50/50">
                              <td className="p-4 font-bold text-primary">{b.id}</td>
                              <td className="p-4">
                                <p className="font-bold text-slate-900">{b.customer_name}</p>
                                <p className="text-[10px] text-slate-400 mt-0.5">{b.customer_phone}</p>
                              </td>
                              <td className="p-4">{b.service_name}</td>
                              <td className="p-4">{new Date(b.booking_date || b.preferred_date).toLocaleDateString()}</td>
                              <td className="p-4">
                                {b.worker_id ? (
                                  <div>
                                    <p className="font-bold text-slate-900">{b.worker_name}</p>
                                    <p className="text-[10px] text-slate-400 mt-0.5">{b.worker_phone}</p>
                                  </div>
                                ) : (
                                  <select 
                                    className="text-xs p-1.5 bg-slate-50 border border-slate-200 rounded-lg font-bold text-primary cursor-pointer outline-none"
                                    onChange={(e) => handleAssignWorker(b.id, e.target.value)}
                                    defaultValue=""
                                  >
                                    <option value="" disabled>Assign...</option>
                                    {workers.filter(w => w.status === 'Verified' && w.city === b.city).map(w => (
                                      <option key={w.id} value={w.id}>{w.name}</option>
                                    ))}
                                  </select>
                                )}
                              </td>
                              <td className="p-4">
                                <span className={`px-2 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${
                                  b.status === 'Completed' ? 'bg-green-50 text-success' : 'bg-amber-50 text-warning'
                                }`}>
                                  {b.status === 'Confirmed' ? 'Accepted' : b.status}
                                </span>
                              </td>
                              <td className="p-4">
                                <select
                                  onChange={(e) => updateBookingStatus(b.id, e.target.value)}
                                  value={b.status}
                                  className="text-xs p-1.5 bg-white border border-slate-200 rounded-lg font-semibold text-slate-700 outline-none cursor-pointer"
                                >
                                  <option value="New Request">New Request</option>
                                  <option value="Assigned">Assigned</option>
                                  <option value="Confirmed">Confirmed</option>
                                  <option value="In Progress">In Progress</option>
                                  <option value="Completed">Completed</option>
                                  <option value="Cancelled">Cancelled</option>
                                  <option value="Worker No Show">Worker No Show</option>
                                  <option value="Customer No Show">Customer No Show</option>
                                </select>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'users' && (
              <motion.div 
                key="users"
                className="space-y-6"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <h2 className="text-xl font-black text-slate-900 border-b pb-4">Directory Registry</h2>
                <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                  <table className="w-full text-left border-collapse text-xs font-semibold text-slate-600">
                    <thead>
                      <tr className="bg-slate-50 text-slate-400 text-[10px] uppercase tracking-wider border-b border-slate-100">
                        <th className="p-4">User ID</th>
                        <th className="p-4">Name</th>
                        <th className="p-4">Email Address</th>
                        <th className="p-4">Account Role</th>
                        <th className="p-4">Registered On</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {allProfiles.map(p => (
                        <tr key={p.id} className="hover:bg-slate-50/50">
                          <td className="p-4 text-slate-400 font-mono">{p.id.substring(0, 8)}...</td>
                          <td className="p-4 font-bold text-slate-900">{p.name}</td>
                          <td className="p-4">{p.email}</td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                              p.role === 'customer' ? 'bg-blue-50 text-primary' :
                              p.role === 'worker' ? 'bg-amber-50 text-warning' :
                              'bg-purple-50 text-purple-600'
                            }`}>
                              {p.role}
                            </span>
                          </td>
                          <td className="p-4">{new Date(p.created_at).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {activeTab === 'verification' && (
              <motion.div 
                key="verification"
                className="space-y-6"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <h2 className="text-xl font-black text-slate-900 border-b pb-4">Verification Registry</h2>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Workers Verifications */}
                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-4">
                    <h3 className="font-extrabold text-slate-800 text-sm">Workers Verification Alerts</h3>
                    {workers.filter(w => w.status === 'Pending Verification' && !w.isContractor).length === 0 ? (
                      <p className="text-slate-400 text-xs font-semibold text-center py-10">Verification queue is empty.</p>
                    ) : (
                      <div className="space-y-4">
                        {workers.filter(w => w.status === 'Pending Verification' && !w.isContractor).map(w => (
                          <div key={w.id} className="bg-white p-4 border border-slate-100 rounded-xl space-y-2 text-xs font-semibold text-slate-600 shadow-sm">
                            <p className="text-sm font-bold text-slate-850">{w.name}</p>
                            <p><strong>Phone:</strong> {w.phone} • {w.email}</p>
                            <p><strong>Skills:</strong> {w.skills} • {w.experience}</p>
                            <p><strong>WhatsApp:</strong> {w.whatsapp}</p>
                            {w.id_proof_url && <p><strong>ID Document:</strong> <a href={w.id_proof_url} target="_blank" rel="noreferrer" className="text-primary font-bold hover:underline">Link</a></p>}
                            <div className="flex gap-2 pt-2 border-t border-slate-100">
                              <button onClick={() => updateWorkerStatus(w.id, 'Verified')} className="flex-1 btn-success text-xs py-2 rounded-lg shadow-sm">Verify Expert</button>
                              <button onClick={() => updateWorkerStatus(w.id, 'Rejected')} className="flex-1 btn-danger text-xs py-2 rounded-lg shadow-sm">Reject</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Contractors Verifications */}
                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-4">
                    <h3 className="font-extrabold text-slate-800 text-sm">Contractor Audits</h3>
                    {contractors.filter(c => c.status === 'Pending Approval').length === 0 ? (
                      <p className="text-slate-400 text-xs font-semibold text-center py-10">No contractors waiting.</p>
                    ) : (
                      <div className="space-y-4">
                        {contractors.filter(c => c.status === 'Pending Approval').map(c => (
                          <div key={c.id} className="bg-white p-4 border border-slate-100 rounded-xl space-y-2 text-xs font-semibold text-slate-600 shadow-sm">
                            <p className="text-sm font-bold text-slate-855">{c.company}</p>
                            <p><strong>Owner:</strong> {c.name} • {c.phone} • {c.email}</p>
                            <p><strong>GSTIN:</strong> {c.gst || 'Not logged'}</p>
                            <p><strong>WhatsApp:</strong> {c.whatsapp}</p>
                            <div className="flex gap-2 pt-2 border-t border-slate-100">
                              <button onClick={() => updateContractorStatus(c.id, 'Approved')} className="flex-1 btn-success text-xs py-2 rounded-lg shadow-sm">Approve Contractor</button>
                              <button onClick={() => updateContractorStatus(c.id, 'Rejected')} className="flex-1 btn-danger text-xs py-2 rounded-lg shadow-sm">Reject</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'pricing' && (
              <motion.div 
                key="pricing"
                className="space-y-6"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <h2 className="text-xl font-black text-slate-900 border-b pb-4">Tariffs & operating regions</h2>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Tariffs List */}
                  <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm lg:col-span-2 space-y-4">
                    <h3 className="font-extrabold text-slate-850 text-sm">Services Tariff Catalog</h3>
                    <table className="w-full text-left border-collapse text-xs font-semibold text-slate-600">
                      <thead>
                        <tr className="bg-slate-50 text-slate-400 text-[10px] uppercase tracking-wider border-b border-slate-100">
                          <th className="p-3">Service</th>
                          <th className="p-3">Base Tariff (₹)</th>
                          <th className="p-3">Convenience Tariff (₹)</th>
                          <th className="p-3">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {services.map(s => (
                          <tr key={s.id}>
                            <td className="p-3 font-bold text-slate-900">{s.name}</td>
                            <td className="p-3">
                              <input 
                                type="number"
                                value={priceInputs[s.id]?.base ?? (s.base_price || 0)} 
                                onChange={(e) => handlePriceChange(s.id, 'base', Number(e.target.value))}
                                className="border border-slate-200 p-1.5 w-24 text-xs font-bold rounded bg-slate-50 focus:border-primary outline-none" 
                              />
                            </td>
                            <td className="p-3">
                              <input 
                                type="number"
                                value={priceInputs[s.id]?.platform ?? (s.platform_fee || 0)} 
                                onChange={(e) => handlePriceChange(s.id, 'platform', Number(e.target.value))}
                                className="border border-slate-200 p-1.5 w-20 text-xs font-bold rounded bg-slate-50 focus:border-primary outline-none" 
                              />
                            </td>
                             <td className="p-3">
                              <button onClick={() => savePrice(s.id, s.base_price || 0, s.platform_fee || 0)} className="btn-primary text-[10px] px-3 py-1.5 rounded-lg shadow-sm uppercase">Save</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Add City and Cities List */}
                  <div className="space-y-6">
                    <form onSubmit={handleAddCity} className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-4 h-fit">
                      <h3 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">Add Service City</h3>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">City Name</label>
                        <input 
                          className="w-full h-11 px-4 bg-white border border-slate-200 focus:border-primary rounded-xl text-xs font-semibold placeholder-slate-400 outline-none"
                          placeholder="e.g. Hyderabad"
                          value={newCityName}
                          onChange={(e) => setNewCityName(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">State / Region</label>
                        <input 
                          className="w-full h-11 px-4 bg-white border border-slate-200 focus:border-primary rounded-xl text-xs font-semibold placeholder-slate-400 outline-none"
                          placeholder="e.g. Telangana"
                          value={newCityRegion}
                          onChange={(e) => setNewCityRegion(e.target.value)}
                          required
                        />
                      </div>
                       <button type="submit" className="w-full btn-primary text-xs py-3 rounded-xl shadow-md flex justify-center items-center">Add City</button>
                    </form>

                    <div className="bg-slate-50 p-6 border border-slate-100 rounded-2xl space-y-3">
                      <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Operating Cities list</h4>
                      <div className="flex flex-wrap gap-2">
                        {citiesList.map(c => (
                          <span key={c.id} className="text-[10px] font-bold bg-white border border-slate-200 py-1 px-2.5 rounded-xl text-slate-500">{c.name}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'tickets' && (
              <motion.div 
                key="tickets"
                className="space-y-6"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <h2 className="text-xl font-black text-slate-900 border-b pb-4">Resolve Support Tickets</h2>
                <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                  {tickets.length === 0 ? (
                    <p className="p-8 text-center text-slate-400 font-semibold text-xs">No active tickets pending resolution.</p>
                  ) : (
                    <table className="w-full text-left border-collapse text-xs font-semibold text-slate-600">
                      <thead>
                        <tr className="bg-slate-50 text-slate-400 text-[10px] uppercase tracking-wider border-b border-slate-100">
                          <th className="p-4">Ticket ID</th>
                          <th className="p-4">Subject</th>
                          <th className="p-4">Details</th>
                          <th className="p-4">Status</th>
                          <th className="p-4">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {tickets.map(t => (
                          <tr key={t.id} className="hover:bg-slate-50/50">
                            <td className="p-4 text-slate-450 font-mono">{t.id.substring(0, 8)}...</td>
                            <td className="p-4 font-bold text-slate-900">{t.subject}</td>
                            <td className="p-4">{t.message}</td>
                            <td className="p-4">
                              <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                                t.status === 'Resolved' ? 'bg-green-50 text-success' : 'bg-amber-50 text-warning'
                              }`}>
                                {t.status}
                              </span>
                            </td>
                             <td className="p-4">
                              {t.status !== 'Resolved' && (
                                <button onClick={() => updateTicketStatus(t.id, 'Resolved')} className="btn-success text-[10px] px-3 py-1.5 rounded-lg shadow-sm font-bold uppercase">Resolve</button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'revenue' && (
              <motion.div 
                key="revenue"
                className="space-y-6"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <h2 className="text-xl font-black text-slate-900 border-b pb-4">System Finance & Commission Ledger</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-slate-50 p-6 border border-slate-100 rounded-2xl text-center space-y-1">
                    <span className="text-[10px] font-black uppercase text-slate-400">Pipeline Payouts Total</span>
                    <h3 className="text-2xl font-black text-primary">₹{expectedRevenue}</h3>
                  </div>
                  <div className="bg-slate-50 p-6 border border-slate-100 rounded-2xl text-center space-y-1">
                    <span className="text-[10px] font-black uppercase text-slate-400">Cash Receipts Collected</span>
                    <h3 className="text-2xl font-black text-success">₹{collectedRevenue}</h3>
                  </div>
                  <div className="bg-slate-50 p-6 border border-slate-100 rounded-2xl text-center space-y-1">
                    <span className="text-[10px] font-black uppercase text-slate-400">Outstanding pipeline</span>
                    <h3 className="text-2xl font-black text-warning">₹{outstandingRevenue}</h3>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-slate-50 p-6 border border-slate-100 rounded-2xl text-center space-y-1">
                    <span className="text-[10px] font-black uppercase text-slate-400">Expected Commission total</span>
                    <h3 className="text-2xl font-black text-primary">₹{expectedCommission}</h3>
                  </div>
                  <div className="bg-slate-50 p-6 border border-slate-100 rounded-2xl text-center space-y-1">
                    <span className="text-[10px] font-black uppercase text-slate-400">Collected Commission</span>
                    <h3 className="text-2xl font-black text-success">₹{collectedCommission}</h3>
                  </div>
                  <div className="bg-slate-50 p-6 border border-slate-100 rounded-2xl text-center space-y-1">
                    <span className="text-[10px] font-black uppercase text-slate-400">Outstanding Platform Due</span>
                    <h3 className="text-2xl font-black text-warning">₹{outstandingCommission}</h3>
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </main>

      </div>
    </div>
  );
};

export default AdminDashboard;
