import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../../context/AuthContext';
import { 
  Clock, CheckCircle, Star, MapPin, 
  Settings, HelpCircle, LogOut, Package, Phone, Send, Info, User, AlertTriangle
} from 'lucide-react';

const CustomerDashboard = () => {
  const { user, bookings, updateBookingStatus, reviews, addReview, tickets, addTicket, logout } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const tabParam = searchParams.get('tab');

  const [activeTab, setActiveTab] = useState(tabParam || 'bookings');
  const [reviewingBooking, setReviewingBooking] = useState(null);
  
  // Support ticket fields
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketMessage, setTicketMessage] = useState('');
  const [ticketLoading, setTicketLoading] = useState(false);

  // Sync tab param from URL
  useEffect(() => {
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  // Filters
  const myBookings = bookings.filter(b => b.customer_id === user?.id);
  const myTickets = tickets.filter(t => t.user_id === user?.id);

  const handleReportNoShow = (bookingId) => {
    if(window.confirm("Report Worker No-Show? This will notify Fixiva Admin for immediate action.")) {
      updateBookingStatus(bookingId, 'Worker No Show');
      alert("Reported. We are assigning a new professional or will contact you shortly.");
    }
  };

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
      setReviewingBooking(null);
      alert('Thank you for your feedback!');
    } else {
      alert('Failed to submit review: ' + error.message);
    }
  };

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    if (!ticketSubject || !ticketMessage) {
      alert('Please fill out all fields');
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
      alert('Support ticket raised successfully!');
      setTicketSubject('');
      setTicketMessage('');
    } else {
      alert('Failed to raise support ticket: ' + error.message);
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

  // Status mapping for visual tracker
  const trackingSteps = ['New Request', 'Assigned', 'Confirmed', 'In Progress', 'Completed'];
  const getStepIndex = (status) => {
    if (status === 'New Request') return 0;
    if (status === 'Assigned') return 1;
    if (status === 'Confirmed') return 2;
    if (status === 'In Progress') return 3;
    if (status === 'Completed') return 4;
    return -1; // e.g. Cancelled / No show
  };

  const getStatusLabel = (status) => {
    if (status === 'Confirmed') return 'Accepted';
    return status;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Sidebar Navigation */}
        <aside className="lg:col-span-3 space-y-6">
          {/* Profile Card */}
          <div className="bg-white rounded-3xl border border-slate-100 p-6 text-center space-y-4 shadow-sm">
            <div className="h-16 w-16 mx-auto rounded-full bg-gradient-to-tr from-primary to-blue-500 text-white font-extrabold text-lg flex items-center justify-center uppercase tracking-wider shadow-md">
              {getInitials(user?.name)}
            </div>
            <div className="space-y-0.5">
              <h3 className="font-extrabold text-slate-800 text-sm leading-tight">{user?.name}</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{user?.email}</p>
            </div>
            <div className="pt-2">
              <span className="px-3 py-1 bg-primary-light text-primary text-[10px] font-black uppercase tracking-wider rounded-full">
                Customer account
              </span>
            </div>
          </div>

          {/* Navigation Options */}
          <nav className="bg-white rounded-3xl border border-slate-100 p-3 shadow-sm flex flex-col gap-1 text-slate-600 text-xs">
            <button 
              onClick={() => { setActiveTab('bookings'); navigate(`${location.pathname}?tab=bookings`); }}
              className={`flex items-center gap-2.5 p-3 rounded-xl ${
                activeTab === 'bookings' ? 'btn-primary shadow-md' : 'btn-secondary'
              }`}
            >
              <Clock size={16} /> My Bookings
            </button>
            <button 
              onClick={() => { setActiveTab('reviews'); navigate(`${location.pathname}?tab=reviews`); }}
              className={`flex items-center gap-2.5 p-3 rounded-xl ${
                activeTab === 'reviews' ? 'btn-primary shadow-md' : 'btn-secondary'
              }`}
            >
              <Star size={16} /> My Reviews
            </button>
            <button 
              onClick={() => { setActiveTab('support'); navigate(`${location.pathname}?tab=support`); }}
              className={`flex items-center gap-2.5 p-3 rounded-xl ${
                activeTab === 'support' ? 'btn-primary shadow-md' : 'btn-secondary'
              }`}
            >
              <HelpCircle size={16} /> Support Tickets
            </button>
            <button 
              onClick={() => { setActiveTab('profile'); navigate(`${location.pathname}?tab=profile`); }}
              className={`flex items-center gap-2.5 p-3 rounded-xl ${
                activeTab === 'profile' ? 'btn-primary shadow-md' : 'btn-secondary'
              }`}
            >
              <Settings size={16} /> Profile Settings
            </button>
            <div className="h-px bg-slate-100 my-2"></div>
            <button 
              onClick={handleLogout}
              className="flex items-center gap-2.5 p-3 rounded-xl btn-danger"
            >
              <LogOut size={16} /> Logout
            </button>
          </nav>
        </aside>

        {/* Main Workspace content */}
        <main className="lg:col-span-9 bg-white rounded-3xl border border-slate-100 p-8 shadow-sm min-h-[500px]">
          <AnimatePresence mode="wait">
            {activeTab === 'bookings' && (
              <motion.div 
                key="bookings"
                className="space-y-6"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                  <h2 className="text-xl font-black text-slate-900 tracking-tight">Active Bookings</h2>
                  <div className="flex gap-2">
                    <Link to="/services" className="btn-primary text-xs px-5 py-2.5 rounded-xl shadow-md text-center">
                      Book Service
                    </Link>
                  </div>
                </div>

                <div className="space-y-6">
                  {myBookings.length === 0 ? (
                    <div className="py-20 text-center border-2 border-dashed border-slate-200 bg-slate-50/50 rounded-2xl space-y-4">
                      <Package size={40} className="mx-auto text-slate-300" />
                      <div>
                        <h4 className="font-extrabold text-slate-700 text-sm uppercase tracking-wider">No Bookings Yet</h4>
                        <p className="text-[11px] text-slate-400 font-semibold mt-1">Book trusted background-checked experts to clean, repair or paint.</p>
                      </div>
                      <Link to="/services" className="inline-flex btn-primary text-xs px-6 py-3 rounded-xl shadow-md text-center">
                        Book Service
                      </Link>
                    </div>
                  ) : (
                    myBookings.map(booking => {
                      const stepIdx = getStepIndex(booking.status);
                      return (
                        <div key={booking.id} className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-6">
                          <div className="flex flex-wrap justify-between items-center gap-4">
                            <div>
                              <span className="text-[10px] font-black text-primary uppercase">ID: {booking.id}</span>
                              <h3 className="font-extrabold text-slate-900 text-base mt-1">{booking.service_name || booking.service_id}</h3>
                            </div>
                            <span className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                              booking.status === 'Completed' ? 'bg-green-50 text-success border border-green-100' :
                              booking.status === 'Cancelled' ? 'bg-red-50 text-danger border border-red-100' :
                              'bg-amber-50 text-warning border border-amber-100'
                            }`}>
                              {getStatusLabel(booking.status)}
                            </span>
                          </div>

                          {/* Stepper tracking progress bar */}
                          {stepIdx !== -1 ? (
                            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-4">
                              <div className="flex justify-between items-center relative">
                                <div className="absolute top-1/2 left-0 right-0 h-1 bg-slate-200 -translate-y-1/2 -z-10 rounded-full"></div>
                                <div className="absolute top-1/2 left-0 h-1 bg-primary -translate-y-1/2 -z-10 rounded-full transition-all duration-500" style={{ width: `${(stepIdx / 4) * 100}%` }}></div>
                                
                                {trackingSteps.map((stepName, idx) => (
                                  <div key={idx} className="flex flex-col items-center">
                                    <div 
                                      className={`w-6 h-6 rounded-full border-4 flex items-center justify-center transition-all ${
                                        idx <= stepIdx ? 'bg-primary border-blue-100 text-white' : 'bg-white border-slate-200'
                                      }`}
                                    >
                                      {idx <= stepIdx && <CheckCircle size={10} />}
                                    </div>
                                  </div>
                                ))}
                              </div>
                              <div className="flex justify-between text-[9px] font-black text-slate-400 uppercase tracking-wider">
                                <span>Requested</span>
                                <span>Assigned</span>
                                <span>Accepted</span>
                                <span>In Progress</span>
                                <span>Completed</span>
                              </div>
                            </div>
                          ) : (
                            <div className="p-4 bg-red-50/50 text-danger rounded-xl text-xs font-bold flex items-center gap-2 border border-red-100/30">
                              <AlertTriangle size={16} /> Booking outcome state: {booking.status}
                            </div>
                          )}

                          <div className="flex flex-wrap gap-6 text-xs font-semibold text-slate-500">
                            <p className="flex items-center gap-1"><Clock size={14} /> Date: {new Date(booking.booking_date || booking.preferred_date).toLocaleDateString()}</p>
                            <p className="flex items-center gap-1"><MapPin size={14} /> City: {booking.city}</p>
                            <p className="text-slate-800 font-extrabold">Tariff: ₹{(booking.price || 0) + (booking.platform_fee || 0)}</p>
                          </div>

                          {/* Assigned Worker credentials */}
                          {booking.worker_id && (
                            <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between flex-wrap gap-4">
                              <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-amber-500 to-orange-500 text-white font-black text-xs flex items-center justify-center uppercase">
                                  {getInitials(booking.worker_name)}
                                </div>
                                <div className="space-y-0.5">
                                  <h4 className="text-xs font-bold text-slate-800">Worker: {booking.worker_name || 'Assigned Partner'}</h4>
                                  <p className="text-[10px] text-slate-400 font-semibold">Background-Checked Professional</p>
                                </div>
                              </div>
                              {booking.worker_phone && (
                                <a href={`tel:${booking.worker_phone}`} className="btn-secondary text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-sm">
                                  <Phone size={12} /> Call {booking.worker_phone}
                                </a>
                              )}
                            </div>
                          )}

                          {/* Action panel */}
                          <div className="flex gap-2 flex-wrap">
                            {booking.status === 'Completed' && (
                              <button 
                                onClick={() => setReviewingBooking(booking)}
                                className="btn-primary text-xs px-4 py-2.5 rounded-xl shadow-md"
                              >
                                Leave Review
                              </button>
                            )}
                            {['Assigned', 'Confirmed', 'In Progress'].includes(booking.status) && (
                              <button 
                                onClick={() => handleReportNoShow(booking.id)}
                                className="btn-danger text-xs px-4 py-2.5 rounded-xl shadow-md"
                              >
                                Report Professional No-Show
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'reviews' && (
              <motion.div 
                key="reviews"
                className="space-y-6"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <h2 className="text-xl font-black text-slate-900 tracking-tight">Verified reviews shared</h2>
                {reviews.filter(r => r.userName === user?.name || bookings.find(bk => bk.id === r.booking_id)?.customer_id === user?.id).length === 0 ? (
                  <div className="py-20 text-center border-2 border-dashed border-slate-200 bg-slate-50/50 rounded-2xl">
                    <Star size={36} className="mx-auto text-slate-300 mb-2" />
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">No reviews submitted yet</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {reviews.filter(r => r.userName === user?.name || bookings.find(bk => bk.id === r.booking_id)?.customer_id === user?.id).map((r, idx) => (
                      <div key={idx} className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-4">
                        <div className="flex gap-1 text-warning">
                          {[...Array(5)].map((_, j) => <Star key={j} size={14} fill={j < r.rating ? "currentColor" : "none"} />)}
                        </div>
                        <p className="text-slate-600 italic text-sm">"{r.comment}"</p>
                        <span className="text-[10px] font-black text-primary uppercase mt-4 block">Service field: {r.serviceType}</span>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'support' && (
              <motion.div 
                key="support"
                className="space-y-6"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <h2 className="text-xl font-black text-slate-900 tracking-tight">Support center resolution logs</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  
                  {/* Create Ticket */}
                  <form onSubmit={handleCreateTicket} className="space-y-4 h-fit bg-slate-50 p-6 rounded-2xl border border-slate-100">
                    <h3 className="font-extrabold text-slate-800 text-sm">Raise Help Ticket</h3>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Inquiry Subject</label>
                      <input 
                        className="w-full h-11 px-4 bg-white border border-slate-200 focus:border-primary rounded-xl text-xs font-semibold placeholder-slate-400 outline-none"
                        placeholder="e.g. Professional delay, payment dispute"
                        value={ticketSubject}
                        onChange={(e) => setTicketSubject(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Statement Details</label>
                      <textarea 
                        className="w-full p-4 bg-white border border-slate-200 focus:border-primary rounded-xl text-xs font-semibold placeholder-slate-400 outline-none"
                        rows="4"
                        placeholder="Explain details of your ticket..."
                        value={ticketMessage}
                        onChange={(e) => setTicketMessage(e.target.value)}
                        required
                      />
                    </div>
                    <button type="submit" className="w-full btn-primary text-xs py-3 rounded-xl shadow-md flex justify-center items-center" disabled={ticketLoading}>
                      {ticketLoading ? 'Sending...' : 'Submit Support Ticket'}
                    </button>
                  </form>

                  {/* Tickets List */}
                  <div className="space-y-4">
                    <h3 className="font-extrabold text-slate-800 text-sm">Support Resolution Logs</h3>
                    {myTickets.length === 0 ? (
                      <p className="text-slate-400 text-xs font-semibold leading-relaxed">No help center tickets generated.</p>
                    ) : (
                      myTickets.map(t => (
                        <div key={t.id} className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm flex justify-between items-start gap-4 text-xs font-semibold">
                          <div className="space-y-1">
                            <h4 className="font-bold text-slate-900">{t.subject}</h4>
                            <p className="text-slate-500">{t.message}</p>
                            <span className="text-[10px] text-slate-400 block pt-1">Opened: {new Date(t.created_at).toLocaleDateString()}</span>
                          </div>
                          <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${
                            t.status === 'Resolved' ? 'bg-green-50 text-success' : 'bg-amber-50 text-warning'
                          }`}>
                            {t.status}
                          </span>
                        </div>
                      ))
                    )}
                  </div>

                </div>
              </motion.div>
            )}

            {activeTab === 'profile' && (
              <motion.div 
                key="profile"
                className="space-y-6 max-w-xl animate-fade-in"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <h2 className="text-xl font-black text-slate-900 tracking-tight">Customer Profile Settings</h2>
                <div className="bg-slate-50 border border-slate-100 p-8 rounded-2xl shadow-sm space-y-4 text-xs font-semibold">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Registered Name</label>
                    <input className="w-full h-11 px-4 bg-white border border-slate-200 rounded-xl text-slate-700 outline-none" value={user?.name} disabled />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Email coordinate</label>
                    <input className="w-full h-11 px-4 bg-white border border-slate-200 rounded-xl text-slate-700 outline-none" value={user?.email} disabled />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Phone contact</label>
                    <input className="w-full h-11 px-4 bg-white border border-slate-200 rounded-xl text-slate-700 outline-none" value={user?.phone || 'Not Set'} disabled />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Default operating city</label>
                    <input className="w-full h-11 px-4 bg-white border border-slate-200 rounded-xl text-slate-700 outline-none" value={user?.city || 'Not Set'} disabled />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>

      </div>

      {/* Review Modal popup */}
      {reviewingBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-md w-full border border-slate-100 space-y-6">
            <div>
              <h3 className="text-lg font-black text-slate-900 leading-tight">Rate Experience</h3>
              <p className="text-xs text-slate-400 font-semibold mt-1">Leave feedback for your completed home assignment.</p>
            </div>
            
            <form onSubmit={handleReviewSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Stars Rating</label>
                <select name="rating" className="w-full h-11 px-4 bg-slate-50 border border-slate-200 focus:border-primary rounded-xl text-xs font-bold text-slate-700" required>
                  <option value="5">5 Stars - Excellent</option>
                  <option value="4">4 Stars - Very Good</option>
                  <option value="3">3 Stars - Average</option>
                  <option value="2">2 Stars - Poor</option>
                  <option value="1">1 Star - Terrible</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Written Review</label>
                <textarea name="comment" className="w-full p-4 bg-slate-50 border border-slate-200 focus:border-primary rounded-xl text-xs font-semibold placeholder-slate-400 outline-none" rows="3" required placeholder="Leave review feedback..."></textarea>
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button type="button" onClick={() => setReviewingBooking(null)} className="btn-secondary text-xs px-4 py-2.5 rounded-xl">Cancel</button>
                <button type="submit" className="btn-primary text-xs px-4 py-2.5 rounded-xl shadow-md">Submit Review</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerDashboard;
