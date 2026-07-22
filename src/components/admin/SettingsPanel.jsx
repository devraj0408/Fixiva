import { useState } from 'react';
import { useCms } from '../../context/CmsContext';
import { Settings, ShieldCheck, ToggleLeft, Save } from 'lucide-react';

const SettingsPanel = () => {
  const { settings, updateSettings, showToast } = useCms();
  const [form, setForm] = useState(settings || {});

  const handleToggle = (key) => {
    const updated = { ...form, [key]: !form[key] };
    setForm(updated);
    updateSettings(updated);
  };

  const featureFlags = [
    { key: 'maintenanceMode', label: 'Maintenance Mode', desc: 'Temporarily pause new customer booking creation.' },
    { key: 'enableCoupons', label: 'Enable Coupons', desc: 'Allow customers to apply promo codes at checkout.' },
    { key: 'enableOffers', label: 'Enable Offers', desc: 'Show promotional offer badges across home and services catalog.' },
    { key: 'enableReviews', label: 'Enable Customer Reviews', desc: 'Display customer ratings and testimonials.' },
    { key: 'enableOnlinePayments', label: 'Enable Online Payments', desc: 'Enable UPI / Card online payment gateway.' },
    { key: 'enableCashPayments', label: 'Enable Cash Payments', desc: 'Allow Cash on Service payment model.' },
    { key: 'enableWorkerLiveTracking', label: 'Worker Live Tracking', desc: 'Enable GPS location tracking for assigned workers.' },
    { key: 'emergencyBookingEnabled', label: 'Emergency Booking Dispatch', desc: 'Enable 24/7 express worker routing for home emergencies.' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-xl font-black text-slate-900">System Configuration & Feature Flags</h2>
          <p className="text-sm text-slate-500">Configure global platform behavior, payment models, and feature toggles.</p>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-black uppercase tracking-wider text-slate-500">Platform Feature Toggles</h3>

        <div className="grid gap-4 md:grid-cols-2">
          {featureFlags.map(({ key, label, desc }) => {
            const isEnabled = form[key] !== false;
            return (
              <div key={key} className="flex items-start justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="space-y-1">
                  <span className="font-bold text-slate-900 text-sm">{label}</span>
                  <p className="text-xs text-slate-500">{desc}</p>
                </div>

                <button
                  type="button"
                  onClick={() => handleToggle(key)}
                  className={`rounded-full px-3 py-1 text-xs font-black uppercase transition-all ${isEnabled ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}
                >
                  {isEnabled ? 'ENABLED' : 'DISABLED'}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;
