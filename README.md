# MoneyTrack

A responsive personal money tracker with multi-user accounts and cloud synchronization.

## Included features
- Multiple user accounts with Supabase Auth
- Cloud database storage (Postgres)
- Data available from different devices after logging in
- Add income / money in
- Add expenses / money out
- Delete transactions
- Automatic persistence: every add/delete is immediately saved to the database
- Total balance
- Monthly income and expense totals
- Savings rate
- Spending by category
- Search and filters
- CSV export
- Six-month cash-flow analytics
- Dark mode
- Mobile-friendly layout
- Row-level security so users only access their own transactions

## Setup

1. Create a free Supabase project.
2. Open the Supabase SQL Editor and run `supabase.sql`.
3. In Supabase, copy your Project URL and anon/public key.
4. Open `app.js` and replace:
   SUPABASE_URL = "YOUR_SUPABASE_URL";
   SUPABASE_ANON_KEY = "YOUR_SUPABASE_ANON_KEY";
5. Open `index.html` through a web server (for example VS Code Live Server), or deploy the folder to a static host.
6. Create an account and start tracking.

### Important
Do NOT put a Supabase service-role/secret key in this frontend. The browser should only use the public anon key. The SQL policies protect each user's rows.

## Suggested next upgrades
- Recurring income/expenses
- Budgets and budget alerts
- Savings goals
- Multiple wallets/accounts (cash, bank, e-wallet)
- Edit existing transactions
- Attach receipts
- PIN/biometric lock on mobile apps
- PWA/offline mode
- Realtime synchronization between open devices
- Data import
