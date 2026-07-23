import { useState } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../../context/AuthContext';
import {
  Clock, List, Settings, CheckSquare, IndianRupee, HelpCircle, LogOut, Award, MapPin, PhoneOff
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

const WorkerDashboard = () => {
  const { user, bookings, updateBookingStatus, refreshData, tickets, addTicket, updateUserProfile, logout, showToast, confirm } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const tabParam = searchParams.get('tab');

  const activeTab = tabParam || 'jobs';
  
  // Support & Profile fields
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketMessage, setTicketMessage] = useState('');
  const [ticketLoading, setTicketLoading] = useState(false);

  const [skills, setSkills] = useState(user?.skills || '');
  const [experience, setExperience] = useState(user?.experience || '');
  const [whatsapp, setWhatsapp] = useState(user?.whatsapp || '');
  const [hourlyRate, setHourlyRate] = useState(user?.hourly_rate || '');
  const [visitCharge, setVisitCharge] = useState(user?.visit_charge || '');
  const [profileLoading, setProfileLoading] = useState(false);

  const userRole = String(user?.role || '').trim().toLowerCase();
  if (user && userRole !== 'worker') {
    if (userRole === 'admin') return <Navigate to="/dashboard/admin" replace />;
    if (userRole === 'contractor') return <Navigate to="/contractor-dashboard" replace />;
    return <Navigate to="/dashboard/customer" replace />;
  }

  // Filter jobs
  const myJobs = bookings.filter(b => b.worker_id === user?.id);
  const myTickets = tickets.filter(t => t.user_id === user?.id);

  const assignedJobs = myJobs.filter(b => b.status === 'Assigned');
  const activeJobs = myJobs.filter(b => ['Confirmed', 'In Progress'].includes(b.status));
  const completedJobs = myJobs.filter(b => b.status === 'Completed');

  // Earnings calculations
  const totalEarnings = completedJobs.reduce((acc, curr) => acc + Number(curr.price || 0), 0);
  const outstandingCommission = completedJobs.reduce((acc, curr) => acc + Number(curr.platform_fee || 0), 0);

  const handleJobStatusUpdate = async (bookingId, newStatus) => {
    await updateBookingStatus(bookingId, newStatus);
    await refreshData();
  };

  const handleRejectJob = async (bookingId) => {
    const ok = await confirm('Reject this job? It will be sent back to Admin for reassignment.');
    if (!ok) return;
    const { error } = await supabase.from('bookings').update({
      status: 'New Request',
      worker_id: null,
      worker_name: null,
      worker_phone: null
    }).eq('id', bookingId);
    
    if (!error) {
      showToast('Job rejected.', 'success');
      await refreshData();
    } else {
      showToast('Failed to reject job: ' + error.message, 'error');
    }
  };

  const handleReportCustomerNoShow = async (bookingId) => {
    const ok = await confirm('Confirm Customer No-Show? This will notify Admin.');
    if (!ok) return;
    await updateBookingStatus(bookingId, 'Customer No Show');
    await refreshData();
  };

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
      await refreshData();
    } else {
      showToast('Failed to raise ticket: ' + error.message, 'error');
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
      showToast('Profile details updated successfully!', 'success');
      await refreshData();
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

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Sidebar Navigation */}
        <aside className="lg:col-span-3 space-y-6">
          {/* Profile Card */}
          <div className="bg-white rounded-3xl border border-slate-100 p-6 text-center space-y-4 shadow-sm">
            <div className="h-16 w-16 mx-auto rounded-full bg-gradient-to-tr from-amber-500 to-orange-500 text-white font-extrabold text-lg flex items-center justify-center uppercase tracking-wider shadow-md ring-4 ring-amber-50">
              {getInitials(user?.name)}
            </div>
            <div className="space-y-0.5">
              <h3 className="font-extrabold text-slate-800 text-sm leading-tight">{user?.name}</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{user?.skills || 'Professional Partner'}</p>
            </div>
            
            {/* Trust Score Bar */}
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 text-left space-y-1.5">
              <div className="flex justify-between items-center text-[9px] font-black uppercase text-slate-400">
                <span>Trust Score</span>
                <span className={user?.trust_score < 60 ? 'text-danger' : 'text-success'}>
                  {user?.trust_score ?? 100}/100
                </span>
              </div>
              <div className="h-1 bg-slate-200 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 ${user?.trust_score < 60 ? 'bg-danger' : 'bg-success'}`}
                  style={{ width: `${user?.trust_score ?? 100}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Navigation Options */}
          <nav className="bg-white rounded-3xl border border-slate-100 p-3 shadow-sm flex flex-col gap-1 text-slate-600 text-xs">
            <button 
              onClick={() => navigate(`${location.pathname}?tab=jobs`)}
              className={`flex items-center gap-2.5 p-3 rounded-xl ${
                activeTab === 'jobs' ? 'btn-primary shadow-md' : 'btn-secondary'
              }`}
            >
              <List size={16} /> Job Schedules
            </button>
            <button 
              onClick={() => navigate(`${location.pathname}?tab=earnings`)}
              className={`flex items-center gap-2.5 p-3 rounded-xl ${
                activeTab === 'earnings' ? 'btn-primary shadow-md' : 'btn-secondary'
              }`}
            >
              <IndianRupee size={16} /> Earnings Ledger
            </button>
            <button 
              onClick={() => navigate(`${location.pathname}?tab=support`)}
              className={`flex items-center gap-2.5 p-3 rounded-xl ${
                activeTab === 'support' ? 'btn-primary shadow-md' : 'btn-secondary'
              }`}
            >
              <HelpCircle size={16} /> Support Tickets
            </button>
            <button 
              onClick={() => navigate(`${location.pathname}?tab=profile`)}
              className={`flex items-center gap-2.5 p-3 rounded-xl ${
                activeTab === 'profile' ? 'btn-primary shadow-md' : 'btn-secondary'
              }`}
            >
              <Settings size={16} /> Pricing & Profile
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
        <main className="lg:col-span-9 bg-white rounded-3xl border border-slate-100 p-8 shadow-sm min-h-[550px] space-y-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 pb-4 border-b border-slate-100">
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Professional Workspace</h2>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
              user?.status === 'Verified' ? 'bg-green-50 text-success border border-green-100' : 'bg-amber-50 text-warning border border-amber-100'
            }`}>
              {user?.status === 'Verified' ? <CheckSquare size={12} /> : <Clock size={12} />}
              {user?.status || 'Pending Verification'}
            </span>
          </div>

          <AnimatePresence mode="wait">
            {activeTab === 'jobs' && (
              <motion.div 
                key="jobs" 
                className="space-y-8"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                {/* Dispatched Offers */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                    <Award size={16} /> Dispatched Job Offers ({assignedJobs.length})
                  </h3>
                  {assignedJobs.length === 0 ? (
                    <p className="text-slate-400 text-xs p-6 bg-slate-50 border border-dashed border-slate-200 rounded-2xl font-semibold">
                      No new job dispatches waiting.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 gap-4">
                      {assignedJobs.map(job => (
                        <div key={job.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                          <div className="flex justify-between items-start flex-wrap gap-2">
                            <div>
                              <span className="text-[10px] font-black text-primary uppercase">ID: {job.id}</span>
                              <h4 className="font-extrabold text-slate-900 text-sm mt-0.5">{job.service_name}</h4>
                            </div>
                            <span className="px-2.5 py-1 bg-amber-50 text-warning text-[9px] font-black uppercase tracking-wider rounded-md">
                              New Offer
                            </span>
                          </div>
                          
                          {/* Client coordinates */}
                          <div className="p-4 bg-slate-50 rounded-xl text-xs space-y-2 font-semibold text-slate-600">
                            <p><strong>Customer:</strong> {job.customer_name}</p>
                            <p><strong>Contact Mobile:</strong> {job.customer_phone}</p>
                            <p className="flex items-start gap-1"><MapPin size={14} className="text-slate-400 shrink-0 mt-0.5" /> <span>{job.customer_address}, {job.city}</span></p>
                            <p className="flex items-center gap-1"><Clock size={14} className="text-slate-400 shrink-0" /> <span>Scheduled: {new Date(job.booking_date || job.preferred_date).toLocaleDateString()}</span></p>
                          </div>
                          
                          <div className="flex gap-2">
                            <button onClick={() => handleJobStatusUpdate(job.id, 'Confirmed')} className="flex-1 btn-primary text-xs py-2.5 rounded-xl shadow-md">Accept Job</button>
                            <button onClick={() => handleRejectJob(job.id)} className="flex-1 btn-danger text-xs py-2.5 rounded-xl shadow-md">Reject Job</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Active Jobs */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-warning flex items-center gap-1.5">
                    <Clock size={16} /> Active Schedules ({activeJobs.length})
                  </h3>
                  {activeJobs.length === 0 ? (
                    <p className="text-slate-400 text-xs p-6 bg-slate-50 border border-dashed border-slate-200 rounded-2xl font-semibold">
                      No active schedules in progress.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 gap-4">
                      {activeJobs.map(job => (
                        <div key={job.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                          <div className="flex justify-between items-start flex-wrap gap-2">
                            <div>
                              <span className="text-[10px] font-black text-primary uppercase">ID: {job.id}</span>
                              <h4 className="font-extrabold text-slate-900 text-sm mt-0.5">{job.service_name}</h4>
                            </div>
                            <span className="px-2.5 py-1 bg-blue-50 text-primary text-[9px] font-black uppercase tracking-wider rounded-md">
                              {job.status}
                            </span>
                          </div>
                          
                          <div className="p-4 bg-slate-50 rounded-xl text-xs space-y-2 font-semibold text-slate-600">
                            <p><strong>Customer:</strong> {job.customer_name}</p>
                            <p><strong>Contact Mobile:</strong> {job.customer_phone}</p>
                            <p className="flex items-start gap-1"><MapPin size={14} className="text-slate-400 shrink-0 mt-0.5" /> <span>{job.customer_address}, {job.city}</span></p>
                            <p className="flex items-center gap-1"><Clock size={14} className="text-slate-400 shrink-0" /> <span>Scheduled: {new Date(job.booking_date || job.preferred_date).toLocaleDateString()}</span></p>
                          </div>

                          <div className="flex gap-2">
                            {job.status === 'Confirmed' && (
                              <button onClick={() => handleJobStatusUpdate(job.id, 'In Progress')} className="flex-1 btn-primary text-xs py-2.5 rounded-xl shadow-md">Start Work</button>
                            )}
                            {job.status === 'In Progress' && (
                              <button onClick={() => handleJobStatusUpdate(job.id, 'Completed')} className="flex-1 btn-success text-xs py-2.5 rounded-xl shadow-md">Complete Job</button>
                            )}
                            <button onClick={() => handleReportCustomerNoShow(job.id)} className="flex-1 btn-danger text-xs py-2.5 rounded-xl shadow-md flex items-center justify-center gap-1">
                              <PhoneOff size={14} /> Customer No-Show
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'earnings' && (
              <motion.div 
                key="earnings" 
                className="space-y-6"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <h3 className="text-lg font-black text-slate-900 tracking-tight">Earnings & Platform Commission</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="bg-slate-50 p-6 border border-slate-100 rounded-2xl text-center space-y-1">
                    <span className="text-[10px] font-black uppercase text-slate-400">Total Cash Collected</span>
                    <h4 className="text-3xl font-black text-success">₹{totalEarnings}</h4>
                    <p className="text-[10px] text-slate-400 font-semibold">Earnings from completed service assignments</p>
                  </div>
                  <div className="bg-slate-50 p-6 border border-slate-100 rounded-2xl text-center space-y-1">
                    <span className="text-[10px] font-black uppercase text-slate-400">Platform Convenience Commission</span>
                    <h4 className="text-3xl font-black text-primary">₹{outstandingCommission}</h4>
                    <p className="text-[10px] text-slate-400 font-semibold">Convenience fee payouts to settle with platform</p>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
                  <div className="p-5 bg-slate-55 border-b font-extrabold text-slate-800 text-xs uppercase tracking-wider">
                    Completed service logs
                  </div>
                  {completedJobs.length === 0 ? (
                    <p className="text-slate-400 text-xs text-center py-10 font-semibold">No completed jobs logged.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs font-semibold text-slate-600">
                        <thead>
                          <tr className="bg-slate-50 text-slate-400 text-[10px] uppercase tracking-wider border-b border-slate-100">
                            <th className="p-4">Job ID</th>
                            <th className="p-4">Customer</th>
                            <th className="p-4">Service Type</th>
                            <th className="p-4">Job Charge</th>
                            <th className="p-4">Commission</th>
                            <th className="p-4">Date</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {completedJobs.map(job => (
                            <tr key={job.id} className="hover:bg-slate-50/50">
                              <td className="p-4 font-bold text-primary">{job.id.substring(0, 8)}...</td>
                              <td className="p-4 font-bold text-slate-900">{job.customer_name}</td>
                              <td className="p-4">{job.service_name}</td>
                              <td className="p-4 font-bold text-success">₹{job.price}</td>
                              <td className="p-4 text-slate-400">₹{job.platform_fee}</td>
                              <td className="p-4">{new Date(job.created_at).toLocaleDateString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
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
                <h2 className="text-xl font-black text-slate-900 tracking-tight">Professional Support Desk</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  
                  {/* Create Ticket */}
                  <form onSubmit={handleCreateTicket} className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-4 h-fit">
                    <h3 className="font-extrabold text-slate-800 text-sm">Open Assistance Ticket</h3>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Topic Subject</label>
                      <input 
                        className="w-full h-11 px-4 bg-white border border-slate-200 focus:border-primary rounded-xl text-xs font-semibold placeholder-slate-400 outline-none"
                        placeholder="e.g. Settlement issue, Customer dispute"
                        value={ticketSubject}
                        onChange={(e) => setTicketSubject(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Description details</label>
                      <textarea 
                        className="w-full p-4 bg-white border border-slate-200 focus:border-primary rounded-xl text-xs font-semibold placeholder-slate-400 outline-none"
                        rows="4"
                        placeholder="Enter support details..."
                        value={ticketMessage}
                        onChange={(e) => setTicketMessage(e.target.value)}
                        required
                      />
                    </div>
                     <button type="submit" className="w-full btn-primary text-xs py-3 rounded-xl shadow-md flex justify-center items-center" disabled={ticketLoading}>
                      {ticketLoading ? 'Submitting...' : 'Send Ticket'}
                    </button>
                  </form>

                  {/* Tickets List */}
                  <div className="space-y-4">
                    <h3 className="font-extrabold text-slate-800 text-sm">Assistance Tickets logs</h3>
                    {myTickets.length === 0 ? (
                      <p className="text-slate-400 text-xs font-semibold">No support tickets raised.</p>
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
                className="max-w-xl space-y-6"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <h2 className="text-xl font-black text-slate-900 tracking-tight">Pricing & Profile Settings</h2>
                
                <form onSubmit={handleUpdateProfile} className="bg-slate-50 border border-slate-100 p-8 rounded-2xl shadow-sm space-y-4 text-xs font-semibold">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Professional Name</label>
                    <input className="w-full h-11 px-4 bg-white border border-slate-200 rounded-xl text-slate-700 outline-none" value={user?.name} disabled />
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Primary Skills Catalog</label>
                    <input 
                      className="w-full h-11 px-4 bg-white border border-slate-200 focus:border-primary rounded-xl text-slate-700 outline-none"
                      value={skills} 
                      onChange={(e) => setSkills(e.target.value)}
                      placeholder="e.g. Plumber, Electrician"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Years of Experience</label>
                    <input 
                      className="w-full h-11 px-4 bg-white border border-slate-200 focus:border-primary rounded-xl text-slate-700 outline-none"
                      value={experience} 
                      onChange={(e) => setExperience(e.target.value)}
                      placeholder="e.g. 5 Years"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Hourly Rate (₹)</label>
                      <input 
                        type="number"
                        className="w-full h-11 px-4 bg-white border border-slate-200 focus:border-primary rounded-xl text-slate-700 outline-none"
                        value={hourlyRate} 
                        onChange={(e) => setHourlyRate(e.target.value)}
                        placeholder="Hourly charge"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Inspection Charge (₹)</label>
                      <input 
                        type="number"
                        className="w-full h-11 px-4 bg-white border border-slate-200 focus:border-primary rounded-xl text-slate-700 outline-none"
                        value={visitCharge} 
                        onChange={(e) => setVisitCharge(e.target.value)}
                        placeholder="Inspection charge"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">WhatsApp Contact Mobile</label>
                    <input 
                      className="w-full h-11 px-4 bg-white border border-slate-200 focus:border-primary rounded-xl text-slate-700 outline-none"
                      value={whatsapp} 
                      onChange={(e) => setWhatsapp(e.target.value)}
                      placeholder="10-digit number"
                    />
                  </div>

                   <button 
                    type="submit" 
                    className="w-full btn-primary text-xs py-3 rounded-xl shadow-md flex justify-center items-center" 
                    disabled={profileLoading}
                  >
                    {profileLoading ? 'Saving Settings...' : 'Save Pricing Details'}
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </main>

      </div>
    </div>
  );
};

export default WorkerDashboard;
