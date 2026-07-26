import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useApp } from '../../context/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import {
  BarChart3,
  FileText,
  Users,
  Briefcase,
  IndianRupee,
  Star,
  Bell,
  Building,
  LogOut,
  Clock,
  CheckCircle,
  Plus,
  Trash2,
  User,
  MapPin,
  X,
  Search
} from 'lucide-react';

const ContractorDashboard = () => {
  const {
    user,
    bookings = [],
    workers = [],
    updateBookingStatus,
    tickets = [],
    addTicket,
    logout,
    refreshData,
    showToast,
    confirm
  } = useApp();

  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const tabParam = searchParams.get('tab');

  const activeTab = tabParam || 'overview';

  // Parse helper for staff team JSON stored in services_offered
  const parseServicesAndTeam = (servicesOffered) => {
    if (!servicesOffered) return { services: '', teamList: [] };
    const parts = servicesOffered.split(' | TEAM_JSON:');
    const services = parts[0] || '';
    let teamList = [];
    if (parts[1]) {
      try {
        teamList = JSON.parse(parts[1]);
      } catch {
        // Failed to parse
      }
    }
    return { services, teamList };
  };

  const serializeServicesAndTeam = (services, teamList) => {
    return `${services} | TEAM_JSON:${JSON.stringify(teamList)}`;
  };

  const team = useMemo(() => {
    return user?.services_offered ? parseServicesAndTeam(user.services_offered).teamList : [
      { name: 'Rajesh Kumar', role: 'Lead Electrician', phone: '9876543210', status: 'Available', trustScore: 98 },
      { name: 'Amit Sharma', role: 'Senior Painter', phone: '9876543211', status: 'Available', trustScore: 96 }
    ];
  }, [user?.services_offered]);

  // Modals & States
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('');
  const [newMemberPhone, setNewMemberPhone] = useState('');
  const [assigningBooking, setAssigningBooking] = useState(null);
  const [selectedStaffName, setSelectedStaffName] = useState('');
  const [companyName, setCompanyName] = useState(user?.company || user?.name || '');
  const [ownerName, setOwnerName] = useState(user?.owner_name || user?.name || '');
  const [gstNumber, setGstNumber] = useState(user?.gst || '');
  const [contractorCity, setContractorCity] = useState(user?.city || 'Ranchi');
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (user) {
      setCompanyName(user.company || user.name || '');
      setOwnerName(user.owner_name || user.name || '');
      setGstNumber(user.gst || '');
      setContractorCity(user.city || 'Ranchi');
    }
  }, [user]);

  // Fetch notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user?.id || !supabase) return;
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (data) setNotifications(data);
    };
    fetchNotifications();
  }, [user?.id, bookings]);

  // Role Validation
  const userRole = String(user?.role || '').trim().toLowerCase();
  if (user && userRole !== 'contractor') {
    if (userRole === 'admin') return <Navigate to="/dashboard/admin" replace />;
    if (userRole === 'worker') return <Navigate to="/worker-dashboard" replace />;
    return <Navigate to="/dashboard/customer" replace />;
  }

  // Filter contractor bookings
  const contractorBookings = useMemo(() => {
    return bookings.filter(
      (b) =>
        b.worker_id === user?.id ||
        (b.worker_name && b.worker_name.toLowerCase().includes((user?.company || user?.name || '').toLowerCase())) ||
        b.status === 'New Request' || b.status === 'Pending'
    );
  }, [bookings, user?.id, user?.company, user?.name]);

  const pendingRequests = useMemo(() => {
    return contractorBookings.filter((b) => ['Pending', 'New Request'].includes(b.status));
  }, [contractorBookings]);

  const activeJobs = useMemo(() => {
    return contractorBookings.filter((b) =>
      ['Accepted', 'Assigned', 'Confirmed', 'Worker Assigned', 'On The Way', 'Work Started', 'In Progress'].includes(b.status)
    );
  }, [contractorBookings]);

  const completedJobs = useMemo(() => {
    return contractorBookings.filter((b) => ['Completed', 'Reviewed'].includes(b.status));
  }, [contractorBookings]);

  const totalRevenue = useMemo(() => {
    return completedJobs.reduce((acc, curr) => acc + Number(curr.price || 0), 0);
  }, [completedJobs]);

  // Database Handlers
  const updateTeamInDB = async (newTeam) => {
    const { services } = parseServicesAndTeam(user?.services_offered);
    const serialized = serializeServicesAndTeam(services, newTeam);
    const { error } = await supabase.from('contractors').update({ services_offered: serialized }).eq('id', user.id);
    if (!error) {
      if (refreshData) await refreshData();
      showToast('Team directory updated.', 'success');
    } else {
      showToast('Failed to update team: ' + error.message, 'error');
    }
  };

  const handleAddTeamMember = async (e) => {
    e.preventDefault();
    if (!newMemberName || !newMemberRole) {
      showToast('Please provide name and role', 'error');
      return;
    }
    const newTeam = [
      ...team,
      {
        name: newMemberName,
        role: newMemberRole,
        phone: newMemberPhone || '9876543210',
        status: 'Available',
        trustScore: 98
      }
    ];
    await updateTeamInDB(newTeam);
    setNewMemberName('');
    setNewMemberRole('');
    setNewMemberPhone('');
  };

  const handleDeleteTeamMember = async (idxToDelete) => {
    const ok = await confirm('Remove staff member from company directory?');
    if (ok) {
      const newTeam = team.filter((_, idx) => idx !== idxToDelete);
      await updateTeamInDB(newTeam);
    }
  };

  const handleAssignStaffToBooking = async (bookingId, staffName) => {
    const staffMember = team.find((t) => t.name === staffName) || { phone: user?.phone || '9876543210' };
    const { error } = await supabase
      .from('bookings')
      .update({
        worker_id: user?.id,
        worker_name: `${staffName} (${user?.company || 'Contractor'})`,
        worker_phone: staffMember.phone,
        status: 'Worker Assigned'
      })
      .eq('id', bookingId);

    if (!error) {
      showToast(`Assigned ${staffName} to booking!`, 'success');
      setAssigningBooking(null);
      if (refreshData) await refreshData();
    } else {
      showToast('Failed to assign worker: ' + error.message, 'error');
    }
  };

  const handleUpdateCompanyProfile = async (e) => {
    e.preventDefault();
    const { error } = await supabase
      .from('contractors')
      .update({
        company: companyName,
        owner_name: ownerName,
        gst: gstNumber,
        city: contractorCity
      })
      .eq('id', user.id);

    if (!error) {
      showToast('Company profile details saved successfully!', 'success');
      if (refreshData) await refreshData();
    } else {
      showToast('Failed to save profile: ' + error.message, 'error');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getInitials = (name) => {
    if (!name) return 'C';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  // Sidebar Items matching exact prompt requirement
  const navItems = [
    { id: 'overview', label: 'Dashboard', icon: BarChart3 },
    { id: 'bookings', label: 'Bookings', icon: FileText, count: pendingRequests.length + activeJobs.length },
    { id: 'workers', label: 'Workers', icon: Users, count: team.length },
    { id: 'assignments', label: 'Assignments', icon: Briefcase },
    { id: 'earnings', label: 'Earnings', icon: IndianRupee },
    { id: 'reviews', label: 'Reviews', icon: Star },
    { id: 'notifications', label: 'Notifications', icon: Bell, count: notifications.filter((n) => !n.read).length },
    { id: 'profile', label: 'Company Profile', icon: Building },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'bookings':
        return (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Contractor Bookings & Leads</h2>
              <p className="text-sm text-slate-500">Manage incoming service leads, assign staff workers, and complete jobs.</p>
            </div>

            {contractorBookings.length === 0 ? (
              <div className="p-12 text-center border-2 border-dashed border-slate-200 bg-slate-50/50 rounded-3xl text-xs font-semibold text-slate-500">
                No active contractor bookings received yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {contractorBookings.map((b) => (
                  <div key={b.id} className="p-6 rounded-3xl border border-slate-200 bg-white shadow-sm space-y-4">
                    <div className="flex justify-between items-start flex-wrap gap-2">
                      <div>
                        <span className="text-[10px] font-black text-primary uppercase">ID: {b.id}</span>
                        <h4 className="font-extrabold text-slate-900 text-base mt-0.5">{b.service_name}</h4>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          b.status === 'Completed'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-blue-50 text-primary border border-blue-200'
                        }`}
                      >
                        {b.status}
                      </span>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-2xl text-xs space-y-1.5 font-semibold text-slate-700">
                      <p><strong>Customer:</strong> {b.customer_name}</p>
                      <p><strong>Location:</strong> {b.customer_address || b.address}, {b.city}</p>
                      <p><strong>Worker Assigned:</strong> {b.worker_name || 'None (Unassigned)'}</p>
                      <p className="text-sm font-black text-slate-900 pt-1">Price Tariff: ₹{b.price || 999}</p>
                    </div>

                    {/* Simple Card Actions */}
                    <div className="flex gap-2 flex-wrap">
                      {b.status !== 'Completed' && (
                        <button
                          onClick={() => setAssigningBooking(b)}
                          className="flex-1 py-2.5 rounded-2xl bg-primary text-xs font-extrabold text-white shadow-sm hover:bg-blue-700 transition-all"
                        >
                          {b.worker_name ? 'Reassign Staff' : 'Assign Worker'}
                        </button>
                      )}
                      {b.status !== 'Completed' && (
                        <button
                          onClick={async () => {
                            await updateBookingStatus(b.id, 'Completed');
                            showToast('Booking marked as completed!', 'success');
                            if (refreshData) refreshData();
                          }}
                          className="flex-1 py-2.5 rounded-2xl bg-emerald-600 text-xs font-extrabold text-white shadow-sm hover:bg-emerald-700 transition-all"
                        >
                          Mark Complete
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'workers':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">Staff & Worker Roster</h2>
                <p className="text-sm text-slate-500">Manage internal technicians and field staff.</p>
              </div>
            </div>

            {/* Add Team Member Form */}
            <form onSubmit={handleAddTeamMember} className="p-5 bg-slate-50 border border-slate-200 rounded-3xl grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs font-semibold">
              <input
                type="text"
                placeholder="Staff Full Name"
                value={newMemberName}
                onChange={(e) => setNewMemberName(e.target.value)}
                className="h-10 px-3 bg-white border border-slate-200 rounded-xl outline-none"
                required
              />
              <input
                type="text"
                placeholder="Role / Skill (e.g. Electrician)"
                value={newMemberRole}
                onChange={(e) => setNewMemberRole(e.target.value)}
                className="h-10 px-3 bg-white border border-slate-200 rounded-xl outline-none"
                required
              />
              <input
                type="text"
                placeholder="Mobile Number"
                value={newMemberPhone}
                onChange={(e) => setNewMemberPhone(e.target.value)}
                className="h-10 px-3 bg-white border border-slate-200 rounded-xl outline-none"
              />
              <button type="submit" className="h-10 bg-primary text-white font-extrabold rounded-xl hover:bg-blue-700 flex items-center justify-center gap-1">
                <Plus size={14} /> Add Worker
              </button>
            </form>

            {/* Simple Workers Table */}
            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              {team.length === 0 ? (
                <div className="p-8 text-center text-xs font-semibold text-slate-500">No staff members in directory.</div>
              ) : (
                <table className="min-w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-extrabold uppercase border-b border-slate-100">
                    <tr>
                      <th className="px-5 py-3.5">Photo & Name</th>
                      <th className="px-5 py-3.5">Skills / Role</th>
                      <th className="px-5 py-3.5">City</th>
                      <th className="px-5 py-3.5">Status</th>
                      <th className="px-5 py-3.5">Trust Score</th>
                      <th className="px-5 py-3.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                    {team.map((w, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="px-5 py-4 flex items-center gap-3 font-extrabold text-slate-900">
                          <div className="h-8 w-8 rounded-xl bg-slate-900 text-white flex items-center justify-center text-xs font-black uppercase">
                            {w.name.charAt(0)}
                          </div>
                          {w.name}
                        </td>
                        <td className="px-5 py-4 text-slate-600">{w.role}</td>
                        <td className="px-5 py-4 text-slate-600">{contractorCity}</td>
                        <td className="px-5 py-4">
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-black text-[10px]">
                            {w.status || 'Available'}
                          </span>
                        </td>
                        <td className="px-5 py-4 font-black text-emerald-700">{w.trustScore || 98}%</td>
                        <td className="px-5 py-4 text-right">
                          <button onClick={() => handleDeleteTeamMember(idx)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-xl">
                            <Trash2 size={15} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        );

      case 'assignments':
        return (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Active Work Assignments</h2>
              <p className="text-sm text-slate-500">Track field staff dispatches and job completions.</p>
            </div>
            <div className="space-y-3">
              {activeJobs.map((j) => (
                <div key={j.id} className="p-5 rounded-3xl border border-slate-200 bg-white shadow-sm flex justify-between items-center text-xs font-semibold">
                  <div>
                    <h4 className="font-extrabold text-slate-900 text-sm">{j.service_name}</h4>
                    <p className="text-slate-500">Assigned Staff: {j.worker_name || 'Firm Unassigned'}</p>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-blue-50 text-primary font-black text-[10px] uppercase">
                    {j.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        );

      case 'earnings':
        return (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Contractor Revenue Ledger</h2>
              <p className="text-sm text-slate-500">Company revenue from completed client projects.</p>
            </div>
            <div className="p-8 bg-slate-50 border border-slate-200 rounded-3xl">
              <span className="text-[10px] font-black uppercase text-slate-400">Total Completed Revenue</span>
              <p className="text-4xl font-black text-slate-900 mt-2">₹{totalRevenue}</p>
            </div>
          </div>
        );

      case 'reviews':
        return (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Company Reviews</h2>
              <p className="text-sm text-slate-500">Client reviews for completed firm projects.</p>
            </div>
            <div className="p-12 text-center border-2 border-dashed border-slate-200 bg-slate-50/50 rounded-3xl text-xs font-semibold text-slate-500">
              <Star size={38} className="mx-auto text-slate-300 mb-2" />
              Verified client reviews for your firm will display here upon project completion.
            </div>
          </div>
        );

      case 'notifications':
        return (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Notifications</h2>
              <p className="text-sm text-slate-500">Incoming lead notifications and admin broadcasts.</p>
            </div>
            {notifications.length === 0 ? (
              <div className="p-12 text-center border-2 border-dashed border-slate-200 bg-slate-50/50 rounded-3xl text-xs font-semibold text-slate-500">
                No notifications.
              </div>
            ) : (
              <div className="space-y-3">
                {notifications.map((n) => (
                  <div key={n.id} className="p-4 rounded-2xl border border-slate-200 bg-white shadow-sm text-xs space-y-1">
                    <h4 className="font-extrabold text-slate-900">{n.title}</h4>
                    <p className="text-slate-600">{n.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'profile':
        return (
          <div className="space-y-6 max-w-xl">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Company Profile & GST</h2>
              <p className="text-sm text-slate-500">Manage business entity details and GST registration.</p>
            </div>

            <form onSubmit={handleUpdateCompanyProfile} className="bg-slate-50 border border-slate-200 p-8 rounded-3xl space-y-4 text-xs font-semibold">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase">Company / Firm Name</label>
                <input className="w-full h-11 px-4 bg-white border border-slate-200 rounded-2xl outline-none" value={companyName} onChange={(e) => setCompanyName(e.target.value)} required />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase">Proprietor / Owner Name</label>
                <input className="w-full h-11 px-4 bg-white border border-slate-200 rounded-2xl outline-none" value={ownerName} onChange={(e) => setOwnerName(e.target.value)} required />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase">GST Identification Number</label>
                <input className="w-full h-11 px-4 bg-white border border-slate-200 rounded-2xl outline-none" value={gstNumber} onChange={(e) => setGstNumber(e.target.value)} placeholder="e.g. 20AAAAA0000A1Z5" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase">Base Operating City</label>
                <input className="w-full h-11 px-4 bg-white border border-slate-200 rounded-2xl outline-none" value={contractorCity} onChange={(e) => setContractorCity(e.target.value)} />
              </div>
              <button type="submit" className="w-full py-3 rounded-2xl bg-primary text-white font-extrabold">
                Save Company Profile
              </button>
            </form>
          </div>
        );

      case 'overview':
      default:
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">Contractor Operations Desk</h2>
                <p className="text-sm text-slate-500">Welcome back, {user?.company || user?.name || 'Contractor Partner'}! Platform activity overview.</p>
              </div>
            </div>

            {/* Exact Top 4 Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Active Workers</p>
                    <p className="mt-2 text-2xl font-black text-slate-900">{team.length}</p>
                  </div>
                  <div className="rounded-2xl p-2.5 bg-blue-100 text-blue-700">
                    <Users size={20} />
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Active Jobs</p>
                    <p className="mt-2 text-2xl font-black text-slate-900">{activeJobs.length}</p>
                  </div>
                  <div className="rounded-2xl p-2.5 bg-amber-100 text-amber-700">
                    <Briefcase size={20} />
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Pending Requests</p>
                    <p className="mt-2 text-2xl font-black text-slate-900">{pendingRequests.length}</p>
                  </div>
                  <div className="rounded-2xl p-2.5 bg-emerald-100 text-emerald-700">
                    <Clock size={20} />
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Revenue</p>
                    <p className="mt-2 text-2xl font-black text-slate-900">₹{totalRevenue}</p>
                  </div>
                  <div className="rounded-2xl p-2.5 bg-violet-100 text-violet-700">
                    <IndianRupee size={20} />
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Leads & Projects */}
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Incoming Booking Leads</h3>
                  <button onClick={() => navigate(`${location.pathname}?tab=bookings`)} className="text-xs font-extrabold text-primary hover:underline">
                    View All ({pendingRequests.length})
                  </button>
                </div>

                <div className="space-y-3">
                  {pendingRequests.length === 0 ? (
                    <div className="p-6 text-center bg-white rounded-2xl border border-slate-200 text-xs text-slate-500 font-semibold">
                      No new incoming booking leads.
                    </div>
                  ) : (
                    pendingRequests.slice(0, 3).map((item) => (
                      <div key={item.id} className="rounded-2xl border border-slate-200 bg-white p-4 flex items-center justify-between gap-3">
                        <div>
                          <p className="text-xs font-extrabold text-slate-900">{item.service_name || 'Client Project'}</p>
                          <p className="mt-0.5 text-[11px] text-slate-500">Client: {item.customer_name} • {item.city}</p>
                        </div>
                        <button
                          onClick={() => setAssigningBooking(item)}
                          className="rounded-xl bg-primary px-3 py-1.5 text-[11px] font-extrabold text-white hover:bg-blue-700 transition-all"
                        >
                          Assign Worker
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Staff Roster Overview</h3>
                  <button onClick={() => navigate(`${location.pathname}?tab=workers`)} className="text-xs font-extrabold text-primary hover:underline">
                    Manage Roster
                  </button>
                </div>

                <div className="space-y-3">
                  {team.slice(0, 3).map((w, i) => (
                    <div key={i} className="rounded-2xl border border-slate-200 bg-white p-4 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-extrabold text-slate-900">{w.name}</p>
                        <p className="mt-0.5 text-[11px] text-slate-500">{w.role} • {w.status || 'Available'}</p>
                      </div>
                      <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-2 py-1 rounded-full">
                        {w.trustScore || 98}% Trust
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Sidebar matching Admin Shell */}
        <aside className="lg:col-span-3 space-y-4">
          <div className="rounded-3xl bg-slate-900 p-5 text-white shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-sm font-black uppercase shadow-inner">
                {getInitials(user?.company || user?.name)}
              </div>
              <div>
                <p className="text-sm font-black">{user?.company || user?.name || 'Contractor Entity'}</p>
                <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400 font-bold">Contractor Desk</p>
              </div>
            </div>
          </div>

          <nav className="rounded-3xl border border-slate-200 bg-white p-2 shadow-sm space-y-1">
            {navItems.map(({ id, label, icon: Icon, count }) => {
              const isActive = activeTab === id;
              return (
                <button
                  key={id}
                  onClick={() => navigate(`${location.pathname}?tab=${id}`)}
                  className={`flex w-full items-center justify-between rounded-2xl px-3 py-2.5 text-left text-xs font-bold transition-all ${
                    isActive ? 'bg-primary text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon size={16} />
                    <span>{label}</span>
                  </div>
                  {count !== undefined && count > 0 && (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${isActive ? 'bg-white/20 text-white' : 'bg-blue-50 text-primary'}`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          <button
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm font-semibold text-slate-600 shadow-sm hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all"
          >
            <LogOut size={16} /> Logout
          </button>
        </aside>

        {/* Main Panel Content */}
        <main id="contractor-panel-content" className="lg:col-span-9 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm min-h-[600px]">
          {renderTabContent()}
        </main>
      </div>

      {/* Assign Worker Modal */}
      {assigningBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-2xl max-w-md w-full border border-slate-200 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-slate-900">Assign Staff Worker</h3>
                <p className="text-xs text-slate-500 font-semibold mt-0.5">Booking #{assigningBooking.id} - {assigningBooking.service_name}</p>
              </div>
              <button onClick={() => setAssigningBooking(null)} className="p-2 text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 text-xs font-semibold">
              <label className="text-[10px] font-black text-slate-400 uppercase">Select Staff Member from Roster</label>
              <select
                value={selectedStaffName}
                onChange={(e) => setSelectedStaffName(e.target.value)}
                className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-800 outline-none"
              >
                <option value="">Select Technician / Worker</option>
                {team.map((t, idx) => (
                  <option key={idx} value={t.name}>
                    {t.name} ({t.role})
                  </option>
                ))}
              </select>

              <div className="flex gap-2 justify-end pt-2">
                <button type="button" onClick={() => setAssigningBooking(null)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50">Cancel</button>
                <button
                  type="button"
                  onClick={() => {
                    if (!selectedStaffName) {
                      showToast('Please select a staff member', 'error');
                      return;
                    }
                    handleAssignStaffToBooking(assigningBooking.id, selectedStaffName);
                  }}
                  className="rounded-xl bg-primary px-5 py-2.5 text-xs font-extrabold text-white shadow-sm hover:bg-blue-700"
                >
                  Assign Worker
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContractorDashboard;
