# PayLoop — Database Schema
**PostgreSQL (Django ORM)**
Version 1.0

---

## Overview

PayLoop uses PostgreSQL for all off-chain data. On-chain data (contributions, votes, scores) lives on the Polygon blockchain. The database stores metadata, M-Pesa payment records, user profiles, and notification state.

---

## Tables

### 1. `accounts_user` (Custom User Model)
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
wallet_address  VARCHAR(42) UNIQUE NOT NULL   -- MetaMask address e.g. 0xABC...
display_name    VARCHAR(100)
phone_number    VARCHAR(20)                   -- for M-Pesa STK Push
profile_photo   VARCHAR(500)                  -- URL
fcm_token       VARCHAR(500)                  -- Firebase push token
is_active       BOOLEAN DEFAULT TRUE
created_at      TIMESTAMP DEFAULT NOW()
updated_at      TIMESTAMP DEFAULT NOW()
```

### 2. `circles_circle` (Savings Group)
```sql
id                    UUID PRIMARY KEY DEFAULT gen_random_uuid()
name                  VARCHAR(200) NOT NULL
description           TEXT
contract_address      VARCHAR(42) UNIQUE        -- deployed CircleVault.sol address
admin_wallet          VARCHAR(42) NOT NULL      -- FK to accounts_user.wallet_address
contribution_amount   DECIMAL(12,2) NOT NULL    -- in KES
contribution_frequency VARCHAR(20) NOT NULL     -- 'weekly' | 'monthly'
max_members           INTEGER DEFAULT 20
is_active             BOOLEAN DEFAULT TRUE
created_at            TIMESTAMP DEFAULT NOW()
updated_at            TIMESTAMP DEFAULT NOW()
```

### 3. `circles_membership`
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
circle          UUID FK → circles_circle.id ON DELETE CASCADE
user            UUID FK → accounts_user.id ON DELETE CASCADE
joined_at       TIMESTAMP DEFAULT NOW()
is_admin        BOOLEAN DEFAULT FALSE
status          VARCHAR(20) DEFAULT 'active'   -- 'active' | 'suspended' | 'left'

UNIQUE(circle, user)
```

### 4. `mpesa_payment` (M-Pesa Transaction Records)
```sql
id                    UUID PRIMARY KEY DEFAULT gen_random_uuid()
circle                UUID FK → circles_circle.id
user                  UUID FK → accounts_user.id
phone_number          VARCHAR(20) NOT NULL
amount_kes            DECIMAL(10,2) NOT NULL
checkout_request_id   VARCHAR(200) UNIQUE       -- from Daraja STK Push
merchant_request_id   VARCHAR(200)
mpesa_receipt_number  VARCHAR(100)              -- filled on callback
status                VARCHAR(20) DEFAULT 'pending'  -- 'pending'|'success'|'failed'
on_chain_tx_hash      VARCHAR(100)              -- Polygon tx hash after bridge
created_at            TIMESTAMP DEFAULT NOW()
confirmed_at          TIMESTAMP
```

### 5. `loans_loanrequest`
```sql
id                UUID PRIMARY KEY DEFAULT gen_random_uuid()
circle            UUID FK → circles_circle.id
borrower_wallet   VARCHAR(42) NOT NULL
amount_matic      DECIMAL(18,8) NOT NULL
reason            TEXT NOT NULL
repayment_days    INTEGER NOT NULL
status            VARCHAR(20) DEFAULT 'pending'
                  -- 'pending'|'approved'|'rejected'|'disbursed'|'repaid'
on_chain_loan_id  INTEGER                       -- loan ID from LendingPool.sol
votes_for         INTEGER DEFAULT 0
votes_against     INTEGER DEFAULT 0
created_at        TIMESTAMP DEFAULT NOW()
disbursed_at      TIMESTAMP
repaid_at         TIMESTAMP
```

### 6. `loans_vote`
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
loan_request    UUID FK → loans_loanrequest.id ON DELETE CASCADE
voter_wallet    VARCHAR(42) NOT NULL
approved        BOOLEAN NOT NULL
tx_hash         VARCHAR(100)                    -- MetaMask signature tx
voted_at        TIMESTAMP DEFAULT NOW()

UNIQUE(loan_request, voter_wallet)
```

### 7. `ipfs_receipt`
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
circle          UUID FK → circles_circle.id
related_tx_hash VARCHAR(100)                    -- on-chain tx this receipt is for
ipfs_hash       VARCHAR(200) NOT NULL           -- CID from Pinata
gateway_url     VARCHAR(500)
receipt_type    VARCHAR(50)                     -- 'contribution'|'loan'|'repayment'
created_at      TIMESTAMP DEFAULT NOW()
```

### 8. `notifications_log`
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
user            UUID FK → accounts_user.id
title           VARCHAR(200)
body            TEXT
notification_type VARCHAR(50)   -- 'contribution_due'|'loan_approved'|'vote_needed'
sent_at         TIMESTAMP DEFAULT NOW()
is_read         BOOLEAN DEFAULT FALSE
```

---

## Entity Relationship Summary

```
accounts_user
    │
    ├──< circles_membership >──── circles_circle
    │                                   │
    ├──< mpesa_payment                  ├──< loans_loanrequest
    │                                   │         │
    └──< notifications_log              │         └──< loans_vote
                                        └──< ipfs_receipt
```

---

## Django Model Notes

- Use `uuid` as primary key on all models (`default=uuid.uuid4, editable=False`)
- `wallet_address` fields store lowercase checksummed Ethereum addresses
- `DECIMAL` fields for financial amounts — never use `FLOAT` for money
- Add `db_index=True` on `wallet_address`, `circle_id`, and `status` fields for query performance
- Use Django's `Meta: ordering` so default queries return newest first

---

## Migration Strategy

```bash
# After defining models:
python manage.py makemigrations
python manage.py migrate

# Seed test data for hackathon demo:
python manage.py loaddata fixtures/demo_data.json
```

---

## Demo Seed Data (for Hackathon)

Create a fixture that seeds:
- 3 test users with different wallet addresses
- 1 circle called "MUST Blockchain Club Chama"
- 5 past contributions (so CreditLoop Score shows a real number)
- 1 pending loan request
- 2 votes on that loan
