# 🚀 Como Gerar AAB no Android Studio

## 📋 Pré-requisitos

1. **Android Studio** instalado e configurado
2. **Node.js 18 ou 20 LTS** via nvm (não use Node 24)
3. **Java JDK** do Android Studio
4. **Android SDK** configurado

## 🔧 Passo a Passo no Android Studio

### 1. **Abrir o Projeto**

1. Abra o Android Studio
2. **File → Open**
3. Selecione a pasta `android/` do projeto
4. Aguarde o Gradle sincronizar (pode demorar alguns minutos na primeira vez)

### 2. **Configurar Variáveis de Ambiente (se necessário)**

Se o Android Studio não encontrar o Node.js automaticamente:

1. **Android Studio → Settings** (ou `⌘,` no Mac)
2. **Build, Execution, Deployment → Build Tools → Gradle**
3. Em **Gradle JVM**, selecione o JDK do Android Studio
4. Em **Environment variables**, adicione:
   ```
   PATH=/Users/seu-usuario/.nvm/versions/node/v20.20.0/bin:$PATH
   ```

### 3. **Verificar Configuração de Assinatura**

Certifique-se de que o `android/app/build.gradle` tem a configuração de assinatura:

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

### 4. **Gerar o AAB**

#### Método 1: Via Menu (Recomendado)

1. No menu superior: **Build → Generate Signed Bundle / APK...**
2. Selecione **Android App Bundle**
3. Clique em **Next**
4. Selecione o keystore:
   - **Key store path**: `android/upload-keystore.jks`
   - **Key store password**: `@Upgrybt26`
   - **Key alias**: `upload`
   - **Key password**: `@Upgrybt26`
5. Clique em **Next**
6. Selecione **release** como Build Variant
7. Clique em **Create**

#### Método 2: Via Gradle Tasks

1. No painel direito, abra **Gradle**
2. Expanda: **app → Tasks → bundle**
3. Clique duas vezes em **bundleRelease**
4. Aguarde o build completar

### 5. **Localizar o AAB Gerado**

O arquivo será gerado em:
```
android/app/build/outputs/bundle/release/app-release.aab
```

## 🔍 Verificar se o Build Funcionou

1. Abra o painel **Build** na parte inferior do Android Studio
2. Procure por mensagens de erro (vermelho) ou sucesso (verde)
3. Se houver erros, verifique:
   - Node.js está no PATH
   - `local.properties` existe com `sdk.dir`
   - Dependências estão instaladas (`npm install`)

## ⚠️ Problemas Comuns

### Erro: "Node not found"
- Verifique se o Node.js está no PATH
- Use `nvm use 20` antes de abrir o Android Studio
- Ou configure o PATH nas variáveis de ambiente do Android Studio

### Erro: "SDK location not found"
- Crie o arquivo `android/local.properties`:
  ```properties
  sdk.dir=/Users/seu-usuario/Library/Android/sdk
  ```

### Erro: "ReadableStream is not defined"
- Use Node.js 20 LTS (não 18)
- Execute `nvm use 20` antes do build

### Build muito lento
- Feche outros projetos no Android Studio
- Limpe o cache: **File → Invalidate Caches / Restart**
- Execute `./gradlew clean` antes do build

## ✅ Checklist Antes do Upload

- [ ] AAB gerado com sucesso
- [ ] Versão incrementada (`versionCode` e `versionName`)
- [ ] Assinatura configurada corretamente
- [ ] Testado em dispositivo (APK) antes do upload
- [ ] Arquivo AAB localizado em `android/app/build/outputs/bundle/release/`

## 📤 Próximos Passos

Após gerar o AAB:

1. Acesse o [Google Play Console](https://play.google.com/console)
2. Vá em **Produção → Criar nova versão**
3. Faça upload do arquivo `app-release.aab`
4. Preencha as informações da versão
5. Envie para revisão

---

**Dica**: Você também pode gerar o AAB via linha de comando usando o script `./build-aab-with-android-studio-java.sh` após configurar tudo corretamente.
