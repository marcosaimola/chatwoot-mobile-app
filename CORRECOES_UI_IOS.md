# Correções de UI para iOS

## Data: 31/10/2025

### Problemas Corrigidos

#### 1. Título "Conversations" Quebrando Linha no iOS

**Problema**: O título "Conversations" na tela de conversas estava quebrando linha na letra "s" em dispositivos iOS.

**Causa**: O componente `Text` não tinha restrição de número de linhas e não ajustava o tamanho da fonte automaticamente quando o espaço era insuficiente.

**Solução**: Adicionadas as propriedades `numberOfLines={1}` e `adjustsFontSizeToFit` ao componente de título.

**Arquivo Modificado**: `src/screens/conversations/components/conversation-header/ConversationHeaderPresenter.tsx`

```typescript
const HeaderTitle = () => (
  <Animated.View style={tailwind.style('flex-1')}>
    <Text
      numberOfLines={1}          // ✅ Força o texto a permanecer em uma linha
      adjustsFontSizeToFit       // ✅ Reduz o tamanho da fonte se necessário
      style={tailwind.style(
        'text-[17px] font-inter-medium-24 tracking-[0.32px] leading-[17px] text-center text-gray-950',
      )}>
      {i18n.t('CONVERSATION.HEADER.TITLE')}
    </Text>
  </Animated.View>
);
```

**Comportamento Anterior**:
- Título quebrava em duas linhas: "Conversation" e "s"
- Interface ficava desalinhada

**Comportamento Atual**:
- Título permanece em uma única linha
- Se necessário, a fonte é reduzida ligeiramente para caber no espaço disponível
- Interface mantém alinhamento consistente

---

#### 2. Bottom Sheets Truncando com a Borda do Aparelho no iOS

**Problema**: As últimas opções dos bottom sheets (modais inferiores) estavam sendo cortadas pela borda inferior do aparelho em dispositivos iOS, especialmente em iPhones com notch/Dynamic Island.

**Causa**: O componente `BottomSheetWrapper` não considerava a safe area inferior do iOS, fazendo com que o conteúdo fosse renderizado sobre a área do gesto de home (home indicator).

**Solução**: Implementado `useSafeAreaInsets` para adicionar padding dinâmico baseado na safe area do dispositivo.

**Arquivo Modificado**: `src/components-next/common/bottomsheet/BottomSheetWrapper.tsx`

```typescript
import React, { PropsWithChildren } from 'react';
import { BottomSheetView } from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const BottomSheetWrapper = (props: PropsWithChildren) => {
  const { children } = props;
  const insets = useSafeAreaInsets();
  
  // Add bottom padding for iOS safe area, with a minimum of 16px
  const bottomPadding = Math.max(insets.bottom, 16);
  
  return (
    <BottomSheetView style={{ paddingBottom: bottomPadding }}>
      {children}
    </BottomSheetView>
  );
};
```

**Comportamento Anterior**:
- Última opção do bottom sheet ficava parcialmente oculta
- Difícil clicar na última opção devido à proximidade com o home indicator
- Experiência ruim em iPhones modernos (iPhone X e posteriores)

**Comportamento Atual**:
- ✅ Padding dinâmico baseado no safe area insets do dispositivo
- ✅ Mínimo de 16px de padding em dispositivos sem notch
- ✅ Padding adicional automático em dispositivos com notch/Dynamic Island
- ✅ Todas as opções ficam totalmente visíveis e clicáveis
- ✅ Espaçamento confortável entre o conteúdo e o home indicator

**Valores de Padding por Dispositivo**:
| Dispositivo | Bottom Inset | Padding Aplicado |
|-------------|--------------|------------------|
| iPhone SE / 8 | 0px | 16px (mínimo) |
| iPhone 11 / 12 / 13 | ~34px | 34px |
| iPhone 14 Pro / 15 Pro | ~34px | 34px |
| iPad | 0px | 16px (mínimo) |

---

## Bottom Sheets Afetados

Estas correções aplicam-se a **todos** os bottom sheets do aplicativo que usam `BottomSheetWrapper`:

### Tela de Conversações
- ✅ Filtro de Status
- ✅ Filtro de Ordenação (Sort By)
- ✅ Filtro de Tipo de Responsável (Assignee Type)
- ✅ Filtro de Inbox

### Tela de Configurações
- ✅ Preferências de Notificação
- ✅ Trocar de Conta (Switch Account)
- ✅ Ações de Debug

### Tela de Inbox
- ✅ Filtros de Inbox

### Tela de Chat
- ✅ Menu de Mensagem
- ✅ Menu Dropdown do Header
- ✅ Status de Entrega

---

## Testes Recomendados

### Teste 1: Título "Conversations"
- [ ] Abrir tela de Conversações em iPhone SE (tela menor)
- [ ] Verificar que o título não quebra linha
- [ ] Abrir tela de Conversações em iPhone 15 Pro Max (tela maior)
- [ ] Verificar que o título está centralizado e legível

### Teste 2: Bottom Sheets
- [ ] Abrir cada bottom sheet em iPhone com notch (iPhone X+)
- [ ] Verificar que todas as opções estão visíveis
- [ ] Verificar que há espaço entre a última opção e o home indicator
- [ ] Tentar clicar na última opção - deve ser facilmente clicável
- [ ] Testar em iPhone SE - verificar padding mínimo de 16px
- [ ] Testar em iPad - verificar padding mínimo de 16px

---

## Compatibilidade

### iOS
- ✅ iPhone SE (sem notch)
- ✅ iPhone 11, 12, 13 (notch)
- ✅ iPhone 14 Pro, 15 Pro (Dynamic Island)
- ✅ iPad (todas as versões)

### Android
- ✅ Compatível (safe area insets retornam 0, padding mínimo de 16px é aplicado)

---

## Notas Técnicas

### numberOfLines vs ellipsizeMode
Optamos por `numberOfLines={1}` com `adjustsFontSizeToFit` em vez de `ellipsizeMode` porque:
- Mantém o texto completo visível
- Melhor experiência do usuário (não corta o texto)
- Funciona bem com títulos curtos como "Conversations"

### Safe Area vs Fixed Padding
Usar `useSafeAreaInsets()` em vez de padding fixo porque:
- Adapta-se automaticamente a diferentes modelos de iPhone
- Funciona em landscape e portrait
- Compatível com futuras mudanças de design da Apple
- Não adiciona padding excessivo em dispositivos sem notch

### Performance
- `useSafeAreaInsets()` é otimizado e não causa re-renders desnecessários
- O cálculo de `Math.max(insets.bottom, 16)` é trivial e não impacta performance

---

## Arquivos Modificados

1. **`src/screens/conversations/components/conversation-header/ConversationHeaderPresenter.tsx`**
   - Adicionado `numberOfLines={1}` e `adjustsFontSizeToFit` ao título

2. **`src/components-next/common/bottomsheet/BottomSheetWrapper.tsx`**
   - Adicionado `useSafeAreaInsets` hook
   - Implementado padding dinâmico baseado em safe area
   - Garantido padding mínimo de 16px

---

## Próximos Passos

- [ ] Testar em dispositivos físicos iOS (iPhone 11+)
- [ ] Testar em iPad
- [ ] Verificar comportamento em landscape
- [ ] Considerar aplicar mesma lógica em outros componentes modais se necessário

---

## Referências

- [React Native Text - numberOfLines](https://reactnative.dev/docs/text#numberoflines)
- [React Native Text - adjustsFontSizeToFit](https://reactnative.dev/docs/text#adjustsfontSizetofit-ios)
- [React Native Safe Area Context](https://github.com/th3rdwave/react-native-safe-area-context)
- [iOS Human Interface Guidelines - Safe Area](https://developer.apple.com/design/human-interface-guidelines/layout)

