import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../../context/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import { getStaffByContractor, createStaffMember, updateStaffMember, deleteStaffMember } from '../../services/staffService';
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
  Calendar,
  Plus,
  Trash2,
  X,
  Edit2,
  Send,
  Headphones,
  ShieldCheck,
  Check,
  Sparkles,
  Camera,
  MapPin,
  Loader2,
  Navigation
} from 'lucide-react';
import ProfileCard from '../../components/ProfileCard';
import { uploadImage } from '../../services/storageService';
import { saveUserGpsLocation } from '../../services/locationService';

const ContractorDashboard = () => {
  const {
    user,
    bookings = [],
    updateBookingStatus,
    collectCashPayment,
    logout,
    refreshData,
    showToast,
    confirm,
    updateUserProfile,
    reviews: allReviews = [],
    addTicket,
    tickets = []
  } = useApp();

  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const tabParam = searchParams.get('tab');
  const activeTab = tabParam || 'overview';

  const [updatingGps, setUpdatingGps] = useState(false);

  const hasValidLocation = useMemo(() => {
    const lat = Number(user?.location_latitude);
    const lng = Number(user?.location_longitude);
    return !isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180 && (lat !== 0 || lng !== 0);
  }, [user?.location_latitude, user?.location_longitude]);

  const handleCaptureGpsLocation = async () => {
    if (!navigator.geolocation) {
      showToast('Geolocation is not supported in this browser.', 'error');
      return;
    }
    setUpdatingGps(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const res = await saveUserGpsLocation({
          userId: user.id,
          role: 'contractor',
          latitude: lat,
          longitude: lng
        });
        setUpdatingGps(false);
        if (res.data) {
          showToast('GPS location set successfully!', 'success');
          if (refreshData) refreshData();
        } else {
          showToast(res.error || 'Failed to save location', 'error');
        }
      },
      () => {
        setUpdatingGps(false);
        showToast('GPS location access was denied or timed out.', 'error');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Modals & Form States
  const [staffList, setStaffList] = useState([]);
  const [isLoadingStaff, setIsLoadingStaff] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('');
  const [newMemberPhone, setNewMemberPhone] = useState('');
  
  // Edit Staff Modal State
  const [editingStaff, setEditingStaff] = useState(null);
  const [editStaffName, setEditStaffName] = useState('');
  const [editStaffRole, setEditStaffRole] = useState('');
  const [editStaffPhone, setEditStaffPhone] = useState('');
  const [editStaffStatus, setEditStaffStatus] = useState('Available');

  // Booking Assignment State
  const [assigningBooking, setAssigningBooking] = useState(null);
  const [selectedStaffName, setSelectedStaffName] = useState('');
  
  // Company Profile Form States
  const [companyName, setCompanyName] = useState(user?.company || user?.name || '');
  const [ownerName, setOwnerName] = useState(user?.owner_name || user?.name || '');
  const [gstNumber, setGstNumber] = useState(user?.gst || '');
  const [contractorCity, setContractorCity] = useState(user?.district || user?.city || 'Ranchi');
  const [servicesOffered, setServicesOffered] = useState(user?.services_offered || 'Electrician, Plumbing, AC Repair, Cleaning');
  const [coverageArea, setCoverageArea] = useState(user?.coverage_area || 'Jharkhand - Ranchi District');
  const [logoUrl, setLogoUrl] = useState(user?.profile_photo_url || '');
  const logoFileInputRef = useRef(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  const handleLogoFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingLogo(true);
    try {
      const { success, url, error } = await uploadImage(file, 'cms-assets', 'contractor-logos');
      if (success && url) {
        setLogoUrl(url);
        const { error: profileErr } = await updateUserProfile({ profile_photo_url: url });
        if (!profileErr) {
          showToast('Company photo updated & profile picture changed successfully!', 'success');
          if (refreshData) await refreshData();
        } else {
          showToast('Photo selected but profile update failed.', 'error');
        }
      } else {
        showToast(`Image upload failed: ${error || 'Unknown error'}`, 'error');
      }
    } catch (err) {
      console.error('Logo upload error:', err);
      showToast('An error occurred during photo upload.', 'error');
    } finally {
      setIsUploadingLogo(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleRemoveLogo = async () => {
    setLogoUrl('');
    const { error } = await updateUserProfile({ profile_photo_url: '' });
    if (!error) {
      showToast('Company photo removed.', 'info');
      if (refreshData) await refreshData();
    }
  };

  // Notifications State
  const [notifications, setNotifications] = useState([]);

  // Contractor Reviews State
  const [contractorReviews, setContractorReviews] = useState([]);
  const [reviewReplyText, setReviewReplyText] = useState({});

  // Contractor Realtime Support Chat State
  const [liveTickets, setLiveTickets] = useState([]);
  const [chatInputMessage, setChatInputMessage] = useState('');
  const [chatSending, setChatSending] = useState(false);
  const chatBottomRef = useRef(null);

  // Load contractor staff from Supabase staff table
  const loadContractorStaff = useCallback(async () => {
    if (!user?.id) return;
    setIsLoadingStaff(true);
    const { data, error } = await getStaffByContractor(user.id);
    if (error) {
      console.error('Failed to load contractor staff members from Supabase:', error);
    } else {
      setStaffList(data || []);
    }
    setIsLoadingStaff(false);
  }, [user]);

  useEffect(() => {
    if (user?.id) {
      queueMicrotask(() => {
        loadContractorStaff();
      });
    }
  }, [user?.id, loadContractorStaff]);

  // Realtime listener for staff inserts/updates/deletions
  useEffect(() => {
    if (!user?.id || !supabase) return;

    const staffChannel = supabase
      .channel(`contractor-staff-${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'staff', filter: `contractor_id=eq.${user.id}` },
        () => {
          loadContractorStaff();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(staffChannel);
    };
  }, [user?.id, loadContractorStaff]);

  // Sync profile form states
  useEffect(() => {
    if (user) {
      queueMicrotask(() => {
        setCompanyName(user.company || user.name || '');
        setOwnerName(user.owner_name || user.name || '');
        setGstNumber(user.gst || '');
        setContractorCity(user.district || user.city || 'Ranchi');
        setServicesOffered(user.services_offered || 'Electrician, Plumbing, AC Repair, Cleaning');
        setCoverageArea(user.coverage_area || 'Jharkhand - Ranchi District');
        setLogoUrl(user.profile_photo_url || '');
      });
    }
  }, [user]);

  // Fetch Contractor Reviews
  useEffect(() => {
    if (!user?.id) return;
    queueMicrotask(() => {
      const filtered = (allReviews || []).filter(
        r => r.contractor_id === user.id || r.worker_id === user.id || (user.company && (r.serviceType || '').toLowerCase().includes((user.company || '').toLowerCase()))
      );
      setContractorReviews(filtered);
    });
  }, [allReviews, user?.id, user?.company]);

  // Fetch Notifications & Realtime Subscription
  const fetchNotifications = useCallback(async () => {
    if (!user?.id || !supabase) return;
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .or(`user_id.eq.${user.id},target_role.in.(contractor,all,CONTRACTOR,ALL)`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Contractor notification fetch error:', error);
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
      console.error('Exception fetching contractor notifications:', err);
    }
  }, [user]);

  useEffect(() => {
    queueMicrotask(() => {
      fetchNotifications();
    });

    if (!user?.id || !supabase) return;

    const notifChannel = supabase
      .channel(`contractor-notifications-${user.id}`)
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

  // Mark Contractor Notifications as read when opening notifications tab
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

  // Realtime Support Tickets Sync for Contractor
  useEffect(() => {
    queueMicrotask(() => {
      const userTickets = (tickets || []).filter(t => t.user_id === user?.id);
      setLiveTickets(userTickets);
    });
  }, [tickets, user?.id]);

  useEffect(() => {
    if (!user?.id || !supabase) return;

    const channel = supabase
      .channel(`contractor-support-${user.id}`)
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

  // Scroll to bottom of support chat
  useEffect(() => {
    if (activeTab === 'support') {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [liveTickets, activeTab]);

  // Filter contractor bookings (Contractor specific or matching district)
  const contractorBookings = useMemo(() => {
    const userCityLower = (user?.district || user?.city || '').toLowerCase();
    const companyLower = (user?.company || user?.name || '').toLowerCase();

    return (bookings || []).filter((b) => {
      const isAssignedToContractor = b.contractor_id === user?.id || b.worker_id === user?.id;
      const isNamedWorker = b.worker_name && b.worker_name.toLowerCase().includes(companyLower);
      const isNearbyUnassigned =
        (b.status === 'New Request' || b.status === 'Pending') &&
        ((b.district || b.city || '').toLowerCase() === userCityLower || !b.contractor_id);

      return isAssignedToContractor || isNamedWorker || isNearbyUnassigned;
    });
  }, [bookings, user]);

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

  const todaysJobsCount = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    return contractorBookings.filter((b) => {
      const bDate = b.booking_date || b.preferred_date || b.created_at;
      return bDate && new Date(bDate).toISOString().split('T')[0] === todayStr;
    }).length;
  }, [contractorBookings]);

  // Earnings Breakdown Calculation
  const earningsMetrics = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    let todayRev = 0;
    let weeklyRev = 0;
    let monthlyRev = 0;
    let totalRev = 0;

    completedJobs.forEach(j => {
      const amount = Number(j.price || 0);
      totalRev += amount;

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

    return {
      today: todayRev,
      weekly: weeklyRev,
      monthly: monthlyRev,
      total: totalRev
    };
  }, [completedJobs]);

  // Average Rating
  const averageRating = useMemo(() => {
    if (contractorReviews.length > 0) {
      const sum = contractorReviews.reduce((acc, curr) => acc + Number(curr.rating || 0), 0);
      return (sum / contractorReviews.length).toFixed(1);
    }
    const profileRating = Number(user?.rating || user?.avg_rating);
    if (!isNaN(profileRating) && profileRating > 0) {
      return profileRating.toFixed(1);
    }
    return 'N/A';
  }, [contractorReviews, user?.rating, user?.avg_rating]);

  // Form Submission: Add Staff Member
  const handleAddTeamMember = async (e) => {
    e.preventDefault();

    const name = newMemberName.trim();
    const role = newMemberRole.trim();
    const phone = newMemberPhone.trim();

    if (!name || !role) {
      showToast('Please provide both staff member name and role.', 'error');
      return;
    }

    if (!user?.id) {
      showToast('Contractor session not found. Please log in again.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        contractor_id: user.id,
        name,
        role,
        phone: phone || null,
        city: contractorCity || user?.city || 'Ranchi',
        status: 'Available',
        trust_score: 50
      };

      const { error } = await createStaffMember(payload);

      if (error) {
        console.error('Supabase staff creation error:', error);
        showToast(`Failed to add staff member: ${error}`, 'error');
      } else {
        showToast(`Staff member "${name}" added successfully!`, 'success');
        setNewMemberName('');
        setNewMemberRole('');
        setNewMemberPhone('');
        await loadContractorStaff();
        if (refreshData) await refreshData();
      }
    } catch (err) {
      console.error('Unexpected error during staff creation:', err);
      showToast('An error occurred while adding the staff member.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Edit Staff Member Submit
  const handleSaveEditedStaff = async (e) => {
    e.preventDefault();
    if (!editingStaff) return;

    const { error } = await updateStaffMember(editingStaff.id, {
      name: editStaffName.trim(),
      role: editStaffRole.trim(),
      phone: editStaffPhone.trim() || null,
      status: editStaffStatus
    });

    if (!error) {
      showToast('Staff member details updated successfully!', 'success');
      setEditingStaff(null);
      await loadContractorStaff();
    } else {
      showToast(`Failed to update staff: ${error}`, 'error');
    }
  };

  // Delete Staff Member Handler
  const handleDeleteTeamMember = async (staffId, staffName) => {
    const ok = await confirm(`Remove ${staffName || 'this staff member'} from company roster?`);
    if (ok) {
      const { error } = await deleteStaffMember(staffId, user?.id);
      if (!error) {
        showToast('Staff member removed successfully.', 'success');
        await loadContractorStaff();
        if (refreshData) await refreshData();
      } else {
        console.error('Supabase staff deletion error:', error);
        showToast(`Failed to delete staff member: ${error}`, 'error');
      }
    }
  };

  // Accept Lead
  const handleAcceptBooking = async (bookingId) => {
    const { error } = await supabase
      .from('bookings')
      .update({
        contractor_id: user?.id,
        status: 'CONTRACTOR ACCEPTED'
      })
      .eq('id', bookingId);

    if (!error) {
      showToast('Booking accepted by your firm!', 'success');
      if (refreshData) await refreshData();
    } else {
      showToast('Failed to accept booking: ' + error.message, 'error');
    }
  };

  // Assign or Reassign Staff Worker to Booking
  const handleAssignStaffToBooking = async (bookingId, staffName) => {
    const staffMember = staffList.find((t) => t.name === staffName) || { phone: user?.phone || '9876543210' };
    const { error } = await supabase
      .from('bookings')
      .update({
        contractor_id: user?.id,
        worker_id: user?.id,
        worker_name: `${staffName} (${user?.company || 'Contractor Agency'})`,
        worker_phone: staffMember.phone || user?.phone || '9876543210',
        status: 'WORKER ASSIGNED'
      })
      .eq('id', bookingId);

    if (!error) {
      showToast(`Assigned ${staffName} to booking #${bookingId}!`, 'success');
      setAssigningBooking(null);
      setSelectedStaffName('');
      if (refreshData) await refreshData();
    } else {
      console.error('Supabase worker assignment error:', error);
      showToast('Failed to assign worker: ' + error.message, 'error');
    }
  };

  // Update Company Profile
  const handleUpdateCompanyProfile = async (e) => {
    e.preventDefault();
    const { error } = await updateUserProfile({
      company: companyName,
      owner_name: ownerName,
      gst: gstNumber,
      city: contractorCity,
      district: contractorCity,
      services_offered: servicesOffered,
      coverage_area: coverageArea,
      profile_photo_url: logoUrl
    });

    if (!error) {
      showToast('Company profile & GST details saved successfully!', 'success');
      if (refreshData) await refreshData();
    } else {
      console.error('Company profile update error:', error);
      showToast('Failed to save profile: ' + (error?.message || String(error || 'Unknown error')), 'error');
    }
  };

  // Send Support Desk Chat Message
  const handleSendSupportMessage = async (e, customMsg = null) => {
    if (e && e.preventDefault) e.preventDefault();
    const messageText = (customMsg || chatInputMessage).trim();
    if (!messageText) return;

    setChatInputMessage('');
    setChatSending(true);

    const { error } = await addTicket({
      user_id: user?.id,
      subject: `Contractor Support (${user?.company || 'Agency'})`,
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
      showToast('Failed to send support message', 'error');
    }
  };

  // Save Review Reply
  const handleSaveReviewReply = (reviewId) => {
    const reply = reviewReplyText[reviewId];
    if (!reply || !reply.trim()) return;
    showToast('Reply submitted to client review!', 'success');
    setReviewReplyText(prev => ({ ...prev, [reviewId]: '' }));
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Sidebar Items
  const navItems = [
    { id: 'overview', label: 'Dashboard', icon: BarChart3 },
    { id: 'bookings', label: 'Bookings & Leads', icon: FileText, count: pendingRequests.length + activeJobs.length },
    { id: 'workers', label: 'Staff Management', icon: Users, count: staffList.length },
    { id: 'assignments', label: 'Work Assignments', icon: Briefcase, count: activeJobs.length },
    { id: 'earnings', label: 'Earnings & Ledger', icon: IndianRupee },
    { id: 'reviews', label: 'Client Reviews', icon: Star },
    { id: 'support', label: 'Support Desk', icon: Headphones },
    { id: 'notifications', label: 'Notifications', icon: Bell, count: notifications.filter((n) => !n.read).length },
    { id: 'profile', label: 'Company Profile', icon: Building },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      
      // SUPPORT DESK: WHATSAPP-STYLE REALTIME CHAT FOR CONTRACTORS
      case 'support':
        return (
          <div className="space-y-4 max-w-3xl mx-auto">
            <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-primary text-white flex items-center justify-center shadow-md font-bold">
                  <Headphones size={22} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-extrabold text-slate-900">Fixiva Contractor Support Desk</h2>
                    <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                      ⚡ Priority Response
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">Live chat for contractor dispatches, staff management & payments.</p>
                </div>
              </div>

              <span className="text-[11px] font-bold text-slate-400">Official Channel</span>
            </div>

            <div className="bg-slate-900/95 rounded-3xl border border-slate-800 shadow-xl overflow-hidden flex flex-col h-[520px]">
              <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px]">
                <div className="flex justify-start">
                  <div className="max-w-xs sm:max-w-md rounded-2xl rounded-tl-sm bg-slate-800 text-slate-100 p-4 border border-slate-700/60 shadow-sm space-y-1">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-primary">
                      <ShieldCheck size={13} /> Fixiva Support Desk
                    </div>
                    <p className="text-xs font-medium leading-relaxed">
                      Hello {user?.company || user?.name || 'Contractor'}! 👋 Welcome to Contractor Support. How can we help your agency today?
                    </p>
                    <span className="text-[9px] text-slate-400 block text-right">Official Desk</span>
                  </div>
                </div>

                {liveTickets.map(t => (
                  <div key={t.id} className="space-y-3">
                    <div className="flex justify-end">
                      <div className="max-w-xs sm:max-w-md rounded-2xl rounded-tr-sm bg-primary text-white p-3.5 shadow-sm space-y-1">
                        <p className="text-xs font-semibold leading-relaxed whitespace-pre-wrap">{t.message}</p>
                        <span className="text-[9px] text-blue-200 block text-right">
                          {t.created_at ? new Date(t.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Sent'}
                        </span>
                      </div>
                    </div>

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
                {['Contractor verification process', 'Managing worker dispatches', 'Payout & commission rules', 'Escalate to Admin'].map((prompt, i) => (
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

              <form onSubmit={handleSendSupportMessage} className="p-3 bg-slate-900 border-t border-slate-800 flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Type message to contractor support desk..."
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

      // BOOKINGS TAB
      case 'bookings':
        return (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Contractor Bookings & Leads</h2>
              <p className="text-sm text-slate-500">Manage incoming service leads, accept bookings, assign staff workers, and complete jobs.</p>
            </div>

            {contractorBookings.length === 0 ? (
              <div className="p-12 text-center border-2 border-dashed border-slate-200 bg-slate-50/50 rounded-3xl text-xs font-semibold text-slate-500">
                No active contractor bookings received yet in {contractorCity}.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {contractorBookings.map((b) => (
                  <div key={b.id} className="p-6 rounded-3xl border border-slate-200 bg-white shadow-sm space-y-4">
                    <div className="flex justify-between items-start flex-wrap gap-2">
                      <div>
                        <span className="text-[10px] font-black text-primary uppercase">ID: {b.id}</span>
                        <h4 className="font-extrabold text-slate-900 text-base mt-0.5">{b.service_name || 'Home Service'}</h4>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          b.status === 'Completed'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : b.status === 'Accepted'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-blue-50 text-primary border border-blue-200'
                        }`}
                      >
                        ● {b.status}
                      </span>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-2xl text-xs space-y-1.5 font-semibold text-slate-700">
                      <p><strong>Customer:</strong> {b.customer_name || 'Customer'}</p>
                      <p><strong>Location:</strong> {b.locality || b.customer_address || b.address || 'Address'}, {b.district || b.city || contractorCity}</p>
                      <p><strong>Assigned Worker:</strong> <span className="font-extrabold text-slate-900">{b.worker_name || 'Unassigned'}</span></p>
                      <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                        <span className="font-bold text-slate-600">Amount to Collect:</span>
                        <span className="text-sm font-black text-slate-900">₹{b.price || 0}</span>
                      </div>
                      <div className="flex justify-between items-center text-slate-600">
                        <span>Payment Method:</span>
                        <span className="font-bold text-slate-900">{b.payment_method || 'Cash'}</span>
                      </div>
                      <div className="flex justify-between items-center text-slate-600">
                        <span>Payment Status:</span>
                        <span className={`font-black px-2 py-0.5 rounded-md text-[11px] ${
                          (b.payment_status === 'PAID' || b.payment_status === 'Paid')
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          ● {b.payment_status || 'PENDING'}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2 flex-wrap">
                      {(b.payment_status === 'PAID' || b.payment_status === 'Paid') ? (
                        <div className="flex-1 py-2.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-extrabold text-emerald-800 text-center flex items-center justify-center gap-1">
                          ✓ Cash Collected (Paid)
                        </div>
                      ) : (
                        <button
                          onClick={() => collectCashPayment(b.id)}
                          className="flex-1 py-2.5 rounded-2xl bg-emerald-600 text-xs font-extrabold text-white shadow-sm hover:bg-emerald-700 transition-all flex items-center justify-center gap-1"
                        >
                          💵 Cash Collected (₹{b.price || 0})
                        </button>
                      )}

                      {(b.status === 'Pending' || b.status === 'New Request') && (
                        <button
                          onClick={() => handleAcceptBooking(b.id)}
                          className="flex-1 py-2.5 rounded-2xl bg-amber-500 text-xs font-extrabold text-white shadow-sm hover:bg-amber-600 transition-all flex items-center justify-center gap-1"
                        >
                          <Check size={14} /> Accept Lead
                        </button>
                      )}

                      {b.status !== 'Completed' && (
                        <button
                          onClick={() => {
                            setAssigningBooking(b);
                            setSelectedStaffName('');
                          }}
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

      // WORKERS / STAFF MANAGEMENT TAB
      case 'workers':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">Staff & Worker Roster</h2>
                <p className="text-sm text-slate-500">Add, edit, and manage internal technicians and field staff.</p>
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
              <button
                type="submit"
                disabled={isSubmitting}
                className="h-10 bg-primary text-white font-extrabold rounded-xl hover:bg-blue-700 flex items-center justify-center gap-1 disabled:opacity-50 transition-all shadow-sm"
              >
                <Plus size={14} /> {isSubmitting ? 'Adding...' : 'Add Worker'}
              </button>
            </form>

            {/* Staff Roster Table */}
            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              {isLoadingStaff ? (
                <div className="p-8 text-center text-xs font-semibold text-slate-500">Loading staff members from database...</div>
              ) : staffList.length === 0 ? (
                <div className="p-8 text-center text-xs font-semibold text-slate-500">No staff members in directory. Use the form above to add staff.</div>
              ) : (
                <table className="min-w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-extrabold uppercase border-b border-slate-100">
                    <tr>
                      <th className="px-5 py-3.5">Photo & Name</th>
                      <th className="px-5 py-3.5">Skills / Role</th>
                      <th className="px-5 py-3.5">City / District</th>
                      <th className="px-5 py-3.5">Status</th>
                      <th className="px-5 py-3.5">Trust Score</th>
                      <th className="px-5 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                    {staffList.map((w) => (
                      <tr key={w.id} className="hover:bg-slate-50">
                        <td className="px-5 py-4 flex items-center gap-3 font-extrabold text-slate-900">
                          <div className="h-8 w-8 rounded-xl bg-slate-900 text-white flex items-center justify-center text-xs font-black uppercase">
                            {w.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-extrabold text-slate-900">{w.name}</p>
                            {w.phone && <p className="text-[10px] text-slate-500 font-normal">{w.phone}</p>}
                          </div>
                        </td>
                        <td className="px-5 py-4 text-slate-600">{w.role}</td>
                        <td className="px-5 py-4 text-slate-600">{w.city || contractorCity}</td>
                        <td className="px-5 py-4">
                          <span className={`px-2.5 py-0.5 rounded-full font-black text-[10px] ${w.status === 'On Job' ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>
                            {w.status || 'Available'}
                          </span>
                        </td>
                        <td className="px-5 py-4 font-black text-amber-600">★ {w.trust_score ?? w.trustScore ?? 50} / 100</td>
                        <td className="px-5 py-4 text-right space-x-1">
                          <button
                            onClick={() => {
                              setEditingStaff(w);
                              setEditStaffName(w.name);
                              setEditStaffRole(w.role);
                              setEditStaffPhone(w.phone || '');
                              setEditStaffStatus(w.status || 'Available');
                            }}
                            className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-xl"
                            title="Edit staff member"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteTeamMember(w.id, w.name)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-xl"
                            title="Remove staff member"
                          >
                            <Trash2 size={14} />
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

      // WORK ASSIGNMENTS TAB
      case 'assignments':
        return (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Active Work Assignments & History</h2>
              <p className="text-sm text-slate-500">Track field staff dispatches, reassignments, and completed projects.</p>
            </div>

            <div className="space-y-3">
              {contractorBookings.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-3xl text-xs font-semibold text-slate-500">
                  No active or past work assignments recorded.
                </div>
              ) : (
                contractorBookings.map((j) => (
                  <div key={j.id} className="p-5 rounded-3xl border border-slate-200 bg-white shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-semibold">
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-sm">{j.service_name || 'Project'}</h4>
                      <p className="text-slate-500">Assigned Staff: <span className="font-bold text-slate-900">{j.worker_name || 'Unassigned'}</span></p>
                      <p className="text-[11px] text-slate-400">Location: {j.locality || j.district || contractorCity}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-full font-black text-[10px] uppercase ${j.status === 'Completed' ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-primary'}`}>
                        {j.status}
                      </span>
                      {j.status !== 'Completed' && (
                        <button
                          onClick={() => {
                            setAssigningBooking(j);
                            setSelectedStaffName('');
                          }}
                          className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs"
                        >
                          Reassign
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        );

      // EARNINGS TAB
      case 'earnings':
        return (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Contractor Revenue Ledger</h2>
              <p className="text-sm text-slate-500">Automatic revenue calculations from completed client projects.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-6 bg-slate-50 border border-slate-200 rounded-3xl">
                <span className="text-[10px] font-black uppercase text-slate-400">Today's Revenue</span>
                <p className="text-2xl font-black text-slate-900 mt-2">₹{earningsMetrics.today}</p>
              </div>

              <div className="p-6 bg-slate-50 border border-slate-200 rounded-3xl">
                <span className="text-[10px] font-black uppercase text-slate-400">Weekly Revenue</span>
                <p className="text-2xl font-black text-slate-900 mt-2">₹{earningsMetrics.weekly}</p>
              </div>

              <div className="p-6 bg-slate-50 border border-slate-200 rounded-3xl">
                <span className="text-[10px] font-black uppercase text-slate-400">Monthly Revenue</span>
                <p className="text-2xl font-black text-slate-900 mt-2">₹{earningsMetrics.monthly}</p>
              </div>

              <div className="p-6 bg-slate-900 text-white rounded-3xl shadow-md">
                <span className="text-[10px] font-black uppercase text-slate-400">Total Lifetime Revenue</span>
                <p className="text-2xl font-black text-white mt-2">₹{earningsMetrics.total}</p>
              </div>
            </div>
          </div>
        );

      // REVIEWS TAB
      case 'reviews':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">Company Reviews & Ratings</h2>
                <p className="text-sm text-slate-500">Verified feedback and ratings from clients.</p>
              </div>

              <div className="flex items-center gap-1.5 bg-amber-50 px-3 py-1.5 rounded-2xl border border-amber-200 text-amber-800 font-black text-sm">
                <Star size={16} fill="currentColor" /> {averageRating} / 5.0
              </div>
            </div>

            {contractorReviews.length === 0 ? (
              <div className="p-12 text-center border-2 border-dashed border-slate-200 bg-slate-50/50 rounded-3xl text-xs font-semibold text-slate-500">
                <Star size={38} className="mx-auto text-slate-300 mb-2" />
                Verified client reviews for your firm will display here upon project completion.
              </div>
            ) : (
              <div className="space-y-4">
                {contractorReviews.map(r => (
                  <div key={r.id} className="p-5 rounded-3xl border border-slate-200 bg-white shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-slate-900 text-sm">{r.userName || 'Verified Client'}</span>
                      <span className="flex items-center gap-1 text-amber-500 font-bold text-xs">
                        <Star size={14} fill="currentColor" /> {r.rating} / 5
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 font-medium">{r.comment}</p>

                    {/* Reply Section */}
                    <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Reply to client review..."
                        className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium outline-none"
                        value={reviewReplyText[r.id] || ''}
                        onChange={(e) => setReviewReplyText({ ...reviewReplyText, [r.id]: e.target.value })}
                      />
                      <button
                        onClick={() => handleSaveReviewReply(r.id)}
                        className="btn-primary text-xs px-3 py-2 rounded-xl font-bold"
                      >
                        Reply
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      // NOTIFICATIONS TAB
      case 'notifications':
        return (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Notifications</h2>
              <p className="text-sm text-slate-500">Incoming lead notifications and dispatch alerts.</p>
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

      // COMPANY PROFILE TAB
      case 'profile':
        return (
          <div className="space-y-6 max-w-xl">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Company Profile & GST</h2>
              <p className="text-sm text-slate-500">Manage business entity details, GST registration, coverage, and logo.</p>
            </div>

            <form onSubmit={handleUpdateCompanyProfile} className="bg-slate-50 border border-slate-200 p-8 rounded-3xl space-y-4 text-xs font-semibold">
              {/* Direct Photo / Logo Upload from Gallery or Camera */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Company Logo / Agency Photo</label>
                <div className="flex flex-col sm:flex-row items-center gap-4 p-4 bg-white border border-slate-200 rounded-2xl shadow-sm">
                  <div className="relative group shrink-0">
                    <img
                      src={logoUrl || 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=150&auto=format&fit=crop&q=80'}
                      alt="Company Logo"
                      className="w-20 h-20 rounded-2xl object-cover border-2 border-slate-100 shadow-sm"
                    />
                    <button
                      type="button"
                      onClick={() => logoFileInputRef.current?.click()}
                      className="absolute inset-0 bg-black/50 rounded-2xl opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center text-white text-[10px] font-black gap-1 cursor-pointer"
                    >
                      <Camera size={18} /> Change
                    </button>
                  </div>

                  <div className="space-y-2 text-center sm:text-left flex-1 w-full">
                    <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start">
                      <button
                        type="button"
                        disabled={isUploadingLogo}
                        onClick={() => logoFileInputRef.current?.click()}
                        className="px-4 py-2.5 bg-primary text-white rounded-xl font-extrabold text-xs hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 cursor-pointer"
                      >
                        {isUploadingLogo ? (
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

                      {logoUrl && (
                        <button
                          type="button"
                          onClick={handleRemoveLogo}
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
                      ref={logoFileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleLogoFileChange}
                      className="hidden"
                    />
                  </div>
                </div>
              </div>
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
                <label className="text-[10px] font-black text-slate-400 uppercase">Base Operating District</label>
                <input className="w-full h-11 px-4 bg-white border border-slate-200 rounded-2xl outline-none" value={contractorCity} onChange={(e) => setContractorCity(e.target.value)} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase">Coverage Area</label>
                <input className="w-full h-11 px-4 bg-white border border-slate-200 rounded-2xl outline-none" value={coverageArea} onChange={(e) => setCoverageArea(e.target.value)} placeholder="e.g. Ranchi District, Lalpur, Main Road" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase">Services Offered</label>
                <input className="w-full h-11 px-4 bg-white border border-slate-200 rounded-2xl outline-none" value={servicesOffered} onChange={(e) => setServicesOffered(e.target.value)} placeholder="e.g. Electrician, Plumbing, AC Repair" />
              </div>
              <button type="submit" className="w-full py-3 rounded-2xl bg-primary text-white font-extrabold shadow-md">
                Save Company Profile
              </button>
            </form>
          </div>
        );

      // OVERVIEW TAB
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

            {/* Location Prompt Banner when coordinates missing */}
            {!hasValidLocation && (
              <div className="p-4 sm:p-5 rounded-3xl border border-amber-200 bg-amber-50/90 text-amber-900 flex items-center justify-between gap-4 flex-wrap shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-200 text-amber-800 flex items-center justify-center shrink-0">
                    <MapPin size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-black">Set your current location to receive nearby bookings.</h4>
                    <p className="text-xs text-amber-700 font-medium mt-0.5">Your agency GPS coordinates are required for distance-based customer matching.</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleCaptureGpsLocation}
                  disabled={updatingGps}
                  className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-black transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  {updatingGps ? <Loader2 size={14} className="animate-spin" /> : <Navigation size={14} />}
                  <span>{updatingGps ? 'Detecting Location...' : 'Set Current Location'}</span>
                </button>
              </div>
            )}

            {/* Marketplace Metric Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Today's Revenue</p>
                    <p className="mt-2 text-2xl font-black text-slate-900">₹{earningsMetrics.today}</p>
                  </div>
                  <div className="rounded-2xl p-2.5 bg-emerald-100 text-emerald-700">
                    <IndianRupee size={20} />
                  </div>
                </div>
              </div>

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
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Pending Requests</p>
                    <p className="mt-2 text-2xl font-black text-slate-900">{pendingRequests.length}</p>
                  </div>
                  <div className="rounded-2xl p-2.5 bg-amber-100 text-amber-700">
                    <Clock size={20} />
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Active Workers</p>
                    <p className="mt-2 text-2xl font-black text-slate-900">{staffList.length}</p>
                  </div>
                  <div className="rounded-2xl p-2.5 bg-sky-100 text-sky-700">
                    <Users size={20} />
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Monthly Revenue</p>
                    <p className="mt-2 text-2xl font-black text-slate-900">₹{earningsMetrics.monthly}</p>
                  </div>
                  <div className="rounded-2xl p-2.5 bg-violet-100 text-violet-700">
                    <IndianRupee size={20} />
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Leads & Staff Overview */}
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
                          <p className="mt-0.5 text-[11px] text-slate-500">Client: {item.customer_name} • {item.district || item.city}</p>
                        </div>
                        <button
                          onClick={() => {
                            setAssigningBooking(item);
                            setSelectedStaffName('');
                          }}
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
                  {staffList.length === 0 ? (
                    <div className="p-6 text-center bg-white rounded-2xl border border-slate-200 text-xs text-slate-500 font-semibold">
                      No staff members in directory.
                    </div>
                  ) : (
                    staffList.slice(0, 3).map((w) => (
                      <div key={w.id} className="rounded-2xl border border-slate-200 bg-white p-4 flex items-center justify-between gap-3">
                        <div>
                          <p className="text-xs font-extrabold text-slate-900">{w.name}</p>
                          <p className="mt-0.5 text-[11px] text-slate-500">{w.role} • {w.status || 'Available'}</p>
                        </div>
                        <span className="text-[10px] font-black text-amber-700 bg-amber-50 px-2 py-1 rounded-full border border-amber-200">
                          ★ {w.trust_score ?? w.trustScore ?? 50} / 100
                        </span>
                      </div>
                    ))
                  )}
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
        {/* Sidebar matching Customer Dashboard */}
        <aside className="lg:col-span-3 space-y-4">
          <ProfileCard
            user={user}
            role="contractor"
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

        {/* Main Panel Content */}
        <main id="contractor-panel-content" className="lg:col-span-9 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm min-h-[600px]">
          {renderTabContent()}
        </main>
      </div>

      {/* Edit Staff Modal */}
      {editingStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <form onSubmit={handleSaveEditedStaff} className="bg-white p-6 sm:p-8 rounded-3xl shadow-2xl max-w-md w-full border border-slate-200 space-y-4 text-xs font-semibold">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-slate-900">Edit Staff Member</h3>
              <button type="button" onClick={() => setEditingStaff(null)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase">Staff Name</label>
                <input className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold" value={editStaffName} onChange={(e) => setEditStaffName(e.target.value)} required />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase">Role / Skill</label>
                <input className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold" value={editStaffRole} onChange={(e) => setEditStaffRole(e.target.value)} required />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase">Phone Number</label>
                <input className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold" value={editStaffPhone} onChange={(e) => setEditStaffPhone(e.target.value)} />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase">Availability Status</label>
                <select className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold" value={editStaffStatus} onChange={(e) => setEditStaffStatus(e.target.value)}>
                  <option value="Available">Available</option>
                  <option value="On Job">On Job</option>
                  <option value="On Leave">On Leave</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-2 border-t border-slate-100">
              <button type="button" onClick={() => setEditingStaff(null)} className="px-4 py-2 rounded-xl text-slate-600 font-bold">Cancel</button>
              <button type="submit" className="btn-primary px-5 py-2 rounded-xl font-extrabold">Save Changes</button>
            </div>
          </form>
        </div>
      )}

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
                {staffList.map((t) => (
                  <option key={t.id} value={t.name}>
                    {t.name} ({t.role}) - {t.status || 'Available'}
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
