package com.payloop.app.ui.screens

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.payloop.app.data.ContributeContext
import com.payloop.app.data.DashboardData
import com.payloop.app.data.LoanContext
import com.payloop.app.data.ScoreData
import com.payloop.app.data.ServiceLocator
import com.payloop.app.data.api.StkPushResponse
import com.payloop.app.data.api.LoanDto
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

/**
 * ViewModels for the four data-backed screens. Each exposes a single
 * [StateFlow] of a small sealed UI-state, following the same shape as
 * [LoginViewModel]. All backend work goes through [ServiceLocator.repository].
 */

// ── Home / Dashboard ───────────────────────────────────────

sealed interface HomeUiState {
    data object Loading : HomeUiState
    data class Error(val message: String) : HomeUiState
    data class Ready(val data: DashboardData) : HomeUiState
}

class HomeViewModel : ViewModel() {
    private val repo = ServiceLocator.repository
    private val _state = MutableStateFlow<HomeUiState>(HomeUiState.Loading)
    val state: StateFlow<HomeUiState> = _state.asStateFlow()

    init { load() }

    fun load() {
        _state.value = HomeUiState.Loading
        viewModelScope.launch {
            repo.loadDashboard()
                .onSuccess { _state.value = HomeUiState.Ready(it) }
                .onFailure { _state.value = HomeUiState.Error(it.message ?: "Couldn't load your dashboard.") }
        }
    }
}

// ── Contribute ─────────────────────────────────────────────

sealed interface ContributeUiState {
    data object Loading : ContributeUiState
    data class Error(val message: String) : ContributeUiState
    data class Ready(val context: ContributeContext) : ContributeUiState
}

class ContributeViewModel : ViewModel() {
    private val repo = ServiceLocator.repository

    private val _state = MutableStateFlow<ContributeUiState>(ContributeUiState.Loading)
    val state: StateFlow<ContributeUiState> = _state.asStateFlow()

    /** null = idle, true = submitting. */
    private val _submitting = MutableStateFlow(false)
    val submitting: StateFlow<Boolean> = _submitting.asStateFlow()

    /** Set when the STK push succeeds; drives the success screen. */
    private val _result = MutableStateFlow<StkPushResponse?>(null)
    val result: StateFlow<StkPushResponse?> = _result.asStateFlow()

    private val _submitError = MutableStateFlow<String?>(null)
    val submitError: StateFlow<String?> = _submitError.asStateFlow()

    init { load() }

    fun load() {
        _state.value = ContributeUiState.Loading
        viewModelScope.launch {
            repo.loadContributeContext()
                .onSuccess { _state.value = ContributeUiState.Ready(it) }
                .onFailure { _state.value = ContributeUiState.Error(it.message ?: "Couldn't load your circle.") }
        }
    }

    fun contribute(amountKes: String, phone: String) {
        if (_submitting.value) return
        _submitError.value = null
        _submitting.value = true
        viewModelScope.launch {
            repo.contribute(amountKes, phone)
                .onSuccess { _result.value = it }
                .onFailure { _submitError.value = it.message ?: "Payment could not be started." }
            _submitting.value = false
        }
    }

    fun clearError() { _submitError.value = null }
}

// ── Loan ───────────────────────────────────────────────────

sealed interface LoanUiState {
    data object Loading : LoanUiState
    data class Error(val message: String) : LoanUiState
    data class Ready(val context: LoanContext) : LoanUiState
}

class LoanViewModel : ViewModel() {
    private val repo = ServiceLocator.repository

    private val _state = MutableStateFlow<LoanUiState>(LoanUiState.Loading)
    val state: StateFlow<LoanUiState> = _state.asStateFlow()

    private val _submitting = MutableStateFlow(false)
    val submitting: StateFlow<Boolean> = _submitting.asStateFlow()

    private val _result = MutableStateFlow<LoanDto?>(null)
    val result: StateFlow<LoanDto?> = _result.asStateFlow()

    private val _submitError = MutableStateFlow<String?>(null)
    val submitError: StateFlow<String?> = _submitError.asStateFlow()

    init { load() }

    fun load() {
        _state.value = LoanUiState.Loading
        viewModelScope.launch {
            repo.loadLoanContext()
                .onSuccess { _state.value = LoanUiState.Ready(it) }
                .onFailure { _state.value = LoanUiState.Error(it.message ?: "Couldn't load your loan limit.") }
        }
    }

    fun submit(amountKes: String, reason: String, months: Int) {
        if (_submitting.value) return
        _submitError.value = null
        _submitting.value = true
        viewModelScope.launch {
            repo.submitLoan(amountKes, reason, months)
                .onSuccess { _result.value = it }
                .onFailure { _submitError.value = it.message ?: "Your request could not be submitted." }
            _submitting.value = false
        }
    }

    fun clearError() { _submitError.value = null }
}

// ── Score ──────────────────────────────────────────────────

sealed interface ScoreUiState {
    data object Loading : ScoreUiState
    data class Error(val message: String) : ScoreUiState
    data class Ready(val data: ScoreData) : ScoreUiState
}

class ScoreViewModel : ViewModel() {
    private val repo = ServiceLocator.repository
    private val _state = MutableStateFlow<ScoreUiState>(ScoreUiState.Loading)
    val state: StateFlow<ScoreUiState> = _state.asStateFlow()

    init { load() }

    fun load() {
        _state.value = ScoreUiState.Loading
        viewModelScope.launch {
            repo.loadScore()
                .onSuccess { _state.value = ScoreUiState.Ready(it) }
                .onFailure { _state.value = ScoreUiState.Error(it.message ?: "Couldn't load your score.") }
        }
    }
}
