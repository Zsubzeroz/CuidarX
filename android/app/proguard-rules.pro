# Projeto específico do app
# Estas regras ajudam a manter classes e plugins essenciais em modo Release
# quando o R8/ProGuard ativa minifyEnabled e shrinkResources.

# Flutter Wrapper / Engine
-keep class io.flutter.app.** { *; }
-keep class io.flutter.plugin.** { *; }
-keep class io.flutter.util.** { *; }
-keep class io.flutter.view.** { *; }
-keep class io.flutter.embedding.** { *; }
-keep class io.flutter.provider.** { *; }
-keep class io.flutter.plugins.** { *; }

# Evita que os métodos nativos da Flutter Engine sejam ofuscados
-keepclasseswithmembernames class * {
    native <methods>;
}

# Firebase / Google Play Services
-keep class com.google.firebase.** { *; }
-keep class com.google.android.gms.** { *; }

# Modelos de dados / serialização
-keepattributes Signature
-keepattributes *Annotation*
-keepattributes InnerClasses, EnclosingMethod

# Se você usar WebView com JS, mantenha as interfaces expostas.
#-keepclassmembers class fqcn.of.javascript.interface.for.webview {
#   public *;
#}

# Preserva informação de linha para depuração.
#-keepattributes SourceFile,LineNumberTable

# Omitir nome de arquivo de origem em stacks de erro.
#-renamesourcefileattribute SourceFile
