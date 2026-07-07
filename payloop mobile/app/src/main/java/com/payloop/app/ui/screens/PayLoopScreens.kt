package com.payloop.app.ui.screens

import androidx.compose.animation.*
import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.*
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
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
import com.payloop.app.data.DashboardData
import java.math.BigDecimal

// ─────────────────────────────────────────────
// THEME / DESIGN TOKENS
// ─────────────────────────────────────────────

// "Obsidian Flux (Emerald)" — mapped onto the original token names so the
// screens below restyle in place. Sourced from the shared PayLoopColors
// (ui/theme/Color.kt), which also drives the Material scheme.
object PayLoopTheme {
    val Green900  = com.payloop.app.ui.theme.PayLoopColors.EmeraldDeep // deep emerald
    val Green600  = com.payloop.app.ui.theme.PayLoopColors.Emerald     // primary emerald — buttons
    val Green400  = com.payloop.app.ui.theme.PayLoopColors.Mint        // mint accent / highlight
    val Gold      = com.payloop.app.ui.theme.PayLoopColors.Amber       // score / warning accent
    val Surface   = com.payloop.app.ui.theme.PayLoopColors.BgPrimary   // obsidian background
    val Card      = com.payloop.app.ui.theme.PayLoopColors.BgCard      // obsidian card
    val TextPrim  = com.payloop.app.ui.theme.PayLoopColors.TextPrimary
    val TextSec   = com.payloop.app.ui.theme.PayLoopColors.TextSecondary
    val Divider   = com.payloop.app.ui.theme.PayLoopColors.GlassBorder

    val GradientBg = Brush.verticalGradient(
        colors = listOf(Color(0xFF131313), Color(0xFF191919))
    )
    // Emerald brand gradient for hero balances / logo accents.
    val Accent = Brush.linearGradient(
        colors = listOf(
            com.payloop.app.ui.theme.PayLoopColors.Emerald,
            com.payloop.app.ui.theme.PayLoopColors.Mint,
        )
    )
}

// ─────────────────────────────────────────────
// NAVIGATION ROUTES (for NavGraph wiring)
// ─────────────────────────────────────────────

object Routes {
    const val LOGIN      = "login"
    const val HOME       = "home"
    const val CONTRIBUTE = "contribute"
    const val LOAN       = "loan"
    const val SCORE      = "score"
}

// ─────────────────────────────────────────────
// 1. LOGIN SCREEN
// ─────────────────────────────────────────────

@Composable
fun LoginScreen(
    onLoginSuccess: () -> Unit,
    viewModel: LoginViewModel = viewModel()
) {
    val state by viewModel.state.collectAsState()
    val connecting = state is LoginUiState.Connecting

    // Navigate onward once the wallet is verified + JWT stored.
    LaunchedEffect(state) {
        if (state is LoginUiState.Success) onLoginSuccess()
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(PayLoopTheme.GradientBg)
    ) {
        // Subtle emerald glow orb (echoes the web hero mesh).
        Box(
            modifier = Modifier
                .align(Alignment.TopCenter)
                .offset(y = 40.dp)
                .size(280.dp)
                .clip(CircleShape)
                .background(PayLoopTheme.Green600.copy(alpha = 0.10f))
        )

        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 28.dp)
                .verticalScroll(rememberScrollState()),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Spacer(Modifier.height(88.dp))

            // Logo mark
            Box(
                modifier = Modifier
                    .size(76.dp)
                    .clip(CircleShape)
                    .background(PayLoopTheme.Green600.copy(alpha = 0.15f))
                    .border(2.dp, PayLoopTheme.Green400, CircleShape),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    "₱",
                    fontSize = 38.sp,
                    color = PayLoopTheme.Green400,
                    fontWeight = FontWeight.Bold
                )
            }

            Spacer(Modifier.height(20.dp))

            Text(
                "PayLoop",
                fontSize = 34.sp,
                fontWeight = FontWeight.ExtraBold,
                color = PayLoopTheme.TextPrim,
                letterSpacing = (-0.5).sp
            )
            Text(
                "Decentralized circle savings & credit.",
                fontSize = 14.sp,
                color = PayLoopTheme.TextSec,
                letterSpacing = 0.3.sp
            )

            Spacer(Modifier.height(48.dp))

            // Glass card
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(20.dp),
                colors = CardDefaults.cardColors(containerColor = PayLoopTheme.Card),
                border = BorderStroke(1.dp, PayLoopTheme.Divider),
                elevation = CardDefaults.cardElevation(0.dp)
            ) {
                Column(
                    Modifier.padding(24.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Text(
                        "Connect your wallet",
                        fontSize = 20.sp,
                        fontWeight = FontWeight.Bold,
                        color = PayLoopTheme.TextPrim
                    )
                    Spacer(Modifier.height(6.dp))
                    Text(
                        "Sign a message to verify wallet ownership. No password needed.",
                        fontSize = 13.sp,
                        color = PayLoopTheme.TextSec,
                        textAlign = TextAlign.Center,
                        lineHeight = 18.sp
                    )

                    Spacer(Modifier.height(24.dp))

                    // Connect button (emerald glow)
                    Button(
                        onClick = { viewModel.connectAndLogin() },
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(54.dp),
                        shape = RoundedCornerShape(14.dp),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = PayLoopTheme.Green600,
                            contentColor = Color(0xFF06231A)
                        ),
                        enabled = !connecting
                    ) {
                        if (connecting) {
                            CircularProgressIndicator(
                                modifier = Modifier.size(20.dp),
                                color = Color(0xFF06231A),
                                strokeWidth = 2.dp
                            )
                            Spacer(Modifier.width(10.dp))
                            Text("Connecting…", fontSize = 16.sp, fontWeight = FontWeight.SemiBold)
                        } else {
                            Icon(
                                Icons.Default.AccountBalanceWallet,
                                contentDescription = null,
                                modifier = Modifier.size(20.dp)
                            )
                            Spacer(Modifier.width(8.dp))
                            Text("Connect Wallet", fontSize = 16.sp, fontWeight = FontWeight.SemiBold)
                        }
                    }

                    // Error message
                    AnimatedVisibility(visible = state is LoginUiState.Error) {
                        Text(
                            (state as? LoginUiState.Error)?.message.orEmpty(),
                            color = MaterialTheme.colorScheme.error,
                            fontSize = 12.sp,
                            textAlign = TextAlign.Center,
                            modifier = Modifier.padding(top = 12.dp)
                        )
                    }
                }
            }

            Spacer(Modifier.height(24.dp))

            Text(
                "By connecting you agree to PayLoop's circle terms.",
                fontSize = 12.sp,
                color = PayLoopTheme.TextSec.copy(alpha = 0.7f),
                textAlign = TextAlign.Center
            )

            Spacer(Modifier.height(32.dp))
        }
    }
}

// ─────────────────────────────────────────────
// 2. HOME / DASHBOARD SCREEN
// ─────────────────────────────────────────────

@Composable
fun HomeScreen(
    onContributeClick: () -> Unit,
    onLoanClick: () -> Unit,
    onScoreClick: () -> Unit,
    viewModel: HomeViewModel = viewModel()
) {
    val state by viewModel.state.collectAsState()

    when (val s = state) {
        is HomeUiState.Loading -> FullScreenLoader()
        is HomeUiState.Error -> ErrorState(message = s.message, onRetry = { viewModel.load() })
        is HomeUiState.Ready -> HomeContent(
            data = s.data,
            onContributeClick = onContributeClick,
            onLoanClick = onLoanClick,
            onScoreClick = onScoreClick,
        )
    }
}

@Composable
private fun HomeContent(
    data: DashboardData,
    onContributeClick: () -> Unit,
    onLoanClick: () -> Unit,
    onScoreClick: () -> Unit,
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(PayLoopTheme.Surface)
            .verticalScroll(rememberScrollState())
    ) {
        // Header bar
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .background(PayLoopTheme.GradientBg)
                .padding(horizontal = 24.dp, vertical = 28.dp)
        ) {
            Column {
                Text(
                    "Welcome back 👋",
                    fontSize = 13.sp,
                    color = Color.White.copy(alpha = 0.7f)
                )
                Text(
                    data.memberName,
                    fontSize = 22.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color.White
                )
                Spacer(Modifier.height(4.dp))
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        Icons.Default.Group,
                        contentDescription = null,
                        tint = PayLoopTheme.Green400,
                        modifier = Modifier.size(14.dp)
                    )
                    Spacer(Modifier.width(4.dp))
                    Text(
                        data.groupName ?: "No circle yet",
                        fontSize = 13.sp,
                        color = PayLoopTheme.Green400
                    )
                }
            }
        }

        // Savings balance card
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 20.dp)
                .offset(y = (-16).dp),
            shape = RoundedCornerShape(20.dp),
            colors = CardDefaults.cardColors(containerColor = PayLoopTheme.Card),
            elevation = CardDefaults.cardElevation(6.dp)
        ) {
            Column(
                modifier = Modifier.padding(24.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Text(
                    if (data.hasCircle) "Group savings pool" else "Your savings balance",
                    fontSize = 13.sp,
                    color = PayLoopTheme.TextSec
                )
                Spacer(Modifier.height(8.dp))
                Text(
                    "KES ${formatKes(data.savingsPoolKes)}",
                    fontSize = 36.sp,
                    fontWeight = FontWeight.ExtraBold,
                    color = PayLoopTheme.Green400,
                    letterSpacing = (-1).sp
                )
                Spacer(Modifier.height(12.dp))
                HorizontalDivider(color = PayLoopTheme.Divider)
                Spacer(Modifier.height(12.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceEvenly
                ) {
                    StatChip(label = "Contributions", value = "${data.contributionsCount}")
                    StatChip(label = "Loans repaid", value = "${data.loansRepaid}")
                    StatChip(label = "Score", value = "${data.score}", isGold = true)
                }
            }
        }

        Spacer(Modifier.height(4.dp))

        if (!data.hasCircle) {
            Text(
                "You're not in a savings circle yet. Ask your group admin to add your wallet, then contributions and loans will unlock here.",
                fontSize = 13.sp,
                color = PayLoopTheme.TextSec,
                lineHeight = 18.sp,
                modifier = Modifier.padding(horizontal = 24.dp, vertical = 8.dp)
            )
        }

        // Actions
        Text(
            "What do you want to do?",
            fontSize = 14.sp,
            fontWeight = FontWeight.SemiBold,
            color = PayLoopTheme.TextSec,
            modifier = Modifier.padding(horizontal = 24.dp)
        )

        Spacer(Modifier.height(12.dp))

        Column(
            modifier = Modifier.padding(horizontal = 20.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            ActionCard(
                icon = Icons.Default.AddCircle,
                iconColor = PayLoopTheme.Green600,
                title = "Contribute",
                subtitle = "Add money to your group savings",
                enabled = data.hasCircle,
                onClick = onContributeClick
            )
            ActionCard(
                icon = Icons.Default.AccountBalance,
                iconColor = PayLoopTheme.Green400,
                title = "Request a loan",
                subtitle = "Borrow from the group pool",
                enabled = data.hasCircle,
                onClick = onLoanClick
            )
            ActionCard(
                icon = Icons.Default.Star,
                iconColor = PayLoopTheme.Gold,
                title = "My score",
                subtitle = "View your loyalty and credit score",
                enabled = true,
                onClick = onScoreClick
            )
        }

        Spacer(Modifier.height(32.dp))
    }
}

@Composable
private fun StatChip(label: String, value: String, isGold: Boolean = false) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text(
            value,
            fontSize = 20.sp,
            fontWeight = FontWeight.Bold,
            color = if (isGold) PayLoopTheme.Gold else PayLoopTheme.Green400
        )
        Text(
            label,
            fontSize = 11.sp,
            color = PayLoopTheme.TextSec
        )
    }
}

@Composable
private fun ActionCard(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    iconColor: Color,
    title: String,
    subtitle: String,
    enabled: Boolean,
    onClick: () -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .then(if (enabled) Modifier.clickable { onClick() } else Modifier)
            .alpha(if (enabled) 1f else 0.45f),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = PayLoopTheme.Card),
        elevation = CardDefaults.cardElevation(2.dp)
    ) {
        Row(
            modifier = Modifier.padding(18.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier
                    .size(48.dp)
                    .clip(RoundedCornerShape(12.dp))
                    .background(iconColor.copy(alpha = 0.1f)),
                contentAlignment = Alignment.Center
            ) {
                Icon(icon, contentDescription = null, tint = iconColor, modifier = Modifier.size(26.dp))
            }
            Spacer(Modifier.width(16.dp))
            Column(Modifier.weight(1f)) {
                Text(title, fontSize = 16.sp, fontWeight = FontWeight.SemiBold, color = PayLoopTheme.TextPrim)
                Text(subtitle, fontSize = 12.sp, color = PayLoopTheme.TextSec)
            }
            Icon(
                Icons.Default.ChevronRight,
                contentDescription = null,
                tint = PayLoopTheme.TextSec.copy(alpha = 0.5f)
            )
        }
    }
}

// ─────────────────────────────────────────────
// 3. CONTRIBUTE SCREEN
// ─────────────────────────────────────────────

@Composable
fun ContributeScreen(
    onBack: () -> Unit,
    viewModel: ContributeViewModel = viewModel()
) {
    val state by viewModel.state.collectAsState()
    val result by viewModel.result.collectAsState()

    // Success takes over the whole screen once the STK push is accepted.
    result?.let { r ->
        ContributeSuccessScreen(message = r.message ?: "Check your phone to complete M-Pesa payment.", onDone = onBack)
        return
    }

    when (val s = state) {
        is ContributeUiState.Loading -> {
            Column(Modifier.fillMaxSize().background(PayLoopTheme.Surface)) {
                ScreenTopBar("Contribute", onBack)
                FullScreenLoader()
            }
        }
        is ContributeUiState.Error -> {
            Column(Modifier.fillMaxSize().background(PayLoopTheme.Surface)) {
                ScreenTopBar("Contribute", onBack)
                ErrorState(message = s.message, onRetry = { viewModel.load() })
            }
        }
        is ContributeUiState.Ready -> ContributeForm(
            groupName = s.context.groupName,
            initialPhone = s.context.phoneNumber,
            viewModel = viewModel,
            onBack = onBack,
        )
    }
}

@Composable
private fun ContributeForm(
    groupName: String?,
    initialPhone: String,
    viewModel: ContributeViewModel,
    onBack: () -> Unit,
) {
    var amount by remember { mutableStateOf("") }
    var phone by remember { mutableStateOf(initialPhone) }
    var localError by remember { mutableStateOf("") }

    val submitting by viewModel.submitting.collectAsState()
    val submitError by viewModel.submitError.collectAsState()

    val quickAmounts = listOf(100, 250, 500, 1000)
    val errorMsg = localError.ifEmpty { submitError ?: "" }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(PayLoopTheme.Surface)
    ) {
        ScreenTopBar("Contribute", onBack)

        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 24.dp, vertical = 28.dp)
        ) {
            // Group info chip
            Row(
                modifier = Modifier
                    .clip(RoundedCornerShape(20.dp))
                    .background(PayLoopTheme.Green600.copy(alpha = 0.1f))
                    .padding(horizontal = 14.dp, vertical = 8.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(
                    Icons.Default.Group,
                    contentDescription = null,
                    tint = PayLoopTheme.Green600,
                    modifier = Modifier.size(16.dp)
                )
                Spacer(Modifier.width(6.dp))
                Text(
                    "Contributing to ${groupName ?: "your circle"}",
                    fontSize = 13.sp,
                    color = PayLoopTheme.Green600,
                    fontWeight = FontWeight.Medium
                )
            }

            Spacer(Modifier.height(28.dp))

            Text("Enter amount", fontSize = 14.sp, color = PayLoopTheme.TextSec, fontWeight = FontWeight.Medium)
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

            Spacer(Modifier.height(16.dp))

            // Quick amount chips
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

            Spacer(Modifier.height(20.dp))

            // M-Pesa phone number (prefilled from profile, editable)
            Text("M-Pesa phone number", fontSize = 14.sp, color = PayLoopTheme.TextSec, fontWeight = FontWeight.Medium)
            Spacer(Modifier.height(8.dp))
            OutlinedTextField(
                value = phone,
                onValueChange = {
                    if (it.all { c -> c.isDigit() } && it.length <= 12) { phone = it; localError = ""; viewModel.clearError() }
                },
                placeholder = { Text("2547XXXXXXXX") },
                leadingIcon = { Icon(Icons.Default.PhoneAndroid, contentDescription = null, tint = PayLoopTheme.TextSec) },
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone),
                singleLine = true,
                supportingText = { Text("Kenyan format, starts with 254", fontSize = 11.sp, color = PayLoopTheme.TextSec) },
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

            // Summary box
            if (amount.isNotEmpty() && amount.toIntOrNull() != null) {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(14.dp),
                    colors = CardDefaults.cardColors(containerColor = PayLoopTheme.Green600.copy(alpha = 0.07f))
                ) {
                    Column(Modifier.padding(16.dp)) {
                        SummaryRow("You're sending", "KES $amount")
                        SummaryRow("To", groupName ?: "your circle")
                        SummaryRow("Via", "M-Pesa STK Push")
                    }
                }
                Spacer(Modifier.height(24.dp))
            }

            // Confirm button
            Button(
                onClick = {
                    val amt = amount.toIntOrNull() ?: 0
                    when {
                        amount.isEmpty() -> localError = "Enter an amount"
                        amt < 10 -> localError = "Minimum contribution is KES 10"
                        phone.length != 12 || !phone.startsWith("254") ->
                            localError = "Enter a valid M-Pesa number (254…)"
                        else -> viewModel.contribute(amount, phone)
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
                    Icon(Icons.Default.PhoneAndroid, contentDescription = null, modifier = Modifier.size(20.dp))
                    Spacer(Modifier.width(8.dp))
                    Text("Confirm via M-Pesa", fontSize = 16.sp, fontWeight = FontWeight.SemiBold)
                }
            }

            Spacer(Modifier.height(12.dp))

            Text(
                "An M-Pesa prompt will appear on your phone to complete payment.",
                fontSize = 12.sp,
                color = PayLoopTheme.TextSec,
                textAlign = TextAlign.Center,
                modifier = Modifier.fillMaxWidth()
            )
        }
    }
}

@Composable
private fun SummaryRow(label: String, value: String) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 4.dp),
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Text(label, fontSize = 13.sp, color = PayLoopTheme.TextSec)
        Text(value, fontSize = 13.sp, fontWeight = FontWeight.SemiBold, color = PayLoopTheme.TextPrim)
    }
}

// ─────────────────────────────────────────────
// CONTRIBUTE SUCCESS STATE
// ─────────────────────────────────────────────

@Composable
private fun ContributeSuccessScreen(message: String, onDone: () -> Unit) {
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
                .background(PayLoopTheme.Green400.copy(alpha = 0.15f)),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                Icons.Default.CheckCircle,
                contentDescription = null,
                tint = PayLoopTheme.Green400,
                modifier = Modifier.size(56.dp)
            )
        }

        Spacer(Modifier.height(24.dp))

        Text("Payment started!", fontSize = 24.sp, fontWeight = FontWeight.Bold, color = PayLoopTheme.TextPrim)
        Spacer(Modifier.height(8.dp))
        Text(
            message,
            fontSize = 14.sp,
            color = PayLoopTheme.TextSec,
            textAlign = TextAlign.Center,
            lineHeight = 20.sp
        )

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
// SHARED FORMATTING
// ─────────────────────────────────────────────

/** Format a KES amount with thousands separators and no decimals. */
fun formatKes(value: BigDecimal): String = "%,.0f".format(value)
