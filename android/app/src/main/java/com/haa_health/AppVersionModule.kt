package com.haa_health

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule

class AppVersionModule(reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  override fun getName() = "AppVersion"

  override fun getConstants(): Map<String, Any> =
    mapOf(
      "versionCode" to BuildConfig.VERSION_CODE,
      "versionName" to BuildConfig.VERSION_NAME,
    )
}
