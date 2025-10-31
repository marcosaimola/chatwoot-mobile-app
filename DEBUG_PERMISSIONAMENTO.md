# Debug - Permissionamento de Filtros

## Como Usar o Debug

### 1. Acessar a Tela de Debug

Na tela de **Conversations**, você verá um botão vermelho no canto superior direito escrito "DEBUG".

1. Clique no botão **DEBUG**
2. Uma tela modal aparecerá com todas as informações do usuário

### 2. Informações Exibidas

A tela de debug mostra:

#### ✅ Active Account ID
- ID da conta ativa no momento

#### ✅ Current Account Role  
- Role do usuário na conta ativa (administrator, agent, etc)

#### ✅ can_view_all_conversations
- **Verde**: `true` - Usuário pode ver filtro "All"
- **Vermelho**: `false` - Usuário NÃO pode ver filtro "All"  
- **Amarelo**: `undefined` - Campo não existe (usa default = true)

#### ✅ can_view_unassigned_conversations
- **Verde**: `true` - Usuário pode ver filtro "Unassigned"
- **Vermelho**: `false` - Usuário NÃO pode ver filtro "Unassigned"
- **Amarelo**: `undefined` - Campo não existe (usa default = true)

#### ✅ Permissions
- Lista de permissões do usuário

#### ✅ All Accounts
- Lista todas as contas do usuário
- Conta ativa aparece destacada em azul
- Mostra os valores de `can_view_all` e `can_view_unassigned` para cada conta

#### ✅ Raw User Object
- JSON completo do objeto do usuário
- Útil para copiar e enviar para debug

### 3. Logs no Console

Além da tela visual, o sistema também registra logs detalhados no console quando você abre o filtro "Assignee Type".

Para ver os logs:

**Metro Bundler (Terminal):**
```
=== DEBUG ASSIGNEE FILTERS ===
User: {...}
Active Account ID: 1
Current Account: {...}
User Permissions: [...]
can_view_all_conversations: false
can_view_unassigned_conversations: false
Is Admin: false
canViewAll: false
canViewUnassigned: false
Filtering out "all" filter
Filtering out "unassigned" filter
Final assigneeTypes: ["me"]
==============================
```

**React Native Debugger / Flipper:**
- Os mesmos logs aparecerão na aba Console

## O Que Verificar

### Cenário 1: Filtros Não Estão Sendo Ocultados

Se os filtros "All" e "Unassigned" continuam aparecendo mesmo com as permissões em `false`:

#### Verificar no Debug:

1. **Active Account ID** está correto?
   - Deve corresponder à conta que você editou no backend

2. **Current Account Role** é "administrator"?
   - ⚠️ Se for `administrator`, os filtros SEMPRE aparecem (comportamento esperado)
   - Para testar, use um usuário com role `agent`

3. **can_view_all_conversations** e **can_view_unassigned_conversations** mostram os valores corretos?
   - Se mostrar `undefined` (amarelo), os campos não estão vindo da API
   - Se mostrar `true` (verde), o backend não está retornando `false`
   - Se mostrar `false` (vermelho), está correto

4. **Nos logs do console**, verificar:
   ```
   Is Admin: false  // Deve ser false para aplicar filtros
   canViewAll: false  // Valores esperados
   canViewUnassigned: false
   Filtering out "all" filter  // Deve aparecer
   Filtering out "unassigned" filter  // Deve aparecer
   Final assigneeTypes: ["me"]  // Deve ter apenas "me"
   ```

### Cenário 2: Campos Aparecem como `undefined`

Isso significa que o **backend não está retornando os campos**.

#### Verificar no Backend:

1. A API de login/profile está incluindo os campos na resposta?

```json
{
  "accounts": [
    {
      "id": 1,
      "name": "Conta Teste",
      "role": "agent",
      "can_view_all_conversations": false,        // ← Deve estar presente
      "can_view_unassigned_conversations": false  // ← Deve estar presente
    }
  ]
}
```

2. Os campos estão na tabela `account_users`?

```sql
SELECT 
  id,
  account_id,
  user_id,
  role,
  can_view_all_conversations,
  can_view_unassigned_conversations
FROM account_users
WHERE user_id = [ID_DO_USUARIO];
```

3. O serializer está incluindo os campos?

**Ruby (Chatwoot):**
```ruby
# app/serializers/account_user_serializer.rb
class AccountUserSerializer < ActiveModel::Serializer
  attributes :id, :name, :role, :permissions,
             :can_view_all_conversations,
             :can_view_unassigned_conversations
end
```

### Cenário 3: Valores Incorretos

Se os campos aparecem mas com valores errados:

1. **Verificar no banco de dados**:
```sql
UPDATE account_users 
SET can_view_all_conversations = false,
    can_view_unassigned_conversations = false
WHERE user_id = [ID] AND account_id = [ID];
```

2. **Fazer logout e login novamente** para forçar atualização dos dados

3. **Verificar cache**: O app pode estar usando dados em cache do Redux

## Estrutura Esperada do Objeto User

```typescript
{
  "id": 123,
  "name": "Nome do Usuário",
  "email": "user@example.com",
  "account_id": 1,  // Conta ativa
  "accounts": [
    {
      "id": 1,
      "name": "Minha Conta",
      "role": "agent",  // Não "administrator" para testar filtros
      "permissions": ["conversation_manage", "agent"],
      "can_view_all_conversations": false,  // ← Campo necessário
      "can_view_unassigned_conversations": false  // ← Campo necessário
    }
  ]
}
```

## Comportamento Esperado por Configuração

| Role | can_view_all | can_view_unassigned | Filtros Exibidos |
|------|--------------|---------------------|------------------|
| administrator | (qualquer) | (qualquer) | Mine, Unassigned, All |
| agent | true | true | Mine, Unassigned, All |
| agent | false | true | Mine, Unassigned |
| agent | true | false | Mine, All |
| agent | false | false | Mine |
| agent | undefined | undefined | Mine, Unassigned, All (default) |

## Remover o Debug

Quando terminar o debug, remover o componente da tela:

**Arquivo**: `src/screens/conversations/ConversationScreen.tsx`

Remover a linha:
```typescript
<UserDebugInfo />  // ← Remover esta linha
```

E remover do import:
```typescript
import { ActionTabs, BottomSheetBackdrop, BottomSheetWrapper } from '@/components-next';
// Remover UserDebugInfo do import
```

Também remover os console.logs do arquivo:
**`src/screens/conversations/components/conversation-filters/AssigneeTypeFilters.tsx`**

Remover todo o bloco de logs (linhas 69-114).

## Testes Passo a Passo

### Teste 1: Usuário Administrador
1. Fazer login com usuário admin
2. Abrir tela Conversations
3. Clicar em filtros
4. **Resultado esperado**: Deve ver Mine, Unassigned, All (sempre)

### Teste 2: Usuário Não-Admin com Ambas Permissões
1. No banco: `UPDATE account_users SET can_view_all_conversations = true, can_view_unassigned_conversations = true WHERE user_id = X`
2. Fazer logout e login
3. Abrir DEBUG
4. Verificar: ambos campos devem estar `true` (verde)
5. Abrir filtros
6. **Resultado esperado**: Deve ver Mine, Unassigned, All

### Teste 3: Usuário Não-Admin Sem can_view_all
1. No banco: `UPDATE account_users SET can_view_all_conversations = false, can_view_unassigned_conversations = true WHERE user_id = X`
2. Fazer logout e login
3. Abrir DEBUG
4. Verificar: `can_view_all` deve estar `false` (vermelho)
5. Abrir filtros
6. **Resultado esperado**: Deve ver apenas Mine, Unassigned

### Teste 4: Usuário Não-Admin Sem can_view_unassigned
1. No banco: `UPDATE account_users SET can_view_all_conversations = true, can_view_unassigned_conversations = false WHERE user_id = X`
2. Fazer logout e login
3. Abrir DEBUG
4. Verificar: `can_view_unassigned` deve estar `false` (vermelho)
5. Abrir filtros
6. **Resultado esperado**: Deve ver apenas Mine, All

### Teste 5: Usuário Não-Admin Sem Nenhuma Permissão Extra
1. No banco: `UPDATE account_users SET can_view_all_conversations = false, can_view_unassigned_conversations = false WHERE user_id = X`
2. Fazer logout e login
3. Abrir DEBUG
4. Verificar: ambos campos devem estar `false` (vermelho)
5. Abrir filtros
6. **Resultado esperado**: Deve ver apenas Mine

## Contato para Suporte

Se após verificar todos os itens acima o problema persistir, enviar:

1. Screenshot da tela de DEBUG
2. Cópia do log do console (seção `=== DEBUG ASSIGNEE FILTERS ===`)
3. Query SQL mostrando o registro do `account_users`
4. Screenshot dos filtros sendo exibidos incorretamente

---

**Data**: 31/10/2025

