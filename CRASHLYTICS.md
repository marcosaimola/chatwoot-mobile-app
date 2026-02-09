# Firebase Crashlytics - Documentação

## Visão Geral

O Firebase Crashlytics foi implementado no app para fornecer relatórios de erros e crashes em tempo real. Esta implementação substitui o Sentry que estava temporariamente desabilitado devido a crashes no TestFlight.

## Configuração

### Pacotes Instalados

```json
{
  "@react-native-firebase/app": "^21.7.1",
  "@react-native-firebase/messaging": "^21.7.1",
  "@react-native-firebase/crashlytics": "^21.7.1"
}
```

### Arquivos de Configuração

- **iOS**: `GoogleService-Info.plist` (raiz do projeto)
- **Android**: `google-services.json` (raiz do projeto)

### Configuração do Expo

O plugin do Crashlytics foi adicionado ao `app.config.ts`:

```typescript
plugins: [
  '@react-native-firebase/app',
  '@react-native-firebase/messaging',
  '@react-native-firebase/crashlytics',
  // ... outros plugins
]
```

## Arquitetura

### CrashlyticsService

Um serviço singleton centralizado foi criado em `src/services/CrashlyticsService.ts` para gerenciar todas as interações com o Crashlytics.

**Principais métodos:**

```typescript
// Inicializar o serviço (chamado automaticamente no App.tsx)
await crashlyticsService.initialize();

// Definir ID do usuário
crashlyticsService.setUserId(userId);

// Definir atributos personalizados
crashlyticsService.setAttribute('chave', 'valor');
crashlyticsService.setAttributes({
  account_id: '123',
  role: 'agent',
});

// Registrar mensagens de log
crashlyticsService.log('Usuário realizou ação X');

// Registrar erros não-fatais
crashlyticsService.recordError(error, 'contexto opcional');

// Testar crash (APENAS PARA TESTES)
crashlyticsService.testCrash();
```

### Inicialização

O Crashlytics é inicializado automaticamente no `App.tsx`:

- **Em produção**: Inicializado silenciosamente
- **Em desenvolvimento**: Inicializado com logs no console

## Como Usar

### 1. Rastreamento de Usuários

Sempre que um usuário fizer login, defina o ID dele:

```typescript
import crashlyticsService from '@/services/CrashlyticsService';

// Após login bem-sucedido
crashlyticsService.setUserId(user.id.toString());
crashlyticsService.setAttributes({
  account_id: user.account_id.toString(),
  email: user.email,
  role: user.role,
});
```

### 2. Registrar Erros Não-Fatais

Para erros que não travam o app, mas devem ser monitorados:

```typescript
try {
  // Código que pode falhar
  await apiCall();
} catch (error) {
  // Registrar no Crashlytics
  crashlyticsService.recordError(
    error,
    'Falha ao carregar conversas'
  );
  
  // Mostrar mensagem ao usuário
  showToast({ message: 'Erro ao carregar dados' });
}
```

### 3. Adicionar Contexto aos Crashes

Use logs e atributos para adicionar contexto:

```typescript
crashlyticsService.log('Usuário tentou enviar mensagem');
crashlyticsService.setAttribute('conversation_id', conversationId);

try {
  await sendMessage(message);
} catch (error) {
  crashlyticsService.recordError(error, 'Falha ao enviar mensagem');
}
```

## Testando a Implementação

### Via Tela de Configurações

1. Abra o app
2. Vá para **Configurações** (Settings)
3. Faça um **long press** na versão do app (no final da tela)
4. No modal de Debug Actions que aparecer, você verá:
   - **🔥 Testar Erro Não-Fatal (Crashlytics)**: Registra um erro de teste
   - **💥 Testar Crash Fatal (Crashlytics)**: Força um crash do app

### Via Código

Para testar durante o desenvolvimento:

```typescript
import crashlyticsService from '@/services/CrashlyticsService';

// Teste de erro não-fatal
crashlyticsService.recordError(
  new Error('Teste de erro'),
  'Contexto do teste'
);

// Teste de crash fatal (app vai crashar!)
crashlyticsService.testCrash();
```

### Verificando no Firebase

1. Acesse o [Console do Firebase](https://console.firebase.google.com/)
2. Selecione seu projeto
3. Vá para **Crashlytics** no menu lateral
4. Os relatórios aparecem em alguns minutos (crashes fatais aparecem após reiniciar o app)

## Boas Práticas

### ✅ Faça

- **Defina o User ID** após login
- **Adicione contexto** com atributos e logs antes de ações importantes
- **Registre erros não-fatais** que podem impactar a experiência do usuário
- **Use mensagens descritivas** nos logs
- **Adicione informações de contexto** (IDs, estados, etc.)

### ❌ Não Faça

- **Não registre informações sensíveis** (senhas, tokens, dados pessoais completos)
- **Não use em excesso** - logs demais podem dificultar a análise
- **Não registre erros triviais** que não afetam a experiência do usuário
- **Não use `testCrash()` em produção** - apenas para testes

## Integração com o App

### Onde o Crashlytics já está integrado:

1. **App.tsx**: Inicialização automática
2. **DebugActions**: Testes de erro e crash
3. **CrashlyticsService**: Serviço centralizado

### Onde você deve integrar:

1. **authActions.ts**: Definir user ID após login
2. **conversationActions.ts**: Registrar erros em ações de conversação
3. **contactActions.ts**: Registrar erros em ações de contatos
4. **messageActions.ts**: Registrar erros ao enviar/receber mensagens
5. **Qualquer try-catch crítico**: Registrar erros não-fatais

## Exemplo de Integração Completa

```typescript
import crashlyticsService from '@/services/CrashlyticsService';

// Em um action async (authActions.ts)
export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await apiService.post('/login', credentials);
      
      // Sucesso - definir user ID
      crashlyticsService.setUserId(response.data.user.id.toString());
      crashlyticsService.setAttributes({
        account_id: response.data.user.account_id.toString(),
        email: response.data.user.email,
      });
      
      return response.data;
    } catch (error) {
      // Erro - registrar no Crashlytics
      crashlyticsService.log('Falha no login');
      crashlyticsService.recordError(
        error,
        `Login failed for ${credentials.email}`
      );
      
      return rejectWithValue(error.message);
    }
  }
);
```

## Troubleshooting

### Crashlytics não está enviando relatórios

1. **Verifique se está inicializado**:
   ```typescript
   console.log('Crashlytics enabled:', crashlyticsService.getIsEnabled());
   ```

2. **Verifique os arquivos de configuração**:
   - `GoogleService-Info.plist` (iOS)
   - `google-services.json` (Android)

3. **Regenere os projetos nativos**:
   ```bash
   npx expo prebuild --clean
   ```

4. **Verifique o console do Firebase**:
   - Crashlytics pode levar alguns minutos para processar relatórios
   - Crashes fatais só são enviados quando o app é reiniciado

### Erro ao compilar

Se houver erros de compilação após adicionar o Crashlytics:

```bash
# Limpar cache
npm run clean

# Reinstalar dependências
npm install

# Regenerar projetos nativos
npm run generate
```

## Recursos Adicionais

- [Documentação oficial do Crashlytics](https://firebase.google.com/docs/crashlytics)
- [React Native Firebase - Crashlytics](https://rnfirebase.io/crashlytics/usage)
- [Console do Firebase](https://console.firebase.google.com/)

## Notas Importantes

- **Sentry foi desabilitado**: O Crashlytics substitui o Sentry que estava causando crashes no TestFlight
- **Desenvolvimento**: O Crashlytics funciona em desenvolvimento, mas é mais útil em produção
- **Relatórios em tempo real**: Erros não-fatais aparecem em minutos, crashes fatais aparecem após reiniciar o app
- **Privacy**: Não registre informações sensíveis ou dados pessoais identificáveis
