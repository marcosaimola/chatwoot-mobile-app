# Backend API - Adicionar Permissionamento de Filtros

## ⚠️ Problema Identificado

Os campos `can_view_all_conversations` e `can_view_unassigned_conversations` aparecem como **`undefined`** no app mobile, indicando que o **backend não está retornando esses campos** na resposta da API.

---

## 📍 Endpoints Que Precisam Ser Atualizados

O app mobile consome os dados do usuário através dos seguintes endpoints:

### 1. **Login** (Endpoint Principal)
- **Método**: `POST`
- **URL**: `/auth/sign_in`
- **Usado quando**: Usuário faz login no app
- **Resposta atual**:
```json
{
  "data": {
    "id": 123,
    "name": "Nome do Usuário",
    "email": "user@example.com",
    "account_id": 1,
    "accounts": [
      {
        "id": 1,
        "name": "Minha Conta",
        "role": "agent",
        "permissions": ["conversation_manage", "agent"]
        // ❌ Faltando: can_view_all_conversations
        // ❌ Faltando: can_view_unassigned_conversations
      }
    ]
  }
}
```

**Resposta esperada**:
```json
{
  "data": {
    "id": 123,
    "name": "Nome do Usuário",
    "email": "user@example.com",
    "account_id": 1,
    "accounts": [
      {
        "id": 1,
        "name": "Minha Conta",
        "role": "agent",
        "permissions": ["conversation_manage", "agent"],
        "can_view_all_conversations": false,        // ✅ Adicionar
        "can_view_unassigned_conversations": false  // ✅ Adicionar
      }
    ]
  }
}
```

---

### 2. **Get Profile** (Atualização de Dados)
- **Método**: `GET`
- **URL**: `/profile`
- **Usado quando**: App precisa atualizar dados do usuário
- **Mesma estrutura de resposta** do endpoint de login acima

---

### 3. **Set Active Account** (Trocar de Conta)
- **Método**: `PUT`
- **URL**: `/profile/set_active_account`
- **Usado quando**: Usuário troca de conta no app
- **Mesma estrutura de resposta** do endpoint de login acima

---

### 4. **Update Availability** (Mudar Status)
- **Método**: `POST`
- **URL**: `/profile/availability`
- **Usado quando**: Usuário muda status (online/offline)
- **Mesma estrutura de resposta** do endpoint de login acima

---

## 🔧 Implementação no Backend (Chatwoot)

### Passo 1: Verificar Tabela `account_users`

Certifique-se que as colunas existem:

```sql
-- Verificar se as colunas existem
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'account_users' 
  AND column_name IN ('can_view_all_conversations', 'can_view_unassigned_conversations');
```

Se não existirem, criar migration:

```ruby
# db/migrate/[timestamp]_add_conversation_permissions_to_account_users.rb
class AddConversationPermissionsToAccountUsers < ActiveRecord::Migration[7.0]
  def change
    add_column :account_users, :can_view_all_conversations, :boolean, default: true, null: false
    add_column :account_users, :can_view_unassigned_conversations, :boolean, default: true, null: false
  end
end
```

Executar:
```bash
rails db:migrate
```

---

### Passo 2: Atualizar Model `AccountUser`

```ruby
# app/models/account_user.rb
class AccountUser < ApplicationRecord
  belongs_to :account
  belongs_to :user
  
  # ... código existente ...
  
  # Adicionar os campos aos atributos permitidos se necessário
  # (dependendo da configuração do strong_parameters)
end
```

---

### Passo 3: Atualizar Serializer

**Identificar o serializer usado** (pode ser um desses):
- `app/serializers/account_user_serializer.rb`
- `app/serializers/user_serializer.rb`
- Ou similar

**Adicionar os campos ao serializer**:

```ruby
# app/serializers/account_user_serializer.rb (ou similar)
class AccountUserSerializer < ActiveModel::Serializer
  attributes :id, 
             :name, 
             :role, 
             :permissions,
             :availability,
             :availability_status,
             :can_view_all_conversations,        # ✅ ADICIONAR
             :can_view_unassigned_conversations  # ✅ ADICIONAR
  
  # ... resto do código ...
end
```

**OU se usar serialização manual:**

```ruby
# Em algum controller ou concern
def account_data
  {
    id: account_user.id,
    name: account.name,
    role: account_user.role,
    permissions: account_user.permissions,
    can_view_all_conversations: account_user.can_view_all_conversations,        # ✅ ADICIONAR
    can_view_unassigned_conversations: account_user.can_view_unassigned_conversations  # ✅ ADICIONAR
  }
end
```

---

### Passo 4: Testar a API

**Fazer uma chamada de teste**:

```bash
# Login
curl -X POST http://localhost:3000/api/v1/auth/sign_in \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "senha123"
  }'
```

**Verificar resposta**:
```json
{
  "data": {
    "accounts": [
      {
        "id": 1,
        "can_view_all_conversations": true,  // ✅ Deve aparecer
        "can_view_unassigned_conversations": true  // ✅ Deve aparecer
      }
    ]
  }
}
```

**Testar GET profile**:
```bash
curl -X GET http://localhost:3000/api/v1/profile \
  -H "Content-Type: application/json" \
  -H "api_access_token: SEU_TOKEN"
```

---

## 🎯 Onde Encontrar os Arquivos no Chatwoot

### Controllers Relacionados:
```
app/controllers/api/v1/accounts/
├── sessions_controller.rb        # Login (/auth/sign_in)
└── profiles_controller.rb        # Profile endpoints

app/controllers/api/v1/
└── profile_controller.rb         # GET /profile
```

### Serializers:
```
app/serializers/
├── account_user_serializer.rb
├── user_serializer.rb
└── api/
    └── v1/
        └── models/
            └── account_serializer.rb
```

### Models:
```
app/models/
├── account_user.rb
├── user.rb
└── account.rb
```

---

## 📝 SQL para Atualizar Dados de Teste

Após implementar, você pode atualizar os dados manualmente para teste:

```sql
-- Desabilitar ambas permissões para um usuário específico
UPDATE account_users 
SET 
  can_view_all_conversations = false,
  can_view_unassigned_conversations = false
WHERE user_id = 123 AND account_id = 1;

-- Verificar
SELECT 
  u.email,
  a.name as account_name,
  au.role,
  au.can_view_all_conversations,
  au.can_view_unassigned_conversations
FROM account_users au
JOIN users u ON u.id = au.user_id
JOIN accounts a ON a.id = au.account_id
WHERE u.email = 'teste@example.com';
```

---

## ✅ Checklist de Implementação

### Backend:
- [ ] Migration criada e executada
- [ ] Colunas existem na tabela `account_users`
- [ ] Serializer atualizado para incluir os campos
- [ ] Endpoint `/auth/sign_in` retorna os campos
- [ ] Endpoint `/profile` retorna os campos
- [ ] Endpoint `/profile/set_active_account` retorna os campos
- [ ] Valores padrão configurados (`true` para retrocompatibilidade)
- [ ] Testes da API passando

### Teste no Mobile:
- [ ] Fazer logout do app mobile
- [ ] Fazer login novamente
- [ ] Abrir botão DEBUG na tela Conversations
- [ ] Verificar que os campos aparecem com valores corretos
- [ ] Testar filtros (devem ocultar "All" e "Unassigned" se `false`)

---

## 🐛 Troubleshooting

### Os campos ainda aparecem como `undefined` depois da implementação

1. **Limpar cache do Rails**:
```bash
rails cache:clear
```

2. **Reiniciar servidor**:
```bash
rails restart
```

3. **Verificar logs do servidor** ao fazer login:
```bash
tail -f log/development.log
```

4. **No app mobile, fazer logout e login novamente** (cache do Redux)

---

### Os campos aparecem mas estão `null` em vez de `true`/`false`

Verificar migration:
```sql
-- Os campos devem ter default e not null
ALTER TABLE account_users 
ALTER COLUMN can_view_all_conversations SET DEFAULT true,
ALTER COLUMN can_view_all_conversations SET NOT NULL,
ALTER COLUMN can_view_unassigned_conversations SET DEFAULT true,
ALTER COLUMN can_view_unassigned_conversations SET NOT NULL;

-- Atualizar registros existentes
UPDATE account_users 
SET 
  can_view_all_conversations = COALESCE(can_view_all_conversations, true),
  can_view_unassigned_conversations = COALESCE(can_view_unassigned_conversations, true)
WHERE can_view_all_conversations IS NULL 
   OR can_view_unassigned_conversations IS NULL;
```

---

## 📊 Exemplo de Resposta Completa Esperada

```json
{
  "data": {
    "id": 123,
    "provider": "email",
    "uid": "user@example.com",
    "name": "João Silva",
    "nickname": null,
    "email": "user@example.com",
    "account_id": 1,
    "pubsub_token": "xyz123",
    "role": "agent",
    "confirmed": true,
    "avatar_url": "https://...",
    "accounts": [
      {
        "id": 1,
        "name": "Empresa XYZ",
        "active_at": 1698765432,
        "role": "agent",
        "permissions": [
          "conversation_manage",
          "contact_manage",
          "report_manage"
        ],
        "availability": "online",
        "availability_status": "online",
        "auto_offline": true,
        "custom_role": null,
        
        // ✅ NOVOS CAMPOS NECESSÁRIOS
        "can_view_all_conversations": false,
        "can_view_unassigned_conversations": false
      }
    ],
    "available_name": "João Silva",
    "type": "user"
  },
  "mfa_required": false
}
```

---

## 🔗 Referências

- **Tabela**: `account_users`
- **Endpoint Login**: `POST /api/v1/auth/sign_in`
- **Endpoint Profile**: `GET /api/v1/profile`
- **Código Mobile**: `src/store/auth/authService.ts`
- **Debug Mobile**: Botão DEBUG na tela Conversations

---

**Data**: 31/10/2025
**Status**: Aguardando implementação no backend



