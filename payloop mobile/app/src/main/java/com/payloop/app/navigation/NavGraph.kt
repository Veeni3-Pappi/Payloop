package com.payloop.app.navigation

import androidx.compose.runtime.Composable
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.payloop.app.ui.screens.ContributeScreen
import com.payloop.app.ui.screens.HomeScreen
import com.payloop.app.ui.screens.LoginScreen
import com.payloop.app.ui.screens.LoanRequestScreen
import com.payloop.app.ui.screens.Routes
import com.payloop.app.ui.screens.ScoreScreen

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
            LoanRequestScreen(onBack = { navController.popBackStack() })
        }

        composable(Routes.SCORE) {
            ScoreScreen(onBack = { navController.popBackStack() })
        }
    }
}