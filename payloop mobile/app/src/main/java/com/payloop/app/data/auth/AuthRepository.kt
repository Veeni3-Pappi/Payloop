package com.payloop.app.data.auth

import com.payloop.app.data.api.PayLoopApi
import com.payloop.app.data.api.VerifyWalletRequest
import com.payloop.app.data.wallet.WalletConnector

/**
 * Reproduces the web app's wallet login (web/hooks/useAuth.ts):
 *   1. connect wallet -> address
 *   2. sign the fixed message with personal_sign
 *   3. POST /api/auth/verify-wallet/ -> JWT
 *   4. persist token + address
 *
 * The signed message string is byte-for-byte identical to the web client so
 * the same backend accepts both.
 */
class AuthRepository(
    private val api: PayLoopApi,
    private val tokenStore: TokenStore,
    private val wallet: WalletConnector,
) {
    suspend fun isLoggedIn(): Boolean = !tokenStore.token().isNullOrBlank()

    suspend fun login(): Result<String> = runCatching {
        val address = wallet.connect()
        val message = authMessage(address)
        val signature = wallet.personalSign(message)
        val response = api.verifyWallet(
            VerifyWalletRequest(walletAddress = address, signature = signature, message = message)
        )
        val token = response.accessToken
        if (token.isBlank()) error("No token returned")
        tokenStore.save(token, address)
        address
    }

    suspend fun logout() {
        tokenStore.clear()
        wallet.disconnect()
    }

    private fun authMessage(address: String): String =
        "Welcome to PayLoop! Sign this message to verify ownership of your wallet: ${address.lowercase()}"
}
