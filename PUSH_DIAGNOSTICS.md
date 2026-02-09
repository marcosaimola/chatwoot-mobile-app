# Diagnóstico: Push não chega — App ou Backend?

Use este guia para descobrir se o problema está no **app** (Firebase/APNs no dispositivo) ou no **backend** (Chatwoot + Firebase do servidor).

---

## ✅ Diagnóstico confirmado: problema no backend

Se o **teste enviado pelo Firebase Console chegou** no seu aparelho, então:

- **App e Firebase/APNs estão OK.** O dispositivo recebe push quando o FCM envia.
- **O problema está no Chatwoot (backend):** o servidor não está enviando as notificações para o FCM, ou está usando credenciais/configuração errada.

**Próximo passo:** conferir no servidor Chatwoot as configurações de Firebase (super_admin) e os logs quando uma notificação deveria ser enviada. Ver checklist "Lado do backend" abaixo.

---

## Teste rápido no app (recomendado)

1. No app: **Configurações** → toque longo no número da **versão** para abrir as ações de debug.
2. Toque em **"🔔 Diagnóstico Push (App vs Backend)"**.
3. O **token FCM** é copiado e aparecem as instruções.
4. No **Firebase Console** do projeto do app:
   - **Engage** → **Messaging** → **Create your first campaign** (ou **New campaign**).
   - Tipo: **Firebase Notification messages**.
   - Em **Target**, escolha **Send to single device** e cole o **FCM registration token** (o que foi copiado).
   - Preencha título e texto e envie.

**Resultado:**

| O que aconteceu | Onde está o problema |
|-----------------|------------------------|
| A notificação **chegou** no dispositivo | **Backend (Chatwoot)**. O app e o Firebase/APNs estão ok. Verifique configuração do Chatwoot e credenciais Firebase no servidor. |
| A notificação **não chegou** | **App ou Firebase/APNs**. Ver checklist “Se o teste do Firebase não chegar” abaixo. |

---

## Checklist: lado do app (quando o teste do Firebase também não chega)

### iOS

- [ ] **Capabilities no Xcode**: Push Notifications e Background Modes → Remote notifications.
- [ ] **APNs no Firebase**: No Firebase Console → Project Settings → Cloud Messaging → **Apple app configuration**: upload da **APNs Authentication Key** (.p8) ou do certificado. Sem isso, o FCM não entrega no iOS.
- [ ] **Ambiente APNs**: Build de **debug** (Xcode) usa `development`; build de **release** (TestFlight/App Store) usa `production`. O entitlement no projeto está como `aps-environment: production`; em dev local pode ser necessário `development` no Xcode para o mesmo provisioning profile.
- [ ] **GoogleService-Info.plist**: presente no projeto e com o mesmo Bundle ID do app.

### Android

- [ ] **google-services.json**: presente e com o mesmo `applicationId`.
- [ ] **Permissão**: usuário aceitou notificações (Android 13+).

### App (ambas as plataformas)

- [ ] **Token registrado**: nos logs aparece `[FCM DEBUG] Push subscription saved successfully!` e o token não é vazio.
- [ ] **Permissão**: `[FCM DEBUG] Permission status: 1` (1 = autorizado).

Se tudo isso estiver certo e o **teste enviado pelo Firebase Console** ainda não chegar, o problema é no app ou na configuração do projeto Firebase/APNs.

---

## Checklist: lado do backend (quando o teste do Firebase chega, mas o Chatwoot não envia)

Ou seja: notificação de teste do Firebase → **chega**; notificações do Chatwoot → **não chegam**.

### Chatwoot (super admin)

- [ ] **Firebase no Chatwoot**: em `https://<<sua_url>>/super_admin/app_config` estão preenchidos:
  - **Firebase Project ID**: mesmo do projeto onde você fez o teste (onde está o app).
  - **Firebase Credentials**: JSON da **Service Account** (Firebase Console → Project Settings → Service accounts → Generate new private key). Esse JSON deve ter permissão para FCM (Firebase Cloud Messaging).
- [ ] **Variável** `ENABLE_PUSH_RELAY_SERVER`: para app customizado, o Chatwoot deve usar **seu** Firebase. Com Firebase preenchido no super_admin, o envio deve ir pelo seu projeto; se estiver `true` e não houver credenciais, o Chatwoot pode tentar outro caminho e não enviar para o seu app.
- [ ] **Logs do Chatwoot**: ao receber uma nova mensagem/conversa que deveria gerar push, verificar logs do Rails (Sidekiq, workers de notificação). Erros ao chamar FCM (401, 403, 404, timeout) costumam aparecer aí.

### Firebase (projeto usado pelo Chatwoot)

- [ ] **Mesmo projeto**: as credenciais no Chatwoot são do **mesmo** projeto Firebase em que o app está registrado (mesmo `GoogleService-Info.plist` / `google-services.json`).
- [ ] **FCM**: API de Cloud Messaging habilitada; a service account usada no Chatwoot deve ter papel que permite enviar mensagens (ex.: Firebase Cloud Messaging Admin ou Editor).

---

## Resumo

1. **Teste pelo app**: use **"🔔 Diagnóstico Push"** e envie uma notificação de teste pelo **Firebase Console** para o token copiado.
2. **Se chegar** → problema no **backend** (Chatwoot + credenciais Firebase no servidor).
3. **Se não chegar** → problema no **app** ou na **config do Firebase/APNs** (iOS); use os checklists acima.

Logs úteis no Xcode: `[FCM DEBUG]` (token, permission, save subscription). Se aparecer `Push subscription saved successfully!` e o backend estiver correto, o próximo passo é sempre o teste direto pelo Firebase Console com o mesmo token.
