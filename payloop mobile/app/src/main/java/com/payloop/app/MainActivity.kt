package com.payloop.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.Surface
import androidx.compose.ui.Modifier
import com.payloop.app.navigation.PayLoopNavGraph
import com.payloop.app.ui.theme.PayLoopColors
import com.payloop.app.ui.theme.PayloopTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            PayloopTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = PayLoopColors.BgPrimary
                ) {
                    PayLoopNavGraph()
                }
            }
        }
    }
}
