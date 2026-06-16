# PayLoop — Product Requirements Document (PRD)
**Eldohub Web3 Hackathon 2026**
Version 1.0 | Team of 8

---

## 1. Product Vision

PayLoop is a decentralized group savings and micro-lending platform that digitises African informal savings circles (chamas, merry-go-rounds, table banking groups) using blockchain technology. It replaces the human treasurer with a smart contract so no single person can steal, dispute, or manipulate group funds.

**One-line pitch:** *"The chama treasurer that can never steal."*

---

## 2. Problem Statement

Across Kenya and Africa, informal savings groups manage billions of shillings annually using paper records, WhatsApp screenshots, and personal trust. This creates:

- **Treasurer fraud** — one person holds all funds with no accountability
- **No verifiable records** — records are lost, altered, or disputed
- **No credit history** — years of consistent savings are invisible to banks
- **Cash risk** — physical money gets stolen or lost
- **Manual errors** — spreadsheets and guesswork cause disagreements

---

## 3. Target Users

| User Type | Description |
|---|---|
| **Circle Member** | Regular chama member who contributes monthly, requests loans, tracks their score |
| **Circle Admin** | Group treasurer/leader who creates the circle, manages members, approves loans |
| **Public Viewer** | Anyone who can view a group's public transparency page without joining |

---

## 4. Core Features (MVP — Required for Demo)

### 4.1 Wallet Authentication
- Connect MetaMask wallet to log in (no username/password)
- Wallet address is the user's unique identity across PayLoop
- Network detection — warn if not on Polygon, offer one-click switch

### 4.2 Circle Management
- Admin creates a savings circle with: name, rules, contribution amount (KES), contribution frequency
- Deploying a circle deploys `CircleVault.sol` to Polygon Amoy Testnet
- Admin can add/remove members by wallet address
- Each circle has a unique contract address viewable on Polygonscan

### 4.3 Contributions
- Member contributes MATIC (crypto) via MetaMask popup
- Member contributes KES via M-Pesa STK Push (bridge to blockchain via backend)
- Every contribution recorded on-chain with timestamp and wallet address
- Vault balance visible in real time on dashboard

### 4.4 Micro-Lending
- Member submits loan request (amount, reason, repayment period)
- Other members vote Approve/Reject using MetaMask signature
- Majority vote triggers automatic disbursement via `LendingPool.sol`
- Repayment tracked on-chain

### 4.5 CreditLoop Score
- Each wallet has a score out of 1000
- Scoring: +10 per on-time contribution, -20 per missed, +15 per loan fully repaid
- Score stored on-chain, readable by anyone
- Displayed with colour indicator: red (0–400), yellow (401–700), green (701–1000)
- Shareable QR code linking to Polygonscan record

### 4.6 LoopPoints Token
- ERC-20 token (`LoopToken.sol`) minted as reward for on-time contributions
- Held in member's own MetaMask wallet (self-custodied)
- Visible in MetaMask token list

### 4.7 Transparency Page
- Public page (no login required) showing group stats
- Total vault, number of members, total loans disbursed, average credit score
- No private member data exposed

---

## 5. Out of Scope (Post-MVP)

- Mobile app (React Native) — web dashboard first, mobile second
- Multi-language support (Swahili)
- Fiat off-ramp (converting MATIC back to KES)
- DAO governance for platform-level decisions
- KYC / identity verification

---

## 6. Success Metrics (Hackathon)

| Metric | Target |
|---|---|
| Core MVP checklist items completed | 7/7 |
| Bonus items completed | 3+ of 5 |
| Live demo runs without crash | Yes |
| Contracts verified on Polygonscan | Yes |
| GitHub repo is public with clean README | Yes |

---

## 7. Constraints

- **Budget:** Zero (all free tiers — Vercel, Railway.app, Polygon Amoy testnet, Firebase/PostgreSQL)
- **Time:** 24–48 hours hackathon build window
- **Team size:** 8 people, mixed experience levels
- **Network:** Polygon Amoy Testnet (not mainnet)
- **Stack:** Next.js (web), Django + PostgreSQL (backend), Solidity + Hardhat (contracts)
