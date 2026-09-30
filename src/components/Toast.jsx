import { useEffect, useState } from 'react';

const Toast = ({ toast, onClose }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose(toast.id);
    };
    window.addEventListener('keydown', handleKey);
    // mount animation
    const t = setTimeout(() => setVisible(true), 20);
    return () => {
      clearTimeout(t);
      window.removeEventListener('keydown', handleKey);
    };
  }, [toast, onClose]);

  return (
    <div
      role="status"
      aria-live="polite"
      className={`pointer-events-auto max-w-xs w-full px-4 py-3 rounded-lg shadow-md text-sm font-semibold transform transition-all duration-300 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'} ${toast.type === 'success' ? 'bg-green-600 text-white' : toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-slate-800 text-white'}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="truncate">{toast.message}</div>
        <button onClick={() => onClose(toast.id)} className="ml-3 text-white opacity-90 hover:opacity-100">✕</button>
      </div>
    </div>
  );
};

export default Toast;
