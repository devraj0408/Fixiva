import { Banknote, ShieldAlert, CalendarX, UserX, AlertTriangle, HelpCircle, Mail, MapPin } from 'lucide-react';

const RefundPolicy = () => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      {/* Page Header */}
      <div className="bg-slate-900 text-white py-16 px-4 sm:px-6 lg:px-8 border-b border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-4xl mx-auto space-y-4 relative z-10 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-800 text-emerald-400 text-xs font-extrabold uppercase tracking-wider border border-slate-700">
            <Banknote size={14} /> Settlement Terms
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white">Refund & Cancellation Policy</h1>
          <p className="text-xs sm:text-sm font-medium text-slate-400">
            Transparent, fair, and clear guidelines for customers and verified professionals.
          </p>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8 space-y-8">
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-10 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-8">
          
          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
              <Banknote className="text-primary dark:text-emerald-400 shrink-0" size={22} />
              1. Cash on Service Policy
            </h2>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-300 leading-relaxed">
              FIXIVA currently operates on a direct <strong>Cash on Service</strong> model. You pay nothing upfront through our website or app. Payment is made directly to the assigned professional in cash only after the requested work is fully completed to your satisfaction.
            </p>
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 flex items-center gap-3">
              <AlertTriangle className="text-amber-600 dark:text-amber-400 shrink-0" size={18} />
              <p className="text-xs font-bold text-amber-900 dark:text-amber-300">
                Note: Online digital payments and wallet settlements are coming soon to the platform.
              </p>
            </div>
          </section>

          <hr className="border-slate-100 dark:border-slate-800" />

          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
              <CalendarX className="text-primary dark:text-emerald-400 shrink-0" size={22} />
              2. Customer Cancellation Policy
            </h2>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-300 leading-relaxed">
              We understand plans change. You can cancel a booking directly from your Customer Dashboard:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60 space-y-1">
                <span className="text-xs font-black text-emerald-950 dark:text-emerald-300 block">Free Cancellations</span>
                <span className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-400 leading-relaxed block">
                  You may cancel a booking without any penalty up to 2 hours prior to the scheduled arrival time.
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 space-y-1">
                <span className="text-xs font-black text-slate-900 dark:text-white block">Late Cancellations</span>
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 leading-relaxed block">
                  While no upfront fee is charged, frequent late cancellations will be logged and may restrict future bookings.
                </span>
              </div>
            </div>
          </section>

          <hr className="border-slate-100 dark:border-slate-800" />

          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
              <UserX className="text-primary dark:text-emerald-400 shrink-0" size={22} />
              3. Worker Cancellation Policy
            </h2>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-300 leading-relaxed">
              If an assigned worker needs to cancel due to an unexpected emergency, they must notify the platform immediately. In such events, FIXIVA automatically dispatches another available verified professional in your area for the same timeslot.
            </p>
          </section>

          <hr className="border-slate-100 dark:border-slate-800" />

          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
              <ShieldAlert className="text-primary dark:text-emerald-400 shrink-0" size={22} />
              4. No-Show Policy
            </h2>
            <div className="space-y-3 pt-1">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 space-y-1">
                <span className="text-xs font-black text-slate-900 dark:text-white block">Customer No-Show</span>
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 leading-relaxed block">
                  If the professional arrives at your location and you are unreachable or not present, the professional will wait for 15 minutes before marking the booking as "Customer No-Show".
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 space-y-1">
                <span className="text-xs font-black text-slate-900 dark:text-white block">Worker No-Show</span>
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 leading-relaxed block">
                  If a professional fails to arrive within the scheduled window without prior communication, you can report a "Worker No-Show". This directly reduces the worker's Trust Score and may lead to platform removal.
                </span>
              </div>
            </div>
          </section>

          <hr className="border-slate-100 dark:border-slate-800" />

          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
              <HelpCircle className="text-primary dark:text-emerald-400 shrink-0" size={22} />
              5. Support Escalation & Dispute Process
            </h2>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-300 leading-relaxed">
              Because payments are settled directly in cash on-site, traditional online refunds do not apply. However, if you are unsatisfied with the craftsmanship or if a pricing dispute arises:
            </p>
            <ol className="list-decimal pl-6 space-y-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
              <li>Do not pay the professional if the job is incomplete or unsatisfactory.</li>
              <li>Immediately open a Support Ticket from your Dashboard or Help Center.</li>
              <li>Provide details and photo evidence of the service issue.</li>
              <li>Our Operations Team will review and resolve the dispute directly.</li>
            </ol>
          </section>

          {/* Contact Card */}
          <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 space-y-3">
            <h3 className="text-base font-black text-slate-900 dark:text-white">Need Support with a Booking?</h3>
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              Reach out to our operations team for any booking or cancellation inquiries:
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

export default RefundPolicy;
