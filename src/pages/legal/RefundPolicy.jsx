
const RefundPolicy = () => {
  return (
    <div className="legal-page container animate-fade-in py-16">
      <h1 className="text-4xl font-black mb-4">Refund & Cancellation Policy</h1>
      <p className="text-gray-500 mb-8">Transparent and fair policies for customers and professionals.</p>

      <div className="legal-content space-y-8 text-gray-700 leading-relaxed">
        <section>
          <h2 className="text-2xl font-bold mb-3 text-gray-900">1. Cash on Service Policy</h2>
          <p>FIXIVA currently operates exclusively on a <strong>Cash on Service</strong> model. This means you do not pay anything upfront through our platform. Payment is made directly to the professional in cash only after the requested service is completed to your satisfaction.</p>
          <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 mt-4">
            <p className="text-sm font-bold text-orange-700 uppercase tracking-widest">Note: Digital payments coming soon.</p>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-3 text-gray-900">2. Booking Cancellation Rules</h2>
          <p>We understand that plans change. If you need to cancel a service, please do so via your Customer Dashboard as early as possible so that our professionals can reorganize their schedules.</p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-3 text-gray-900">3. Customer Cancellation Policy</h2>
          <ul className="list-disc pl-6 space-y-2 mt-2">
            <li><strong>Free Cancellations:</strong> You may cancel a booking without any penalty up to 2 hours prior to the scheduled arrival time.</li>
            <li><strong>Late Cancellations:</strong> While we currently do not charge cancellation fees (due to our Cash on Service model), frequent late cancellations will be logged. Excessive late cancellations may result in account suspension.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-3 text-gray-900">4. Worker Cancellation Policy</h2>
          <p>If an assigned worker needs to cancel due to an emergency, they are required to notify you and the platform immediately. In such events, FIXIVA will automatically attempt to match you with another verified professional in your area for the same time slot.</p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-3 text-gray-900">5. No-Show Policy</h2>
          <p><strong>Customer No-Show:</strong> If the professional arrives at the location and you are unreachable or not present, the professional will wait for 15 minutes before marking the booking as a "Customer No-Show". This severely impacts your account standing.</p>
          <p className="mt-2"><strong>Worker No-Show:</strong> If a professional fails to arrive within the scheduled window without prior communication, you can report a "Worker No-Show". This directly impacts the worker's Trust Score and can lead to their removal from the platform.</p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-3 text-gray-900">6. Support Escalation Process</h2>
          <p>Since payments are handled directly in cash, refunds in the traditional sense do not apply. However, if you are unsatisfied with the service provided or if there is a dispute regarding the agreed-upon price:</p>
          <ol className="list-decimal pl-6 space-y-2 mt-2">
            <li>Do not pay the professional if the job is incomplete or unsatisfactory.</li>
            <li>Immediately open a Support Ticket from your Dashboard or the Help Center.</li>
            <li>Provide clear details and photographic evidence if applicable.</li>
            <li>Our Support Team will mediate the dispute between you and the professional.</li>
          </ol>
        </section>
      </div>
    </div>
  );
};

export default RefundPolicy;
