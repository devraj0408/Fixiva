# Fixiva Admin Subdomain - Deployment Guide

## Quick Reference

**Old Admin URL:** https://fixiva.co.in/fixiva-admin (⛔ Deprecated)  
**New Admin URL:** https://admin.fixiva.co.in (✅ Active)  
**Customer Site:** https://fixiva.co.in (✅ Active)

---

## Pre-Deployment Checklist

### Code Changes ✅
- [x] Domain utilities created (`src/lib/domainUtils.js`)
- [x] Route paths updated (`src/lib/routePaths.js`)
- [x] App routing updated (`src/App.jsx`)
- [x] Login redirects updated (`src/pages/auth/Login.jsx`)
- [x] Vercel config updated (`vercel.json`)
- [x] Netlify redirects updated (`public/_redirects`)
- [x] Build config optimized (`vite.config.js`)
- [x] All console.logs removed (49 instances)
- [x] Bundle optimized with code splitting
- [x] Tests run successfully

### Environment Configuration
- [x] `.env` has correct Supabase credentials
- [x] VITE_ADMIN_EMAILS configured
- [x] VITE_RESEND_API_KEY set (if using email)
- [x] No hardcoded URLs in code
- [x] All env vars in Vercel project settings

### Git Changes
- [x] All changes committed
- [x] Branch pushed to GitHub
- [x] Create pull request for review
- [x] PR approved and merged to main

---

## Domain Setup (Prerequisites)

### Step 1: Register Domains (if needed)
```
Domain 1: fixiva.co.in          (already registered)
Domain 2: admin.fixiva.co.in    (ensure registered)
```

### Step 2: Point Domains to Vercel

**For Vercel Nameservers:** (Recommended)
```
1. Log in to domain registrar (GoDaddy, Namecheap, etc.)
2. Go to DNS/Nameserver settings
3. Set nameservers to Vercel's:
   - ns1.vercel-dns.com
   - ns2.vercel-dns.com
   - ns3.vercel-dns.com
4. Save and wait 24-48 hours for propagation
```

**For CNAME Records:** (Alternative)
```
fixiva.co.in     CNAME  cname.vercel.com
admin.fixiva.co.in CNAME  cname.vercel.com
```

### Step 3: Configure Vercel Project

1. Go to [Vercel Dashboard](https://vercel.com)
2. Select your Fixiva project
3. Go to Settings → Domains
4. Add domain: `fixiva.co.in`
   - Set as primary domain
   - Verify DNS configuration
5. Add domain: `admin.fixiva.co.in`
   - Add as secondary domain
   - Verify DNS configuration
6. Wait for "Valid Configuration" status

---

## Step-by-Step Deployment

### Phase 1: Build & Test (Local)

```bash
# Navigate to project
cd /path/to/fixiva

# Install dependencies (if needed)
npm install

# Run development server
npm run dev

# Test customer site
# Visit: http://localhost:5173

# Test build
npm run build

# Verify no build errors
npm run lint
```

### Phase 2: Test on Staging

```bash
# Deploy to Vercel staging
vercel deploy

# Get staging URL from output
# Example: https://fixiva-git-main-branch.vercel.app

# Test customer routes
# - https://<staging-url>
# - https://<staging-url>/services
# - https://<staging-url>/login
# - https://<staging-url>/fixiva-admin (should show error)

# Test admin redirect
# Note: Won't work on staging without admin.fixiva.co.in domain
```

### Phase 3: Production Deployment

```bash
# Deploy to production
vercel deploy --prod

# This will deploy to:
# - https://fixiva.co.in (primary)
# - https://admin.fixiva.co.in (secondary)
```

### Phase 4: Verify Deployment

**Test from browser or terminal:**

```bash
# Test customer site loads
curl -I https://fixiva.co.in

# Test admin subdomain loads
curl -I https://admin.fixiva.co.in

# Test redirect from old admin URL
curl -I -L https://fixiva.co.in/fixiva-admin
# Should see: HTTP/1.1 301 Moved Permanently
# And: Location: https://admin.fixiva.co.in
```

---

## Manual Testing Steps

### Test 1: Customer Website Access
1. Open https://fixiva.co.in
2. Verify homepage loads
3. Verify navbar visible
4. Verify footer visible
5. Click "Services" → Should load services page
6. Try login with customer email
7. Verify OTP received
8. Verify dashboard loads after OTP
9. Click "Logout" → Returns to login

### Test 2: Admin Subdomain Access
1. Open https://admin.fixiva.co.in
2. Should redirect to /login
3. Enter admin email: fixiva869@gmail.com
4. Verify OTP received
5. Enter OTP in 6-digit field
6. Verify redirected to admin dashboard
7. Verify all admin tabs visible:
   - Dashboard
   - Bookings
   - Users
   - Verification
   - Services
   - Coverage
   - Support
   - Revenue
   - Settings
8. Test admin operations (create/edit/delete)
9. Click "Logout" → Returns to login on admin subdomain

### Test 3: Old Admin URL Redirect
1. Open https://fixiva.co.in/fixiva-admin
2. Should redirect (301) to https://admin.fixiva.co.in
3. Browser URL should show admin.fixiva.co.in
4. Verify redirects to /login
5. Verify entire flow works

### Test 4: Non-Admin Access Control
1. Create test account with "customer" role
2. Go to https://admin.fixiva.co.in
3. Login with customer account
4. System should redirect to https://fixiva.co.in
5. Verify customer dashboard loads instead

### Test 5: Page Refresh on Admin
1. Login to https://admin.fixiva.co.in
2. Go to any tab (e.g., Bookings)
3. Press F5 to refresh page
4. Should stay on same page
5. Dashboard should persist after refresh
6. Try different tabs - all should refresh correctly

### Test 6: Browser DevTools Check
1. Open admin.fixiva.co.in
2. Press F12 to open DevTools
3. Go to Console tab
4. Verify NO error messages
5. Verify NO console.logs or console.errors
6. Go to Network tab
7. Verify assets load (no 404s)
8. Check bundle size vs before

### Test 7: Mobile Responsiveness
1. Open https://fixiva.co.in on mobile
2. Verify responsive design
3. Verify navigation works
4. Open https://admin.fixiva.co.in on mobile
5. Verify admin panel responsive
6. Verify all tabs accessible on mobile

---

## Monitoring & Validation

### Monitor for 24 Hours Post-Deployment

#### Metrics to Check
```
✅ Uptime: Should be 99.9%+
✅ Admin login success rate: Should be 95%+
✅ Redirect success rate: Should be 99%+
✅ Page load time: Should be < 3 seconds
✅ Error rate: Should be < 0.1%
```

#### Vercel Monitoring
1. Go to [Vercel Dashboard](https://vercel.com)
2. Select Fixiva project
3. Check "Deployments" tab
   - Should show recent successful deployment
   - Verify no errors in logs
4. Check "Analytics" tab
   - Monitor traffic on both domains
   - Check for unusual patterns
5. Check "Monitoring" tab
   - Verify uptime
   - Check error rates
   - Review performance metrics

#### Supabase Monitoring
1. Go to [Supabase Dashboard](https://supabase.co)
2. Select Fixiva project
3. Check "Logs" for errors
4. Check "Auth" → "Users" for new logins
5. Verify no RLS (Row Level Security) errors

### Logs to Review

**Vercel Logs:**
- No deployment errors
- No build errors
- No runtime errors
- Successful redirects (HTTP 301)

**Supabase Logs:**
- Successful OTP sends
- Successful profile fetches
- No RLS violations
- No database errors

**Application Logs (Browser Console):**
- No JavaScript errors
- No network errors
- No 404s for assets
- No warnings

---

## Troubleshooting

### Issue: Admin subdomain shows 404

**Cause:** Domain not configured in Vercel  
**Solution:**
1. Go to Vercel Project Settings → Domains
2. Verify admin.fixiva.co.in is added
3. Check DNS configuration
4. Wait 24-48 hours for propagation
5. Redeploy if needed: `vercel deploy --prod`

### Issue: Old admin URL doesn't redirect

**Cause:** Vercel config not deployed  
**Solution:**
1. Verify `vercel.json` has redirect rule
2. Check deployment includes updated vercel.json
3. Manually trigger redeploy: `vercel deploy --prod`
4. Test redirect: `curl -I https://fixiva.co.in/fixiva-admin`

### Issue: OTP verification fails on admin subdomain

**Cause:** Auth context not detecting subdomain  
**Solution:**
1. Check browser console for errors
2. Verify `domainUtils.js` is imported in App.jsx
3. Check `isAdminSubdomain()` returns true
4. Review Supabase auth logs
5. Verify VITE_ADMIN_EMAILS in Vercel env vars

### Issue: Non-admin cannot logout from admin subdomain

**Cause:** Redirect not working  
**Solution:**
1. Check ProtectedRoute logic in App.jsx
2. Verify `getCustomerDomainUrl()` returns correct URL
3. Check browser console for redirect errors
4. Test redirect manually: `window.location.href = getCustomerDomainUrl()`

### Issue: Bundle size warning

**Cause:** Code splitting not effective  
**Solution:**
1. Check `vite.config.js` manualChunks
2. Verify admin components lazy-loaded
3. Run `npm run build` to see actual chunk sizes
4. Review dist folder for unexpected large files

### Issue: Console shows errors after deployment

**Cause:** Development code leaked to production  
**Solution:**
1. Verify all console.logs removed
2. Check for hardcoded console statements
3. Review `vite.config.js` Terser config
4. Run build and check bundle
5. Deploy fresh build

---

## Rollback Procedure

If critical issues found post-deployment:

### Option 1: Quick Rollback (< 5 minutes)

```bash
# Go to Vercel Deployments
# Select previous working deployment
# Click "Promote to Production"
# Verify all functions work

# Alternative via CLI:
vercel rollback
```

### Option 2: Code Rollback

```bash
# If new code has critical bug:
git log --oneline | head -20

# Find last working commit
git checkout <commit-hash>

# Rebuild and redeploy
npm run build
vercel deploy --prod
```

### Option 3: Partial Rollback

If only one domain has issues:
1. Remove subdomain from Vercel
2. Keep main domain live
3. Fix issues locally
4. Redeploy both domains

---

## Post-Deployment Checklist

**Immediately After Deployment (0-1 hour):**
- [ ] Check Vercel deployment status: SUCCESS
- [ ] Both domains resolve correctly
- [ ] No 5xx errors in Vercel logs
- [ ] Admin can login via admin subdomain
- [ ] Old admin URL redirects (301)
- [ ] Customer site accessible
- [ ] No console errors visible

**After 24 Hours:**
- [ ] Monitor uptime: 99.9%+
- [ ] Check error rate: < 0.1%
- [ ] Verify page load times: < 3s
- [ ] Review Supabase logs: All normal
- [ ] Confirm admins accessing correctly
- [ ] Verify non-admins blocked from admin
- [ ] Check backup systems active

**After 1 Week:**
- [ ] Verify no unexpected errors
- [ ] Check analytics for usage patterns
- [ ] Review performance metrics
- [ ] Update internal documentation
- [ ] Archive old admin access logs
- [ ] Brief support team on new URL

---

## Team Communication

### Announcement Template

```
🚀 Fixiva Admin Panel Upgrade

We've successfully migrated the admin panel to a dedicated subdomain!

📍 New Admin URL: https://admin.fixiva.co.in
📍 Customer Site: https://fixiva.co.in (unchanged)

✨ What's New:
- Faster, more secure admin access
- Better performance
- Improved reliability
- Cleaner codebase

🔄 Old Links: 
- https://fixiva.co.in/fixiva-admin will automatically redirect

💡 For Support: Contact your admin or check MIGRATION_REPORT.md

Questions? Refer to our new deployment guide: DEPLOYMENT_GUIDE.md
```

---

## Success Criteria

✅ **Deployment is successful when:**
1. Both domains fully operational
2. Admin subdomain loads for admin users
3. Customer site loads for all users
4. Old URLs redirect (301) to new URLs
5. OTP login works on both domains
6. Admin dashboard fully functional
7. Non-admins redirected from admin subdomain
8. No console errors or warnings
9. Error rate < 0.1%
10. Page load time < 3 seconds

---

## References

- **Migration Report:** [MIGRATION_REPORT.md](./MIGRATION_REPORT.md)
- **Vercel Docs:** https://vercel.com/docs
- **React Router:** https://reactrouter.com/docs
- **Supabase Auth:** https://supabase.com/docs/guides/auth

---

## Sign-Off

**Deployment Guide Version:** 1.0  
**Last Updated:** 2026-07-22  
**Status:** Ready for Production ✅

For questions or issues during deployment, refer to the Troubleshooting section or review code changes in MIGRATION_REPORT.md.
