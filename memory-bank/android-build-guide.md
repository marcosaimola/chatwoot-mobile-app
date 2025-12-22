# Guia de Build Android - ZapiCRM

## Requisitos do Sistema

### Ferramentas Necessárias
- **Node.js**: 24.x (instalado em `/usr/local/opt/node@24/bin/node`)
- **Java**: JDK do Android Studio (`/Applications/Android Studio.app/Contents/jbr/Contents/Home`)
- **Android SDK**: `$HOME/Library/Android/sdk`
- **Android Studio**: Para gerenciar SDK e NDK

### Versões Críticas (para suporte 16KB)
- **React Native**: 0.77.0+ (suporte completo a 16KB page size)
- **NDK**: 29.0.14206865
- **Android Gradle Plugin**: 8.5.1
- **Arquiteturas**: ARM apenas (armeabi-v7a, arm64-v8a)

---

## Build Rápido

### Gerar AAB para Google Play
```bash
cd android
export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"
export PATH="/usr/local/opt/node@24/bin:$JAVA_HOME/bin:$PATH"
export ANDROID_HOME="$HOME/Library/Android/sdk"
./gradlew clean bundleRelease --no-daemon
```

**Arquivo gerado**: `android/app/build/outputs/bundle/release/app-release.aab`

### Gerar APK para Teste
```bash
./gradlew assembleRelease --no-daemon
```

**Arquivo gerado**: `android/app/build/outputs/apk/release/app-release.apk`

---

## Configuração de Assinatura

### Keystore de Produção
- **Arquivo**: `android/upload-keystore.jks`
- **Alias**: `upload`
- **Senha**: `@Upgrybt26`
- **SHA1**: `CD:78:1B:F0:BF:B1:25:99:3D:1F:44:29:50:EB:5F:66:8E:E6:15:10`

### Configuração no build.gradle
```gradle
signingConfigs {
    release {
        storeFile file('../upload-keystore.jks')
        storePassword '@Upgrybt26'
        keyAlias 'upload'
        keyPassword '@Upgrybt26'
    }
}
buildTypes {
    release {
        signingConfig signingConfigs.release
        // ...
    }
}
```

### Verificar SHA1 do Keystore
```bash
export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"
$JAVA_HOME/bin/keytool -list -v -keystore android/upload-keystore.jks -storepass "@Upgrybt26" | grep SHA1
```

---

## Suporte 16KB Page Size (Android 15+)

### Por que é necessário?
A partir de Nov/2025, o Google Play exige que apps suportem dispositivos com páginas de memória de 16KB. React Native 0.76.x e anteriores não têm suporte completo.

### Configurações Necessárias

#### 1. android/build.gradle
```gradle
buildscript {
    ext {
        ndkVersion = "29.0.14206865"  // NDK r29
    }
    dependencies {
        classpath('com.android.tools.build:gradle:8.5.1')  // AGP 8.5.1+
    }
}
```

#### 2. android/gradle.properties
```properties
# ARM apenas - x86/x86_64 causam problemas de 16KB
reactNativeArchitectures=armeabi-v7a,arm64-v8a
```

#### 3. android/app/build.gradle
```gradle
defaultConfig {
    // ...
    ndk {
        abiFilters 'armeabi-v7a', 'arm64-v8a'
    }
}

packagingOptions {
    jniLibs {
        useLegacyPackaging false
        keepDebugSymbols += ['**/*.so']
    }
}

bundle {
    language { enableSplit = false }
    density { enableSplit = false }
    abi { enableSplit = true }
}
```

#### 4. android/app/Application.mk
```makefile
APP_SUPPORT_FLEXIBLE_PAGE_SIZES := true
APP_LDFLAGS := -Wl,-z,max-page-size=16384 -Wl,-z,common-page-size=16384
```

---

## Incrementar Versão

### Antes de cada upload no Google Play:
1. Editar `android/app/build.gradle`
2. Incrementar `versionCode` (ex: 12 → 13)
3. Rebuild: `./gradlew clean bundleRelease --no-daemon`

```gradle
defaultConfig {
    versionCode 12  // Incrementar para cada upload
    versionName "5.2"
}
```

---

## Troubleshooting

### Erro: "Node not found"
```bash
export PATH="/usr/local/opt/node@24/bin:$PATH"
```

### Erro: "16KB page size não compatível"
1. Verificar React Native >= 0.77.0
2. Verificar NDK = 29.0.14206865
3. Verificar AGP = 8.5.1
4. Verificar arquiteturas = ARM apenas
5. Verificar Application.mk existe

### Erro: "Assinatura incorreta"
1. Verificar keystore correto em signingConfigs.release
2. Verificar SHA1 do keystore com keytool
3. Rebuild com `./gradlew clean bundleRelease`

### Erro: "versionCode já usado"
Incrementar versionCode no build.gradle e rebuild.

---

## Dependências Críticas (Dez/2024)

Versões compatíveis com React Native 0.77.0:
```json
{
  "react-native": "^0.77.0",
  "react-native-gesture-handler": "^2.25.0",
  "react-native-screens": "^4.17.0",
  "react-native-safe-area-context": "^5.6.2",
  "react-native-svg": "^15.15.1",
  "react-native-webview": "^13.16.0"
}
```

### Após atualizar dependências:
```bash
rm -rf android
npx expo prebuild --clean --platform android
# Reaplicar configurações de 16KB e assinatura
```

---

## Checklist Pré-Upload

- [ ] versionCode incrementado
- [ ] React Native 0.77.0+
- [ ] NDK 29.0.14206865
- [ ] AGP 8.5.1
- [ ] Arquiteturas: ARM apenas
- [ ] Application.mk configurado
- [ ] Keystore de produção configurado
- [ ] Build com `./gradlew clean bundleRelease`
- [ ] Testar APK no dispositivo antes do upload

