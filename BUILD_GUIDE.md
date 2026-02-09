# Guia de Build - ZapiCrm

## 🚀 Opção 1: Build via Android Studio (Recomendado)

Esta é a forma mais simples e confiável de gerar o APK/AAB para distribuição.

### Passos:

1. **Abra o Android Studio**

2. **Abra o projeto Android**
   - File → Open
   - Navegue até: `/Users/nextphones/Documents/Projetos/appconnect/android`
   - Clique em "Open"

3. **Aguarde a sincronização do Gradle**
   - O Android Studio vai sincronizar automaticamente
   - Aguarde até aparecer "Gradle sync finished" na barra inferior

4. **Gerar o APK para testes**
   - Menu: **Build** → **Build Bundle(s) / APK(s)** → **Build APK(s)**
   - Aguarde a compilação (5-10 minutos na primeira vez)
   - Quando terminar, aparecerá uma notificação com "locate" para encontrar o APK
   - O APK estará em: `android/app/build/outputs/apk/release/app-release.apk`

5. **Gerar o AAB para Play Store**
   - Menu: **Build** → **Build Bundle(s) / APK(s)** → **Build Bundle(s)**
   - Aguarde a compilação
   - O AAB estará em: `android/app/build/outputs/bundle/release/app-release.aab`

### ✅ Vantagens deste método:
- Não precisa configurar variáveis de ambiente
- Android Studio cuida de todas as dependências
- Interface visual mostra progresso e erros
- Mais estável e confiável

---

## 🔧 Opção 2: Build via Linha de Comando (Avançado)

Se preferir usar linha de comando, primeiro configure as variáveis de ambiente:

### Passo 1: Configurar variáveis de ambiente

Adicione ao seu arquivo `~/.zshrc` (ou `~/.bash_profile`):

```bash
# Android SDK
export ANDROID_HOME=/Users/nextphones/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/tools/bin
export PATH=$PATH:$ANDROID_HOME/emulator
```

Depois execute:
```bash
source ~/.zshrc
```

### Passo 2: Verificar configuração

```bash
echo $ANDROID_HOME
# Deve mostrar: /Users/nextphones/Library/Android/sdk

which adb
# Deve mostrar: /Users/nextphones/Library/Android/sdk/platform-tools/adb
```

### Passo 3: Build via linha de comando

```bash
# Ir para pasta android
cd android

# Limpar builds anteriores (opcional)
./gradlew clean

# Gerar APK
./gradlew assembleRelease

# Gerar AAB
./gradlew bundleRelease
```

Os arquivos gerados estarão em:
- APK: `android/app/build/outputs/apk/release/app-release.apk`
- AAB: `android/app/build/outputs/bundle/release/app-release.aab`

---

## 🍎 Build iOS

Para iOS, você precisa usar o Xcode:

1. **Abra o Xcode**

2. **Abra o projeto**
   - File → Open
   - Navegue até: `/Users/nextphones/Documents/Projetos/appconnect/ios/appconnect.xcworkspace`
   - **IMPORTANTE**: Abra o arquivo `.xcworkspace`, NÃO o `.xcodeproj`

3. **Selecione o esquema**
   - Na barra superior, selecione "appconnect" e "Any iOS Device"

4. **Gerar o arquivo IPA**
   - Menu: **Product** → **Archive**
   - Aguarde a compilação (10-15 minutos na primeira vez)
   - Na janela de Archives, clique em "Distribute App"
   - Escolha o método de distribuição:
     - **App Store Connect**: Para enviar para TestFlight/App Store
     - **Ad Hoc**: Para distribuir para dispositivos específicos (beta testing)
     - **Development**: Para instalar no seu dispositivo

---

## 📦 Opção 3: EAS Build (Cloud Build)

Se quiser usar o EAS para builds na nuvem:

### Passo 1: Instalar EAS CLI

```bash
npm install -g eas-cli
```

### Passo 2: Login no Expo

```bash
eas login
```

### Passo 3: Fazer o build

```bash
# Android APK (para testes)
eas build -p android --profile preview

# Android AAB (para Play Store)
eas build -p android --profile production

# iOS
eas build -p ios --profile production
```

---

## 🧪 Testar o APK/AAB gerado

### Testar APK localmente:

```bash
# Conectar dispositivo via USB ou iniciar emulador
adb devices

# Instalar o APK
adb install android/app/build/outputs/apk/release/app-release.apk
```

### Distribuir para beta testers:

1. **Via Firebase App Distribution**:
   - Acesse: https://console.firebase.google.com/
   - Projeto → App Distribution
   - Faça upload do APK
   - Adicione emails dos testers

2. **Via Google Play Console** (Internal Testing):
   - Acesse: https://play.google.com/console
   - Selecione o app
   - Testing → Internal testing
   - Create new release
   - Upload do AAB

---

## ⚠️ Troubleshooting

### Erro: "SDK location not found"
**Solução**: Use o Android Studio (Opção 1) ou configure ANDROID_HOME (Opção 2)

### Erro: "Execution failed for task ':app:packageRelease'"
**Solução**: Verifique se o keystore está configurado em `android/app/build.gradle`

### Erro: "eas not found"
**Solução**: Instale o EAS CLI: `npm install -g eas-cli`

### Build muito lento
**Solução**: 
- Primeira vez sempre é lenta (10-15 minutos)
- Builds subsequentes são mais rápidos (2-5 minutos)
- Use Android Studio que tem cache otimizado

---

## 📋 Checklist para Deploy

Antes de fazer build para produção, verifique:

- [ ] Versão atualizada em `app.config.ts` (`version` e `versionCode/buildNumber`)
- [ ] Todas as mudanças commitadas no git
- [ ] Testado localmente em dispositivo/emulador
- [ ] Variáveis de ambiente configuradas (`.env`)
- [ ] Crashlytics configurado e testado
- [ ] Firebase configurado (`google-services.json` e `GoogleService-Info.plist`)
- [ ] Ícones e splash screen atualizados
- [ ] Permissões corretas em `app.config.ts`

---

## 🎯 Recomendação para seu caso

Para distribuir rapidamente aos usuários que estão reportando crashes:

1. **Use Android Studio** (Opção 1) - mais simples e confiável
2. **Gere um APK** primeiro para testar localmente
3. **Distribua via Firebase App Distribution** para alguns beta testers
4. **Depois gere AAB** e envie para Google Play Internal Testing
5. **Faça rollout gradual** (10% → 25% → 50% → 100%)

Assim você pode monitorar os crashes no Firebase Crashlytics conforme a nova versão é distribuída!
