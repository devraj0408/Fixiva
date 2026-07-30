import { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
  CheckSquare,
  Sparkles
} from 'lucide-react';
import ProfileCard from '../../components/ProfileCard';
import BookingStatusTimeline from '../../components/booking/BookingStatusTimeline';

const WorkerDashboard = () => {
  const {
    user,
    bookings,
    updateBookingStatus,
    refreshData,
    reviews: allReviews = [],
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
      queueMicrotask(() => {
        setSkills(user.skills || '');
        setExperience(user.experience || '');
        setWhatsapp(user.whatsapp || '');
        setHourlyRate(user.hourly_rate || '');
        setVisitCharge(user.visit_charge || '');
        setAvailabilityStatus(user.status || 'Active');
      });
    }
  }, [user]);

  // Fetch Notifications & Realtime Subscription
  const fetchNotifications = useCallback(async () => {
    if (!user?.id || !supabase) return;
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .or(`user_id.eq.${user.id},target_role.in.(worker,all,WORKER,ALL)`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Worker notification fetch error:', error);
        return;
      }

      if (data) {
        let readIds = [];
        try {
          const stored = localStorage.getItem(`fixiva_read_notifs_${user.id}`);
          readIds = stored ? JSON.parse(stored) : [];
        } catch (e) { void e; }

        const processed = data.map((n) => ({
          ...n,
          read: n.user_id === user.id ? Boolean(n.read) : readIds.includes(n.id)
        }));
        setNotifications(processed);
      }
    } catch (err) {
      console.error('Exception fetching worker notifications:', err);
    }
  }, [user]);

  useEffect(() => {
    queueMicrotask(() => {
      fetchNotifications();
    });

    if (!user?.id || !supabase) return;

    const notifChannel = supabase
      .channel(`worker-notifications-${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications' },
        () => {
          fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(notifChannel);
    };
  }, [user?.id, fetchNotifications]);

  // Mark Worker Notifications as read when opening notifications tab
  useEffect(() => {
    if (activeTab === 'notifications' && user?.id && notifications.length > 0) {
      const unread = notifications.filter((n) => !n.read);
      if (unread.length > 0) {
        let readIds = [];
        try {
          const stored = localStorage.getItem(`fixiva_read_notifs_${user.id}`);
          readIds = stored ? JSON.parse(stored) : [];
        } catch (e) { void e; }

        const newReadIds = [...new Set([...readIds, ...notifications.map((n) => n.id)])];
        try {
          localStorage.setItem(`fixiva_read_notifs_${user.id}`, JSON.stringify(newReadIds));
        } catch (e) { void e; }

        queueMicrotask(() => {
          setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        });
      }
    }
  }, [activeTab, user?.id, notifications]);

  // Filter jobs for this worker
  const myJobs = useMemo(() => {
    return (bookings || []).filter((b) => b.worker_id === user?.id || (b.worker_name && b.worker_name.toLowerCase() === (user?.name || '').toLowerCase()));
  }, [bookings, user]);

  // Fetch worker specific reviews
  const workerReviews = useMemo(() => {
    return (allReviews || []).filter(
      (r) => r.worker_id === user?.id || (r.workerName && r.workerName.toLowerCase() === (user?.name || '').toLowerCase())
    );
  }, [allReviews, user]);

  const averageWorkerRating = useMemo(() => {
    if (workerReviews.length === 0) return 5.0;
    const sum = workerReviews.reduce((acc, curr) => acc + Number(curr.rating || 5), 0);
    return (sum / workerReviews.length).toFixed(1);
  }, [workerReviews]);

  // Specific Worker Dashboard Metrics
  const todaysJobsCount = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    return myJobs.filter((b) => {
      const bDate = b.booking_date || b.preferred_date || b.created_at;
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

  // Earnings Breakdown Calculation
  const workerEarningsMetrics = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    let todayRev = 0;
    let weeklyRev = 0;
    let monthlyRev = 0;
    let lifetimeRev = 0;

    completedJobs.forEach((j) => {
      const amount = Number(j.price || 0);
      lifetimeRev += amount;

      const dateObj = new Date(j.created_at || j.booking_date || j.preferred_date || 0);
      const dateStr = dateObj.toISOString().split('T')[0];

      if (dateStr === todayStr) {
        todayRev += amount;
      }
      if (dateObj >= sevenDaysAgo) {
        weeklyRev += amount;
      }
      if (dateObj >= startOfMonth) {
        monthlyRev += amount;
      }
    });

    const avgJobVal = completedJobs.length > 0 ? Math.round(lifetimeRev / completedJobs.length) : 0;

    return {
      today: todayRev,
      weekly: weeklyRev,
      monthly: monthlyRev,
      lifetime: lifetimeRev,
      avgJobValue: avgJobVal
    };
  }, [completedJobs]);

  // Realtime Booking & Reviews Subscription for Worker
  useEffect(() => {
    if (!user?.id || !supabase) return;

    const workerChannel = supabase
      .channel(`worker-realtime-${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bookings' },
        () => {
          if (refreshData) refreshData();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'reviews' },
        () => {
          if (refreshData) refreshData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(workerChannel);
    };
  }, [user?.id, refreshData]);

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
      showToast('Failed to update profile: ' + (error?.message || String(error || 'Unknown error')), 'error');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
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
              <p className="text-sm text-slate-500">Live service Marketplace dispatch console. Accept, navigate, start, and complete jobs.</p>
            </div>

            {/* Pending Offers Section */}
            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Clock size={15} className="text-amber-500" /> Pending Offers ({pendingJobs.length})
              </h3>
              {pendingJobs.length === 0 ? (
                <div className="p-8 text-center bg-gradient-to-b from-amber-50/40 to-slate-50 border border-amber-100 rounded-3xl space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-white text-amber-500 flex items-center justify-center mx-auto shadow-sm">
                    <Sparkles size={24} />
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-slate-800">No Pending Job Offers</h4>
                    <p className="text-xs text-slate-500 max-w-xs mx-auto mt-0.5">You are online and ready to receive your next service assignment.</p>
                  </div>
                  <button onClick={() => handleUpdateAvailability('Active')} className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-sm">
                    ✓ Confirm Online Status
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {pendingJobs.map((job) => (
                    <div key={job.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                      <div className="flex justify-between items-start flex-wrap gap-2">
                        <div>
                          <span className="text-[10px] font-black text-primary uppercase">BOOKING ID: {job.id}</span>
                          <h4 className="font-extrabold text-slate-900 text-base mt-0.5">{job.service_name || 'Home Service'}</h4>
                        </div>
                        <span className="px-3 py-1 bg-amber-50 text-amber-700 font-black text-[10px] uppercase rounded-full border border-amber-200">
                          ● {job.status}
                        </span>
                      </div>

                      {/* Location Hierarchy & Distance Badge */}
                      <div className="p-4 bg-slate-50 rounded-2xl text-xs space-y-2 font-semibold text-slate-700">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-900 font-extrabold">Customer: {job.customer_name || 'Client'}</span>
                          <span className="text-[10px] font-black text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
                            📍 2.8 km away • ~10 mins ETA
                          </span>
                        </div>
                        <p className="flex items-start gap-1 text-slate-600">
                          <MapPin size={14} className="text-primary shrink-0 mt-0.5" />
                          <span>
                            <strong>Hierarchy:</strong> {job.state || 'Jharkhand'} → {job.district || job.city || 'Ranchi'} → {job.locality || 'Lalpur'}
                          </span>
                        </p>
                        <p className="flex items-center gap-1">
                          <Calendar size={14} className="text-slate-400 shrink-0" />
                          <span><strong>Scheduled Slot:</strong> {job.preferred_time_slot || '09:00 AM - 12:00 PM'} ({new Date(job.booking_date || job.preferred_date || Date.now()).toLocaleDateString()})</span>
                        </p>
                        <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                          <span className="text-xs text-slate-500 font-bold">Total Service Fee</span>
                          <span className="text-base font-black text-slate-900">₹{job.price || 299}</span>
                        </div>
                      </div>

                      {/* Buttons */}
                      <div className="flex gap-3 flex-wrap">
                        <button
                          onClick={() => handleJobStatusUpdate(job.id, 'Accepted')}
                          className="flex-1 rounded-2xl bg-primary py-3 text-xs font-extrabold text-white shadow-sm hover:bg-blue-700 transition-all flex items-center justify-center gap-1"
                        >
                          <CheckSquare size={14} /> Accept Offer
                        </button>
                        <button
                          onClick={() => handleRejectJob(job.id)}
                          className="flex-1 rounded-2xl border border-red-200 bg-white py-3 text-xs font-extrabold text-red-600 shadow-sm hover:bg-red-50 transition-all"
                        >
                          Reject Offer
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Active Ongoing Jobs Section */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Briefcase size={15} className="text-primary" /> Active Job Console ({activeJobs.length})
              </h3>
              {activeJobs.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-3xl text-xs font-semibold text-slate-500">
                  No active jobs in progress. Accepted jobs will appear here for navigation and status updates.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {activeJobs.map((job) => (
                    <div key={job.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                      <div className="flex justify-between items-start flex-wrap gap-2">
                        <div>
                          <span className="text-[10px] font-black text-primary uppercase">ACTIVE BOOKING #{job.id}</span>
                          <h4 className="font-extrabold text-slate-900 text-base mt-0.5">{job.service_name}</h4>
                        </div>
                        <span className="px-3 py-1 bg-blue-50 text-primary font-black text-[10px] uppercase rounded-full border border-blue-200">
                          ● {job.status}
                        </span>
                      </div>

                      {/* Active Work Details Card */}
                      <div className="p-4 bg-slate-50 rounded-2xl text-xs space-y-3 font-semibold text-slate-700">
                        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                          <div>
                            <span className="text-slate-400 text-[10px] font-bold uppercase block">Customer Name</span>
                            <span className="text-slate-900 font-extrabold text-xs">{job.customer_name || 'Client'}</span>
                          </div>

                          <div className="flex gap-2">
                            {job.customer_phone && (
                              <a
                                href={`tel:${job.customer_phone}`}
                                className="px-3 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm hover:bg-emerald-700"
                              >
                                <Phone size={13} /> Call Customer
                              </a>
                            )}
                            <a
                              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent((job.locality || '') + ', ' + (job.district || job.city || 'Ranchi'))}`}
                              target="_blank"
                              rel="noreferrer"
                              className="px-3 py-1.5 bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm hover:bg-slate-800"
                            >
                              <MapPin size={13} /> Navigate
                            </a>
                          </div>
                        </div>

                        <p className="text-xs text-slate-700">
                          <strong>Address:</strong> {job.customer_address || job.address || job.locality}, {job.district || job.city || 'Ranchi'} ({job.state || 'Jharkhand'})
                        </p>
                        
                        <div className="flex items-center justify-between text-xs pt-1">
                          <span className="text-slate-500 font-medium">Job Tariff Payout:</span>
                          <span className="text-sm font-black text-slate-900">₹{job.price || 299}</span>
                        </div>
                      </div>

                      {/* Reusable Booking Lifecycle Status Timeline */}
                      <BookingStatusTimeline status={job.status} />

                      {/* Status Action Buttons Progression */}
                      <div className="flex gap-2 flex-wrap">
                        {['Accepted', 'ACCEPTED', 'Assigned', 'Confirmed', 'Worker Assigned', 'WORKER ASSIGNED'].includes(job.status) && (
                          <button
                            onClick={() => handleJobStatusUpdate(job.id, 'ON THE WAY')}
                            className="flex-1 rounded-2xl bg-primary py-3 text-xs font-extrabold text-white shadow-sm hover:bg-blue-700 transition-all"
                          >
                            Mark On The Way
                          </button>
                        )}
                        {['On The Way', 'ON THE WAY'].includes(job.status) && (
                          <button
                            onClick={() => handleJobStatusUpdate(job.id, 'ARRIVED')}
                            className="flex-1 rounded-2xl bg-sky-600 py-3 text-xs font-extrabold text-white shadow-sm hover:bg-sky-700 transition-all"
                          >
                            Mark Arrived at Location
                          </button>
                        )}
                        {['ARRIVED', 'Arrived'].includes(job.status) && (
                          <button
                            onClick={() => handleJobStatusUpdate(job.id, 'WORK IN PROGRESS')}
                            className="flex-1 rounded-2xl bg-indigo-600 py-3 text-xs font-extrabold text-white shadow-sm hover:bg-indigo-700 transition-all"
                          >
                            Start Work
                          </button>
                        )}
                        {['WORK IN PROGRESS', 'Work Started', 'In Progress'].includes(job.status) && (
                          <button
                            onClick={() => handleJobStatusUpdate(job.id, 'COMPLETED')}
                            className="flex-1 rounded-2xl bg-emerald-600 py-3 text-xs font-extrabold text-white shadow-sm hover:bg-emerald-700 transition-all"
                          >
                            Complete Work
                          </button>
                        )}
                        {job.status === 'Completed' && (
                          <button
                            onClick={() => showToast('Review request notification sent to customer!', 'success')}
                            className="flex-1 rounded-2xl bg-amber-500 py-3 text-xs font-extrabold text-white shadow-sm hover:bg-amber-600 transition-all flex items-center justify-center gap-1"
                          >
                            <Star size={14} /> Request Customer Review
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
              <p className="text-sm text-slate-500">Record of all completed home service dispatches and customer assignments.</p>
            </div>

            {completedJobs.length === 0 ? (
              <div className="p-12 text-center bg-slate-50 border border-dashed border-slate-200 rounded-3xl space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-white text-slate-400 flex items-center justify-center mx-auto shadow-sm">
                  <Briefcase size={24} />
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-slate-800">No Completed Jobs in History</h4>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto mt-0.5">Your completed service dispatches will accumulate here automatically.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {completedJobs.map((job) => (
                  <div key={job.id} className="p-5 rounded-3xl border border-slate-200 bg-white shadow-sm space-y-3 text-xs">
                    <div className="flex justify-between items-start flex-wrap gap-2">
                      <div>
                        <span className="text-[10px] font-black text-primary uppercase">JOB #{job.id}</span>
                        <h4 className="font-extrabold text-slate-900 text-sm mt-0.5">{job.service_name || 'Home Repair'}</h4>
                      </div>
                      <span className="px-3 py-1 bg-emerald-50 text-emerald-700 font-black text-[10px] uppercase rounded-full border border-emerald-200">
                        ● {job.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 bg-slate-50 rounded-2xl font-semibold text-slate-700">
                      <p><strong>Customer:</strong> {job.customer_name || 'Client'}</p>
                      <p><strong>Location:</strong> {job.locality || 'Locality'}, {job.district || job.city || 'Ranchi'}</p>
                      <p><strong>Completed On:</strong> {new Date(job.booking_date || job.preferred_date || job.created_at).toLocaleDateString()}</p>
                      <p><strong>Payout Tariff:</strong> ₹{job.price || 299}</p>
                    </div>

                    {job.review && (
                      <div className="p-3 bg-amber-50/60 rounded-2xl border border-amber-100 flex items-center gap-2 text-amber-900">
                        <Star size={14} className="text-amber-500 fill-amber-500 shrink-0" />
                        <span><strong>Customer Rating:</strong> {job.review.rating || 5}/5 — "{job.review.comment || 'Great service!'}"</span>
                      </div>
                    )}
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
              <p className="text-sm text-slate-500">Live breakdown of today's earnings, weekly payouts, and monthly ledger.</p>
            </div>

            {/* 6 Grid Metric Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="p-5 bg-slate-50 border border-slate-200 rounded-3xl">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Today's Earnings</span>
                <p className="text-2xl font-black text-slate-900 mt-1">₹{workerEarningsMetrics.today}</p>
              </div>

              <div className="p-5 bg-slate-50 border border-slate-200 rounded-3xl">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Weekly Earnings</span>
                <p className="text-2xl font-black text-slate-900 mt-1">₹{workerEarningsMetrics.weekly}</p>
              </div>

              <div className="p-5 bg-slate-50 border border-slate-200 rounded-3xl">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Monthly Earnings</span>
                <p className="text-2xl font-black text-slate-900 mt-1">₹{workerEarningsMetrics.monthly}</p>
              </div>

              <div className="p-5 bg-slate-50 border border-slate-200 rounded-3xl">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Lifetime Earnings</span>
                <p className="text-2xl font-black text-slate-900 mt-1">₹{workerEarningsMetrics.lifetime}</p>
              </div>

              <div className="p-5 bg-slate-50 border border-slate-200 rounded-3xl">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Completed Jobs</span>
                <p className="text-2xl font-black text-slate-900 mt-1">{completedJobs.length}</p>
              </div>

              <div className="p-5 bg-slate-50 border border-slate-200 rounded-3xl">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Average Job Value</span>
                <p className="text-2xl font-black text-slate-900 mt-1">₹{workerEarningsMetrics.avgJobValue}</p>
              </div>
            </div>

            {/* Recent Payouts Ledger Table */}
            <div className="rounded-3xl border border-slate-200 bg-white p-5 space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">Recent Completed Payouts</h3>
              {completedJobs.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500 font-semibold bg-slate-50 rounded-2xl">
                  No completed payout transactions recorded yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {completedJobs.slice(0, 5).map((job) => (
                    <div key={job.id} className="p-3.5 rounded-2xl border border-slate-100 bg-slate-50 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-extrabold text-slate-900 block">{job.service_name || 'Service Dispatch'}</span>
                        <span className="text-[11px] text-slate-500 font-medium">{new Date(job.booking_date || job.preferred_date || job.created_at).toLocaleDateString()}</span>
                      </div>
                      <span className="text-sm font-black text-emerald-700">+₹{job.price || 299}</span>
                    </div>
                  ))}
                </div>
              )}
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
              <p className="text-sm text-slate-500">Verified ratings and comments submitted by customers for your completed services.</p>
            </div>

            {/* Average Rating Banner */}
            <div className="p-6 bg-slate-900 text-white rounded-3xl flex items-center justify-between flex-wrap gap-4 shadow-md">
              <div className="flex items-center gap-4">
                <div className="text-4xl font-black text-amber-400 flex items-center gap-1">
                  {averageWorkerRating} <Star size={28} className="fill-amber-400" />
                </div>
                <div>
                  <h4 className="text-base font-extrabold">Overall Customer Score</h4>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">Based on {workerReviews.length} customer review{workerReviews.length === 1 ? '' : 's'}</p>
                </div>
              </div>

              <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 rounded-full text-xs font-bold border border-emerald-500/30">
                ✔ 100% Verified Quality
              </span>
            </div>

            {/* Reviews List */}
            {workerReviews.length === 0 ? (
              <div className="p-12 text-center bg-slate-50 border border-dashed border-slate-200 rounded-3xl space-y-3">
                <Star size={36} className="mx-auto text-slate-300" />
                <div>
                  <h4 className="text-sm font-extrabold text-slate-800">No Customer Reviews Yet</h4>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto mt-0.5">Reviews submitted by clients after job completion will appear here automatically.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {workerReviews.map((rev, idx) => (
                  <div key={rev.id || idx} className="p-5 rounded-3xl border border-slate-200 bg-white shadow-sm space-y-3 text-xs">
                    <div className="flex justify-between items-start flex-wrap gap-2">
                      <div>
                        <h4 className="font-extrabold text-slate-900 text-sm">{rev.customer_name || rev.userName || 'Verified Customer'}</h4>
                        <p className="text-slate-500 text-[11px] mt-0.5">Service: {rev.service_name || rev.serviceName || 'Home Service'}</p>
                      </div>

                      <div className="flex items-center gap-1 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200 text-amber-900 font-black">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            size={13}
                            className={i < (rev.rating || 5) ? 'text-amber-500 fill-amber-500' : 'text-slate-300'}
                          />
                        ))}
                        <span className="ml-1 text-[11px]">{rev.rating || 5}.0</span>
                      </div>
                    </div>

                    <p className="text-slate-700 font-medium text-xs leading-relaxed bg-slate-50 p-3 rounded-2xl border border-slate-100">
                      "{rev.comment || rev.review || 'Excellent and prompt service provided!'}"
                    </p>

                    <div className="text-[10px] text-slate-400 font-semibold text-right">
                      Date: {new Date(rev.created_at || rev.date || Date.now()).toLocaleDateString()}
                    </div>
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

            {/* Metric Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
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
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Pending Offers</p>
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
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Active Jobs</p>
                    <p className="mt-2 text-2xl font-black text-slate-900">{activeJobs.length}</p>
                  </div>
                  <div className="rounded-2xl p-2.5 bg-sky-100 text-sky-700">
                    <Briefcase size={20} />
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
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Monthly Payout</p>
                    <p className="mt-2 text-2xl font-black text-slate-900">₹{workerEarningsMetrics.monthly}</p>
                  </div>
                  <div className="rounded-2xl p-2.5 bg-violet-100 text-violet-700">
                    <IndianRupee size={20} />
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Rating</p>
                    <p className="mt-2 text-2xl font-black text-slate-900">{averageWorkerRating} ⭐</p>
                  </div>
                  <div className="rounded-2xl p-2.5 bg-amber-100 text-amber-700">
                    <Star size={20} />
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
        {/* Sidebar matching Customer Dashboard */}
        <aside className="lg:col-span-3 space-y-4">
          <ProfileCard
            user={user}
            role="worker"
            onEditProfile={() => navigate(`${location.pathname}?tab=profile`)}
          />

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
