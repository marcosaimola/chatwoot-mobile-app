# 🚀 Guia de Configuração - Android Studio

## 📋 Requisitos do Projeto

- **Android SDK**: 35
- **Build Tools**: 35.0.0
- **Min SDK**: 24
- **Target SDK**: 35
- **NDK**: r27.1.12297006
- **Gradle**: 8.10.2
- **Kotlin**: 1.9.25

## 🔧 Passos Após Instalar o Android Studio

### 1. **Configurar Variáveis de Ambiente**

Adicione ao seu `~/.zshrc` (ou `~/.bash_profile` se usar bash):

```bash
# Android SDK
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/tools/bin
```

Depois execute:
```bash
source ~/.zshrc
```

### 2. **Instalar Componentes Necessários via Android Studio**

1. Abra o Android Studio
2. Vá em **Tools → SDK Manager**
3. Na aba **SDK Platforms**, instale:
   - ✅ Android 15.0 (API 35)
   - ✅ Android 14.0 (API 34) - se disponível
4. Na aba **SDK Tools**, instale:
   - ✅ Android SDK Build-Tools 35.0.0
   - ✅ Android SDK Command-line Tools
   - ✅ Android SDK Platform-Tools
   - ✅ NDK (Side by side) - versão 27.1.12297006
   - ✅ Google Play services
   - ✅ Google Play billing library
   - ✅ Intel x86 Emulator Accelerator (HAXM installer) - se usar emulador Intel

### 3. **Verificar Instalação**

```bash
# Verificar Java
java -version

# Verificar Android SDK
echo $ANDROID_HOME

# Verificar adb
adb version

# Verificar Gradle (será baixado automaticamente na primeira build)
./android/gradlew --version
```

### 4. **Gerar o Bundle (AAB) para Google Play**

Após configurar tudo, execute:

```bash
cd android
./gradlew clean bundleRelease
```

O arquivo `.aab` será gerado em:
```
android/app/build/outputs/bundle/release/app-release.aab
```

### 5. **Alternativa: Build via EAS (Local)**

Se preferir usar o EAS localmente (sem precisar configurar tudo):

```bash
npm run build:android:local
```

## ⚠️ Problemas Comuns

### Java não encontrado
- Instale o JDK 17 ou superior
- Configure `JAVA_HOME` no `~/.zshrc`:
  ```bash
  export JAVA_HOME=$(/usr/libexec/java_home -v 17)
  ```

### NDK não encontrado
- Instale via Android Studio SDK Manager
- Ou baixe manualmente e configure o caminho

### Gradle sync falha
- Limpe o projeto: `cd android && ./gradlew clean`
- Delete `.gradle` e `build` folders
- Tente novamente

## 📦 Comandos Úteis

```bash
# Limpar build
cd android && ./gradlew clean

# Build APK (para testes)
cd android && ./gradlew assembleRelease

# Build Bundle (para Google Play)
cd android && ./gradlew bundleRelease

# Verificar assinatura do bundle
jarsigner -verify -verbose -certs android/app/build/outputs/bundle/release/app-release.aab
```

## ✅ Checklist Final

- [ ] Android Studio instalado
- [ ] Variáveis de ambiente configuradas
- [ ] Android SDK 35 instalado
- [ ] Build Tools 35.0.0 instalado
- [ ] NDK r27 instalado
- [ ] Java/JDK configurado
- [ ] Bundle gerado com sucesso


