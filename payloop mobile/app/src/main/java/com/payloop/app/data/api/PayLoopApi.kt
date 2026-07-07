package com.payloop.app.data.api

import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.PATCH
import retrofit2.http.POST
import retrofit2.http.Path

/**
 * PayLoop backend (Django REST) endpoints.
 *
 * Wallet auth (verifyWallet) plus the profile / circles / loans / score /
 * M-Pesa endpoints the web app consumes (web/lib/api.ts). The JWT is added
 * automatically by ApiClient's interceptor, so authed calls need no extra
 * header parameter here.
 */
interface PayLoopApi {

    // ── Auth ──────────────────────────────────────────────
    @POST("api/auth/verify-wallet/")
    suspend fun verifyWallet(@Body body: VerifyWalletRequest): VerifyWalletResponse

    // ── Profile ───────────────────────────────────────────
    @GET("api/auth/profile/")
    suspend fun getProfile(): ProfileDto

    @PATCH("api/auth/profile/")
    suspend fun updateProfile(@Body body: ProfileUpdateRequest): ProfileDto

    // ── Circles ───────────────────────────────────────────
    // The circle list comes from a ModelViewSet, so DRF paginates it
    // ({ results: [...] }). The members/loans/contributions endpoints are
    // plain @api_view functions returning bare JSON arrays — hence List<T>.
    @GET("api/circles/circles/")
    suspend fun getCircles(): Paged<CircleDto>

    @GET("api/circles/circles/{id}/contributions/")
    suspend fun getContributions(@Path("id") circleId: String): List<ContributionDto>

    @GET("api/circles/circles/{id}/members/")
    suspend fun getMembers(@Path("id") circleId: String): List<MembershipDto>

    @GET("api/circles/circles/{id}/loans/")
    suspend fun getLoans(@Path("id") circleId: String): List<LoanDto>

    @POST("api/circles/circles/{id}/loans/")
    suspend fun createLoan(
        @Path("id") circleId: String,
        @Body body: CreateLoanRequest,
    ): LoanDto

    // ── Credit Score (public) ─────────────────────────────
    @GET("api/score/{wallet}/")
    suspend fun getScore(@Path("wallet") wallet: String): ScoreDto

    // ── M-Pesa ────────────────────────────────────────────
    @POST("api/mpesa/stkpush/")
    suspend fun stkPush(@Body body: StkPushRequest): StkPushResponse
}
