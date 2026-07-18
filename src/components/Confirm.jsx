import { useEffect, useRef } from 'react';

const Confirm = ({ open, title = 'Confirm', message = '', onClose }) => {
  const cancelRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const previousActive = document.activeElement;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose(false);
      if (e.key === 'Enter') onClose(true);
    };
    window.addEventListener('keydown', onKey);
    // focus cancel button for keyboard users
    setTimeout(() => cancelRef.current?.focus(), 0);
    return () => {
      window.removeEventListener('keydown', onKey);
      previousActive?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
      <div className="absolute inset-0 bg-black/40" onClick={() => onClose(false)} />
      <div className="relative bg-white rounded-2xl shadow-xl p-6 max-w-lg w-full mx-4 transform transition-all duration-150 scale-100">
        <h3 id="confirm-title" className="text-lg font-bold mb-2">{title}</h3>
        <p className="text-sm text-slate-700 mb-4">{message}</p>
        <div className="flex justify-end gap-3">
          <button ref={cancelRef} className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700" onClick={() => onClose(false)}>Cancel</button>
          <button className="px-4 py-2 rounded-xl bg-primary text-white" onClick={() => onClose(true)}>Yes</button>
        </div>
      </div>
    </div>
  );
};

export default Confirm;
