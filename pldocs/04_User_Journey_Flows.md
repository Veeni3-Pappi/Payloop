# PayLoop — User Journey Flows
Version 1.0

---

## Journey 1: First-Time Admin (Creates a Circle)

```
[Landing Page]
      │
      ▼
[Click "Connect MetaMask"]
      │
      ▼
[MetaMask popup — user approves connection]
      │
      ▼
[Wallet address read → POST /api/auth/verify-wallet/]
      │
      ▼
[JWT token stored in localStorage]
      │
      ▼
[Redirected to Dashboard — empty state "Create your first circle"]
      │
      ▼
[Click "Create Circle"]
      │
      ▼
[Fill form: Name, Description, Contribution Amount (KES), Frequency]
      │
      ▼
[Click "Deploy Circle"]
      │
      ├──► [CircleVault.sol deploys to Polygon Amoy]
      │         MetaMask popup → user confirms deployment gas fee
      │
      ▼
[Contract address returned → POST /api/circles/ saves metadata to DB]
      │
      ▼
[Redirect to Circle Dashboard — shows contract address + Polygonscan link]
      │
      ▼
[Admin adds members by pasting wallet addresses]
      │
      ▼
[Members receive push notification: "You've been added to {circle name}"]
```

---

## Journey 2: Member Makes a Contribution (Crypto via MetaMask)

```
[Member logs in via MetaMask]
      │
      ▼
[Dashboard shows: Vault Balance, Next Due Date, My Contribution Total]
      │
      ▼
[Click "Contribute Now"]
      │
      ▼
[Modal: Enter amount in MATIC (auto-converts from KES shown)]
      │
      ▼
[Click "Confirm Contribution"]
      │
      ├──► [wagmi calls CircleVault.sol contribute()]
      │         MetaMask popup: shows amount + gas fee (~$0.001)
      │         User taps CONFIRM
      │
      ▼
[Transaction broadcast to Polygon]
      │
      ▼
[Polygon mines block (~2 seconds)]
      │
      ▼
[App listens for Contributed() event]
      │
      ├──► [CreditScore.sol updates: +10 points]
      ├──► [LoopToken.sol mints reward tokens to member wallet]
      ├──► [Pinata pins receipt to IPFS]
      │
      ▼
[Dashboard updates: vault balance increases, score updates]
      │
      ▼
[Push notification sent to all members: "{Name} contributed {amount}"]
```

---

## Journey 3: Member Contributes via M-Pesa

```
[Member taps "Contribute via M-Pesa"]
      │
      ▼
[Enter M-Pesa phone number + KES amount]
      │
      ▼
[POST /api/mpesa/stkpush/ → Django backend]
      │
      ▼
[Django calls Daraja API → STK Push triggered]
      │
      ▼
[Phone receives M-Pesa popup: "Enter PIN to pay KES {amount} to PayLoop"]
      │
      ▼
[Member enters M-Pesa PIN]
      │
      ├──► [Safaricom confirms → hits POST /api/mpesa/callback/]
      │
      ▼
[Django callback handler:
  1. Verifies MerchantRequestID (security check)
  2. Updates mpesa_payment status to 'success'
  3. Converts KES to MATIC equivalent
  4. Calls CircleVault.sol contribute() using backend server wallet
  5. Records on_chain_tx_hash]
      │
      ▼
[Same outcome as crypto contribution: score updates, token minted, receipt pinned]
      │
      ▼
[App shows: "M-Pesa payment confirmed and recorded on-chain ✓"]
```

---

## Journey 4: Member Requests a Loan

```
[Member clicks "Request Loan"]
      │
      ▼
[Fill form: Amount (MATIC), Reason, Repayment period (days)]
      │
      ▼
[Click "Submit Request"]
      │
      ├──► [LendingPool.sol requestLoan() called via MetaMask]
      │         MetaMask popup → user signs
      │
      ▼
[Loan appears in circle's Loans page as "PENDING"]
      │
      ▼
[Push notification to all members: "New loan request from {Name} — vote now"]
```

---

## Journey 5: Members Vote on a Loan

```
[Member opens Loans page — sees pending loan]
      │
      ▼
[Reviews: Borrower, Amount, Reason, Repayment period, Current votes]
      │
      ▼
[Clicks "Approve" or "Reject"]
      │
      ▼
[LendingPool.sol vote() called via MetaMask]
      │
      MetaMask popup → member signs vote
      │
      ▼
[Vote recorded on-chain]
      │
      ├──[IF majority approve]──►
      │       LendingPool.sol disburseLoan() auto-triggers
      │       MATIC sent to borrower's wallet
      │       Loan status → "DISBURSED"
      │       Push notification: "Your loan has been approved and disbursed!"
      │
      └──[IF majority reject]──►
              Loan status → "REJECTED"
              Push notification: "Your loan request was not approved"
```

---

## Journey 6: Member Views CreditLoop Score

```
[Member clicks "My Score"]
      │
      ▼
[CreditScore.sol getScore(walletAddress) called — read-only, no gas]
      │
      ▼
[Score displayed: e.g. 740/1000 — GREEN]
      │
      ▼
[Score breakdown shown:
  Contributions on time: 12  (+120 pts)
  Contributions missed:  1   (-20 pts)
  Loans repaid:          2   (+30 pts)]
      │
      ▼
[Click "Share My Score"]
      │
      ▼
[QR code generated linking to Polygonscan record of their wallet score]
      │
      ▼
[Member can screenshot and share with banks or landlords as proof]
```

---

## Journey 7: Public Transparency Page

```
[Anyone visits /transparency/{circle_id} — no login required]
      │
      ▼
[Page shows:
  Circle name, creation date
  Total vault balance (MATIC)
  Number of active members
  Total contributions this month
  Total loans disbursed (count + value)
  Average member CreditLoop Score]
      │
      ▼
[No individual member names or wallet addresses exposed]
      │
      ▼
[Link to Polygonscan contract address for full audit]
```

---

## Error States to Handle

| Scenario | UI Response |
|---|---|
| MetaMask not installed | Show "Install MetaMask" button linking to metamask.io |
| Wrong network (not Polygon) | Yellow banner + "Switch to Polygon" button |
| Transaction rejected by user | Toast: "Transaction cancelled" — no state change |
| M-Pesa STK Push timeout | Show retry button + support message |
| Insufficient MATIC for gas | Show error: "Top up your wallet with test MATIC from faucet.polygon.technology" |
| Loan vote already cast | Disable vote buttons + show "You already voted" |
| Not a circle member | Redirect to landing page with message |
