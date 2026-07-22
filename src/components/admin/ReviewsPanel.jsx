import { useState } from 'react';
import { useCms } from '../../context/CmsContext';
import { Star, Trash2, CheckCircle2 } from 'lucide-react';

const ReviewsPanel = () => {
  const { reviews, featureReview, deleteReview, filterItems, paginateItems } = useCms();
  const [search, setSearch] = useState('');
  const [ratingFilter, setRatingFilter] = useState('All');
  const [page, setPage] = useState(1);

  const filtered = filterItems(reviews, search, ['comment', 'userName', 'serviceType']).filter((r) => {
    if (ratingFilter === 'All') return true;
    return String(r.rating) === String(ratingFilter);
  });

  const paginated = paginateItems(filtered, page, 8);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-xl font-black text-slate-900">Customer Reviews & Testimonials</h2>
          <p className="text-sm text-slate-500">Moderate customer ratings and select featured reviews for Customer Homepage.</p>
        </div>
      </div>

      <div className="flex gap-3">
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search reviews by customer name, service type, or comment..."
          className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm font-medium"
        />
        <select
          value={ratingFilter}
          onChange={(e) => { setRatingFilter(e.target.value); setPage(1); }}
          className="h-10 rounded-xl border border-slate-200 px-3 text-sm font-semibold bg-white"
        >
          <option value="All">All Ratings</option>
          <option value="5">5 Stars</option>
          <option value="4">4 Stars</option>
          <option value="3">3 Stars</option>
          <option value="2">2 Stars</option>
          <option value="1">1 Star</option>
        </select>
      </div>

      <div className="space-y-3">
        {paginated.data.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 p-8 text-center text-sm text-slate-500">No customer reviews found.</div>
        ) : (
          paginated.data.map((review) => (
            <div key={review.id} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="flex text-amber-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={14} className={i < (review.rating || 5) ? 'fill-amber-400' : 'text-slate-200'} />
                    ))}
                  </div>
                  <span className="font-bold text-slate-900">{review.userName || 'Customer'}</span>
                  <span className="text-xs text-slate-400">• {review.serviceType || 'Home Service'}</span>
                </div>
                <p className="text-xs text-slate-600 font-medium">{review.comment || 'Great service experience!'}</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => featureReview(review.id, !review.is_featured)}
                  className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${review.is_featured ? 'bg-amber-100 text-amber-700' : 'border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                >
                  {review.is_featured ? 'Featured on Home' : 'Feature on Home'}
                </button>
                <button
                  onClick={() => {
                    if (window.confirm('Remove this review?')) {
                      deleteReview(review.id);
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
          <span className="text-xs text-slate-500 font-semibold">Page {paginated.currentPage} of {paginated.totalPages} ({paginated.total} reviews)</span>
          <div className="flex gap-2">
            <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold disabled:opacity-50">Previous</button>
            <button disabled={page >= paginated.totalPages} onClick={() => setPage((p) => p + 1)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold disabled:opacity-50">Next</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewsPanel;
