# Changelog - Sistema de Permissionamento de Filtros

## Versão: 4.4.2
## Data: 31/10/2025

---

## 🎯 Novas Funcionalidades

### Sistema de Permissionamento de Filtros de Conversas

Implementado sistema granular de controle de visibilidade dos filtros "All" e "Unassigned" na tela de conversas, baseado em permissões individuais por usuário.

#### Campos Adicionados no Type `Account`:
```typescript
interface Account {
  // ... campos existentes
  can_view_all_conversations?: boolean;
  can_view_unassigned_conversations?: boolean;
}
```

#### Lógica de Permissionamento:
- **Administradores**: Sempre veem todos os filtros (Mine, Unassigned, All)
- **Usuários normais**: Filtros condicionais baseados nas permissões:
  - `can_view_all_conversations = false` → Oculta filtro "All"
  - `can_view_unassigned_conversations = false` → Oculta filtro "Unassigned"
  - Filtro "Mine" sempre visível

#### Auto-correção de Filtros:
- Se usuário tem filtro "All" selecionado e perde a permissão, o sistema automaticamente ajusta para "Mine"
- Previne estados inválidos de UI

---

## 🐛 Correções de UI iOS

### 1. Título "Conversations" Quebrando Linha
- **Problema**: Título quebrava em duas linhas em telas menores
- **Solução**: Adicionado `numberOfLines={1}` e `adjustsFontSizeToFit`
- **Arquivo**: `src/screens/conversations/components/conversation-header/ConversationHeaderPresenter.tsx`

### 2. Bottom Sheets Truncando no iOS
- **Problema**: Últimas opções dos modais ficavam parcialmente ocultas pela área do home indicator
- **Solução**: Implementado `useSafeAreaInsets` para padding dinâmico
- **Arquivo**: `src/components-next/common/bottomsheet/BottomSheetWrapper.tsx`
- **Benefício**: Aplica-se automaticamente a todos os bottom sheets do app

---

## 📝 Arquivos Modificados

### Funcionalidade Principal:
1. **`src/types/Account.ts`**
   - Adicionados campos de permissão

2. **`src/screens/conversations/components/conversation-filters/AssigneeTypeFilters.tsx`**
   - Implementada lógica de permissionamento
   - Auto-correção de filtros inválidos

### Correções de UI:
3. **`src/screens/conversations/components/conversation-header/ConversationHeaderPresenter.tsx`**
   - Correção do título

4. **`src/components-next/common/bottomsheet/BottomSheetWrapper.tsx`**
   - Safe area para bottom sheets

### Utilitários:
5. **`src/utils/permissionUtils.ts`**
   - Exportado `getCurrentAccount` (já existia)

---

## 🗑️ Arquivos Removidos (Debug)

Os seguintes arquivos de debug foram criados e removidos após verificação:
- `src/components-next/common/debug/UserDebugInfo.tsx`
- `src/components-next/common/debug/index.ts`

---

## 📚 Documentação Criada

1. **`PERMISSIONAMENTO_FILTROS_CONVERSAS.md`**
   - Explicação completa da funcionalidade
   - Exemplos de uso
   - Fluxogramas

2. **`CORRECOES_UI_IOS.md`**
   - Detalhes das correções de UI
   - Testes recomendados
   - Compatibilidade

3. **`DEBUG_PERMISSIONAMENTO.md`**
   - Como usar ferramentas de debug (referência)
   - Troubleshooting

4. **`BACKEND_API_PERMISSIONAMENTO.md`**
   - Guia completo para backend
   - Endpoints que precisam ser atualizados
   - Exemplos de implementação Ruby/Rails

5. **`CHANGELOG_PERMISSIONAMENTO.md`** (este arquivo)
   - Registro de mudanças

---

## 🔄 Dependências do Backend

### Endpoints Atualizados (Requerido):
- `POST /auth/sign_in` - Incluir campos de permissão na resposta
- `GET /profile` - Incluir campos de permissão na resposta
- `PUT /profile/set_active_account` - Incluir campos de permissão na resposta
- `POST /profile/availability` - Incluir campos de permissão na resposta

### Estrutura Esperada:
```json
{
  "accounts": [
    {
      "id": 1,
      "role": "agent",
      "can_view_all_conversations": false,
      "can_view_unassigned_conversations": false
    }
  ]
}
```

---

## ✅ Testes Realizados

### Permissionamento:
- [x] Usuário administrador vê todos os filtros
- [x] Usuário com ambas permissões `false` vê apenas "Mine"
- [x] Usuário com `can_view_all = false` não vê "All"
- [x] Usuário com `can_view_unassigned = false` não vê "Unassigned"
- [x] Auto-correção funciona ao perder permissão
- [x] Retrocompatibilidade (undefined = true)

### UI iOS:
- [x] Título "Conversations" não quebra linha
- [x] Bottom sheets têm padding adequado
- [x] Funcionamento em diferentes modelos de iPhone

---

## 🚀 Como Testar

### 1. Permissionamento
```sql
-- No backend, configurar usuário de teste
UPDATE account_users 
SET 
  can_view_all_conversations = false,
  can_view_unassigned_conversations = false
WHERE user_id = [ID] AND account_id = [ID];
```

### 2. No App
1. Fazer logout
2. Fazer login com o usuário configurado
3. Ir para tela Conversations
4. Clicar no botão de filtros
5. Verificar que apenas "Mine" aparece

### 3. UI iOS
1. Abrir app no iPhone
2. Verificar título "Conversations"
3. Abrir qualquer bottom sheet (filtros, configurações)
4. Verificar padding inferior adequado

---

## 🔢 Versões

### App Mobile:
- **Versão**: 4.4.2
- **Build Number**: A ser incrementado
- **React Native**: 0.76.9
- **Expo SDK**: 52.0.47

### Backend Requirements:
- Chatwoot backend atualizado com campos de permissão
- API retornando `can_view_all_conversations` e `can_view_unassigned_conversations`

---

## 📋 Checklist Pré-Release

- [x] Código implementado
- [x] Logs de debug removidos
- [x] Componentes de debug removidos
- [x] Linter sem erros
- [x] TypeScript sem erros
- [x] Documentação criada
- [x] Backend atualizado
- [ ] Testes em dispositivo físico iOS
- [ ] Testes em dispositivo físico Android
- [ ] APK gerado
- [ ] Versão testada e aprovada

---

## 🐛 Known Issues

Nenhum conhecido no momento.

---

## 📞 Suporte

Em caso de problemas:
1. Consultar `DEBUG_PERMISSIONAMENTO.md` para troubleshooting
2. Consultar `BACKEND_API_PERMISSIONAMENTO.md` para questões de API
3. Verificar logs do console no Metro Bundler

---

## 🔮 Próximos Passos

Potenciais melhorias futuras:
- [ ] Adicionar permissões granulares para outros filtros (Status, Inbox)
- [ ] UI para administradores gerenciarem permissões
- [ ] Analytics de uso dos filtros
- [ ] Testes automatizados E2E

---

**Desenvolvido em**: 31/10/2025  
**Status**: ✅ Pronto para Build

