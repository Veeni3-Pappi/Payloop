package com.payloop.app.data.api

import com.google.gson.annotations.SerializedName

/**
 * Mirrors the web app's verify-wallet payload (web/lib/api.ts -> verifyWallet):
 * POST /api/auth/verify-wallet/ { wallet_address, signature, message }.
 */
data class VerifyWalletRequest(
    @SerializedName("wallet_address") val walletAddress: String,
    val signature: String,
    val message: String,
)

data class VerifyWalletResponse(
    @SerializedName("access_token") val accessToken: String,
    @SerializedName("refresh_token") val refreshToken: String?,
    @SerializedName("wallet_address") val walletAddress: String?,
)
