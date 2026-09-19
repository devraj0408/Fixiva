import { FileCheck, Users, HardHat, Building2, Calendar, Ban, ShieldAlert, DollarSign, AlertOctagon, Mail, MapPin } from 'lucide-react';

const TermsAndConditions = () => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      {/* Page Header */}
      <div className="bg-slate-900 text-white py-16 px-4 sm:px-6 lg:px-8 border-b border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-4xl mx-auto space-y-4 relative z-10 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-800 text-emerald-400 text-xs font-extrabold uppercase tracking-wider border border-slate-700">
            <FileCheck size={14} /> Platform Guidelines
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white">Terms & Conditions</h1>
          <p className="text-xs sm:text-sm font-medium text-slate-400">
            Welcome to FIXIVA — One App. Every Solution. Everything Your Home Needs.
          </p>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8 space-y-8">
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-10 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-8">
          
          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
              <Users className="text-primary dark:text-emerald-400 shrink-0" size={22} />
              1. User Responsibilities
            </h2>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-300 leading-relaxed">
              As a user of the FIXIVA platform, you agree to provide accurate location and contact information when booking a service or creating an account. You must ensure a safe and respectful environment for professionals arriving at your premises. Any harassment, abuse, or unsafe conditions will result in immediate account suspension.
            </p>
          </section>

          <hr className="border-slate-100 dark:border-slate-800" />

          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
              <HardHat className="text-primary dark:text-emerald-400 shrink-0" size={22} />
              2. Worker Responsibilities
            </h2>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-300 leading-relaxed">
              Verified workers agree to maintain the highest standards of professionalism and integrity. Workers must arrive on time, perform the agreed-upon tasks expertly, and communicate any job scope issues promptly. Misrepresentation of credentials or unexcused no-shows will reduce Trust Scores and trigger account deactivation.
            </p>
          </section>

          <hr className="border-slate-100 dark:border-slate-800" />

          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
              <Building2 className="text-primary dark:text-emerald-400 shrink-0" size={22} />
              3. Contractor Responsibilities
            </h2>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-300 leading-relaxed">
              Contractors operating through FIXIVA must hold all necessary local licenses and GST credentials required for large-scale renovation or trade projects. Contractors are fully responsible for crew safety, conduct, and craftsmanship quality on site.
            </p>
          </section>

          <hr className="border-slate-100 dark:border-slate-800" />

          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
              <Calendar className="text-primary dark:text-emerald-400 shrink-0" size={22} />
              4. Booking & Pricing Terms
            </h2>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-300 leading-relaxed">
              By placing a booking, you agree to the Base Inspection Fee and Fixiva Convenience Fee shown during checkout. Additional parts, materials, or expanded work scope requested on-site will incur extra costs agreed upon directly with the professional before execution.
            </p>
          </section>

          <hr className="border-slate-100 dark:border-slate-800" />

          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
              <DollarSign className="text-primary dark:text-emerald-400 shrink-0" size={22} />
              5. Cash-on-Service Settlement
            </h2>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-300 leading-relaxed">
              All platform bookings operate strictly on a Cash-on-Service basis. Customers are expected to pay the professional directly in cash immediately after inspecting and approving the completed work.
            </p>
          </section>

          <hr className="border-slate-100 dark:border-slate-800" />

          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
              <ShieldAlert className="text-primary dark:text-emerald-400 shrink-0" size={22} />
              6. Platform Liability Disclaimer
            </h2>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-300 leading-relaxed">
              FIXIVA operates as a digital marketplace connecting consumers with independent professionals. While we thoroughly verify partners through background checks, FIXIVA is not liable for direct or indirect losses, damages, or injuries arising from service execution on premises.
            </p>
          </section>

          <hr className="border-slate-100 dark:border-slate-800" />

          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
              <Ban className="text-primary dark:text-emerald-400 shrink-0" size={22} />
              7. Account Suspension Policy
            </h2>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-300 leading-relaxed">
              FIXIVA reserves the right to suspend or terminate any user, worker, or contractor account without prior notice if they violate these Terms, receive low trust ratings, or engage in fraudulent activities.
            </p>
          </section>

          <hr className="border-slate-100 dark:border-slate-800" />

          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
              <AlertOctagon className="text-primary dark:text-emerald-400 shrink-0" size={22} />
              8. Anti-Bypassing & Fraud Prevention
            </h2>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-300 leading-relaxed">
              Any attempt to bypass the platform (e.g. soliciting workers offline to avoid platform logging) or submitting fake reviews will result in immediate permanent bans for both customer and worker accounts involved.
            </p>
          </section>

          {/* Contact Card */}
          <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 space-y-3">
            <h3 className="text-base font-black text-slate-900 dark:text-white">Questions about our Terms?</h3>
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              For any legal or operational inquiries, please contact our legal desk:
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

export default TermsAndConditions;
