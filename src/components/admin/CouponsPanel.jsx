
import { useState } from 'react';
import { useCms } from '../../context/CmsContext';
import { Ticket, Edit2, Trash2 } from 'lucide-react';

const CouponsPanel = () => {
  const {
    coupons,
    createCoupon,
    updateCoupon,
    deleteCoupon,
    filterItems,
    paginateItems,
    showToast,
  } = useCms();

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [form, setForm] = useState({
    code: '',
    discount_value: '',
    discount_type: 'flat',
    min_order_amount: '',
    max_discount: '',
    active: true,
  });

  const filtered = filterItems(coupons, search, ['code', 'discount_type']);
  const paginated = paginateItems(filtered, page, 6);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.code.trim()) {
      showToast('Coupon code is required.', 'error');
      return;
    }

    if (editingCoupon) {
      await updateCoupon(editingCoupon.id, form);
      setEditingCoupon(null);
    } else {
      await createCoupon(form);
    }

    setForm({ code: '', discount_value: '', discount_type: 'flat', min_order_amount: '', max_discount: '', active: true });
  };

  const handleEdit = (coupon) => {
    setEditingCoupon(coupon);
    setForm({
      code: coupon.code || '',
      discount_value: coupon.discount_value || 0,
      discount_type: coupon.discount_type || 'flat',
      min_order_amount: coupon.min_order_amount || 0,
      max_discount: coupon.max_discount || 0,
      active: coupon.active !== false,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-xl font-black text-slate-900">Coupons & Promo Codes</h2>
          <p className="text-sm text-slate-500">Configure promotional codes, flat/percentage discounts, and order thresholds.</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4">
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search coupons by promo code..."
            className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm font-medium"
          />

          <div className="space-y-3">
            {paginated.data.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 p-8 text-center text-sm text-slate-500">No promo codes configured.</div>
            ) : (
              paginated.data.map((coupon) => (
                <div key={coupon.id} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary font-black text-xs">
                      <Ticket size={20} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold tracking-wider text-slate-900 uppercase">{coupon.code}</span>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase ${coupon.active !== false ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                          {coupon.active !== false ? 'Active' : 'Disabled'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">
                        {coupon.discount_type === 'percentage' ? `${coupon.discount_value}% OFF` : `Flat ₹${coupon.discount_value} OFF`} • Min Order: ₹{coupon.min_order_amount || 0}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button onClick={() => handleEdit(coupon)} className="rounded-xl border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-50">
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm(`Delete promo code "${coupon.code}"?`)) {
                          deleteCoupon(coupon.id);
                        }
                      }}
                      className="rounded-xl bg-red-50 p-2 text-red-600 hover:bg-red-100"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {paginated.totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-slate-500 font-semibold">Page {paginated.currentPage} of {paginated.totalPages}</span>
              <div className="flex gap-2">
                <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold disabled:opacity-50">Previous</button>
                <button disabled={page >= paginated.totalPages} onClick={() => setPage((p) => p + 1)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold disabled:opacity-50">Next</button>
              </div>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5 space-y-4">
          <h3 className="text-sm font-black uppercase tracking-wider text-slate-500">
            {editingCoupon ? 'Edit Promo Code' : 'Create New Coupon'}
          </h3>

          <div>
            <label className="text-xs font-bold text-slate-600">Promo Code</label>
            <input
              type="text"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
              placeholder="e.g. FIXIVA100"
              className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm font-black tracking-wider uppercase"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-600">Discount Type</label>
              <select
                value={form.discount_type}
                onChange={(e) => setForm({ ...form, discount_type: e.target.value })}
                className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm font-semibold bg-white"
              >
                <option value="flat">Flat Amount (₹)</option>
                <option value="percentage">Percentage (%)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-600">Discount Value</label>
              <input
                type="number"
                value={form.discount_value}
                onChange={(e) => setForm({ ...form, discount_value: e.target.value })}
                placeholder="100"
                className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm font-semibold"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-600">Minimum Order Amount (₹)</label>
            <input
              type="number"
              value={form.min_order_amount}
              onChange={(e) => setForm({ ...form, min_order_amount: e.target.value })}
              placeholder="499"
              className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm font-semibold"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <label className="flex items-center gap-2 text-xs font-bold text-slate-700">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => setForm({ ...form, active: e.target.checked })}
                className="h-4 w-4 rounded border-slate-300 text-primary"
              />
              Active Coupon
            </label>

            <div className="flex gap-2">
              {editingCoupon && (
                <button
                  type="button"
                  onClick={() => { setEditingCoupon(null); setForm({ code: '', discount_value: '', discount_type: 'flat', min_order_amount: '', max_discount: '', active: true }); }}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600"
                >
                  Cancel
                </button>
              )}
              <button type="submit" className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white shadow-sm">
                {editingCoupon ? 'Update Coupon' : 'Create Coupon'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CouponsPanel;
