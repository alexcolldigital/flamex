# FlameX Mobile

Expo-based user frontend for the `flamex-backend` API.

## Start

```bash
npm install
npm run web
```

Optional API override:

```bash
set EXPO_PUBLIC_API_URL=https://flamex-backend.onrender.com
```

## Render deployment

This Expo app should be deployed on Render as a `Static Site`, not a `Web Service`.

Use these settings:

```bash
Build Command: npm install && npm run build:web
Publish Directory: dist
```

If Render tries to start `node_modules/expo/AppEntry.js`, it means the service was created as a Node server and is attempting to run the Expo entrypoint directly. That causes errors like `ERR_MODULE_NOT_FOUND` for Expo internals such as `registerRootComponent`.

## Backend features exposed in the UI

- Wallet summary, balances, transaction history, saved bank accounts
- Crypto receive addresses and NGN deposit instructions
- NGN and crypto withdrawals
- P2P offer creation, marketplace browsing, escrow order tracking, and dispute initiation
- Swap quotes, execution, and recent history
- Virtual card creation, funding, and freeze/unfreeze
- Live price boards and NGN rate display
- Bill payments, bill history, and receipt-style transaction details
- Backend notifications for credits, debits, bills, and security events

## Validation

This frontend was validated with:

```bash
npx expo export --platform web
```

## Current production gaps

The mobile build is validated, but true production readiness still depends on live backend/provider behavior. In particular:

- KYC is not yet provider-verified end to end.
- Email OTP and PIN reset APIs exist, but they still need dedicated in-app UX surfaces if you want those flows visible to users without support intervention.
- Notification delivery depends on SMTP/provider configuration in the deployed backend.
