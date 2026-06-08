import React, { useState } from 'react';
import { 
  HelpCircle, Book, Shield, XCircle, 
  Mail, CheckCircle, ChevronDown, 
  ChevronUp, Loader2, MapPin, AlertTriangle
} from 'lucide-react';
import { useApp } from '../context/AuthContext';

const HelpCenter = () => {
  const { addTicket } = useApp();
  const [activeFaq, setActiveFaq] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const faqs = [
    { 
      q: "How does the pricing work?", 
      a: "Every service has a Base Price or Inspection Fee. In addition, we charge a fixed Fixora Convenience Fee to handle booking and professional verification. No hidden charges." 
    },
    { 
      q: "Is it safe to book with Fixora?", 
      a: "Yes. Every professional undergoes a strict background check and identity verification. We also monitor their performance via our proprietary Trust Score system." 
    },
    { 
      q: "What if the worker doesn't arrive?", 
      a: "If a worker is a 'No Show', you can report it via your dashboard. We will either assign a new worker immediately or provide a full explanation and reschedule. No-shows are penalized in our trust system." 
    },
    { 
      q: "When do I pay?", 
      a: "Fixora currently operates on a 'Cash on Service' model. You pay the professional directly only after the job is completed to your satisfaction." 
    }
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const ticketData = {
      name: formData.get('name'),
      email: formData.get('email'),
      subject: formData.get('subject'),
      message: formData.get('message'),
    };

    setLoading(true);
    setTimeout(async () => {
      const { error } = await addTicket({ ...ticketData, user_id: undefined });
      setLoading(false);
      if (error) {
        alert('Failed to submit ticket: ' + error.message);
      } else {
        setSubmitted(true);
        e.target.reset();
      }
    }, 1000);
  };

  return (
    <div className="bg-slate-50 min-h-screen">
      {/* Hero Header */}
      <section className="bg-slate-900 py-20 text-center text-white relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="max-w-4xl mx-auto px-4 space-y-4">
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight">Fixora Help Center</h1>
          <p className="text-slate-400 font-medium text-sm sm:text-base max-w-xl mx-auto">
            Find answers to common questions, browse policy guidelines, or raise an operations resolution ticket.
          </p>
        </div>
      </section>

      {/* Main Workspace content */}
      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8 -mt-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* FAQ Accordions & Policy Cards */}
          <div className="lg:col-span-8 space-y-8">
            {/* FAQ Accordions */}
            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
              <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                <HelpCircle className="text-primary" size={20} />
                Frequently Asked Questions
              </h2>

              <div className="space-y-3">
                {faqs.map((faq, idx) => {
                  const active = activeFaq === idx;
                  return (
                    <div 
                      key={idx} 
                      className={`border rounded-2xl overflow-hidden transition-all duration-200 ${
                        active ? 'border-primary bg-blue-50/10' : 'border-slate-100 hover:border-slate-200'
                      }`}
                    >
                      <button 
                        onClick={() => setActiveFaq(active ? null : idx)}
                        className="w-full px-6 py-4 flex justify-between items-center text-left font-bold text-slate-800 text-sm focus:outline-none"
                      >
                        <span>{faq.q}</span>
                        {active ? <ChevronUp size={16} className="text-primary" /> : <ChevronDown size={16} className="text-slate-400" />}
                      </button>
                      <AnimatePresence initial={false}>
                        {active && (
                          <motion.div 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="px-6 pb-4 text-xs font-semibold text-slate-500 leading-relaxed"
                          >
                            {faq.a}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Policy Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { icon: Book, title: 'Booking Guide', desc: 'New to Fixora? Learn how to book in under 2 minutes.' },
                { icon: XCircle, title: 'Cancellations', desc: 'Our cancellation terms, limits and protective safety guidelines.' },
                { icon: Shield, title: 'Identity & Safety', desc: 'How we check background records of worker partners.' }
              ].map((guide, idx) => (
                <div 
                  key={idx}
                  className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all space-y-4"
                >
                  <div className="h-10 w-10 bg-slate-50 text-primary rounded-xl flex items-center justify-center">
                    <guide.icon size={20} />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-extrabold text-slate-900 text-sm leading-tight">{guide.title}</h4>
                    <p className="text-slate-500 text-[11px] font-semibold leading-relaxed">{guide.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Support Ticket Side Desk */}
          <aside className="lg:col-span-4 space-y-6">
            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xl shadow-slate-100/50 space-y-6">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base leading-tight">Submit Help Ticket</h3>
                <p className="text-slate-400 text-[11px] font-semibold mt-1">Need help with a booking? Open an operations ticket.</p>
              </div>

              {submitted ? (
                <div className="text-center py-10 space-y-4 animate-fade-in">
                  <div className="w-16 h-16 bg-green-50 text-success rounded-full flex items-center justify-center mx-auto shadow-inner">
                    <CheckCircle size={32} />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-extrabold text-slate-900 text-sm">Ticket Opened!</h4>
                    <p className="text-[11px] text-slate-500 font-semibold leading-relaxed max-w-[200px] mx-auto">Our support crew will respond via registered email within 24 hours.</p>
                  </div>
                  <button onClick={() => setSubmitted(false)} className="w-full btn-secondary text-xs px-4 py-2 rounded-xl">Open New Ticket</button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Full Name</label>
                    <input className="w-full h-10 px-3 bg-slate-50 border border-slate-200 focus:border-primary rounded-xl text-xs font-semibold placeholder-slate-400 outline-none" name="name" type="text" required placeholder="John Doe" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Email Address</label>
                    <input className="w-full h-10 px-3 bg-slate-50 border border-slate-200 focus:border-primary rounded-xl text-xs font-semibold placeholder-slate-400 outline-none" name="email" type="email" required placeholder="john@email.com" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Inquiry Category</label>
                    <select className="w-full h-10 px-3 bg-slate-50 border border-slate-200 focus:border-primary rounded-xl text-xs font-bold text-slate-700 outline-none cursor-pointer" name="subject" required>
                      <option value="">Select Topic</option>
                      <option value="Issue with professional">Professional Problem</option>
                      <option value="Booking Cancellation">Booking/Cancellation</option>
                      <option value="Payment Inquiry">Payment Question</option>
                      <option value="Partner Application">Partner Support</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Detailed Message</label>
                    <textarea className="w-full p-3 bg-slate-50 border border-slate-200 focus:border-primary rounded-xl text-xs font-semibold placeholder-slate-400 outline-none" name="message" rows="3" required placeholder="Describe your issue..."></textarea>
                  </div>
                  <button type="submit" className="w-full btn-primary text-xs py-3 rounded-xl shadow-md flex items-center justify-center gap-1.5" disabled={loading}>
                    {loading ? <Loader2 className="animate-spin" size={14} /> : 'Open Support Ticket'}
                  </button>
                </form>
              )}

              <div className="border-t border-slate-100 pt-6 space-y-3 text-slate-500 font-semibold text-xs">
                <div className="flex items-center gap-2">
                  <Mail size={16} className="text-primary shrink-0" />
                  <a href="mailto:sinhadev739@gmail.com" className="hover:text-primary transition-all text-xs break-all">sinhadev739@gmail.com</a>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin size={16} className="text-primary shrink-0" />
                  <span>Deoghar, Jharkhand, India</span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-amber-50/50 text-warning border border-amber-100/50 rounded-2xl flex gap-2.5 items-start text-[10px] leading-relaxed font-semibold">
              <AlertTriangle className="shrink-0 mt-0.5" size={16} />
              <p>For urgent inquiries concerning existing dispatches, please include your generated Booking ID (e.g. BK-123456) in the message details.</p>
            </div>
          </aside>
          
        </div>
      </div>
    </div>
  );
};

export default HelpCenter;
