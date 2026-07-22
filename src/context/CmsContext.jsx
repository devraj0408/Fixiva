import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import * as catalogService from '../services/catalogService';
import * as locationService from '../services/locationService';
import * as contentService from '../services/contentService';
import * as marketingService from '../services/marketingService';
import * as userService from '../services/userService';
import * as bookingService from '../services/bookingService';
import { uploadImage } from '../services/storageService';
import { filterItems, paginateItems, sortItems } from '../services/commonService';

const CmsContext = createContext();

export const CmsProvider = ({ children }) => {
  const { user, showToast } = useAuth();

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
  const [settings, setSettings] = useState(bookingService.getSystemSettings());

  // UI Controller State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const actor = { id: user?.id || null, email: user?.email || '' };

  const refreshCmsData = useCallback(async () => {
    setLoading(true);
    setError(null);

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
      setWorkers(workersRes.data || []);
      setContractors(contractorsRes.data || []);
      setReviews(reviewsRes.data || []);
      setBookings(bookingsRes.data || []);
      setPayments(paymentsRes.data || []);
      setTickets(ticketsRes.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshCmsData();
  }, [refreshCmsData]);

  // Phase 1 Action Handlers
  const handleCreateService = async (data) => { const res = await catalogService.createService(data, actor); if (!res.error) { showToast('Service created.', 'success'); await refreshCmsData(); } else { showToast('Error: ' + res.error, 'error'); } return res; };
  const handleUpdateService = async (id, updates) => { const res = await catalogService.updateService(id, updates, actor); if (!res.error) { showToast('Service updated.', 'success'); await refreshCmsData(); } else { showToast('Error: ' + res.error, 'error'); } return res; };
  const handleDeleteService = async (id) => {
    console.log('[CmsContext.handleDeleteService] Invoked for Service ID:', id);
    const res = await catalogService.deleteService(id, actor);
    console.log('[CmsContext.handleDeleteService] Response received:', res);
    if (res.success) {
      setServices((prev) => {
        const filteredServices = prev.filter((s) => s.id !== id);
        console.log('[CmsContext.handleDeleteService] Updated local services state length:', filteredServices.length);
        return filteredServices;
      });
      showToast(res.message || 'Service deleted successfully.', 'success');
      await refreshCmsData();
    } else {
      console.error('[CmsContext.handleDeleteService] Failed to delete service:', res.error);
      showToast('Failed to delete service: ' + res.error, 'error');
    }
    return res;
  };

  const handleCreateCategory = async (data) => { const res = await catalogService.createCategory(data, actor); if (!res.error) { showToast('Category created.', 'success'); await refreshCmsData(); } else { showToast('Error: ' + res.error, 'error'); } return res; };
  const handleUpdateCategory = async (id, updates) => { const res = await catalogService.updateCategory(id, updates, actor); if (!res.error) { showToast('Category updated.', 'success'); await refreshCmsData(); } else { showToast('Error: ' + res.error, 'error'); } return res; };
  const handleDeleteCategory = async (id) => { const res = await catalogService.deleteCategory(id, actor); if (res.success) { showToast('Category deleted.', 'success'); await refreshCmsData(); } else { showToast('Error: ' + res.error, 'error'); } return res; };

  const handleCreateCity = async (data) => { const res = await locationService.createCity(data, actor); if (!res.error) { showToast('City created.', 'success'); await refreshCmsData(); } else { showToast('Error: ' + res.error, 'error'); } return res; };
  const handleUpdateCity = async (id, updates) => { const res = await locationService.updateCity(id, updates, actor); if (!res.error) { showToast('City updated.', 'success'); await refreshCmsData(); } else { showToast('Error: ' + res.error, 'error'); } return res; };
  const handleDeleteCity = async (id) => { const res = await locationService.deleteCity(id, actor); if (res.success) { showToast('City deleted.', 'success'); await refreshCmsData(); } else { showToast('Error: ' + res.error, 'error'); } return res; };

  const handleCreateArea = async (data) => { const res = await locationService.createArea(data, actor); if (!res.error) { showToast('Area added.', 'success'); await refreshCmsData(); } else { showToast('Error: ' + res.error, 'error'); } return res; };
  const handleUpdateArea = async (id, updates) => { const res = await locationService.updateArea(id, updates, actor); if (!res.error) { showToast('Area updated.', 'success'); await refreshCmsData(); } else { showToast('Error: ' + res.error, 'error'); } return res; };
  const handleDeleteArea = async (id) => { const res = await locationService.deleteArea(id, actor); if (res.success) { showToast('Area deleted.', 'success'); await refreshCmsData(); } else { showToast('Error: ' + res.error, 'error'); } return res; };

  // Phase 2 Action Handlers
  const handleCreateBanner = async (data) => { const res = await contentService.createBanner(data, actor); if (!res.error) { showToast('Banner created.', 'success'); await refreshCmsData(); } else { showToast('Error: ' + res.error, 'error'); } return res; };
  const handleUpdateBanner = async (id, updates) => { const res = await contentService.updateBanner(id, updates, actor); if (!res.error) { showToast('Banner updated.', 'success'); await refreshCmsData(); } else { showToast('Error: ' + res.error, 'error'); } return res; };
  const handleDeleteBanner = async (id) => { const res = await contentService.deleteBanner(id, actor); if (res.success) { showToast('Banner deleted.', 'success'); await refreshCmsData(); } else { showToast('Error: ' + res.error, 'error'); } return res; };

  const handleCreateOffer = async (data) => { const res = await contentService.createOffer(data, actor); if (!res.error) { showToast('Offer created.', 'success'); await refreshCmsData(); } else { showToast('Error: ' + res.error, 'error'); } return res; };
  const handleUpdateOffer = async (id, updates) => { const res = await contentService.updateOffer(id, updates, actor); if (!res.error) { showToast('Offer updated.', 'success'); await refreshCmsData(); } else { showToast('Error: ' + res.error, 'error'); } return res; };
  const handleDeleteOffer = async (id) => { const res = await contentService.deleteOffer(id, actor); if (res.success) { showToast('Offer deleted.', 'success'); await refreshCmsData(); } else { showToast('Error: ' + res.error, 'error'); } return res; };

  const handleCreateFaq = async (data) => { const res = await contentService.createFaq(data, actor); if (!res.error) { showToast('FAQ added.', 'success'); await refreshCmsData(); } else { showToast('Error: ' + res.error, 'error'); } return res; };
  const handleUpdateFaq = async (id, updates) => { const res = await contentService.updateFaq(id, updates, actor); if (!res.error) { showToast('FAQ updated.', 'success'); await refreshCmsData(); } else { showToast('Error: ' + res.error, 'error'); } return res; };
  const handleDeleteFaq = async (id) => { const res = await contentService.deleteFaq(id, actor); if (res.success) { showToast('FAQ deleted.', 'success'); await refreshCmsData(); } else { showToast('Error: ' + res.error, 'error'); } return res; };

  const handleCreateCoupon = async (data) => { const res = await marketingService.createCoupon(data, actor); if (!res.error) { showToast('Coupon created.', 'success'); await refreshCmsData(); } else { showToast('Error: ' + res.error, 'error'); } return res; };
  const handleUpdateCoupon = async (id, updates) => { const res = await marketingService.updateCoupon(id, updates, actor); if (!res.error) { showToast('Coupon updated.', 'success'); await refreshCmsData(); } else { showToast('Error: ' + res.error, 'error'); } return res; };
  const handleDeleteCoupon = async (id) => { const res = await marketingService.deleteCoupon(id, actor); if (res.success) { showToast('Coupon deleted.', 'success'); await refreshCmsData(); } else { showToast('Error: ' + res.error, 'error'); } return res; };

  const handleCreateBroadcastNotification = async (data) => { const res = await marketingService.createBroadcastNotification(data, actor); if (!res.error) { showToast('Notification dispatched.', 'success'); await refreshCmsData(); } else { showToast('Error: ' + res.error, 'error'); } return res; };
  const handleDeleteNotification = async (id) => { const res = await marketingService.deleteNotification(id, actor); if (res.success) { showToast('Notification deleted.', 'success'); await refreshCmsData(); } else { showToast('Error: ' + res.error, 'error'); } return res; };

  const handleUpdateCustomerStatus = async (id, status) => { const res = await userService.updateCustomerStatus(id, status, actor); if (!res.error) { showToast('Customer status updated.', 'success'); await refreshCmsData(); } else { showToast('Error: ' + res.error, 'error'); } return res; };
  const handleUpdateWorkerVerification = async (id, status, trustScore) => { const res = await userService.updateWorkerVerification(id, status, trustScore, actor); if (!res.error) { showToast('Worker verification updated.', 'success'); await refreshCmsData(); } else { showToast('Error: ' + res.error, 'error'); } return res; };
  const handleUpdateContractorStatus = async (id, status) => { const res = await userService.updateContractorStatus(id, status, actor); if (!res.error) { showToast('Contractor status updated.', 'success'); await refreshCmsData(); } else { showToast('Error: ' + res.error, 'error'); } return res; };
  const handleFeatureReview = async (id, isFeatured) => { const res = await userService.featureReview(id, isFeatured, actor); if (!res.error) { showToast('Review status updated.', 'success'); await refreshCmsData(); } else { showToast('Error: ' + res.error, 'error'); } return res; };
  const handleDeleteReview = async (id) => { const res = await userService.deleteReview(id, actor); if (res.success) { showToast('Review deleted.', 'success'); await refreshCmsData(); } else { showToast('Error: ' + res.error, 'error'); } return res; };

  // Phase 3 Action Handlers
  const handleUpdateBookingStatus = async (id, status, workerId = null) => {
    const res = await bookingService.updateBookingStatus(id, status, workerId, actor);
    if (!res.error) { showToast(`Booking status updated to ${status}.`, 'success'); await refreshCmsData(); }
    else { showToast('Error: ' + res.error, 'error'); }
    return res;
  };

  const handleAssignWorkerToBooking = async (bookingId, worker) => {
    const res = await bookingService.assignWorkerToBooking(bookingId, worker, actor);
    if (!res.error) { showToast(`Worker ${worker.name || 'Specialist'} assigned to booking.`, 'success'); await refreshCmsData(); }
    else { showToast('Error: ' + res.error, 'error'); }
    return res;
  };

  const handleUpdatePaymentStatus = async (id, status) => {
    const res = await bookingService.updatePaymentStatus(id, status, actor);
    if (!res.error) { showToast(`Payment status updated to ${status}.`, 'success'); await refreshCmsData(); }
    else { showToast('Error: ' + res.error, 'error'); }
    return res;
  };

  const handleUpdateTicketStatus = async (id, status, replyText = '') => {
    const res = await bookingService.updateTicketStatus(id, status, replyText, actor);
    if (!res.error) { showToast(`Ticket status updated to ${status}.`, 'success'); await refreshCmsData(); }
    else { showToast('Error: ' + res.error, 'error'); }
    return res;
  };

  const handleUpdateSettings = (newSettings) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
    showToast('System feature flags updated.', 'success');
  };

  const value = {
    // Phase 1 State
    services, categories, cities, states, areas, pricingRules, coverageRequests,
    // Phase 2 State
    banners, coupons, offers, notifications, faqs, customers, workers, contractors, reviews,
    // Phase 3 State
    bookings, payments, tickets, settings,
    loading, error, refreshCmsData, searchQuery, setSearchQuery, currentPage, setCurrentPage, pageSize, setPageSize,

    // Helpers
    filterItems, paginateItems, sortItems, uploadImage,

    // Phase 1 CRUD
    createService: handleCreateService, updateService: handleUpdateService, deleteService: handleDeleteService,
    toggleServiceActive: (id, active) => catalogService.toggleServiceActive(id, active, actor),
    createCategory: handleCreateCategory, updateCategory: handleUpdateCategory, deleteCategory: handleDeleteCategory,
    createCity: handleCreateCity, updateCity: handleUpdateCity, deleteCity: handleDeleteCity,
    createArea: handleCreateArea, updateArea: handleUpdateArea, deleteArea: handleDeleteArea,

    // Phase 2 CRUD
    createBanner: handleCreateBanner, updateBanner: handleUpdateBanner, deleteBanner: handleDeleteBanner,
    createOffer: handleCreateOffer, updateOffer: handleUpdateOffer, deleteOffer: handleDeleteOffer,
    createFaq: handleCreateFaq, updateFaq: handleUpdateFaq, deleteFaq: handleDeleteFaq,
    createCoupon: handleCreateCoupon, updateCoupon: handleUpdateCoupon, deleteCoupon: handleDeleteCoupon,
    createBroadcastNotification: handleCreateBroadcastNotification, deleteNotification: handleDeleteNotification,
    updateCustomerStatus: handleUpdateCustomerStatus, updateWorkerVerification: handleUpdateWorkerVerification,
    updateContractorStatus: handleUpdateContractorStatus, featureReview: handleFeatureReview, deleteReview: handleDeleteReview,

    // Phase 3 CRUD
    updateBookingStatus: handleUpdateBookingStatus, assignWorkerToBooking: handleAssignWorkerToBooking,
    updatePaymentStatus: handleUpdatePaymentStatus, updateTicketStatus: handleUpdateTicketStatus,
    updateSettings: handleUpdateSettings,
  };

  return <CmsContext.Provider value={value}>{children}</CmsContext.Provider>;
};

export const useCms = () => {
  const context = useContext(CmsContext);
  if (!context) throw new Error('useCms must be used within a CmsProvider');
  return context;
};
