import React from 'react';

const TermsAndConditions = () => {
  return (
    <div className="legal-page container animate-fade-in py-16">
      <h1 className="text-4xl font-black mb-4">Terms & Conditions</h1>
      <p className="text-gray-500 mb-8">Welcome to FIXORA - One App. Every Solution. Everything Your Home Needs.</p>
      
      <div className="legal-content space-y-8 text-gray-700 leading-relaxed">
        <section>
          <h2 className="text-2xl font-bold mb-3 text-gray-900">1. User Responsibilities</h2>
          <p>As a user of the FIXORA platform, you agree to provide accurate information when booking a service or creating an account. You must ensure a safe and respectful environment for professionals who arrive at your premises. Any harassment, abuse, or unsafe conditions will result in immediate account suspension.</p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-3 text-gray-900">2. Worker Responsibilities</h2>
          <p>Verified workers agree to maintain the highest standards of professionalism. Workers must arrive on time, complete the agreed-upon tasks to the best of their ability, and communicate any issues promptly. Misrepresentation of skills or frequent no-shows will negatively impact your Trust Score and may result in platform removal.</p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-3 text-gray-900">3. Contractor Responsibilities</h2>
          <p>Contractors operating through FIXORA must hold any necessary local licenses or permits required for large-scale jobs. Contractors are fully responsible for their crew's conduct and safety on the job site. Quality of work and customer satisfaction are paramount.</p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-3 text-gray-900">4. Booking Terms</h2>
          <p>By placing a booking through our platform, you agree to the Base Price and Fixora Convenience Fee shown at checkout. Additional parts, materials, or expanded scope of work discussed on-site will incur extra charges agreed upon directly with the professional.</p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-3 text-gray-900">5. Cancellation Rules</h2>
          <p>Customers may cancel a booking without penalty up to 2 hours before the scheduled arrival time. Repeated cancellations may lead to temporary account restrictions to ensure fair scheduling for our professionals.</p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-3 text-gray-900">6. Service Availability Disclaimer</h2>
          <p>FIXORA currently operates in select cities. We do not guarantee the availability of all services in all regions at all times. Service fulfillment is subject to the availability of verified professionals in your local area.</p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-3 text-gray-900">7. Platform Liability Disclaimer</h2>
          <p>FIXORA acts solely as a marketplace connecting customers with independent professionals. While we thoroughly verify our partners, FIXORA is not liable for any direct, indirect, or consequential damages, losses, or injuries arising from the execution of services.</p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-3 text-gray-900">8. Cash-on-Service Policy</h2>
          <p>All payments are strictly Cash-on-Service. Customers are expected to pay the professional directly in cash immediately upon satisfactory completion of the job. Digital payments are coming soon.</p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-3 text-gray-900">9. Account Suspension Policy</h2>
          <p>FIXORA reserves the right to suspend or terminate accounts (Customer, Worker, or Contractor) without prior notice if they violate these Terms and Conditions, receive consistently poor Trust Scores, or engage in fraudulent activities.</p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-3 text-gray-900">10. Fraud Prevention Policy</h2>
          <p>Any attempts to bypass the platform (e.g., booking a worker offline to avoid platform fees) or submit fraudulent reviews will be met with permanent bans for both the customer and the professional involved.</p>
        </section>
      </div>
    </div>
  );
};

export default TermsAndConditions;
