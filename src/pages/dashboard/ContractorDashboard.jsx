import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../../context/AuthContext';
import {
  Building, MapPin, Briefcase, Plus,
  Settings, Layout, ShieldCheck, Hourglass,
  Users, CheckCircle, HelpCircle, LogOut
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

const ContractorDashboard = () => {
  const { user, bookings, updateBookingStatus, tickets, addTicket, logout, refreshData, showToast, confirm } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const tabParam = searchParams.get('tab');

  const activeTab = tabParam || 'leads';

  // Parse and serialize helper functions
  const parseServicesAndTeam = (servicesOffered) => {
    if (!servicesOffered) return { services: '', teamList: [] };
    const parts = servicesOffered.split(' | TEAM_JSON:');
    const services = parts[0] || '';
    let teamList = [];
    if (parts[1]) {
      try {
        teamList = JSON.parse(parts[1]);
      } catch (e) {
        console.error('Failed to parse team JSON:', e);
      }
    }
    return { services, teamList };
  };

  const serializeServicesAndTeam = (services, teamList) => {
    return `${services} | TEAM_JSON:${JSON.stringify(teamList)}`;
  };

  // Team metadata derived from the contractor profile
  const team = user?.services_offered ? parseServicesAndTeam(user.services_offered).teamList : [];
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('');
  const [newMemberPhone, setNewMemberPhone] = useState('');

  const [assigningBooking, setAssigningBooking] = useState(null);

  const [cities, setCities] = useState([]);
  const [coverageAreas, setCoverageAreas] = useState(['Ranchi', 'Patna']);

  // Support states
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketMessage, setTicketMessage] = useState('');
  const [ticketLoading, setTicketLoading] = useState(false);

  useEffect(() => {
    const fetchCitiesList = async () => {
      const { data, error } = await supabase.from('cities').select('*');
      if (!error && data) setCities(data);
    };
    fetchCitiesList();
  }, []);

  const updateTeamInDB = async (newTeam) => {
    const { services } = parseServicesAndTeam(user?.services_offered);
    const serialized = serializeServicesAndTeam(services, newTeam);
    const { error } = await supabase.from('contractors').update({ services_offered: serialized }).eq('id', user.id);
    if (!error) {
      await refreshData();
    } else {
      showToast('Failed to update team in database: ' + error.message, 'error');
    }
  };

  const isApproved = user?.status === 'Approved' || user?.status === 'Verified';

  // Leads & Projects
  const largeLeads = bookings.filter(b => b.status === 'New Request');
  const activeProjects = bookings.filter(b => b.worker_id === user?.id && b.status !== 'Completed');
  const myTickets = tickets.filter(t => t.user_id === user?.id);

  const handleAddTeamMember = async (e) => {
    e.preventDefault();
    if (!newMemberName || !newMemberRole) return;
    const newTeam = [...team, { 
      name: newMemberName, 
      role: newMemberRole, 
      phone: newMemberPhone || '9876543210', 
      status: 'Available' 
    }];
    await updateTeamInDB(newTeam);
    setNewMemberName('');
    setNewMemberRole('');
    setNewMemberPhone('');
  };

  const handleDeleteTeamMember = async (idxToDelete) => {
    const ok = await confirm('Remove this staff member from directory?');
    if (ok) {
      const newTeam = team.filter((_, idx) => idx !== idxToDelete);
      await updateTeamInDB(newTeam);
    }
  };

  const handleToggleService = async (serviceName) => {
    const { services: currentServices, teamList } = parseServicesAndTeam(user?.services_offered);
    let serviceList = currentServices.split(',').map(s => s.trim()).filter(Boolean);
    if (serviceList.includes(serviceName)) {
      serviceList = serviceList.filter(s => s !== serviceName);
    } else {
      serviceList = [...serviceList, serviceName];
    }
    const updatedServicesStr = serviceList.join(', ');
    const serialized = serializeServicesAndTeam(updatedServicesStr, teamList);
    const { error } = await supabase.from('contractors').update({ services_offered: serialized }).eq('id', user.id);
    if (!error) {
      await refreshData();
    } else {
      showToast('Failed to update services offered: ' + error.message, 'error');
    }
  };

  const handleAssignStaff = async (bookingId, staffName) => {
    const staffMember = team.find(t => t.name === staffName);
    const staffPhone = staffMember?.phone || user.phone || '9876543210';
    const { error } = await supabase.from('bookings').update({
      worker_name: staffName,
      worker_phone: staffPhone,
      status: 'Confirmed'
    }).eq('id', bookingId);
    if (!error) {
      showToast(`Assigned ${staffName} to project.`, 'success');
      setAssigningBooking(null);
      await refreshData();
    } else {
      showToast('Failed to assign staff: ' + error.message, 'error');
    }
  };

  const handleStartWork = async (bookingId) => {
    await updateBookingStatus(bookingId, 'In Progress');
    await refreshData();
  };

  const handleCompleteProject = async (bookingId) => {
    await updateBookingStatus(bookingId, 'Completed');
    await refreshData();
  };

  const handleAcceptLead = async (bookingId) => {
    const ok = await confirm('Accept this booking and assign to your firm?');
    if (!ok) return;
    const { error } = await supabase.from('bookings').update({
      worker_id: user.id,
      worker_name: user.company || user.name,
      worker_phone: user.phone,
      status: 'Assigned'
    }).eq('id', bookingId);
    if (!error) {
      showToast("Booking accepted! You can now assign workers under Projects.", 'success');
      await refreshData();
    } else {
      showToast("Failed to accept booking: " + error.message, 'error');
    }
  };

  const handleToggleCoverage = (cityName) => {
    if (coverageAreas.includes(cityName)) {
      setCoverageAreas(prev => prev.filter(c => c !== cityName));
    } else {
      setCoverageAreas(prev => [...prev, cityName]);
    }
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
      showToast('Failed to raise support ticket: ' + error.message, 'error');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Sidebar Navigation */}
        <aside className="lg:col-span-3 space-y-6">
          {/* Profile Card */}
          <div className="bg-white rounded-3xl border border-slate-100 p-6 text-center space-y-4 shadow-sm">
            <div className="h-16 w-16 mx-auto rounded-2xl bg-gradient-to-tr from-primary to-blue-500 text-white font-extrabold text-lg flex items-center justify-center uppercase tracking-wider shadow-md">
              <Building size={28} />
            </div>
            <div className="space-y-0.5">
              <h3 className="font-extrabold text-slate-800 text-sm leading-tight">{user?.company || 'Contractor Entity'}</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{user?.owner_name || 'Business Partner'}</p>
            </div>
            <div className="pt-2">
              <span className={`inline-flex px-3 py-1 text-[10px] font-black uppercase tracking-wider rounded-full ${
                isApproved ? 'bg-green-50 text-success border border-green-100' : 'bg-amber-50 text-warning border border-amber-100'
              }`}>
                {isApproved ? 'Approved' : user?.status || 'Pending Review'}
              </span>
            </div>
          </div>

          {/* Navigation Options */}
          <nav className="bg-white rounded-3xl border border-slate-100 p-3 shadow-sm flex flex-col gap-1 text-slate-600 text-xs">
            <button 
              onClick={() => navigate(`${location.pathname}?tab=leads`)}
              className={`flex items-center gap-2.5 p-3 rounded-xl ${
                activeTab === 'leads' ? 'btn-primary shadow-md' : 'btn-secondary'
              }`}
            >
              <Layout size={16} /> Leads Command
            </button>
            <button 
              onClick={() => navigate(`${location.pathname}?tab=projects`)}
              className={`flex items-center gap-2.5 p-3 rounded-xl ${
                activeTab === 'projects' ? 'btn-primary shadow-md' : 'btn-secondary'
              }`}
            >
              <Briefcase size={16} /> Projects ({activeProjects.length})
            </button>
            <button 
              onClick={() => navigate(`${location.pathname}?tab=team`)}
              className={`flex items-center gap-2.5 p-3 rounded-xl ${
                activeTab === 'team' ? 'btn-primary shadow-md' : 'btn-secondary'
              }`}
            >
              <Users size={16} /> Manage Team
            </button>
            <button 
              onClick={() => navigate(`${location.pathname}?tab=services`)}
              className={`flex items-center gap-2.5 p-3 rounded-xl ${
                activeTab === 'services' ? 'btn-primary shadow-md' : 'btn-secondary'
              }`}
            >
              <CheckCircle size={16} /> Service Management
            </button>
            <button 
              onClick={() => navigate(`${location.pathname}?tab=areas`)}
              className={`flex items-center gap-2.5 p-3 rounded-xl ${
                activeTab === 'areas' ? 'btn-primary shadow-md' : 'btn-secondary'
              }`}
            >
              <MapPin size={16} /> Service Areas
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
              <Settings size={16} /> Firm Profile
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

        {/* Main Work panel */}
        <main className="lg:col-span-9 bg-white rounded-3xl border border-slate-100 p-8 shadow-sm min-h-[500px]">
          
          {/* Under Review Block */}
          {!isApproved ? (
            <div className="py-16 text-center space-y-6 max-w-md mx-auto">
              <div className="h-16 w-16 mx-auto rounded-full bg-amber-50 text-warning flex items-center justify-center animate-pulse">
                <Hourglass size={32} />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-black text-slate-900">Application Under Review</h2>
                <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                  Our operations desk is auditing your contractor registration metadata and GST records. We will contact you once approved.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                <div className="p-3 bg-slate-50 rounded-xl flex flex-col items-center gap-1.5 border border-slate-100">
                  <ShieldCheck size={16} className="text-primary" />
                  <span>Document check</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl flex flex-col items-center gap-1.5 border border-slate-100">
                  <MapPin size={16} className="text-primary" />
                  <span>Region audit</span>
                </div>
              </div>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              {activeTab === 'leads' && (
                <motion.div 
                  key="leads"
                  className="space-y-6"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                    <h2 className="text-xl font-black text-slate-900">Contracting Leads Dispatch</h2>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{largeLeads.length} Available</span>
                  </div>

                  {largeLeads.length === 0 ? (
                    <div className="py-20 text-center border-2 border-dashed border-slate-200 bg-slate-50/50 rounded-2xl">
                      <Layout size={36} className="mx-auto text-slate-300 mb-2" />
                      <h4 className="font-extrabold text-slate-700 text-sm uppercase tracking-wider">No Leads Dispatched</h4>
                      <p className="text-xs text-slate-400 font-semibold mt-1">Check back later for large-scale contracting assignments in Jharkhand.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-4">
                      {largeLeads.map(lead => (
                        <div key={lead.id} className="bg-slate-50 p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                          <div>
                            <span className="text-[9px] font-black text-primary uppercase">LEAD ID: {lead.id}</span>
                            <h4 className="font-extrabold text-slate-900 text-sm mt-0.5">{lead.service_name}</h4>
                            <p className="text-xs text-slate-500 font-semibold mt-2 flex items-center gap-1"><MapPin size={12} /> City: {lead.city}</p>
                          </div>
                          <button onClick={() => handleAcceptLead(lead.id)} className="btn-primary text-xs px-5 py-2.5 rounded-xl shadow-md">Accept & Self-Assign</button>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === 'projects' && (
                <motion.div 
                  key="projects"
                  className="space-y-6"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                    <h2 className="text-xl font-black text-slate-900">Active Projects</h2>
                  </div>

                  {activeProjects.length === 0 ? (
                    <div className="py-20 text-center border-2 border-dashed border-slate-200 bg-slate-50/50 rounded-2xl">
                      <Briefcase size={36} className="mx-auto text-slate-300" />
                      <h4 className="font-extrabold text-slate-700 text-sm uppercase tracking-wider mt-2">No Active Projects</h4>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-4">
                      {activeProjects.map(proj => (
                        <div key={proj.id} className="bg-slate-50 p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                          <div className="flex justify-between items-start flex-wrap gap-2">
                            <div>
                              <span className="text-[10px] font-black text-primary uppercase">ID: {proj.id}</span>
                              <h4 className="font-extrabold text-slate-900 text-sm mt-0.5">{proj.service_name}</h4>
                              <p className="text-xs text-slate-400 font-semibold mt-1">Customer: {proj.customer_name} ({proj.customer_phone})</p>
                            </div>
                            <span className="px-2.5 py-1 bg-blue-50 text-primary text-[9px] font-black uppercase tracking-wider rounded-md">
                              {proj.status}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 font-semibold flex items-center gap-1"><MapPin size={12} /> {proj.customer_address}, {proj.city}</p>
                          
                          <div className="p-3 bg-white border border-slate-100 rounded-xl text-xs font-semibold flex justify-between items-center shadow-sm">
                            <span>
                              <strong>Assigned Worker:</strong> {proj.worker_name && proj.worker_name !== user.company ? proj.worker_name : 'None (Contractor Firm)'}
                            </span>
                            <button 
                              onClick={() => setAssigningBooking(proj)} 
                              className="btn-secondary text-[10px] px-3 py-1.5 rounded-lg shadow-sm"
                            >
                              {proj.worker_name && proj.worker_name !== user.company ? 'Reassign' : 'Assign Worker'}
                            </button>
                          </div>

                          <div className="flex gap-2">
                            {proj.status === 'Assigned' && (
                              <button 
                                onClick={() => setAssigningBooking(proj)} 
                                className="flex-1 btn-primary text-xs py-2 rounded-xl shadow-sm"
                              >
                                Assign Worker to Start
                              </button>
                            )}
                            {proj.status === 'Confirmed' && (
                              <button 
                                onClick={() => handleStartWork(proj.id)} 
                                className="flex-1 btn-primary text-xs py-2 rounded-xl shadow-sm"
                              >
                                Start Work
                              </button>
                            )}
                            {proj.status === 'In Progress' && (
                              <button 
                                onClick={() => handleCompleteProject(proj.id)} 
                                className="flex-1 btn-success text-xs py-2.5 rounded-xl shadow-md"
                              >
                                Complete Project
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === 'team' && (
                <motion.div 
                  key="team"
                  className="space-y-6"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <h2 className="text-xl font-black text-slate-900 pb-4 border-b border-slate-100">Manage Staff Directory</h2>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Add Staff form */}
                    <form onSubmit={handleAddTeamMember} className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-4 h-fit">
                      <h3 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">Add Staff Member</h3>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Full Name</label>
                        <input 
                          className="w-full h-11 px-4 bg-white border border-slate-200 focus:border-primary rounded-xl text-xs font-semibold placeholder-slate-400 outline-none"
                          placeholder="e.g. Ramesh Kumar"
                          value={newMemberName}
                          onChange={(e) => setNewMemberName(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Specialty / Role</label>
                        <input 
                          className="w-full h-11 px-4 bg-white border border-slate-200 focus:border-primary rounded-xl text-xs font-semibold placeholder-slate-400 outline-none"
                          placeholder="e.g. Lead Electrician, Mason"
                          value={newMemberRole}
                          onChange={(e) => setNewMemberRole(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Mobile Phone</label>
                        <input 
                          className="w-full h-11 px-4 bg-white border border-slate-200 focus:border-primary rounded-xl text-xs font-semibold placeholder-slate-400 outline-none"
                          placeholder="10-digit number"
                          value={newMemberPhone}
                          onChange={(e) => setNewMemberPhone(e.target.value)}
                          required
                        />
                      </div>
                      <button type="submit" className="w-full btn-primary text-xs py-3 rounded-xl shadow-md flex items-center justify-center gap-1"><Plus size={14} /> Add Staff</button>
                    </form>

                    {/* Staff Directory table */}
                    <div className="lg:col-span-2 space-y-4">
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Employees</h3>
                      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
                        <table className="w-full text-left border-collapse text-xs font-semibold text-slate-600">
                          <thead>
                            <tr className="bg-slate-50 text-slate-400 text-[10px] uppercase tracking-wider border-b border-slate-100">
                              <th className="p-4">Name</th>
                              <th className="p-4">Role Specialty</th>
                              <th className="p-4">Mobile</th>
                              <th className="p-4">Duty Status</th>
                              <th className="p-4">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {team.map((t, idx) => (
                              <tr key={idx} className="hover:bg-slate-50/50">
                                <td className="p-4 font-bold text-slate-900">{t.name}</td>
                                <td className="p-4">{t.role}</td>
                                <td className="p-4">{t.phone || 'N/A'}</td>
                                <td className="p-4"><span className="px-2.5 py-1 bg-green-50 text-success text-[9px] font-black uppercase tracking-wider rounded-md">{t.status}</span></td>
                                <td className="p-4">
                                  <button onClick={() => handleDeleteTeamMember(idx)} className="btn-danger text-[9px] px-2 py-1 rounded-md shadow-sm">Remove</button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'areas' && (
                <motion.div 
                  key="areas"
                  className="space-y-6"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <h2 className="text-xl font-black text-slate-900 pb-4 border-b border-slate-100">Service Coverage Areas</h2>
                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-4">
                    <h3 className="text-xs font-bold text-slate-800">Select Jharkhand regions for Leads dispatch</h3>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      {cities.map(city => {
                        const active = coverageAreas.includes(city.name);
                        return (
                          <div 
                            key={city.id} 
                            onClick={() => handleToggleCoverage(city.name)}
                            className={`p-4 border rounded-xl cursor-pointer text-center font-bold text-xs uppercase tracking-wider transition-all ${
                              active 
                                ? 'bg-primary border-primary text-white shadow-md shadow-primary/10' 
                                : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                            }`}
                          >
                            {city.name}
                          </div>
                        );
                      })}
                    </div>
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
                  <h2 className="text-xl font-black text-slate-900 pb-4 border-b border-slate-100">Contractor Help Resolution Desk</h2>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Create Ticket */}
                    <form onSubmit={handleCreateTicket} className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-4 h-fit">
                      <h3 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">Raise Support Ticket</h3>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Topic Subject</label>
                        <input 
                          className="w-full h-11 px-4 bg-white border border-slate-200 focus:border-primary rounded-xl text-xs font-semibold placeholder-slate-400 outline-none"
                          placeholder="e.g. Lead dispute, GST verification updates"
                          value={ticketSubject}
                          onChange={(e) => setTicketSubject(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Inquiry Statement</label>
                        <textarea 
                          className="w-full p-4 bg-white border border-slate-200 focus:border-primary rounded-xl text-xs font-semibold placeholder-slate-400 outline-none"
                          rows="4"
                          placeholder="Enter details of your ticket..."
                          value={ticketMessage}
                          onChange={(e) => setTicketMessage(e.target.value)}
                          required
                        />
                      </div>
                      <button type="submit" className="w-full btn-primary text-xs py-3 rounded-xl shadow-md flex justify-center items-center" disabled={ticketLoading}>
                        {ticketLoading ? 'Submitting...' : 'Submit Support Ticket'}
                      </button>
                    </form>

                    {/* Tickets List */}
                    <div className="space-y-4">
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tickets logs</h3>
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
                  className="space-y-6 max-w-xl animate-fade-in"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <h2 className="text-xl font-black text-slate-900 pb-4 border-b border-slate-100">Firm Profile details</h2>
                  <div className="bg-slate-50 border border-slate-100 p-8 rounded-2xl shadow-sm space-y-4 text-xs font-semibold">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Company / Firm Name</label>
                      <input className="w-full h-11 px-4 bg-white border border-slate-200 rounded-xl text-slate-700 outline-none" value={user?.company} disabled />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">MD / Proprietor Name</label>
                      <input className="w-full h-11 px-4 bg-white border border-slate-200 rounded-xl text-slate-700 outline-none" value={user?.owner_name} disabled />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">GST Registration Identification</label>
                      <input className="w-full h-11 px-4 bg-white border border-slate-200 rounded-xl text-primary font-bold outline-none" value={user?.gst || 'EXEMPT / NOT REGISTERED'} disabled />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Services Catalog Offered</label>
                      <input className="w-full h-11 px-4 bg-white border border-slate-200 rounded-xl text-slate-700 outline-none" value={user?.services_offered || 'General contracting / painting'} disabled />
                    </div>
                  </div>
                </motion.div>
              )}
              {activeTab === 'services' && (
                <motion.div 
                  key="services"
                  className="space-y-6"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <h2 className="text-xl font-black text-slate-900 pb-4 border-b border-slate-100">Service Management</h2>
                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-4">
                    <h3 className="text-xs font-bold text-slate-800">Select the home services your contracting company offers</h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {['Electrician', 'Plumber', 'AC Repair', 'Cleaning Help', 'Painting Services', 'Carpenter Help'].map(serviceName => {
                        const { services: currentServices } = parseServicesAndTeam(user?.services_offered);
                        const isOffered = currentServices.split(',').map(s => s.trim()).filter(Boolean).includes(serviceName);
                        return (
                          <div 
                            key={serviceName} 
                            onClick={() => handleToggleService(serviceName)}
                            className={`p-4 border rounded-xl cursor-pointer flex justify-between items-center transition-all ${
                              isOffered 
                                ? 'bg-primary border-primary text-white shadow-md shadow-primary/10' 
                                : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                            }`}
                          >
                            <span className="font-bold text-xs uppercase tracking-wider">{serviceName}</span>
                            <div className={`h-4 w-4 rounded border flex items-center justify-center ${
                              isOffered ? 'border-white bg-white text-primary' : 'border-slate-300'
                            }`}>
                              {isOffered && <CheckCircle size={10} />}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          )}

        </main>

      </div>

      {/* Assign Staff member Modal */}
      {assigningBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-md w-full border border-slate-100 space-y-6">
            <div>
              <h3 className="text-lg font-black text-slate-900 leading-tight">Assign Staff Member</h3>
              <p className="text-xs text-slate-400 font-semibold mt-1">Select an employee from your team directory to assign to this project.</p>
            </div>
            
            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {team.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-xs font-semibold space-y-2">
                  <p>No staff members found in directory.</p>
                  <button 
                    onClick={() => { setAssigningBooking(null); navigate(`${location.pathname}?tab=team`); }}
                    className="btn-primary text-xs px-4 py-2 rounded-xl shadow-md text-center inline-block"
                  >
                    Add Staff Members
                  </button>
                </div>
              ) : (
                team.map(member => (
                  <div 
                    key={member.name} 
                    onClick={() => handleAssignStaff(assigningBooking.id, member.name)}
                    className="p-4 bg-slate-50 hover:bg-blue-50 border border-slate-100 hover:border-primary/30 rounded-xl cursor-pointer flex justify-between items-center transition-all"
                  >
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">{member.name}</h4>
                      <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{member.role} • {member.phone}</p>
                    </div>
                    <span className="text-[10px] font-black text-primary uppercase">Assign</span>
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button 
                type="button" 
                onClick={() => setAssigningBooking(null)} 
                className="btn-secondary text-xs px-4 py-2.5 rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContractorDashboard;
