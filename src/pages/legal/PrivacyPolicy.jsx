import { Shield, Lock, Eye, FileText, Server, UserCheck, Mail, MapPin } from 'lucide-react';

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      {/* Page Header */}
      <div className="bg-slate-900 text-white py-16 px-4 sm:px-6 lg:px-8 border-b border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-4xl mx-auto space-y-4 relative z-10 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-800 text-emerald-400 text-xs font-extrabold uppercase tracking-wider border border-slate-700">
            <Shield size={14} /> Legal Documentation
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white">Privacy Policy</h1>
          <p className="text-xs sm:text-sm font-medium text-slate-400">
            Effective Date: {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'numeric', year: 'numeric' })} • FIXIVA Trust & Safety
          </p>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8 space-y-8">
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-10 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-8">
          
          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
              <Eye className="text-primary dark:text-emerald-400 shrink-0" size={22} />
              1. Data Collection
            </h2>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-300 leading-relaxed">
              When you register or book a service on FIXIVA, we collect the following personal information to facilitate seamless operations and verified professional dispatches:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {[
                { title: 'Full Name', desc: 'To identify you on the platform and to verified service professionals.' },
                { title: 'Email Address', desc: 'For account authentication, booking updates, and customer support.' },
                { title: 'Mobile Number', desc: 'For direct contact regarding active dispatches and SMS alerts.' },
                { title: 'Service Location', desc: 'To direct our professionals to the correct doorstep address.' },
                { title: 'Booking Details', desc: 'Service selections, preferred timeslots, and job history logs.' }
              ].map((item, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700/60 space-y-1">
                  <span className="text-xs font-black text-slate-900 dark:text-white block">{item.title}</span>
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 leading-relaxed block">{item.desc}</span>
                </div>
              ))}
            </div>
          </section>

          <hr className="border-slate-100 dark:border-slate-800" />

          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
              <Server className="text-primary dark:text-emerald-400 shrink-0" size={22} />
              2. How Data is Stored
            </h2>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-300 leading-relaxed">
              All personal data is securely stored using enterprise PostgreSQL infrastructure powered by Supabase. We utilize strict Row Level Security (RLS) policies to ensure that your private data is accessible only to you, your assigned professional, and authorized FIXIVA administrators.
            </p>
          </section>

          <hr className="border-slate-100 dark:border-slate-800" />

          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
              <FileText className="text-primary dark:text-emerald-400 shrink-0" size={22} />
              3. How Data is Used
            </h2>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-300 leading-relaxed">
              Your data is exclusively used to provide, maintain, and improve our services. This includes matching you with local verified professionals, dispatching real-time job updates, and mediating support tickets. We never sell your personal data to third-party advertisers.
            </p>
          </section>

          <hr className="border-slate-100 dark:border-slate-800" />

          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
              <Lock className="text-primary dark:text-emerald-400 shrink-0" size={22} />
              4. Security Measures
            </h2>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-300 leading-relaxed">
              We employ industry-standard security measures including data encryption in transit (TLS 1.3) and at rest. Direct backend database access is strictly restricted. User identity authentication is secured via Supabase Auth email OTP protocols.
            </p>
          </section>

          <hr className="border-slate-100 dark:border-slate-800" />

          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
              <UserCheck className="text-primary dark:text-emerald-400 shrink-0" size={22} />
              5. User Rights
            </h2>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-300 leading-relaxed">
              You have the right to request access to the personal data we hold about you. You may also request corrections to inaccurate records or request account and data deletion by reaching out to our support team.
            </p>
          </section>

          {/* Contact Us Card */}
          <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 space-y-3">
            <h3 className="text-base font-black text-slate-900 dark:text-white">Contact Us</h3>
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              If you have any questions or concerns regarding this Privacy Policy, please reach out to us:
            </p>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pt-1 text-xs font-bold text-slate-800 dark:text-slate-200">
              <div className="flex items-center gap-2">
                <Mail size={16} className="text-primary dark:text-emerald-400" />
                <a href="mailto:fixiva869@gmail.com" className="hover:underline text-primary dark:text-emerald-400">
                  fixiva869@gmail.com
                </a>
              </div>
              <div className="flex items-center gap-2">
                <MapPin size={16} className="text-primary dark:text-emerald-400" />
                <span>Deoghar, Jharkhand, India</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
