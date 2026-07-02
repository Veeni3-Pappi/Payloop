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
import androidx.compose.ui.tooling.preview.Preview

// ─────────────────────────────────────────────
// THEME / DESIGN TOKENS
// ─────────────────────────────────────────────

object PayLoopTheme {
    val Green900  = Color(0xFF0A3D1F)   // deep forest — primary brand
    val Green600  = Color(0xFF1A7A3C)   // mid green — buttons
    val Green400  = Color(0xFF2ECC71)   // accent / highlight
    val Gold      = Color(0xFFF5C842)   // loyalty / score accent
    val Surface   = Color(0xFFF7F9F5)   // off-white tinted green
    val Card      = Color(0xFFFFFFFF)
    val TextPrim  = Color(0xFF0A1F12)
    val TextSec   = Color(0xFF5A7060)
    val Divider   = Color(0xFFDDE8DF)

    val GradientBg = Brush.verticalGradient(
        colors = listOf(Green900, Color(0xFF0F5C2A))
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
// MOCK DATA (swap with Retrofit calls later)
// ─────────────────────────────────────────────

object MockData {
    val memberName    = "Wesley Mercs"
    val groupName     = "Eldohub Chama"
    val savingsKES    = 12_450.00
    val scorePoints   = 84
    val contributions = 9
    val loansRepaid   = 2
}

// ─────────────────────────────────────────────
// 1. LOGIN SCREEN
// ─────────────────────────────────────────────

@Composable
fun LoginScreen(onLoginSuccess: () -> Unit) {
    var phone by remember { mutableStateOf("") }
    var pin   by remember { mutableStateOf("") }
    var pinVisible by remember { mutableStateOf(false) }
    var isLoading  by remember { mutableStateOf(false) }
    var errorMsg   by remember { mutableStateOf("") }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(PayLoopTheme.GradientBg)
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 28.dp)
                .verticalScroll(rememberScrollState()),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Spacer(Modifier.height(72.dp))

            // Logo mark
            Box(
                modifier = Modifier
                    .size(72.dp)
                    .clip(CircleShape)
                    .background(PayLoopTheme.Green400.copy(alpha = 0.15f))
                    .border(2.dp, PayLoopTheme.Green400, CircleShape),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    "₱",
                    fontSize = 36.sp,
                    color = PayLoopTheme.Green400,
                    fontWeight = FontWeight.Bold
                )
            }

            Spacer(Modifier.height(20.dp))

            Text(
                "PayLoop",
                fontSize = 32.sp,
                fontWeight = FontWeight.ExtraBold,
                color = Color.White,
                letterSpacing = (-0.5).sp
            )
            Text(
                "Save together. Grow together.",
                fontSize = 14.sp,
                color = PayLoopTheme.Green400.copy(alpha = 0.85f),
                letterSpacing = 0.3.sp
            )

            Spacer(Modifier.height(48.dp))

            // Card
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(20.dp),
                colors = CardDefaults.cardColors(containerColor = PayLoopTheme.Card),
                elevation = CardDefaults.cardElevation(8.dp)
            ) {
                Column(Modifier.padding(24.dp)) {
                    Text(
                        "Sign in",
                        fontSize = 20.sp,
                        fontWeight = FontWeight.Bold,
                        color = PayLoopTheme.TextPrim
                    )
                    Text(
                        "Enter your phone number and PIN",
                        fontSize = 13.sp,
                        color = PayLoopTheme.TextSec
                    )

                    Spacer(Modifier.height(24.dp))

                    // Phone field
                    OutlinedTextField(
                        value = phone,
                        onValueChange = {
                            if (it.length <= 10) phone = it
                            errorMsg = ""
                        },
                        label = { Text("Phone number") },
                        placeholder = { Text("07XX XXX XXX") },
                        leadingIcon = {
                            Text(
                                "🇰🇪",
                                modifier = Modifier.padding(start = 12.dp),
                                fontSize = 18.sp
                            )
                        },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone),
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(12.dp),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = PayLoopTheme.Green600,
                            focusedLabelColor  = PayLoopTheme.Green600
                        )
                    )

                    Spacer(Modifier.height(16.dp))

                    // PIN field
                    OutlinedTextField(
                        value = pin,
                        onValueChange = {
                            if (it.length <= 4) pin = it
                            errorMsg = ""
                        },
                        label = { Text("PIN") },
                        placeholder = { Text("4-digit PIN") },
                        leadingIcon = {
                            Icon(
                                Icons.Default.Lock,
                                contentDescription = null,
                                tint = PayLoopTheme.TextSec
                            )
                        },
                        trailingIcon = {
                            IconButton(onClick = { pinVisible = !pinVisible }) {
                                Icon(
                                    if (pinVisible) Icons.Default.VisibilityOff
                                    else Icons.Default.Visibility,
                                    contentDescription = null,
                                    tint = PayLoopTheme.TextSec
                                )
                            }
                        },
                        visualTransformation = if (pinVisible) VisualTransformation.None
                        else PasswordVisualTransformation(),
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.NumberPassword),
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(12.dp),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = PayLoopTheme.Green600,
                            focusedLabelColor  = PayLoopTheme.Green600
                        )
                    )

                    // Error message
                    AnimatedVisibility(visible = errorMsg.isNotEmpty()) {
                        Text(
                            errorMsg,
                            color = MaterialTheme.colorScheme.error,
                            fontSize = 12.sp,
                            modifier = Modifier.padding(top = 6.dp)
                        )
                    }

                    Spacer(Modifier.height(24.dp))

                    // Login button
                    Button(
                        onClick = {
                            when {
                                phone.length < 10 -> errorMsg = "Enter a valid phone number"
                                pin.length < 4    -> errorMsg = "PIN must be 4 digits"
                                else -> {
                                    isLoading = true
                                    // TODO: Replace with Firebase Auth call
                                    // FirebaseAuth.getInstance().signInWith...
                                    onLoginSuccess()
                                }
                            }
                        },
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(52.dp),
                        shape = RoundedCornerShape(12.dp),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = PayLoopTheme.Green600
                        ),
                        enabled = !isLoading
                    ) {
                        if (isLoading) {
                            CircularProgressIndicator(
                                modifier = Modifier.size(20.dp),
                                color = Color.White,
                                strokeWidth = 2.dp
                            )
                        } else {
                            Text(
                                "Sign in",
                                fontSize = 16.sp,
                                fontWeight = FontWeight.SemiBold
                            )
                        }
                    }
                }
            }

            Spacer(Modifier.height(24.dp))

            Text(
                "Contact your group admin if you need access",
                fontSize = 12.sp,
                color = Color.White.copy(alpha = 0.5f),
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
    onScoreClick: () -> Unit
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
                    "Good morning 👋",
                    fontSize = 13.sp,
                    color = Color.White.copy(alpha = 0.7f)
                )
                Text(
                    MockData.memberName,
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
                        MockData.groupName,
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
                    "Your savings balance",
                    fontSize = 13.sp,
                    color = PayLoopTheme.TextSec
                )
                Spacer(Modifier.height(8.dp))
                Text(
                    "KES ${"%,.0f".format(MockData.savingsKES)}",
                    fontSize = 36.sp,
                    fontWeight = FontWeight.ExtraBold,
                    color = PayLoopTheme.Green900,
                    letterSpacing = (-1).sp
                )
                Spacer(Modifier.height(12.dp))
                HorizontalDivider(color = PayLoopTheme.Divider)
                Spacer(Modifier.height(12.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceEvenly
                ) {
                    StatChip(label = "Contributions", value = "${MockData.contributions}")
                    StatChip(label = "Loans repaid", value = "${MockData.loansRepaid}")
                    StatChip(label = "Score", value = "${MockData.scorePoints}", isGold = true)
                }
            }
        }

        Spacer(Modifier.height(4.dp))

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
                onClick = onContributeClick
            )
            ActionCard(
                icon = Icons.Default.AccountBalance,
                iconColor = Color(0xFF1565C0),
                title = "Request a loan",
                subtitle = "Borrow from the group pool",
                onClick = onLoanClick
            )
            ActionCard(
                icon = Icons.Default.Star,
                iconColor = PayLoopTheme.Gold,
                title = "My score",
                subtitle = "View your loyalty and credit score",
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
            color = if (isGold) PayLoopTheme.Gold else PayLoopTheme.Green900
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
    onClick: () -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onClick() },
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
fun ContributeScreen(onBack: () -> Unit) {
    var amount      by remember { mutableStateOf("") }
    var isLoading   by remember { mutableStateOf(false) }
    var isSuccess   by remember { mutableStateOf(false) }
    var errorMsg    by remember { mutableStateOf("") }

    val quickAmounts = listOf(100, 250, 500, 1000)

    if (isSuccess) {
        ContributeSuccessScreen(amount = amount, onDone = onBack)
        return
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(PayLoopTheme.Surface)
    ) {
        // Top bar
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .background(PayLoopTheme.GradientBg)
                .padding(horizontal = 20.dp, vertical = 20.dp)
        ) {
            IconButton(
                onClick = onBack,
                modifier = Modifier.align(Alignment.CenterStart)
            ) {
                Icon(Icons.Default.ArrowBack, contentDescription = "Back", tint = Color.White)
            }
            Text(
                "Contribute",
                fontSize = 18.sp,
                fontWeight = FontWeight.Bold,
                color = Color.White,
                modifier = Modifier.align(Alignment.Center)
            )
        }

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
                    "Contributing to ${MockData.groupName}",
                    fontSize = 13.sp,
                    color = PayLoopTheme.Green600,
                    fontWeight = FontWeight.Medium
                )
            }

            Spacer(Modifier.height(28.dp))

            Text(
                "Enter amount",
                fontSize = 14.sp,
                color = PayLoopTheme.TextSec,
                fontWeight = FontWeight.Medium
            )

            Spacer(Modifier.height(8.dp))

            // Amount input
            OutlinedTextField(
                value = amount,
                onValueChange = {
                    if (it.all { c -> c.isDigit() }) {
                        amount = it
                        errorMsg = ""
                    }
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
                        onClick = {
                            amount = preset.toString()
                            errorMsg = ""
                        },
                        label = { Text("$preset") },
                        colors = FilterChipDefaults.filterChipColors(
                            selectedContainerColor = PayLoopTheme.Green600,
                            selectedLabelColor = Color.White
                        )
                    )
                }
            }

            AnimatedVisibility(visible = errorMsg.isNotEmpty()) {
                Text(
                    errorMsg,
                    color = MaterialTheme.colorScheme.error,
                    fontSize = 12.sp,
                    modifier = Modifier.padding(top = 8.dp)
                )
            }

            Spacer(Modifier.height(32.dp))

            // Summary box
            if (amount.isNotEmpty() && amount.toIntOrNull() != null) {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(14.dp),
                    colors = CardDefaults.cardColors(
                        containerColor = PayLoopTheme.Green600.copy(alpha = 0.07f)
                    )
                ) {
                    Column(Modifier.padding(16.dp)) {
                        SummaryRow("You're sending", "KES $amount")
                        SummaryRow("To", MockData.groupName)
                        SummaryRow("Via", "M-Pesa STK Push")
                    }
                }
                Spacer(Modifier.height(24.dp))
            }

            // Confirm button
            Button(
                onClick = {
                    when {
                        amount.isEmpty() -> errorMsg = "Enter an amount"
                        (amount.toIntOrNull() ?: 0) < 10 -> errorMsg = "Minimum contribution is KES 10"
                        else -> {
                            isLoading = true
                            // TODO: Replace with API call to Team C
                            // POST /api/contribute { amount, phone }
                            // M-Pesa STK push will be triggered server-side
                            isSuccess = true
                            isLoading = false
                        }
                    }
                },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(54.dp),
                shape = RoundedCornerShape(14.dp),
                colors = ButtonDefaults.buttonColors(containerColor = PayLoopTheme.Green600),
                enabled = !isLoading
            ) {
                if (isLoading) {
                    CircularProgressIndicator(
                        modifier = Modifier.size(22.dp),
                        color = Color.White,
                        strokeWidth = 2.dp
                    )
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
private fun ContributeSuccessScreen(amount: String, onDone: () -> Unit) {
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

        Text(
            "Contribution sent!",
            fontSize = 24.sp,
            fontWeight = FontWeight.Bold,
            color = PayLoopTheme.TextPrim
        )
        Spacer(Modifier.height(8.dp))
        Text(
            "KES $amount is on its way to ${MockData.groupName}.\nCheck your phone to complete M-Pesa payment.",
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
// NAVIGATION GRAPH (NavGraph.kt)
// ─────────────────────────────────────────────

/*
Paste this in your NavGraph.kt file:

@Composable
fun PayLoopNavGraph() {
    val navController = rememberNavController()

    NavHost(navController = navController, startDestination = Routes.LOGIN) {

        composable(Routes.LOGIN) {
            LoginScreen(onLoginSuccess = {
                navController.navigate(Routes.HOME) {
                    popUpTo(Routes.LOGIN) { inclusive = true }
                }
            })
        }

        composable(Routes.HOME) {
            HomeScreen(
                onContributeClick = { navController.navigate(Routes.CONTRIBUTE) },
                onLoanClick       = { navController.navigate(Routes.LOAN) },
                onScoreClick      = { navController.navigate(Routes.SCORE) }
            )
        }

        composable(Routes.CONTRIBUTE) {
            ContributeScreen(onBack = { navController.popBackStack() })
        }

        composable(Routes.LOAN) {
            // LoanRequestScreen(onBack = { navController.popBackStack() })
        }

        composable(Routes.SCORE) {
            // ScoreScreen(onBack = { navController.popBackStack() })
        }
    }
}
*/