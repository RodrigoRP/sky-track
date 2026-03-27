# Novos Questionamentos Após Reavaliação (SkyTrack)

Data: 2026-03-26
Contexto: reavaliação após novas features e resposta em `.codex/resposta-avaliacao.md`.

## 1) O que foi validado como avanço real

- `npm run lint` agora passa com sucesso.
- `npm run build` passa com sucesso.
- Notificações interativas evoluíram (read/unread, mark all as read, dismiss por swipe, agrupamento por data, copy code).
- Settings evoluiu com stats e conquistas.

## 2) Novos questionamentos para destravar a próxima fase

1. O hook `useNavDirection` foi reescrito com `setState` durante render. Qual é o racional para não mover isso para um modelo explícito com `useEffect + useRef` ou com estado derivado da navegação (mais previsível em StrictMode e manutenção futura)?

2. Como vamos provar que a nova lógica de direção não regressa em edge cases? Exemplos: rota desconhecida, navegação browser back/forward, troca entre rotas de mesma profundidade, deep-link direto em `/alert/:id`.

3. Em Notifications, os CTAs “View Deal” continuam com `href="#"`. Qual é a ação final esperada de produto (navegar para AlertDetail, abrir parceiro externo, ou deep link) e em que etapa isso entra?

4. A Etapa 25 (Acessibilidade) está aberta, mas o `AppHeader` ainda usa ícone de menu como `span` clicável. Vamos fechar um checklist mínimo de A11y com definição de pronto (DoD) para evitar correções parciais?

5. Em Notifications, `markAsRead` e `dismissNotification` estão funcionais, mas as notificações continuam não persistidas (`partialize` ignora notifications no store). Isso é decisão definitiva (ephemeral por sessão) ou temporária?

6. Qual é a regra de negócio para retenção de notificações: por sessão, por 24h, por 7 dias, ou até ação do usuário? Sem isso, UX e analytics podem conflitar.

7. O README ainda está no template Vite. Qual data-alvo para Etapa 27? Hoje isso bloqueia onboarding técnico e avaliação externa.

8. `Version 4.2.0 • Build 882` em Settings está hardcoded. Vamos automatizar via `package.json`/variável de build para evitar divergência entre versão real e exibida?

9. O app segue mobile frame fixo (`max-width: 430px`). Para Etapa 28, qual abordagem será adotada primeiro: phone-frame decorativo em desktop ou adaptação real de layout (com sidebar/nav lateral)?

10. Qual é o plano de medição antes do backend (Etapa 29)? Sem eventos mínimos ainda nesta fase, fica difícil priorizar o que implementar em backend/auth/push.

11. Em Create Alert, campos como `directOnly`, canais e passageiros continuam fora do modelo salvo. Eles entram no schema antes da API real ou apenas junto da Etapa 31?

12. Qual será o contrato de dados alvo para `Alert` e `Notification` (tipos/campos obrigatórios) antes da integração com Supabase? Vale definir agora para reduzir retrabalho de migração.

## 3) Perguntas estratégicas (produto/negócio)

1. Qual hipótese principal de valor vamos testar primeiro: economia efetiva por usuário, velocidade de descoberta de oportunidade, ou taxa de clique em booking?

2. Qual métrica north-star da próxima fase: `alerts_created/WAU`, `notification_open_rate`, `book_now_ctr` ou `savings_realized`?

3. Qual recorte de mercado inicial (rotas, país, moeda, idioma) para evitar expansão prematura sem PMF?

4. Monetização: vamos validar primeiro `free + premium` com limite de alertas, ou recursos premium de inteligência (forecast/smart alternatives)?

## 4) Recomendação objetiva de sequência (curto prazo)

1. Fechar Etapa 25 (A11y) com DoD clara.
2. Iniciar Etapa 27 (README/documentação pública) imediatamente.
3. Definir contrato de dados (`Alert`/`Notification`) antes da Etapa 31.
4. Instrumentar analytics mínimo antes de backend pesado.
5. Só então iniciar Auth + backend de preços/push.

