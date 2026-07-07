package com.payloop.app.ui.theme

import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color

/**
 * PayLoop — "Obsidian Flux (Emerald)" design tokens.
 *
 * Mirrors the web dashboard's design system (web/app/globals.css):
 * deep obsidian surfaces + emerald accents, glassmorphism, dark-only.
 * Single source of truth for both the Material color scheme (Theme.kt)
 * and the hand-styled Compose screens.
 */
object PayLoopColors {
    // Obsidian surfaces
    val BgPrimary = Color(0xFF131313)
    val BgSecondary = Color(0xFF191919)
    val BgCard = Color(0xFF1C1C1E)
    val BgCardHover = Color(0xFF242426)

    // Emerald accent system
    val Emerald = Color(0xFF10B981) // primary
    val Mint = Color(0xFF34D399) // light emerald
    val EmeraldDeep = Color(0xFF059669) // deep emerald

    // Semantic
    val Red = Color(0xFFEF4444)
    val Amber = Color(0xFFF59E0B)

    // Text
    val TextPrimary = Color(0xFFF4F5F4)
    val TextSecondary = Color(0xFF9AA39D)
    val TextMuted = Color(0xFF6B726D)

    // Glass + borders (emerald-tinted)
    val GlassBg = Color(0x99181A1A) // rgba(24,24,26,0.6)
    val GlassBorder = Color(0x1F10B981) // rgba(16,185,129,0.12)
    val BorderSubtle = Color(0x2610B981) // rgba(16,185,129,0.15)
    val BorderGlow = Color(0x6610B981) // rgba(16,185,129,0.4)

    /** Primary emerald gradient (matches .gradient-text / .btn-glow). */
    val EmeraldGradient = Brush.linearGradient(listOf(Emerald, Mint))
    val EmeraldGradientDeep = Brush.linearGradient(listOf(Emerald, EmeraldDeep))

    /** Obsidian header/hero gradient. */
    val ObsidianGradient = Brush.verticalGradient(listOf(BgPrimary, BgSecondary))
}
