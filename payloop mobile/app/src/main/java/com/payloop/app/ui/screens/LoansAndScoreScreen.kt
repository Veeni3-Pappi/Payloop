package com.payloop.app.ui.screens

import androidx.compose.animation.*
import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.*
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.Send
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.*
import androidx.compose.ui.draw.*
import androidx.compose.ui.graphics.*
import androidx.compose.ui.text.font.*
import androidx.compose.ui.text.input.*
import androidx.compose.ui.text.style.*
import androidx.compose.ui.unit.*
import androidx.lifecycle.viewmodel.compose.viewModel
import com.payloop.app.data.LoanContext
import com.payloop.app.data.ScoreData

// ─────────────────────────────────────────────
// 4. LOAN REQUEST SCREEN
// ─────────────────────────────────────────────

@Composable
fun LoanRequestScreen(
    onBack: () -> Unit,
    viewModel: LoanViewModel = viewModel()
) {
    val state by viewModel.state.collectAsState()
    val result by viewModel.result.collectAsState()

    result?.let { r ->
        LoanSubmittedScreen(
            amount = r.amountMatic ?: "",
            days = r.repaymentDays ?: 0,
            onDone = onBack,
        )
        return
    }

    when (val s = state) {
        is LoanUiState.Loading -> {
            Column(Modifier.fillMaxSize().background(PayLoopTheme.Surface)) {
                ScreenTopBar("Request a Loan", onBack)
                FullScreenLoader()
            }
        }
        is LoanUiState.Error -> {
            Column(Modifier.fillMaxSize().background(PayLoopTheme.Surface)) {
                ScreenTopBar("Request a Loan", onBack)
                ErrorState(message = s.message, onRetry = { viewModel.load() })
            }
        }
        is LoanUiState.Ready -> LoanForm(context = s.context, viewModel = viewModel, onBack = onBack)
    }
}

@Composable
private fun LoanForm(
    context: LoanContext,
    viewModel: LoanViewModel,
    onBack: () -> Unit,
) {
    var amount by remember { mutableStateOf("") }
    var reason by remember { mutableStateOf("") }
    var selectedTerm by remember { mutableStateOf(1) } // months
    var localError by remember { mutableStateOf("") }

    val submitting by viewModel.submitting.collectAsState()
    val submitError by viewModel.submitError.collectAsState()

    val repaymentTerms = listOf(1, 2, 3, 6)
    val quickAmounts = listOf(500, 1000, 2000, 5000)
    val maxLoan = context.maxLoanKes
    val errorMsg = localError.ifEmpty { submitError ?: "" }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(PayLoopTheme.Surface)
    ) {
        ScreenTopBar("Request a Loan", onBack)

        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 24.dp, vertical = 24.dp)
        ) {

            // Score-based limit card
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = PayLoopTheme.Gold.copy(alpha = 0.12f))
            ) {
                Row(
                    modifier = Modifier.padding(16.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(Icons.Default.Star, contentDescription = null, tint = PayLoopTheme.Gold, modifier = Modifier.size(28.dp))
                    Spacer(Modifier.width(12.dp))
                    Column {
                        Text("Your loan limit", fontSize = 12.sp, color = PayLoopTheme.TextSec)
                        Text(
                            "KES ${"%,d".format(maxLoan)}",
                            fontSize = 20.sp,
                            fontWeight = FontWeight.Bold,
                            color = PayLoopTheme.TextPrim
                        )
                        Text(
                            "Based on your score of ${context.score}",
                            fontSize = 11.sp,
                            color = PayLoopTheme.TextSec
                        )
                    }
                }
            }

            Spacer(Modifier.height(24.dp))

            // Amount input
            Text("How much do you need?", fontSize = 14.sp, color = PayLoopTheme.TextSec, fontWeight = FontWeight.Medium)
            Spacer(Modifier.height(8.dp))

            OutlinedTextField(
                value = amount,
                onValueChange = {
                    if (it.all { c -> c.isDigit() }) { amount = it; localError = ""; viewModel.clearError() }
                },
                prefix = { Text("KES  ", fontWeight = FontWeight.Bold, color = PayLoopTheme.TextPrim) },
                placeholder = { Text("0") },
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                singleLine = true,
                textStyle = androidx.compose.ui.text.TextStyle(
                    fontSize = 28.sp,
                    fontWeight = FontWeight.Bold,
                    color = PayLoopTheme.TextPrim
                ),
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(14.dp),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = PayLoopTheme.Green600,
                    unfocusedBorderColor = PayLoopTheme.Divider
                )
            )

            Spacer(Modifier.height(12.dp))

            // Quick amounts
            Text("Quick amounts", fontSize = 12.sp, color = PayLoopTheme.TextSec)
            Spacer(Modifier.height(8.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                quickAmounts.forEach { preset ->
                    val selected = amount == preset.toString()
                    FilterChip(
                        selected = selected,
                        onClick = { amount = preset.toString(); localError = ""; viewModel.clearError() },
                        label = { Text("$preset") },
                        colors = FilterChipDefaults.filterChipColors(
                            selectedContainerColor = PayLoopTheme.Green600,
                            selectedLabelColor = Color.White
                        )
                    )
                }
            }

            Spacer(Modifier.height(24.dp))

            // Repayment term
            Text("Repayment period", fontSize = 14.sp, color = PayLoopTheme.TextSec, fontWeight = FontWeight.Medium)
            Spacer(Modifier.height(8.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                repaymentTerms.forEach { months ->
                    val selected = selectedTerm == months
                    FilterChip(
                        selected = selected,
                        onClick = { selectedTerm = months },
                        label = { Text(if (months == 1) "1 month" else "$months months") },
                        colors = FilterChipDefaults.filterChipColors(
                            selectedContainerColor = PayLoopTheme.Green600,
                            selectedLabelColor = Color.White
                        )
                    )
                }
            }

            Spacer(Modifier.height(24.dp))

            // Reason input
            Text("Reason for loan", fontSize = 14.sp, color = PayLoopTheme.TextSec, fontWeight = FontWeight.Medium)
            Spacer(Modifier.height(8.dp))
            OutlinedTextField(
                value = reason,
                onValueChange = { reason = it; if (localError.isNotEmpty()) localError = "" },
                placeholder = { Text("e.g. Business stock, school fees...") },
                minLines = 3,
                maxLines = 4,
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(14.dp),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = PayLoopTheme.Green600,
                    unfocusedBorderColor = PayLoopTheme.Divider
                )
            )

            AnimatedVisibility(visible = errorMsg.isNotEmpty()) {
                Text(
                    errorMsg,
                    color = MaterialTheme.colorScheme.error,
                    fontSize = 12.sp,
                    modifier = Modifier.padding(top = 8.dp)
                )
            }

            Spacer(Modifier.height(24.dp))

            // Summary
            if (amount.isNotEmpty() && amount.toIntOrNull() != null) {
                val amountInt = amount.toInt()
                val interest = (amountInt * 0.05).toInt() // 5% flat — confirm with team
                val total = amountInt + interest

                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(14.dp),
                    colors = CardDefaults.cardColors(containerColor = PayLoopTheme.Green600.copy(alpha = 0.07f))
                ) {
                    Column(Modifier.padding(16.dp)) {
                        LoanSummaryRow("Loan amount", "KES $amount")
                        LoanSummaryRow("Interest (5%)", "KES $interest")
                        HorizontalDivider(modifier = Modifier.padding(vertical = 8.dp), color = PayLoopTheme.Divider)
                        LoanSummaryRow("Total to repay", "KES ${"%,d".format(total)}", bold = true)
                        LoanSummaryRow("Over", "$selectedTerm ${if (selectedTerm == 1) "month" else "months"}")
                    }
                }

                Spacer(Modifier.height(24.dp))
            }

            // Submit button
            Button(
                onClick = {
                    val amountInt = amount.toIntOrNull() ?: 0
                    when {
                        amount.isEmpty() -> localError = "Enter an amount"
                        amountInt < 100 -> localError = "Minimum loan is KES 100"
                        amountInt > maxLoan -> localError = "Amount exceeds your limit of KES $maxLoan"
                        reason.isBlank() -> localError = "Please add a reason for your loan"
                        else -> viewModel.submit(amount, reason.trim(), selectedTerm)
                    }
                },
                modifier = Modifier.fillMaxWidth().height(54.dp),
                shape = RoundedCornerShape(14.dp),
                colors = ButtonDefaults.buttonColors(containerColor = PayLoopTheme.Green600),
                enabled = !submitting
            ) {
                if (submitting) {
                    CircularProgressIndicator(modifier = Modifier.size(22.dp), color = Color.White, strokeWidth = 2.dp)
                } else {
                    Icon(Icons.AutoMirrored.Filled.Send, contentDescription = null, modifier = Modifier.size(20.dp))
                    Spacer(Modifier.width(8.dp))
                    Text("Submit request", fontSize = 16.sp, fontWeight = FontWeight.SemiBold)
                }
            }

            Spacer(Modifier.height(12.dp))

            Text(
                "Loan requests are reviewed by your group members before approval.",
                fontSize = 12.sp,
                color = PayLoopTheme.TextSec,
                textAlign = TextAlign.Center,
                modifier = Modifier.fillMaxWidth()
            )

            Spacer(Modifier.height(32.dp))
        }
    }
}

@Composable
private fun LoanSummaryRow(label: String, value: String, bold: Boolean = false) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 3.dp),
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Text(
            label,
            fontSize = 13.sp,
            color = PayLoopTheme.TextSec,
            fontWeight = if (bold) FontWeight.SemiBold else FontWeight.Normal
        )
        Text(
            value,
            fontSize = 13.sp,
            fontWeight = if (bold) FontWeight.Bold else FontWeight.SemiBold,
            color = PayLoopTheme.TextPrim
        )
    }
}

// ─────────────────────────────────────────────
// LOAN SUBMITTED SUCCESS SCREEN
// ─────────────────────────────────────────────

@Composable
private fun LoanSubmittedScreen(amount: String, days: Int, onDone: () -> Unit) {
    val termText = when {
        days <= 0 -> "the agreed period"
        days % 30 == 0 -> {
            val m = days / 30
            "$m ${if (m == 1) "month" else "months"}"
        }
        else -> "$days days"
    }
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(PayLoopTheme.Surface)
            .padding(32.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Box(
            modifier = Modifier
                .size(96.dp)
                .clip(CircleShape)
                .background(PayLoopTheme.Gold.copy(alpha = 0.12f)),
            contentAlignment = Alignment.Center
        ) {
            Icon(Icons.Default.HourglassTop, contentDescription = null, tint = PayLoopTheme.Gold, modifier = Modifier.size(52.dp))
        }

        Spacer(Modifier.height(24.dp))

        Text("Request submitted!", fontSize = 24.sp, fontWeight = FontWeight.Bold, color = PayLoopTheme.TextPrim)

        Spacer(Modifier.height(8.dp))

        Text(
            "Your loan request of KES $amount for $termText is pending approval from your circle.",
            fontSize = 14.sp,
            color = PayLoopTheme.TextSec,
            textAlign = TextAlign.Center,
            lineHeight = 20.sp
        )

        Spacer(Modifier.height(16.dp))

        // Status chip
        Row(
            modifier = Modifier
                .clip(RoundedCornerShape(20.dp))
                .background(PayLoopTheme.Gold.copy(alpha = 0.12f))
                .padding(horizontal = 16.dp, vertical = 8.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(modifier = Modifier.size(8.dp).clip(CircleShape).background(PayLoopTheme.Gold))
            Spacer(Modifier.width(8.dp))
            Text("Pending approval", fontSize = 13.sp, color = PayLoopTheme.Gold, fontWeight = FontWeight.Medium)
        }

        Spacer(Modifier.height(40.dp))

        Button(
            onClick = onDone,
            modifier = Modifier.fillMaxWidth().height(52.dp),
            shape = RoundedCornerShape(14.dp),
            colors = ButtonDefaults.buttonColors(containerColor = PayLoopTheme.Green600)
        ) {
            Text("Back to home", fontSize = 16.sp, fontWeight = FontWeight.SemiBold)
        }
    }
}

// ─────────────────────────────────────────────
// 5. MY SCORE SCREEN
// ─────────────────────────────────────────────

@Composable
fun ScoreScreen(
    onBack: () -> Unit,
    viewModel: ScoreViewModel = viewModel()
) {
    val state by viewModel.state.collectAsState()

    Column(Modifier.fillMaxSize().background(PayLoopTheme.Surface)) {
        ScreenTopBar("My Score", onBack)
        when (val s = state) {
            is ScoreUiState.Loading -> FullScreenLoader()
            is ScoreUiState.Error -> ErrorState(message = s.message, onRetry = { viewModel.load() })
            is ScoreUiState.Ready -> ScoreContent(data = s.data)
        }
    }
}

@Composable
private fun ScoreContent(data: ScoreData) {
    // Score tier logic — on-chain CreditScore is a 0–1000 scale.
    val score = data.score
    val (tierLabel, tierColor, tierDesc) = when {
        score >= 800 -> Triple("Platinum", Color(0xFF7B61FF), "Excellent standing")
        score >= 650 -> Triple("Gold", PayLoopTheme.Gold, "Great track record")
        score >= 450 -> Triple("Silver", Color(0xFF90A4AE), "Good, keep it up")
        else -> Triple("Bronze", Color(0xFFBF8040), "Needs improvement")
    }

    // Turn raw counts into progress bars capped at a sensible target.
    fun progress(count: Int, target: Int) = (count.toFloat() / target).coerceIn(0f, 1f)

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 24.dp, vertical = 24.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {

        // Score circle
        Box(
            modifier = Modifier
                .size(160.dp)
                .clip(CircleShape)
                .background(tierColor.copy(alpha = 0.1f))
                .border(4.dp, tierColor, CircleShape),
            contentAlignment = Alignment.Center
        ) {
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Text(
                    "$score",
                    fontSize = 52.sp,
                    fontWeight = FontWeight.ExtraBold,
                    color = tierColor,
                    letterSpacing = (-2).sp
                )
                Text("/ 1000", fontSize = 14.sp, color = PayLoopTheme.TextSec)
            }
        }

        Spacer(Modifier.height(16.dp))

        // Tier badge
        Row(
            modifier = Modifier
                .clip(RoundedCornerShape(20.dp))
                .background(tierColor.copy(alpha = 0.12f))
                .padding(horizontal = 16.dp, vertical = 8.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(Icons.Default.Star, contentDescription = null, tint = tierColor, modifier = Modifier.size(16.dp))
            Spacer(Modifier.width(6.dp))
            Text(
                "$tierLabel Member — $tierDesc",
                fontSize = 13.sp,
                color = tierColor,
                fontWeight = FontWeight.SemiBold
            )
        }

        Spacer(Modifier.height(8.dp))

        Text(
            "Your score determines your loan limit and tier benefits.",
            fontSize = 12.sp,
            color = PayLoopTheme.TextSec,
            textAlign = TextAlign.Center
        )

        Spacer(Modifier.height(28.dp))

        // Score breakdown
        Text(
            "Score breakdown",
            fontSize = 15.sp,
            fontWeight = FontWeight.SemiBold,
            color = PayLoopTheme.TextPrim,
            modifier = Modifier.align(Alignment.Start)
        )

        Spacer(Modifier.height(12.dp))

        ScoreBreakdownCard(
            icon = Icons.Default.AddCircle,
            iconColor = PayLoopTheme.Green600,
            label = "On-time contributions",
            value = "${data.onTime}",
            points = "+${data.onTime * 10} pts",
            progress = progress(data.onTime, 12)
        )

        Spacer(Modifier.height(10.dp))

        ScoreBreakdownCard(
            icon = Icons.Default.CheckCircle,
            iconColor = PayLoopTheme.Green400,
            label = "Loans repaid",
            value = "${data.repaid}",
            points = "+${data.repaid * 15} pts",
            progress = progress(data.repaid, 5)
        )

        Spacer(Modifier.height(10.dp))

        ScoreBreakdownCard(
            icon = Icons.Default.Warning,
            iconColor = PayLoopTheme.Gold,
            label = "Missed contributions",
            value = "${data.missed}",
            points = if (data.missed > 0) "-${data.missed * 20} pts" else "0 pts",
            progress = progress(data.missed, 5)
        )

        Spacer(Modifier.height(28.dp))

        // Loan limit card
        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(containerColor = PayLoopTheme.Green900.copy(alpha = 0.05f))
        ) {
            Row(
                modifier = Modifier.padding(18.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(Icons.Default.AccountBalance, contentDescription = null, tint = PayLoopTheme.Green600, modifier = Modifier.size(28.dp))
                Spacer(Modifier.width(14.dp))
                Column {
                    Text("Current loan limit", fontSize = 12.sp, color = PayLoopTheme.TextSec)
                    Text(
                        "KES ${"%,d".format(data.maxLoanKes)}",
                        fontSize = 22.sp,
                        fontWeight = FontWeight.Bold,
                        color = PayLoopTheme.Green400
                    )
                    Text("Increase your score to unlock more", fontSize = 11.sp, color = PayLoopTheme.TextSec)
                }
            }
        }

        Spacer(Modifier.height(20.dp))

        // How to improve
        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(containerColor = PayLoopTheme.Card),
            elevation = CardDefaults.cardElevation(2.dp)
        ) {
            Column(Modifier.padding(18.dp)) {
                Text(
                    "How to improve your score",
                    fontSize = 14.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = PayLoopTheme.TextPrim
                )
                Spacer(Modifier.height(12.dp))
                ImprovementTip("Contribute every month on time")
                ImprovementTip("Repay loans before the due date")
                ImprovementTip("Avoid missing contribution cycles")
                ImprovementTip("Maintain a 6-month streak")
            }
        }

        Spacer(Modifier.height(32.dp))
    }
}

@Composable
private fun ScoreBreakdownCard(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    iconColor: Color,
    label: String,
    value: String,
    points: String,
    progress: Float
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(14.dp),
        colors = CardDefaults.cardColors(containerColor = PayLoopTheme.Card),
        elevation = CardDefaults.cardElevation(1.dp)
    ) {
        Column(Modifier.padding(16.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Box(
                    modifier = Modifier
                        .size(40.dp)
                        .clip(RoundedCornerShape(10.dp))
                        .background(iconColor.copy(alpha = 0.1f)),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(icon, contentDescription = null, tint = iconColor, modifier = Modifier.size(22.dp))
                }
                Spacer(Modifier.width(12.dp))
                Column(Modifier.weight(1f)) {
                    Text(label, fontSize = 13.sp, color = PayLoopTheme.TextSec)
                    Text(value, fontSize = 15.sp, fontWeight = FontWeight.SemiBold, color = PayLoopTheme.TextPrim)
                }
                Text(points, fontSize = 13.sp, fontWeight = FontWeight.Bold, color = PayLoopTheme.Green600)
            }
            Spacer(Modifier.height(10.dp))
            LinearProgressIndicator(
                progress = { progress },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(6.dp)
                    .clip(RoundedCornerShape(3.dp)),
                color = iconColor,
                trackColor = iconColor.copy(alpha = 0.15f)
            )
        }
    }
}

@Composable
private fun ImprovementTip(text: String) {
    Row(
        modifier = Modifier.padding(vertical = 4.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Box(modifier = Modifier.size(6.dp).clip(CircleShape).background(PayLoopTheme.Green400))
        Spacer(Modifier.width(10.dp))
        Text(text, fontSize = 13.sp, color = PayLoopTheme.TextSec)
    }
}
