package com.payloop.app.data.api

import com.payloop.app.BuildConfig
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory

/**
 * Builds the Retrofit [PayLoopApi]. Base URL comes from BuildConfig.API_BASE_URL
 * (defaults to http://10.0.2.2:8000/ — the host machine's localhost from the
 * Android emulator). The [tokenProvider] injects the JWT as a Bearer header,
 * mirroring the web app's Authorization handling in lib/api.ts.
 */
object ApiClient {

    fun create(tokenProvider: () -> String?): PayLoopApi {
        val logging = HttpLoggingInterceptor().apply {
            level = if (BuildConfig.DEBUG) {
                HttpLoggingInterceptor.Level.BASIC
            } else {
                HttpLoggingInterceptor.Level.NONE
            }
        }

        val client = OkHttpClient.Builder()
            .addInterceptor { chain ->
                val builder = chain.request().newBuilder()
                tokenProvider()?.takeIf { it.isNotBlank() }?.let { token ->
                    builder.header("Authorization", "Bearer $token")
                }
                chain.proceed(builder.build())
            }
            .addInterceptor(logging)
            .build()

        return Retrofit.Builder()
            .baseUrl(BuildConfig.API_BASE_URL)
            .client(client)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
            .create(PayLoopApi::class.java)
    }
}
