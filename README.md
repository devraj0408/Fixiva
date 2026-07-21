# Fixiva

Fixiva is a frontend-first home-service marketplace built with React, Vite, and Supabase. It provides role-based experiences for customers, workers, contractors, and administrators, with a complete admin operations hub for managing bookings, services, cities, pricing, tickets, and revenue.

---

## Project summary
Fixiva is designed as a marketplace control plane for a service marketplace:

- **Customers** can login with passwordless OTP, book services, and submit support tickets.
- **Workers** can receive assignments, view job statuses, and manage verification.
- **Contractors** can access contractor approval workflows and service listings.
- **Admins** can oversee the entire platform from a dedicated admin dashboard.

The application uses Supabase for authentication, database access, and profile persistence.

---

## Admin dashboard capabilities
The admin dashboard includes the following management features:

- Overview metrics for bookings, tickets, workers, contractors, users, and revenue
- Booking dispatch board with live status updates
- User directory with role promotion/demotion controls
- Worker and contractor verification workflows
- Service CRUD with category, description, pricing, and city availability
- City creation and region management
- Tariff update interface for service base price and platform fee
- Support ticket resolution workflow
- Revenue and commission reporting

Additionally, the admin panel includes safeguards:

- admin-only access control
- protected `/dashboard/admin` route
- logged-in admin cannot demote themselves
- configured admin emails cannot be demoted

---

## Architecture and implementation details
- **React 19** with **Vite** for fast local development and production build
- **Supabase** client integration in `src/lib/supabaseClient.js`
- Passwordless email OTP authentication via Supabase in `src/context/AuthContext.jsx`
- Role-aware frontend routing and protected admin route in `src/App.jsx`
- Admin dashboard in `src/pages/dashboard/AdminDashboard.jsx`
- Reusable app state, data fetching, and helpers in `src/context/AuthContext.jsx`
- Email fallback support when `VITE_RESEND_API_KEY` is not configured

---

## Environment configuration
Create a `.env` file in the project root with the following variables:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_ADMIN_EMAILS=admin@fixiva.com,ops@fixiva.com
VITE_RESEND_API_KEY=your-resend-key-if-you-want-email-delivery
```

### Required variables
- `VITE_SUPABASE_URL`: Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Supabase anonymous public key
- `VITE_ADMIN_EMAILS`: comma-separated list of admin emails

### Optional variables
- `VITE_RESEND_API_KEY`: used only for an optional custom email delivery helper

> Note: the current OTP auth flow works without `VITE_RESEND_API_KEY`.

---

## Project structure
Key files and folders:

- `src/App.jsx`: route definitions and protected route logic
- `src/context/AuthContext.jsx`: auth, data loading, role checks, and CRUD helpers
- `src/pages/dashboard/AdminDashboard.jsx`: admin panel UI and actions
- `src/pages/auth/Login.jsx`: passwordless login screen
- `src/pages/auth/Register.jsx`: registration flow
- `src/lib/supabaseClient.js`: Supabase client initialization
- `src/lib/adminAccess.js`: admin email utility helpers
- `supabase/migrations/`: optional schema and admin migrations

---

## Local development
Install dependencies and start the dev server:

```bash
npm install
npm run dev
```

Open the URL shown in the terminal, typically:

```text
http://localhost:5173/
```

---

## Production build
Create a production build with:

```bash
npm run build
```

---

## Admin login flow
1. Open login page:
2. Enter an email included in `VITE_ADMIN_EMAILS`
3. Receive the OTP and verify
4. Access the admin dashboard at:
   ```text
   http://localhost:5173/dashboard/admin
   ```

---

## Validation
This project has been verified with:

- `npm run lint` — passes cleanly
- `npm run build` — builds successfully

---

## Quick run and check
Use the local Vite dev server and verify the admin experience directly:

1. Start the app:
   ```bash
   npm run dev
   ```
2. Open the app in your browser:
   ```text
   http://localhost:5173/
   ```
3. Open the admin dashboard:
   from general login page directly,
4. Sign in with an email listed in `VITE_ADMIN_EMAILS` and verify the OTP.
5. Confirm admin access at:
   ```text
   http://localhost:5173/dashboard/admin
   ```

## Supabase schema reminder
Ensure your Supabase project includes these core tables and columns:

- `profiles` (must include `id`, `email`, `role`, `name`, `phone`, `city`)
- `workers` (must include `id`, `status`, `trust_score`, `skills`, `city`)
- `contractors` (must include `id`, `status`, `company`, `city`)
- `services` (must include `id`, `name`, `description`, `category`, `base_price`, `platform_fee`, `active`)
- `cities` (must include `id`, `name`, `region`)
- `city_services` (must include `city_id`, `service_id`, `enabled`)
- `bookings` and `support_tickets` for runtime data operations

The `supabase/migrations/` folder contains SQL helpers to align schema expectations.

---

## Developer notes
- Supabase schema should include `profiles`, `workers`, `contractors`, `services`, `cities`, `city_services`, `bookings`, and `support_tickets`.
- Admin status is derived from `profiles.role === 'admin'` or a configured admin email.
- `AuthContext` provides CRUD helpers for bookings, workers, contractors, services, tickets, and users.
- The app currently uses Supabase client-side auth; this repo does not require a separate backend server.

### Recommended next improvements
- add Supabase RLS policies and migration enforcement
- add integration tests for auth, admin dashboard, and service management
- add CI for lint/build and optionally browser tests
- seed sample data for local admin testing

---

## Summary
Fixiva is ready to run locally as a full-featured service marketplace prototype with a complete admin control panel, role-based access, and Supabase-backed authentication and data management.
