package com.payloop.app.ui.theme

import androidx.compose.material3.Typography
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.googlefonts.Font
import androidx.compose.ui.text.googlefonts.GoogleFont
import androidx.compose.ui.unit.sp
import com.payloop.app.R

/**
 * Typography for PayLoop mobile.
 *
 * Mirrors the web app: "Sora" for display/headings, system sans for body
 * (the web falls back Geist -> Inter -> system; we use the platform sans
 * as the body face). Sora is pulled from the Google Fonts downloadable
 * provider; certs live in res/values/font_certs.xml.
 */
private val provider = GoogleFont.Provider(
    providerAuthority = "com.google.android.gms.fonts",
    providerPackage = "com.google.android.gms",
    certificates = R.array.com_google_android_gms_fonts_certs,
)

private val soraGoogle = GoogleFont("Sora")

val SoraFamily = FontFamily(
    Font(googleFont = soraGoogle, fontProvider = provider, weight = FontWeight.Normal),
    Font(googleFont = soraGoogle, fontProvider = provider, weight = FontWeight.Medium),
    Font(googleFont = soraGoogle, fontProvider = provider, weight = FontWeight.SemiBold),
    Font(googleFont = soraGoogle, fontProvider = provider, weight = FontWeight.Bold),
    Font(googleFont = soraGoogle, fontProvider = provider, weight = FontWeight.ExtraBold),
)

/** Body face — platform default sans (Geist/Inter fallback equivalent). */
val BodyFamily = FontFamily.SansSerif

val Typography = Typography(
    // Display / headings — Sora, slight negative tracking to match web.
    displayLarge = TextStyle(fontFamily = SoraFamily, fontWeight = FontWeight.ExtraBold, fontSize = 40.sp, lineHeight = 46.sp, letterSpacing = (-0.5).sp),
    headlineLarge = TextStyle(fontFamily = SoraFamily, fontWeight = FontWeight.Bold, fontSize = 30.sp, lineHeight = 36.sp, letterSpacing = (-0.4).sp),
    headlineMedium = TextStyle(fontFamily = SoraFamily, fontWeight = FontWeight.Bold, fontSize = 24.sp, lineHeight = 30.sp, letterSpacing = (-0.3).sp),
    titleLarge = TextStyle(fontFamily = SoraFamily, fontWeight = FontWeight.SemiBold, fontSize = 20.sp, lineHeight = 26.sp, letterSpacing = (-0.2).sp),
    titleMedium = TextStyle(fontFamily = SoraFamily, fontWeight = FontWeight.SemiBold, fontSize = 16.sp, lineHeight = 22.sp),

    // Body — system sans
    bodyLarge = TextStyle(fontFamily = BodyFamily, fontWeight = FontWeight.Normal, fontSize = 16.sp, lineHeight = 24.sp, letterSpacing = 0.3.sp),
    bodyMedium = TextStyle(fontFamily = BodyFamily, fontWeight = FontWeight.Normal, fontSize = 14.sp, lineHeight = 20.sp, letterSpacing = 0.2.sp),
    bodySmall = TextStyle(fontFamily = BodyFamily, fontWeight = FontWeight.Normal, fontSize = 12.sp, lineHeight = 16.sp),
    labelLarge = TextStyle(fontFamily = BodyFamily, fontWeight = FontWeight.SemiBold, fontSize = 14.sp, lineHeight = 18.sp),
    labelMedium = TextStyle(fontFamily = BodyFamily, fontWeight = FontWeight.Medium, fontSize = 12.sp, lineHeight = 16.sp),
)
