# PROJECT GUIDE: FIXORA

Welcome to the FIXORA project documentation! This guide is designed to be beginner-friendly and explain everything from the high-level architecture down to running the project locally.

## A. Project Overview

**What is FIXORA?**  
FIXORA is an on-demand home services marketplace. It connects homeowners looking for maintenance, repairs, and installations with verified professionals (workers and contractors) in their local area.

**Mission**  
To provide a secure, transparent, and high-quality platform where customers can easily find reliable help, and skilled professionals can find consistent work.

**Vision**  
To become the standard for trusted home services across India, ensuring every household has access to verified experts.

**Business Model**  
FIXORA operates as a marketplace platform bridging the gap between demand (customers) and supply (workers/contractors). 

**Revenue Model**  
FIXORA charges a **Platform Convenience Fee** on top of the worker's base price/inspection fee for every completed booking.

**Target Cities**  
Currently rolling out city by city in India, with an initial focus on major metropolitan areas. Services can be toggled on/off on a per-city basis from the Admin Dashboard.

---

## B. Tech Stack

### Frontend
- **React:** Component-based UI library.
- **Vite:** Next-generation frontend tooling for fast builds and hot module replacement.
- **JavaScript:** Core programming language.
- **CSS:** Custom CSS for styling (Vanilla CSS with standard Flexbox/Grid layouts).

### Backend
- **Supabase:** An open-source Firebase alternative providing a full PostgreSQL database, Authentication, and Edge Functions.

### Authentication
- **Supabase Auth:** Handles JWT-based authentication, user sessions, and role management.

### Database
- **PostgreSQL (Supabase):** Relational database with Row Level Security (RLS) to ensure data privacy.

### Deployment
- **Vercel:** Frontend hosting platform optimized for Vite/React applications.

---

## C. Folder Structure

Here is a breakdown of the codebase:

- `src/` - Contains all the application source code.
  - `pages/` - Top-level React components representing full views (e.g., Home, Services, Dashboards).
    - `auth/` - Login and Register pages.
    - `dashboard/` - Role-specific dashboards (Admin, Customer, Worker, Contractor).
    - `legal/` - Terms & Conditions, Privacy Policy, Refund Policy.
  - `components/` - Reusable UI elements (e.g., Navbar, Footer).
  - `context/` - React Context providers (`AuthContext.jsx` handles global state, user session, and Supabase data fetching).
  - `lib/` - Utility libraries (e.g., `supabaseClient.js` for initializing the Supabase connection).
- `supabase/` - Contains database migrations and SQL schemas.
- `test/` - Functional testing scripts to verify backend logic.
- `public/` - Static assets like `favicon.ico` or images that bypass the bundler.

---

## D. How Application Works

**Customer Flow**
1. Customer searches for a service and enters their city.
2. Customer selects a service, views pricing, and requests a booking.
3. Customer waits for the Admin/System to assign a worker.
4. After service completion, the customer pays the worker in cash and leaves a review.

**Worker Flow**
1. Worker registers and awaits verification.
2. Once verified, the worker receives job assignments on their dashboard.
3. Worker goes to the customer's location, completes the job, collects cash, and marks the job as completed.

**Contractor Flow**
1. Contractor registers their company.
2. After approval, the contractor can accept large-scale projects or multiple service requests.

**Admin Flow**
1. Admin logs in and oversees the entire platform.
2. Admin assigns workers to new bookings.
3. Admin approves/rejects pending workers and contractors.
4. Admin resolves support tickets and manages pricing/city availability.

**Booking Lifecycle**
`New Request` ➔ `Assigned` ➔ `Confirmed` ➔ `In Progress` ➔ `Completed` (or `Cancelled`)

**Support Ticket Flow**
Customers can submit a ticket if they face issues. It lands in the Admin Dashboard where an admin can review the complaint and mark it as `Resolved`.

**Review Flow**
Only customers with `Completed` bookings can leave a 1-5 star review for the worker.

---

## E. System Architecture

1. **Frontend:** React App hosted on Vercel. Handles UI rendering, routing (React Router), and user interactions.
2. **Backend/API Flow:** The frontend communicates directly with the Supabase PostgreSQL database using the `@supabase/supabase-js` client library over a REST/PostgREST API.
3. **Authentication Flow:** Users log in via Supabase Auth. The frontend receives a JWT session token.
4. **Data Flow:** Every database query sent from the frontend includes the JWT. Supabase PostgreSQL applies Row Level Security (RLS) policies to ensure the user only reads/writes data they are permitted to see.

---

## F. Database Tables

- **`profiles`**: The base table for all registered users (Admin, Customer, Worker, Contractor). Stores name, email, and role.
- **`services`**: The catalog of available home services, including icons, names, and base pricing.
- **`cities`**: A list of cities where FIXORA operates.
- **`bookings`**: The core transactional table. Links a customer, a worker, a service, and a city. Tracks the status of the job.
- **`reviews`**: Stores customer feedback and 1-5 star ratings for completed bookings.
- **`support_tickets`**: Stores customer complaints and inquiries.
- **`workers`**: Extension of `profiles`. Stores worker-specific data like Trust Score, skills, and verification status.
- **`contractors`**: Extension of `profiles`. Stores company details and approval status.
- **`pricing_rules`**: Dynamic pricing overrides for specific cities and services.
- **`city_services`**: A junction table that controls which services are enabled/disabled in which cities.
- **`partner_applications`**: Stores raw application data for workers/contractors before they are approved.
- **`trust_scores`**: A fast-read table mirroring the worker's trust score for reporting purposes.

---

## G. How To Run Locally

Follow these steps to run FIXORA on your own machine:

1. **Install Dependencies**
   ```bash
   npm install
   ```
2. **Start the Development Server**
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` in your browser.
3. **Build for Production** (Optional, to test the compiled version)
   ```bash
   npm run build
   npm run preview
   ```

---

## H. Environment Variables

To connect to the database, you need a `.env` file in the root directory.

- `VITE_SUPABASE_URL`: The unique URL of your Supabase project (e.g., `https://xyz.supabase.co`).
- `VITE_SUPABASE_ANON_KEY`: The public anonymous key used to securely communicate with the database from the browser.

**Where to get them:**  
Log in to your Supabase Dashboard ➔ Project Settings ➔ API ➔ Project URL & Project API Keys.

---

## I. Deployment Guide

**Deploy to Vercel**
1. Push your code to a GitHub repository.
2. Log in to Vercel and click "Add New Project".
3. Import your GitHub repository.
4. **Environment Variables:** During the Vercel setup, add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to the Environment Variables section.
5. Click **Deploy**. Vercel will automatically run `npm run build` and host the `dist/` folder.

**Connect Domain**  
Once deployed, go to your Vercel Project Settings ➔ Domains and add your custom domain (e.g., `fixora.in`).

---

## J. Admin Guide

**How Admin Works**  
The Admin Dashboard is the command center. Only users with the `admin` role in the `profiles` table can access it.

**Admin Responsibilities:**
- **Booking Management:** Watch for `New Request` bookings and change their status to `Assigned` when a worker is found.
- **Worker/Contractor Verification:** Review new partner applications and change their status from `Pending Verification` to `Verified`.
- **Support Management:** Read support tickets and mark them as `Resolved` once handled.
- **Pricing Management:** Adjust the Base Price and Fixora Fee for services directly from the dashboard. Toggle service availability per city.

---

## K. Admin Login Guide

**How admin account is identified:**  
An admin is identified by having the string `'admin'` in the `role` column of the `profiles` table.

**Where admin role is stored:**  
In the Supabase database: `public.profiles` table ➔ `role` column.

**How to create another admin / verify permissions:**
1. Register a normal account on the frontend.
2. Log in to your **Supabase Dashboard**.
3. Go to the **Table Editor** and select the `profiles` table.
4. Find the row with the email of the account you just created.
5. Double-click the `role` cell and change it from `customer` to `admin`.
6. Log out and log back in on the frontend. You will now be redirected to the Admin Dashboard.

---

## L. Troubleshooting Guide

- **White Screen / Blank Page:** Open the browser developer console (F12). Check for React rendering errors or missing imports.
- **Supabase Errors (Fetch Failed):** Ensure your `.env` variables are correct. If you get empty data arrays (`[]`), check if Row Level Security (RLS) is blocking the read.
- **Login Issues:** If login fails, check if the email exists in Supabase Auth (Authentication tab). Supabase may require email confirmation unless you disable "Confirm email" in the Auth settings.
- **Booking Issues:** If a booking doesn't save, ensure you've filled out all required fields. The frontend validation might be blocking it.
- **Deployment Build Errors:** Run `npm run build` locally. If it fails, fix the syntax or ESLint errors preventing the Vite build from completing.

---

## M. Future Roadmap

- **Digital Payments:** Integrate Razorpay or Stripe to allow upfront online payments and wallet systems, moving away from Cash-on-Service.
- **Worker Tracking:** Real-time GPS tracking of the professional on the day of the booking.
- **Referral Program:** Reward customers with discount credits for inviting friends.
- **AI Assistant:** A smart chatbot to automatically troubleshoot minor home issues before booking a professional.
- **Mobile App:** Package the web app using React Native or Capacitor for native iOS/Android stores.
