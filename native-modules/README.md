# Native Modules

Este diretório contém módulos nativos customizados que precisam ser copiados para os projetos nativos após regeneração.

## iOS Modules

### NowPlayingManager

Módulo nativo para controle do Now Playing Center (tela de bloqueio) no iOS.

**Arquivos:**
- `ios-native/NowPlayingManager.h`
- `ios-native/NowPlayingManager.m`

**Funcionalidades:**
- Exibe player na tela de bloqueio (como WhatsApp)
- Controles remotos (play/pause/seek)
- Força categoria `AVAudioSessionCategoryPlayback` (sobrescreve o `Ambient` do expo-av)

## Instruções de Instalação

### Após regenerar a pasta `ios/` (npm run generate)

1. **Copiar arquivos para o projeto iOS:**

```bash
cp native-modules/ios-native/NowPlayingManager.h ios/ZapiCrm/
cp native-modules/ios-native/NowPlayingManager.m ios/ZapiCrm/
```

2. **Adicionar ao projeto Xcode:**

Abra o Xcode e arraste os arquivos `NowPlayingManager.h` e `NowPlayingManager.m` para o grupo `ZapiCrm` no navegador de projeto.

Ou use o script automatizado:

```bash
./scripts/install-native-modules.sh
```

3. **Rebuild o projeto:**

```bash
cd ios
pod install
open ZapiCrm.xcworkspace
```

No Xcode: Product > Clean Build Folder (Cmd+Shift+K), depois Product > Build (Cmd+B)

## Por que isso é necessário?

A pasta `ios/` é gerada pelo Expo prebuild e não é versionada no git (está no `.gitignore`). Quando você roda `npm run generate`, a pasta é recriada do zero e os módulos nativos customizados são perdidos.

Este diretório serve como backup versionado dos módulos nativos que precisam ser restaurados após cada regeneração.
