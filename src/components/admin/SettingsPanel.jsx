const SettingsPanel = () => (
  <div className="space-y-5">
    <div className="flex items-center justify-between border-b border-slate-100 pb-4">
      <div>
        <h2 className="text-xl font-black text-slate-900">Settings</h2>
        <p className="text-sm text-slate-500">Core platform settings and profile controls.</p>
      </div>
    </div>

    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
      Settings controls are kept lightweight and operational for production. You can extend them later without changing the existing app flow.
    </div>
  </div>
);

export default SettingsPanel;
