# ⚡ HybridSolution — Electronic Parts Store

Next.js 14 + direct UPI payments (money goes straight to your UPI ID, zero commission).

## Quick start

```bash
npm install
npm run dev                  # http://localhost:3000
```

## Payments (UPI Direct)

1. Set your UPI details in `.env.local` (see `.env.example`):
   ```
   NEXT_PUBLIC_MERCHANT_UPI=mrslogen123@oksbi
   NEXT_PUBLIC_MERCHANT_PHONE=9633434839
   NEXT_PUBLIC_MERCHANT_NAME=HybridSolution
   ```
2. Checkout → customer scans QR / opens UPI app (GPay, PhonePe, Paytm) → pastes UTR → order recorded as paid.
3. Verify in your UPI app history against the UTR shown in Admin → Orders.

## Features
- Product catalog: search, category filter, sort (shared across devices)
- Cart with qty controls (per-device)
- Delivery address at checkout (validated, saved per order)
- Demo auth (name+email) + per-user purchase history with email / order-ID lookup
- Admin panel (password in `lib/store.tsx` + `lib/server-db.ts`): add/edit/delete products, manage orders
- Mobile hamburger menu
