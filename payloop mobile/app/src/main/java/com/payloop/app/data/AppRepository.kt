package com.payloop.app.data

import com.payloop.app.data.api.CreateLoanRequest
import com.payloop.app.data.api.LoanDto
import com.payloop.app.data.api.PayLoopApi
import com.payloop.app.data.api.ProfileUpdateRequest
import com.payloop.app.data.api.StkPushRequest
import com.payloop.app.data.api.StkPushResponse
import com.payloop.app.data.auth.TokenStore
import java.math.BigDecimal

/**
 * Aggregates the backend endpoints into the small set of screen-shaped
 * results the UI needs. Every public call returns a [Result] so ViewModels
 * can render Loading / Success / Error without try/catch noise.
 *
 * The current wallet address is the one persisted at login (TokenStore).
 * The "active circle" is the first circle the user belongs to — the backend
 * auto-enrols each wallet into the demo circle on verify-wallet, so there is
 * normally exactly one. It is cached after the first lookup.
 */
class AppRepository(
    private val api: PayLoopApi,
    private val tokenStore: TokenStore,
) {
    @Volatile
    private var cachedCircleId: String? = null

    @Volatile
    private var cachedCircleName: String? = null

    private suspend fun wallet(): String =
        tokenStore.address() ?: error("No wallet on file — please sign in again.")

    /** Resolve (and cache) the user's active circle, or null if they have none. */
    private suspend fun activeCircle(): Pair<String, String?>? {
        cachedCircleId?.let { return it to cachedCircleName }
        val circle = api.getCircles().items.firstOrNull() ?: return null
        cachedCircleId = circle.id
        cachedCircleName = circle.name
        return circle.id to circle.name
    }

    // ── Dashboard ──────────────────────────────────────────

    suspend fun loadDashboard(): Result<DashboardData> = runCatching {
        val address = wallet()
        val profile = runCatching { api.getProfile() }.getOrNull()
        val score = runCatching { api.getScore(address).score }.getOrDefault(0)

        val circle = activeCircle()
        if (circle == null) {
            return@runCatching DashboardData(
                memberName = profile?.displayName?.takeIf { it.isNotBlank() }
                    ?: shortAddress(address),
                groupName = null,
                savingsPoolKes = BigDecimal.ZERO,
                contributionsCount = 0,
                loansRepaid = 0,
                score = score,
                hasCircle = false,
            )
        }

        val (circleId, circleName) = circle
        val contributions = runCatching { api.getContributions(circleId) }.getOrDefault(emptyList())
        val loans = runCatching { api.getLoans(circleId) }.getOrDefault(emptyList())

        val pool = contributions.fold(BigDecimal.ZERO) { acc, c ->
            acc + (c.amount?.toBigDecimalOrNull() ?: BigDecimal.ZERO)
        }
        val myRepaid = loans.count {
            it.borrowerWallet?.equals(address, ignoreCase = true) == true && it.status == "repaid"
        }

        DashboardData(
            memberName = profile?.displayName?.takeIf { it.isNotBlank() }
                ?: shortAddress(address),
            groupName = circleName,
            savingsPoolKes = pool,
            contributionsCount = contributions.size,
            loansRepaid = myRepaid,
            score = score,
            hasCircle = true,
        )
    }

    // ── Contribute ─────────────────────────────────────────

    suspend fun loadContributeContext(): Result<ContributeContext> = runCatching {
        val address = wallet()
        val profile = runCatching { api.getProfile() }.getOrNull()
        val circle = activeCircle()
        ContributeContext(
            walletAddress = address,
            groupName = circle?.second,
            phoneNumber = profile?.phoneNumber.orEmpty(),
            hasCircle = circle != null,
        )
    }

    /**
     * Persist an edited phone number (best-effort) then fire the STK push.
     * The backend requires a 254… number; validation happens in the ViewModel.
     */
    suspend fun contribute(amountKes: String, phone: String): Result<StkPushResponse> = runCatching {
        val address = wallet()
        val (circleId, _) = activeCircle() ?: error("You are not in a circle yet.")

        // Save the phone back to the profile so it prefills next time.
        runCatching { api.updateProfile(ProfileUpdateRequest(phoneNumber = phone)) }

        api.stkPush(
            StkPushRequest(
                phoneNumber = phone,
                amount = amountKes,
                circleId = circleId,
                walletAddress = address,
            )
        )
    }

    // ── Loans ──────────────────────────────────────────────

    suspend fun loadLoanContext(): Result<LoanContext> = runCatching {
        val address = wallet()
        val score = runCatching { api.getScore(address).score }.getOrDefault(0)
        val circle = activeCircle()
        LoanContext(
            score = score,
            maxLoanKes = LoanMath.maxLoanKes(score),
            hasCircle = circle != null,
        )
    }

    suspend fun submitLoan(amountKes: String, reason: String, months: Int): Result<LoanDto> = runCatching {
        val (circleId, _) = activeCircle() ?: error("You are not in a circle yet.")
        api.createLoan(
            circleId,
            CreateLoanRequest(
                amountMatic = amountKes,
                reason = reason,
                repaymentDays = months * 30,
            )
        )
    }

    // ── Score ──────────────────────────────────────────────

    suspend fun loadScore(): Result<ScoreData> = runCatching {
        val address = wallet()
        val dto = api.getScore(address)
        ScoreData(
            score = dto.score,
            onTime = dto.breakdown.onTime,
            missed = dto.breakdown.missed,
            repaid = dto.breakdown.repaid,
            maxLoanKes = LoanMath.maxLoanKes(dto.score),
        )
    }

    private fun shortAddress(addr: String): String =
        if (addr.length > 10) "${addr.take(6)}…${addr.takeLast(4)}" else addr
}

/**
 * Shared loan-limit math so the Score and Loan screens never disagree.
 * The on-chain CreditScore is a 0–1000 scale; we grant KES 10 of headroom
 * per point (default score 500 → KES 5,000 limit).
 */
object LoanMath {
    const val KES_PER_POINT = 10
    fun maxLoanKes(score: Int): Int = score.coerceAtLeast(0) * KES_PER_POINT
}

// ── Screen-shaped domain models ────────────────────────────

data class DashboardData(
    val memberName: String,
    val groupName: String?,
    val savingsPoolKes: BigDecimal,
    val contributionsCount: Int,
    val loansRepaid: Int,
    val score: Int,
    val hasCircle: Boolean,
)

data class ContributeContext(
    val walletAddress: String,
    val groupName: String?,
    val phoneNumber: String,
    val hasCircle: Boolean,
)

data class LoanContext(
    val score: Int,
    val maxLoanKes: Int,
    val hasCircle: Boolean,
)

data class ScoreData(
    val score: Int,
    val onTime: Int,
    val missed: Int,
    val repaid: Int,
    val maxLoanKes: Int,
)
