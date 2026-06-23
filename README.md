# PayLoop 🔗

> **The chama treasurer that can never steal.**

PayLoop is a decentralized group savings and micro-lending platform that digitises African informal savings circles (chamas) using blockchain technology. Built for the **Eldohub Web3 Hackathon 2026**.

![PayLoop Landing Page](./screenshots/landing.png)

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────┐
│         Next.js 16 Web Dashboard        │
│    (Tailwind CSS + wagmi v3 + viem)     │
└──────────────────┬──────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────┐
│         🦊 MetaMask + Polygon Amoy      │
│         wagmi v2 + viem + ethers v6     │
└──────────────────┬──────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────┐
│       ⛓️ Smart Contracts (Solidity)      │
│  CircleVault · LendingPool             │
│  CreditScore · LoopToken (ERC-20)      │
└──────────────────┬──────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────┐
│    🐍 Django Backend (Phase 3)          │
│    PostgreSQL · M-Pesa · Firebase FCM   │
└─────────────────────────────────────────┘
```

---

## ✨ Features

| Feature | Status |
|---------|--------|
| MetaMask wallet connect + network detection | ✅ |
| Dashboard with vault balance + charts | ✅ |
| Circle management + contract display | ✅ |
| Contribute MATIC via MetaMask | ✅ |
| Loan requests + member voting | ✅ |
| CreditLoop Score (0–1000) with QR code | ✅ |
| Member management (add/remove) | ✅ |
| Public transparency page | ✅ |
| Smart contracts (4 contracts deployed to Amoy) | ✅ |
| Django backend API | ✅ |
| M-Pesa Daraja integration | ✅ |
| Firebase FCM notifications | ✅ |

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MetaMask browser extension
- Test MATIC from [faucet.polygon.technology](https://faucet.polygon.technology)

### Smart Contracts
```bash
cd contracts
cp .env.example .env  # add your private key
npm install
npx hardhat compile
npx hardhat run scripts/deploy.js --network amoy
```

### Frontend
```bash
cd web
cp .env.local.example .env.local  # add contract addresses after deploy
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 📁 Project Structure

```
Payloop/
├── contracts/              # Hardhat + Solidity
│   ├── contracts/
│   │   ├── CircleVault.sol     # Group savings vault
│   │   ├── LendingPool.sol     # Loan requests + voting
│   │   ├── CreditScore.sol     # On-chain credit score
│   │   └── LoopToken.sol       # ERC-20 reward token
│   ├── scripts/deploy.js
│   └── hardhat.config.js
├── web/                    # Next.js 14 + Tailwind
│   ├── app/
│   │   ├── page.tsx            # Landing page
│   │   ├── dashboard/          # Main dashboard
│   │   ├── circles/            # Circle management
│   │   ├── loans/              # Loan requests + voting
│   │   ├── score/              # CreditLoop Score
│   │   ├── members/            # Member management
│   │   └── transparency/       # Public transparency
│   ├── components/
│   │   ├── ConnectWallet.tsx
│   │   ├── ContributeModal.tsx
│   │   ├── LoanRequestForm.tsx
│   │   ├── CreditScoreCard.tsx
│   │   ├── VaultChart.tsx
│   │   └── MemberList.tsx
│   ├── hooks/                  # wagmi contract hooks
│   └── lib/                    # Config, ABIs, utils
└── pldocs/                 # Project documentation
```

---

## 🔗 Smart Contracts

| Contract | Purpose |
|----------|---------|
| **CircleVault** | Holds group savings, contribute/withdraw MATIC |
| **LendingPool** | Loan requests, voting, auto-disburse on majority |
| **CreditScore** | On-chain reputation: +10 on-time, -20 missed, +15 repaid |
| **LoopToken** | ERC-20 "LOOP" rewards for on-time contributions |

All contracts use OpenZeppelin `Ownable` for access control and target Solidity ^0.8.20.

### Deployed Addresses (Polygon Amoy Testnet)

| Contract | Address |
|----------|---------|
| **LoopToken** | `0x856BB4c9186515b4Cef937B82E50c84153139774` |
| **CreditScore** | `0xbfeD8Ff69F68935b402ae95AeE2C0DD9A4e25C71` |
| **CircleVault** | `0x9F2196B0dF4e5cEE0E43d19F185602c22055F4eD` |
| **LendingPool** | `0xfFD93d42d303D1D9443732c81022659656490Ce8` |

---

## 🛠️ Tech Stack

- **Frontend:** Next.js 16, Tailwind CSS v4, TypeScript
- **Web3:** wagmi v3, viem, ethers v6
- **Charts:** Recharts
- **Toasts:** Sonner
- **QR Codes:** react-qr-code
- **Smart Contracts:** Solidity ^0.8.20, Hardhat 3, OpenZeppelin
- **Network:** Polygon Amoy Testnet (chainId: 80002)

---

## 👥 Team

Built by the PayLoop team at the Eldohub Web3 Hackathon 2026.

---

## 📄 License

MIT
