# Troubleshooting: Build Android Release (AAB)

Este documento detalha os problemas comuns e soluções para gerar o AAB de release do Android.

---

## ⚠️ PROBLEMA MAIS COMUM: 16KB Page Size

### Sintoma
```
Erro no Google Play: "Seu app não é compatível com tamanhos de página de 16 KB de memória"
```

### Causa Raiz
Bibliotecas nativas (.so) compiladas via CMake usam alinhamento 4KB por padrão.
O Google Play exige 16KB (0x4000) para Android 15+.

**Bibliotecas que precisam de correção via patch-package:**

| Biblioteca | Módulo | Patch |
|------------|--------|-------|
| `libexpo-modules-core.so` | expo-modules-core | `patches/expo-modules-core+2.2.3.patch` |
| `libexpo-av.so` | expo-av | `patches/expo-av+15.0.2.patch` |
| `libreanimated.so` | react-native-reanimated | `patches/react-native-reanimated+3.16.7.patch` |
| `libworklets.so` | react-native-reanimated | (mesmo patch acima) |

**Bibliotecas excluídas via packagingOptions (sem correção disponível):**

| Biblioteca | Origem | Solução |
|------------|--------|---------|
| `libanimation-decoder-gif.so` | `com.facebook.fresco:animated-gif` | `expo.gif.enabled=false` + exclude |
| `libavif_android.so` | `expo-image` (glide:avif-integration) | exclude no packagingOptions |

### Solução Completa ✅

#### 1. Patches CMakeLists.txt (via patch-package)

Cada patch adiciona ao CMakeLists.txt:
```cmake
set(CMAKE_SHARED_LINKER_FLAGS "${CMAKE_SHARED_LINKER_FLAGS} -Wl,-z,max-page-size=16384")
```

Verificar se patches estão aplicados:
```bash
grep "max-page-size" node_modules/expo-modules-core/android/CMakeLists.txt
grep "max-page-size" node_modules/expo-av/android/CMakeLists.txt
grep "max-page-size" node_modules/react-native-reanimated/android/CMakeLists.txt
```

Se NÃO estiver aplicado:
```bash
npx patch-package
```

#### 2. Limpar caches CMake (OBRIGATÓRIO antes de rebuild)
```bash
rm -rf android/app/.cxx
rm -rf node_modules/expo-modules-core/android/.cxx
rm -rf node_modules/expo-av/android/.cxx
rm -rf node_modules/react-native-reanimated/android/.cxx
```

#### 3. gradle.properties
```properties
reactNativeArchitectures=arm64-v8a
expo.gif.enabled=false
```

#### 4. app/build.gradle - packagingOptions
```gradle
packagingOptions {
    jniLibs { useLegacyPackaging false }
    exclude 'lib/armeabi/**'
    exclude 'lib/armeabi-v7a/**'
    exclude 'lib/x86/**'
    exclude 'lib/mips/**'
    exclude 'lib/mips64/**'
    exclude '**/libanimation-decoder-gif.so'
    exclude '**/libavif_android.so'
}
```

#### 5. Verificar alinhamento após build
```bash
READELF="$HOME/Library/Android/sdk/ndk/27.1.12297006/toolchains/llvm/prebuilt/darwin-x86_64/bin/llvm-readelf"
unzip -o android/app/build/outputs/bundle/release/app-release.aab -d /tmp/aab_check 'base/lib/arm64-v8a/*.so'
for f in /tmp/aab_check/base/lib/arm64-v8a/*.so; do
  align=$($READELF -l "$f" 2>/dev/null | grep LOAD | head -1 | awk '{print $NF}')
  name=$(basename "$f")
  echo "$name: $align"
done
```
Todas devem mostrar `0x4000`.

### Quando recria patches (atualização de dependência)

Se uma dependência for atualizada e o patch não aplicar mais:
1. Edite o CMakeLists.txt em `node_modules/<módulo>/android/CMakeLists.txt`
2. Adicione logo após `project(<nome>)`:
   ```cmake
   # Force 16KB page size alignment (Google Play requirement)
   set(CMAKE_SHARED_LINKER_FLAGS "${CMAKE_SHARED_LINKER_FLAGS} -Wl,-z,max-page-size=16384")
   ```
3. Recrie o patch:
   ```bash
   npx patch-package <nome-do-modulo> --include 'android/CMakeLists.txt'
   ```

---

## Problema: ReadableStream is not defined

### Sintoma
```
ReferenceError: ReadableStream is not defined
    at Object.<anonymous> (.../node_modules/@expo/cli/node_modules/undici/lib/web/fetch/response.js:533:3)
```

### Causa Raiz
O pacote `undici` (usado pelo `@expo/cli`) requer Node.js 20+ com `ReadableStream` global.

### Solução ✅
O caminho do Node.js é configurado em `android/gradle.properties`:
```properties
systemProp.PATH=/Users/nextphones/.nvm/versions/node/v20.20.0/bin:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin
```

E o build script (`build-aab-with-android-studio-java.sh`) detecta automaticamente o Node via nvm.

---

## Problema: Java 21 vs Java 17

### Sintoma
```
Inconsistent JVM-target compatibility detected for tasks 'compileReleaseJavaWithJavac' (21) and 'compileReleaseKotlin' (17).
```

### Solução ✅
Forçar Java 17 em `android/build.gradle`:
```gradle
allprojects {
    tasks.withType(JavaCompile).configureEach {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    tasks.withType(org.jetbrains.kotlin.gradle.tasks.KotlinCompile).configureEach {
        kotlinOptions { jvmTarget = "17" }
    }
}
```

E em `android/app/build.gradle`:
```gradle
compileOptions {
    sourceCompatibility JavaVersion.VERSION_17
    targetCompatibility JavaVersion.VERSION_17
}
kotlinOptions {
    jvmTarget = "17"
}
```

O build script prioriza Java 17 do Homebrew:
```bash
JAVA17_HOMEBREW="/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home"
```

---

## Problema: Sentry - Cannot find module

### Sintoma
```
Cannot find module '@sentry/react-native/metro'
```

### Causa
Sentry foi desabilitado no projeto mas imports permaneceram em arquivos fonte.

### Solução ✅
Sentry está comentado nos seguintes arquivos:
- `src/utils/cacheManager.ts`
- `src/navigation/tabs/AppTabs.tsx`
- `src/store/settings/settingsActions.ts`
- `src/utils/permissionUtils.ts`
- `src/utils/errorUtils.ts`
- `src/utils/audioConverter.ios.ts`
- `src/utils/audioConverter.android.ts`
- `src/screens/chat-screen/components/message-components/AudioBubble.tsx`
- `src/screens/chat-screen/components/audio-recorder/AudioRecorder.tsx`
- `src/components-next/list-components/AttributeList.tsx`

---

## Problema: Assinatura incorreta

### Sintoma
```
Keystore file not found for signing config 'release'
```

### Solução ✅
O keystore está na **raiz do projeto** (`upload-keystore.jks`).
No `android/app/build.gradle`, o caminho relativo é:
```gradle
storeFile file('../../upload-keystore.jks')
```

(2 níveis acima: de `android/app/` até a raiz)

---

## Problema: node not found no settings.gradle

### Sintoma
```
A problem occurred starting process 'command 'node''
```

### Causa
Android Studio não herda o PATH do terminal onde nvm está configurado.

### Solução ✅
Configurar PATH no `android/gradle.properties`:
```properties
systemProp.PATH=/Users/nextphones/.nvm/versions/node/v20.20.0/bin:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin
```

---

## Comandos para Build

### Método Recomendado
```bash
./build-aab-with-android-studio-java.sh
```

### Localização do AAB Gerado
```
android/app/build/outputs/bundle/release/app-release.aab
```

---

## Checklist Rápido

- [ ] `npm install` (patches aplicados automaticamente)
- [ ] Verificar patches: `grep "max-page-size" node_modules/expo-modules-core/android/CMakeLists.txt`
- [ ] versionCode incrementado em `app.config.ts` E `android/app/build.gradle`
- [ ] `./build-aab-with-android-studio-java.sh`
- [ ] Verificar saída: "TODAS as bibliotecas têm alinhamento 16KB correto!"
- [ ] Upload na Play Console

---

## Problema: UnsatisfiedLinkError - libexpo-av.so not found

### Sintoma (Crashlytics)
```
Fatal Exception: java.lang.UnsatisfiedLinkError: dlopen failed: library "libexpo-av.so" not found
at expo.modules.av.AVManager.<clinit>(AVManager.java:56)
```

### Causa Raiz
O AAB contém libs armeabi-v7a parciais (hermes, fbjni - 4 de 21 libs).
O Google Play pensa que o app suporta 32-bit e serve para dispositivos 32-bit.
Esses dispositivos recebem as 4 libs mas NÃO recebem libexpo-av.so e outras.

### Solução ✅
Adicionar `ndk.abiFilters` no `android/app/build.gradle` para FORÇAR apenas arm64-v8a:
```gradle
defaultConfig {
    // ...
    ndk {
        abiFilters 'arm64-v8a'
    }
}
```

Isso é mais efetivo que `packagingOptions.exclude` porque opera no nível do NDK,
impedindo que QUALQUER lib 32-bit seja incluída no AAB.

---

## Histórico de Problemas Resolvidos

| Data | Problema | Solução |
|------|----------|---------|
| 2026-02-05 | UnsatisfiedLinkError libexpo-av.so em 32-bit | ndk.abiFilters 'arm64-v8a' no defaultConfig |
| 2026-02-05 | 16KB - CMake libs (expo-modules-core, expo-av, reanimated) | Patches CMakeLists.txt via patch-package |
| 2026-02-04 | 16KB - libanimation-decoder-gif.so, libavif_android.so | Exclude no packagingOptions |
| 2026-02-04 | 16KB - armeabi-v7a | Usar apenas arm64-v8a |
| 2026-02-04 | Java 21 vs 17 incompatibilidade | Forçar Java 17 no build.gradle |
| 2026-02-04 | Sentry module not found | Comentar Sentry em todos os arquivos |
| 2026-01-27 | ReadableStream is not defined | PATH com Node 20 no gradle.properties |

---

**Última atualização:** 5 de Fevereiro de 2026
