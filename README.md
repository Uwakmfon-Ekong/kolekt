# Kolekt

**Group payments, minus the wahala.** Collect dues, levies and contributions with one link. Every payment is verified with **Paga** and matched to the right person. No screenshots, no spreadsheets.

Built for the **Tech Ignite '26 Shipathon: Build With Paga** · Made in Akwa Ibom.

---

## How it works

1. **Create.** An organiser (course rep, treasurer, event planner) signs up and creates a collection in four steps: details, fixed or flexible amount, the information contributors must give (name, matric number, phone…), then preview and publish.
2. **Share.** Kolekt gives the collection a public link and QR code, ready for WhatsApp.
3. **Pay.** A contributor opens the link, fills in the details and gets **their own one-time Paga account number** to transfer to from any bank app (or by USSD). No account, no app.
4. **Verify.** When the money lands, Paga notifies Kolekt. Kolekt checks the notification's signature, confirms the payment with Paga's ledger, and only then marks it paid. The contributor gets a receipt; the organiser sees the name, amount and time on their dashboard immediately.
5. **Withdraw.** The organiser saves a bank account (Paga confirms the account name) and withdraws what they've collected straight to it.

## Paga integration

Kolekt uses two Paga APIs:

| API | Used for | Code |
|---|---|---|
| **Collect API** | Receiving contributions: one-time account numbers, payment notifications, ledger checks | `lib/server/paga.ts` |
| **Business REST API** | Paying organisers and refunding contributors: bank list, account-name check, deposit to bank, payout status | `lib/server/paga-business.ts` |

### Receiving money (Collect API)

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

### Paying out (Business REST API)

```
Organiser picks a bank and types an account number
  └─▶ getBanks + validateDepositToBank      Paga returns the real account holder's name
  └─▶ organiser confirms with their password  the server re-checks the account with Paga, then saves it

Organiser withdraws from a collection
  └─▶ amount reserved under a row lock       can never pay out more than was collected, even with two tabs
  └─▶ depositToBank (with statusCallbackUrl)
Paga ──▶ POST /api/webhooks/paga-payout       x-paga-hash checked; status set to Paid or Failed
       (or "Check" in the app → getOperationStatus)
```

**Tested safety behaviour**

| Scenario | Result |
|---|---|
| Notification with a forged hash | Rejected with 401; the payment stays pending |
| Same notification delivered twice | Acknowledged both times, counted once |
| Same student tries to pay a fixed collection again after paying in full (even typing `csc 2021 014` vs `CSC/2021/014`) | Refused at checkout ("already paid the full amount") |
| Two open payment requests from the same student both get paid | The extra payment is flagged "Paid twice" for the organiser |
| Part payment larger than the student's remaining balance | Refused ("You have ₦3,500 left to pay") |
| Refunding more than a payment, more than what's left in the collection, or with the wrong password | Refused |
| "Check my payment" hammered with guesses | Limited to 20 checks per 10 minutes per visitor; names are shortened ("Blessing E.") |
| Deleting a collection that has received money | Refused; it can only be closed, so no payment record is lost |
| Browser lands on a success page | Never marks anything paid; only server-side verification does |
| Receipt or payment page for an unknown reference | 404 |
| Withdrawing more than the collection's balance | Refused |
| Saving a payout account with the wrong password, or an account Paga can't find | Refused |
| Payout notification with a missing or wrong hash | Rejected with 401 |
| Class list with a header row, serial numbers or a repeated person | Header and numbers ignored; the repeat is skipped |

## Features

**Organisers**
- Real accounts: sign up, log in, log out. Passwords are hashed with scrypt; sessions are random tokens in httpOnly cookies (only a SHA-256 of each token is stored).
- Dashboard with total collected, this week's total and active collections; notifications for new payments.
- Fixed or flexible collections, with optional minimum, target, deadline and "allow above target".
- **Part payments** on fixed collections: people pay in instalments, Kolekt tracks each person's balance, caps each payment at what they still owe, and shows "Paid so far / Balance" on every receipt.
- Contributor fields (matric number, department, level, or your own), each **required or optional**. Level is a dropdown and Department suggests common department names.
- **Contributors page:** one row per person (paid, part paid, not paid from the class list) with filters, search, a profile with every payment and receipt, a WhatsApp reminder showing their balance, and **Excel (.xlsx) or CSV export**.
- Collection overview: total collected, unique contributors, fully/part paid and outstanding balance. Dashboard totals include unique contributors and what's still owed.
- **Notifications page** for verified payments, possible repeat payments and withdrawals (paid, processing or failed), with unread markers.
- Delete a collection before anyone has paid (afterwards it can only be closed).
- **Refunds through Paga:** refund a repeat payment or an overpayment straight to the contributor's bank account from their profile. Paga confirms the account holder's name first, the organiser's password is required, and balances, receipts and notifications update.
- Collection page with every verified contribution, receipts, **CSV export**, WhatsApp sharing, a **QR code**, edit, close and reopen.
- **Class list (paid / unpaid):** paste or upload a list of names, matric numbers and phone numbers. Kolekt ticks people off as Paga confirms each payment, matching by ID even when it's typed differently (`csc 2021 014` vs `CSC/2021/014`) and falling back to the name. Unpaid, Paid and "Not on list" tabs, with search.
- **WhatsApp reminders:** one tap creates a group message listing who still owes, with the link and deadline. People with a phone number on the list get their own "Remind" button.
- **Live public progress:** the payment page shows "X of Y have paid" and recent contributors (first name and last initial, never amounts), and refreshes by itself. Organisers can hide the names.
- **Payouts:** a Paga-verified bank account (password required to change it) and one-tap withdrawals with a payout history.
- Reports across all collections, including what's been paid out.

**Contributors**
- No account and no app: name and details, then transfer.
- A one-time account number, plus USSD and Paga wallet options when Paga provides them.
- The page confirms the payment by itself, then shows a **verified receipt** (IDs and contact details partly hidden).
- **Check my payment:** type the matric number (or phone/email) you paid with to see what's been received, your balance, refunds and your receipts, or reopen a payment that's still waiting.

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
   For payouts, also add the Business API credentials (`PAGA_BUSINESS_PUBLIC_KEY`, `PAGA_BUSINESS_PASSWORD`, `PAGA_BUSINESS_HASH_KEY`). Paga asks you to whitelist your server's IP address for the Business API.
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
├── (app)/                        organiser screens: dashboard, collections (+ contributors), notifications, reports, profile
├── (flow)/collections/create/…   4-step create wizard → publish (app/actions/collections.ts)
├── (public)/c/[slug]/            public collection page → checkout (app/actions/checkout.ts)
├── pay/[reference]/              account number + live payment status
├── receipt/[reference]/          verified receipt
└── api/
    ├── webhooks/paga/            Paga payment notification endpoint
    ├── webhooks/paga-payout/     Paga deposit-to-bank (payout) notification endpoint
    ├── pay/[reference]/status/   payment status polling (re-checks Paga if needed)
    ├── collections/[id]/report/  CSV and Excel exports (payments or contributors)
    ├── auth/signout/             clears the session
    └── dev/simulate-transfer/    demo-mode transfer simulator
lib/
├── server/                       server-only: db, schema, auth, paga, paga-business, payments, payouts, collections
├── create-collection.tsx         client state: wizard draft (browser) + organiser data (from the server)
└── data.ts                       shared types and formatters
middleware.ts                     sends signed-out visitors to /login
```

Tech: Next.js 15 (App Router, server actions), TypeScript, Tailwind CSS, PostgreSQL (Supabase, or embedded PGlite locally), `zod`, `qrcode`, lucide-react.

## Roadmap

- Scheduled reminders (SMS and WhatsApp Business API)
- Email verification and password reset
