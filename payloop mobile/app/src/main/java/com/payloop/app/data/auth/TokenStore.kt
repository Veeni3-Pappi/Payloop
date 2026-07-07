package com.payloop.app.data.auth

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map

private val Context.authDataStore: DataStore<Preferences> by preferencesDataStore(name = "payloop_auth")

/**
 * Persists the JWT + wallet address across launches (session resume),
 * mirroring the web app's localStorage keys in useAuth.ts.
 */
class TokenStore(private val context: Context) {

    private object Keys {
        val TOKEN = stringPreferencesKey("payloop_auth_token")
        val ADDRESS = stringPreferencesKey("payloop_auth_address")
    }

    val tokenFlow: Flow<String?> = context.authDataStore.data.map { it[Keys.TOKEN] }

    suspend fun token(): String? = tokenFlow.first()

    suspend fun address(): String? =
        context.authDataStore.data.map { it[Keys.ADDRESS] }.first()

    suspend fun save(token: String, address: String) {
        context.authDataStore.edit {
            it[Keys.TOKEN] = token
            it[Keys.ADDRESS] = address
        }
    }

    suspend fun clear() {
        context.authDataStore.edit { it.remove(Keys.TOKEN); it.remove(Keys.ADDRESS) }
    }
}
