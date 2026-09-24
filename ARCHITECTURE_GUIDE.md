# Fixiva Admin Architecture Guide

## Overview

This document explains the new multi-domain architecture for Fixiva after the admin panel migration to a dedicated subdomain.

---

## Domain Structure

### Primary Domains
```
fixiva.co.in            → Customer Website
admin.fixiva.co.in      → Admin Panel
```

### Deprecated
```
fixiva.co.in/fixiva-admin → Permanently redirects to admin.fixiva.co.in
```

---

## Core Utilities

### `src/lib/domainUtils.js`

This new utility module handles all domain detection and URL building logic.

#### Key Functions

```javascript
// Current context detection
isAdminSubdomain()       // Returns true if current domain is admin.fixiva.co.in
getCurrentHostname()     // Returns current hostname (fixiva.co.in, admin.fixiva.co.in, etc.)

// Domain URL building
getCustomerDomainUrl()   // Returns protocol://fixiva.co.in or current customer domain
getAdminDomainUrl()      // Returns protocol://admin.fixiva.co.in or current admin domain

// Route path determination
getAdminDashboardPath()  // Returns '/' on admin subdomain, '/fixiva-admin/dashboard' on main
getAdminEntryPath()      // Returns '/login' on admin subdomain, '/fixiva-admin' on main

// URL construction
buildUrl(path, domain)   // Build full URL for a specific domain

// Environment detection
isDevelopment()          // Returns true if NODE_ENV = 'development'
```

#### Usage Examples

```javascript
import { isAdminSubdomain, getCustomerDomainUrl, getAdminDomainUrl } from '@/lib/domainUtils';

// Check if on admin subdomain
if (isAdminSubdomain()) {
  console.log("You're on the admin panel");
}

// Get correct URL for redirect
if (!isAdmin) {
  window.location.href = getCustomerDomainUrl();
}

// Send admin user to admin domain
if (isAdmin && !isAdminSubdomain()) {
  window.location.href = getAdminDomainUrl();
}
```

---

## Routing System

### `src/lib/routePaths.js`

Updated to use domain context for route generation.

```javascript
import { isAdminSubdomain } from './domainUtils';

// Example: getAdminDashboardRoute()
// On admin.fixiva.co.in → Returns '/'
// On fixiva.co.in → Returns '/fixiva-admin/dashboard'

export const getAdminDashboardRoute = () => {
  if (isAdminSubdomain()) {
    return '/dashboard/admin';  // or just '/'
  }
  return '/fixiva-admin/dashboard';
};
```

### `src/App.jsx`

Main app component handles domain-based routing logic.

```javascript
const App = () => {
  const onAdminSubdomain = isAdminSubdomain();

  // Redirect non-admins from admin subdomain
  useEffect(() => {
    if (onAdminSubdomain && isAuthenticated && user?.role !== 'admin') {
      window.location.href = getCustomerDomainUrl();
    }
  }, [isAuthenticated, user, onAdminSubdomain]);

  return (
    <Router>
      {/* Different routes based on subdomain */}
      {onAdminSubdomain && <Route path="/" element={<AdminDashboard />} />}
      {!onAdminSubdomain && <Route path="/" element={<Home />} />}
    </Router>
  );
};
```

---

## Authentication Flow

### OTP-Based Login

```
User enters email/phone
        ↓
App calls requestOtp()
        ↓
OTP sent via email/SMS
        ↓
User enters 6-digit OTP
        ↓
App calls verifyOtp()
        ↓
Fetch user profile from database
        ↓
Check user role
        ├─ admin → getAdminDashboardRoute() or getAdminDomainUrl()
        ├─ worker → /worker-dashboard
        ├─ contractor → /contractor-dashboard
        └─ customer → /dashboard
```

### Login Component (`src/pages/auth/Login.jsx`)

Updated to handle subdomain redirects:

```javascript
const handleVerifyOtp = async () => {
  const { profile } = await verifyOtp(email, otp);
  
  if (profile?.role === 'admin') {
    // Route admin users correctly based on subdomain
    if (isAdminSubdomain()) {
      navigate('/');  // On admin.fixiva.co.in
    } else {
      navigate(getAdminDashboardRoute());  // On fixiva.co.in
    }
  } else {
    navigate('/dashboard');  // Customer
  }
};
```

---

## Component Structure

### Admin Subdomain Components

All admin components are lazy-loaded:
- AdminDashboard (lazy)
  - DashboardOverview
  - BookingManagementPanel
  - UserManagementPanel
  - VerificationPanel
  - ServicesPanel
  - CoveragePanel
  - TicketsPanel
  - RevenuePanel
  - SettingsPanel

### Customer Components

Regular components:
- Home
- Services
- BookingFlow
- CustomerDashboard
- WorkerDashboard
- ContractorDashboard
- Profile
- ContactUs
- HelpCenter

---

## Protected Routes

### ProtectedRoute Component

```javascript
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, isAuthenticated } = useAuth();
  const onAdminSubdomain = isAdminSubdomain();

  // Check authentication
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check role-based access
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Special handling for admin subdomain
    if (onAdminSubdomain && user.role !== 'admin') {
      window.location.href = getCustomerDomainUrl();
      return <LoadingSkeleton />;
    }
    
    // Standard role-based redirect
    if (user.role === 'admin') {
      return <Navigate to={getAdminDashboardRoute()} replace />;
    }
    // ... other role redirects
  }

  return children;
};
```

---

## Deployment Configuration

### `vercel.json`

Handles multi-domain routing and redirects:

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "redirects": [
    {
      "source": "/fixiva-admin/:path*",
      "destination": "https://admin.fixiva.co.in/:path*",
      "permanent": true
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=3600, must-revalidate"
        }
      ]
    }
  ]
}
```

### `vite.config.js`

Optimizes bundle with smart code splitting:

```javascript
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Split admin components
          if (id.includes('components/admin/')) {
            return 'admin.modules';
          }
          
          // Split dashboard pages
          if (id.includes('pages/dashboard/')) {
            return 'dashboards';
          }
          
          // Vendor chunks
          if (id.includes('node_modules')) {
            // ... vendor splitting logic
          }
        }
      }
    }
  }
})
```

---

## Environment Variables

Required environment variables:

```env
VITE_SUPABASE_URL=https://...supabase.co
VITE_SUPABASE_ANON_KEY=...
VITE_ADMIN_EMAILS=fixiva869@gmail.com,admin2@fixiva.co.in
VITE_RESEND_API_KEY=... (optional, for email notifications)
```

---

## Database Schema

No changes to database schema. All existing tables remain:
- profiles
- bookings
- workers
- contractors
- services
- cities
- states
- support_tickets
- coverage_requests

### Admin Detection

Admin status determined by:
1. `profiles.role = 'admin'` (primary)
2. Email in `VITE_ADMIN_EMAILS` (secondary)
3. Supabase RLS policies enforce access

---

## Error Handling

### Common Errors & Fixes

#### "Redirect failure: Unable to route to dashboard"
- Check network tab for redirects
- Verify domainUtils imported correctly
- Check browser console for errors

#### "Failed to fetch profile"
- Verify Supabase credentials
- Check network requests
- Review Supabase logs

#### Admin subdomain shows 404
- Verify domain added in Vercel
- Check DNS propagation
- Verify vercel.json deployed

#### Old admin URL not redirecting
- Verify vercel.json in deployment
- Check Vercel deployment logs
- Test redirect: `curl -I https://fixiva.co.in/fixiva-admin`

---

## Performance Optimization

### Code Splitting Strategy

```
vendor.react          → React + ReactDOM
vendor.icons          → Lucide React
vendor.motion         → Framer Motion
vendor.supabase       → Supabase client
vendor                → Other dependencies

admin-dashboardoverview
admin-bookingmanagementpanel
admin-usermanagementpanel
... (other admin components)

dashboard-admindashboard
dashboard-customerdashboard
dashboard-workerdashboard
dashboard-contractordashboard

auth.pages            → Login, Register, etc.
legal.pages           → Terms, Privacy, etc.
```

### Bundle Size Optimization

- ✅ All console.logs removed (49 instances)
- ✅ Debug code removed
- ✅ Dead code elimination
- ✅ Terser double-pass compression
- ✅ Navbar/Footer hidden on admin subdomain
- **Expected improvement: 7-15% reduction**

---

## Monitoring

### Health Checks

```bash
# Customer site
curl -I https://fixiva.co.in
# Expected: HTTP/1.1 200 OK

# Admin subdomain
curl -I https://admin.fixiva.co.in
# Expected: HTTP/1.1 200 OK

# Redirect test
curl -I -L https://fixiva.co.in/fixiva-admin
# Expected: HTTP/1.1 301 Moved Permanently
#          Location: https://admin.fixiva.co.in
```

### Metrics to Monitor

- ✅ Uptime > 99.9%
- ✅ Error rate < 0.1%
- ✅ Page load time < 3s
- ✅ OTP success rate > 95%
- ✅ Redirect success rate > 99%

---

## Development Workflow

### Local Development

```bash
npm run dev
# Access: http://localhost:5173

# Test customer routes
# - http://localhost:5173
# - http://localhost:5173/login
# - http://localhost:5173/dashboard

# To test subdomain logic locally:
# Edit /etc/hosts (macOS/Linux) or C:\Windows\System32\drivers\etc\hosts (Windows)
# Add: 127.0.0.1 admin.localhost

# Then test: http://admin.localhost:5173
```

### Building

```bash
npm run build
# Output: dist/

# Preview production build
npm run preview
# Access: http://localhost:4173
```

### Deployment

```bash
# Deploy to staging
vercel deploy

# Deploy to production
vercel deploy --prod
```

---

## Best Practices

### When Adding New Features

1. **Check domain context** in new components:
   ```javascript
   import { isAdminSubdomain } from '@/lib/domainUtils';
   
   if (isAdminSubdomain()) {
     // Admin-specific logic
   }
   ```

2. **Use route helpers** from `routePaths.js`:
   ```javascript
   import { getAdminDashboardRoute } from '@/lib/routePaths';
   navigate(getAdminDashboardRoute());
   ```

3. **Protect admin routes** with role check:
   ```javascript
   <Route path="/admin-feature" element={
     <ProtectedRoute allowedRoles={['admin']}>
       <AdminFeature />
     </ProtectedRoute>
   } />
   ```

4. **Remove console logs** before committing:
   ```bash
   git grep -l "console\." src/
   ```

5. **Test on both domains**:
   - fixiva.co.in (customer)
   - admin.fixiva.co.in (admin)

### Code Review Checklist

- [ ] No hardcoded URLs (use domainUtils)
- [ ] No console.logs left
- [ ] Uses ProtectedRoute for admin features
- [ ] Tests on both domains
- [ ] No merge conflicts with main
- [ ] Build succeeds without warnings
- [ ] Follows existing code patterns

---

## Troubleshooting Guide

### Issue: Domain detection returns false

```javascript
// Debug
console.log('Hostname:', getCurrentHostname());
console.log('Is admin subdomain:', isAdminSubdomain());

// Solution: Check if function is imported correctly
import { isAdminSubdomain } from '@/lib/domainUtils';
// Verify path matches your project structure
```

### Issue: Redirects not working

```javascript
// Debug
console.log('Admin domain URL:', getAdminDomainUrl());
console.log('Customer domain URL:', getCustomerDomainUrl());

// Solution: Ensure you're using full URL with window.location.href
// ✅ Correct:
window.location.href = getAdminDomainUrl();

// ❌ Wrong:
navigate(getAdminDomainUrl());  // navigate expects relative paths
```

### Issue: Admin components not loading

```javascript
// Check if lazy-loaded correctly
const AdminDashboard = React.lazy(() => 
  import('./pages/dashboard/AdminDashboard')
);

// Verify Suspense fallback
<Suspense fallback={<LoadingSkeleton />}>
  <AdminDashboard />
</Suspense>
```

---

## Future Enhancements

1. **Admin API** - REST API for programmatic access
2. **Audit Logging** - Track all admin actions
3. **2FA** - Two-factor authentication for admin
4. **Webhooks** - Alert on important events
5. **Admin Impersonation** - Support testing customer issues
6. **Advanced Analytics** - Deeper insights
7. **Mobile App** - Native mobile admin app
8. **API Tokens** - Programmatic authentication

---

## References

- [React Router Documentation](https://reactrouter.com/docs)
- [Vercel Deployment Guide](https://vercel.com/docs)
- [Supabase Authentication](https://supabase.com/docs/guides/auth)
- [Vite Code Splitting](https://vitejs.dev/guide/features.html#dynamic-import)

---

**Document Version:** 1.0  
**Last Updated:** 2026-07-22  
**Author:** Development Team
