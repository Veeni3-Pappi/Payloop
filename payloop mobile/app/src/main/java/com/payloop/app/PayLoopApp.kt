package com.payloop.app

import android.app.Application
import com.payloop.app.data.ServiceLocator
import org.bouncycastle.jce.provider.BouncyCastleProvider
import java.security.Security

class PayLoopApp : Application() {
    override fun onCreate() {
        super.onCreate()
        Security.removeProvider("BC")
        Security.insertProviderAt(BouncyCastleProvider(), 1)
        ServiceLocator.init(this)
    }
}
