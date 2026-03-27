# Avaliação Completa do Projeto SkyTrack

Data da revisão: 2026-03-26
Escopo: revisão ponta a ponta (código, arquitetura, UX, qualidade, operação e produto)

## 1) Diagnóstico executivo

Estado atual do projeto: **bom MVP visual/protótipo interativo**, mas ainda **não pronto para escalar como produto real**.

Nota geral (0-10):
- UX/UI: **8.2**
- Qualidade de front-end: **6.4**
- Arquitetura para produção: **4.8**
- Operação/engenharia (testes, CI, observabilidade): **3.2**
- Prontidão de negócio (retenção/receita/crescimento): **3.8**

Resumo direto:
- Você construiu uma base visual muito forte e agradável.
- O app ainda depende de mock/stub em pontos críticos de negócio (preço real, notificações reais, conta real).
- Há inconsistências técnicas que impedem confiança para crescer rápido (lint quebrado, estado inconsistente entre telas, ausência de testes e telemetria).

---

## 2) Achados críticos (P0)

## P0.1 Lint quebrado e regras desalinhadas com JSX/React atual
Impacto:
- Reduz confiabilidade da base e impede CI saudável.
- Gera ruído e mascara erros reais.

Evidências:
- `npm run lint` retorna 18 erros.
- Hook com mutação de `ref` durante render em [src/hooks/useNavDirection.js](/home/grohlbr/github-project/sky-drop/src/hooks/useNavDirection.js:27).
- Config de lint sem plugin React para uso de JSX vars em [eslint.config.js](/home/grohlbr/github-project/sky-drop/eslint.config.js:1).

## P0.2 Estado de notificações inconsistente (store x tela)
Impacto:
- Ações da store (`markAsRead`, `dismissNotification`) não afetam a UI.
- Usuário percebe comportamento “fake” (interação sem efeito real).

Evidências:
- Tela usa `notifications` importado de mock em [src/pages/Notifications.jsx](/home/grohlbr/github-project/sky-drop/src/pages/Notifications.jsx:5).
- Store já possui ações de notificações em [src/store/useAppStore.js](/home/grohlbr/github-project/sky-drop/src/store/useAppStore.js:118).

## P0.3 Funcionalidades de core business ainda simuladas
Impacto:
- Sem proposta de valor real (não há monitoramento de preços real nem alerta push real).
- Alto risco de churn após primeiro uso.

Evidências:
- “Refresh prices” apenas timeout/toast em [src/pages/Dashboard.jsx](/home/grohlbr/github-project/sky-drop/src/pages/Dashboard.jsx:210).
- Alertas geram histórico sintético e ID por `Date.now()` em [src/store/useAppStore.js](/home/grohlbr/github-project/sky-drop/src/store/useAppStore.js:77).

## P0.4 Ausência de testes automatizados e CI básico
Impacto:
- Cada evolução aumenta risco de regressão.
- Dificulta deploy contínuo com segurança.

Evidências:
- Scripts só têm `dev/build/lint/preview` em [package.json](/home/grohlbr/github-project/sky-drop/package.json:6).

---

## 3) Achados importantes (P1)

## P1.1 Documentação pública do projeto está genérica (template Vite)
Impacto:
- Baixa onboarding para devs, parceiros e até investidor/cliente técnico.

Evidência:
- README ainda padrão template em [README.md](/home/grohlbr/github-project/sky-drop/README.md:1).

## P1.2 Settings com assinatura de store que causa rerender desnecessário
Impacto:
- Performance degradável com crescimento de estado.

Evidência:
- Seleção por objeto inteiro em [src/pages/Settings.jsx](/home/grohlbr/github-project/sky-drop/src/pages/Settings.jsx:101).

## P1.3 Acessibilidade e semântica incompletas
Impacto:
- Piora experiência para leitor de tela e navegação por teclado.

Evidências:
- Ícone de menu clicável em `span` (sem botão/aria) em [src/components/AppHeader.jsx](/home/grohlbr/github-project/sky-drop/src/components/AppHeader.jsx:24).
- Links com `href="#"` em cards de notificação em [src/pages/Notifications.jsx](/home/grohlbr/github-project/sky-drop/src/pages/Notifications.jsx:74).

## P1.4 Localização e moeda inconsistentes
Impacto:
- Produto parece incompleto para expansão internacional.

Evidências:
- Strings hardcoded em inglês em várias telas (ex.: [src/pages/Dashboard.jsx](/home/grohlbr/github-project/sky-drop/src/pages/Dashboard.jsx:238)).
- `settings.language` e `settings.currency` não aplicam i18n/format monetário real.

## P1.5 Responsividade desktop limitada por design rígido no `body`
Impacto:
- Em desktop, app fica “aprisionado” em largura móvel.

Evidência:
- `max-width: 430px` no `body` em [src/index.css](/home/grohlbr/github-project/sky-drop/src/index.css:201).

---

## 4) Achados médios (P2)

- Componentes base (`Button`, `Card`, `Badge`) parecem não utilizados hoje (dívida de design system).
- Versão/build exibidos em Settings parecem hardcoded em [src/pages/Settings.jsx](/home/grohlbr/github-project/sky-drop/src/pages/Settings.jsx:340).
- Campos de criação de alerta não entram no modelo final (`directOnly`, `channels`, passageiros), apesar de existir UI em [src/pages/CreateAlert.jsx](/home/grohlbr/github-project/sky-drop/src/pages/CreateAlert.jsx:394).
- Dependência de imagens remotas para conteúdo principal (impacta offline real e performance em rede fraca).

---

## 5) O que NÃO pode faltar para o app alavancar

Essenciais absolutos (produto + engenharia):

1. Backend real de monitoramento de preços
- Ingestão de dados de voos (API/provedor), normalização e histórico por rota.
- Jobs de atualização por janelas (ex.: 15/30/60 min por prioridade).

2. Engine de alertas reais
- Regras por usuário (target, flexibilidade, aeroporto alternativo, cabine, etc.).
- Disparo assíncrono com idempotência.

3. Sistema de autenticação e conta
- Login social/email, vínculo de alertas ao usuário, sincronização multi-device.

4. Push notifications reais (Web Push)
- Inscrição de device/token, opt-in granular, fila de envio e retry.

5. Analytics de produto (eventos/funil)
- Eventos mínimos: onboarding start/finish, alert created, alert converted, notification open, booking click.
- Sem isso, você não consegue otimizar retenção nem crescimento.

6. Camada de monetização
- Plano free + premium (ex.: mais alertas, prioridade, insights avançados).
- Instrumentar paywall e métricas de conversão.

7. Qualidade de entrega
- Testes (unit + integração + e2e mínimo), CI com bloqueio de merge, e release checklist.

8. Observabilidade
- Error tracking (Sentry), logs estruturados, métricas de latência/erro, uptime monitor.

Sem esses 8 pilares, o app pode ser bonito, mas dificilmente vira negócio sustentável.

---

## 6) Roadmap recomendado (90 dias)

Fase 1 (0-30 dias) — Fundamentos de produção
- Corrigir lint/regras React + hook de navegação.
- Unificar Notifications com store (read/unread/dismiss funcional).
- Reescrever README e documentação de arquitetura.
- Adicionar suíte mínima: Vitest + Testing Library + Playwright smoke.
- CI (lint + test + build) no PR.

Fase 2 (31-60 dias) — Valor real ao usuário
- Backend inicial (auth + alerts + price snapshots).
- Integração com 1 fonte de preço de voo.
- Refresh real e histórico real por alerta.
- Push notification real com consentimento.

Fase 3 (61-90 dias) — Escala e crescimento
- Analytics de funil e coortes.
- Paywall premium e experimento de pricing.
- Segmentação de notificações (urgência/relevância).
- Melhorias de retenção: edição de alertas, busca/sort, recomendações personalizadas.

---

## 7) Prioridade técnica imediata (ordem sugerida)

1. Corrigir lint + qualidade base (P0)
2. Notificações funcionais end-to-end (P0)
3. Backend de alertas/preços (P0)
4. Testes + CI (P0)
5. Analytics (P1)
6. Acessibilidade/i18n (P1)
7. Monetização (P1)

---

## 8) Conclusão objetiva

Você já tem um **front-end acima da média de MVP** em acabamento e fluidez.
O que falta agora é transformar demo em produto: **dados reais, notificações reais, conta real, medição real e disciplina de engenharia**.

Se fizer só uma coisa nas próximas semanas: foque em **P0 + instrumentação de analytics**.
Isso muda o projeto de “bonito” para “operável e escalável”.
