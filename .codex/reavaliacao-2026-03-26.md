# Reavaliação do Projeto SkyTrack

Data: 2026-03-26
Autor: Codex
Escopo: revisão após novas features (Auth/Supabase, Push, CI, testes, desktop)

## Validação executada

- `npm test` ✅ (15/15)
- `npm run lint` ✅
- `npm run build` ✅

## Avanços confirmados

1. Qualidade de engenharia subiu
- CI implementado em `.github/workflows/ci.yml`
- Testes de store + hook adicionados em `src/test/`
- Lint e build estáveis

2. Produto evoluiu funcionalmente
- Login/Auth com Supabase (`src/pages/Login.jsx`, `src/hooks/useAuth.js`)
- Notificações interativas (`src/pages/Notifications.jsx`)
- Push infra e service worker (`src/lib/pushNotifications.js`, `src/sw.js`)

3. UX/UI mais madura
- Responsividade desktop com frame/sidebar (`src/index.css`, `src/components/DesktopSidebar.jsx`)
- Melhorias de acessibilidade pontuais (`aria-label`, `focus-visible`)
- README técnico reescrito (`README.md`)

## Riscos críticos atuais (prioridade alta)

## 1) Persistência backend incompleta no fluxo principal
- Create/Edit/Delete de alertas seguem local-first no store (sem sincronização real em tempo de uso)
- Evidências: `addAlert/removeAlert/updateAlert` no `src/store/useAppStore.js`; UI de criação/edição usa essas actions locais
- Impacto: inconsistência entre dispositivos/sessões e percepção de “backend parcial”

## 2) Contrato de dados inconsistente com schema SQL
- `alerts.user_id` é `NOT NULL` no schema
- `insertAlert` não envia `user_id` explicitamente
- `push_subscriptions` também depende de `user_id`; `upsert` atual não envia campo
- Evidências: `supabase/migrations/001_initial.sql`, `src/lib/alertsApi.js`, `src/lib/pushNotifications.js`
- Impacto: falhas silenciosas/operacionais em ambiente real

## 3) Segurança das Edge Functions precisa endurecimento
- `price-check` e `send-push` aceitam payload (`alertId`, `userId`) sem validação explícita de ownership no handler
- Evidências: `supabase/functions/price-check/index.ts`, `supabase/functions/send-push/index.ts`
- Impacto: risco de abuso/invocação indevida se exposto

## 4) CTAs sem ação real na jornada
- “View Deal” virou botão sem comportamento implementado
- Evidência: `src/pages/Notifications.jsx`
- Impacto: quebra de expectativa e queda de confiança UX

## 5) Identidade de usuário inconsistente
- Header usa avatar/nome mock mesmo em modo autenticado
- Evidência: `src/components/AppHeader.jsx`
- Impacto: sensação de app “não conectado”

## Lacunas de qualidade (média prioridade)

- Cobertura de teste ainda superficial para navegação/auth (hook `useNavDirection` com 1 cenário)
- Analytics de produto em backlog (sem instrumentação para decisões de retenção/conversão)
- Ações locais ainda sem padrão robusto de sync/rollback (offline + backend)

## Recomendações práticas (ordem de execução)

1. Tornar backend a fonte da verdade para alertas
- Implementar create/update/delete via `alertsApi`
- Aplicar optimistic UI com rollback em erro

2. Corrigir contrato de dados com Supabase
- Garantir preenchimento/derivação de `user_id`
- Revisar policies + inserts/upserts de `push_subscriptions`

3. Endurecer funções server-side
- Validar JWT e ownership (`alert.user_id === auth.uid`) antes de processar
- Sanitizar payload de entrada

4. Fechar CTAs e identidade de conta
- Implementar ação real de `View Deal`
- Consumir `storeUser` no Header (com fallback)

5. Expandir observabilidade e testes
- Casos de navegação múltiplos no `useNavDirection`
- Fluxo auth+alerts end-to-end mínimo

## Resumo executivo

O projeto saiu de protótipo visual para uma base quase-produto com boa evolução técnica.
O próximo salto de qualidade depende de fechar o ciclo: **dados consistentes + segurança server-side + jornada sem ações vazias**.

