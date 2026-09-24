Toast & Confirm usage

- `showToast(message, type = 'info')`
  - Available via `useToast()` from `src/context/ToastContext.jsx`.
  - `type` can be `'info' | 'success' | 'error'`.
  - Displays a non-blocking notification in the top-right.

- `confirm(message, title?)`
  - Available via `useApp()` (exposed from `AuthContext`) or `useAuth()`.
  - Returns a Promise that resolves to `true` (confirmed) or `false` (cancelled).
  - Example:

```js
const { confirm, showToast } = useApp();

const handleDelete = async (id) => {
  const ok = await confirm('Are you sure you want to delete this item?');
  if (!ok) return;
  // proceed with deletion
  showToast('Deleted', 'success');
};
```

Notes:
- Do not modify `src/lib/otp.js` or the resend flow that depends on `VITE_RESEND_API_KEY`.
- `AuthContext` still exposes `requestOtp(identifier, purpose, metadata = {})` to keep backward compatibility.
