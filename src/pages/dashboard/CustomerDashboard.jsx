import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../../context/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import {
  BarChart3,
  FileText,
  Building,
  Star,
  Bell,
  Settings,
  LogOut,
  Heart,
  X,
  User,
  ShieldCheck,
  MapPin,
  Sparkles,
  Send,
  Headphones,
  Camera
} from 'lucide-react';
import HierarchicalLocationSelector from '../../components/HierarchicalLocationSelector';
import ProfileCard from '../../components/ProfileCard';
import BookingStatusTimeline from '../../components/booking/BookingStatusTimeline';
import { uploadImage } from '../../services/storageService';

const getServiceIcon = (iconName, serviceName = '') => {
  const lowerName = String(serviceName).toLowerCase();
  const lowerIcon = String(iconName).toLowerCase();

  if (lowerIcon === 'zap' || lowerName.includes('electrician') || lowerName.includes('electric')) return '⚡';
  if (lowerIcon === 'droplets' || lowerIcon === 'wrench' || lowerName.includes('plumber') || lowerName.includes('plumb')) return '💧';
  if (lowerIcon === 'wind' || lowerName.includes('ac') || lowerName.includes('cool')) return '❄️';
  if (lowerIcon === 'sparkles' || lowerName.includes('clean')) return '✨';
  if (lowerIcon === 'paintbrush' || lowerName.includes('paint')) return '🎨';
  if (lowerIcon === 'hammer' || lowerName.includes('carpenter') || lowerName.includes('wood')) return '🔨';
  if (lowerIcon === 'bug' || lowerName.includes('pest')) return '🪲';
  if (lowerIcon === 'truck' || lowerName.includes('mover')) return '🚚';
  if (lowerIcon === 'tv' || lowerName.includes('appliance')) return '📺';
  return '🛠️';
};

const CustomerDashboard = () => {
  const {
    user,
    services = [],
    bookings = [],
    contractors = [],
    workers = [],
    updateBookingStatus,
    reviews = [],
    addReview,
    tickets = [],
    addTicket,
    updateUserProfile,
    logout,
    showToast,
    refreshData
  } = useApp();

  const activeServices = useMemo(() => {
    return (services || []).filter(
      (s) => s.active !== false && s.active !== 'false' && s.active !== 0 && s.active !== '0'
    );
  }, [services]);

  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const tabParam = searchParams.get('tab');

  const activeTab = tabParam || 'overview';

  // Profile Form States
  const [profileName, setProfileName] = useState(user?.name || '');
  const [profilePhone, setProfilePhone] = useState(user?.phone || '');
  const [profileState, setProfileState] = useState(user?.state || 'Jharkhand');
  const [profileDistrict, setProfileDistrict] = useState(user?.district || user?.city || 'Ranchi');
  const [profileLocality, setProfileLocality] = useState(user?.locality || 'Lalpur');
  const [profileUpdating, setProfileUpdating] = useState(false);
  const [photoUrl, setPhotoUrl] = useState(user?.profile_photo_url || '');
  const photoFileInputRef = useRef(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  // Review & Support States
  const [reviewingBooking, setReviewingBooking] = useState(null);
  const [chatInputMessage, setChatInputMessage] = useState('');
  const [chatSending, setChatSending] = useState(false);
  const chatBottomRef = useRef(null);

  // Search & Filter States
  const [savedContractorIds, setSavedContractorIds] = useState(() => {
    try {
      const stored = localStorage.getItem(`fixiva_saved_contractors_${user?.id}`);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      void e;
      return [];
    }
  });

  // Saved Addresses State
  const [savedAddresses, setSavedAddresses] = useState(() => {
    try {
      const stored = localStorage.getItem(`fixiva_saved_addresses_${user?.id}`);
      return stored ? JSON.parse(stored) : [
        { id: 'addr-1', tag: 'Home', locality: user?.locality || 'Lalpur', district: user?.district || user?.city || 'Ranchi', state: user?.state || 'Jharkhand', pincode: '834001' }
      ];
    } catch {
      return [
        { id: 'addr-1', tag: 'Home', locality: user?.locality || 'Lalpur', district: user?.district || user?.city || 'Ranchi', state: user?.state || 'Jharkhand', pincode: '834001' }
      ];
    }
  });
  const [newAddrLocality, setNewAddrLocality] = useState('');
  const [newAddrTag, setNewAddrTag] = useState('Home');
  const [showAddAddrModal, setShowAddAddrModal] = useState(false);

  // Notifications State
  const [notifications, setNotifications] = useState([]);
  const [liveTickets, setLiveTickets] = useState(tickets);

  useEffect(() => {
    if (user) {
      queueMicrotask(() => {
        setProfileName(user.name || '');
        setProfilePhone(user.phone || '');
        setProfileState(user.state || 'Jharkhand');
        setProfileDistrict(user.district || user.city || 'Ranchi');
        setProfileLocality(user.locality || 'Lalpur');
        setPhotoUrl(user.profile_photo_url || '');
      });
    }
  }, [user]);

  // Realtime Support Tickets Sync
  useEffect(() => {
    queueMicrotask(() => {
      const userTickets = (tickets || []).filter(t => t.user_id === user?.id);
      setLiveTickets(userTickets);
    });
  }, [tickets, user?.id]);

  useEffect(() => {
    if (!user?.id || !supabase) return;

    const channel = supabase
      .channel(`customer-support-${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'support_tickets', filter: `user_id=eq.${user.id}` },
        async () => {
          const { data } = await supabase
            .from('support_tickets')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: true });
          if (data) setLiveTickets(data);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  // Scroll to bottom of chat
  useEffect(() => {
    if (activeTab === 'support') {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [liveTickets, activeTab]);

  // Fetch Notifications & Realtime Subscription
  const fetchNotifications = useCallback(async () => {
    if (!user?.id || !supabase) return;
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .or(`user_id.eq.${user.id},target_role.in.(customer,all,CUSTOMER,ALL)`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Customer notification fetch error:', error);
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
      console.error('Exception fetching customer notifications:', err);
    }
  }, [user]);

  useEffect(() => {
    queueMicrotask(() => {
      fetchNotifications();
    });

    if (!user?.id || !supabase) return;

    const notifChannel = supabase
      .channel(`customer-notifications-${user.id}`)
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

  // Mark Customer Notifications as read when opening notifications tab
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

  // Filtered Customer Bookings
  const myBookings = useMemo(() => {
    return (bookings || []).filter((b) => b.customer_id === user?.id);
  }, [bookings, user?.id]);

  // Active / Upcoming Bookings
  const upcomingBookings = useMemo(() => {
    return myBookings.filter((b) =>
      ['Pending', 'New Request', 'Accepted', 'Assigned', 'Confirmed', 'Worker Assigned', 'On The Way', 'Work Started', 'In Progress'].includes(b.status)
    );
  }, [myBookings]);

  // Saved Contractors
  const savedContractorsList = useMemo(() => {
    return (contractors || []).filter(c => savedContractorIds.includes(c.id));
  }, [contractors, savedContractorIds]);

  // Saved Address Handler
  const handleAddAddress = (e) => {
    e.preventDefault();
    if (!newAddrLocality.trim()) return;
    const newAddr = {
      id: `addr-${Date.now()}`,
      tag: newAddrTag,
      locality: newAddrLocality.trim(),
      district: profileDistrict,
      state: profileState,
      pincode: '834001'
    };
    const updated = [...savedAddresses, newAddr];
    setSavedAddresses(updated);
    try {
      localStorage.setItem(`fixiva_saved_addresses_${user?.id}`, JSON.stringify(updated));
    } catch (err) { void err; }
    setNewAddrLocality('');
    setShowAddAddrModal(false);
    showToast('Address saved successfully!', 'success');
  };

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
    } catch (err) { void err; }
  };

  // Profile Photo Upload Handlers
  const handlePhotoFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingPhoto(true);
    try {
      const { success, url, error } = await uploadImage(file, 'cms-assets', 'customer-photos');
      if (success && url) {
        setPhotoUrl(url);
        const { error: profileErr } = await updateUserProfile({ profile_photo_url: url });
        if (!profileErr) {
          showToast('Profile photo updated & picture changed successfully!', 'success');
          if (refreshData) await refreshData();
        } else {
          showToast('Photo uploaded but updating profile failed.', 'error');
        }
      } else {
        showToast(`Image upload failed: ${error || 'Unknown error'}`, 'error');
      }
    } catch (err) {
      console.error('Photo upload error:', err);
      showToast('An error occurred during photo upload.', 'error');
    } finally {
      setIsUploadingPhoto(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleRemovePhoto = async () => {
    setPhotoUrl('');
    const { error } = await updateUserProfile({ profile_photo_url: '' });
    if (!error) {
      showToast('Profile photo removed.', 'info');
      if (refreshData) await refreshData();
    }
  };

  // Profile Update Submit
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileUpdating(true);
    const { error } = await updateUserProfile({
      name: profileName,
      phone: profilePhone,
      state: profileState,
      district: profileDistrict,
      locality: profileLocality,
      city: profileDistrict,
      profile_photo_url: photoUrl
    });
    setProfileUpdating(false);
    if (!error) {
      showToast('Profile updated successfully!', 'success');
      if (refreshData) await refreshData();
    } else {
      showToast('Failed to update profile: ' + (error?.message || 'Unknown error'), 'error');
    }
  };

  // Chat Support Send Message
  const handleSendSupportMessage = async (e, customMsg = null) => {
    if (e && e.preventDefault) e.preventDefault();
    const messageText = (customMsg || chatInputMessage).trim();
    if (!messageText) return;

    setChatInputMessage('');
    setChatSending(true);

    const { error } = await addTicket({
      user_id: user?.id,
      subject: `Support Conversation (${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`,
      message: messageText
    });

    setChatSending(false);
    if (!error) {
      showToast('Message sent to Fixiva Support Desk!', 'success');
      const fetchLatest = async () => {
        const { data } = await supabase
          .from('support_tickets')
          .select('*')
          .eq('user_id', user?.id)
          .order('created_at', { ascending: true });
        if (data) setLiveTickets(data);
      };
      await fetchLatest();
      // Poll again after AI generation delay (~650ms)
      setTimeout(fetchLatest, 650);
    } else {
      showToast('Failed to send message', 'error');
    }
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
      showToast('Failed to submit review', 'error');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getStatusLabel = (status) => {
    if (status === 'New Request') return 'Pending';
    if (status === 'Confirmed') return 'Worker Assigned';
    if (status === 'In Progress') return 'Work Started';
    return status;
  };

  // Sidebar Items
  const navItems = [
    { id: 'overview', label: 'Dashboard', icon: BarChart3 },
    { id: 'bookings', label: 'My Bookings', icon: FileText, count: upcomingBookings.length },
    { id: 'support', label: 'Support Desk', icon: Headphones },
    { id: 'contractors', label: 'Contractors', icon: Building },
    { id: 'workers', label: 'Workers', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell, count: notifications.filter(n => !n.read).length },
    { id: 'reviews', label: 'Reviews', icon: Star },
    { id: 'profile', label: 'My Profile', icon: Settings },
  ];

  // Render Content Switch
  const renderTabContent = () => {
    switch (activeTab) {
      
      // SUPPORT DESK: WHATSAPP-STYLE CHAT INTERFACE
      case 'support':
        return (
          <div className="space-y-4 max-w-3xl mx-auto">
            {/* Header */}
            <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-primary text-white flex items-center justify-center shadow-md font-bold">
                  <Headphones size={22} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-extrabold text-slate-900">Fixiva Support Desk</h2>
                    <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                      ⚡ Instant Response
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">Live chat assistance for bookings, dispatches & inquiries.</p>
                </div>
              </div>

              <span className="text-[11px] font-bold text-slate-400">Official Channel</span>
            </div>

            {/* WhatsApp-Style Chat Container */}
            <div className="bg-slate-900/95 rounded-3xl border border-slate-800 shadow-xl overflow-hidden flex flex-col h-[520px]">
              
              {/* Chat Thread Messages Area */}
              <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px]">
                
                {/* Welcome Message Bubble */}
                <div className="flex justify-start">
                  <div className="max-w-xs sm:max-w-md rounded-2xl rounded-tl-sm bg-slate-800 text-slate-100 p-4 border border-slate-700/60 shadow-sm space-y-1">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-primary">
                      <ShieldCheck size={13} /> Fixiva Support Desk
                    </div>
                    <p className="text-xs font-medium leading-relaxed">
                      Hello {user?.name || 'Customer'}! 👋 Welcome to Fixiva Live Support. How can we assist you with your home services today?
                    </p>
                    <span className="text-[9px] text-slate-400 block text-right">Official Desk</span>
                  </div>
                </div>

                {/* Dynamic Thread Messages */}
                {liveTickets.map(t => (
                  <div key={t.id} className="space-y-3">
                    {/* Customer Message Bubble (Right) */}
                    <div className="flex justify-end">
                      <div className="max-w-xs sm:max-w-md rounded-2xl rounded-tr-sm bg-primary text-white p-3.5 shadow-sm space-y-1">
                        <p className="text-xs font-semibold leading-relaxed whitespace-pre-wrap">{t.message}</p>
                        <span className="text-[9px] text-blue-200 block text-right">
                          {t.created_at ? new Date(t.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Sent'}
                        </span>
                      </div>
                    </div>

                    {/* Admin Support Reply Bubble (Left - Displays when Admin replies) */}
                    {t.admin_reply && (
                      <div className="flex justify-start">
                        <div className="max-w-xs sm:max-w-md rounded-2xl rounded-tl-sm bg-emerald-950/90 text-emerald-100 p-3.5 border border-emerald-800/60 shadow-sm space-y-1">
                          <div className="flex items-center gap-1.5 text-[10px] font-black text-emerald-400 uppercase tracking-wider">
                            <ShieldCheck size={12} /> Fixiva Support Team
                          </div>
                          <p className="text-xs font-semibold leading-relaxed whitespace-pre-wrap">{t.admin_reply}</p>
                          <span className="text-[9px] text-emerald-400/80 block text-right">
                            {t.created_at ? new Date(t.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Replied'}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                
                <div ref={chatBottomRef} />
              </div>

              {/* Quick AI Suggestions */}
              <div className="px-4 py-2 bg-slate-900/90 border-t border-slate-800 flex items-center gap-2 overflow-x-auto no-scrollbar">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
                  <Sparkles size={11} className="text-amber-400" /> AI Suggestions:
                </span>
                {['How do I track my booking?', 'What services do you offer?', 'Pricing & fee breakdown', 'Escalate to Admin'].map((prompt, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={(e) => handleSendSupportMessage(e, prompt)}
                    className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-primary text-[10px] text-slate-300 hover:text-white border border-slate-700 font-medium whitespace-nowrap transition-all shrink-0"
                  >
                    {prompt}
                  </button>
                ))}
              </div>

              {/* Chat Input Bar */}
              <form onSubmit={handleSendSupportMessage} className="p-3 bg-slate-900 border-t border-slate-800 flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Type your message to support desk..."
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-400 outline-none focus:border-primary font-medium"
                  value={chatInputMessage}
                  onChange={(e) => setChatInputMessage(e.target.value)}
                />

                <button
                  type="submit"
                  disabled={chatSending || !chatInputMessage.trim()}
                  className="btn-primary rounded-xl px-4 py-2.5 text-xs font-bold flex items-center gap-1.5 shadow-md shrink-0"
                >
                  <Send size={14} />
                  <span>{chatSending ? 'Sending...' : 'Send'}</span>
                </button>
              </form>
            </div>
          </div>
        );

      // MY BOOKINGS TAB
      case 'bookings':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">My Bookings & Dispatches</h2>
                <p className="text-sm text-slate-500">Track current dispatches and view historical orders.</p>
              </div>

              <button onClick={() => navigate('/book')} className="btn-primary text-xs px-4 py-2.5 rounded-xl font-bold shadow-md">
                + Book New Service
              </button>
            </div>

            <div className="space-y-4">
              {myBookings.length === 0 ? (
                <div className="p-10 text-center bg-slate-50 rounded-3xl border border-slate-200/80 space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-white text-slate-400 flex items-center justify-center mx-auto shadow-sm">
                    <FileText size={24} />
                  </div>
                  <h4 className="text-sm font-extrabold text-slate-800">No Booking Records Yet</h4>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto">Book certified electricians, plumbers, and home repair experts in minutes.</p>
                  <button onClick={() => navigate('/book')} className="btn-primary text-xs px-5 py-2 rounded-xl font-bold">
                    Book Service Now
                  </button>
                </div>
              ) : (
                myBookings.map((b) => (
                  <div key={b.id} className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                      <div>
                        <span className="text-[10px] font-black uppercase text-primary tracking-widest">{b.id}</span>
                        <h3 className="font-extrabold text-slate-900 text-sm">{b.service_name || 'Home Service'}</h3>
                      </div>

                      <span className="px-3 py-1 rounded-full text-[10px] font-black bg-blue-50 text-primary border border-blue-100 w-fit">
                        ● {getStatusLabel(b.status)}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div>
                        <span className="text-slate-400 font-bold block text-[10px] uppercase">Specialist</span>
                        <span className="font-extrabold text-slate-900">{b.worker_name || 'Dispatch Pending'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-bold block text-[10px] uppercase">Location</span>
                        <span className="font-extrabold text-slate-900">{b.locality || b.district || 'Ranchi'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-bold block text-[10px] uppercase">Total Payable</span>
                        <span className="font-black text-slate-900">₹{(b.price || 0) + (b.platform_fee || 49)}</span>
                      </div>
                    </div>

                    {b.status === 'Completed' && (
                      <div className="pt-2 flex justify-end">
                        <button
                          onClick={() => setReviewingBooking(b)}
                          className="px-4 py-2 rounded-xl bg-amber-50 text-amber-800 font-bold text-xs hover:bg-amber-100 transition-all flex items-center gap-1"
                        >
                          <Star size={13} fill="currentColor" /> Leave Verified Review
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        );

      // CONTRACTORS TAB
      case 'contractors':
        return (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Verified Contractor Agencies</h2>
              <p className="text-sm text-slate-500">Enterprise contractors for large scale projects.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {contractors.map(c => (
                <div key={c.id} className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-sm">{c.company || c.owner_name}</h3>
                      <p className="text-xs text-slate-500 font-medium">{c.city || 'Ranchi'} District</p>
                    </div>

                    <button onClick={() => toggleSaveContractor(c.id)} className="text-rose-500">
                      <Heart size={18} fill={savedContractorIds.includes(c.id) ? "currentColor" : "none"} />
                    </button>
                  </div>

                  <p className="text-xs text-slate-600 font-semibold bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    Services: {c.services_offered || 'All Home Contracting'}
                  </p>

                  <button
                    onClick={() => navigate(`/book?district=${encodeURIComponent(c.city || 'Ranchi')}`)}
                    className="btn-primary w-full py-2.5 rounded-xl text-xs font-bold shadow-sm"
                  >
                    Book Agency Service
                  </button>
                </div>
              ))}
            </div>
          </div>
        );

      // WORKERS TAB
      case 'workers':
        return (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Certified Worker Specialists</h2>
              <p className="text-sm text-slate-500">Individual skilled professionals ready for quick dispatch.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {workers.map(w => (
                <div key={w.id} className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <img src={w.profile_photo_url || "https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=150&auto=format&fit=crop&q=80"} alt={w.name} className="w-12 h-12 rounded-2xl object-cover" />
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-sm">{w.name}</h3>
                      <p className="text-xs text-slate-500 font-medium">{w.skills || 'Specialist'} • {w.district || w.city || 'Ranchi'}</p>
                    </div>
                  </div>

                  <button onClick={() => navigate(`/book?district=${encodeURIComponent(w.district || w.city || 'Ranchi')}`)} className="btn-primary text-xs px-4 py-2 rounded-xl font-bold shadow-sm">
                    Hire Now
                  </button>
                </div>
              ))}
            </div>
          </div>
        );

      // REVIEWS TAB
      case 'reviews':
        return (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-xl font-black text-slate-900 tracking-tight">My Reviews</h2>
              <p className="text-sm text-slate-500">Verified feedback given to specialists.</p>
            </div>

            <div className="space-y-3">
              {reviews.filter(r => r.customer_id === user?.id || r.userName === user?.name).length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-3xl text-xs font-bold text-slate-500 border border-slate-100">
                  You haven't submitted any reviews yet.
                </div>
              ) : (
                reviews.map(r => (
                  <div key={r.id} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 text-xs">{r.serviceType || 'Service'}</span>
                      <span className="flex items-center gap-1 text-amber-500 font-bold text-xs"><Star size={13} fill="currentColor" /> {r.rating}</span>
                    </div>
                    <p className="text-xs text-slate-600 font-medium">{r.comment}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        );

      // NOTIFICATIONS TAB
      case 'notifications':
        return (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Notifications</h2>
              <p className="text-sm text-slate-500">Order updates and promotional alerts.</p>
            </div>

            <div className="space-y-3">
              {notifications.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-3xl text-xs font-bold text-slate-500 border border-slate-100">
                  No notifications.
                </div>
              ) : (
                notifications.map(n => (
                  <div key={n.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs space-y-1">
                    <h4 className="font-bold text-slate-900">{n.title}</h4>
                    <p className="text-slate-600 font-medium">{n.message}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        );

      // PROFILE TAB
      case 'profile':
        return (
          <div className="space-y-6 max-w-xl">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Profile & Location Settings</h2>
              <p className="text-sm text-slate-500">Manage account credentials and primary service address.</p>
            </div>

            <form onSubmit={handleProfileSubmit} className="bg-slate-50 border border-slate-200 p-6 sm:p-8 rounded-3xl space-y-4 text-xs font-semibold">
              {/* Profile Photo Upload */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Profile Photo</label>
                <div className="flex flex-col sm:flex-row items-center gap-4 p-4 bg-white border border-slate-200 rounded-2xl shadow-sm">
                  <div className="relative group shrink-0">
                    <img
                      src={photoUrl || user?.profile_photo_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                      alt="Profile Avatar"
                      className="w-20 h-20 rounded-full object-cover border-2 border-slate-100 shadow-sm"
                    />
                    <button
                      type="button"
                      onClick={() => photoFileInputRef.current?.click()}
                      className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center text-white text-[10px] font-black gap-1 cursor-pointer"
                    >
                      <Camera size={18} /> Change
                    </button>
                  </div>

                  <div className="space-y-2 text-center sm:text-left flex-1 w-full">
                    <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start">
                      <button
                        type="button"
                        disabled={isUploadingPhoto}
                        onClick={() => photoFileInputRef.current?.click()}
                        className="px-4 py-2.5 bg-primary text-white rounded-xl font-extrabold text-xs hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 cursor-pointer"
                      >
                        {isUploadingPhoto ? (
                          <>
                            <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span>Uploading Photo...</span>
                          </>
                        ) : (
                          <>
                            <Camera size={15} />
                            <span>Upload from Gallery or Camera</span>
                          </>
                        )}
                      </button>

                      {(photoUrl || user?.profile_photo_url) && (
                        <button
                          type="button"
                          onClick={handleRemovePhoto}
                          className="px-3 py-2.5 text-slate-500 hover:text-red-600 rounded-xl font-bold text-xs transition-all border border-slate-200 hover:bg-red-50 cursor-pointer"
                        >
                          Remove Photo
                        </button>
                      )}
                    </div>

                    <p className="text-[11px] text-slate-400 font-medium">
                      Tap above to snap a photo with your camera or choose an image from your device gallery.
                    </p>

                    <input
                      ref={photoFileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoFileChange}
                      className="hidden"
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase">Customer Name</label>
                <input className="w-full h-11 px-4 bg-white border border-slate-200 rounded-2xl outline-none" value={profileName} onChange={(e) => setProfileName(e.target.value)} required />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase">Email Address</label>
                <input className="w-full h-11 px-4 bg-slate-100 border border-slate-200 rounded-2xl text-slate-500 outline-none" value={user?.email || ''} disabled />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase">Phone Number</label>
                <input className="w-full h-11 px-4 bg-white border border-slate-200 rounded-2xl outline-none" value={profilePhone} onChange={(e) => setProfilePhone(e.target.value)} />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase">Default Location Hierarchy</label>
                <HierarchicalLocationSelector
                  selectedState={profileState}
                  selectedDistrict={profileDistrict}
                  selectedLocality={profileLocality}
                  onChange={({ state, district, locality }) => {
                    setProfileState(state);
                    setProfileDistrict(district);
                    setProfileLocality(locality);
                  }}
                  layout="col"
                />
              </div>

              <button type="submit" disabled={profileUpdating} className="btn-primary w-full py-3 rounded-2xl font-extrabold shadow-md">
                {profileUpdating ? 'Saving...' : 'Save Profile Changes'}
              </button>
            </form>
          </div>
        );

      // OVERVIEW TAB: ACTIVE CUSTOMER DASHBOARD
      case 'overview':
      default:
        return (
          <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-4">
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Customer Dashboard</h2>
                <p className="text-xs text-slate-500 font-medium mt-1">Welcome back, <span className="font-extrabold text-slate-800">{user?.name || 'Valued Customer'}</span>!</p>
              </div>

              <button onClick={() => navigate('/book')} className="btn-primary text-xs px-5 py-2.5 rounded-xl font-bold shadow-md shrink-0 flex items-center gap-1.5">
                <Sparkles size={15} /> Book Specialist Now
              </button>
            </div>

            {/* Quick Book Category Shortcuts */}
            <div className="space-y-3">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Quick Book Category Shortcuts</h3>

              {activeServices.length === 0 ? (
                <div className="p-4 rounded-2xl bg-white border border-slate-100 text-center text-xs text-slate-500 font-medium">
                  No active services available at the moment.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                  {activeServices.map((s) => {
                    const iconEmoji = getServiceIcon(s.icon, s.name);
                    const basePrice = s.base_price || s.inspection_fee || s.basePrice || 0;
                    const priceDisplay = basePrice ? `₹${basePrice}` : 'On Request';
                    return (
                      <button
                        key={s.id}
                        onClick={() => navigate(`/book/${s.id}?district=${encodeURIComponent(profileDistrict)}`)}
                        className="p-3.5 rounded-2xl bg-white border border-slate-100 hover:border-primary shadow-sm hover:shadow-md transition-all flex flex-col items-center text-center gap-1.5 group"
                      >
                        <span className="text-2xl group-hover:scale-110 transition-transform">{iconEmoji}</span>
                        <span className="font-extrabold text-xs text-slate-800 group-hover:text-primary">{s.name}</span>
                        <span className="text-[10px] text-slate-400 font-bold">{priceDisplay}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Upcoming Bookings Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-slate-900">Upcoming Bookings & Active Dispatches</h3>
                <button onClick={() => navigate(`${location.pathname}?tab=bookings`)} className="text-xs font-bold text-primary hover:underline">
                  View All ({myBookings.length})
                </button>
              </div>

              {upcomingBookings.length === 0 ? (
                <div className="p-8 text-center bg-gradient-to-b from-blue-50/40 to-slate-50 rounded-3xl border border-blue-100/80 space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-white text-primary flex items-center justify-center mx-auto shadow-md border border-slate-100">
                    <Sparkles size={28} />
                  </div>
                  <div>
                    <h4 className="text-base font-extrabold text-slate-900">No Upcoming Bookings</h4>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">Need an electrician, plumber, or home repair expert? Book top-rated specialists in seconds.</p>
                  </div>
                  <button onClick={() => navigate('/book')} className="btn-primary text-xs px-5 py-2.5 rounded-xl font-bold shadow-md">
                    Book Service Now →
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {upcomingBookings.map(b => (
                    <div key={b.id} className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                        <span className="text-[10px] font-black uppercase text-primary">BOOKING ID: {b.id}</span>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-blue-50 text-primary border border-blue-100">
                          ● {getStatusLabel(b.status)}
                        </span>
                      </div>

                      <div>
                        <h4 className="font-extrabold text-slate-900 text-sm">{b.service_name || 'Home Service'}</h4>
                        <p className="text-xs text-slate-500 font-medium">Assigned Partner: {b.worker_name || 'Specialist Dispatching'}</p>
                      </div>

                      {/* Reusable Booking Lifecycle Status Timeline */}
                      <BookingStatusTimeline status={b.status} />

                      <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
                        <span className="text-slate-600 font-bold">📍 {b.locality || profileLocality}, {b.district || profileDistrict}</span>
                        <span className="font-black text-slate-900">Total: ₹{(b.price || 0) + (b.platform_fee || 49)}</span>
                      </div>

                      {/* Post-Completion Actions: Review & Invoice */}
                      <div className="flex items-center gap-2 pt-1">
                        {['Completed', 'Reviewed'].includes(b.status) && (
                          <button
                            onClick={() => {
                              showToast(`Official Tax Invoice #${b.id} generated! Downloading PDF...`, 'success');
                            }}
                            className="flex-1 py-2 px-3 bg-slate-900 text-white rounded-xl text-xs font-extrabold flex items-center justify-center gap-1 shadow-sm hover:bg-slate-800"
                          >
                            <FileText size={13} /> View Invoice
                          </button>
                        )}
                        {b.status === 'Completed' && (
                          <button
                            onClick={() => {
                              setReviewingBooking(b);
                            }}
                            className="flex-1 py-2 px-3 bg-amber-500 text-white rounded-xl text-xs font-extrabold flex items-center justify-center gap-1 shadow-sm hover:bg-amber-600"
                          >
                            <Star size={13} /> Rate & Review
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Two Column Section: Saved Addresses & Favourite Professionals */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Saved Addresses */}
              <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <MapPin size={18} className="text-primary" />
                    <h3 className="text-sm font-black text-slate-900">Saved Service Addresses</h3>
                  </div>
                  <button onClick={() => setShowAddAddrModal(true)} className="text-xs font-bold text-primary hover:underline">
                    + Add New
                  </button>
                </div>

                <div className="space-y-3">
                  {savedAddresses.map(addr => (
                    <div key={addr.id} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-extrabold text-slate-900 block">{addr.tag}: {addr.locality}</span>
                        <span className="text-[11px] text-slate-500 font-medium">{addr.district}, {addr.state} • {addr.pincode}</span>
                      </div>
                      <button onClick={() => navigate(`/book?locality=${encodeURIComponent(addr.locality)}&district=${encodeURIComponent(addr.district)}`)} className="px-3 py-1 rounded-xl bg-white border border-slate-200 text-slate-800 font-bold hover:border-primary">
                        Use Address
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Favourite Professionals */}
              <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <Heart size={18} className="text-rose-500" />
                    <h3 className="text-sm font-black text-slate-900">Favourite Agencies & Pros</h3>
                  </div>
                  <button onClick={() => navigate(`${location.pathname}?tab=contractors`)} className="text-xs font-bold text-primary hover:underline">
                    Explore
                  </button>
                </div>

                {savedContractorsList.length === 0 ? (
                  <div className="p-6 text-center bg-slate-50 rounded-2xl text-xs font-semibold text-slate-500 border border-slate-100 space-y-2">
                    <p>No saved favorite contractors yet.</p>
                    <button onClick={() => navigate(`${location.pathname}?tab=contractors`)} className="text-xs font-bold text-primary hover:underline">
                      Browse Agencies & Save Favorites
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {savedContractorsList.map(c => (
                      <div key={c.id} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                        <div>
                          <span className="font-extrabold text-slate-900 block">{c.company || c.owner_name}</span>
                          <span className="text-[11px] text-slate-500">{c.city || 'Ranchi'} District</span>
                        </div>
                        <button onClick={() => navigate(`/book?district=${encodeURIComponent(c.city || 'Ranchi')}`)} className="btn-primary text-xs px-3 py-1 rounded-xl font-bold">
                          Book Again
                        </button>
                      </div>
                    ))}
                  </div>
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
        
        {/* SIDEBAR: SHARED PROFILE CARD */}
        <aside className="lg:col-span-3 space-y-4">
          <ProfileCard
            user={user}
            role="customer"
            onEditProfile={() => navigate(`${location.pathname}?tab=profile`)}
          />

          {/* Navigation Sidebar List */}
          <nav className="rounded-3xl border border-slate-200 bg-white p-2 shadow-sm space-y-1">
            {navItems.map(({ id, label, icon: Icon, count }) => {
              const isActive = activeTab === id;
              return (
                <button
                  key={id}
                  onClick={() => navigate(`${location.pathname}?tab=${id}`)}
                  className={`flex w-full items-center justify-between rounded-2xl px-3.5 py-2.5 text-left text-xs font-bold transition-all ${
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

        {/* Main Panel Content Area */}
        <main className="lg:col-span-9 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm min-h-[600px]">
          {renderTabContent()}
        </main>
      </div>

      {/* Add Address Modal */}
      {showAddAddrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <form onSubmit={handleAddAddress} className="bg-white p-6 rounded-3xl shadow-2xl max-w-sm w-full border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-900 text-sm">Add Saved Address</h3>
              <button type="button" onClick={() => setShowAddAddrModal(false)} className="text-slate-400 hover:text-slate-700"><X size={18} /></button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Tag</label>
                <select value={newAddrTag} onChange={(e) => setNewAddrTag(e.target.value)} className="w-full px-3 py-2 rounded-xl border text-xs font-bold bg-white">
                  <option value="Home">Home</option>
                  <option value="Work">Work / Office</option>
                  <option value="Parents">Parents House</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Locality / Landmark</label>
                <input
                  type="text"
                  placeholder="e.g. Lalpur Main Road"
                  className="w-full px-3 py-2 rounded-xl border text-xs font-semibold"
                  value={newAddrLocality}
                  onChange={(e) => setNewAddrLocality(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button type="button" onClick={() => setShowAddAddrModal(false)} className="px-4 py-2 text-xs font-bold text-slate-500">Cancel</button>
              <button type="submit" className="btn-primary text-xs px-5 py-2 rounded-xl font-bold">Save Address</button>
            </div>
          </form>
        </div>
      )}

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
