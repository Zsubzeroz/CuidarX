package com.podologa.fabricia

import android.os.Bundle
import android.os.Message
import android.view.Gravity
import android.view.ViewGroup
import android.webkit.WebChromeClient
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.FrameLayout
import android.widget.LinearLayout
import android.widget.TextView
import androidx.appcompat.app.AlertDialog
import com.getcapacitor.BridgeActivity

class MainActivity : BridgeActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        bridge?.webView?.apply {
            settings.setSupportMultipleWindows(true)
            settings.javaScriptEnabled = true
            settings.domStorageEnabled = true

            val originalChromeClient = webChromeClient
            webChromeClient = object : WebChromeClient() {
                override fun onCreateWindow(
                    view: WebView?,
                    isDialog: Boolean,
                    isUserGesture: Boolean,
                    resultMsg: Message?
                ): Boolean {
                    showPopupWindow(resultMsg)
                    return true
                }

                override fun onProgressChanged(view: WebView?, newProgress: Int) {
                    try { originalChromeClient?.onProgressChanged(view, newProgress) } catch (_: Exception) {}
                }

                override fun onReceivedTitle(view: WebView?, title: String?) {
                    try { originalChromeClient?.onReceivedTitle(view, title) } catch (_: Exception) {}
                }
            }
        }
    }

    private fun showPopupWindow(resultMsg: Message?) {
        val popupWebView = WebView(this)
        popupWebView.settings.javaScriptEnabled = true
        popupWebView.settings.domStorageEnabled = true

        val dialog = AlertDialog.Builder(this, android.R.style.Theme_DeviceDefault_Light_NoActionBar)
            .setCancelable(true)
            .create()

        val closeBtn = TextView(this).apply {
            text = "✕ Fechar"
            textSize = 14f
            gravity = Gravity.CENTER
            setPadding(0, 24, 0, 12)
            setTextColor(0xFF0B4C33.toInt())
            setOnClickListener { dialog.dismiss() }
        }

        val webContainer = FrameLayout(this).apply {
            addView(popupWebView, FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
            ))
        }

        val layout = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            addView(closeBtn, LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
            ))
            addView(webContainer, LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                0, 1f
            ))
        }

        dialog.setView(layout)

        popupWebView.webViewClient = object : WebViewClient() {
            override fun onPageFinished(view: WebView?, url: String?) {
                super.onPageFinished(view, url)
                if (url != null) {
                    val isLocalhost = url.startsWith("http://localhost") || url.startsWith("https://localhost") || url.startsWith("http://127.0.0.1")
                    if (isLocalhost && url.contains("access_token=")) {
                        dialog.dismiss()
                    }
                }
            }
        }

        popupWebView.webChromeClient = object : WebChromeClient() {
            override fun onCloseWindow(window: WebView?) {
                dialog.dismiss()
            }
        }

        val transport = resultMsg?.obj as? WebView.WebViewTransport
        transport?.webView = popupWebView
        resultMsg?.sendToTarget()

        popupWebView.post { dialog.show() }
    }
}
