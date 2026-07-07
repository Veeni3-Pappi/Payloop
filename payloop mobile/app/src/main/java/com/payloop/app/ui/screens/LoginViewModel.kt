package com.payloop.app.ui.screens

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.payloop.app.data.ServiceLocator
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

/** UI state for the wallet-connect login flow. */
sealed interface LoginUiState {
    data object Idle : LoginUiState
    data object Connecting : LoginUiState
    data class Error(val message: String) : LoginUiState
    data class Success(val address: String) : LoginUiState
}

/**
 * Drives the "Connect Wallet" login: connect -> sign -> verify-wallet -> JWT.
 * Mirrors web/hooks/useAuth.ts (same message, same endpoint, same persistence).
 */
class LoginViewModel : ViewModel() {

    private val repo = ServiceLocator.authRepository

    private val _state = MutableStateFlow<LoginUiState>(LoginUiState.Idle)
    val state: StateFlow<LoginUiState> = _state.asStateFlow()

    fun connectAndLogin() {
        if (_state.value is LoginUiState.Connecting) return
        _state.value = LoginUiState.Connecting
        viewModelScope.launch {
            repo.login()
                .onSuccess { address -> _state.value = LoginUiState.Success(address) }
                .onFailure { err ->
                    _state.value = LoginUiState.Error(
                        err.message ?: "Failed to connect and verify wallet"
                    )
                }
        }
    }

    fun reset() {
        _state.value = LoginUiState.Idle
    }
}
