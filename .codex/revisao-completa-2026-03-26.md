# Revisão Completa do Código — SkyTrack

Data: 2026-03-26  
Autor: Codex  
Escopo: revisão pós novas features

## Validação executada

- `npm test` ✅ (35 testes)
- `npm run lint` ✅
- `npm run build` ✅

---

## Findings (prioridade por severidade)

## P0 — Loop de escrita potencial no Realtime (risco operacional/custo)
- Evidência:
  - `useAuth` recebe evento realtime e chama `updateAlert(updated.id, updated)` em [useAuth.js](/home/grohlbr/github-project/sky-drop/src/hooks/useAuth.js:45).
  - `updateAlert` no store faz update remoto quando `isSupabaseEnabled` em [useAppStore.js](/home/grohlbr/github-project/sky-drop/src/store/useAppStore.js:248).
- Problema:
  - Um UPDATE vindo do banco pode disparar outro UPDATE no banco, reemitindo novo evento e gerando ciclo de escrita desnecessária.
- Impacto:
  - Aumento de writes, ruído no realtime, potencial loop e custo operacional.
- Recomendação:
  - Separar claramente “update local-only” de “update local+remote”.
  - No callback do realtime, aplicar apenas no estado local (sem chamada de API).

## P1 — Inconsistência no shape de `priceHistory` entre backend e UI
- Evidência:
  - Backend salva histórico com chave `date` em [price-check/index.ts](/home/grohlbr/github-project/sky-drop/supabase/functions/price-check/index.ts:209).
  - Gráfico do AlertDetail espera chave `day` em [AlertDetail.jsx](/home/grohlbr/github-project/sky-drop/src/pages/AlertDetail.jsx:297) e [AlertDetail.jsx](/home/grohlbr/github-project/sky-drop/src/pages/AlertDetail.jsx:328).
- Problema:
  - Dados reais e dados mock usam formatos diferentes.
- Impacto:
  - Eixo X / referência “Low” podem quebrar ou ficar vazios em alertas atualizados pelo backend.
- Recomendação:
  - Padronizar contrato (`day` ou `date`) em todo app.
  - Fazer normalização única em `rowToAlert` ou no retorno da Edge Function.

## P1 — Limpeza de subscription inválida não acontece no push
- Evidência:
  - Tratamento de 410 apenas seta `emailFallback`, sem remover endpoint expirado em [send-push/index.ts](/home/grohlbr/github-project/sky-drop/supabase/functions/send-push/index.ts:77).
- Problema:
  - Endpoints inválidos continuam sendo tentados indefinidamente.
- Impacto:
  - Falhas repetidas, degradação de entrega, custo/ruído (inclusive fallback email frequente).
- Recomendação:
  - Remover/invalidar subscription no banco quando `statusCode === 410`.
  - Registrar métrica de taxa de falha por endpoint.

## P2 — Cobertura de eventos Stripe ainda estreita para ciclo de assinatura real
- Evidência:
  - Webhook trata apenas `checkout.session.completed` e `customer.subscription.deleted` em [stripe-webhook/index.ts](/home/grohlbr/github-project/sky-drop/supabase/functions/stripe-webhook/index.ts:53).
- Problema:
  - Mudanças comuns de lifecycle (ex.: atualização de status da assinatura) podem não refletir no `tier`.
- Impacto:
  - Estado premium/free pode ficar inconsistente em cenários reais de cobrança.
- Recomendação:
  - Cobrir ao menos `customer.subscription.updated` e mapear status suportados.
  - Persistir dados mínimos de assinatura (status, current_period_end) para reconciliação.

## P2 — i18n avançou, mas jornada ainda parcial
- Evidência:
  - Login ainda hardcoded em inglês em [Login.jsx](/home/grohlbr/github-project/sky-drop/src/pages/Login.jsx:106).
  - Settings ainda com bastante microcopy hardcoded em [Settings.jsx](/home/grohlbr/github-project/sky-drop/src/pages/Settings.jsx:158).
  - Formatação de mês fixa em inglês em [CreateAlert.jsx](/home/grohlbr/github-project/sky-drop/src/pages/CreateAlert.jsx:188).
- Impacto:
  - Experiência inconsistente para PT-BR e perda de percepção de produto “polido”.
- Recomendação:
  - Finalizar i18n nas telas de entrada e monetização primeiro (`Login`, `Settings`, textos de upgrade/toasts).
  - Usar locale dinâmico para datas.

## P3 — Documentação pública ainda com placeholder de repositório
- Evidência:
  - Badge e clone URL usam `your-username` em [README.md](/home/grohlbr/github-project/sky-drop/README.md:9).
- Impacto:
  - Perde credibilidade externa e atrapalha onboarding técnico.
- Recomendação:
  - Corrigir links reais do repositório/CI.

---

## Pontos fortes desta rodada

- Correções importantes foram aplicadas com sucesso:
  - lint voltou a passar (override Node em `api/**`),
  - hardening do `price-check-all`,
  - default de tier em `useAuth` para `free`,
  - testes de race condition adicionados (`store.race.test.js`).
- Sinal claro de maturidade: base com testes, CI e funções de backend já integradas.

---

## O que não pode faltar para o app alavancar

1. Confiabilidade operacional observável:
- métricas de execução do cron,
- taxa de sucesso push,
- taxa de erro por edge function.

2. Loop de monetização bem fechado:
- estado de assinatura 100% consistente com Stripe,
- paywall com proposta de valor clara no limite free.

3. Qualidade de dados do core:
- histórico de preço com contrato único,
- realtime sem escrita em eco.

4. Métricas de produto mínimas:
- `signup_completed`, `first_alert_created`, `price_drop_seen`, `upgrade_clicked`, `checkout_completed`.

---

## Perguntas para próxima rodada

1. Você quer que eu priorize primeiro o fix do loop realtime (P0) e já deixar com teste cobrindo regressão?
2. Vamos padronizar o histórico como `date` ou `day` em toda a stack?
3. No Stripe, qual regra de negócio final para downgrade (imediato vs fim do período)?
4. Você já quer que eu faça rollout de i18n em `Login` + `Settings` na próxima etapa?

