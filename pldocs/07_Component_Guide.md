# PayLoop — Complete Component & Architecture Guide
**Version 1.0 — Every file explained**

---

## Table of Contents

1. [Smart Contracts](#1-smart-contracts)
2. [Frontend Config & Libraries](#2-frontend-config--libraries)
3. [Custom Hooks](#3-custom-hooks)
4. [UI Components](#4-ui-components)
5. [Pages](#5-pages)
6. [Data Flow](#6-data-flow)
7. [Deployment Pipeline](#7-deployment-pipeline)

---

## 1. Smart Contracts

All contracts use Solidity ^0.8.20 and OpenZeppelin's `Ownable` for admin access control. Compiled with Hardhat 3.

### 1.1 CircleVault.sol
**Location:** `contracts/contracts/CircleVault.sol`
**Purpose:** The "bank account" for a chama savings group. Holds MATIC deposits.

**How it works:**
- The contract is deployed with an `admin` address (the circle creator)
- The admin calls `addMember(address)` to whitelist members
- Members call `contribute()` with MATIC attached — this is a `payable` function
- The contract tracks each member's cumulative contributions via `mapping(address => uint256) contributions`
- `totalVault` tracks the sum of all contributions
- Only the admin can `withdraw(amount, to)` — this is the "treasurer" function, but on-chain so it's transparent
- `isMember` mapping prevents non-members from contributing
- `removeMember()` swaps the member with the last array element and pops — gas-efficient removal

**Key events:**
- `Contributed(member, amount, timestamp)` — frontend listens to this to update the dashboard in real-time
- `MemberAdded(member)` / `MemberRemoved(member)` — for member management UI

**Security:**
- `onlyOwner` modifier on admin functions (from OpenZeppelin)
- `onlyMember` custom modifier on `contribute()`
- `require(msg.value > 0)` prevents zero-value contributions
- `receive()` function lets the contract accept direct MATIC transfers (needed for the M-Pesa bridge backend)

---

### 1.2 LendingPool.sol
**Location:** `contracts/contracts/LendingPool.sol`
**Purpose:** Manages the full lifecycle of loans — request → vote → disburse → repay.

**How it works:**
1. A member calls `requestLoan(amount, reason, repaymentDays)` — this creates a `Loan` struct with status `Pending`
2. Other members call `vote(loanId, approved)` — each member can only vote once per loan (`hasVoted` mapping)
3. When `votesFor > totalMembers / 2`, the loan auto-approves (status → `Approved`)
4. When `votesAgainst > totalMembers / 2`, it auto-rejects (status → `Rejected`)
5. Admin calls `disburseLoan(loanId)` — sends MATIC to the borrower (status → `Disbursed`)
6. Borrower calls `repayLoan(loanId)` with MATIC attached — must repay full amount (status → `Repaid`)

**Loan struct fields:**
```
id, borrower, amount, reason, repaymentDays,
votesFor, votesAgainst, status, createdAt, disbursedAt, repaidAt
```

**Status enum:** `Pending(0) → Approved(1) / Rejected(2) → Disbursed(3) → Repaid(4)`

**Important:** `totalMembers` must be set by the admin via `setTotalMembers()` — this is synced from CircleVault's member count. The frontend should call this when members are added/removed.

**Security:**
- Borrowers cannot vote on their own loan
- Each voter can only vote once per loan
- Only the borrower can repay their own loan
- Excess repayment is refunded automatically

---

### 1.3 CreditScore.sol
**Location:** `contracts/contracts/CreditScore.sol`
**Purpose:** Permanent, tamper-proof credit reputation for each wallet.

**How it works:**
- Every wallet starts at `INITIAL_SCORE = 500` (initialized lazily on first interaction)
- `recordContribution(wallet, onTime)` — called by the backend or admin:
  - `onTime = true`: score += 10 (capped at 1000)
  - `onTime = false`: score -= 20 (floored at 0)
- `recordRepayment(wallet)` — score += 15 (capped at 1000)
- `recordMissed(wallet)` — shortcut for `recordContribution(wallet, false)`

**ScoreData struct:**
```
score, onTimeCount, missedCount, repaidCount, lastUpdated
```

**View functions:**
- `getScore(wallet)` — returns just the number (gas-free read)
- `getScoreData(wallet)` — returns full breakdown (for the Score page UI)

**Why on-chain?** This is the key innovation — the score is public, verifiable, and portable. A user's credit history follows their wallet address across any DeFi platform that reads this contract.

**Security:** Only the contract owner (backend wallet) can modify scores. Users can read but never write their own scores.

---

### 1.4 LoopToken.sol
**Location:** `contracts/contracts/LoopToken.sol`
**Purpose:** ERC-20 reward token ("LoopPoints" / LOOP).

**How it works:**
- Inherits OpenZeppelin's `ERC20` and `Ownable`
- Zero initial supply — tokens are minted on demand
- `mint(to, amount)` — owner-only, called when a member contributes on time
- `burn(from, amount)` — owner-only, optional penalty mechanic
- Standard ERC-20 functions: `transfer`, `balanceOf`, `approve`, `transferFrom`

**Why:** Gamification — members earn LOOP tokens for good behavior. These appear in their MetaMask wallet as a visible reward.

---

### 1.5 hardhat.config.js
**Location:** `contracts/hardhat.config.js`

Uses ESM (`import`) syntax required by Hardhat 3. Configures:
- `solidity: "0.8.20"` with optimizer enabled (200 runs)
- `networks.hardhat` — local testing (`type: "edr-simulated"`)
- `networks.amoy` — Polygon Amoy Testnet (`type: "http"`, chainId 80002)
- Private key loaded from `.env` via `dotenv/config`

### 1.6 scripts/deploy.js
Deploys all 4 contracts in dependency order:
1. LoopToken (standalone)
2. CreditScore (standalone)
3. CircleVault (standalone)
4. LendingPool (needs CircleVault address as constructor arg)

Prints all 4 addresses at the end — copy these into `web/.env.local`.

---

## 2. Frontend Config & Libraries

### 2.1 lib/wagmi.ts
**Purpose:** Configures the wagmi Web3 library with the Polygon Amoy chain.

**How it works:**
- Defines `polygonAmoy` chain using `defineChain()` from viem — chainId 80002, MATIC native currency
- Creates a wagmi `config` with HTTP transport
- RPC URL comes from `NEXT_PUBLIC_POLYGON_RPC_URL` env var
- TypeScript module augmentation registers the config type globally

**Why not use wagmi's built-in chains?** Polygon Amoy may not be in the default chain list, so we define it explicitly to guarantee compatibility.

---

### 2.2 lib/contracts.ts
**Purpose:** Single source of truth for all contract ABIs and addresses.

**How it works:**
- Exports 4 address constants, all read from `NEXT_PUBLIC_*` env vars
- Exports 4 ABI arrays (`as const` for TypeScript type safety with wagmi)
- ABIs are hand-written from the Solidity source — no build dependency on `npx hardhat compile`

**Key rule:** Contract addresses NEVER appear as hardcoded strings — always from env vars. This is critical for switching between local/testnet/mainnet.

**ABI structure:** Each ABI entry describes a function or event:
```typescript
{
  inputs: [...],       // function parameters
  name: "contribute",  // function name
  outputs: [...],      // return values
  stateMutability: "payable" | "view" | "nonpayable",
  type: "function" | "event" | "constructor"
}
```

---

### 2.3 lib/api.ts
**Purpose:** Wrapper for all Django backend REST API calls.

**How it works:**
- `apiFetch<T>(endpoint, options)` — generic fetch wrapper that:
  - Prepends `NEXT_PUBLIC_API_URL` to the endpoint
  - Adds `Authorization: Bearer <token>` header if JWT is provided
  - Parses JSON response
  - Throws on non-2xx status with the error detail
- Exports typed functions for each endpoint: `verifyWallet()`, `getCircles()`, `createCircle()`, etc.
- Exports TypeScript interfaces: `Circle`, `LoanRequest`

**Used by:** The frontend pages when the Django backend is live. Currently the app reads directly from blockchain via wagmi hooks, so this module is ready but unused until Phase 3.

---

### 2.4 lib/utils.ts
**Purpose:** Pure utility functions used across all components.

| Function | What it does |
|----------|-------------|
| `truncateAddress("0x1234...abcd")` | Shortens wallet addresses for display |
| `formatMatic(wei)` | Converts wei (bigint) to human-readable MATIC string |
| `formatTimestamp(seconds)` | Converts Unix timestamp to "Jun 16, 2026, 2:30 PM" format |
| `loanStatusLabel(0)` → "Pending" | Maps enum int to readable status |
| `loanStatusColor(0)` → "text-amber-400" | Maps status to Tailwind color class |
| `scoreColor(750)` → "text-emerald-400" | Green ≥701, Yellow ≥401, Red <401 |
| `scoreGradient(750)` | Returns gradient CSS classes for the score ring |
| `scoreLabel(750)` → "Excellent" | Human-readable score tier |

---

### 2.5 components/Providers.tsx
**Purpose:** Wraps the entire app in wagmi + TanStack Query providers.

**How it works:**
- Must be a `"use client"` component (providers use React context)
- Creates a `QueryClient` with `useState` to avoid re-creation on re-renders
- `staleTime: 10_000` — blockchain reads are cached for 10 seconds
- `refetchOnWindowFocus: false` — prevents unnecessary RPC calls when switching tabs

**Architecture note:** This is a Next.js App Router pattern — server components can't use providers, so we wrap them in a client boundary component imported by `layout.tsx`.

---

### 2.6 app/globals.css
**Purpose:** The entire design system — colors, glass effects, animations.

**Key CSS classes:**

| Class | What it does |
|-------|-------------|
| `.glass-card` | Glassmorphism card: blurred backdrop, subtle border, hover glow |
| `.gradient-text` | Purple-to-teal gradient text (used for "PayLoop" branding) |
| `.btn-glow` | Primary button: gradient background, hover lift + glow shadow |
| `.btn-outline` | Secondary button: transparent with purple border |
| `.sidebar-link` / `.sidebar-link.active` | Nav items with active state highlight |
| `.input-field` | Styled input with focus ring |
| `.stat-glow-purple/teal/blue/amber` | Coloured inner glow on stat cards |
| `.modal-backdrop` | Dark overlay with blur for modals |
| `.score-ring` | Container for the SVG circular gauge |
| `.bg-mesh` | Subtle radial gradient background pattern |
| `.animate-fade-in-up` | Entry animation (opacity + translateY) |
| `.animate-fade-in-up-delay-1/2/3` | Staggered entry animations |
| `.animate-shimmer` | Loading skeleton shimmer effect |

---

## 3. Custom Hooks

### 3.1 hooks/useCircleVault.ts
Wraps all CircleVault.sol interactions via wagmi's `useReadContract` and `useWriteContract`.

| Hook | Type | Contract Function | Returns |
|------|------|------------------|---------|
| `useVaultBalance()` | Read | `getBalance()` | `bigint` — vault balance in wei |
| `useTotalVault()` | Read | `totalVault()` | `bigint` — cumulative total |
| `useMemberCount()` | Read | `getMemberCount()` | `bigint` — number of members |
| `useAllMembers()` | Read | `getAllMembers()` | `address[]` — all member wallets |
| `useContribution(addr)` | Read | `getContribution(addr)` | `bigint` — member's total deposits |
| `useIsMember(addr)` | Read | `isMember(addr)` | `boolean` |
| `useContribute()` | Write | `contribute()` | `{ contribute(amount), isPending, isConfirming, isSuccess, hash, error }` |
| `useAddMember()` | Write | `addMember(addr)` | `{ addMember(addr), isPending, isConfirming, isSuccess, hash, error }` |
| `useRemoveMember()` | Write | `removeMember(addr)` | Same pattern |

**Write hook pattern:** Every write hook returns:
- `isPending` — waiting for MetaMask confirmation
- `isConfirming` — transaction submitted, waiting for on-chain confirmation
- `isSuccess` — transaction confirmed
- `hash` — transaction hash (for PolygonScan link)
- `error` — error object if failed

---

### 3.2 hooks/useLendingPool.ts

| Hook | Type | Contract Function |
|------|------|------------------|
| `useLoanCount()` | Read | `getLoanCount()` |
| `useLoan(id)` | Read | `getLoan(id)` — returns full Loan struct |
| `useTotalMembers()` | Read | `totalMembers()` |
| `useRequestLoan()` | Write | `requestLoan(amount, reason, days)` |
| `useVoteLoan()` | Write | `vote(loanId, approved)` |
| `useRepayLoan()` | Write | `repayLoan(loanId)` with MATIC value |

---

### 3.3 hooks/useCreditScore.ts

| Hook | Type | Contract Function |
|------|------|------------------|
| `useCreditScore(addr)` | Read | `getScore(addr)` — returns `uint256` |
| `useCreditScoreData(addr)` | Read | `getScoreData(addr)` — returns `ScoreData` struct |

Both hooks use `query: { enabled: !!walletAddress }` — they won't fire until a wallet is connected.

---

## 4. UI Components

### 4.1 ConnectWallet.tsx
**Purpose:** The MetaMask connect/disconnect button shown in the navbar.

**State machine:**
```
No MetaMask installed → "Install MetaMask" link
MetaMask installed, not connected → "Connect Wallet" button
Connected, wrong network → "Switch to Amoy" warning button
Connected, correct network → Truncated address + "Disconnect" button
```

**Key logic:**
- `typeof window.ethereum !== "undefined"` — checks if MetaMask is injected
- `useConnect({ connector: injected() })` — connects via MetaMask's injected provider
- `useSwitchChain()` — prompts MetaMask to switch to Polygon Amoy
- Shows a green pulsing dot when connected (visual confirmation)

---

### 4.2 Sidebar.tsx
**Purpose:** Left sidebar navigation for all dashboard pages.

**How it works:**
- `navItems` array defines all 6 routes with labels, hrefs, and SVG icons
- `usePathname()` from Next.js detects the current route
- Active link gets `.sidebar-link.active` class (purple highlight)
- Matches both exact paths and child paths (`pathname.startsWith(item.href + "/")`)
- PayLoop logo in header, version info in footer

---

### 4.3 ContributeModal.tsx
**Purpose:** Modal for depositing MATIC into the CircleVault.

**Flow:**
1. User clicks "Contribute" → modal opens
2. User enters amount or clicks a quick-select button (0.01, 0.05, 0.1, 0.5)
3. User clicks "Contribute" → `useContribute()` hook fires
4. MetaMask popup appears → user confirms
5. Button shows "Confirm in MetaMask…" → "Confirming on-chain…" → toast "Success!"
6. PolygonScan link appears below the button
7. Modal closes, parent refetches vault balance

**Error handling:**
- Validates amount > 0 before submitting
- Shows toast with error message on failure
- All inputs disabled during pending/confirming states

---

### 4.4 LoanRequestForm.tsx
**Purpose:** Modal for submitting a loan request to LendingPool.

**Fields:**
- Amount (MATIC) — number input
- Reason — textarea
- Repayment period — 3 toggle buttons (7, 14, 30 days)

**Flow:** Same as ContributeModal — form → MetaMask → confirm → toast → close.

---

### 4.5 CreditScoreCard.tsx
**Purpose:** Animated circular gauge showing the credit score.

**How it works:**
- Reads score via `useCreditScore(walletAddress)` — gas-free blockchain read
- Reads breakdown via `useCreditScoreData(walletAddress)`
- Renders an SVG circle with `stroke-dasharray` and `stroke-dashoffset` to create an animated arc
- The arc colour changes based on score tier: green (≥701), yellow (≥401), red (<401)
- Uses SVG `<linearGradient>` for smooth colour transitions
- Below the ring: breakdown of on-time/missed/repaid counts

---

### 4.6 VaultChart.tsx
**Purpose:** Area chart showing vault balance growth over time.

**How it works:**
- Uses Recharts `<AreaChart>` with `<Area>` component
- Gradient fill from purple to transparent
- Custom dark-themed tooltip
- Currently uses demo data (6 months) — in production, this would be populated from blockchain event logs
- Reads live vault balance via `useVaultBalance()` and displays it above the chart

---

### 4.7 MemberList.tsx
**Purpose:** Displays all circle members with numbered badges and PolygonScan links.

**How it works:**
- Reads members via `useAllMembers()` — returns `address[]` from the contract
- Each member shown with a gradient avatar (numbered), truncated address, and "View →" link
- Empty state shown when no members exist

---

## 5. Pages

### 5.1 Landing Page (`app/page.tsx`)
- Shows hero text: "The chama treasurer that can never steal."
- Two CTAs: Connect Wallet + View Public Transparency
- Stats cards (4 contracts, 0-1000 score, Polygon network)
- **Auto-redirect:** When wallet connects, `useEffect` pushes to `/dashboard`
- Animated floating orbs in the background (CSS blur + pulse)

### 5.2 Dashboard (`app/dashboard/page.tsx`)
- **Not connected:** Shows "Connect Your Wallet" with MetaMask fox emoji
- **Connected:** 4 stat cards (Vault Balance, Members, Active Loans, Credit Score)
- Vault growth chart + personal contribution summary
- 3 quick action cards (Contribute, Request Loan, View Score)
- ContributeModal opens from two places (header button + quick action card)

### 5.3 Circles (`app/circles/page.tsx`)
- 3 stat cards (Vault Balance, Members, Loan Requests)
- Lists all 4 deployed contract addresses with PolygonScan links
- "Contribute" button in header

### 5.4 Loans (`app/loans/page.tsx`)
- Lists all loans from `LendingPool.getLoanCount()` and `getLoan(i)` in a loop
- Each `LoanCard` component shows: status badge, amount, reason, borrower, vote counts, timestamp
- **Approve/Reject buttons** — visible only for pending loans, hidden for the borrower
- **Repay button** — visible only for the borrower on disbursed loans
- Empty state when no loans exist

### 5.5 Credit Score (`app/score/page.tsx`)
- `CreditScoreCard` component with SVG ring gauge
- QR code (using `react-qr-code`) linking to the wallet's PolygonScan page
- Scoring rules explanation (visual cards: +10, -20, +15)
- "Connect Wallet" state when not connected

### 5.6 Members (`app/members/page.tsx`)
- Add member form (wallet address input + "Add Member" button)
- Lists all members with numbered badges
- "Remove" button on each member (except yourself)
- PolygonScan links for each member

### 5.7 Transparency (`app/transparency/page.tsx`)
- **Public page** — no auth required, no sidebar
- Reads vault balance, member count, loan count directly from blockchain
- "Verify On-Chain" section with contract address and PolygonScan link
- Standalone layout (own nav bar with "Public Page" badge)

---

## 6. Data Flow

### 6.1 Reading from Blockchain
```
Component → Custom Hook → wagmi useReadContract → viem → Polygon RPC → Contract
```
Example: Dashboard vault balance:
```
DashboardPage → useVaultBalance() → useReadContract({
  address: CIRCLE_VAULT_ADDRESS,
  abi: CIRCLE_VAULT_ABI,
  functionName: "getBalance"
}) → HTTP call to Polygon Amoy RPC → returns bigint
```

### 6.2 Writing to Blockchain
```
Component → Custom Hook → wagmi useWriteContract → MetaMask popup → Sign tx → Broadcast → Confirm
```
Example: Contributing MATIC:
```
ContributeModal → useContribute() → useWriteContract({
  address: CIRCLE_VAULT_ADDRESS,
  abi: CIRCLE_VAULT_ABI,
  functionName: "contribute",
  value: parseEther("0.01")
}) → MetaMask opens → User confirms → Tx broadcast → useWaitForTransactionReceipt → isSuccess=true
```

### 6.3 M-Pesa Bridge (Phase 3 — Django & PayHero)
```
Frontend → POST /api/mpesa/stkpush/ → Django → PayHero API → Safaricom → User's phone (STK Push)
User enters PIN → Safaricom → PayHero Webhook → POST /api/mpesa/callback/ → Django:
  1. Match callback external_reference with merchant_request_id in MpesaPayment
  2. If status is SUCCESS/COMPLETED, update payment status
  3. Convert KES to MATIC (1 KES = 0.000005 MATIC)
  4. Trigger CircleVault.contribute() on Polygon Amoy via web3.py signed by backend wallet
  5. Save contribution in the database with the resulting on-chain transaction hash
```

---

## 7. Deployment Pipeline

### 7.1 Smart Contracts → Polygon Amoy
```bash
cd contracts
cp .env.example .env  # Add PRIVATE_KEY
npx hardhat run scripts/deploy.js --network amoy
# Copy 4 addresses to web/.env.local
```

### 7.2 Frontend → Vercel
```bash
cd web
vercel deploy
# Set env vars in Vercel dashboard
```

### 7.3 Backend → Railway (Phase 3)
```bash
cd backend
source venv/bin/activate  # Or create: python3 -m venv venv
railway login && railway init && railway up
# Set env vars in Railway dashboard
```

---

## 8. Django Backend (Phase 3)

### 8.1 Project Structure
```
backend/
├── payloop/           # Django project config
│   ├── settings.py       # DB, CORS, JWT, M-Pesa, blockchain config
│   ├── urls.py           # Root URL routing
│   ├── wsgi.py / asgi.py
├── accounts/          # Wallet-based auth
│   ├── models.py         # Custom User (wallet_address as USERNAME_FIELD)
│   ├── managers.py       # WalletUserManager (set_unusable_password)
│   ├── serializers.py    # WalletAuthSerializer (eth_account signature verify)
│   ├── views.py          # verify_wallet() + health_check()
│   └── admin.py          # Custom UserAdmin
├── circles/           # Core savings circle logic
│   ├── models.py         # Circle, Membership, Contribution, LoanRequest
│   ├── serializers.py    # All 4 model serializers + nested UserSerializer
│   ├── views.py          # CircleViewSet + add_member + circle_loans + circle_contributions + credit_score_view
│   └── admin.py          # All 4 models registered
├── mpesa/             # M-Pesa payment integration
│   ├── models.py         # MpesaPayment (STK Push tracking)
│   ├── payhero_client.py # PayHero aggregator REST client
│   ├── daraja.py         # Direct Daraja API client (alternative)
│   ├── intasend_client.py# IntaSend client (alternative)
│   ├── serializers.py    # StkPushSerializer + MpesaPaymentSerializer
│   ├── views.py          # stk_push_view + payment_callback + payment_status
│   └── admin.py          # MpesaPayment admin
├── blockchain/        # On-chain interaction layer
│   ├── abi.py            # CircleVault ABI (minimal, for web3.py)
│   └── bridge.py         # KES→MATIC conversion + contribute() via web3.py
├── notifications/     # Push notification service
│   ├── models.py         # Notification model (FCM tracking)
│   ├── services.py       # send_push_notification() + helpers
│   └── admin.py          # Notification admin
└── venv/              # Python virtual environment
```

### 8.2 Authentication Flow
```
MetaMask → personal_sign(message) → Frontend sends {wallet, signature, message}
→ POST /api/auth/verify-wallet/
→ WalletAuthSerializer.validate():
    1. encode_defunct(text=message)
    2. Account.recover_message(msg, signature)
    3. Compare recovered address == wallet_address
→ User.objects.get_or_create(wallet_address=wallet)
→ RefreshToken.for_user(user) → {access_token, refresh_token}
```

### 8.3 Credit Score API (On-Chain Read)
The `credit_score_view` endpoint reads directly from the CreditScore.sol contract:
1. If `CREDIT_SCORE_ADDRESS` is set → tries `getScoreData(wallet)` on-chain
2. Falls back to `getScore(wallet)` if `getScoreData` fails
3. Returns `{"source": "default", "score": 500}` if contract not deployed

### 8.4 Notification System
`notifications/services.py` provides high-level notification functions:
- `notify_contribution_received(user, circle_name, amount)`
- `notify_loan_request(members, borrower_name, amount, circle_name)`
- `notify_loan_approved(user, amount, circle_name)`
- `notify_score_updated(user, new_score, reason)`

All functions record the notification in DB regardless of FCM availability.
If Firebase is not configured, notifications are logged but not delivered (graceful degradation).

---

*End of Component Guide — Version 2.0*
