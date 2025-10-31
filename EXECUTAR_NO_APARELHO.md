# Como Executar o App no Aparelho Android

## Passo 1: Conectar o Aparelho via USB

### 1.1 Habilitar Depuração USB no Aparelho

1. Abra **Configurações** no aparelho Android
2. Vá em **Sobre o telefone**
3. Toque **7 vezes** em "Número da versão" ou "Número da build"
4. Volte e procure por **Opções do desenvolvedor**
5. Ative **Depuração USB**

### 1.2 Conectar via Cabo USB

1. Conecte o aparelho ao computador via cabo USB
2. No aparelho, aparecerá uma notificação perguntando se deseja permitir depuração USB
3. Marque "Sempre permitir deste computador" e toque em **OK**

### 1.3 Verificar Conexão

Execute este comando para verificar se o dispositivo foi detectado:

```bash
adb devices
```

Você deve ver algo como:
```
List of devices attached
XXXXXXXXXX    device
```

Se aparecer `unauthorized`, aceite a permissão no aparelho.

---

## Passo 2: Executar o App

### Opção A: Executar com Expo (Recomendado)

```bash
npm run run:android
```

Ou:

```bash
npx expo run:android -d
```

O comando irá:
- ✅ Iniciar o Metro bundler
- ✅ Compilar o app
- ✅ Instalar no dispositivo conectado
- ✅ Executar automaticamente

### Opção B: Build Gradle Direto

```bash
cd android
./gradlew installDebug
```

Depois inicie o Metro:
```bash
npm start
```

---

## Passo 3: Ver os Logs (Opcional)

Para ver os logs do app em tempo real:

```bash
adb logcat -s ReactNativeJS:V
```

Ou mais verboso:

```bash
npx react-native log-android
```

---

## Troubleshooting

### Erro: "No devices found"

**Solução**:
1. Verifique se o cabo USB está bem conectado
2. Tente outro cabo USB (alguns cabos são apenas para carregamento)
3. Tente outra porta USB no computador
4. Reinicie o servidor ADB:
   ```bash
   adb kill-server
   adb start-server
   adb devices
   ```

### Erro: "device unauthorized"

**Solução**:
1. No aparelho, revogue as autorizações USB:
   - Configurações → Opções do desenvolvedor → Revogar autorizações de depuração USB
2. Desconecte e reconecte o cabo
3. Aceite a permissão novamente no aparelho

### Erro: "INSTALL_FAILED_UPDATE_INCOMPATIBLE"

**Solução**: Desinstale a versão anterior do app:
```bash
adb uninstall br.com.zapicrm
```

Depois execute novamente:
```bash
npm run run:android
```

### Erro: "Port 8081 already in use"

**Solução**: Mate o processo usando a porta 8081:

**Mac/Linux**:
```bash
lsof -ti:8081 | xargs kill -9
```

**Windows**:
```bash
netstat -ano | findstr :8081
taskkill /PID <PID> /F
```

### App instalou mas não conecta ao Metro

**Solução**: Configure o reverse do ADB:
```bash
adb reverse tcp:8081 tcp:8081
```

---

## Comandos Rápidos

```bash
# Verificar dispositivos conectados
adb devices

# Executar app no dispositivo
npm run run:android

# Ver logs
adb logcat -s ReactNativeJS:V

# Desinstalar app
adb uninstall br.com.zapicrm

# Reiniciar ADB
adb kill-server && adb start-server

# Reverso de porta (se necessário)
adb reverse tcp:8081 tcp:8081

# Recarregar app (shake gesture alternative)
adb shell input keyevent 82
```

---

## Dicas

✅ **Melhor Performance**: Use um cabo USB de qualidade  
✅ **Recarregar Rápido**: Pressione `R` duas vezes no terminal do Metro  
✅ **Abrir Dev Menu**: Sacuda o aparelho ou execute:
```bash
adb shell input keyevent 82
```

✅ **Hot Reload**: Ativado por padrão, mudanças aparecem automaticamente  
✅ **Fast Refresh**: Preserva o estado do app ao fazer mudanças

---

**Última atualização**: Outubro 2025

