# Reavaliação Técnica e de Produto — SkyTrack (v2)

Data: 2026-03-26  
Autor: Codex  
Escopo: nova análise após as últimas features (Stripe, cron, i18n, health endpoint)

## Validação executada

- `npm test` ✅ (15/15)
- `npm run build` ✅
- `npm run lint` ❌
  - `api/health.js`: `process is not defined` (2 ocorrências)

---

## Resumo Executivo

Você evoluiu bem o projeto: backend funcional, monetização inicial, cron e push conectados. O app já passou da fase de protótipo visual.

O que impede uma percepção de produto “pronto para escalar” hoje:
1. Qualidade operacional inconsistente (lint quebrado e docs desatualizadas).
2. Alguns riscos de lógica no backend de preço e monetização.
3. i18n parcial (experiência quebrada para usuário PT-BR).
4. Lacunas de produto para alavancar (ativação, retenção, conversão e medição).

---

## Achados Críticos (P0/P1)

### P0 — Esteira de qualidade quebrada
- Evidência: `npm run lint` falha em `api/health.js` por ambiente Node não mapeado no ESLint.
- Impacto: CI/qualidade perde confiabilidade; regressões simples voltam a entrar.
- Correção prática:
  - Adicionar override no `eslint.config.js` para `api/**/*.js` com `globals.node`.
  - Alternativamente, reescrever `api/health.js` para evitar `process` (menos recomendado).

### P1 — Parsing de data na função `price-check` é frágil
- Evidência: `parseDepartureDate` usa regex `\d{1,2}` em texto livre (`supabase/functions/price-check/index.ts`), podendo capturar “20” de “2026”.
- Impacto: consultas de preço em datas erradas, piorando confiança do core do app.
- Correção prática:
  - Persistir `departure_month` / `return_month` em formato canônico (`YYYY-MM`) e usar isso diretamente na Edge Function.
  - Evitar inferência por string formatada da UI.

### P1 — Métrica de sucesso do cron pode estar incorreta
- Evidência: em `price-check-all`, `Promise.allSettled` conta `fulfilled` como sucesso sem validar `result.error` de `supabase.functions.invoke`.
- Impacto: falsa impressão de execução saudável, dificultando operação.
- Correção prática:
  - Validar `if (r.status === 'fulfilled' && !r.value.error) checked++ else failed++`.
  - Logar `alertId` com falha para troubleshooting.

### P1 — Modelo de tier pode liberar premium indevidamente em falha de perfil
- Evidência: `mapUser` define `tier: 'Premium Member'` por padrão (`src/hooks/useAuth.js`).
- Impacto: em falha de leitura do profile, usuário free pode burlar limites no frontend.
- Correção prática:
  - Default seguro: `tier: 'free'`.
  - Só promover para premium quando `profiles.tier === 'premium'`.

### P1 — README desatualizado com a realidade do projeto
- Evidência: README ainda diz “front-end prototype ready for backend integration” e roadmap antigo.
- Impacto: desalinhamento para investidores, parceiros e novos devs.
- Correção prática:
  - Atualizar README para refletir Auth/Supabase/Stripe/Cron/Push já implementados.
  - Corrigir badge CI com owner/repo reais.

---

## UX (jornada ponta a ponta)

### Pontos de melhoria
- Login, dashboard e create alert ainda têm textos majoritariamente em inglês, apesar de i18n existir.
- Fluxo de upgrade não mostra claramente “o que o premium entrega” no momento de decisão.
- Falta feedback explícito de “última checagem automática” para reforçar confiança no cron.

### Sugestões práticas
- Aplicar i18n primeiro nas telas de maior frequência: `Login`, `Dashboard`, `CreateAlert`, `Alerts`, `Notifications`.
- No paywall/banner, incluir 3 benefícios objetivos com prova:
  - “Alertas ilimitados”
  - “Verificação prioritária”
  - “Notificações mais rápidas”
- Exibir no card do alerta: “Última verificação: há Xh” (usando `last_checked_at`).

---

## UI (consistência e clareza visual)

### Pontos de melhoria
- A interface está forte visualmente, mas há inconsistência de idioma e microcopy entre telas.
- Alguns estados críticos não têm hierarquia máxima (erros operacionais, falhas de checkout, fallbacks).

### Sugestões práticas
- Definir guia de microcopy com 1 idioma-base + regras de tradução.
- Padronizar componentes de feedback (erro/sucesso/loading) com prioridade visual consistente.
- Incluir estados vazios específicos de negócio:
  - “Sem alertas ativos”
  - “Sem resultados para esse filtro”
  - “Sem conexão / tentando sincronizar”

---

## Viabilidade e Negócio

### O que já está bom
- Problema real bem definido (monitoramento de preço de voo).
- Mecanismo de valor central já existe (alerta + push + atualização automática).
- Monetização inicial implementada (free vs premium).

### O que não pode faltar para alavancar
1. Métricas de funil obrigatórias (ativação, retenção, conversão premium).
2. Confiabilidade observável (logs operacionais + erros + taxa de falha por função).
3. Gatilhos de retenção orientados a comportamento (não só push genérico).
4. Clareza de proposta premium no ponto de limite.

### Sugestões práticas
- Implementar eventos mínimos:
  - `signup_completed`, `first_alert_created`, `first_price_drop_seen`, `upgrade_clicked`, `checkout_completed`, `churn_signal`.
- Criar painel semanal com KPIs:
  - ativação D0, retenção D7, conversão free→premium, alertas ativos por usuário.
- Definir SLO interno:
  - `% de execuções do cron sem erro`, `% de push entregues`, tempo médio para detectar drop.

---

## Inovação (como ficar único)

### Oportunidades reais
- “Trust layer” de preço: explicar por que o alerta disparou (fonte, histórico e timing).
- Priorização inteligente de alertas: ranking de oportunidade por rota/perfil.
- Recomendação de alternativa com ganho concreto (ex.: aeroporto/dia alternativo com economia estimada).

### Sugestões práticas
- Adicionar “Deal Score” por alerta (0-100) baseado em:
  - desvio do preço alvo,
  - tendência recente,
  - volatilidade da rota.
- Mostrar “motivo do alerta” no push e na tela de detalhe.
- Criar experimento A/B no banner premium com 2 propostas de valor diferentes.

---

## Novos Questionamentos (próxima rodada)

1. Qual é o KPI norte principal agora: retenção, conversão premium ou número de alertas criados?
2. Você já decidiu o posicionamento do premium (velocidade, volume ou inteligência)?
3. Qual mercado primário de lançamento (Brasil, global em inglês, ou ambos)?
4. Como você vai medir sucesso do cron em produção (logs, alertas, dashboard)?
5. Existe plano de retries/fila para falhas de `price-check` e `send-push`?
6. A limitação free de 5 alertas é fixa ou será testada por segmento/coorte?
7. Você quer priorizar growth loop (convites/indicação) antes de analytics completo?
8. Qual é o fluxo de suporte ao usuário quando checkout falhar ou notificação não chegar?

---

## Prioridade recomendada (ordem de execução)

1. Corrigir P0 de lint/ambiente Node e atualizar README.
2. Endurecer lógica de preço (`parseDepartureDate`) e métrica real de sucesso no cron.
3. Corrigir default de tier e revisar caminhos de fallback de autenticação/perfil.
4. Fechar rollout de i18n nas telas core.
5. Implantar analytics de funil + painel mínimo de operação.

