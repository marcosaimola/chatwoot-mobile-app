# Como Verificar e Usar o Keystore Correto

## Problema
O AAB foi assinado com um keystore que não corresponde ao esperado pela Play Store.

- **SHA1 Esperado pela Play Store**: `CD:78:1B:F0:BF:B1:25:99:3D:1F:44:29:50:EB:5F:66:8E:E6:15:10`
- **SHA1 do Keystore Atual**: `99:3E:7F:00:74:22:AC:6E:D2:1B:9C:9B:0F:20:A4:5E:6C:14:39:AA`

## Passo 1: Localizar o Keystore Correto

Procure pelo keystore original em:
- Backups do projeto
- Arquivos de configuração antigos
- Servidor de CI/CD (EAS Build, GitHub Actions, etc.)
- Gestor de senhas ou cofre seguro onde credenciais são armazenadas
- Documentação do projeto

## Passo 2: Verificar o SHA1 do Keystore Encontrado

Se você encontrou um possível keystore, verifique o SHA1:

```bash
# Substitua o caminho e senha pelos corretos
keytool -list -v -keystore caminho/para/keystore.jks -storepass SENHA
```

Procure por:
```
Certificate fingerprints:
	 SHA1: CD:78:1B:F0:BF:B1:25:99:3D:1F:44:29:50:EB:5F:66:8E:E6:15:10
```

## Passo 3: Configurar o Keystore Correto

Uma vez que você tenha o keystore correto:

1. **Substitua o arquivo atual:**
   ```bash
   # Backup do keystore atual (se necessário)
   mv upload-keystore.jks upload-keystore.jks.backup
   
   # Copie o keystore correto
   cp caminho/para/keystore-correto.jks upload-keystore.jks
   ```

2. **Copie também para android/app:**
   ```bash
   cp upload-keystore.jks android/app/upload-keystore.jks
   ```

3. **Verifique as senhas:**
   - Você precisa saber:
     - Store password (senha do keystore)
     - Key alias (geralmente "upload" ou "key0")
     - Key password (senha da chave)

4. **Atualize o build.gradle:**
   O arquivo `android/app/build.gradle` já está configurado, mas verifique se as senhas estão corretas nas linhas 104-109:
   ```gradle
   release {
       storeFile file('upload-keystore.jks')
       storePassword 'SUA_SENHA_AQUI'
       keyAlias 'SEU_ALIAS_AQUI'
       keyPassword 'SUA_SENHA_AQUI'
   }
   ```

## Passo 4: Regenerar o AAB

Após configurar o keystore correto:

```bash
cd android
./gradlew clean bundleRelease
```

## Passo 5: Verificar o SHA1 do AAB Gerado

Antes de enviar, verifique se o SHA1 está correto:

```bash
# Extrair e verificar o certificado do AAB
unzip -p app-release.aab META-INF/*.RSA | keytool -printcert | grep SHA1
```

Ou use:
```bash
jarsigner -verify -verbose -certs app-release.aab | grep SHA1
```

## Opção Alternativa: Usar EAS Build

Se o keystore correto está configurado no EAS Build:

1. **Verificar credenciais no EAS:**
   ```bash
   eas credentials
   ```

2. **Usar build na nuvem:**
   ```bash
   npm run build:android
   ```
   
   O EAS usará o keystore correto automaticamente.

## Importante

⚠️ **NUNCA perca o keystore correto!** Se você perder, não conseguirá mais atualizar o app na Play Store.

⚠️ **Se você não conseguir encontrar o keystore correto**, você terá que:
- Criar um novo app na Play Store (nova package name)
- Ou entrar em contato com o Google Play Support (pode ser difícil recuperar)

## Checklist

- [ ] Keystore correto localizado
- [ ] SHA1 verificado (CD:78:1B:F0:BF:B1:25:99:3D:1F:44:29:50:EB:5F:66:8E:E6:15:10)
- [ ] Senhas conhecidas (store password, key alias, key password)
- [ ] Arquivo substituído em `upload-keystore.jks` e `android/app/upload-keystore.jks`
- [ ] build.gradle atualizado com senhas corretas
- [ ] AAB regenerado
- [ ] SHA1 do AAB verificado antes do upload

