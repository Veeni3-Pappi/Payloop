package com.payloop.app.data.wallet

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.withContext
import org.web3j.crypto.Credentials
import org.web3j.crypto.ECKeyPair
import org.web3j.crypto.Keys
import org.web3j.crypto.Sign
import org.web3j.utils.Numeric
import java.math.BigInteger

private val Context.walletDataStore: DataStore<Preferences> by preferencesDataStore(name = "payloop_wallet")

/**
 * In-app ("dev/demo") wallet: a secp256k1 keypair generated on first use and
 * persisted on-device, capable of producing real EIP-191 personal_sign
 * signatures that the backend's `eth_account.recover_message` accepts.
 *
 * NOTE: the private key lives in this app's DataStore. This is a self-custodial
 * demo signer suitable for dev + the design/login pass — it is NOT the same
 * security posture as delegating signing to MetaMask via WalletConnect. Swap in
 * the AppKit connector for production (WALLET_INTEGRATION.md).
 */
class Web3jWalletConnector(private val context: Context) : WalletConnector {

    private object Keys_ {
        val PRIV = stringPreferencesKey("wallet_private_key")
    }

    private suspend fun loadOrCreateKeyPair(): ECKeyPair = withContext(Dispatchers.Default) {
        val existing = context.walletDataStore.data.map { it[Keys_.PRIV] }.first()
        if (existing != null) {
            ECKeyPair.create(BigInteger(existing, 16))
        } else {
            val kp = Keys.createEcKeyPair()
            context.walletDataStore.edit { it[Keys_.PRIV] = kp.privateKey.toString(16) }
            kp
        }
    }

    override suspend fun connect(): String {
        val kp = loadOrCreateKeyPair()
        return "0x" + Keys.getAddress(kp)
    }

    override suspend fun currentAddress(): String? {
        val existing = context.walletDataStore.data.map { it[Keys_.PRIV] }.first() ?: return null
        val kp = ECKeyPair.create(BigInteger(existing, 16))
        return "0x" + Keys.getAddress(kp)
    }

    override suspend fun personalSign(message: String): String = withContext(Dispatchers.Default) {
        val kp = loadOrCreateKeyPair()
        val sig = Sign.signPrefixedMessage(message.toByteArray(Charsets.UTF_8), kp)
        val out = ByteArray(65)
        System.arraycopy(sig.r, 0, out, 0, 32)
        System.arraycopy(sig.s, 0, out, 32, 32)
        out[64] = sig.v[0]
        Numeric.toHexString(out)
    }

    override fun disconnect() {
        // Retain the key so the wallet identity is stable across logins.
    }
}
