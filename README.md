# Kolekt

**Group payments, minus the wahala.** Collect dues, levies and contributions with one link. Every payment is verified with **Paga** and matched to the right person. No screenshots, no spreadsheets.

Built for the **Tech Ignite '26 Shipathon: Build With Paga** · Made in Akwa Ibom.

---

## How it works

1. **Create.** An organiser (course rep, treasurer, event planner) signs up and creates a collection in four steps: details, fixed or flexible amount, the information contributors must give (name, matric number, phone…), then preview and publish.
2. **Share.** Kolekt gives the collection a public link and QR code, ready for WhatsApp.
3. **Pay.** A contributor opens the link, fills in the details and gets **their own one-time Paga account number** to transfer to from any bank app (or by USSD). No account, no app.
4. **Verify.** When the money lands, Paga notifies Kolekt. Kolekt checks the notification's signature, confirms the payment with Paga's ledger, and only then marks it paid. The contributor gets a receipt; the organiser sees the name, amount and time on their dashboard immediately.

## Paga integration

Kolekt uses the **Paga Collect API** (`lib/server/paga.ts`).

```
Contributor submits the form
  └─▶ Kolekt creates a pending transaction with an unguessable reference (KLK-…)
  └─▶ POST /paymentRequest to Paga          (Basic auth + SHA-512 hash header)
        ◀── one-time account number, USSD code, Paga wallet link

Contributor transfers from any bank app

Paga ──▶ POST /api/webhooks/paga
           1. Check the SHA-512 hash              forged notifications are rejected (401)
           2. De-duplicate on notificationId      Paga retries; money is counted once
           3. POST /history to Paga               count it only if Paga's ledger shows it
           4. Lock the row and settle exactly once; flag a second payment from the same person

The payment page polls /api/pay/:ref/status. If a notification is ever lost,
the poll re-checks Paga directly, so nobody is stuck on "waiting".
```

**Tested safety behaviour**

| Scenario | Result |
|---|---|
| Notification with a forged hash | Rejected with 401; the payment stays pending |
| Same notification delivered twice | Acknowledged both times, counted once |
| Same student pays a fixed collection twice (even typing `csc 2021 014` vs `CSC/2021/014`) | Second payment is flagged "Paid twice" for the organiser |
| Browser lands on a success page | Never marks anything paid; only server-side verification does |
| Receipt or payment page for an unknown reference | 404 |

## Features

**Organisers**
- Real accounts: sign up, log in, log out. Passwords are hashed with scrypt; sessions are random tokens in httpOnly cookies (only a SHA-256 of each token is stored).
- Dashboard with total collected, this week's total and active collections; notifications for new payments.
- Fixed or flexible collections, with optional minimum, target, deadline and "allow above target".
- Custom contributor fields (matric number, department, level, or your own).
- Collection page with every verified contribution, receipts, **CSV export**, WhatsApp sharing, a **QR code**, edit, close and reopen.
- Reports across all collections.

**Contributors**
- No account and no app: name and details, then transfer.
- A one-time account number, plus USSD and Paga wallet options when Paga provides them.
- The page confirms the payment by itself, then shows a **verified receipt** (IDs and contact details partly hidden).

## Getting started

Requires **Node.js 20+**.

```bash
npm install
npm run dev        # http://localhost:3000
```

With no configuration, Kolekt runs in **demo mode**:
- Data is stored in a built-in database in `./.data` (delete the folder to start fresh).
- Paga is simulated through the real code path. On the payment page, **Simulate bank transfer** sends a hash-signed Paga notification to the real webhook, which verifies it before anything is counted.

## Connecting to Paga (sandbox)

1. Create a sandbox business account at **https://beta-business.paga.com** and copy your **public key**, **secret key** and **hash key**.
2. Make the app reachable from the internet so Paga can send notifications: deploy it (below), or run `ngrok http 3000` locally.
3. Copy `.env.example` to `.env.local` and fill in:
   ```env
   PAGA_PUBLIC_KEY=...
   PAGA_SECRET_KEY=...
   PAGA_HASH_KEY=...
   PAGA_ENV=sandbox
   APP_URL=https://your-app.vercel.app
   ```
4. Restart the app. The demo banner disappears and payments go to Paga's sandbox. Pay a generated account number with Paga's **Bank Transfer Simulator**: https://qa-developer-portal.paga.com/simulate/inbound-bank-deposit

<details>
<summary><b>Three things to confirm in the sandbox</b></summary>

Paga's docs leave a few details open. Each is a small change in `lib/server/paga.ts` if the sandbox behaves differently.

- **Ledger check.** `verifyPayment()` calls `/history` with our reference and treats `action: PAYMENT` with status `SUCCESSFUL` or `PAID_NOT_SETTLED` as paid.
- **Notification hash.** Built from `notificationId + statusCode + externalReferenceNumber + state + outstandingBalance + hashKey` (the `x-paga-hash` header style is also accepted). If real notifications get a 401, check the server log.
- **Payer contact.** Paga wants a payer email or phone number. Kolekt sends the contributor's own if the collection asks for it, otherwise `PAGA_PAYER_EMAIL`. Messages to payers are suppressed.

</details>

## Deploying (Supabase + Vercel)

1. **Supabase:** create a project and copy the **Transaction pooler** connection string (port 6543). Optionally run [`supabase/schema.sql`](supabase/schema.sql) in the SQL editor; the app also creates the tables on start.
2. **Vercel:** import the repository and add the variables from [`.env.example`](.env.example). `DATABASE_URL` is required on Vercel, because the built-in database can't persist on serverless hosting.

## Project structure

```
app/
├── page.tsx                      landing page (components/landing/)
├── (auth)/login, signup          real authentication (app/actions/auth.ts)
├── (app)/                        organiser screens: dashboard, collections, reports, profile
├── (flow)/collections/create/…   4-step create wizard → publish (app/actions/collections.ts)
├── (public)/c/[slug]/            public collection page → checkout (app/actions/checkout.ts)
├── pay/[reference]/              account number + live payment status
├── receipt/[reference]/          verified receipt
└── api/
    ├── webhooks/paga/            Paga notification endpoint
    ├── pay/[reference]/status/   payment status polling (re-checks Paga if needed)
    ├── collections/[id]/report/  CSV export
    ├── auth/signout/             clears the session
    └── dev/simulate-transfer/    demo-mode transfer simulator
lib/
├── server/                       server-only: db, schema, auth, paga, payments, collections, transactions
├── create-collection.tsx         client state: wizard draft (browser) + organiser data (from the server)
└── data.ts                       shared types and formatters
middleware.ts                     sends signed-out visitors to /login
```

Tech: Next.js 15 (App Router, server actions), TypeScript, Tailwind CSS, PostgreSQL (Supabase, or embedded PGlite locally), `zod`, `qrcode`, lucide-react.

## Roadmap

- Paid / unpaid lists from a class or member list
- One-tap and scheduled reminders (WhatsApp, SMS)
- Payouts to the organiser's bank account through Paga's Business API
- Email verification and password reset
