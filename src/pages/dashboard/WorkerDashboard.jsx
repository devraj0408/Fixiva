import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useApp } from '../../context/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import {
  BarChart3,
  Briefcase,
  Clock,
  CheckCircle,
  IndianRupee,
  Calendar,
  Bell,
  Star,
  Settings,
  LogOut,
  MapPin,
  Phone,
  PhoneOff,
  User,
  ShieldCheck,
  CheckSquare,
  HelpCircle
} from 'lucide-react';

const WorkerDashboard = () => {
  const {
    user,
    bookings,
    updateBookingStatus,
    refreshData,
    tickets,
    addTicket,
    updateUserProfile,
    logout,
    showToast,
    confirm
  } = useApp();

  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const tabParam = searchParams.get('tab');

  const activeTab = tabParam || 'overview';

  // Support & Profile states
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketMessage, setTicketMessage] = useState('');
  const [ticketLoading, setTicketLoading] = useState(false);

  const [skills, setSkills] = useState(user?.skills || '');
  const [experience, setExperience] = useState(user?.experience || '');
  const [whatsapp, setWhatsapp] = useState(user?.whatsapp || '');
  const [hourlyRate, setHourlyRate] = useState(user?.hourly_rate || '');
  const [visitCharge, setVisitCharge] = useState(user?.visit_charge || '');
  const [availabilityStatus, setAvailabilityStatus] = useState(user?.status || 'Active');
  const [profileLoading, setProfileLoading] = useState(false);

  // Notifications state
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (user) {
      setSkills(user.skills || '');
      setExperience(user.experience || '');
      setWhatsapp(user.whatsapp || '');
      setHourlyRate(user.hourly_rate || '');
      setVisitCharge(user.visit_charge || '');
      setAvailabilityStatus(user.status || 'Active');
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

  // Role validation
  const userRole = String(user?.role || '').trim().toLowerCase();
  if (user && userRole !== 'worker') {
    if (userRole === 'admin') return <Navigate to="/dashboard/admin" replace />;
    if (userRole === 'contractor') return <Navigate to="/contractor-dashboard" replace />;
    return <Navigate to="/dashboard/customer" replace />;
  }

  // Filter jobs for this worker
  const myJobs = useMemo(() => {
    return (bookings || []).filter((b) => b.worker_id === user?.id || (b.worker_name && b.worker_name.toLowerCase() === (user?.name || '').toLowerCase()));
  }, [bookings, user?.id, user?.name]);

  const myTickets = useMemo(() => {
    return (tickets || []).filter((t) => t.user_id === user?.id);
  }, [tickets, user?.id]);

  // Specific Worker Dashboard Metrics
  const todaysJobsCount = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    return myJobs.filter((b) => {
      const bDate = b.booking_date || b.preferred_date;
      return bDate && new Date(bDate).toISOString().split('T')[0] === todayStr && b.status !== 'Completed';
    }).length;
  }, [myJobs]);

  const pendingJobs = useMemo(() => {
    return myJobs.filter((b) => ['Pending', 'New Request', 'Assigned'].includes(b.status));
  }, [myJobs]);

  const activeJobs = useMemo(() => {
    return myJobs.filter((b) => ['Accepted', 'Worker Assigned', 'Confirmed', 'On The Way', 'Work Started', 'In Progress'].includes(b.status));
  }, [myJobs]);

  const completedJobs = useMemo(() => {
    return myJobs.filter((b) => ['Completed', 'Reviewed'].includes(b.status));
  }, [myJobs]);

  // Earnings
  const totalEarnings = useMemo(() => {
    return completedJobs.reduce((acc, curr) => acc + Number(curr.price || 0), 0);
  }, [completedJobs]);

  // Action handlers
  const handleJobStatusUpdate = async (bookingId, newStatus) => {
    await updateBookingStatus(bookingId, newStatus);
    showToast(`Job status updated to ${newStatus}.`, 'success');
    if (refreshData) refreshData();
  };

  const handleRejectJob = async (bookingId) => {
    const ok = await confirm('Reject this job? It will be sent back for reassignment.');
    if (!ok) return;
    const { error } = await supabase
      .from('bookings')
      .update({
        status: 'New Request',
        worker_id: null,
        worker_name: null,
        worker_phone: null
      })
      .eq('id', bookingId);

    if (!error) {
      showToast('Job rejected.', 'info');
      if (refreshData) refreshData();
    } else {
      showToast('Failed to reject job: ' + error.message, 'error');
    }
  };

  const handleUpdateAvailability = async (status) => {
    setAvailabilityStatus(status);
    const { error } = await supabase.from('workers').update({ status }).eq('id', user.id);
    if (!error) {
      showToast(`Availability updated to ${status}.`, 'success');
      if (refreshData) refreshData();
    } else {
      showToast('Failed to update availability status', 'error');
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    const { error } = await updateUserProfile({
      skills,
      experience,
      whatsapp,
      hourly_rate: Number(hourlyRate) || 0,
      visit_charge: Number(visitCharge) || 0
    });
    setProfileLoading(false);
    if (!error) {
      showToast('Profile and pricing updated successfully!', 'success');
      if (refreshData) refreshData();
    } else {
      showToast('Failed to update profile: ' + error.message, 'error');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getInitials = (name) => {
    if (!name) return 'W';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  // Sidebar Items matching exact prompt requirement
  const navItems = [
    { id: 'overview', label: 'Dashboard', icon: BarChart3 },
    { id: 'assigned-jobs', label: 'Assigned Jobs', icon: Briefcase, count: pendingJobs.length + activeJobs.length },
    { id: 'history', label: 'Job History', icon: Clock, count: completedJobs.length },
    { id: 'earnings', label: 'Earnings', icon: IndianRupee },
    { id: 'availability', label: 'Availability', icon: CheckSquare },
    { id: 'notifications', label: 'Notifications', icon: Bell, count: notifications.filter(n => !n.read).length },
    { id: 'reviews', label: 'Reviews', icon: Star },
    { id: 'profile', label: 'Profile', icon: Settings },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'assigned-jobs':
        return (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Assigned Jobs & Offers</h2>
              <p className="text-sm text-slate-500">Review incoming dispatches and manage active job statuses.</p>
            </div>

            {/* Pending Offers */}
            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Clock size={15} className="text-amber-500" /> Pending Offers ({pendingJobs.length})
              </h3>
              {pendingJobs.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-3xl text-xs font-semibold text-slate-500">
                  No pending job dispatches at the moment.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {pendingJobs.map((job) => (
                    <div key={job.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                      <div className="flex justify-between items-start flex-wrap gap-2">
                        <div>
                          <span className="text-[10px] font-black text-primary uppercase">ID: {job.id}</span>
                          <h4 className="font-extrabold text-slate-900 text-base mt-0.5">{job.service_name}</h4>
                        </div>
                        <span className="px-3 py-1 bg-amber-50 text-amber-700 font-black text-[10px] uppercase rounded-full border border-amber-200">
                          {job.status}
                        </span>
                      </div>

                      {/* Card Details */}
                      <div className="p-4 bg-slate-50 rounded-2xl text-xs space-y-2 font-semibold text-slate-700">
                        <p><strong>Customer Name:</strong> {job.customer_name || 'Customer'}</p>
                        <p><strong>Contact Mobile:</strong> {job.customer_phone || 'N/A'}</p>
                        <p className="flex items-start gap-1">
                          <MapPin size={14} className="text-slate-400 shrink-0 mt-0.5" />
                          <span><strong>Address:</strong> {job.customer_address || job.address}, {job.city}</span>
                        </p>
                        <p className="flex items-center gap-1">
                          <Calendar size={14} className="text-slate-400 shrink-0" />
                          <span><strong>Date:</strong> {new Date(job.booking_date || job.preferred_date).toLocaleDateString()}</span>
                        </p>
                        <p className="text-sm font-black text-slate-900 pt-1">
                          Price: ₹{job.price || 299}
                        </p>
                      </div>

                      {/* One-Click Action Buttons */}
                      <div className="flex gap-3 flex-wrap">
                        <button
                          onClick={() => handleJobStatusUpdate(job.id, 'Accepted')}
                          className="flex-1 rounded-2xl bg-primary py-3 text-xs font-extrabold text-white shadow-sm hover:bg-blue-700 transition-all"
                        >
                          Accept Job
                        </button>
                        <button
                          onClick={() => handleRejectJob(job.id)}
                          className="flex-1 rounded-2xl border border-red-200 bg-white py-3 text-xs font-extrabold text-red-600 shadow-sm hover:bg-red-50 transition-all"
                        >
                          Reject Job
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Active Ongoing Jobs */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Briefcase size={15} className="text-primary" /> Active In Progress ({activeJobs.length})
              </h3>
              {activeJobs.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-3xl text-xs font-semibold text-slate-500">
                  No active schedules currently in progress.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {activeJobs.map((job) => (
                    <div key={job.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                      <div className="flex justify-between items-start flex-wrap gap-2">
                        <div>
                          <span className="text-[10px] font-black text-primary uppercase">ID: {job.id}</span>
                          <h4 className="font-extrabold text-slate-900 text-base mt-0.5">{job.service_name}</h4>
                        </div>
                        <span className="px-3 py-1 bg-blue-50 text-primary font-black text-[10px] uppercase rounded-full border border-blue-200">
                          {job.status}
                        </span>
                      </div>

                      <div className="p-4 bg-slate-50 rounded-2xl text-xs space-y-2 font-semibold text-slate-700">
                        <p><strong>Customer Name:</strong> {job.customer_name}</p>
                        <p><strong>Contact Mobile:</strong> {job.customer_phone}</p>
                        <p className="flex items-start gap-1">
                          <MapPin size={14} className="text-slate-400 shrink-0 mt-0.5" />
                          <span><strong>Address:</strong> {job.customer_address || job.address}, {job.city}</span>
                        </p>
                        <p className="flex items-center gap-1">
                          <Calendar size={14} className="text-slate-400 shrink-0" />
                          <span><strong>Date:</strong> {new Date(job.booking_date || job.preferred_date).toLocaleDateString()}</span>
                        </p>
                        <p className="text-sm font-black text-slate-900 pt-1">
                          Price: ₹{job.price || 299}
                        </p>
                      </div>

                      {/* Status Action Buttons */}
                      <div className="flex gap-3 flex-wrap">
                        {['Accepted', 'Assigned', 'Confirmed', 'Worker Assigned'].includes(job.status) && (
                          <button
                            onClick={() => handleJobStatusUpdate(job.id, 'On The Way')}
                            className="flex-1 rounded-2xl bg-primary py-3 text-xs font-extrabold text-white shadow-sm hover:bg-blue-700 transition-all"
                          >
                            Mark On The Way
                          </button>
                        )}
                        {job.status === 'On The Way' && (
                          <button
                            onClick={() => handleJobStatusUpdate(job.id, 'Work Started')}
                            className="flex-1 rounded-2xl bg-primary py-3 text-xs font-extrabold text-white shadow-sm hover:bg-blue-700 transition-all"
                          >
                            Start Work
                          </button>
                        )}
                        {['Work Started', 'In Progress'].includes(job.status) && (
                          <button
                            onClick={() => handleJobStatusUpdate(job.id, 'Completed')}
                            className="flex-1 rounded-2xl bg-emerald-600 py-3 text-xs font-extrabold text-white shadow-sm hover:bg-emerald-700 transition-all"
                          >
                            Complete Work
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );

      case 'history':
        return (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Job History</h2>
              <p className="text-sm text-slate-500">Record of your completed home service assignments.</p>
            </div>

            {completedJobs.length === 0 ? (
              <div className="p-12 text-center border-2 border-dashed border-slate-200 bg-slate-50/50 rounded-3xl text-xs font-semibold text-slate-500">
                No completed jobs in history.
              </div>
            ) : (
              <div className="space-y-4">
                {completedJobs.map((job) => (
                  <div key={job.id} className="p-5 rounded-3xl border border-slate-200 bg-white shadow-sm flex items-center justify-between flex-wrap gap-4 text-xs">
                    <div>
                      <span className="text-[10px] font-black text-primary uppercase">ID: {job.id}</span>
                      <h4 className="font-extrabold text-slate-900 text-sm">{job.service_name}</h4>
                      <p className="text-slate-500 mt-0.5">Customer: {job.customer_name} • Date: {new Date(job.booking_date || job.preferred_date).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-black text-emerald-700 block">₹{job.price || 299}</span>
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase">Completed</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'earnings':
        return (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Earnings & Revenue Ledger</h2>
              <p className="text-sm text-slate-500">Review payout totals and completed job billing revenue.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-6 bg-slate-50 border border-slate-200 rounded-3xl">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total Lifetime Payout</span>
                <p className="text-3xl font-black text-slate-900 mt-2">₹{totalEarnings}</p>
              </div>
              <div className="p-6 bg-slate-50 border border-slate-200 rounded-3xl">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Completed Jobs Count</span>
                <p className="text-3xl font-black text-slate-900 mt-2">{completedJobs.length}</p>
              </div>
            </div>
          </div>
        );

      case 'availability':
        return (
          <div className="space-y-6 max-w-xl">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Availability & Shift Settings</h2>
              <p className="text-sm text-slate-500">Set your work availability status for automated customer dispatching.</p>
            </div>

            <div className="p-6 bg-slate-50 border border-slate-200 rounded-3xl space-y-4">
              <span className="text-xs font-extrabold text-slate-800 block">Current Status</span>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleUpdateAvailability('Active')}
                  className={`py-3 px-4 rounded-2xl border text-xs font-extrabold flex items-center justify-center gap-2 transition-all ${
                    availabilityStatus === 'Active'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                      : 'bg-white text-slate-700 border-slate-200'
                  }`}
                >
                  <CheckCircle size={16} /> Available Today
                </button>
                <button
                  onClick={() => handleUpdateAvailability('Off Duty')}
                  className={`py-3 px-4 rounded-2xl border text-xs font-extrabold flex items-center justify-center gap-2 transition-all ${
                    availabilityStatus === 'Off Duty'
                      ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                      : 'bg-white text-slate-700 border-slate-200'
                  }`}
                >
                  <PhoneOff size={16} /> Off Duty
                </button>
              </div>
            </div>
          </div>
        );

      case 'notifications':
        return (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Notifications</h2>
              <p className="text-sm text-slate-500">Job assignment alerts and platform broadcasts.</p>
            </div>
            {notifications.length === 0 ? (
              <div className="p-12 text-center border-2 border-dashed border-slate-200 bg-slate-50/50 rounded-3xl text-xs font-semibold text-slate-500">
                No notifications.
              </div>
            ) : (
              <div className="space-y-3">
                {notifications.map((n) => (
                  <div key={n.id} className="p-4 rounded-2xl border border-slate-200 bg-white shadow-sm flex items-start gap-3 text-xs">
                    <Bell size={16} className="text-primary shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-extrabold text-slate-900">{n.title}</h4>
                      <p className="text-slate-600 mt-0.5">{n.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'reviews':
        return (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Customer Reviews</h2>
              <p className="text-sm text-slate-500">Ratings and reviews submitted by customers for your services.</p>
            </div>
            <div className="p-12 text-center border-2 border-dashed border-slate-200 bg-slate-50/50 rounded-3xl text-xs font-semibold text-slate-500">
              <Star size={38} className="mx-auto text-slate-300 mb-2" />
              Your customer ratings update automatically upon completed job reviews.
            </div>
          </div>
        );

      case 'profile':
        return (
          <div className="space-y-6 max-w-xl">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Worker Profile & Pricing</h2>
              <p className="text-sm text-slate-500">Update your verified skills, experience, and service tariffs.</p>
            </div>

            <form onSubmit={handleUpdateProfile} className="bg-slate-50 border border-slate-200 p-8 rounded-3xl space-y-4 text-xs font-semibold">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase">Primary Skills</label>
                <input className="w-full h-11 px-4 bg-white border border-slate-200 rounded-2xl outline-none" value={skills} onChange={(e) => setSkills(e.target.value)} placeholder="e.g. Electrician, AC Repair" required />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase">Years of Experience</label>
                <input className="w-full h-11 px-4 bg-white border border-slate-200 rounded-2xl outline-none" value={experience} onChange={(e) => setExperience(e.target.value)} placeholder="e.g. 6+ Years" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase">Inspection Fee (₹)</label>
                  <input type="number" className="w-full h-11 px-4 bg-white border border-slate-200 rounded-2xl outline-none" value={visitCharge} onChange={(e) => setVisitCharge(e.target.value)} placeholder="149" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase">Hourly Rate (₹)</label>
                  <input type="number" className="w-full h-11 px-4 bg-white border border-slate-200 rounded-2xl outline-none" value={hourlyRate} onChange={(e) => setHourlyRate(e.target.value)} placeholder="299" />
                </div>
              </div>
              <button type="submit" disabled={profileLoading} className="w-full py-3 rounded-2xl bg-primary text-white font-extrabold">
                {profileLoading ? 'Saving...' : 'Save Profile Changes'}
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
                <h2 className="text-xl font-black text-slate-900 tracking-tight">Worker Operations Desk</h2>
                <p className="text-sm text-slate-500">Welcome back, {user?.name || 'Partner'}! Here is your daily work dispatch overview.</p>
              </div>
            </div>

            {/* Exact Top 4 Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Today's Jobs</p>
                    <p className="mt-2 text-2xl font-black text-slate-900">{todaysJobsCount}</p>
                  </div>
                  <div className="rounded-2xl p-2.5 bg-blue-100 text-blue-700">
                    <Calendar size={20} />
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Pending Jobs</p>
                    <p className="mt-2 text-2xl font-black text-slate-900">{pendingJobs.length}</p>
                  </div>
                  <div className="rounded-2xl p-2.5 bg-amber-100 text-amber-700">
                    <Clock size={20} />
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Completed Jobs</p>
                    <p className="mt-2 text-2xl font-black text-slate-900">{completedJobs.length}</p>
                  </div>
                  <div className="rounded-2xl p-2.5 bg-emerald-100 text-emerald-700">
                    <CheckCircle size={20} />
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Monthly Earnings</p>
                    <p className="mt-2 text-2xl font-black text-slate-900">₹{totalEarnings}</p>
                  </div>
                  <div className="rounded-2xl p-2.5 bg-violet-100 text-violet-700">
                    <IndianRupee size={20} />
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Assigned Jobs View */}
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Incoming Job Dispatches</h3>
                <button onClick={() => navigate(`${location.pathname}?tab=assigned-jobs`)} className="text-xs font-extrabold text-primary hover:underline">
                  View All ({pendingJobs.length})
                </button>
              </div>

              <div className="space-y-3">
                {pendingJobs.length === 0 ? (
                  <div className="p-6 text-center bg-white rounded-2xl border border-slate-200 text-xs text-slate-500 font-semibold">
                    No pending job offers waiting for response.
                  </div>
                ) : (
                  pendingJobs.slice(0, 3).map((item) => (
                    <div key={item.id} className="rounded-2xl border border-slate-200 bg-white p-4 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-extrabold text-slate-900">{item.service_name || 'Home Repair'}</p>
                        <p className="mt-0.5 text-[11px] text-slate-500">Customer: {item.customer_name} • Address: {item.city}</p>
                      </div>
                      <button
                        onClick={() => handleJobStatusUpdate(item.id, 'Accepted')}
                        className="rounded-xl bg-primary px-3.5 py-2 text-xs font-extrabold text-white shadow-sm hover:bg-blue-700"
                      >
                        Accept
                      </button>
                    </div>
                  ))
                )}
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
                {getInitials(user?.name)}
              </div>
              <div>
                <p className="text-sm font-black">{user?.name || 'Worker Partner'}</p>
                <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400 font-bold">Worker Desk</p>
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

        {/* Main Workspace Panel */}
        <main id="worker-panel-content" className="lg:col-span-9 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm min-h-[600px]">
          {renderTabContent()}
        </main>
      </div>
    </div>
  );
};

export default WorkerDashboard;
