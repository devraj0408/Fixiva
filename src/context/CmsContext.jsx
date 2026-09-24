// src/context/CmsContext.jsx
/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabaseClient';
import * as catalogService from '../services/catalogService';
import * as locationService from '../services/locationService';
import * as contentService from '../services/contentService';
import * as marketingService from '../services/marketingService';
import * as userService from '../services/userService';
import * as bookingService from '../services/bookingService';
import { uploadImage } from '../services/storageService';
import { filterItems, paginateItems, sortItems } from '../services/commonService';

import { enrichWorkersWithTrustScores } from '../services/trustScoreService';

const CmsContext = createContext();

export const CmsProvider = ({ children }) => {
  const {
    user,
    showToast,
    refreshData: refreshMarketplaceData,
    cityControl,
    toggleServiceInCity,
    bookings: authBookings,
    workers: authWorkers,
    contractors: authContractors,
    profiles: authProfiles,
  } = useAuth();

  // Phase 1 State Cache
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [cities, setCities] = useState([]);
  const [states, setStates] = useState([]);
  const [areas, setAreas] = useState([]);
  const [pricingRules, setPricingRules] = useState([]);
  const [coverageRequests, setCoverageRequests] = useState([]);

  // Phase 2 State Cache
  const [banners, setBanners] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [offers, setOffers] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [faqs, setFaqs] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [contractors, setContractors] = useState([]);
  const [reviews, setReviews] = useState([]);

  // Phase 3 State Cache
  const [bookings, setBookings] = useState([]);
  const [payments, setPayments] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [settings, setSettings] = useState(() => bookingService.getSystemSettings());

  // Broadcast services updates across window and tabs for instant reactive sync
  const broadcastServicesUpdate = (updatedServices) => {
    if (typeof window !== 'undefined') {
      try {
        window.dispatchEvent(new CustomEvent('fixiva:services-updated', { detail: updatedServices }));
      } catch { void 0; }
      try {
        if (typeof BroadcastChannel !== 'undefined') {
          const bc = new BroadcastChannel('fixiva-channel');
          bc.postMessage({ type: 'SERVICES_UPDATED', payload: updatedServices });
          bc.close();
        }
      } catch { void 0; }
    }
  };

  // Sync settings across tabs and events
  useEffect(() => {
    const handleSettingsUpdate = (e) => {
      if (e?.detail) {
        setSettings(e.detail);
      }
    };
    const handleStorage = (e) => {
      if (e.key === 'fixiva_system_settings') {
        try {
          const parsed = JSON.parse(e.newValue);
          if (parsed) setSettings(parsed);
        } catch { void 0; }
      }
    };
    window.addEventListener('fixiva:settings-updated', handleSettingsUpdate);
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('fixiva:settings-updated', handleSettingsUpdate);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  // UI Controller State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const actor = { id: user?.id || null, email: user?.email || '' };

  useEffect(() => {
    queueMicrotask(() => {
      const bList = Array.isArray(authBookings) ? authBookings : [];
      const rList = Array.isArray(reviews) ? reviews : [];
      const tList = Array.isArray(tickets) ? tickets : [];
      if (Array.isArray(authBookings)) {
        setBookings(authBookings);
      }
      if (Array.isArray(authWorkers)) {
        setWorkers(enrichWorkersWithTrustScores(authWorkers, bList, rList, tList));
      }
      if (Array.isArray(authContractors)) {
        setContractors(authContractors);
      }
      if (Array.isArray(authProfiles)) {
        setCustomers(authProfiles.filter((p) => p.role === 'customer'));
      }
    });
  }, [authBookings, authWorkers, authContractors, authProfiles, reviews, tickets]);

  const isInitialCmsLoadRef = useRef(true);

  const refreshCmsData = useCallback(async (isSilent = false) => {
    if (isInitialCmsLoadRef.current && !isSilent) {
      setLoading(true);
    }
    setError(null);
    if (typeof refreshMarketplaceData === 'function') {
      refreshMarketplaceData().catch(() => null);
    }

    try {
      const [
        servicesRes, categoriesRes, citiesRes, statesRes, areasRes, pricingRes, coverageRes,
        bannersRes, couponsRes, offersRes, notificationsRes, faqsRes, customersRes, workersRes, contractorsRes, reviewsRes,
        bookingsRes, paymentsRes, ticketsRes,
      ] = await Promise.all([
        catalogService.getServices(),
        catalogService.getCategories(),
        locationService.getCities(),
        locationService.getStates(),
        locationService.getAreas(),
        catalogService.getPricingRules(),
        locationService.getCoverageRequests(),
        contentService.getBanners(),
        marketingService.getCoupons(),
        contentService.getOffers(),
        marketingService.getNotifications(),
        contentService.getFaqs(),
        userService.getCustomers(),
        userService.getWorkers(),
        userService.getContractors(),
        userService.getReviews(),
        bookingService.getBookings(),
        bookingService.getPayments(),
        bookingService.getSupportTickets(),
      ]);

      const fetchedBookings = bookingsRes.data || [];
      const fetchedReviews = reviewsRes.data || [];
      const fetchedTickets = ticketsRes.data || [];
      const fetchedWorkers = workersRes.data || [];

      setServices(servicesRes.data || []);
      setCategories(categoriesRes.data || []);
      setCities(citiesRes.data || []);
      setStates(statesRes.data || []);
      setAreas(areasRes.data || []);
      setPricingRules(pricingRes.data || []);
      setCoverageRequests(coverageRes.data || []);
      setBanners(bannersRes.data || []);
      setCoupons(couponsRes.data || []);
      setOffers(offersRes.data || []);
      setNotifications(notificationsRes.data || []);
      setFaqs(faqsRes.data || []);
      setCustomers(customersRes.data || []);
      setContractors(contractorsRes.data || []);
      setReviews(fetchedReviews);
      setBookings(fetchedBookings);
      setPayments(paymentsRes.data || []);
      setTickets(fetchedTickets);

      const enriched = enrichWorkersWithTrustScores(fetchedWorkers, fetchedBookings, fetchedReviews, fetchedTickets);
      setWorkers(enriched);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      if (isInitialCmsLoadRef.current) {
        setLoading(false);
        isInitialCmsLoadRef.current = false;
      }
    }
  }, [refreshMarketplaceData]);

  useEffect(() => {
    let isMounted = true;
    Promise.resolve().then(() => {
      if (isMounted) refreshCmsData();
    });

    if (!supabase) return () => { isMounted = false; };
    const cmsRealtimeChannel = supabase
      .channel('fixiva-cms-realtime')
      .on('postgres_changes', { event: '*', schema: 'public' }, () => {
        if (isMounted) refreshCmsData(true);
      })
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(cmsRealtimeChannel);
    };
  }, [refreshCmsData]);

  // Phase 1 Action Handlers
  const handleToggleServiceActive = async (id, active) => {
    // Optimistic update
    setServices((prev) => {
      const updated = prev.map((s) => (String(s.id) === String(id) ? { ...s, active } : s));
      broadcastServicesUpdate(updated);
      return updated;
    });

    const res = await catalogService.toggleServiceActive(id, active, actor);
    if (!res.error) {
      showToast(`Service ${active ? 'activated' : 'disabled'} successfully.`, 'success');
      await refreshCmsData(true);
    } else {
      // Rollback on error
      setServices((prev) => {
        const rolledBack = prev.map((s) => (String(s.id) === String(id) ? { ...s, active: !active } : s));
        broadcastServicesUpdate(rolledBack);
        return rolledBack;
      });
      showToast('Failed to update service status: ' + res.error, 'error');
    }
    return res;
  };

  const handleCreateService = async (data) => {
    const res = await catalogService.createService(data, actor);
    if (res?.data) {
      setServices((prev) => {
        const next = [res.data, ...prev.filter((s) => String(s.id) !== String(res.data.id))];
        broadcastServicesUpdate(next);
        return next;
      });
      showToast('Service created successfully.', 'success');
      await refreshCmsData(true);
    } else if (res?.error) {
      showToast('Error: ' + res.error, 'error');
    }
    return res;
  };

  const handleUpdateService = async (id, updates) => {
    setServices((prev) => {
      const next = prev.map((s) => (String(s.id) === String(id) ? { ...s, ...updates } : s));
      broadcastServicesUpdate(next);
      return next;
    });

    const res = await catalogService.updateService(id, updates, actor);
    if (!res.error) {
      if (res.data) {
        setServices((prev) => {
          const next = prev.map((s) => (String(s.id) === String(id) ? { ...s, ...updates, ...(res.data || {}) } : s));
          broadcastServicesUpdate(next);
          return next;
        });
      }
      showToast('Service updated successfully.', 'success');
      await refreshCmsData(true);
    } else {
      showToast('Error: ' + res.error, 'error');
      await refreshCmsData(true);
    }
    return res;
  };

  const handleDeleteService = async (id) => {
    setServices((prev) => {
      const filteredServices = prev.filter((s) => String(s.id) !== String(id));
      broadcastServicesUpdate(filteredServices);
      return filteredServices;
    });
    const res = await catalogService.deleteService(id, actor);
    if (res.success || !res.error) {
      showToast(res.message || 'Service deleted successfully.', 'success');
      await refreshCmsData(true);
    } else {
      showToast('Failed to delete service: ' + res.error, 'error');
      await refreshCmsData(true);
    }
    return res;
  };

  const handleCreateCategory = async (data) => {
    const res = await catalogService.createCategory(data, actor);
    if (!res.error) {
      if (res.data) {
        setCategories((prev) => [res.data, ...prev.filter((c) => String(c.id) !== String(res.data.id))]);
      }
      showToast('Category created successfully.', 'success');
      await refreshCmsData(true);
    } else {
      showToast('Error: ' + res.error, 'error');
    }
    return res;
  };
  const handleUpdateCategory = async (id, updates) => {
    const res = await catalogService.updateCategory(id, updates, actor);
    if (!res.error) {
      setCategories((prev) => prev.map((c) => (String(c.id) === String(id) ? { ...c, ...updates, ...(res.data || {}) } : c)));
      showToast('Category updated successfully.', 'success');
      await refreshCmsData(true);
    } else {
      showToast('Error: ' + res.error, 'error');
    }
    return res;
  };
  const handleDeleteCategory = async (id) => {
    const res = await catalogService.deleteCategory(id, actor);
    if (res.success || !res.error) {
      setCategories((prev) => prev.filter((c) => String(c.id) !== String(id)));
      showToast('Category deleted successfully.', 'success');
      await refreshCmsData(true);
    } else {
      showToast('Error: ' + res.error, 'error');
    }
    return res;
  };

  const handleCreateCity = async (data) => { const res = await locationService.createCity(data, actor); if (!res.error) { showToast('City created.', 'success'); await refreshCmsData(true); } else { showToast('Error: ' + res.error, 'error'); } return res; };
  const handleUpdateCity = async (id, updates) => { const res = await locationService.updateCity(id, updates, actor); if (!res.error) { showToast('City updated.', 'success'); await refreshCmsData(true); } else { showToast('Error: ' + res.error, 'error'); } return res; };
  const handleDeleteCity = async (id) => { const res = await locationService.deleteCity(id, actor); if (res.success) { showToast('City deleted.', 'success'); await refreshCmsData(true); } else { showToast('Error: ' + res.error, 'error'); } return res; };

  const handleCreateArea = async (data) => {
    const res = await locationService.createArea(data, actor);
    if (!res.error) {
      if (res.data) {
        setAreas((prev) => [res.data, ...prev.filter((a) => String(a.id) !== String(res.data.id))]);
      }
      showToast('Area locality added.', 'success');
      await refreshCmsData(true);
    } else {
      showToast('Error: ' + res.error, 'error');
    }
    return res;
  };
  const handleUpdateArea = async (id, updates) => {
    const res = await locationService.updateArea(id, updates, actor);
    if (!res.error) {
      setAreas((prev) => prev.map((a) => (String(a.id) === String(id) ? { ...a, ...updates } : a)));
      showToast('Area locality updated.', 'success');
      await refreshCmsData(true);
    } else {
      showToast('Error: ' + res.error, 'error');
    }
    return res;
  };
  const handleDeleteArea = async (id) => {
    const res = await locationService.deleteArea(id, actor);
    if (res.success) {
      setAreas((prev) => prev.filter((a) => String(a.id) !== String(id)));
      showToast('Area locality deleted.', 'success');
      await refreshCmsData(true);
    } else {
      showToast('Error: ' + res.error, 'error');
    }
    return res;
  };

  // Phase 2 Action Handlers
  const handleCreateBanner = async (data) => {
    const res = await contentService.createBanner(data, actor);
    if (!res.error && res.data) {
      setBanners((prev) => [res.data, ...prev.filter((b) => b.id !== res.data.id && b.title !== res.data.title)]);
      showToast('Banner created successfully.', 'success');
      await refreshCmsData(true);
    } else if (!res.error) {
      showToast('Banner created successfully.', 'success');
      await refreshCmsData(true);
    } else {
      showToast('Error creating banner: ' + res.error, 'error');
    }
    return res;
  };

  const handleUpdateBanner = async (id, updates) => {
    const res = await contentService.updateBanner(id, updates, actor);
    if (!res.error) {
      setBanners((prev) => prev.map((b) => (b.id === id ? { ...b, ...updates } : b)));
      showToast('Banner updated successfully.', 'success');
      await refreshCmsData(true);
    } else {
      showToast('Error updating banner: ' + res.error, 'error');
    }
    return res;
  };

  const handleDeleteBanner = async (id) => {
    const res = await contentService.deleteBanner(id, actor);
    if (res.success || !res.error) {
      setBanners((prev) => prev.filter((b) => b.id !== id));
      showToast('Banner deleted successfully.', 'success');
      await refreshCmsData(true);
    } else {
      showToast('Error deleting banner: ' + res.error, 'error');
    }
    return res;
  };

  const handleCreateOffer = async (data) => {
    const res = await contentService.createOffer(data, actor);
    if (!res.error && res.data) {
      setOffers((prev) => [res.data, ...prev.filter((o) => o.id !== res.data.id && o.title !== res.data.title)]);
      showToast('Offer created successfully.', 'success');
      await refreshCmsData(true);
    } else if (!res.error) {
      showToast('Offer created successfully.', 'success');
      await refreshCmsData(true);
    } else {
      showToast('Error creating offer: ' + res.error, 'error');
    }
    return res;
  };

  const handleUpdateOffer = async (id, updates) => {
    setOffers((prev) => prev.map((o) => (o.id === id ? { ...o, ...updates } : o)));
    const res = await contentService.updateOffer(id, updates, actor);
    if (!res.error) {
      showToast('Offer updated successfully.', 'success');
      await refreshCmsData(true);
    } else {
      showToast('Error updating offer: ' + res.error, 'error');
      await refreshCmsData(true);
    }
    return res;
  };

  const handleDeleteOffer = async (id) => {
    setOffers((prev) => prev.filter((o) => o.id !== id));
    const res = await contentService.deleteOffer(id, actor);
    if (res.success || !res.error) {
      showToast('Offer deleted successfully.', 'success');
      await refreshCmsData(true);
    } else {
      showToast('Error deleting offer: ' + res.error, 'error');
      await refreshCmsData(true);
    }
    return res;
  };

  const handleCreateFaq = async (data) => {
    const res = await contentService.createFaq(data, actor);
    if (!res.error && res.data) {
      setFaqs((prev) => [res.data, ...prev.filter((f) => f.id !== res.data.id && f.question !== res.data.question)]);
      showToast('FAQ added successfully.', 'success');
      await refreshCmsData(true);
    } else if (!res.error) {
      showToast('FAQ added successfully.', 'success');
      await refreshCmsData(true);
    } else {
      showToast('Error adding FAQ: ' + res.error, 'error');
    }
    return res;
  };

  const handleUpdateFaq = async (id, updates) => {
    setFaqs((prev) => prev.map((f) => (f.id === id ? { ...f, ...updates } : f)));
    const res = await contentService.updateFaq(id, updates, actor);
    if (!res.error) {
      showToast('FAQ updated successfully.', 'success');
      await refreshCmsData(true);
    } else {
      showToast('Error updating FAQ: ' + res.error, 'error');
      await refreshCmsData(true);
    }
    return res;
  };

  const handleDeleteFaq = async (id) => {
    setFaqs((prev) => prev.filter((f) => f.id !== id));
    const res = await contentService.deleteFaq(id, actor);
    if (res.success || !res.error) {
      showToast('FAQ deleted successfully.', 'success');
      await refreshCmsData(true);
    } else {
      showToast('Error deleting FAQ: ' + res.error, 'error');
      await refreshCmsData(true);
    }
    return res;
  };

  const handleCreateCoupon = async (data) => {
    const res = await marketingService.createCoupon(data, actor);
    if (res.data) {
      setCoupons((prev) => {
        const filtered = prev.filter((c) => c.code !== res.data.code && c.id !== res.data.id);
        return [res.data, ...filtered];
      });
      showToast('Coupon created successfully.', 'success');
      await refreshCmsData(true);
    } else {
      showToast(res.error || 'Failed to create coupon', 'error');
    }
    return res;
  };

  const handleUpdateCoupon = async (id, updates) => {
    setCoupons((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
    const res = await marketingService.updateCoupon(id, updates, actor);
    if (res.data) {
      setCoupons((prev) => prev.map((c) => (c.id === id ? { ...c, ...res.data } : c)));
      showToast('Coupon updated successfully.', 'success');
      await refreshCmsData(true);
    } else {
      showToast(res.error || 'Failed to update coupon', 'error');
      await refreshCmsData(true);
    }
    return res;
  };

  const handleDeleteCoupon = async (id) => {
    setCoupons((prev) => prev.filter((c) => c.id !== id));
    const res = await marketingService.deleteCoupon(id, actor);
    showToast('Coupon deleted successfully.', 'success');
    await refreshCmsData(true);
    return res;
  };

  const handleCreateBroadcastNotification = async (data) => {
    const res = await marketingService.createBroadcastNotification(data, actor);
    if (!res.error) {
      if (res.data) setNotifications((prev) => [res.data, ...prev]);
      showToast('Notification dispatched.', 'success');
      await refreshCmsData(true);
    } else {
      showToast('Error: ' + res.error, 'error');
    }
    return res;
  };

  const handleDeleteNotification = async (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    const res = await marketingService.deleteNotification(id, actor);
    if (res.success) { showToast('Notification deleted.', 'success'); await refreshCmsData(true); }
    else { showToast('Error: ' + res.error, 'error'); await refreshCmsData(true); }
    return res;
  };

  const handleUpdateCustomerStatus = async (id, status) => {
    setCustomers((prev) => prev.map((c) => (String(c.id) === String(id) ? { ...c, account_status: status } : c)));
    const res = await userService.updateCustomerStatus(id, status, actor);
    if (!res.error) {
      showToast('Customer status updated.', 'success');
      await refreshCmsData(true);
    } else {
      setCustomers((prev) => prev.map((c) => (String(c.id) === String(id) ? { ...c, account_status: status === 'suspended' ? 'active' : 'suspended' } : c)));
      showToast('Error: ' + res.error, 'error');
    }
    return res;
  };

  const handleUpdateContractorStatus = async (id, status) => {
    setContractors((prev) => prev.map((c) => (String(c.id) === String(id) ? { ...c, status } : c)));
    const res = await userService.updateContractorStatus(id, status, actor);
    if (!res.error) {
      showToast('Contractor status updated.', 'success');
      await refreshCmsData(true);
    } else {
      showToast('Error: ' + res.error, 'error');
      await refreshCmsData(true);
    }
    return res;
  };

  const handleFeatureReview = async (id, isFeatured) => {
    setReviews((prev) => prev.map((r) => (String(r.id) === String(id) ? { ...r, is_featured: isFeatured } : r)));
    const res = await userService.featureReview(id, isFeatured, actor);
    if (!res.error) {
      showToast(isFeatured ? 'Review featured on customer homepage.' : 'Review unfeatured.', 'success');
      await refreshCmsData(true);
    } else {
      setReviews((prev) => prev.map((r) => (String(r.id) === String(id) ? { ...r, is_featured: !isFeatured } : r)));
      showToast('Error: ' + res.error, 'error');
    }
    return res;
  };

  const handleDeleteReview = async (id) => {
    setReviews((prev) => prev.filter((r) => String(r.id) !== String(id)));
    const res = await userService.deleteReview(id, actor);
    if (res.success || !res.error) {
      showToast('Review deleted.', 'success');
      await refreshCmsData(true);
    } else {
      showToast('Error: ' + res.error, 'error');
      await refreshCmsData(true);
    }
    return res;
  };

  // Phase 3 Action Handlers
  const handleUpdateBookingStatus = async (id, status, workerId = null) => {
    setBookings((prev) => prev.map((b) => (String(b.id) === String(id) ? { ...b, status, ...(workerId ? { worker_id: workerId } : {}) } : b)));
    const res = await bookingService.updateBookingStatus(id, status, workerId, actor);
    if (!res.error) {
      showToast(`Booking status updated to ${status}.`, 'success');
      await refreshCmsData(true);
    } else {
      showToast('Error: ' + res.error, 'error');
      await refreshCmsData(true);
    }
    return res;
  };

  const handleAssignWorkerToBooking = async (bookingId, worker) => {
    setBookings((prev) => prev.map((b) => (String(b.id) === String(bookingId) ? { ...b, worker_id: worker?.id, worker_name: worker?.name, status: 'Assigned' } : b)));
    const res = await bookingService.assignWorkerToBooking(bookingId, worker, actor);
    if (!res.error) {
      showToast(`Worker ${worker.name || 'Specialist'} assigned to booking.`, 'success');
      await refreshCmsData(true);
    } else {
      showToast('Error: ' + res.error, 'error');
      await refreshCmsData(true);
    }
    return res;
  };

  const handleUpdatePaymentStatus = async (id, status) => {
    setPayments((prev) => prev.map((p) => (String(p.id) === String(id) ? { ...p, status } : p)));
    const res = await bookingService.updatePaymentStatus(id, status, actor);
    if (!res.error) {
      showToast(`Payment status updated to ${status}.`, 'success');
      await refreshCmsData(true);
    } else {
      showToast('Error: ' + res.error, 'error');
      await refreshCmsData(true);
    }
    return res;
  };

  const handleCollectCashPayment = async (bookingId) => {
    setBookings((prev) => prev.map((b) => (String(b.id) === String(bookingId) ? { ...b, payment_status: 'PAID' } : b)));
    setPayments((prev) => prev.map((p) => (String(p.booking_id) === String(bookingId) || String(p.id) === String(bookingId) ? { ...p, status: 'PAID' } : p)));
    const res = await bookingService.collectCashPayment(bookingId, actor);
    if (!res.error) {
      showToast('💵 Cash payment collected! Status set to PAID.', 'success');
      await refreshCmsData(true);
    } else {
      showToast('Error: ' + res.error, 'error');
      await refreshCmsData(true);
    }
    return res;
  };

  const handleUpdateTicketStatus = async (id, status, replyText = '') => {
    setTickets((prev) => prev.map((t) => (String(t.id) === String(id) ? { ...t, status, ...(replyText ? { admin_reply: replyText } : {}) } : t)));
    const res = await bookingService.updateTicketStatus(id, status, replyText, actor);
    if (!res.error) {
      showToast(`Ticket status updated to ${status}.`, 'success');
      await refreshCmsData(true);
    } else {
      showToast('Error: ' + res.error, 'error');
      await refreshCmsData(true);
    }
    return res;
  };

  const handleUpdateSettings = (newSettings) => {
    const current = settings || bookingService.getSystemSettings();
    const merged = { ...current, ...newSettings };
    setSettings(merged);
    bookingService.updateSystemSettings(merged);
    showToast('System feature flags updated.', 'success');
  };

  const value = {
    // Phase 1 State
    services, categories, cities, states, areas, pricingRules, coverageRequests, cityControl, toggleServiceInCity,
    // Phase 2 State
    banners, coupons, offers, notifications, faqs, customers, workers, contractors, reviews,
    // Phase 3 State
    bookings, payments, tickets, settings,
    loading, error, refreshCmsData, searchQuery, setSearchQuery, currentPage, setCurrentPage, pageSize, setPageSize,

    // Helpers
    filterItems, paginateItems, sortItems, uploadImage,

    // Phase 1 CRUD
    createService: handleCreateService, updateService: handleUpdateService, deleteService: handleDeleteService,
    toggleServiceActive: handleToggleServiceActive,
    createCategory: handleCreateCategory, updateCategory: handleUpdateCategory, deleteCategory: handleDeleteCategory,
    createCity: handleCreateCity, updateCity: handleUpdateCity, deleteCity: handleDeleteCity,
    createArea: handleCreateArea, updateArea: handleUpdateArea, deleteArea: handleDeleteArea,

    // Phase 2 CRUD
    createBanner: handleCreateBanner, updateBanner: handleUpdateBanner, deleteBanner: handleDeleteBanner,
    createOffer: handleCreateOffer, updateOffer: handleUpdateOffer, deleteOffer: handleDeleteOffer,
    createFaq: handleCreateFaq, updateFaq: handleUpdateFaq, deleteFaq: handleDeleteFaq,
    createCoupon: handleCreateCoupon, updateCoupon: handleUpdateCoupon, deleteCoupon: handleDeleteCoupon,
    createBroadcastNotification: handleCreateBroadcastNotification, deleteNotification: handleDeleteNotification,
    updateCustomerStatus: handleUpdateCustomerStatus,
    updateContractorStatus: handleUpdateContractorStatus, featureReview: handleFeatureReview, deleteReview: handleDeleteReview,

    // Phase 3 CRUD
    updateBookingStatus: handleUpdateBookingStatus, assignWorkerToBooking: handleAssignWorkerToBooking,
    updatePaymentStatus: handleUpdatePaymentStatus, collectCashPayment: handleCollectCashPayment, updateTicketStatus: handleUpdateTicketStatus,
    updateSettings: handleUpdateSettings,
  };

  return <CmsContext.Provider value={value}>{children}</CmsContext.Provider>;
};

export const useCms = () => {
  const context = useContext(CmsContext);
  if (!context) throw new Error('useCms must be used within a CmsProvider');
  return context;
};
