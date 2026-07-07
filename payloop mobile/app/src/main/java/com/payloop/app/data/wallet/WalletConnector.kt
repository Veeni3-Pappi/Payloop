package com.payloop.app.data.wallet

/**
 * Abstraction over "the thing that owns a wallet and can sign".
 *
 * Pass 1 default: [Web3jWalletConnector] — an on-device key that produces a
 * real EIP-191 personal_sign signature the backend verifies.
 *
 * Production swap: an AppKitWalletConnector backed by Reown/WalletConnect that
 * delegates connect + personal_sign to the user's MetaMask app. Because the
 * rest of the app depends only on this interface, that swap is localised.
 * See WALLET_INTEGRATION.md.
 */
interface WalletConnector {

    /** Connect (or create) a wallet and return its lowercase 0x address. */
    suspend fun connect(): String

    /**
     * Sign [message] with EIP-191 personal_sign and return the 0x-prefixed
     * 65-byte (r||s||v) hex signature.
     */
    suspend fun personalSign(message: String): String

    /** The current address if connected, else null. */
    suspend fun currentAddress(): String?

    /** Forget the in-memory connection (identity/key may be retained). */
    fun disconnect()
}
