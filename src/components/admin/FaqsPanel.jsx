import { useState } from 'react';
import { useCms } from '../../context/CmsContext';
import { HelpCircle, Edit2, Trash2 } from 'lucide-react';

const FaqsPanel = () => {
  const {
    faqs,
    createFaq,
    updateFaq,
    deleteFaq,
    filterItems,
    paginateItems,
    showToast,
  } = useCms();

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [editingFaq, setEditingFaq] = useState(null);
  const [form, setForm] = useState({
    question: '',
    answer: '',
    category: 'General',
    display_order: 0,
    active: true,
  });

  const filtered = filterItems(faqs, search, ['question', 'answer', 'category']);
  const paginated = paginateItems(filtered, page, 6);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.question.trim() || !form.answer.trim()) {
      showToast('Both question and answer are required.', 'error');
      return;
    }

    if (editingFaq) {
      await updateFaq(editingFaq.id, form);
      setEditingFaq(null);
    } else {
      await createFaq(form);
    }

    setForm({ question: '', answer: '', category: 'General', display_order: 0, active: true });
  };

  const handleEdit = (faq) => {
    setEditingFaq(faq);
    setForm({
      question: faq.question || '',
      answer: faq.answer || '',
      category: faq.category || 'General',
      display_order: faq.display_order || 0,
      active: faq.active !== false,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-xl font-black text-slate-900">Help Center FAQs Management</h2>
          <p className="text-sm text-slate-500">Manage questions and answers displayed in Customer Help Center.</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4">
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search FAQs by question or answer..."
            className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm font-medium"
          />

          <div className="space-y-3">
            {paginated.data.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 p-8 text-center text-sm text-slate-500">No FAQs found.</div>
            ) : (
              paginated.data.map((faq) => (
                <div key={faq.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <HelpCircle size={18} className="text-primary" />
                      <span className="font-bold text-slate-900">{faq.question}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleEdit(faq)} className="rounded-xl border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-50">
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm('Delete this FAQ entry?')) {
                            deleteFaq(faq.id);
                          }
                        }}
                        className="rounded-xl bg-red-50 p-2 text-red-600 hover:bg-red-100"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl">{faq.answer}</p>
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
            {editingFaq ? 'Edit FAQ' : 'Add New FAQ Entry'}
          </h3>

          <div>
            <label className="text-xs font-bold text-slate-600">Question</label>
            <input
              type="text"
              value={form.question}
              onChange={(e) => setForm({ ...form, question: e.target.value })}
              placeholder="e.g. How does cash on service work?"
              className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm font-semibold"
              required
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-600">Answer</label>
            <textarea
              value={form.answer}
              onChange={(e) => setForm({ ...form, answer: e.target.value })}
              placeholder="Detailed answer text..."
              rows={4}
              className="mt-1 w-full rounded-xl border border-slate-200 p-3 text-sm font-semibold"
              required
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-600">Category</label>
            <input
              type="text"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              placeholder="e.g. Payments, Booking, Safety"
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
              Active FAQ
            </label>

            <div className="flex gap-2">
              {editingFaq && (
                <button
                  type="button"
                  onClick={() => { setEditingFaq(null); setForm({ question: '', answer: '', category: 'General', display_order: 0, active: true }); }}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600"
                >
                  Cancel
                </button>
              )}
              <button type="submit" className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white shadow-sm">
                {editingFaq ? 'Update FAQ' : 'Add FAQ Entry'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FaqsPanel;
