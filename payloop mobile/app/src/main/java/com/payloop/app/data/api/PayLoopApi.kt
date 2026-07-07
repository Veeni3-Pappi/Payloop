package com.payloop.app.data.api

import retrofit2.http.Body
import retrofit2.http.POST

/**
 * PayLoop backend (Django REST) endpoints.
 *
 * Pass 1 wires wallet auth. Profile / circles / loans / score / notifications
 * (already available on the backend and consumed by the web app) get added
 * here in the data-wiring pass.
 */
interface PayLoopApi {

    @POST("api/auth/verify-wallet/")
    suspend fun verifyWallet(@Body body: VerifyWalletRequest): VerifyWalletResponse
}
