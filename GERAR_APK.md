# Como Gerar APK para Instalar no Aparelho

## APK em Geração

O APK está sendo gerado agora. Tempo estimado: **5-10 minutos**

---

## Localização do APK

Após a geração, o APK estará em:

```
android/app/build/outputs/apk/release/app-release.apk
```

Caminho completo:
```
/Users/user/Documents/Projetos/chatwoot-mobile-app/android/app/build/outputs/apk/release/app-release.apk
```

---

## Como Instalar no Aparelho

### Opção 1: Via ADB (Dispositivo Conectado)

```bash
adb install android/app/build/outputs/apk/release/app-release.apk
```

Se já tiver uma versão instalada:
```bash
adb install -r android/app/build/outputs/apk/release/app-release.apk
```

### Opção 2: Transferir Manualmente

1. **Copie o APK para o aparelho**:
   - Via cabo USB (copie para Downloads ou qualquer pasta)
   - Via Bluetooth
   - Via Google Drive / Dropbox
   - Via WhatsApp (envie para você mesmo)

2. **No aparelho**:
   - Abra o gerenciador de arquivos
   - Localize o APK
   - Toque para instalar
   - Se aparecer "Instalação bloqueada", vá em Configurações → Segurança → Permitir instalação de fontes desconhecidas

### Opção 3: Via Expo (Nuvem)

Se preferir build na nuvem (não requer Android Studio):

```bash
npm run build:android:apk
```

Download será fornecido após 10-20 minutos.

---

## Diferença: APK vs AAB

### APK (Android Package)
- ✅ Pode instalar diretamente no aparelho
- ✅ Mais rápido de gerar (~5-10 min)
- ✅ Ideal para testes
- ❌ Tamanho maior (~50-60 MB)
- ❌ Não pode fazer upload na Play Store

### AAB (Android App Bundle)
- ✅ Formato exigido pela Play Store
- ✅ Tamanho menor otimizado por dispositivo
- ❌ Não pode instalar diretamente
- ❌ Mais lento de gerar (~15-20 min)
- ✅ Usa apenas para publicação

---

## Comandos Úteis

```bash
# Gerar APK de release
cd android
./gradlew assembleRelease

# Gerar APK de debug (mais rápido)
./gradlew assembleDebug

# Instalar APK no dispositivo conectado
adb install android/app/build/outputs/apk/release/app-release.apk

# Instalar substituindo versão anterior
adb install -r android/app/build/outputs/apk/release/app-release.apk

# Ver tamanho do APK
ls -lh android/app/build/outputs/apk/release/app-release.apk

# Verificar assinatura do APK
jarsigner -verify -verbose -certs android/app/build/outputs/apk/release/app-release.apk
```

---

## Este APK Contém

### ✅ Novas Funcionalidades
- **Permissionamento de filtros de conversas**
  - Suporte a `can_view_all_conversations`
  - Suporte a `can_view_unassigned_conversations`
  - Filtros condicionais baseados em permissões do usuário

### ✅ Correções de UI iOS
- **Título "Conversations"** não quebra mais linha
- **Bottom sheets** com padding adequado para safe area
- Melhor experiência em iPhones com notch/Dynamic Island

### ✅ Otimizações Anteriores
- Correção da navbar (SafeArea para Android)
- Suporte a 16KB page size (NDK r28)
- Assinado com a nova keystore aprovada pelo Google
- Todas as otimizações de produção
- ProGuard/R8 habilitado
- Código minificado

---

## Troubleshooting

### "App não instalado"

**Solução**: Desinstale a versão anterior primeiro:
```bash
adb uninstall br.com.zapicrm
```

### "Instalação bloqueada"

**Solução**: No aparelho:
- Configurações → Segurança → Permitir instalação de fontes desconhecidas
- Ou: Configurações → Apps → Menu → Acesso especial → Instalar apps desconhecidos → Selecione o gerenciador de arquivos

### APK muito grande

**Solução**: O APK de release contém todas as arquiteturas (arm64, armv7, x86, x86_64). Para reduzir:
1. Gere um AAB (Google Play otimiza automaticamente)
2. Ou configure splits por ABI no build.gradle

### "Parse Error"

**Solução**: 
- Certifique-se de que o Android do aparelho é compatível (API 24+)
- Verifique se o APK não está corrompido
- Tente gerar novamente

---

## Verificar Build

Após a geração, verifique:

```bash
# Tamanho do APK
ls -lh android/app/build/outputs/apk/release/app-release.apk

# Verificar assinatura
jarsigner -verify android/app/build/outputs/apk/release/app-release.apk

# Ver informações do APK
aapt dump badging android/app/build/outputs/apk/release/app-release.apk | head -20
```

---

**Última atualização**: Outubro 2025

