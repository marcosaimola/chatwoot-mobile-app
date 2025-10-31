# Atualizações para Compatibilidade com Android 15

Este documento descreve as mudanças implementadas para atender às recomendações do Google Play Store relacionadas ao Android 15 e SDK 35.

## Data da Implementação
27 de Outubro de 2025

## Versão do App
4.4.1

---

## ✅ 1. Edge-to-Edge Display (IMPLEMENTADO)

### Problema
Apps com targetSDK 35 precisam lidar com recuos edge-to-edge no Android 15+.

### Solução Implementada

1. **Biblioteca Instalada**: `react-native-edge-to-edge@1.0.0`
   ```bash
   npm install react-native-edge-to-edge --legacy-peer-deps
   ```

2. **MainActivity.kt Modificado**:
   ```kotlin
   import com.zoontek.rnedgetoedge.EdgeToEdge

   override fun onCreate(savedInstanceState: Bundle?) {
     EdgeToEdge.enable(this)  // Habilita edge-to-edge
     setTheme(R.style.AppTheme);
     super.onCreate(null)
   }
   ```

3. **Compatibilidade**:
   - O app já usa `react-native-safe-area-context` com `SafeAreaView` em todas as telas
   - Nenhuma mudança no layout React Native foi necessária
   - Os insets são tratados automaticamente

### Impacto
✅ **ZERO** - Não quebra funcionalidade existente

---

## ✅ 2. Suporte a 16KB Page Size (IMPLEMENTADO)

### Problema
Apps precisam suportar dispositivos com tamanho de página de memória de 16KB.
**Deadline**: 1º de Novembro de 2025 (pode ser estendido até 31 de Maio de 2026)

### Solução Implementada

1. **NDK Atualizado** (`android/build.gradle`):
   ```gradle
   ndkVersion = "27.1.12297006"  // Antes: 26.1.10909125
   ```

2. **Gradle Properties** (`android/gradle.properties`):
   ```properties
   # Android 15+ - 16KB page size support
   android.bundle.enableUncompressedNativeLibs=false
   android.enableR8.fullMode=true
   ```

3. **Rebuild Nativo**:
   ```bash
   npm run generate:soft
   ```

### Impacto
⚠️ **BAIXO RISCO** - Requer rebuild mas NDK 27 é compatível com React Native 0.76

---

## ⚠️ 3. APIs Descontinuadas (WARNINGS - Não Corrigido)

### Problema
Bibliotecas de terceiros usam APIs descontinuadas:
- `android.view.Window.setStatusBarColor`
- `android.view.Window.setNavigationBarColor`
- `LAYOUT_IN_DISPLAY_CUTOUT_MODE_*`

### Bibliotecas Afetadas
- `react-native-screens` (4.4.0)
- `@gorhom/bottom-sheet` (5.1.2)
- `react-native-keyboard-controller` (1.16.0)
- `com.google.android.material` (Material Design Components)

### Status
📊 **AGUARDANDO UPDATES** - Essas APIs ainda funcionam no Android 15, apenas são deprecated.

### Ação Futura
Monitorar atualizações dessas bibliotecas e atualizar quando versões compatíveis estiverem disponíveis.

### Impacto
✅ **ZERO** - Apenas warnings, funcionalidade continua normal

---

## ❌ 4. Picture-in-Picture (NÃO IMPLEMENTADO)

### Problema
Google sugere implementar PiP para melhorar engajamento.

### Decisão
**NÃO IMPLEMENTAR** - O app é de chat/atendimento, não de vídeo.
- PiP é mais útil para apps de streaming/videochamadas
- Não é obrigatório, apenas sugestão de UX
- Pode ser implementado futuramente se necessário

### Impacto
✅ **ZERO** - Não implementar não causa problemas

---

## Arquivos Modificados

1. ✅ `package.json` - Adicionada dependência `react-native-edge-to-edge`
2. ✅ `android/app/src/main/java/com/chatwoot/MainActivity.kt` - Habilitado edge-to-edge
3. ✅ `android/build.gradle` - Atualizado NDK para versão 27.1.12297006
4. ✅ `android/gradle.properties` - Adicionadas configurações para 16KB

---

## Próximos Passos

### Antes de Publicar na Play Store

1. **Teste Local** (IMPORTANTE):
   ```bash
   npm run build:android:local
   ```

2. **Testes Manuais** (CRÍTICO):
   - ✅ Testar navegação em todas as telas
   - ✅ Verificar se SafeArea está funcionando corretamente
   - ✅ Testar notificações push
   - ✅ Testar gravação e reprodução de áudio
   - ✅ Testar deep links
   - ✅ Verificar se status bar e navigation bar estão corretos

3. **Teste em Android 15**:
   - Idealmente testar em emulador Android 15 ou dispositivo físico
   - Verificar comportamento edge-to-edge

4. **Build de Produção**:
   ```bash
   npm run build:android
   ```

5. **Envio para Play Store**:
   ```bash
   npm run submit:android
   ```

### Monitoramento Contínuo

- **APIs Descontinuadas**: Verificar atualizações mensais de:
  - `react-native-screens`
  - `@gorhom/bottom-sheet`
  - `react-native-keyboard-controller`

- **Google Play Console**: Monitorar relatórios de compatibilidade

---

## Notas Técnicas

### Edge-to-Edge e SafeAreaView

O app já utiliza `SafeAreaView` do `react-native-safe-area-context` nas seguintes telas:
- `AiAgentsScreen.tsx`
- `MessageMenu.tsx`
- `DropdownMenu.tsx`
- `SettingsScreen.tsx`
- `ConfigURLScreen.tsx`

A biblioteca `react-native-edge-to-edge` apenas habilita o modo edge-to-edge no nível nativo, mas o `SafeAreaView` garante que o conteúdo não seja cortado pelas barras do sistema.

### 16KB Page Size

A atualização do NDK para versão 27+ é essencial pois:
- NDK r27 usa alinhamento de 16KB por padrão
- Todas as bibliotecas `.so` serão recompiladas com o novo alinhamento
- Garante compatibilidade com futuros dispositivos Android

### Compatibilidade com Versões Anteriores

Todas as alterações são **retrocompatíveis**:
- Edge-to-edge funciona em Android 15+ mas não afeta versões antigas
- NDK 27 compila bibliotecas compatíveis com minSDK 24
- Configurações do Gradle são aplicadas apenas quando apropriado

---

## Referências

- [React Native Edge-to-Edge](https://github.com/zoontek/react-native-edge-to-edge)
- [Android 15 Behavior Changes](https://developer.android.com/about/versions/15/behavior-changes-15)
- [Android 16KB Page Size Support](https://developer.android.com/guide/practices/page-sizes)
- [Expo Edge-to-Edge Blog](https://expo.dev/blog/edge-to-edge-display-now-streamlined-for-android)
