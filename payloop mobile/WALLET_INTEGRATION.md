# PayLoop Mobile — Wallet & Auth Integration

The mobile app now authenticates against the **same backend and the same
signed-message contract as the web dashboard**:

1. Connect a wallet → get a `0x…` address.
2. `personal_sign` the fixed message:
   `Welcome to PayLoop! Sign this message to verify ownership of your wallet: <address_lowercase>`
3. `POST /api/auth/verify-wallet/` with `{ wallet_address, signature, message }`.
4. Store the returned JWT; send it as `Authorization: Bearer <token>`.

This is byte-for-byte identical to `web/hooks/useAuth.ts`, so the backend's
`eth_account.recover_message` verifies both clients.

## Two signer implementations (behind one interface)

Everything depends only on `data/wallet/WalletConnector`:

| Impl | Status | Notes |
|------|--------|-------|
| `Web3jWalletConnector` | **Active (Pass 1)** | On-device secp256k1 key. Produces real EIP-191 signatures. Great for dev + demos. Key lives in app DataStore — a self-custodial demo signer, **not** production-grade custody. |
| `AppKitWalletConnector` | To enable | Delegates connect + signing to the user's **MetaMask mobile app** via Reown/WalletConnect. True parity with web. |

Swapping is a **one-line change** in `data/ServiceLocator.kt`:

```kotlin
val wallet: WalletConnector by lazy { AppKitWalletConnector(appContext) }
```

## Enabling the production WalletConnect (Reown AppKit) path

1. **Get a projectId** (free) at https://cloud.reown.com and set it:
   - in `local.properties` (git-ignored):  `WC_PROJECT_ID=xxxxxxxx`
   - it is exposed as `BuildConfig.WC_PROJECT_ID`.
2. **Add the dependency** (in `app/build.gradle.kts`):
   ```kotlin
   implementation(platform("com.reown:android-bom:<latest>"))
   implementation("com.reown:android-core")
   implementation("com.reown:appkit")
   ```
   Pin `<latest>` from https://cloud.reown.com docs (kept out of the active
   build so Pass 1 compiles without a projectId).
3. **Init in `PayLoopApp.onCreate()`** with the projectId + an app
   `redirect` of `payloop://request` (add the matching intent-filter to
   `MainActivity` in `AndroidManifest.xml`).
4. **Implement `AppKitWalletConnector`**:
   - `connect()` → open the AppKit modal, return the session's EVM account.
   - `personalSign(msg)` → send a `personal_sign` request over the session;
     suspend until MetaMask returns the signature.
5. Flip the `ServiceLocator.wallet` line above.

No other app code changes — repository, login screen, navigation, and the
backend contract stay exactly the same.

## Backend base URL

`BuildConfig.API_BASE_URL` (default `http://10.0.2.2:8000/`, the emulator's
route to host `localhost`). Override per-build:

```
# gradle.properties or local.properties
API_BASE_URL=https://api.yourhost.com/
```

Cleartext HTTP is enabled (`usesCleartextTraffic="true"`) for local dev;
tighten this for production.
