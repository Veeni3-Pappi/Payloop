package com.payloop.app

import android.app.Application
import com.payloop.app.data.ServiceLocator
import org.bouncycastle.jce.provider.BouncyCastleProvider
import java.security.Security

/**
 * Application entry point.
 *
 * Pass 1 uses an in-app Ethereum signer (see [com.payloop.app.data.wallet]),
 * so no third-party SDK init is required here beyond making sure web3j's
 * BouncyCastle provider wins over Android's stripped-down built-in "BC"
 * (secp256k1 key generation fails otherwise).
 *
 * When enabling the production WalletConnect path (WALLET_INTEGRATION.md),
 * initialise Reown AppKit in [onCreate] using BuildConfig.WC_PROJECT_ID.
 */
class PayLoopApp : Application() {
    override fun onCreate() {
        super.onCreate()
        // Ensure the full BouncyCastle provider is used for secp256k1.
        Security.removeProvider("BC")
        Security.insertProviderAt(BouncyCastleProvider(), 1)

        ServiceLocator.init(this)

        // WalletConnect (production): initialise Reown AppKit here.
        // See WALLET_INTEGRATION.md for the exact CoreClient / AppKit setup.
    }
}
