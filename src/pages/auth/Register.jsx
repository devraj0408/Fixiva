import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useApp } from '../../context/AuthContext';
import { Loader2, Mail, Lock, User, Briefcase, Info, Building, ShieldCheck, Phone, CheckCircle, ArrowRight } from 'lucide-react';

const Register = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialRole = queryParams.get('role') || 'customer';

  const [role, setRole] = useState(initialRole);
  const { register } = useApp();
  const [loading, setLoading] = useState(false);
  
  // Registration data fields
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    city: '',
    phone: '',
    
    // Worker fields
    skills: '',
    experience: '',
    whatsapp: '',
    id_proof_number: '', // Changed from id_proof_url to number
    profile_photo: null, // Changed from url string to null (for File object)

    // Contractor fields
    company: '',
    owner_name: '',
    gst: '',
    services_offered: ''
  });

  const [errors, setErrors] = useState({});

  const validate = () => {
    let newErrors = {};
    if (!formData.name) newErrors.name = 'Full name is required';
    if (!formData.email) newErrors.email = 'Email address is required';
    if (!formData.password) newErrors.password = 'Password is required';
    if (!formData.city) newErrors.city = 'Operating city is required';
    if (!formData.phone) newErrors.phone = 'Phone contact is required';

    if (role === 'worker') {
      if (!formData.skills) newErrors.skills = 'Please list primary skills';
      if (!formData.experience) newErrors.experience = 'Experience count is required';
      if (!formData.whatsapp) newErrors.whatsapp = 'WhatsApp mobile is required';
      if (!formData.id_proof_number) newErrors.id_proof_number = 'ID Proof number is required';
    }
    if (role === 'contractor') {
      if (!formData.company) newErrors.company = 'Company name is required';
      if (!formData.owner_name) newErrors.owner_name = 'Owner name is required';
      if (!formData.whatsapp) newErrors.whatsapp = 'WhatsApp contact is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    
    // Build register payload with all columns matching profile schemas
    const extraPayload = {
      name: formData.name,
      phone: formData.phone,
      city: formData.city,
      
      // Worker properties
      skills: formData.skills,
      experience: formData.experience,
      whatsapp: formData.whatsapp,
      id_proof_url: formData.id_proof_number,
      profile_photo: formData.profile_photo, // Pass the File object to AuthContext for upload

      // Contractor properties
      company: formData.company,
      owner_name: formData.owner_name,
      gst: formData.gst,
      services_offered: formData.services_offered
    };

    // Note: If your AuthContext sends this to a backend API, ensure it uses 
    // FormData to handle the profile_photo File object properly.
    const { success, error } = await register(formData.email, formData.password, role, extraPayload);
    setLoading(false);
    
    if (!success) {
      console.error('Registration failed:', error);
      alert('Registration failed: ' + (error?.message || 'Invalid registration details. Please check your credentials.'));
      return;
    }
    navigate(`/dashboard/${role}`);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-16">
      <div className="bg-white rounded-3xl border border-slate-100 p-8 sm:p-12 shadow-xl shadow-slate-100/50 space-y-8">
        
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Create an Account</h1>
          <p className="text-xs text-slate-400 font-semibold">Join Fixiva as a customer, worker professional or contractor partner.</p>
        </div>

        {/* Role Selection tab cards */}
        <div className="grid grid-cols-3 gap-3 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
          {[
            { id: 'customer', label: 'Customer', icon: User },
            { id: 'worker', label: 'Worker', icon: Briefcase },
            { id: 'contractor', label: 'Contractor', icon: Building }
          ].map(opt => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setRole(opt.id)}
              className={`flex flex-col sm:flex-row items-center justify-center gap-1.5 py-3 rounded-xl text-xs font-bold transition-all ${
                role === opt.id 
                  ? 'bg-white text-primary shadow-sm border border-slate-100' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <opt.icon size={14} />
              <span>{opt.label}</span>
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* General Fields (For all roles) */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Account profile Details</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Rahul Sharma"
                  className="w-full h-11 px-4 bg-slate-50 border border-slate-200 focus:border-primary rounded-xl text-xs font-semibold placeholder-slate-400 outline-none transition-all"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
                {errors.name && <p className="text-danger text-[10px] font-bold text-red-500">{errors.name}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Email Address</label>
                <input
                  type="email"
                  placeholder="name@email.com"
                  className="w-full h-11 px-4 bg-slate-50 border border-slate-200 focus:border-primary rounded-xl text-xs font-semibold placeholder-slate-400 outline-none transition-all"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
                {errors.email && <p className="text-danger text-[10px] font-bold text-red-500">{errors.email}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Operating City</label>
                <input
                  type="text"
                  placeholder="e.g. Ranchi"
                  className="w-full h-11 px-4 bg-slate-50 border border-slate-200 focus:border-primary rounded-xl text-xs font-semibold placeholder-slate-400 outline-none transition-all"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                />
                {errors.city && <p className="text-danger text-[10px] font-bold text-red-500">{errors.city}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Contact Phone</label>
                <input
                  type="text"
                  placeholder="10-digit mobile number"
                  className="w-full h-11 px-4 bg-slate-50 border border-slate-200 focus:border-primary rounded-xl text-xs font-semibold placeholder-slate-400 outline-none transition-all"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
                {errors.phone && <p className="text-danger text-[10px] font-bold text-red-500">{errors.phone}</p>}
              </div>
            </div>
          </div>

          {/* Worker Fields */}
          {role === 'worker' && (
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Worker Credentials</h3>
              
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Primary Skills (e.g. Plumber, Electrician)</label>
                <input
                  type="text"
                  placeholder="Services you specialize in"
                  className="w-full h-11 px-4 bg-slate-50 border border-slate-200 focus:border-primary rounded-xl text-xs font-semibold placeholder-slate-400 outline-none transition-all"
                  value={formData.skills}
                  onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                />
                {errors.skills && <p className="text-danger text-[10px] font-bold text-red-500">{errors.skills}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Experience (Years)</label>
                  <input
                    type="text"
                    placeholder="e.g. 5 Years"
                    className="w-full h-11 px-4 bg-slate-50 border border-slate-200 focus:border-primary rounded-xl text-xs font-semibold placeholder-slate-400 outline-none transition-all"
                    value={formData.experience}
                    onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                  />
                  {errors.experience && <p className="text-danger text-[10px] font-bold text-red-500">{errors.experience}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">WhatsApp Contact</label>
                  <input
                    type="text"
                    placeholder="WhatsApp number"
                    className="w-full h-11 px-4 bg-slate-50 border border-slate-200 focus:border-primary rounded-xl text-xs font-semibold placeholder-slate-400 outline-none transition-all"
                    value={formData.whatsapp}
                    onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                  />
                  {errors.whatsapp && <p className="text-danger text-[10px] font-bold text-red-500">{errors.whatsapp}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">ID Proof Number (e.g. PAN)</label>
                  <input
                    type="text"
                    placeholder="Enter ID proof number"
                    className="w-full h-11 px-4 bg-slate-50 border border-slate-200 focus:border-primary rounded-xl text-xs font-semibold placeholder-slate-400 outline-none transition-all"
                    value={formData.id_proof_number}
                    onChange={(e) => setFormData({ ...formData, id_proof_number: e.target.value })}
                  />
                  {errors.id_proof_number && <p className="text-danger text-[10px] font-bold text-red-500">{errors.id_proof_number}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Profile Photo (Camera / Gallery)</label>
                  <input
                    type="file"
                    accept="image/*"
                    className="w-full h-11 px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-primary rounded-xl text-xs font-semibold text-slate-500 outline-none transition-all file:mr-3 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-[10px] file:font-semibold file:bg-primary file:text-white hover:file:bg-primary/90 cursor-pointer"
                    onChange={(e) => setFormData({ ...formData, profile_photo: e.target.files[0] })}
                  />
                </div>
              </div>
            </div>
          )}

          {role === 'contractor' && (
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Contractor Business details</h3>
              
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Company/Firm Name</label>
                <input
                  type="text"
                  placeholder="Your contracting business entity"
                  className="w-full h-11 px-4 bg-slate-50 border border-slate-200 focus:border-primary rounded-xl text-xs font-semibold placeholder-slate-400 outline-none transition-all"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                />
                {errors.company && <p className="text-danger text-[10px] font-bold text-red-500">{errors.company}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Owner / Proprietor Name</label>
                  <input
                    type="text"
                    placeholder="Full owner name"
                    className="w-full h-11 px-4 bg-slate-50 border border-slate-200 focus:border-primary rounded-xl text-xs font-semibold placeholder-slate-400 outline-none transition-all"
                    value={formData.owner_name}
                    onChange={(e) => setFormData({ ...formData, owner_name: e.target.value })}
                  />
                  {errors.owner_name && <p className="text-danger text-[10px] font-bold text-red-500">{errors.owner_name}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">GSTIN Number</label>
                  <input
                    type="text"
                    placeholder="GSTIN registration pro format"
                    className="w-full h-11 px-4 bg-slate-50 border border-slate-200 focus:border-primary rounded-xl text-xs font-semibold placeholder-slate-400 outline-none transition-all"
                    value={formData.gst}
                    onChange={(e) => setFormData({ ...formData, gst: e.target.value })}
                  />
                  {errors.gst && <p className="text-danger text-[10px] font-bold text-red-500">{errors.gst}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">WhatsApp Number</label>
                  <input
                    type="text"
                    placeholder="Company WhatsApp contact"
                    className="w-full h-11 px-4 bg-slate-50 border border-slate-200 focus:border-primary rounded-xl text-xs font-semibold placeholder-slate-400 outline-none transition-all"
                    value={formData.whatsapp}
                    onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                  />
                  {errors.whatsapp && <p className="text-danger text-[10px] font-bold text-red-500">{errors.whatsapp}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Services Offered</label>
                  <input
                    type="text"
                    placeholder="e.g. Painting, General contractor"
                    className="w-full h-11 px-4 bg-slate-50 border border-slate-200 focus:border-primary rounded-xl text-xs font-semibold placeholder-slate-400 outline-none transition-all"
                    value={formData.services_offered}
                    onChange={(e) => setFormData({ ...formData, services_offered: e.target.value })}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Account Password */}
          <div className="space-y-1.5 pt-4 border-t border-slate-100">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Create Account Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 text-slate-400" size={16} />
              <input
                type="password"
                placeholder="••••••••"
                className="w-full h-11 pl-10 pr-4 bg-slate-50 border border-slate-200 focus:border-primary rounded-xl text-xs font-semibold placeholder-slate-400 outline-none transition-all"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>
            {errors.password && <p className="text-danger text-xs font-bold text-red-500">{errors.password}</p>}
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl flex gap-3 items-start border border-slate-100 text-[10px] leading-relaxed text-slate-500 font-semibold">
            <ShieldCheck className="shrink-0 text-primary mt-0.5" size={16} />
            <p>
              By proceeding, you agree to our terms. Worker and Contractor profiles will remain under operations audit verification queue before listing publicly.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary bg-primary text-white text-sm py-3.5 rounded-xl shadow-md flex items-center justify-center gap-1.5 transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" size={16} /> : (
              <>
                {role === 'customer' ? 'Create Customer Account' : 'Apply to Join'}
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        <div className="text-center pt-4 border-t border-slate-100">
          <p className="text-xs text-slate-500 font-semibold">
            Already registered?{' '}
            <Link to="/login" className="text-primary font-bold hover:underline">
              Sign in instead
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
};

export default Register;