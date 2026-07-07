package com.payloop.app.data.api

import com.google.gson.annotations.SerializedName

/**
 * DTOs for the PayLoop backend, mirroring the shapes the web app consumes
 * (see web/lib/api.ts). Field names use @SerializedName so the Kotlin side
 * stays idiomatic while matching Django REST's snake_case payloads.
 */

/**
 * DRF has PageNumberPagination enabled, so list endpoints return
 * { count, next, previous, results: [...] } rather than a bare array.
 * List calls type against this wrapper; [items] tolerates a null page.
 */
data class Paged<T>(
    val count: Int = 0,
    val next: String? = null,
    val previous: String? = null,
    val results: List<T>? = null,
) {
    val items: List<T> get() = results ?: emptyList()
}

// ── Profile ────────────────────────────────────────────────

data class ProfileDto(
    @SerializedName("wallet_address") val walletAddress: String? = null,
    @SerializedName("display_name") val displayName: String? = null,
    @SerializedName("phone_number") val phoneNumber: String? = null,
    @SerializedName("created_at") val createdAt: String? = null,
)

/** PATCH body for /api/auth/profile/. Null fields are omitted by Gson. */
data class ProfileUpdateRequest(
    @SerializedName("display_name") val displayName: String? = null,
    @SerializedName("phone_number") val phoneNumber: String? = null,
    @SerializedName("fcm_token") val fcmToken: String? = null,
)

// ── Circle ─────────────────────────────────────────────────

data class CircleDto(
    val id: String,
    val name: String? = null,
    @SerializedName("contract_address") val contractAddress: String? = null,
    @SerializedName("admin_wallet") val adminWallet: String? = null,
    @SerializedName("contribution_amount") val contributionAmount: String? = null,
    @SerializedName("contribution_frequency") val contributionFrequency: String? = null,
    @SerializedName("is_active") val isActive: Boolean = true,
    @SerializedName("created_at") val createdAt: String? = null,
)

// ── Membership ─────────────────────────────────────────────

data class MemberUserDto(
    @SerializedName("wallet_address") val walletAddress: String? = null,
    @SerializedName("display_name") val displayName: String? = null,
)

data class MembershipDto(
    val id: String? = null,
    val circle: String? = null,
    val user: MemberUserDto? = null,
    val role: String? = null,
    @SerializedName("joined_at") val joinedAt: String? = null,
)

// ── Contribution ───────────────────────────────────────────

data class ContributionDto(
    val id: String? = null,
    val circle: String? = null,
    val user: Long? = null,
    val amount: String? = null,
    @SerializedName("tx_hash") val txHash: String? = null,
    @SerializedName("payment_method") val paymentMethod: String? = null,
    @SerializedName("created_at") val createdAt: String? = null,
)

// ── Loan ───────────────────────────────────────────────────

data class LoanDto(
    val id: String? = null,
    val circle: String? = null,
    val borrower: Long? = null,
    @SerializedName("borrower_wallet") val borrowerWallet: String? = null,
    @SerializedName("amount_matic") val amountMatic: String? = null,
    val reason: String? = null,
    @SerializedName("repayment_days") val repaymentDays: Int? = null,
    val status: String? = null,
    @SerializedName("on_chain_loan_id") val onChainLoanId: Long? = null,
    @SerializedName("created_at") val createdAt: String? = null,
)

/** POST body for /api/circles/circles/<id>/loans/. */
data class CreateLoanRequest(
    @SerializedName("amount_matic") val amountMatic: String,
    val reason: String,
    @SerializedName("repayment_days") val repaymentDays: Int,
)

// ── Credit Score ───────────────────────────────────────────

data class ScoreBreakdownDto(
    @SerializedName("on_time") val onTime: Int = 0,
    val missed: Int = 0,
    val repaid: Int = 0,
)

data class ScoreDto(
    val wallet: String? = null,
    val score: Int = 0,
    val breakdown: ScoreBreakdownDto = ScoreBreakdownDto(),
    val source: String? = null,
)

// ── M-Pesa ─────────────────────────────────────────────────

/** POST body for /api/mpesa/stkpush/. */
data class StkPushRequest(
    @SerializedName("phone_number") val phoneNumber: String,
    val amount: String,
    @SerializedName("circle_id") val circleId: String,
    @SerializedName("wallet_address") val walletAddress: String,
)

data class StkPushResponse(
    @SerializedName("payment_id") val paymentId: String? = null,
    val reference: String? = null,
    @SerializedName("checkout_request_id") val checkoutRequestId: String? = null,
    val status: String? = null,
    val message: String? = null,
)
