
const PrivacyPolicy = () => {
  return (
    <div className="legal-page container animate-fade-in py-16">
      <h1 className="text-4xl font-black mb-4">Privacy Policy</h1>
      <p className="text-gray-500 mb-8">Effective Date: {new Date().toLocaleDateString()}</p>

      <div className="legal-content space-y-8 text-gray-700 leading-relaxed">
        <section>
          <h2 className="text-2xl font-bold mb-3 text-gray-900">1. Data Collection</h2>
          <p>When you register or book a service on FIXIVA, we collect the following personal information to facilitate the service:</p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li><strong>Name:</strong> To identify you on the platform and to professionals.</li>
            <li><strong>Email:</strong> For account authentication, booking updates, and support.</li>
            <li><strong>Phone:</strong> For direct contact regarding your active bookings (if provided).</li>
            <li><strong>Address:</strong> To direct our professionals to the correct service location.</li>
            <li><strong>Booking Information:</strong> Service details, preferred dates, and service history.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-3 text-gray-900">2. How Data is Stored</h2>
          <p>All personal data is securely stored using Supabase (PostgreSQL). We utilize robust Row Level Security (RLS) policies to ensure that your data is only accessible to you, the assigned professional, and authorized FIXIVA administrators.</p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-3 text-gray-900">3. How Data is Used</h2>
          <p>Your data is exclusively used to provide, maintain, and improve our services. This includes matching you with the right professionals, sending important service notifications, and addressing support tickets. We do not sell your personal data to advertisers.</p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-3 text-gray-900">4. Security Measures</h2>
          <p>We employ industry-standard security measures including data encryption in transit and at rest. Access to backend databases is strictly restricted. User authentication is handled securely via Supabase Auth protocols.</p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-3 text-gray-900">5. Third-Party Integrations</h2>
          <p>FIXIVA relies on third-party infrastructure providers like Vercel (Hosting) and Supabase (Database/Authentication). These providers maintain strict compliance with global data protection laws. We do not share your data with other third parties without your explicit consent.</p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-3 text-gray-900">6. User Rights</h2>
          <p>You have the right to request access to the personal data we hold about you. You may also request corrections to inaccurate data or ask for the deletion of your account and associated data by contacting our support team.</p>
        </section>

        <section className="bg-gray-50 p-6 rounded-2xl border border-gray-100 mt-12">
          <h2 className="text-xl font-bold mb-3 text-gray-900">Contact Us</h2>
          <p>If you have any questions or concerns regarding this Privacy Policy, please reach out to us:</p>
          <ul className="mt-2 font-medium">
            <li>Email: <a href="mailto:sinhadev739@gmail.com" className="text-royal-blue">sinhadev739@gmail.com</a></li>
            <li>Location: Deoghar, Jharkhand, India</li>
          </ul>
        </section>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
