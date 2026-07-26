import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useApp } from '../../context/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import {
  BarChart3,
  FileText,
  Building,
  Star,
  MessageCircle,
  Bell,
  Settings,
  LogOut,
  Clock,
  CheckCircle,
  AlertTriangle,
  Phone,
  Package,
  Plus,
  Search,
  Heart,
  Calendar,
  X,
  Briefcase,
  Check,
  User,
  ShieldCheck,
  MapPin,
  Tag
} from 'lucide-react';

const CustomerDashboard = () => {
  const {
    user,
    bookings,
    contractors,
    workers = [],
    services,
    updateBookingStatus,
    reviews,
    addReview,
    tickets,
    addTicket,
    updateUserProfile,
    addBooking,
    logout,
    showToast,
    confirm,
    refreshData,
    openBookingModal
  } = useApp();

  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const tabParam = searchParams.get('tab');

  const activeTab = tabParam || 'overview';

  // Profile Form States
  const [profileName, setProfileName] = useState(user?.name || '');
  const [profilePhone, setProfilePhone] = useState(user?.phone || '');
  const [profileCity, setProfileCity] = useState(user?.city || '');
  const [profileUpdating, setProfileUpdating] = useState(false);

  // Review & Support States
  const [reviewingBooking, setReviewingBooking] = useState(null);
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketMessage, setTicketMessage] = useState('');
  const [ticketLoading, setTicketLoading] = useState(false);

  // Search & Filter States
  const [contractorSearch, setContractorSearch] = useState('');
  const [workerSearch, setWorkerSearch] = useState('');
  const [savedContractorIds, setSavedContractorIds] = useState(() => {
    try {
      const stored = localStorage.getItem(`fixiva_saved_contractors_${user?.id}`);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Hire Modal State
  const [selectedEntityForHire, setSelectedEntityForHire] = useState(null); // Contractor or Worker
  const [entityType, setEntityType] = useState('contractor'); // 'contractor' or 'worker'
  const [bookingStep, setBookingStep] = useState(1);
  const [hireServiceId, setHireServiceId] = useState('');
  const [hireCity, setHireCity] = useState(user?.city || 'Ranchi');
  const [hireDate, setHireDate] = useState('');
  const [hireTimeSlot, setHireTimeSlot] = useState('09:00 AM - 12:00 PM');
  const [hireAddress, setHireAddress] = useState(user?.city ? `Main Road, ${user.city}` : '');
  const [hireNotes, setHireNotes] = useState('');
  const [bookingSubmitting, setBookingSubmitting] = useState(false);

  // Notifications State
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (user) {
      setProfileName(user.name || '');
      setProfilePhone(user.phone || '');
      setProfileCity(user.city || '');
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
  if (user && userRole !== 'customer') {
    if (userRole === 'admin') return <Navigate to="/dashboard/admin" replace />;
    if (userRole === 'worker') return <Navigate to="/worker-dashboard" replace />;
    if (userRole === 'contractor') return <Navigate to="/contractor-dashboard" replace />;
  }

  // Filtered customer bookings
  const myBookings = useMemo(() => {
    return (bookings || []).filter((b) => b.customer_id === user?.id);
  }, [bookings, user?.id]);

  const myTickets = useMemo(() => {
    return (tickets || []).filter((t) => t.user_id === user?.id);
  }, [tickets, user?.id]);

  // Overview Card Metrics (exact customer top 4 cards)
  const activeBookingsCount = useMemo(() => {
    return myBookings.filter((b) =>
      ['Pending', 'New Request', 'Accepted', 'Assigned', 'Confirmed', 'Worker Assigned', 'On The Way', 'Work Started', 'In Progress'].includes(b.status)
    ).length;
  }, [myBookings]);

  const ongoingServicesCount = useMemo(() => {
    return myBookings.filter((b) => ['On The Way', 'Work Started', 'In Progress'].includes(b.status)).length;
  }, [myBookings]);

  const completedServicesCount = useMemo(() => {
    return myBookings.filter((b) => ['Completed', 'Reviewed'].includes(b.status)).length;
  }, [myBookings]);

  const savedContractorsCount = savedContractorIds.length;

  // Toggle Save Contractor
  const toggleSaveContractor = (contractorId) => {
    let updated;
    if (savedContractorIds.includes(contractorId)) {
      updated = savedContractorIds.filter((id) => id !== contractorId);
      showToast('Contractor removed from saved list', 'info');
    } else {
      updated = [...savedContractorIds, contractorId];
      showToast('Contractor saved to favorites!', 'success');
    }
    setSavedContractorIds(updated);
    try {
      localStorage.setItem(`fixiva_saved_contractors_${user?.id}`, JSON.stringify(updated));
    } catch {
      // Ignore write errors
    }
  };

  // Profile Update
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileUpdating(true);
    const { error } = await updateUserProfile({
      name: profileName,
      phone: profilePhone,
      city: profileCity,
    });
    setProfileUpdating(false);
    if (!error) {
      showToast('Profile updated successfully!', 'success');
    }
  };

  // Report No-Show
  const handleReportNoShow = async (bookingId) => {
    const ok = await confirm('Report Worker No-Show? This will notify Fixiva Admin for immediate action.');
    if (!ok) return;
    await updateBookingStatus(bookingId, 'Worker No Show');
    showToast('Reported. We are assigning a new professional or will contact you shortly.', 'success');
  };

  // Review Submit
  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const reviewData = {
      bookingId: reviewingBooking.id,
      workerId: reviewingBooking.worker_id,
      rating: parseInt(formData.get('rating')),
      comment: formData.get('comment'),
      serviceType: reviewingBooking.service_name || reviewingBooking.service_id
    };

    const { error } = await addReview(reviewData);
    if (!error) {
      await updateBookingStatus(reviewingBooking.id, 'Reviewed');
      setReviewingBooking(null);
      showToast('Thank you for your review!', 'success');
    } else {
      showToast('Failed to submit review: ' + (error?.message || 'Error'), 'error');
    }
  };

  // Create Ticket
  const handleCreateTicket = async (e) => {
    e.preventDefault();
    if (!ticketSubject || !ticketMessage) {
      showToast('Please fill out all fields', 'error');
      return;
    }
    setTicketLoading(true);
    const { error } = await addTicket({
      user_id: user?.id,
      subject: ticketSubject,
      message: ticketMessage
    });
    setTicketLoading(false);
    if (!error) {
      showToast('Support ticket raised successfully!', 'success');
      setTicketSubject('');
      setTicketMessage('');
    } else {
      showToast('Failed to raise support ticket', 'error');
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

  // 7-Step Status Timeline Mapping
  const trackingSteps = ['Pending', 'Accepted', 'Worker Assigned', 'On The Way', 'Work Started', 'Completed', 'Reviewed'];
  const getStepIndex = (status) => {
    const s = String(status || '').trim().toLowerCase();
    if (s === 'pending' || s === 'new request') return 0;
    if (s === 'accepted') return 1;
    if (s === 'worker assigned' || s === 'assigned' || s === 'confirmed') return 2;
    if (s === 'on the way') return 3;
    if (s === 'work started' || s === 'in progress') return 4;
    if (s === 'completed') return 5;
    if (s === 'reviewed') return 6;
    return -1;
  };

  const getStatusLabel = (status) => {
    if (status === 'New Request') return 'Pending';
    if (status === 'Confirmed') return 'Worker Assigned';
    if (status === 'In Progress') return 'Work Started';
    return status;
  };

  // Sidebar Items matching exact prompt requirement
  const navItems = [
    { id: 'overview', label: 'Dashboard', icon: BarChart3 },
    { id: 'book-services', label: 'Book Services', icon: Briefcase },
    { id: 'contractors', label: 'Contractors', icon: Building },
    { id: 'workers', label: 'Workers', icon: User },
    { id: 'bookings', label: 'My Bookings', icon: FileText, count: activeBookingsCount },
    { id: 'notifications', label: 'Notifications', icon: Bell, count: notifications.filter(n => !n.read).length },
    { id: 'reviews', label: 'Reviews', icon: Star },
    { id: 'support', label: 'Support', icon: MessageCircle },
    { id: 'profile', label: 'Profile', icon: Settings },
  ];

  // Filtered Contractors & Workers
  const filteredContractors = useMemo(() => {
    return (contractors || []).filter((c) => {
      const q = contractorSearch.toLowerCase();
      return (
        !q ||
        (c.company || '').toLowerCase().includes(q) ||
        (c.owner_name || c.name || '').toLowerCase().includes(q) ||
        (c.city || '').toLowerCase().includes(q) ||
        (c.services_offered || '').toLowerCase().includes(q)
      );
    });
  }, [contractors, contractorSearch]);

  const filteredWorkersList = useMemo(() => {
    return (workers || []).filter((w) => {
      const q = workerSearch.toLowerCase();
      return (
        !q ||
        (w.name || '').toLowerCase().includes(q) ||
        (w.skills || '').toLowerCase().includes(q) ||
        (w.city || '').toLowerCase().includes(q)
      );
    });
  }, [workers, workerSearch]);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'book-services':
        return (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Book a Home Service</h2>
              <p className="text-sm text-slate-500">Simple booking flow: Select Service → City → Choose Contractor or Worker → Schedule → Confirm.</p>
            </div>

            {/* Simple Booking Flow Container */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                {/* Step 1: Select Service */}
                <div className="bg-slate-50 p-5 rounded-3xl border border-slate-200 space-y-3">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-700">1. Select Service</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {services.map((svc) => (
                      <button
                        key={svc.id}
                        type="button"
                        onClick={() => setHireServiceId(svc.id)}
                        className={`p-3 rounded-2xl border text-left transition-all ${
                          hireServiceId === svc.id
                            ? 'bg-primary text-white border-primary shadow-sm'
                            : 'bg-white border-slate-200 text-slate-800 hover:border-slate-300'
                        }`}
                      >
                        <p className="text-xs font-black">{svc.name}</p>
                        <p className={`text-[10px] mt-1 font-bold ${hireServiceId === svc.id ? 'text-blue-100' : 'text-slate-500'}`}>
                          ₹{svc.base_price || 299}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Step 2: Select City */}
                <div className="bg-slate-50 p-5 rounded-3xl border border-slate-200 space-y-3">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-700">2. Select Operating City</h3>
                  <select
                    value={hireCity}
                    onChange={(e) => setHireCity(e.target.value)}
                    className="w-full h-11 px-4 bg-white border border-slate-200 focus:border-primary rounded-2xl text-xs font-extrabold text-slate-800 outline-none"
                  >
                    <option value="Ranchi">Ranchi</option>
                    <option value="Patna">Patna</option>
                    <option value="Jamshedpur">Jamshedpur</option>
                    <option value="Dhanbad">Dhanbad</option>
                    <option value="Bokaro">Bokaro</option>
                  </select>
                </div>

                {/* Step 3: Date, Time & Address */}
                <div className="bg-slate-50 p-5 rounded-3xl border border-slate-200 space-y-3">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-700">3. Date, Time & Location</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="date"
                      value={hireDate}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={(e) => setHireDate(e.target.value)}
                      className="h-11 px-4 bg-white border border-slate-200 focus:border-primary rounded-2xl text-xs font-extrabold text-slate-800 outline-none"
                    />
                    <select
                      value={hireTimeSlot}
                      onChange={(e) => setHireTimeSlot(e.target.value)}
                      className="h-11 px-4 bg-white border border-slate-200 focus:border-primary rounded-2xl text-xs font-extrabold text-slate-800 outline-none"
                    >
                      <option value="09:00 AM - 12:00 PM">09:00 AM - 12:00 PM</option>
                      <option value="12:00 PM - 03:00 PM">12:00 PM - 03:00 PM</option>
                      <option value="03:00 PM - 06:00 PM">03:00 PM - 06:00 PM</option>
                    </select>
                  </div>
                  <input
                    type="text"
                    value={hireAddress}
                    onChange={(e) => setHireAddress(e.target.value)}
                    placeholder="Enter your street address, house no., locality..."
                    className="w-full h-11 px-4 bg-white border border-slate-200 focus:border-primary rounded-2xl text-xs font-semibold placeholder-slate-400 outline-none"
                  />
                </div>
              </div>

              {/* Order Summary Box */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4 h-fit">
                <h3 className="text-sm font-black text-slate-900 border-b border-slate-100 pb-3">Booking Order Summary</h3>
                <div className="space-y-2 text-xs font-semibold text-slate-600">
                  <div className="flex justify-between">
                    <span>Selected Service:</span>
                    <span className="font-extrabold text-slate-900">
                      {services.find((s) => s.id === hireServiceId)?.name || 'Select Service'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Operating City:</span>
                    <span className="font-extrabold text-slate-900">{hireCity}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Date & Slot:</span>
                    <span className="font-extrabold text-slate-900">{hireDate || 'Not selected'}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-100 pt-2 font-black text-slate-900 text-sm">
                    <span>Total Tariff:</span>
                    <span className="text-primary">
                      ₹{((services.find((s) => s.id === hireServiceId)?.base_price || 299) + 49)}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => openBookingModal({ serviceId: hireServiceId, city: hireCity })}
                  className="w-full py-3.5 rounded-2xl bg-primary text-xs font-extrabold text-white shadow-sm hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                >
                  <CheckCircle size={16} />
                  Proceed to Unified Booking Flow
                </button>
              </div>
            </div>
          </div>
        );

      case 'contractors':
        return (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">Contractors Directory</h2>
                <p className="text-sm text-slate-500">Hire top-rated home construction, painting, and renovation companies.</p>
              </div>
              <div className="relative max-w-xs w-full">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={contractorSearch}
                  onChange={(e) => setContractorSearch(e.target.value)}
                  placeholder="Search contractors..."
                  className="h-10 w-full rounded-2xl border border-slate-200 bg-white pl-9 pr-4 text-xs font-semibold placeholder-slate-400 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredContractors.map((contractor) => {
                const isSaved = savedContractorIds.includes(contractor.id);
                return (
                  <div key={contractor.id} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-all space-y-4 flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 rounded-2xl bg-slate-900 text-white font-black text-sm flex items-center justify-center uppercase">
                            {(contractor.company || contractor.name || 'C').charAt(0)}
                          </div>
                          <div>
                            <h3 className="text-base font-black text-slate-900">{contractor.company || 'Business Entity'}</h3>
                            <p className="text-xs text-slate-500 font-bold">Owner: {contractor.owner_name || contractor.name}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => toggleSaveContractor(contractor.id)}
                          className={`p-2 rounded-xl border ${isSaved ? 'bg-red-50 text-red-600 border-red-200' : 'bg-slate-50 text-slate-400 border-slate-200'}`}
                        >
                          <Heart size={16} fill={isSaved ? 'currentColor' : 'none'} />
                        </button>
                      </div>

                      <div className="grid grid-cols-3 gap-2 py-2 border-y border-slate-100 text-center text-xs">
                        <div className="bg-slate-50 p-2 rounded-xl">
                          <span className="text-[9px] font-black text-slate-400 uppercase block">Rating</span>
                          <span className="font-black text-slate-900 flex items-center justify-center gap-0.5 mt-0.5">
                            <Star size={12} className="text-amber-500 fill-amber-500" /> {contractor.rating || 4.9}
                          </span>
                        </div>
                        <div className="bg-slate-50 p-2 rounded-xl">
                          <span className="text-[9px] font-black text-slate-400 uppercase block">City</span>
                          <span className="font-black text-slate-900 mt-0.5 block">{contractor.city || 'Ranchi'}</span>
                        </div>
                        <div className="bg-slate-50 p-2 rounded-xl">
                          <span className="text-[9px] font-black text-slate-400 uppercase block">Starting</span>
                          <span className="font-black text-primary mt-0.5 block">₹{contractor.starting_price || 999}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        openBookingModal({ contractorObj: contractor, city: contractor.city || hireCity });
                      }}
                      className="w-full py-2.5 rounded-2xl bg-primary text-xs font-extrabold text-white shadow-sm hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                    >
                      <Briefcase size={14} /> Hire Contractor
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        );

      case 'workers':
        return (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">Verified Workers Directory</h2>
                <p className="text-sm text-slate-500">Hire individual background-checked specialists.</p>
              </div>
              <div className="relative max-w-xs w-full">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={workerSearch}
                  onChange={(e) => setWorkerSearch(e.target.value)}
                  placeholder="Search workers..."
                  className="h-10 w-full rounded-2xl border border-slate-200 bg-white pl-9 pr-4 text-xs font-semibold placeholder-slate-400 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredWorkersList.map((worker) => (
                <div key={worker.id} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-all space-y-4 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-2xl bg-slate-900 text-white font-black text-sm flex items-center justify-center uppercase overflow-hidden">
                          {worker.profile_photo_url ? (
                            <img src={worker.profile_photo_url} alt={worker.name} className="h-full w-full object-cover" />
                          ) : (
                            (worker.name || 'W').charAt(0)
                          )}
                        </div>
                        <div>
                          <h3 className="text-base font-black text-slate-900">{worker.name}</h3>
                          <p className="text-xs text-slate-500 font-bold">{worker.skills || 'General Professional'}</p>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-black text-[10px]">
                        Available Today
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 py-2 border-y border-slate-100 text-center text-xs">
                      <div className="bg-slate-50 p-2 rounded-xl">
                        <span className="text-[9px] font-black text-slate-400 uppercase block">Trust Score</span>
                        <span className="font-black text-emerald-700 mt-0.5 block">{worker.trustScore || 98}%</span>
                      </div>
                      <div className="bg-slate-50 p-2 rounded-xl">
                        <span className="text-[9px] font-black text-slate-400 uppercase block">Rating</span>
                        <span className="font-black text-slate-900 flex items-center justify-center gap-0.5 mt-0.5">
                          <Star size={12} className="text-amber-500 fill-amber-500" /> {worker.rating || 4.9}
                        </span>
                      </div>
                      <div className="bg-slate-50 p-2 rounded-xl">
                        <span className="text-[9px] font-black text-slate-400 uppercase block">Starting</span>
                        <span className="font-black text-primary mt-0.5 block">₹{worker.starting_price || worker.hourly_rate || 299}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      openBookingModal({ workerObj: worker, city: worker.city || hireCity });
                    }}
                    className="w-full py-2.5 rounded-2xl bg-primary text-xs font-extrabold text-white shadow-sm hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                  >
                    <User size={14} /> Hire Worker
                  </button>
                </div>
              ))}
            </div>
          </div>
        );

      case 'bookings':
        return (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">My Bookings History</h2>
                <p className="text-sm text-slate-500">Track 7-step booking status timelines and active service progress.</p>
              </div>
              <button
                onClick={() => navigate(`${location.pathname}?tab=book-services`)}
                className="flex items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-2.5 text-xs font-extrabold text-white shadow-sm hover:bg-blue-700"
              >
                <Plus size={16} /> Book Service
              </button>
            </div>

            <div className="space-y-6">
              {myBookings.length === 0 ? (
                <div className="py-20 text-center border-2 border-dashed border-slate-200 bg-slate-50/50 rounded-3xl space-y-4">
                  <Package size={44} className="mx-auto text-slate-300" />
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">No bookings requested yet</p>
                </div>
              ) : (
                myBookings.map((booking) => {
                  const stepIdx = getStepIndex(booking.status);
                  return (
                    <div key={booking.id} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
                      <div className="flex flex-wrap justify-between items-center gap-4 border-b border-slate-100 pb-4">
                        <div>
                          <span className="text-[10px] font-black text-primary uppercase tracking-wider">ID: {booking.id}</span>
                          <h3 className="font-extrabold text-slate-900 text-lg mt-0.5">{booking.service_name || booking.service_id}</h3>
                        </div>
                        <span className="px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-50 text-primary border border-blue-200">
                          {getStatusLabel(booking.status)}
                        </span>
                      </div>

                      {/* 7-Step Stepper Progress Bar */}
                      {stepIdx !== -1 && (
                        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
                          <div className="flex justify-between items-center relative">
                            <div className="absolute top-1/2 left-0 right-0 h-1 bg-slate-200 -translate-y-1/2 rounded-full"></div>
                            <div
                              className="absolute top-1/2 left-0 h-1 bg-primary -translate-y-1/2 rounded-full transition-all duration-500"
                              style={{ width: `${(stepIdx / 6) * 100}%` }}
                            ></div>

                            {trackingSteps.map((stepName, idx) => (
                              <div key={idx} className="relative z-10 flex flex-col items-center">
                                <div
                                  className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all ${
                                    idx <= stepIdx ? 'bg-primary border-blue-600 text-white' : 'bg-white border-slate-300 text-slate-400'
                                  }`}
                                >
                                  {idx <= stepIdx ? <CheckCircle size={14} /> : <span className="text-[10px] font-bold">{idx + 1}</span>}
                                </div>
                              </div>
                            ))}
                          </div>
                          <div className="grid grid-cols-7 text-[9px] font-extrabold text-slate-500 uppercase tracking-wider text-center pt-1">
                            {trackingSteps.map((s, i) => (
                              <span key={i} className={i === stepIdx ? 'text-primary font-black' : ''}>{s}</span>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex flex-wrap gap-6 text-xs font-semibold text-slate-600">
                        <p className="flex items-center gap-1.5"><Clock size={14} className="text-slate-400" /> Date: {new Date(booking.booking_date || booking.preferred_date).toLocaleDateString()}</p>
                        <p className="flex items-center gap-1.5"><Building size={14} className="text-slate-400" /> City: {booking.city || 'Ranchi'}</p>
                        <p className="text-slate-900 font-extrabold text-sm">Tariff: ₹{(booking.price || 0) + (booking.platform_fee || 0)}</p>
                      </div>

                      {/* Partner Details */}
                      {booking.worker_id && (
                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between flex-wrap gap-4">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-2xl bg-slate-900 text-white font-black text-xs flex items-center justify-center uppercase">
                              {getInitials(booking.worker_name)}
                            </div>
                            <div>
                              <h4 className="text-xs font-extrabold text-slate-900">Assigned Partner: {booking.worker_name}</h4>
                              <p className="text-[10px] text-slate-500 font-bold">Verified Background-Checked Specialist</p>
                            </div>
                          </div>
                          {booking.worker_phone && (
                            <a href={`tel:${booking.worker_phone}`} className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-extrabold text-slate-700 hover:bg-slate-50">
                              <Phone size={14} className="text-primary" /> Call {booking.worker_phone}
                            </a>
                          )}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-3 flex-wrap pt-2">
                        {booking.status === 'Completed' && (
                          <button onClick={() => setReviewingBooking(booking)} className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-extrabold text-white shadow-sm hover:bg-blue-700">
                            <Star size={14} /> Leave Review
                          </button>
                        )}
                        {['Assigned', 'Confirmed', 'In Progress', 'Work Started'].includes(booking.status) && (
                          <button onClick={() => handleReportNoShow(booking.id)} className="flex items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-xs font-extrabold text-red-600 hover:bg-red-50">
                            <AlertTriangle size={14} /> Report No-Show
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );

      case 'notifications':
        return (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Notifications</h2>
              <p className="text-sm text-slate-500">Service status updates and system announcements.</p>
            </div>
            {notifications.length === 0 ? (
              <div className="py-20 text-center border-2 border-dashed border-slate-200 bg-slate-50/50 rounded-3xl">
                <Bell size={38} className="mx-auto text-slate-300 mb-2" />
                <p className="text-slate-500 text-xs font-extrabold uppercase">No notifications</p>
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
              <h2 className="text-xl font-black text-slate-900 tracking-tight">My Reviews</h2>
              <p className="text-sm text-slate-500">Submitted verified service feedback.</p>
            </div>
            {reviews.filter((r) => r.userName === user?.name || myBookings.some((bk) => bk.id === r.booking_id)).length === 0 ? (
              <div className="py-20 text-center border-2 border-dashed border-slate-200 bg-slate-50/50 rounded-3xl">
                <Star size={38} className="mx-auto text-slate-300 mb-2" />
                <p className="text-slate-500 text-xs font-extrabold uppercase">No reviews submitted yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.filter((r) => r.userName === user?.name || myBookings.some((bk) => bk.id === r.booking_id)).map((r, i) => (
                  <div key={i} className="p-5 rounded-3xl border border-slate-200 bg-white shadow-sm space-y-2 text-xs">
                    <div className="flex justify-between items-center">
                      <div className="flex text-amber-500 gap-1">
                        {[...Array(5)].map((_, j) => <Star key={j} size={14} fill={j < r.rating ? "currentColor" : "none"} />)}
                      </div>
                      <span className="text-[10px] font-black text-primary uppercase">{r.serviceType || 'Home Service'}</span>
                    </div>
                    <p className="text-slate-700 italic">"{r.comment}"</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'support':
        return (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Support Tickets</h2>
              <p className="text-sm text-slate-500">Raise help center tickets and review resolution status.</p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
              <form onSubmit={handleCreateTicket} className="space-y-4 bg-slate-50 p-6 rounded-3xl border border-slate-200 text-xs font-semibold">
                <h3 className="font-extrabold text-slate-900 text-sm">Raise Help Ticket</h3>
                <input
                  className="w-full h-11 px-4 bg-white border border-slate-200 rounded-2xl outline-none"
                  placeholder="Inquiry Subject"
                  value={ticketSubject}
                  onChange={(e) => setTicketSubject(e.target.value)}
                  required
                />
                <textarea
                  className="w-full p-4 bg-white border border-slate-200 rounded-2xl outline-none"
                  rows="4"
                  placeholder="Explain details of your ticket..."
                  value={ticketMessage}
                  onChange={(e) => setTicketMessage(e.target.value)}
                  required
                />
                <button type="submit" disabled={ticketLoading} className="w-full py-3 rounded-2xl bg-primary text-white font-extrabold">
                  {ticketLoading ? 'Sending...' : 'Submit Support Ticket'}
                </button>
              </form>
              <div className="space-y-3">
                <h3 className="font-extrabold text-slate-900 text-sm">Ticket History</h3>
                {myTickets.map((t) => (
                  <div key={t.id} className="p-4 bg-white border border-slate-200 rounded-2xl text-xs space-y-1">
                    <h4 className="font-bold text-slate-900">{t.subject}</h4>
                    <p className="text-slate-600">{t.message}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'profile':
        return (
          <div className="space-y-6 max-w-xl">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Profile Settings</h2>
              <p className="text-sm text-slate-500">Manage account credentials and contact info.</p>
            </div>
            <form onSubmit={handleProfileSubmit} className="bg-slate-50 border border-slate-200 p-8 rounded-3xl space-y-4 text-xs font-semibold">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase">Registered Name</label>
                <input className="w-full h-11 px-4 bg-white border border-slate-200 rounded-2xl outline-none" value={profileName} onChange={(e) => setProfileName(e.target.value)} required />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase">Email</label>
                <input className="w-full h-11 px-4 bg-slate-100 border border-slate-200 rounded-2xl text-slate-500 outline-none" value={user?.email || ''} disabled />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase">Phone</label>
                <input className="w-full h-11 px-4 bg-white border border-slate-200 rounded-2xl outline-none" value={profilePhone} onChange={(e) => setProfilePhone(e.target.value)} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase">City</label>
                <input className="w-full h-11 px-4 bg-white border border-slate-200 rounded-2xl outline-none" value={profileCity} onChange={(e) => setProfileCity(e.target.value)} />
              </div>
              <button type="submit" disabled={profileUpdating} className="w-full py-3 rounded-2xl bg-primary text-white font-extrabold">
                {profileUpdating ? 'Saving...' : 'Save Profile Changes'}
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
                <h2 className="text-xl font-black text-slate-900 tracking-tight">Customer Dashboard Overview</h2>
                <p className="text-sm text-slate-500">Welcome back, {user?.name || 'Customer'}! Here is your home service activity summary.</p>
              </div>
            </div>

            {/* Exact Top 4 Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Active Bookings</p>
                    <p className="mt-2 text-2xl font-black text-slate-900">{activeBookingsCount}</p>
                  </div>
                  <div className="rounded-2xl p-2.5 bg-blue-100 text-blue-700">
                    <Clock size={20} />
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Ongoing Services</p>
                    <p className="mt-2 text-2xl font-black text-slate-900">{ongoingServicesCount}</p>
                  </div>
                  <div className="rounded-2xl p-2.5 bg-amber-100 text-amber-700">
                    <Briefcase size={20} />
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Completed Services</p>
                    <p className="mt-2 text-2xl font-black text-slate-900">{completedServicesCount}</p>
                  </div>
                  <div className="rounded-2xl p-2.5 bg-emerald-100 text-emerald-700">
                    <CheckCircle size={20} />
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Saved Contractors</p>
                    <p className="mt-2 text-2xl font-black text-slate-900">{savedContractorsCount}</p>
                  </div>
                  <div className="rounded-2xl p-2.5 bg-violet-100 text-violet-700">
                    <Building size={20} />
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions & Recent Activity */}
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Recent Service Activity</h3>
                  <button onClick={() => navigate(`${location.pathname}?tab=bookings`)} className="text-xs font-extrabold text-primary hover:underline">
                    View All
                  </button>
                </div>
                <div className="space-y-3">
                  {myBookings.length === 0 ? (
                    <div className="p-6 text-center bg-white rounded-2xl border border-slate-200 text-xs text-slate-500 font-semibold">
                      No service activity recorded yet.
                    </div>
                  ) : (
                    myBookings.slice(0, 3).map((item) => (
                      <div key={item.id} className="rounded-2xl border border-slate-200 bg-white p-4 flex items-center justify-between gap-3">
                        <div>
                          <p className="text-xs font-extrabold text-slate-900">{item.service_name || 'Home Service'}</p>
                          <p className="mt-0.5 text-[11px] text-slate-500">
                            Partner: {item.worker_name || 'Assigning Partner'} • <span className="font-extrabold text-slate-700">{getStatusLabel(item.status)}</span>
                          </p>
                        </div>
                        <span className="text-[10px] font-black text-slate-400 uppercase">
                          ₹{(item.price || 0) + (item.platform_fee || 0)}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Quick Book Specialists</h3>
                  <button onClick={() => navigate(`${location.pathname}?tab=workers`)} className="text-xs font-extrabold text-primary hover:underline">
                    Browse Workers
                  </button>
                </div>
                <div className="space-y-3">
                  {(workers || []).slice(0, 3).map((w) => (
                    <div key={w.id} className="rounded-2xl border border-slate-200 bg-white p-4 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-extrabold text-slate-900">{w.name}</p>
                        <p className="mt-0.5 text-[11px] text-slate-500">{w.skills || 'Specialist'} • {w.city || 'Ranchi'}</p>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedEntityForHire(w);
                          setEntityType('worker');
                          setHireServiceId(services[0]?.id || 'electrician');
                          setBookingStep(1);
                        }}
                        className="rounded-xl bg-slate-900 px-3 py-1.5 text-[11px] font-extrabold text-white hover:bg-primary transition-all"
                      >
                        Hire
                      </button>
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
                {getInitials(user?.name)}
              </div>
              <div>
                <p className="text-sm font-black">{user?.name || 'Customer Account'}</p>
                <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400 font-bold">Customer Desk</p>
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
        <main id="customer-panel-content" className="lg:col-span-9 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm min-h-[600px]">
          {renderTabContent()}
        </main>
      </div>

      {/* Review Modal */}
      {reviewingBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-2xl max-w-md w-full border border-slate-200 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-slate-900">Rate Service Experience</h3>
                <p className="text-xs text-slate-500 font-semibold mt-0.5">Leave verified review feedback.</p>
              </div>
              <button onClick={() => setReviewingBooking(null)} className="p-2 text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleReviewSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase">Stars Rating</label>
                <select name="rating" className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800" required>
                  <option value="5">5 Stars - Excellent</option>
                  <option value="4">4 Stars - Very Good</option>
                  <option value="3">3 Stars - Average</option>
                  <option value="2">2 Stars - Poor</option>
                  <option value="1">1 Star - Terrible</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase">Written Review</label>
                <textarea name="comment" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold placeholder-slate-400 outline-none" rows="3" required placeholder="Share details of your experience..."></textarea>
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button type="button" onClick={() => setReviewingBooking(null)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50">Cancel</button>
                <button type="submit" className="rounded-xl bg-primary px-5 py-2.5 text-xs font-extrabold text-white shadow-sm hover:bg-blue-700">Submit Review</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerDashboard;
