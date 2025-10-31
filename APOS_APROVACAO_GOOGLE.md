# Processo Após Aprovação da Nova Keystore pelo Google

## Situação Atual

O Google está processando a aprovação da nova keystore (`upload-keystore.jks`). Após a aprovação, você poderá usar esta keystore para assinar todas as versões futuras.

---

## Opção 1: Assinatura Manual com jarsigner (Após Aprovação)

Depois que o Google aprovar, você poderá assinar AABs manualmente:

```bash
jarsigner -verbose \
    -sigalg SHA256withRSA \
    -digestalg SHA-256 \
    -keystore upload-keystore.jks \
    app-release.aab \
    upload
```

Quando solicitado, digite a senha do keystore: `zapicrm2024`

### Script Automatizado

Use o script criado para facilitar:

```bash
./assinar-aab.sh [caminho-para-aab]
```

Ou simplesmente:
```bash
./assinar-aab.sh
```

(O script usa o AAB gerado automaticamente em `android/app/build/outputs/bundle/release/app-release.aab`)

### Verificar Assinatura

Após assinar, verifique:

```bash
jarsigner -verify -verbose -certs app-release.aab
```

---

## Opção 2: Assinatura Automática com Gradle (RECOMENDADO)

O `build.gradle` já está configurado para assinar automaticamente durante o build. Após a aprovação, você pode simplesmente:

```bash
cd android
./gradlew clean bundleRelease
```

O AAB será assinado automaticamente com o keystore configurado.

### Configuração Atual no build.gradle

```gradle
signingConfigs {
    release {
        storeFile file('upload-keystore.jks')
        storePassword 'zapicrm2024'
        keyAlias 'upload'
        keyPassword 'zapicrm2024'
    }
}
```

**Status**: ✅ Já configurado e pronto para usar após aprovação do Google.

---

## Passo a Passo Completo (Após Aprovação)

### 1. Verificar Aprovação

Quando o Google aprovar, você receberá uma notificação na Play Console.

### 2. Gerar Novo AAB

```bash
cd android
./gradlew clean bundleRelease
```

O AAB será gerado em:
```
android/app/build/outputs/bundle/release/app-release.aab
```

Este AAB já estará assinado automaticamente pelo Gradle! ✅

### 3. (Opcional) Verificar Assinatura

```bash
jarsigner -verify -verbose -certs android/app/build/outputs/bundle/release/app-release.aab
```

### 4. Fazer Upload na Play Store

- Acesse [Google Play Console](https://play.google.com/console)
- Vá em **Release** → **Production**
- Faça upload do `app-release.aab`

---

## Verificar SHA1 do AAB Assinado

Para confirmar que o AAB está usando a nova keystore:

```bash
# Extrair certificado do AAB
unzip -p android/app/build/outputs/bundle/release/app-release.aab META-INF/*.RSA | keytool -printcert
```

Procure por:
```
Certificate fingerprints:
	 SHA1: 99:3E:7F:00:74:22:AC:6E:D2:1B:9C:9B:0F:20:A4:5E:6C:14:39:AA
```

Este SHA1 deve corresponder ao da nova keystore.

---

## Notas Importantes

⚠️ **Após a aprovação do Google:**
- Você DEVE usar apenas o `upload-keystore.jks` para todas as versões futuras
- NÃO use mais a keystore antiga
- Mantenha o `upload-keystore.jks` em backup seguro

✅ **Vantagens da assinatura automática (Gradle):**
- Mais rápido e conveniente
- Menos chances de erro
- Não precisa lembrar do comando jarsigner

---

## Troubleshooting

### Erro: "jarsigner: certificate chain not found"

**Solução**: Verifique se você está usando o alias correto (`upload`)

### Erro: "jarsigner: unable to sign jar"

**Solução**: Verifique se a senha está correta e se o keystore não está corrompido

### Erro na Play Store: "Keystore incorreta"

**Solução**: 
1. Aguarde a aprovação completa do Google
2. Certifique-se de estar usando o `upload-keystore.jks` correto
3. Verifique o SHA1 do AAB assinado

---

## Checklist Pós-Aprovação

- [ ] Google aprovou a nova keystore
- [ ] AAB gerado com `./gradlew bundleRelease`
- [ ] AAB assinado automaticamente (ou manualmente com jarsigner)
- [ ] SHA1 verificado e corresponde à nova keystore
- [ ] Upload bem-sucedido na Play Store

---

**Última atualização**: Outubro 2025

