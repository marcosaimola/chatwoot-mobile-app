# Como Gerar Android App Bundle (AAB) para Play Store

Este guia mostra como gerar um Android App Bundle (AAB) assinado para publicação na Google Play Store usando o `upload-keystore.jks`.

---

## 📋 Pré-requisitos

- Arquivo `upload-keystore.jks` na raiz do projeto
- Senha do keystore (keystore password)
- Senha da chave (key password)
- Alias da chave (key alias)
- EAS CLI instalado (`npm install -g eas-cli`)
- Login no EAS (`eas login`)

---

## 🚀 Opção 1: Build na Nuvem (EAS Build) - RECOMENDADO

Esta opção **não requer Android Studio** e é feita nos servidores do Expo.

### Passo 1: Configurar Credenciais no EAS

O EAS permite gerenciar credenciais de forma segura. Você precisa configurar apenas uma vez:

```bash
# Este comando irá abrir um assistente interativo
eas credentials
```

Quando solicitado:

1. **Selecione**: `Android` → `production` → `Set up new credentials`
2. **Escolha**: `Upload existing keystore`
3. **Forneça o caminho**: `./upload-keystore.jks`
4. **Digite as senhas quando solicitado**:
   - Keystore password
   - Key alias
   - Key password

O EAS irá:
- ✅ Fazer upload do keystore de forma segura
- ✅ Armazenar as credenciais criptografadas
- ✅ Usá-las automaticamente em builds futuros

### Passo 2: Gerar o AAB

```bash
# Build na nuvem
npm run build:android
```

Ou diretamente:

```bash
eas build -p android --profile production
```

### Passo 3: Aguardar o Build

- ⏱️ Tempo estimado: **15-25 minutos**
- 📊 Você pode acompanhar o progresso no terminal
- 🌐 Alternativamente, acompanhe em: https://expo.dev/accounts/chatwoot/projects/chatwoot-mobile/builds

### Passo 4: Download do AAB

Quando o build terminar, você verá:

```
✔ Build finished
   https://expo.dev/artifacts/eas/xxxxx.aab
   ID: xxxxx
```

**Para fazer download:**

1. Acesse o link ou use:
   ```bash
   eas build:list
   ```

2. Faça download do AAB:
   ```bash
   eas build:download --id <BUILD_ID>
   ```

### Passo 5: Enviar para Play Store

**Opção A - Via EAS Submit (Automático):**

```bash
npm run submit:android
```

Ou:

```bash
eas submit -p android --profile production
```

**Opção B - Manual na Play Console:**

1. Acesse [Google Play Console](https://play.google.com/console)
2. Vá em **Release** → **Production** (ou **Internal testing**)
3. Clique em **Create new release**
4. Faça upload do arquivo `.aab` baixado

---

## 💻 Opção 2: Build Local (Requer Android Studio)

Esta opção gera o AAB localmente na sua máquina.

### Requisitos

- ✅ Android Studio instalado
- ✅ Android SDK configurado
- ✅ Gradle configurado
- ✅ Pelo menos **8GB de RAM livre**
- ✅ **10-15GB de espaço em disco**

### Passo 1: Configurar Gradle para Usar o Keystore

Para builds locais, você precisa configurar o Gradle para usar o keystore. Crie ou edite o arquivo `android/keystore.properties` na raiz do projeto:

**Crie o arquivo**: `android/keystore.properties`

```properties
storeFile=../../upload-keystore.jks
storePassword=SUA_STORE_PASSWORD
keyAlias=SEU_KEY_ALIAS
keyPassword=SUA_KEY_PASSWORD
```

⚠️ **IMPORTANTE**: Este arquivo contém senhas. Adicione ao `.gitignore` se ainda não estiver.

### Passo 2: Verificar Configuração do Gradle

O arquivo `android/app/build.gradle` deve ter uma configuração de signing similar a:

```gradle
android {
    ...
    signingConfigs {
        release {
            if (project.hasProperty('MYAPP_UPLOAD_STORE_FILE')) {
                storeFile file(MYAPP_UPLOAD_STORE_FILE)
                storePassword MYAPP_UPLOAD_STORE_PASSWORD
                keyAlias MYAPP_UPLOAD_KEY_ALIAS
                keyPassword MYAPP_UPLOAD_KEY_PASSWORD
            }
        }
    }
    buildTypes {
        release {
            ...
            signingConfig signingConfigs.release
        }
    }
}
```

Se não tiver, será necessário adicionar após gerar os arquivos nativos.

### Passo 3: Gerar Arquivos Without

Execute este comando antes do primeiro build local:

```bash
npm run generate
```

Ou, se os arquivos já existirem:

```bash
npm run generate:soft
```

### Passo 4: Gerar o AAB Localmente

```bash
npm run build:android:local
```

Ou diretamente:

```bash
dotenv -c -- eas build -p android --profile production --local
```

### Passo 5: Aguardar o Build

- ⏱️ Tempo estimado: **20-40 minutos** (primeira vez)
- 📊 Builds subsequentes são mais rápidos
- 💾 O AAB será gerado na pasta `./android/app/build/outputs/bundle/release/`

### Passo 6: Localizar o AAB Gerado

O AAB será salvo em:

```
./android/app/build/outputs/bundle/release/app-release.aab
```

Ou, se o EAS Build local gerar:

```
./build-xxxxxxxx.aab
```

### Passo 7: Enviar para Play Store

**Via EAS Submit:**

```bash
eas submit -p android --path ./android/app/build/outputs/bundle/release/app-release.aab
```

**Ou manualmente na Play Console:**
1. Acesse [Google Play Console](https://play.google.com/console)
2. Faça upload do `.aab` manualmente

---

## 🔐 Gerenciamento de Senhas

### Usando Variáveis de Ambiente (Recomendado para Build Local)

Você pode criar um arquivo `.env.local` (não versionado) com:

```bash
# Android Keystore
ANDROID_KEYSTORE_FILE=./upload-keystore.jks
ANDROID_KEYSTORE_PASSWORD=sua_store_password
ANDROID_KEY_ALIAS=seu_key_alias
ANDROID_KEY_PASSWORD=sua_key_password
```

E então usar no Gradle (exige configuração adicional).

### Para EAS Build (Build na Nuvem)

Não é necessário! As credenciais ficam seguras no EAS após a primeira configuração.

---

## ✅ Checklist Antes do Build

Antes de gerar o AAB, certifique-se de:

- [ ] ✅ Arquivo `upload-keystore.jks` está na raiz do projeto
- [ ] ✅ Você tem todas as senhas do keystore
- [ ] ✅ Versão do app está atualizada em `app.config.ts` (`version`)
- [ ] ✅ Package name está correto em `app.config.ts`
- [ ] ✅ Arquivo `.env` está configurado (se necessário)
- [ ] ✅ Você está logado no EAS (`eas whoami`)

---

## 🐛 Problemas Comuns

### "Keystore file not found"

**Solução**: Verifique se o arquivo `upload-keystore.jks` está na raiz do projeto.

```bash
ls -la upload-keystore.jks
```

### "Keystore was tampered with, or password was incorrect"

**Solução**: Verifique se você está usando a senha correta do keystore.

### "EAS project not configured"

**Solução**: O projeto precisa estar associado a uma conta Expo. Verifique:

```bash
eas whoami
eas build:configure
```

### "Build failed - Invalid keystore"

**Solução**: 
1. Verifique se o keystore não está corrompido:
   ```bash
   keytool -list -v -keystore upload-keystore.jks
   ```
2. Verifique se está usando o alias correto

### "Credentials already exist"

**Solução**: Se você já configurou credenciais antes mas quer atualizar:

```bash
eas credentials
# Selecione: Android → production → Update credentials
```

---

## 📊 Comparação das Opções

| Opção | Velocidade | Requisitos | Segurança | Recomendado Para |
|-------|-----------|-----------|-----------|------------------|
| **EAS Build (Nuvem)** | Rápido (15-25min) | Apenas EAS CLI | ✅ Alta (credenciais seguras) | ✅ **Produção** |
| **Build Local** | Lento (20-40min) | Android Studio | ⚠️ Média (keystore local) | Testes/Desenvolvimento |

---

## 📝 Informações do Keystore

Para verificar informações do seu keystore:

```bash
keytool -list -v -keystore upload-keystore.jks
```

Isso mostrará:
- ✅ Alias das chaves
- ✅ Data de criação
- ✅ Validade
- ✅ Algoritmo de criptografia

---

## 🔄 Atualizar Keystore (Se Necessário)

Se você precisar criar um novo keystore (⚠️ **só faça isso se necessário**):

```bash
keytool -genkeypair -v -storetype PKCS12 -keystore upload-keystore.jks -alias upload -keyalg RSA -keysize 2048 -validity 10000
```

⚠️ **ATENÇÃO**: Mudar o keystore requer atualizar as credenciais na Play Console!

---

## 📞 Suporte

Se encontrar problemas:

1. Verifique os logs: `eas build:list`
2. Consulte: [Expo EAS Build Docs](https://docs.expo.dev/build/introduction/)
3. Consulte: [Android App Bundle Guide](https://developer.android.com/guide/app-bundle)
4. Verifique o [ANDROID_15_UPDATES.md](ANDROID_15_UPDATES.md) para detalhes das mudanças

---

## 🎯 Comandos Rápidos

```bash
# Build na nuvem (recomendado)
npm run build:android

# Build local
npm run build:android:local

# Enviar para Play Store
npm run submit:android

# Ver builds anteriores
eas build:list

# Download de um build específico
eas build:download --id <BUILD_ID>

# Lance um novo build de produção
eas build -p android --profile production --auto-submit
```

---

**Última atualização**: Outubro 2025

