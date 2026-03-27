# Resposta à Reavaliação — 2026-03-26

Data de correção: 2026-03-26
Autor: Claude (Sonnet 4.6)
Validação pós-fix: `npm test` ✅ (15/15) · `npm run lint` ✅ · `npm run build` ✅

---

## Itens corrigidos

### ✅ Risco #2 — Contrato de dados inconsistente com schema SQL

**Problema:** `insertAlert` e `migrateLocalAlerts` em `alertsApi.js` não enviavam `user_id`,
causando falha silenciosa com RLS ativo (`alerts.user_id NOT NULL`).
`push_subscriptions` fazia upsert sem o campo, ignorando o `onConflict`.

**Correção:**
- `alertsApi.js → insertAlert`: agora chama `supabase.auth.getUser()` e injeta `user_id` explicitamente
- `alertsApi.js → migrateLocalAlerts`: idem — todos os rows recebem `user_id`
- `pushNotifications.js → subscribeToPush`: upsert agora inclui `user_id: user.id`

---

### ✅ Risco #5 — Identidade de usuário inconsistente no Header

**Problema:** `AppHeader.jsx` importava `user` de `mockData` mesmo quando havia um usuário
autenticado, exibindo sempre o avatar/nome do mock.

**Correção:**
- `AppHeader.jsx` agora lê `useAppStore((s) => s.user)` com fallback para `mockUser`
- Avatar real do OAuth é exibido quando disponível
- Quando `user.avatar` é `null` (login por email), exibe inicial do nome como fallback

---

### ✅ Risco #4 — CTAs "View Deal" sem comportamento

**Problema:** Os botões "View Deal" em `PriceDropCard`, `TargetReachedCard` e `FlashSaleCard`
não tinham `onClick`, gerando expectativa quebrada.

**Correção:**
- `Notifications.jsx` recebe `useNavigate` e define `handleViewDeal(n)`
- Navegação para `/alert/${n.alertId}` se a notificação tiver `alertId`; fallback para `/alerts`
- Marca a notificação como lida antes de navegar
- `e.stopPropagation()` garante que o clique não dispara o `onRead` do card ao mesmo tempo
- Prop `onViewDeal` passada para todos os três card components

---

### ✅ Risco #1 — Persistência backend incompleta no fluxo principal

**Problema:** `addAlert`, `removeAlert`, `updateAlert` e `toggleAlertStatus` operavam
exclusivamente no store local, sem sincronização com o Supabase.

**Correção em `useAppStore.js`:**
- Adicionado parâmetro `get` ao store (necessário para ler estado pós-`set`)
- Importados `insertAlertApi`, `updateAlertApi`, `deleteAlertApi` de `alertsApi.js`
- **`addAlert`**: optimistic insert local → sync em background → substitui id temporário pelo
  id do servidor; rollback (remove o alerta local) em caso de erro
- **`removeAlert`**: remove local imediatamente + `deleteAlertApi` em background
- **`toggleAlertStatus`**: atualiza local + `updateAlertApi({ status })` em background via `get()`
- **`updateAlert`**: atualiza local + `updateAlertApi(changes)` em background
- Todos os calls Supabase guardados por `if (isSupabaseEnabled)` — prototype mode mantido

---

### ✅ Risco #3 — Edge Functions sem validação de ownership

**Problema:** `price-check` e `send-push` aceitavam `alertId`/`userId` sem verificar
se o requisitante era dono do recurso.

**Correção:**
- `price-check/index.ts`: cria `userClient` com o JWT do header `Authorization`, extrai `callerId`,
  rejeita com 403 se `alert.user_id !== callerId` (somente quando chamado por usuário; chamadas
  function-to-function sem JWT passam livremente)
- `send-push/index.ts`: mesma lógica — valida que `user.id === userId` do payload antes de enviar

---

## Lacunas reconhecidas (não corrigidas neste ciclo)

- **Cobertura de testes superficial**: `useNavDirection` ainda com 1 cenário; sem testes de auth/integração
- **Analytics em backlog**: ainda sem instrumentação — mantido como Etapa 29 no PLAN.md
- **Offline + rollback robusto**: strategy atual é fire-and-forget; sem retry ou fila de sync offline

## Status geral

O ciclo fechou os principais riscos operacionais e de segurança identificados.
O produto está em condição de ser testado com usuários reais no Supabase configurado.
