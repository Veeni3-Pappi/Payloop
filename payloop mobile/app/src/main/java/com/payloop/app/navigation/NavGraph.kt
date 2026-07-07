package com.payloop.app.navigation

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.produceState
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.payloop.app.data.ServiceLocator
import com.payloop.app.ui.screens.ContributeScreen
import com.payloop.app.ui.screens.HomeScreen
import com.payloop.app.ui.screens.LoanRequestScreen
import com.payloop.app.ui.screens.LoginScreen
import com.payloop.app.ui.screens.Routes
import com.payloop.app.ui.screens.ScoreScreen
import com.payloop.app.ui.theme.PayLoopColors

@Composable
fun PayLoopNavGraph() {
    val navController = rememberNavController()

    // Session resume: skip login if a valid JWT is already stored.
    val loggedIn by produceState<Boolean?>(initialValue = null) {
        value = ServiceLocator.authRepository.isLoggedIn()
    }

    if (loggedIn == null) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(PayLoopColors.BgPrimary),
            contentAlignment = Alignment.Center
        ) {
            CircularProgressIndicator(color = PayLoopColors.Emerald)
        }
        return
    }

    NavHost(
        navController = navController,
        startDestination = if (loggedIn == true) Routes.HOME else Routes.LOGIN
    ) {

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
            LoanRequestScreen(onBack = { navController.popBackStack() })
        }

        composable(Routes.SCORE) {
            ScoreScreen(onBack = { navController.popBackStack() })
        }
    }
}
