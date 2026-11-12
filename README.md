# SewsEra

Filipino tailoring marketplace — React 18 + Vite + Tailwind CSS v4 + Firebase (Auth + Firestore), routes via react-router 7.

## Run locally

- Prereq: Node 20+.
- `npm install` then `npm run dev` (Vite dev server).
- `npm run build` outputs to `dist/` (Firebase Hosting public dir).
- Firebase client config lives in `src/app/firebase.ts` (project `sewsera`).

## Signup email verification (OTP)

- Email/password signups must enter a 6-digit code emailed to them before entering the app; page is `/auth/verify-otp`.
- Delivery uses EmailJS (free tier) from the browser; no backend or Cloud Functions.
- Setup: copy `.env.example` to `.env.local` and fill `VITE_EMAILJS_SERVICE_ID`, `VITE_EMAILJS_TEMPLATE_ID`, and `VITE_EMAILJS_PUBLIC_KEY` from the EmailJS dashboard (add an email service and a template).
- The EmailJS template must include `{{otp_code}}`, `{{to_email}}`, `{{to_name}}`, and `{{app_name}}`, with "To email" set to `{{to_email}}`.
- The code is stored SHA-256-hashed in `emailOtps/{uid}` with a 10-minute expiry and a 5-attempt limit; a successful check sets `users/{uid}.emailVerified = true`.
- Without the three keys the verify page shows a setup warning and new signups cannot finish verification. Accounts created before this feature (no `emailVerified` field) are treated as verified.
- Vendors still see the pending-approval screen at signup and verify on their first login after admin approval.

## Roles

- customer → `/customer`, tailor → `/tailor`, seller → `/seller`, admin → `/admin`.
- Signup only creates customer/tailor/seller accounts. Admin is never self-assignable.
- Signup writes a `status` on `users/{uid}`: `approved` for customers, `pending` for tailors/sellers.
- Tailors/sellers with `pending` or `rejected` status are signed out at login and on session restore until an admin approves them; signup shows them a "pending admin approval" screen instead of entering the app.

## Admin dashboard

Pages: `/admin` (overview stats + a "Pending approvals" health metric), `/admin/users` (search, status filter, change role, vendor approval, remove profile), `/admin/orders` (all orders, advance status), `/admin/profile`.

### Vendor approval workflow (`/admin/users`)

- Filter chips: Any status / Pending / Approved / Rejected (chip shows the pending count). Status badges are shown for tailors/sellers only.
- Approve / Reject buttons write `status`, `reviewedBy`, and `reviewedAt` (server timestamp) on `users/{uid}`.
- "Docs" opens a modal that reads the vendor's uploads from `users/{uid}/documents` (base64 `dataUrl`); image previews only.
- Changing a role also resets status: customer/admin → `approved`, tailor/seller → `pending`.
- Approving a tailor/seller also creates the public `tailors/{uid}` / `sellers/{uid}` listing so they appear in Discover — only when missing, so re-approval never resets ratings/reviews.

### Create the first admin (one-time, required)

1. Sign up normally so a `users/{uid}` document exists.
2. In Firebase Console → Firestore → `users` → your document → set `role` to `admin`.
3. Sign in again and open `/admin`.

Rules intentionally block self-promotion, so this console step (or an Admin SDK script) is the only bootstrap path.

### Deploy security rules

`firestore.rules` is the security boundary for the admin role. It has already been deployed to the live project:

```
firebase deploy --only firestore:rules --project sewsera
```

Run the same command to redeploy after editing the file. Deploying replaces the project's current rules; review the file first. If admin reads/writes show permission errors, the rules have not been (re)deployed.

Current rules cover: admin-only management of `users`/`tailors`/`sellers`, self-registration with the correct `status`, vendor document uploads, admins updating any order, and client-created `fabricOrders` (customer creates own, seller reads own, admin full access).

## Firestore collections used

`users` (+ `documents` subcollection for vendor uploads), `tailors`, `sellers`, `fabrics`, `shops`, `inventory`, `orders`, `jobs`, `appointments`, `portfolio`, `bookings`, `fabricOrders`, `conversations` (+ `messages` subcollection). Orders are currently backend/seed-created; there is no client checkout write.

## Notes

- Rule behavior was verified against the live project with temporary accounts: admins can list/update users and orders, approve vendors, and create listings; customers are denied listing users, updating orders, self-promotion, and other customers' `fabricOrders`.
- Known gaps (temporary, tighten later):
  - Any signed-in user can read/write `bookings`, `jobs`, `conversations`, `inventory`, `shops`, `portfolio`, `appointments`, `fabrics` — not yet owner-scoped because the live data shapes for those collections are unknown.
  - Sellers/tailors can set any string as order `status` (no enum check in rules).
  - Vendor routes (`/tailor/*`, `/seller/*`) have no client-side role guard; protection relies on Firestore rules.
- `dist/` is committed because Firebase Hosting deploys it; run `npm run build` after code changes.
- No test suite or tsconfig exists; verify with `npm run build`.
