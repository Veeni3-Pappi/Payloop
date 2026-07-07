package com.payloop.app.ui.theme

import android.app.Activity
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.platform.LocalView
import androidx.core.view.WindowCompat

/**
 * PayLoop is dark-only ("Obsidian Flux"), matching the web dashboard.
 * Dynamic color is intentionally disabled so the emerald brand is
 * consistent across devices.
 */
private val PayLoopColorScheme = darkColorScheme(
    primary = PayLoopColors.Emerald,
    onPrimary = PayLoopColors.BgPrimary,
    secondary = PayLoopColors.Mint,
    onSecondary = PayLoopColors.BgPrimary,
    tertiary = PayLoopColors.EmeraldDeep,
    background = PayLoopColors.BgPrimary,
    onBackground = PayLoopColors.TextPrimary,
    surface = PayLoopColors.BgCard,
    onSurface = PayLoopColors.TextPrimary,
    surfaceVariant = PayLoopColors.BgSecondary,
    onSurfaceVariant = PayLoopColors.TextSecondary,
    outline = PayLoopColors.BorderSubtle,
    error = PayLoopColors.Red,
    onError = PayLoopColors.TextPrimary,
)

@Composable
fun PayloopTheme(content: @Composable () -> Unit) {
    val view = LocalView.current
    if (!view.isInEditMode) {
        val window = (view.context as Activity).window
        window.statusBarColor = PayLoopColors.BgPrimary.toArgb()
        window.navigationBarColor = PayLoopColors.BgPrimary.toArgb()
        val insets = WindowCompat.getInsetsController(window, view)
        insets.isAppearanceLightStatusBars = false
        insets.isAppearanceLightNavigationBars = false
    }

    MaterialTheme(
        colorScheme = PayLoopColorScheme,
        typography = Typography,
        content = content,
    )
}
