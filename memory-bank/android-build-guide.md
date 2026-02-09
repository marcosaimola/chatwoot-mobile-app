# Guia de Build Android - ZapiCrm

## IMPORTANTE: LEIA PRIMEIRO

### Problema Recorrente: 16KB Page Size
O Google Play exige que TODAS as bibliotecas nativas (.so) tenham alinhamento de 16KB (0x4000).
Este problema volta TODA VEZ que:
- `npm install` é executado sem `postinstall` (patch-package)
- `expo prebuild --clean` regenera o diretório android/
- Dependências são atualizadas

**A solução definitiva está em 3 camadas:**
1. **Patches via patch-package** (persistem entre `npm install`)
2. **Configuração do gradle.properties** (persistem no git)
3. **Configuração do app/build.gradle** (exclusão de libs 4KB)

---

## Requisitos do Sistema

### Ferramentas Necessárias
- **Node.js**: 20 LTS (via nvm: `nvm use 20`)
  - Instalado em: `$HOME/.nvm/versions/node/v20.20.0/bin/node`
- **Java**: JDK 17 (Homebrew) ou JDK do Android Studio
  - Homebrew: `/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home`
  - Android Studio: `/Applications/Android Studio.app/Contents/jbr/Contents/Home`
- **Android SDK**: `$HOME/Library/Android/sdk`
- **NDK**: 27.1.12297006

### Versões Atuais do Projeto
- **React Native**: 0.76.9
- **Expo**: ~52.0
- **Android Gradle Plugin**: (default do Expo)
- **Arquitetura**: arm64-v8a apenas

---

## Build Rápido (Método Recomendado)

```bash
# Script automatizado que:
# 1. Detecta Java e Node.js
# 2. Verifica patches 16KB
# 3. Limpa caches CMake
# 4. Gera o AAB
# 5. Verifica alinhamento 16KB do AAB
./build-aab-with-android-studio-java.sh
```

**Arquivo gerado**: `android/app/build/outputs/bundle/release/app-release.aab`

### Build Manual (alternativa)
```bash
cd android
export JAVA_HOME="/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home"
export PATH="$HOME/.nvm/versions/node/v20.20.0/bin:$JAVA_HOME/bin:$PATH"
# Limpar caches CMake OBRIGATÓRIO
rm -rf app/.cxx ../node_modules/expo-modules-core/android/.cxx ../node_modules/expo-av/android/.cxx ../node_modules/react-native-reanimated/android/.cxx
./gradlew bundleRelease
```

---

## Suporte 16KB Page Size (Android 15+) - SOLUÇÃO DEFINITIVA

### Por que é necessário?
O Google Play exige que apps suportem dispositivos com páginas de memória de 16KB.
Bibliotecas compiladas com CMake por padrão usam 4KB, que é rejeitado.

### Camada 1: Patches via patch-package (CRÍTICO)

Os seguintes patches adicionam `-Wl,-z,max-page-size=16384` ao `CMAKE_SHARED_LINKER_FLAGS`
de cada módulo nativo, garantindo compilação com alinhamento 16KB:

| Patch | Módulo | Biblioteca gerada |
|-------|--------|-------------------|
| `patches/expo-modules-core+2.2.3.patch` | expo-modules-core | `libexpo-modules-core.so` |
| `patches/expo-av+15.0.2.patch` | expo-av | `libexpo-av.so` |
| `patches/react-native-reanimated+3.16.7.patch` | react-native-reanimated | `libreanimated.so`, `libworklets.so` |

**Como funcionam:**
Cada patch adiciona ao `CMakeLists.txt` do módulo:
```cmake
# Force 16KB page size alignment (Google Play requirement)
set(CMAKE_SHARED_LINKER_FLAGS "${CMAKE_SHARED_LINKER_FLAGS} -Wl,-z,max-page-size=16384")
```

**Aplicação automática:**
O `package.json` já tem `"postinstall": "patch-package"`, então os patches
são aplicados automaticamente após `npm install`.

**Se os patches não foram aplicados:**
```bash
npx patch-package
```

**Se precisar recriar os patches (ex: atualização de versão):**
```bash
# Editar o CMakeLists.txt do módulo em node_modules/
# Adicionar a linha set(CMAKE_SHARED_LINKER_FLAGS ...) logo após project()
npx patch-package <nome-do-modulo> --include 'android/CMakeLists.txt'
```

### Camada 2: gradle.properties

```properties
# APENAS arm64-v8a (64-bit) - elimina libs 32-bit que não suportam 16KB
reactNativeArchitectures=arm64-v8a

# Desabilitar GIF animado - libanimation-decoder-gif.so tem 4KB alignment
expo.gif.enabled=false
```

### Camada 3: app/build.gradle - packagingOptions

```gradle
packagingOptions {
    jniLibs {
        useLegacyPackaging false
    }
    // Excluir bibliotecas 32-bit
    exclude 'lib/armeabi/**'
    exclude 'lib/armeabi-v7a/**'
    exclude 'lib/x86/**'
    exclude 'lib/mips/**'
    exclude 'lib/mips64/**'
    // Excluir bibliotecas com alinhamento 4KB (incompatíveis com 16KB page size)
    exclude '**/libanimation-decoder-gif.so'
    exclude '**/libavif_android.so'
}
```

### OBRIGATÓRIO: Limpar caches CMake antes do build

Se os caches CMake existirem, o Gradle reutiliza as .so antigas (4KB).
O build script já faz isso automaticamente, mas se fizer build manual:
```bash
rm -rf android/app/.cxx
rm -rf node_modules/expo-modules-core/android/.cxx
rm -rf node_modules/expo-av/android/.cxx
rm -rf node_modules/react-native-reanimated/android/.cxx
```

### Como Verificar Alinhamento 16KB
```bash
READELF="$HOME/Library/Android/sdk/ndk/27.1.12297006/toolchains/llvm/prebuilt/darwin-x86_64/bin/llvm-readelf"
unzip -o android/app/build/outputs/bundle/release/app-release.aab -d /tmp/aab_check 'base/lib/arm64-v8a/*.so'
for f in /tmp/aab_check/base/lib/arm64-v8a/*.so; do
  align=$($READELF -l "$f" 2>/dev/null | grep LOAD | head -1 | awk '{print $NF}')
  name=$(basename "$f")
  if [ "$align" = "0x4000" ]; then
    echo "✅ $name: $align (16KB OK)"
  else
    echo "❌ $name: $align (PROBLEMA)"
  fi
done
```

Todas devem mostrar `0x4000` (16KB).

---

## Configuração de Assinatura

### Keystore de Produção
- **Arquivo**: `upload-keystore.jks` (na raiz do projeto)
- **Caminho no build.gradle**: `file('../../upload-keystore.jks')` (relativo a android/app/)
- **Alias**: `upload`
- **Senha**: `@Upgrybt26`

### Verificar SHA1 do Keystore
```bash
export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"
$JAVA_HOME/bin/keytool -list -v -keystore upload-keystore.jks -storepass "@Upgrybt26" | grep SHA1
```

---

## Incrementar Versão

### Antes de cada upload no Google Play, incrementar em AMBOS:

1. **`app.config.ts`**:
```typescript
version: '4.6.12',  // incrementar
android: { versionCode: 28 }  // incrementar
```

2. **`android/app/build.gradle`**:
```gradle
defaultConfig {
    versionCode 28      // DEVE ser igual ao app.config.ts
    versionName "4.6.12" // DEVE ser igual ao app.config.ts
}
```

---

## Firebase Crashlytics

Crashlytics está configurado para monitorar crashes. Ver `CRASHLYTICS.md` para detalhes.

Configuração Gradle:
- `android/build.gradle`: `classpath 'com.google.firebase:firebase-crashlytics-gradle:3.0.3'`
- `android/app/build.gradle`: `apply plugin: 'com.google.firebase.crashlytics'`

---

## Checklist Pré-Upload

- [ ] versionCode incrementado em `app.config.ts` E `android/app/build.gradle`
- [ ] **Patches 16KB aplicados** (verificar com `grep "max-page-size" node_modules/expo-modules-core/android/CMakeLists.txt`)
- [ ] **Caches CMake limpos** (o build script faz automaticamente)
- [ ] `reactNativeArchitectures=arm64-v8a` no gradle.properties
- [ ] `expo.gif.enabled=false` no gradle.properties
- [ ] Excludes de libs 4KB no packagingOptions (libanimation-decoder-gif.so, libavif_android.so)
- [ ] Keystore configurado e existente
- [ ] Build com `./build-aab-with-android-studio-java.sh`
- [ ] **Verificar alinhamento 16KB** (o build script faz automaticamente)
- [ ] Upload na Play Console

---

## Após expo prebuild --clean

Quando `expo prebuild --clean` é executado, o diretório `android/` é regenerado do zero.
É necessário reaplicar as seguintes configurações manualmente:

1. **gradle.properties**: `reactNativeArchitectures=arm64-v8a` e `expo.gif.enabled=false`
2. **app/build.gradle**: `packagingOptions` com excludes, `signingConfigs.release`, `compileOptions` Java 17
3. **build.gradle**: `allprojects` com Java 17 e Kotlin jvmTarget 17, Crashlytics classpath
4. **app/build.gradle**: `apply plugin: 'com.google.firebase.crashlytics'` e `apply plugin: 'com.google.gms.google-services'`
5. Os patches em `node_modules/` NÃO precisam ser reaplicados (já estão em patches/)

---

## Histórico de Problemas Resolvidos

| Data | Problema | Solução |
|------|----------|---------|
| 2026-02-05 | 16KB - libexpo-modules-core.so, libexpo-av.so, libreanimated.so, libworklets.so | Patches CMakeLists.txt via patch-package |
| 2026-02-04 | 16KB - libanimation-decoder-gif.so, libavif_android.so | Exclude no packagingOptions + expo.gif.enabled=false |
| 2026-02-04 | 16KB - armeabi-v7a | Usar apenas arm64-v8a |
| 2026-02-04 | Java 21 vs 17 incompatibilidade | Forçar Java 17 no allprojects (build.gradle) |
| 2026-01-27 | ReadableStream is not defined | Caminho absoluto Node 20 no build.gradle |
| 2026-01-27 | Sentry causando erro Metro Bundler | Sentry comentado em todos os arquivos fonte |

---

**Última atualização:** 5 de Fevereiro de 2026
