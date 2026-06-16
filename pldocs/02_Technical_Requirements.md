# PayLoop — Technical Requirements Document
**Eldohub Web3 Hackathon 2026**
Version 1.0

---

## 1. System Architecture Overview

```
┌─────────────────────────────────────────────────┐
│              USER LAYER                          │
│   🖥️  Next.js 14 Web Dashboard (Priority 1)     │
│   📱  React Native Expo Mobile (Priority 2)      │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│         🦊 METAMASK WALLET LAYER                │
│  wagmi v2 + viem + WalletConnect v2             │
│  Network: Polygon Amoy Testnet                  │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│        ⛓️  POLYGON BLOCKCHAIN LAYER              │
│  CircleVault.sol   LendingPool.sol              │
│  CreditScore.sol   LoopToken.sol (ERC-20)       │
└──────┬──────────────────────────┬───────────────┘
       │                          │
       ▼                          ▼
┌─────────────┐     ┌─────────────────────────────┐
│ IPFS/Pinata │     │   🐍 Django Backend API      │
│ Receipts    │     │   PostgreSQL Database        │
└─────────────┘     │   M-Pesa Daraja API          │
                    │   Firebase FCM (push alerts) │
                    └─────────────────────────────┘
```

---

## 2. Tech Stack

| Layer | Technology | Version | Notes |
|---|---|---|---|
| Web Frontend | Next.js | 14 | App Router, Tailwind CSS |
| Styling | Tailwind CSS | 3.x | Dark theme preferred |
| Charts | Recharts | latest | For vault/contribution charts |
| Wallet | MetaMask + wagmi | v2 | Primary auth + signing |
| Web3 SDK | ethers.js / viem | v6 / latest | Contract interactions |
| Mobile Wallet | WalletConnect | v2 | For React Native later |
| Smart Contracts | Solidity | ^0.8.20 | Hardhat dev environment |
| Contract Library | OpenZeppelin | latest | Ownable, ERC-20 base |
| Blockchain | Polygon Amoy Testnet | — | Free test MATIC from faucet |
| Backend | Django + DRF | 4.x | REST API |
| Database | PostgreSQL | 15+ | Replaces Firebase Firestore |
| M-Pesa | Safaricom Daraja API | v2 | STK Push + C2B callback |
| IPFS | Pinata SDK | latest | Receipt pinning |
| Push Notifications | Firebase FCM | — | Only this part uses Firebase |
| Deployment (web) | Vercel | — | Free tier |
| Deployment (backend) | Railway.app | — | Free tier |
| Tunnel (dev) | ngrok | — | For Daraja callback in dev |

---

## 3. Smart Contracts

### 3.1 CircleVault.sol
```
Purpose: Group savings vault
Functions:
  - contribute()             — payable, records contribution, emits event
  - getBalance()             — returns total vault balance
  - getContribution(address) — returns a member's total contributions
  - addMember(address)       — admin only (Ownable)
  - removeMember(address)    — admin only
  - withdraw(amount, to)     — multi-sig required (min 2 admin signatures)

Events:
  - Contributed(address member, uint256 amount, uint256 timestamp)
  - MemberAdded(address member)
  - MemberRemoved(address member)
  - Withdrawn(address to, uint256 amount)
```

### 3.2 LendingPool.sol
```
Purpose: Loan requests, voting, disbursement
Functions:
  - requestLoan(amount, reason, repaymentDays) — creates pending loan
  - vote(loanId, approve)                      — member casts vote
  - disburseLoan(loanId)                       — auto-triggered on majority
  - repayLoan(loanId)                          — payable, marks repaid
  - getLoan(loanId)                            — returns loan details

Events:
  - LoanRequested(uint loanId, address borrower, uint256 amount)
  - Voted(uint loanId, address voter, bool approved)
  - LoanDisbursed(uint loanId, address borrower, uint256 amount)
  - LoanRepaid(uint loanId, address borrower)
```

### 3.3 CreditScore.sol
```
Purpose: On-chain credit reputation per wallet
Functions:
  - getScore(address)         — returns score out of 1000
  - recordContribution(address, onTime) — called by CircleVault
  - recordRepayment(address)            — called by LendingPool
  - recordMissed(address)               — called by backend scheduler

Scoring Logic:
  +10 on-time contribution
  -20 missed contribution
  +15 loan fully repaid
  Score floor: 0, ceiling: 1000
```

### 3.4 LoopToken.sol
```
Purpose: ERC-20 reward token
Base: OpenZeppelin ERC20 + Ownable
Functions:
  - mint(address, amount)  — owner only, called on on-time contribution
  - burn(address, amount)  — optional penalty mechanic
  - Standard ERC-20: transfer, approve, balanceOf, etc.

Token Details:
  Name: LoopPoints
  Symbol: LOOP
  Decimals: 18
  Initial supply: 0 (minted on demand)
```

---

## 4. Django Backend API

### 4.1 Apps / Modules
```
payloop_backend/
├── apps/
│   ├── accounts/     — wallet-based auth, JWT
│   ├── circles/      — group metadata, member management
│   ├── mpesa/        — STK Push, callback, payment records
│   ├── notifications/— Firebase FCM push alerts
│   └── ipfs/         — Pinata upload, receipt management
├── payloop_backend/
│   ├── settings.py
│   ├── urls.py
│   └── wsgi.py
├── manage.py
└── requirements.txt
```

### 4.2 API Endpoints

#### Auth
```
POST /api/auth/verify-wallet/
  Body: { wallet_address, signature, message }
  Returns: { access_token, refresh_token, user_profile }

POST /api/auth/refresh/
  Body: { refresh_token }
  Returns: { access_token }
```

#### Circles
```
GET    /api/circles/                    — list all circles
POST   /api/circles/                    — create circle (admin only)
GET    /api/circles/{id}/               — circle detail
PUT    /api/circles/{id}/               — update circle
GET    /api/circles/{id}/members/       — list members
POST   /api/circles/{id}/members/       — add member
DELETE /api/circles/{id}/members/{addr}/— remove member
GET    /api/circles/{id}/contributions/ — contribution history
GET    /api/circles/{id}/loans/         — loan list
```

#### M-Pesa
```
POST /api/mpesa/stkpush/
  Body: { phone_number, amount, circle_id, wallet_address }
  Returns: { checkout_request_id, response_description }

POST /api/mpesa/callback/
  (Safaricom hits this — not called by frontend)
  Verifies payment → calls CircleVault.sol contribute()
```

#### Credit Score
```
GET /api/score/{wallet_address}/
  Returns: { score, history, rank }
```

#### IPFS
```
POST /api/ipfs/pin/
  Body: { receipt_data }
  Returns: { ipfs_hash, gateway_url }
```

### 4.3 Python Dependencies
```
django>=4.2
djangorestframework
djangorestframework-simplejwt
django-cors-headers
psycopg2-binary
web3
requests
firebase-admin
python-dotenv
gunicorn
```

---

## 5. PostgreSQL Database Schema

*(See separate Database Schema document)*

---

## 6. Next.js Frontend Structure

```
payloop-web/
├── app/
│   ├── page.tsx              — landing + MetaMask connect
│   ├── dashboard/
│   │   └── page.tsx          — group overview, vault balance, charts
│   ├── circles/
│   │   ├── create/page.tsx   — create new circle
│   │   └── [id]/page.tsx     — circle detail
│   ├── loans/
│   │   └── page.tsx          — loan requests + voting
│   ├── score/
│   │   └── page.tsx          — CreditLoop Score display
│   ├── members/
│   │   └── page.tsx          — member management
│   └── transparency/
│       └── [id]/page.tsx     — public page (no auth)
├── components/
│   ├── ConnectWallet.tsx
│   ├── ContributeModal.tsx
│   ├── LoanRequestForm.tsx
│   ├── CreditScoreCard.tsx
│   ├── VaultChart.tsx
│   └── MemberList.tsx
├── lib/
│   ├── wagmi.ts              — wagmi config
│   ├── contracts.ts          — ABI + contract addresses
│   └── api.ts                — Django backend calls
└── hooks/
    ├── useCircleVault.ts
    ├── useLendingPool.ts
    └── useCreditScore.ts
```

### 6.1 Key npm Packages
```
wagmi@2
viem
@rainbow-me/rainbowkit   — beautiful wallet connect UI (optional but fast)
ethers@6
tailwindcss
recharts
axios
react-query              — data fetching + caching
jspdf                    — PDF export
react-qr-code            — QR code generation
```

---

## 7. Environment Variables

### Next.js (.env.local)
```
NEXT_PUBLIC_POLYGON_RPC_URL=https://rpc-amoy.polygon.technology
NEXT_PUBLIC_CIRCLE_VAULT_ADDRESS=0x...
NEXT_PUBLIC_LENDING_POOL_ADDRESS=0x...
NEXT_PUBLIC_CREDIT_SCORE_ADDRESS=0x...
NEXT_PUBLIC_LOOP_TOKEN_ADDRESS=0x...
NEXT_PUBLIC_API_URL=https://your-backend.railway.app
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_id
```

### Django (.env)
```
SECRET_KEY=your_django_secret
DEBUG=False
DATABASE_URL=postgresql://user:pass@host:5432/payloop
DARAJA_CONSUMER_KEY=
DARAJA_CONSUMER_SECRET=
DARAJA_SHORTCODE=
DARAJA_PASSKEY=
DARAJA_CALLBACK_URL=https://your-backend.railway.app/api/mpesa/callback/
BACKEND_WALLET_PRIVATE_KEY=   # server wallet that calls contracts
POLYGON_RPC_URL=https://rpc-amoy.polygon.technology
CIRCLE_VAULT_ADDRESS=0x...
PINATA_API_KEY=
PINATA_SECRET_API_KEY=
FIREBASE_SERVICE_ACCOUNT_JSON=
```

---

## 8. Security Requirements

- Never commit `.env` files to GitHub — use `.gitignore`
- Backend wallet private key stored only in environment variables, never in code
- Daraja callback URL must verify `MerchantRequestID` to prevent fake callbacks
- JWT tokens expire in 24 hours, refresh tokens in 7 days
- All API endpoints (except `/api/mpesa/callback/` and `/api/circles/{id}/transparency/`) require authentication
- Smart contracts use OpenZeppelin `Ownable` for admin-only functions
- Use `require()` statements in contracts to enforce all business rules

---

## 9. Deployment Checklist

| Item | Service | Free Tier |
|---|---|---|
| Next.js web dashboard | Vercel | Yes |
| Django backend | Railway.app | Yes |
| PostgreSQL database | Railway.app (included) | Yes |
| Smart contracts | Polygon Amoy Testnet | Yes (free MATIC) |
| IPFS pinning | Pinata | Yes (1GB) |
| Push notifications | Firebase FCM | Yes |
| Domain (optional) | Vercel subdomain | Yes |
