package com.payloop.app.data

import android.content.Context
import com.payloop.app.data.api.ApiClient
import com.payloop.app.data.api.PayLoopApi
import com.payloop.app.data.auth.AuthRepository
import com.payloop.app.data.auth.TokenStore
import com.payloop.app.data.wallet.Web3jWalletConnector
import com.payloop.app.data.wallet.WalletConnector
import kotlinx.coroutines.runBlocking

/**
 * Minimal manual DI. Initialised once from [com.payloop.app.PayLoopApp].
 * Kept intentionally tiny — swap [wallet] for the WalletConnect-backed
 * connector here when moving to production (single edit point).
 */
object ServiceLocator {

    private lateinit var appContext: Context

    fun init(context: Context) {
        appContext = context.applicationContext
    }

    val tokenStore: TokenStore by lazy { TokenStore(appContext) }

    val wallet: WalletConnector by lazy { Web3jWalletConnector(appContext) }

    private val api: PayLoopApi by lazy {
        ApiClient.create(tokenProvider = { runBlocking { tokenStore.token() } })
    }

    val authRepository: AuthRepository by lazy { AuthRepository(api, tokenStore, wallet) }

    val repository: AppRepository by lazy { AppRepository(api, tokenStore) }
}
