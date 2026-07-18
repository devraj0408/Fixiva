import { useState } from 'react';
import { Mail, MapPin, Loader2, CheckCircle, ShieldCheck } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useApp } from '../context/AuthContext';

const ContactUs = () => {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { showToast } = useApp();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const leadData = {
      name: formData.get('name'),
      email: formData.get('email'),
      subject: formData.get('subject'),
      message: formData.get('message'),
    };

    setLoading(true);
    // Stores submissions in Supabase support_tickets table as requested
    const { error } = await supabase.from('support_tickets').insert({
      subject: `CONTACT FORM: ${leadData.subject} (From: ${leadData.name} - ${leadData.email})`,
      message: leadData.message,
      status: 'Open'
    });
    
    setLoading(false);
    if (error) {
      showToast('Failed to send message: ' + error.message, 'error');
    } else {
      setSubmitted(true);
      e.target.reset();
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-xl mx-auto mb-16 space-y-3">
          <span className="text-[10px] font-black uppercase tracking-widest text-primary">Get in Touch</span>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Contact Fixiva
          </h1>
          <p className="text-slate-500 font-medium text-xs sm:text-sm">
            Have a question or request? Fill out our form below, and our operations desk will resolve it within 24 hours.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-5xl mx-auto items-start">
          {/* Info Side */}
          <div className="lg:col-span-5 bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
            <h3 className="font-extrabold text-slate-900 text-lg border-b pb-3 mb-2">Connect Coordinates</h3>
            
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-blue-50 text-primary rounded-xl flex items-center justify-center shrink-0">
                  <Mail size={18} />
                </div>
                 <div className="space-y-0.5">
                  <h4 className="font-bold text-slate-950 text-xs uppercase tracking-wider">Email Support</h4>
                  <a href="mailto:sinhadev739@gmail.com" className="text-primary text-xs font-bold hover:underline break-all">
                    sinhadev739@gmail.com
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-blue-50 text-primary rounded-xl flex items-center justify-center shrink-0">
                  <MapPin size={18} />
                </div>
                <div className="space-y-0.5">
                  <h4 className="font-bold text-slate-950 text-xs uppercase tracking-wider">Headquarters</h4>
                  <p className="text-slate-500 text-xs font-semibold">
                    Deoghar, Jharkhand, India
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl flex gap-3 items-start border border-slate-100 text-[10px] leading-relaxed text-slate-500 font-semibold">
              <ShieldCheck className="shrink-0 text-primary mt-0.5" size={16} />
              <p>Submitting this form raises an open resolution ticket instantly visible to Fixiva operations dashboard administrators.</p>
            </div>
          </div>

          {/* Form Side */}
          <div className="lg:col-span-7 bg-white p-8 sm:p-10 rounded-3xl border border-slate-100 shadow-xl shadow-slate-100/50">
            {submitted ? (
              <div className="text-center py-10 space-y-4">
                <div className="w-16 h-16 bg-green-50 text-success rounded-full flex items-center justify-center mx-auto shadow-inner">
                  <CheckCircle size={32} />
                </div>
                <div className="space-y-1">
                  <h3 className="font-extrabold text-slate-900 text-lg">Message Dispatched!</h3>
                  <p className="text-slate-500 text-xs font-semibold">Thanks for connecting. We will reply to your registered email.</p>
                </div>
                <button onClick={() => setSubmitted(false)} className="btn-secondary text-xs px-6 py-2.5 rounded-xl">Send Another Message</button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Full Name</label>
                    <input type="text" name="name" className="w-full h-11 px-4 bg-slate-50 border border-slate-200 focus:border-primary rounded-xl text-xs font-semibold placeholder-slate-400 outline-none" placeholder="John Doe" required />
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Email Address</label>
                    <input type="email" name="email" className="w-full h-11 px-4 bg-slate-50 border border-slate-200 focus:border-primary rounded-xl text-xs font-semibold placeholder-slate-400 outline-none" placeholder="john@example.com" required />
                  </div>
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Subject</label>
                  <input type="text" name="subject" className="w-full h-11 px-4 bg-slate-50 border border-slate-200 focus:border-primary rounded-xl text-xs font-semibold placeholder-slate-400 outline-none" placeholder="How can we help?" required />
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Message Description</label>
                  <textarea name="message" className="w-full p-4 bg-slate-50 border border-slate-200 focus:border-primary rounded-xl text-xs font-semibold placeholder-slate-400 outline-none" rows="4" placeholder="Your message here..." required></textarea>
                </div>

                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full btn-primary text-sm py-3.5 rounded-xl shadow-md flex items-center justify-center gap-1.5"
                >
                  {loading ? <Loader2 className="animate-spin" size={16} /> : 'Send Message'}
                </button>
              </form>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default ContactUs;
