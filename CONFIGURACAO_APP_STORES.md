# 🚀 Configuração para App Stores - Chatwoot Mobile

## 🍎 **Apple Developer Configuration**

### 1. **Apple Developer Portal Setup**

1. **Acesse:** [Apple Developer Portal](https://developer.apple.com/account/)
2. **Crie um App ID:**
   - Bundle ID: `com.chatwoot.app` (ou seu próprio)
   - Description: "Chatwoot Mobile App"
   - Capabilities: Push Notifications, Associated Domains

3. **Configure Push Notifications:**
   - Crie certificado de Push Notification (Development + Production)
   - Baixe os certificados (.p12 ou .p8)

4. **Configure Associated Domains:**
   - Adicione: `applinks:app.chatwoot.com`

### 2. **Variáveis de Ambiente (.env)**

Adicione ao seu arquivo `.env`:

```bash
# Apple Developer
EXPO_PUBLIC_IOS_BUNDLE_ID=com.chatwoot.app
EXPO_PUBLIC_APPLE_TEAM_ID=your-apple-team-id
EXPO_PUBLIC_APPLE_APP_ID=your-apple-app-id
```

### 3. **Certificados iOS**

1. **Crie um certificado de distribuição:**
   - Apple Developer Portal > Certificates > Create Certificate
   - Tipo: iOS Distribution (App Store and Ad Hoc)

2. **Crie um Provisioning Profile:**
   - Tipo: App Store
   - App ID: Seu Bundle ID
   - Certificado: Seu certificado de distribuição

## 🤖 **Google Play Console Configuration**

### 1. **Google Play Console Setup**

1. **Acesse:** [Google Play Console](https://play.google.com/console/)
2. **Crie um novo app:**
   - Package name: `com.chatwoot.app`
   - App name: "Chatwoot"
   - Category: Communication

### 2. **Firebase Configuration**

1. **Acesse:** [Firebase Console](https://console.firebase.google.com/)
2. **Crie um projeto:**
   - Nome: "Chatwoot Mobile"
   - Ative Google Analytics

3. **Adicione apps:**
   - **iOS:** Bundle ID: `com.chatwoot.app`
   - **Android:** Package name: `com.chatwoot.app`

4. **Baixe os arquivos de configuração:**
   - `GoogleService-Info.plist` (iOS)
   - `google-services.json` (Android)

### 3. **Variáveis de Ambiente (.env)**

Adicione ao seu arquivo `.env`:

```bash
# Google Play
EXPO_PUBLIC_ANDROID_PACKAGE=com.chatwoot.app
EXPO_PUBLIC_GOOGLE_PLAY_PACKAGE=com.chatwoot.app

# Firebase
EXPO_PUBLIC_IOS_GOOGLE_SERVICES_FILE=./GoogleService-Info.plist
EXPO_PUBLIC_ANDROID_GOOGLE_SERVICES_FILE=./google-services.json
```

## 🔧 **EAS Build Configuration**

### 1. **Instalar EAS CLI**

```bash
npm install -g @expo/eas-cli
```

### 2. **Login no EAS**

```bash
eas login
```

### 3. **Configurar EAS**

```bash
eas build:configure
```

### 4. **Configurar eas.json**

O arquivo `eas.json` já está configurado com:

```json
{
  "cli": {
    "version": ">= 12.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {
      "ios": {
        "autoIncrement": "buildNumber"
      },
      "android": {
        "autoIncrement": "versionCode"
      }
    }
  },
  "submit": {
    "production": {}
  }
}
```

## 📱 **Build Commands**

### **Development Build**
```bash
# iOS
eas build --platform ios --profile development

# Android
eas build --platform android --profile development

# Both
eas build --platform all --profile development
```

### **Production Build**
```bash
# iOS
eas build --platform ios --profile production

# Android
eas build --platform android --profile production

# Both
eas build --platform all --profile production
```

### **Submit to Stores**
```bash
# iOS (App Store)
eas submit --platform ios

# Android (Google Play)
eas submit --platform android

# Both
eas submit --platform all
```

## 🔐 **Secrets Management**

### **Adicionar Secrets**

```bash
# Apple Team ID
eas secret:create --scope project --name APPLE_TEAM_ID --value "your-team-id"

# Apple App ID
eas secret:create --scope project --name APPLE_APP_ID --value "your-app-id"

# Google Play Service Account
eas secret:create --scope project --name GOOGLE_SERVICE_ACCOUNT_KEY --value "your-service-account-json"
```

## 📋 **Checklist Final**

### **Antes do Build:**
- [ ] Bundle ID/Package Name configurado
- [ ] Certificados iOS criados
- [ ] Firebase configurado
- [ ] Arquivos de configuração baixados
- [ ] Variáveis de ambiente configuradas
- [ ] EAS CLI instalado e logado

### **Para App Store:**
- [ ] App Store Connect configurado
- [ ] Screenshots e metadados preparados
- [ ] TestFlight configurado (opcional)

### **Para Google Play:**
- [ ] Google Play Console configurado
- [ ] Store listing preparado
- [ ] Screenshots e assets preparados

## 🚨 **Problemas Comuns**

### **iOS:**
- **Bundle ID já existe:** Use um Bundle ID único
- **Certificado inválido:** Verifique se está correto no Keychain
- **Provisioning Profile:** Certifique-se de que está ativo

### **Android:**
- **Package name já existe:** Use um package name único
- **Google Services:** Verifique se o arquivo está correto
- **Signing:** Configure o keystore corretamente

## 📞 **Suporte**

- [Expo Documentation](https://docs.expo.dev/)
- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [Apple Developer Documentation](https://developer.apple.com/documentation/)
- [Google Play Console Help](https://support.google.com/googleplay/android-developer/)


