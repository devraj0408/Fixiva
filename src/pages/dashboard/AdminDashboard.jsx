import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart3, Users, Briefcase, FileText,
  MessageCircle, CheckCircle, Clock,
  ShieldCheck, IndianRupee,
  LogOut, TrendingUp, Sparkles, Zap, MapPin, Trash2
} from 'lucide-react';
import { useApp } from '../../context/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import LocationManagementPanel from '../../components/LocationManagementPanel';

const AdminDashboard = () => {
  const {
    user,
    bookings, workers, contractors, tickets,
    profiles,
    services, updateServicePrice, updateWorkerStatus,
    updateContractorStatus, updateBookingStatus, updateTicketStatus,
    refreshData, logout, showToast,
    createService, updateService, deleteService, updateUserRole,
    coverageRequests, updateCoverageRequestStatus, deleteCoverageRequest,
    confirm
  } = useApp();

  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const tabParam = searchParams.get('tab');

  const activeTab = tabParam || 'overview';
  const [priceInputs, setPriceInputs] = useState({});
  const [citiesList, setCitiesList] = useState([]);
  
  // City creation
  const [newCityName, setNewCityName] = useState('');
  const [newCityRegion, setNewCityRegion] = useState('');

  // Coverage Requests active tab states
  const [covSearch, setCovSearch] = useState('');
  const [covFilter, setCovFilter] = useState('All'); // All, Pending, Planned, Available

  useEffect(() => {
    const fetchData = async () => {
      const { data: cData } = await supabase.from('cities').select('*');
      if (cData) setCitiesList(cData);
    };
    fetchData();
  }, []);

  const handlePriceChange = (id, field, value) => {
    setPriceInputs(prev => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
  };

  const savePrice = async (id, originalBase, originalPlatform) => {
    const base = priceInputs[id]?.base ?? originalBase;
    const platform = priceInputs[id]?.platform ?? originalPlatform;
    await updateServicePrice(id, base, platform);
    await refreshData();
  };

  const handleAddCity = async (e) => {
    e.preventDefault();
    if (!newCityName || !newCityRegion) return;
    const { error } = await supabase.from('cities').insert({
      name: newCityName,
      region: newCityRegion
    });
    if (!error) {
      showToast('City added successfully!', 'success');
      setNewCityName('');
      setNewCityRegion('');
      // Refresh cities
      const { data } = await supabase.from('cities').select('*');
      if (data) setCitiesList(data);
      await refreshData();
    } else {
      showToast('Error adding city: ' + error.message, 'error');
    }
  };

  // Stats computation
  const pendingBookings = bookings.filter(b => b.status === 'New Request').length;
  const completedBookings = bookings.filter(b => b.status === 'Completed').length;
  const pendingWorkers = workers.filter(w => w.status === 'Pending Verification' && !w.isContractor).length;
  const pendingContractors = contractors.filter(c => c.status === 'Pending Approval').length;
  const openTickets = tickets.filter(t => t.status === 'Open' || t.status === 'In Progress').length;
  const verifiedWorkers = workers.filter(w => w.status === 'Verified' && !w.isContractor).length;
  const totalUsers = (profiles || []).length;
  const recentActivity = [...bookings]
    .sort((a, b) => new Date(b.booking_date || b.preferred_date || 0) - new Date(a.booking_date || a.preferred_date || 0))
    .slice(0, 4);

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
    { label: 'Verified Workers', value: verifiedWorkers, icon: <Briefcase className="text-slate-700" />, color: 'bg-slate-100 text-slate-700' },
    { label: 'Registered Users', value: totalUsers, icon: <Users className="text-violet-600" />, color: 'bg-violet-50 text-violet-600' },
  ];

  const quickActions = [
    { label: 'Dispatch queue', tab: 'bookings', desc: 'Assign live bookings with speed' },
    { label: 'Partner verifications', tab: 'verification', desc: 'Approve workers and contractors' },
    { label: 'Pricing & cities', tab: 'pricing', desc: 'Update service tariffs and coverage' },
    { label: 'Support inbox', tab: 'tickets', desc: 'Resolve customer issues quickly' },
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
              {(user?.name || 'A').charAt(0)}
            </div>
            <div className="space-y-0.5">
              <h3 className="font-extrabold text-sm leading-tight text-white">{user?.name || 'Fixiva Operations Desk'}</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{user?.role === 'admin' ? 'Super Administrator' : 'Operations Access'}</p>
            </div>
          </div>

          {/* Navigation Options */}
          <nav className="bg-white rounded-3xl border border-slate-100 p-3 shadow-sm flex flex-col gap-1 text-slate-600 text-xs">
            <button 
              onClick={() => navigate(`${location.pathname}?tab=overview`)}
              className={`flex items-center gap-2.5 p-3 rounded-xl ${
                activeTab === 'overview' ? 'btn-primary shadow-md' : 'btn-secondary'
              }`}
            >
              <BarChart3 size={16} /> Hub Overview
            </button>
            <button 
              onClick={() => navigate(`${location.pathname}?tab=bookings`)}
              className={`flex items-center gap-2.5 p-3 rounded-xl ${
                activeTab === 'bookings' ? 'btn-primary shadow-md' : 'btn-secondary'
              }`}
            >
              <FileText size={16} /> Dispatch Board
            </button>
            <button 
              onClick={() => navigate(`${location.pathname}?tab=users`)}
              className={`flex items-center gap-2.5 p-3 rounded-xl ${
                activeTab === 'users' ? 'btn-primary shadow-md' : 'btn-secondary'
              }`}
            >
              <Users size={16} /> Directory List
            </button>
            <button 
              onClick={() => navigate(`${location.pathname}?tab=verification`)}
              className={`flex items-center gap-2.5 p-3 rounded-xl ${
                activeTab === 'verification' ? 'btn-primary shadow-md' : 'btn-secondary'
              }`}
            >
              <ShieldCheck size={16} /> Verifications
            </button>
            <button 
              onClick={() => navigate(`${location.pathname}?tab=pricing`)}
              className={`flex items-center gap-2.5 p-3 rounded-xl ${
                activeTab === 'pricing' ? 'btn-primary shadow-md' : 'btn-secondary'
              }`}
            >
              <IndianRupee size={16} /> Tariffs & Cities
            </button>
            <button 
              onClick={() => navigate(`${location.pathname}?tab=services`)}
              className={`flex items-center gap-2.5 p-3 rounded-xl ${
                activeTab === 'services' ? 'btn-primary shadow-md' : 'btn-secondary'
              }`}
            >
              <Briefcase size={16} /> Services
            </button>
            <button 
              onClick={() => navigate(`${location.pathname}?tab=tickets`)}
              className={`flex items-center gap-2.5 p-3 rounded-xl ${
                activeTab === 'tickets' ? 'btn-primary shadow-md' : 'btn-secondary'
              }`}
            >
              <MessageCircle size={16} /> Resolve Tickets
            </button>
            <button 
              onClick={() => navigate(`${location.pathname}?tab=coverage`)}
              className={`flex items-center gap-2.5 p-3 rounded-xl ${
                activeTab === 'coverage' ? 'btn-primary shadow-md' : 'btn-secondary'
              }`}
            >
              <MapPin size={16} /> Coverage Requests
            </button>
            <button 
              onClick={() => navigate(`${location.pathname}?tab=locations`)}
              className={`flex items-center gap-2.5 p-3 rounded-xl ${
                activeTab === 'locations' ? 'btn-primary shadow-md' : 'btn-secondary'
              }`}
            >
              <MapPin size={16} /> Location Management
            </button>
            <button 
              onClick={() => navigate(`${location.pathname}?tab=revenue`)}
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
            
            {activeTab === 'locations' && (
              <motion.div 
                key="locations"
                className="space-y-8"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
              >
                <LocationManagementPanel />
              </motion.div>
            )}

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
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
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
                    <h3 className="font-extrabold text-slate-800 text-sm">Auto-Dispatch Queue</h3>
                    {bookings.filter(b => b.status === 'New Request').length === 0 ? (
                      <p className="text-slate-400 text-xs font-semibold text-center py-8">No requests currently in pipeline.</p>
                    ) : (
                      <div className="space-y-3">
                        {bookings.filter(b => b.status === 'New Request').map(b => (
                          <div key={b.id} className="p-4 bg-white border border-slate-100 rounded-xl space-y-2 text-xs font-semibold text-slate-600 shadow-sm">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-extrabold text-slate-800 text-sm">{b.service_name}</h4>
                                <p className="text-[10px] text-slate-400 font-bold">{b.city} • Customer: {b.customer_name}</p>
                              </div>
                            </div>
                            <p className="text-[11px] text-primary font-bold">The platform will auto-assign this booking to the next verified worker in the same city.</p>
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

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-4">
                    <div className="flex items-center gap-2">
                      <Sparkles className="text-primary" size={16} />
                      <h3 className="font-extrabold text-slate-800 text-sm">Quick control panel</h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {quickActions.map((action) => (
                        <button key={action.tab} onClick={() => navigate(`${location.pathname}?tab=${action.tab}`)} className="rounded-2xl border border-slate-200 bg-white p-3 text-left shadow-sm hover:border-primary/40 hover:shadow-md transition-all">
                          <p className="text-xs font-black text-slate-800">{action.label}</p>
                          <p className="mt-1 text-[10px] font-semibold text-slate-500">{action.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-4">
                    <div className="flex items-center gap-2">
                      <Zap className="text-warning" size={16} />
                      <h3 className="font-extrabold text-slate-800 text-sm">Latest live activity</h3>
                    </div>
                    {recentActivity.length === 0 ? (
                      <p className="text-slate-400 text-xs font-semibold py-4">No recent booking activity yet.</p>
                    ) : (
                      <div className="space-y-3">
                        {recentActivity.map((booking) => (
                          <div key={booking.id} className="rounded-2xl border border-slate-200 bg-white p-3">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-xs font-black text-slate-800">{booking.service_name || 'Service Request'}</p>
                              <span className="text-[10px] font-semibold text-slate-500">{booking.status}</span>
                            </div>
                            <p className="mt-1 text-[10px] font-semibold text-slate-500">{booking.customer_name || 'Customer'} • {booking.city || 'Unknown city'}</p>
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
                                  <span className="text-[11px] font-bold text-amber-600">Auto-dispatch pending</span>
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
                        <th className="p-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(profiles || []).map(p => (
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
                          <td className="p-4 space-y-2">
                            <div className="grid gap-2">
                              <button onClick={() => updateUserRole(p.id, 'admin')} className="btn-primary text-[10px] px-3 py-1.5 rounded">Make Admin</button>
                              <button
                                onClick={() => updateUserRole(p.id, 'worker')}
                                className="btn-secondary text-[10px] px-3 py-1.5 rounded"
                                disabled={user?.id === p.id}
                              >
                                Make Worker
                              </button>
                              <button
                                onClick={() => updateUserRole(p.id, 'customer')}
                                className="btn-danger text-[10px] px-3 py-1.5 rounded"
                                disabled={user?.id === p.id}
                              >
                                Make Customer
                              </button>
                            </div>
                          </td>
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

            {activeTab === 'services' && (
              <motion.div 
                key="services"
                className="space-y-6"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <h2 className="text-xl font-black text-slate-900 border-b pb-4">Services Management</h2>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm lg:col-span-2 space-y-4">
                    <h3 className="font-extrabold text-slate-850 text-sm">Existing Services</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs font-semibold text-slate-600">
                        <thead>
                          <tr className="bg-slate-50 text-slate-400 text-[10px] uppercase tracking-wider border-b border-slate-100">
                            <th className="p-3">Name</th>
                            <th className="p-3">Category</th>
                            <th className="p-3">Description</th>
                            <th className="p-3">Base (₹)</th>
                            <th className="p-3">Platform (₹)</th>
                            <th className="p-3">Cities</th>
                            <th className="p-3">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {services.map(s => (
                            <ServiceRow key={s.id} service={s} citiesList={citiesList} onUpdate={updateService} onDelete={deleteService} />
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-4">
                    <h3 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">Create New Service</h3>
                    <CreateServiceForm citiesList={citiesList} onCreate={async (payload) => { await createService(payload); await refreshData(); }} />
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

            {activeTab === 'coverage' && (() => {
              const requestsThisMonth = (coverageRequests || []).filter(r => {
                if (!r.created_at) return false;
                const date = new Date(r.created_at);
                const now = new Date();
                return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
              }).length;

              const cityCounts = {};
              (coverageRequests || []).forEach(r => {
                const key = String(r.city || '').trim();
                if (!key) return;
                cityCounts[key] = (cityCounts[key] || 0) + 1;
              });
              const topCities = Object.entries(cityCounts)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5);

              const stateCounts = {};
              (coverageRequests || []).forEach(r => {
                const key = String(r.state || '').trim();
                if (!key) return;
                stateCounts[key] = (stateCounts[key] || 0) + 1;
              });
              const topStates = Object.entries(stateCounts)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5);

              const recentLocations = [...(coverageRequests || [])]
                .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
                .slice(0, 5);

              const filteredRequests = (coverageRequests || []).filter(r => {
                const matchesFilter = covFilter === 'All' || r.status === covFilter;
                const searchLower = covSearch.toLowerCase();
                const matchesSearch = 
                  String(r.city || '').toLowerCase().includes(searchLower) ||
                  String(r.state || '').toLowerCase().includes(searchLower) ||
                  String(r.email || '').toLowerCase().includes(searchLower);
                return matchesFilter && matchesSearch;
              });

              return (
                <motion.div 
                  key="coverage"
                  className="space-y-8"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <h2 className="text-xl font-black text-slate-900 tracking-tight border-b pb-4">Coverage & Expansion Requests</h2>

                  {/* Analytics Panel */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* KPI Cards */}
                    <div className="bg-slate-50 p-6 border border-slate-100 rounded-2xl flex flex-col justify-between">
                      <div>
                        <span className="text-[10px] font-black uppercase text-slate-400 font-bold">Total Coverage Requests</span>
                        <h3 className="text-3xl font-black text-slate-900 mt-1">{coverageRequests?.length || 0}</h3>
                      </div>
                      <p className="text-slate-500 text-xs mt-4 font-semibold">Accumulated wishlist requests across India</p>
                    </div>
                    
                    <div className="bg-slate-50 p-6 border border-slate-100 rounded-2xl flex flex-col justify-between">
                      <div>
                        <span className="text-[10px] font-black uppercase text-slate-400 font-bold">Requests This Month</span>
                        <h3 className="text-3xl font-black text-slate-900 mt-1">{requestsThisMonth}</h3>
                      </div>
                      <p className="text-slate-500 text-xs mt-4 font-semibold">Active interest during current billing period</p>
                    </div>
                  </div>

                  {/* Insight Lists */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-slate-50 p-5 border border-slate-100 rounded-2xl space-y-4">
                      <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Most Requested Cities</h3>
                      <div className="space-y-2">
                        {topCities.length === 0 ? (
                          <p className="text-xs text-slate-500 font-semibold">No data available</p>
                        ) : (
                          topCities.map(([city, count]) => (
                            <div key={city} className="flex justify-between items-center text-xs p-1">
                              <span className="font-bold text-slate-700">{city}</span>
                              <span className="px-2 py-0.5 bg-slate-200/80 rounded-full font-bold text-slate-600">{count} {count === 1 ? 'req' : 'reqs'}</span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    <div className="bg-slate-50 p-5 border border-slate-100 rounded-2xl space-y-4">
                      <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Most Requested States</h3>
                      <div className="space-y-2">
                        {topStates.length === 0 ? (
                          <p className="text-xs text-slate-500 font-semibold">No data available</p>
                        ) : (
                          topStates.map(([state, count]) => (
                            <div key={state} className="flex justify-between items-center text-xs p-1">
                              <span className="font-bold text-slate-700">{state}</span>
                              <span className="px-2 py-0.5 bg-slate-200/80 rounded-full font-bold text-slate-600">{count} {count === 1 ? 'req' : 'reqs'}</span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    <div className="bg-slate-50 p-5 border border-slate-100 rounded-2xl space-y-4">
                      <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Recently Requested Locations</h3>
                      <div className="space-y-2">
                        {recentLocations.length === 0 ? (
                          <p className="text-xs text-slate-500 font-semibold">No data available</p>
                        ) : (
                          recentLocations.map((r) => (
                            <div key={r.id} className="text-xs p-1 flex flex-col border-b border-slate-200/40 last:border-0 pb-1">
                              <div className="flex justify-between items-center">
                                <span className="font-bold text-slate-800">{r.city}, {r.state}</span>
                                <span className="text-[10px] text-slate-400 font-semibold">{r.created_at ? new Date(r.created_at).toLocaleDateString() : ''}</span>
                              </div>
                              <span className="text-[10px] text-slate-500 font-medium truncate mt-0.5">{r.email}</span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Filters and List */}
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      {/* Search Input */}
                      <div className="w-full sm:w-72">
                        <input 
                          type="text" 
                          placeholder="Search by City, State or Email..." 
                          value={covSearch}
                          onChange={(e) => setCovSearch(e.target.value)}
                          className="w-full h-10 px-4 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:border-primary/50"
                        />
                      </div>
                      {/* Status Filters */}
                      <div className="flex gap-1.5 overflow-x-auto w-full sm:w-auto pb-1">
                        {['All', 'Pending', 'Planned', 'Available'].map((st) => (
                          <button
                            key={st}
                            onClick={() => setCovFilter(st)}
                            className={`px-3 py-1.5 rounded-lg font-bold text-[10px] uppercase tracking-wide transition-colors cursor-pointer ${
                              covFilter === st 
                                ? 'bg-slate-900 text-white' 
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            {st}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Requests Table */}
                    <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-black uppercase tracking-wider text-[9px]">
                            <th className="p-4">City</th>
                            <th className="p-4">State</th>
                            <th className="p-4">Email</th>
                            <th className="p-4">Request Date</th>
                            <th className="p-4">Status</th>
                            <th className="p-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredRequests.length === 0 ? (
                            <tr>
                              <td colSpan="6" className="p-8 text-center text-slate-400 font-semibold bg-white">
                                No coverage requests matching current filters.
                              </td>
                            </tr>
                          ) : (
                            filteredRequests.map((r) => (
                              <tr key={r.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 bg-white">
                                <td className="p-4 font-bold text-slate-800">{r.city}</td>
                                <td className="p-4 text-slate-600 font-semibold">{r.state}</td>
                                <td className="p-4 text-slate-600 font-medium">{r.email}</td>
                                <td className="p-4 text-slate-400 font-semibold">
                                  {r.created_at ? new Date(r.created_at).toLocaleString('en-IN') : '-'}
                                </td>
                                <td className="p-4">
                                  <span className={`px-2.5 py-1 rounded-full font-black text-[9px] uppercase tracking-wider ${
                                    r.status === 'Available' 
                                      ? 'bg-green-50 text-green-700' 
                                      : r.status === 'Planned' 
                                      ? 'bg-blue-50 text-blue-700' 
                                      : 'bg-amber-50 text-amber-700'
                                  }`}>
                                    {r.status}
                                  </span>
                                </td>
                                <td className="p-4 text-right space-x-1.5 whitespace-nowrap">
                                  {r.status === 'Pending' && (
                                    <button
                                      onClick={() => updateCoverageRequestStatus(r.id, 'Planned')}
                                      className="bg-blue-50 hover:bg-blue-100 text-blue-700 px-2 py-1 rounded font-bold text-[10px] transition-colors cursor-pointer"
                                    >
                                      Mark Planned
                                    </button>
                                  )}
                                  {r.status !== 'Available' && (
                                    <button
                                      onClick={() => updateCoverageRequestStatus(r.id, 'Available')}
                                      className="bg-green-50 hover:bg-green-100 text-green-700 px-2 py-1 rounded font-bold text-[10px] transition-colors cursor-pointer"
                                    >
                                      Mark Available
                                    </button>
                                  )}
                                  <button
                                    onClick={async () => {
                                      const ok = await confirm('Are you sure you want to delete this coverage request?');
                                      if (ok) {
                                        await deleteCoverageRequest(r.id);
                                      }
                                    }}
                                    className="bg-red-50 hover:bg-red-100 text-red-700 p-1.5 rounded transition-colors cursor-pointer inline-flex items-center"
                                    title="Delete Request"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                </motion.div>
              );
            })()}

          </AnimatePresence>
        </main>

      </div>
    </div>
  );
};

// Helper subcomponents for services management
const ServiceRow = ({ service, citiesList = [], onUpdate, onDelete }) => {
  const { confirm, cityControl } = useApp();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: service.name || '',
    category: service.category || '',
    description: service.description || '',
    base_price: service.base_price || 0,
    platform_fee: service.platform_fee || 0,
  });
  const [selectedCities, setSelectedCities] = useState(() => (
    (citiesList || []).filter(c => (cityControl?.[c.id]?.[service.id])).map(c => c.id)
  ));

  const toggleCity = (id) => {
    setSelectedCities(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const startEditing = () => {
    setForm({
      name: service.name || '',
      category: service.category || '',
      description: service.description || '',
      base_price: service.base_price || 0,
      platform_fee: service.platform_fee || 0,
    });
    setSelectedCities((citiesList || []).filter(c => (cityControl?.[c.id]?.[service.id])).map(c => c.id));
    setEditing(true);
  };

  const save = async () => {
    await onUpdate(service.id, { name: form.name, category: form.category, description: form.description, base_price: Number(form.base_price), platform_fee: Number(form.platform_fee) }, selectedCities);
    setEditing(false);
  };

  const remove = async () => {
    const ok = await confirm('Delete this service?');
    if (!ok) return;
    await onDelete(service.id);
  };

  return (
    <tr>
      <td className="p-3">
        {editing ? <input className="border p-1 text-xs rounded" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /> : <span className="font-bold">{service.name}</span>}
      </td>
      <td className="p-3">{editing ? <input className="border p-1 text-xs rounded" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} /> : (service.category || '-')}</td>
      <td className="p-3">{editing ? <input className="border p-1 text-xs rounded" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /> : (service.description || '-')}</td>
      <td className="p-3">{editing ? <input type="number" className="border p-1 text-xs rounded w-20" value={form.base_price} onChange={(e) => setForm({ ...form, base_price: e.target.value })} /> : (service.base_price || 0)}</td>
      <td className="p-3">{editing ? <input type="number" className="border p-1 text-xs rounded w-20" value={form.platform_fee} onChange={(e) => setForm({ ...form, platform_fee: e.target.value })} /> : (service.platform_fee || 0)}</td>
      <td className="p-3">
        {editing ? (
          <div className="max-h-28 overflow-auto">
            {(citiesList || []).map(c => (
              <label key={c.id} className="block text-[11px]">
                <input type="checkbox" checked={selectedCities.includes(c.id)} onChange={() => toggleCity(c.id)} /> <span className="ml-2">{c.name}</span>
              </label>
            ))}
          </div>
        ) : (
          <div className="text-[11px] text-slate-500">{(citiesList || []).filter(c => (cityControl?.[c.id]?.[service.id])).map(c => c.name).join(', ') || 'All'}</div>
        )}
      </td>
      <td className="p-3">
        {editing ? (
          <div className="flex gap-2">
            <button onClick={save} className="btn-primary text-[10px] px-3 py-1.5 rounded">Save</button>
            <button onClick={() => setEditing(false)} className="btn-secondary text-[10px] px-3 py-1.5 rounded">Cancel</button>
          </div>
        ) : (
          <div className="flex gap-2">
            <button onClick={startEditing} className="btn-primary text-[10px] px-3 py-1.5 rounded">Edit</button>
            <button onClick={remove} className="btn-danger text-[10px] px-3 py-1.5 rounded">Delete</button>
          </div>
        )}
      </td>
    </tr>
  );
};

const CreateServiceForm = ({ citiesList = [], onCreate }) => {
  const [form, setForm] = useState({ name: '', category: '', description: '', base_price: '', platform_fee: '' });
  const [selectedCities, setSelectedCities] = useState([]);
  const [errors, setErrors] = useState({});

  const toggleCity = (id) => setSelectedCities(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const validate = () => {
    const e = {};
    if (!form.name || String(form.name).trim().length < 2) e.name = 'Name is required (min 2 chars)';
    if (String(form.name || '').length > 100) e.name = 'Name too long';
    if (form.base_price !== '' && Number(form.base_price) < 0) e.base_price = 'Base price must be >= 0';
    if (form.platform_fee !== '' && Number(form.platform_fee) < 0) e.platform_fee = 'Platform fee must be >= 0';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    await onCreate({ name: form.name.trim(), description: form.description.trim(), category: form.category.trim(), base_price: Number(form.base_price || 0), platform_fee: Number(form.platform_fee || 0), cityIds: selectedCities });
    setForm({ name: '', category: '', description: '', base_price: '', platform_fee: '' });
    setSelectedCities([]);
    setErrors({});
  };

  const canSubmit = () => {
    return form.name && String(form.name).trim().length >= 2 && (form.base_price === '' || Number(form.base_price) >= 0) && (form.platform_fee === '' || Number(form.platform_fee) >= 0);
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <div>
        <input placeholder="Service name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full h-10 px-3 rounded border" />
        {errors.name && <div className="text-xs text-red-600 mt-1">{errors.name}</div>}
      </div>
      <input placeholder="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full h-10 px-3 rounded border" />
      <input placeholder="Short description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full h-10 px-3 rounded border" />
      <div className="flex gap-2">
        <div className="w-1/2">
          <input placeholder="Base price" type="number" value={form.base_price} onChange={(e) => setForm({ ...form, base_price: e.target.value })} className="w-full h-10 px-3 rounded border" />
          {errors.base_price && <div className="text-xs text-red-600 mt-1">{errors.base_price}</div>}
        </div>
        <div className="w-1/2">
          <input placeholder="Platform fee" type="number" value={form.platform_fee} onChange={(e) => setForm({ ...form, platform_fee: e.target.value })} className="w-full h-10 px-3 rounded border" />
          {errors.platform_fee && <div className="text-xs text-red-600 mt-1">{errors.platform_fee}</div>}
        </div>
      </div>
      <div className="max-h-36 overflow-auto border p-2 rounded">
        {(citiesList || []).map(c => (
          <label key={c.id} className="block text-[12px]">
            <input type="checkbox" checked={selectedCities.includes(c.id)} onChange={() => toggleCity(c.id)} /> <span className="ml-2">{c.name}</span>
          </label>
        ))}
      </div>
      <button type="submit" disabled={!canSubmit()} className={`w-full py-2 rounded ${canSubmit() ? 'btn-primary' : 'btn-disabled'}`}>Create Service</button>
    </form>
  );
};

export default AdminDashboard;
