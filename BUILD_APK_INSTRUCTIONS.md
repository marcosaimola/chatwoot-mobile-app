# Como Gerar APK para Testar no Aparelho

Este guia mostra como gerar um APK para instalar e testar no seu aparelho físico Android.

---

## 📱 Opção 1: Build na Nuvem (EAS Build) - RECOMENDADO

Esta opção **não requer Android Studio** instalado e é mais rápida.

### Passo 1: Fazer login no EAS (se ainda não estiver logado)
```bash
npx eas login
```

### Passo 2: Gerar o APK
```bash
npm run build:android:apk
```

### Passo 3: Aguardar o build
- O build será feito nos servidores do Expo
- Tempo estimado: 10-20 minutos
- Você pode acompanhar o progresso no terminal

### Passo 4: Download do APK
Quando o build terminar, você verá um link para download do APK:
```
✔ Build finished
   https://expo.dev/artifacts/eas/xxxxx.apk
```

### Passo 5: Instalar no aparelho

**Opção A - Via Expo Website:**
1. Abra o link no navegador do seu celular
2. Faça download do APK
3. Permita instalação de fontes desconhecidas (se solicitado)
4. Instale o APK

**Opção B - Via ADB (se o celular estiver conectado ao computador):**
```bash
# Fazer download do APK primeiro
# Depois instalar via ADB
adb install caminho/para/o/arquivo.apk
```

---

## 💻 Opção 2: Build Local (Requer Android Studio)

Esta opção gera o APK localmente na sua máquina.

### Requisitos:
- Android Studio instalado
- Android SDK configurado
- Gradle configurado
- Pelo menos 8GB de RAM livre
- 10-15GB de espaço em disco

### Passo 1: Gerar o APK localmente
```bash
npm run build:android:apk:local
```

### Passo 2: Aguardar o build
- O build será feito na sua máquina
- Tempo estimado: 20-30 minutos (primeira vez)
- Builds subsequentes são mais rápidos

### Passo 3: Localizar o APK gerado
O APK será salvo em:
```
./build-xxxxxxxx.apk
```

### Passo 4: Instalar no aparelho

**Via ADB:**
```bash
adb install build-*.apk
```

**Via transferência manual:**
1. Copie o APK para o celular (USB, Bluetooth, etc)
2. Abra o APK no celular
3. Permita instalação de fontes desconhecidas
4. Instale

---

## 🚀 Opção 3: Build Direto no Aparelho (Desenvolvimento)

Esta opção instala diretamente no celular conectado via USB.

### Requisitos:
- Celular Android conectado via USB
- Depuração USB habilitada no celular
- Android Studio instalado

### Passos:

1. **Conectar o celular via USB**

2. **Habilitar Depuração USB no celular:**
   - Configurações → Sobre o telefone
   - Toque 7x em "Número da versão"
   - Volte → Opções do desenvolvedor
   - Ative "Depuração USB"

3. **Verificar conexão:**
```bash
adb devices
```
Deve aparecer:
```
List of devices attached
XXXXXXXXXX    device
```

4. **Instalar no celular:**
```bash
npm run run:android
```

**Vantagem**: Instalação rápida, ideal para testes durante desenvolvimento
**Desvantagem**: Não é um build de produção otimizado

---

## ✅ Checklist Antes de Testar

Antes de instalar o APK e testar, garanta que você tem o arquivo `.env` configurado:

```bash
# Verificar se .env existe
cat .env
```

Deve conter:
```
EXPO_PUBLIC_CHATWOOT_BASE_URL=https://sua-url.com
EXPO_PUBLIC_MINIMUM_CHATWOOT_VERSION=3.13.0
EXPO_PUBLIC_PROJECT_ID=seu-project-id
# ... outras variáveis
```

---

## 🧪 Testes Recomendados Após Instalar

Após instalar o APK no seu aparelho, teste:

### 1. **Edge-to-Edge Display** (Android 15)
- ✅ Verificar se o conteúdo não está sendo cortado pelas barras do sistema
- ✅ Testar em diferentes telas (Inbox, Conversas, Settings, AI Agents)
- ✅ Verificar status bar e navigation bar

### 2. **Navegação**
- ✅ Navegar entre todas as abas
- ✅ Abrir e fechar conversas
- ✅ Testar voltar e sair do app

### 3. **Funcionalidades Principais**
- ✅ Login/Logout
- ✅ Receber notificações push
- ✅ Gravar e reproduzir áudio
- ✅ Enviar mensagens
- ✅ Abrir câmera/galeria
- ✅ Deep links (se aplicável)

### 4. **Performance**
- ✅ App não trava
- ✅ Animações suaves
- ✅ Consumo de bateria normal
- ✅ Consumo de memória normal

---

## 🐛 Problemas Comuns

### "Instalação bloqueada"
**Solução**: Vá em Configurações → Segurança → Permitir instalação de fontes desconhecidas

### "App não abre após instalação"
**Solução**:
1. Desinstale o app atual
2. Reinicie o celular
3. Reinstale o APK

### "Build falhou" (EAS Build)
**Solução**:
1. Verifique se o arquivo `.env` está correto
2. Verifique se está logado: `npx eas whoami`
3. Tente novamente

### "Build falhou" (Local)
**Solução**:
1. Limpe o cache: `npm run clean`
2. Regenere os arquivos nativos: `npm run generate`
3. Tente novamente

### "NODE_ENV environment variable is required"
Este é apenas um aviso, não um erro. O build continuará normalmente.
**Solução**: Pode ignorar este aviso.

---

## 📊 Comparação das Opções

| Opção | Velocidade | Requisitos | Otimização | Recomendado Para |
|-------|-----------|-----------|------------|------------------|
| **EAS Build** | Médio (10-20min) | Apenas conta Expo | Produção | ✅ **Testes de produção** |
| **Local Build** | Lento (20-30min) | Android Studio | Produção | Testes sem internet |
| **Run Android** | Rápido (2-5min) | Android Studio + USB | Debug | Desenvolvimento |

---

## 💡 Dica Pro

Para gerar um APK de produção otimizado para testes:

```bash
# Gerar APK na nuvem (recomendado)
npm run build:android:apk

# Ou localmente (se tiver Android Studio)
npm run build:android:apk:local
```

O APK gerado terá:
- ✅ Todas as otimizações de produção
- ✅ ProGuard/R8 habilitado
- ✅ Código minificado
- ✅ Tamanho reduzido
- ✅ Suporte a Android 15 e 16KB page size

---

## 📞 Suporte

Se encontrar problemas:
1. Verifique os logs: `npx eas build:list`
2. Consulte: [Expo EAS Build Docs](https://docs.expo.dev/build/introduction/)
3. Verifique o [ANDROID_15_UPDATES.md](ANDROID_15_UPDATES.md) para detalhes das mudanças
