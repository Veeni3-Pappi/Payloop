plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.compose)
}

android {
    namespace = "com.payloop.app"
    compileSdk {
        version = release(36) {
            minorApiLevel = 1
        }
    }

    defaultConfig {
        applicationId = "com.payloop.app"
        minSdk = 26
        targetSdk = 36
        versionCode = 1
        versionName = "1.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"

        // Backend + wallet config. Override in gradle.properties or local.properties:
        //   API_BASE_URL=http://10.0.2.2:8000/   (emulator -> host localhost)
        //   WC_PROJECT_ID=<your Reown/WalletConnect projectId>   (for the WalletConnect path)
        val apiBaseUrl = (project.findProperty("API_BASE_URL") as String?)
            ?: "http://10.0.2.2:8000/"
        val wcProjectId = (project.findProperty("WC_PROJECT_ID") as String?) ?: ""
        buildConfigField("String", "API_BASE_URL", "\"$apiBaseUrl\"")
        buildConfigField("String", "WC_PROJECT_ID", "\"$wcProjectId\"")
    }

    buildTypes {
        release {
            optimization {
                enable = false
            }
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_11
        targetCompatibility = JavaVersion.VERSION_11
    }
    buildFeatures {
        compose = true
        buildConfig = true
    }
    // web3j / BouncyCastle bundle duplicate META-INF entries; drop them.
    packaging {
        resources {
            excludes += setOf(
                "META-INF/DEPENDENCIES",
                "META-INF/LICENSE",
                "META-INF/LICENSE.md",
                "META-INF/LICENSE-notice.md",
                "META-INF/NOTICE",
                "META-INF/NOTICE.md",
                "META-INF/INDEX.LIST",
                "META-INF/*.kotlin_module",
            )
            // web3j's transitive deps (jackson, aws-sdk, tuweni, …) bundle
            // overlapping license/notice/disclaimer text files under META-INF.
            // These are non-code resources, so keeping the first copy of any
            // duplicate is safe and avoids per-file exclude whack-a-mole.
            pickFirsts += setOf(
                "META-INF/*-LICENSE",
                "META-INF/*-LICENSE.txt",
                "META-INF/*-NOTICE",
                "META-INF/*-NOTICE.txt",
                "META-INF/DISCLAIMER",
                "META-INF/DISCLAIMER.txt",
                // netty ships this in every module; aws-sdk/bouncycastle overlap too.
                "META-INF/io.netty.versions.properties",
                "META-INF/native-image/**",
            )
        }
    }
}
dependencies {
    implementation("androidx.core:core-ktx:1.12.0")
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.7.0")
    implementation("androidx.activity:activity-compose:1.8.0")

    implementation(platform("androidx.compose:compose-bom:2024.02.00"))
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.ui:ui-graphics")
    implementation("androidx.compose.ui:ui-tooling-preview")
    implementation("androidx.compose.material3:material3")
    implementation("androidx.compose.material:material-icons-extended")
    implementation("androidx.compose.ui:ui-text-google-fonts")

    implementation("androidx.navigation:navigation-compose:2.7.6")
    implementation("androidx.lifecycle:lifecycle-viewmodel-compose:2.8.7")

    // Networking (Retrofit + OkHttp + Gson)
    implementation("com.squareup.retrofit2:retrofit:2.11.0")
    implementation("com.squareup.retrofit2:converter-gson:2.11.0")
    implementation("com.squareup.okhttp3:logging-interceptor:4.12.0")

    // Coroutines + DataStore (JWT/session persistence)
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.8.1")
    implementation("androidx.datastore:datastore-preferences:1.1.1")

    // In-app Ethereum signer (EIP-191 personal_sign the backend verifies).
    // Production WalletConnect path is documented in WALLET_INTEGRATION.md.
    implementation("org.web3j:core:4.12.3")

    debugImplementation("androidx.compose.ui:ui-tooling")
    testImplementation("junit:junit:4.13.2")
    androidTestImplementation("androidx.test.ext:junit:1.1.5")
}