# PayLoop — Implementation Plan
**Hackathon Build Sequence (Web-First)**
Version 1.0

---

## Guiding Principle

> Build in dependency order. Smart contracts first because the frontend and backend both depend on the contract addresses. Web dashboard second (your priority). Backend M-Pesa bridge last (most complex, least critical for core demo).

---

## Phase 0: Pre-Hackathon Setup (Do Before Day 1)

Everyone does this before the hackathon starts:

- [ ] Install Node.js v18+, Git, VS Code
- [ ] Install MetaMask browser extension → create a wallet → save seed phrase safely
- [ ] Add Polygon Amoy Testnet to MetaMask (via chainlist.org)
- [ ] Get free test MATIC from faucet.polygon.technology
- [ ] Create GitHub account (if you don't have one)
- [ ] Create accounts: Vercel, Railway.app, Pinata, Safaricom Developer Portal
- [ ] Install Python 3.11+, pip, PostgreSQL locally
- [ ] Clone the team repo and confirm everyone can push

---

## Phase 1: Smart Contracts (Hours 0–8)
**Owner: Vincent + 1 team member**

### Hour 0–2: Environment
```bash
mkdir payloop-contracts && cd payloop-contracts
npm init -y
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox
npm install @openzeppelin/contracts
npx hardhat init   # choose "TypeScript project"
```

### Hour 2–5: Write Contracts in Remix IDE
1. Open remix.ethereum.org
2. Write and test `LoopToken.sol` first (simplest — just ERC-20)
3. Write `CircleVault.sol` — test contribute() in Remix VM
4. Write `CreditScore.sol` — test getScore() returns correctly
5. Write `LendingPool.sol` — test requestLoan() + vote()

### Hour 5–7: Deploy to Amoy Testnet
```bash
# hardhat.config.ts — add Amoy network
networks: {
  amoy: {
    url: "https://rpc-amoy.polygon.technology",
    accounts: [process.env.PRIVATE_KEY]
  }
}

npx hardhat run scripts/deploy.ts --network amoy
```

Save all 4 contract addresses — paste them into a `contracts.config.ts` file immediately.

### Hour 7–8: Verify on Polygonscan
- Go to amoy.polygonscan.com
- Verify each contract source code
- Share Polygonscan links with the full team

**Deliverable:** 4 deployed, verified contracts with addresses saved ✓

---

## Phase 2: Next.js Web Dashboard (Hours 8–28)
**Owner: Vincent + 2 frontend team members**

### Hour 8–10: Project Bootstrap
```bash
npx create-next-app@latest payloop-web --typescript --tailwind --app
cd payloop-web
npm install wagmi viem @rainbow-me/rainbowkit ethers@6
npm install axios react-query recharts react-qr-code jspdf
```

Set up wagmi config in `lib/wagmi.ts` with Polygon Amoy chain.

### Hour 10–12: MetaMask Connect (MOST IMPORTANT — DO THIS FIRST)
- Build `ConnectWallet.tsx` component
- Test: connect MetaMask, read wallet address, display it
- Add network detection — warn if not on Polygon Amoy
- Wire wallet address to `POST /api/auth/verify-wallet/` (mock this endpoint first with a hardcoded JWT if backend isn't ready)

### Hour 12–15: Landing Page + Dashboard Shell
- Landing page: hero text + Connect MetaMask button
- After connect: redirect to `/dashboard`
- Dashboard shell: sidebar nav (Dashboard, Circles, Loans, Score, Members)
- Layout, dark theme, Tailwind styling

### Hour 15–18: Circle Creation + Vault Display
- `/circles/create` — form (name, amount, frequency)
- On submit: call `CircleVault.sol` deploy via wagmi (or a factory pattern)
- Save metadata to backend `POST /api/circles/`
- Dashboard: show vault balance by calling `CircleVault.getBalance()`
- VaultChart component using Recharts

### Hour 18–21: Contribution Flow
- Contribute modal: enter amount → calls `CircleVault.contribute()` via wagmi
- MetaMask popup fires, user confirms
- Listen for `Contributed()` event, update balance in real time
- Show contribution history list

### Hour 21–24: Loan Request + Voting
- `/loans` page — list all loan requests from `LendingPool.sol`
- Loan Request form modal — calls `requestLoan()`
- Vote buttons (Approve / Reject) — calls `vote(loanId, bool)`
- Status badge: Pending / Approved / Rejected / Disbursed

### Hour 24–26: CreditLoop Score Page
- Read `CreditScore.getScore(walletAddress)` — no gas, instant
- Score card with colour indicator (red/yellow/green)
- Score breakdown: on-time, missed, repaid counts
- QR code using `react-qr-code` linking to Polygonscan

### Hour 26–27: Transparency Page
- `/transparency/[id]` — public, no auth required
- Reads from both blockchain (totals) and backend API (circle name, description)
- Deploy to Vercel: `vercel deploy`

### Hour 27–28: Polish + Bug Fix
- Error states (wrong network, rejected tx, MetaMask not installed)
- Loading spinners on all async operations
- Toast notifications for success/error
- Responsive layout check

**Deliverable:** Fully working web dashboard deployed on Vercel ✓

---

## Phase 3: Django Backend (Hours 8–22, Parallel with Frontend)
**Owner: Backend team of 2**

### Hour 8–10: Django Setup
```bash
pip install django djangorestframework djangorestframework-simplejwt \
  django-cors-headers psycopg2-binary web3 requests firebase-admin \
  python-dotenv gunicorn

django-admin startproject payloop_backend
cd payloop_backend
python manage.py startapp accounts
python manage.py startapp circles
python manage.py startapp mpesa
python manage.py startapp notifications
python manage.py startapp ipfs_receipts
```

### Hour 10–13: Models + Auth
- Define all models from the Database Schema document
- `python manage.py makemigrations && python manage.py migrate`
- Implement wallet-based JWT auth (verify MetaMask signature using web3.py)
- Test: POST /api/auth/verify-wallet/ returns a JWT token

### Hour 13–17: Core API Endpoints
- GET/POST /api/circles/ — CRUD
- GET /api/circles/{id}/members/ — member list
- GET /api/circles/{id}/contributions/ — from blockchain via web3.py event logs
- GET /api/score/{wallet}/ — read from CreditScore.sol

### Hour 17–21: M-Pesa STK Push
```
This is the hardest part. Follow this order:
1. Register on developer.safaricom.co.ke → get sandbox credentials
2. Set up ngrok: ngrok http 8000 → copy the HTTPS URL
3. Set DARAJA_CALLBACK_URL to ngrok URL in .env
4. Implement POST /api/mpesa/stkpush/
5. Implement POST /api/mpesa/callback/
6. Test with Daraja sandbox (use test phone numbers from Safaricom docs)
7. After callback confirms: call CircleVault.contribute() via web3.py
```

### Hour 21–22: Deploy to Railway
```bash
railway login
railway init
railway up
```
Update NEXT_PUBLIC_API_URL in Vercel env vars with the Railway URL.

**Deliverable:** Django API running on Railway with M-Pesa STK Push working ✓

---

## Phase 4: Integration + Testing (Hours 28–36)

### Hour 28–30: Wire Frontend to Backend
- Replace all mock API calls with real Django endpoints
- Test auth flow end-to-end (MetaMask connect → JWT → protected routes)
- Test circle creation saves to both blockchain and DB

### Hour 30–33: Full Flow Test with 3 Wallets
Use 3 different MetaMask wallets (borrow laptops/phones from teammates):
```
Wallet 1: Admin — creates circle, adds Wallet 2 and 3 as members
Wallet 2: Member — makes a contribution, requests a loan
Wallet 3: Member — votes to approve Wallet 2's loan
Wallet 2: Checks CreditLoop Score — should show points from contribution
```

### Hour 33–35: Demo Prep
- Seed fixture data so dashboard looks populated (not empty)
- Record a 2-minute backup demo video (in case of live demo issues)
- Practice the demo flow 5+ times as a team
- Clean up GitHub README: add project description, screenshots, setup instructions

### Hour 35–36: Final Deploy
- Verify all contracts on Polygonscan Amoy
- Push final code to GitHub (public repo)
- Confirm Vercel deployment is live
- Confirm Railway backend is live

---

## Phase 5: Pitch Prep (Hours 36–48)

- [ ] Story: "Meet Mama Wanjiku — she's in a chama and this is her problem"
- [ ] Slides: Problem → Solution → Live Demo → Tech Stack → Team → Impact
- [ ] Demo script: each team member owns one part of the live demo
- [ ] Judging criteria answers prepared for Q&A
- [ ] Backup video ready on phone

---

## Risk Register

| Risk | Likelihood | Mitigation |
|---|---|---|
| M-Pesa callback fails | Medium | Mock the callback with Postman for demo; show STK Push triggering as proof |
| MetaMask popup issues on demo laptop | Medium | Have 3 tested laptops ready, use backup video |
| Polygon Amoy testnet slow | Low | Test transactions pre-demo, have txHash screenshots ready |
| Team member blocked on task | High | Vincent unblocks — everyone uses Claude for code help |
| Backend not ready in time | Medium | Frontend mocks API calls; demo works without backend |

---

## Mobile App (Post-Hackathon / Bonus)

If time permits after Phase 4:
```bash
npx create-expo-app payloop-mobile
cd payloop-mobile
npm install @walletconnect/react-native-dapp ethers@6 expo-camera
```

Screens to build (in order):
1. Onboarding / WalletConnect QR
2. Home (vault balance, next due date)
3. Contribute screen
4. My Credit Score screen
5. Loan Request form
