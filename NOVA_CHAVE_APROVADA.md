# Gerar AAB com Nova Chave Aprovada pelo Google

## Situação
✅ Nova chave criada e certificado PEM enviado  
✅ Google Play aprovou a nova chave  
✅ Agora pode gerar AAB assinado com a nova chave

---

## Passo 1: Verificar Configuração do build.gradle

O arquivo `android/app/build.gradle` precisa ter a senha correta da nova chave nas linhas 106 e 108:

```gradle
release {
    storeFile file('upload-keystore.jks')
    storePassword 'SUA_SENHA_AQUI'        // ← Atualizar com a senha da nova chave
    keyAlias 'upload'
    keyPassword 'SUA_SENHA_AQUI'         // ← Atualizar com a senha da nova chave
}
```

### Atualizar Senha

Se você usou uma senha diferente de `zapicrm2024` ao criar a nova chave:

1. Abra `android/app/build.gradle`
2. Atualize as linhas 106 e 108 com a senha correta
3. Salve o arquivo

---

## Passo 2: Gerar AAB com Nova Chave

Após atualizar a senha no build.gradle:

```bash
cd android
./gradlew clean bundleRelease
```

O AAB será gerado e assinado automaticamente com a nova chave em:
```
android/app/build/outputs/bundle/release/app-release.aab
```

---

## Passo 3: Verificar Assinatura

Para confirmar que o AAB está assinado com a nova chave:

```bash
jarsigner -verify -verbose -certs android/app/build/outputs/bundle/release/app-release.aab
```

Ou extrair o certificado:

```bash
unzip -p android/app/build/outputs/bundle/release/app-release.aab META-INF/*.RSA | keytool -printcert | grep SHA1
```

O SHA1 deve corresponder ao da nova keystore.

---

## Passo 4: Fazer Upload na Play Store

1. Acesse [Google Play Console](https://play.google.com/console)
2. Vá em **Release** → **Production** (ou **Internal testing**)
3. Clique em **Create new release**
4. Faça upload do arquivo `app-release.aab`

O Google deve aceitar pois a nova chave já foi aprovada! ✅

---

## Alternativa: Assinar Manualmente (se necessário)

Se preferir gerar o AAB sem assinar e assinar manualmente depois:

### 1. Gerar AAB sem assinatura temporariamente

Comente a linha `signingConfig signingConfigs.release` no build.gradle temporariamente.

### 2. Assinar com jarsigner

```bash
jarsigner -verbose \
    -sigalg SHA256withRSA \
    -digestalg SHA-256 \
    -keystore upload-keystore.jks \
    android/app/build/outputs/bundle/release/app-release.aab \
    upload
```

---

## Verificar Informações da Nova Chave

Para verificar as informações da nova chave:

```bash
keytool -list -v -keystore upload-keystore.jks
```

Quando solicitado, digite a senha da nova chave.

---

## Troubleshooting

### Erro: "Keystore password was incorrect"

**Solução**: Atualize a senha no `build.gradle` (linhas 106 e 108) com a senha que você usou ao criar a nova chave.

### Erro: "Alias não encontrado"

**Solução**: Verifique se o alias está correto (deve ser `upload`)

### Erro na Play Store: "Chave não corresponde"

**Solução**: 
- Certifique-se de estar usando a nova chave (que foi aprovada)
- Verifique o SHA1 do AAB assinado
- Aguarde alguns minutos após a aprovação da chave na Play Console

---

## Checklist

- [ ] Senha atualizada no `build.gradle` (linhas 106 e 108)
- [ ] Keystore `upload-keystore.jks` na raiz e em `android/app/`
- [ ] AAB gerado com `./gradlew bundleRelease`
- [ ] Assinatura verificada
- [ ] SHA1 corresponde à nova chave aprovada
- [ ] Upload realizado na Play Store

---

**Última atualização**: Outubro 2025

