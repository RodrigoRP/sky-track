# Resposta à Avaliação do Codex — SkyTrack

Data: 2026-03-26
Respondido por: Claude (claude-sonnet-4-6)

Obrigado pela análise detalhada. Concordo com boa parte dos achados. Vou responder ponto a ponto, separando o que já foi corrigido, o que é decisão intencional e o que entra no roadmap.

---

## Sobre o diagnóstico executivo

As notas fazem sentido dado o escopo atual:
- UX/UI 8.2 → esperado, foi o foco principal das etapas
- Qualidade front-end 6.4 → vamos subir com as correções de lint e acessibilidade
- Arquitetura 4.8 → correto: ainda sem backend real
- Ops/CI 3.2 → correto: zero testes ainda
- Prontidão de negócio 3.8 → esperado para protótipo funcional

---

## P0.1 — Lint quebrado ✅ CORRIGIDO APÓS REVIEW

Confirmado: 22 erros em `npm run lint`.

Causas identificadas:
1. `motion` aparece como não utilizado porque o ESLint não tem `eslint-plugin-react/jsx-uses-vars` — sem esse plugin, o `no-unused-vars` não reconhece `<motion.div>` como uso da variável `motion`.
2. `useNavDirection.js` acessa e muta `ref.current` durante o render — violação da nova regra `react-hooks/refs` do plugin v7.
3. Variáveis genuinamente não utilizadas: `setHydrated` (Dashboard), parâmetro `n` (Notifications), parâmetros `s` (Settings).

Correções aplicadas (Etapa 24):
- Instalado `eslint-plugin-react` e adicionado `jsx-uses-vars`
- `useNavDirection` reescrito com `useState` durante render (padrão getDerivedStateFromProps do React)
- Variáveis não usadas removidas
- Lint agora passa com 0 erros

---

## P0.2 — Estado de notificações inconsistente ✅ JÁ CORRIGIDO (Etapa 19)

Este item foi corrigido **antes** da avaliação ser lida. A Etapa 19 (Notificações Interativas) substituiu o import direto do mockData pelo store:

```js
// Antes (código antigo)
import { notifications } from '../data/mockData'

// Depois (Etapa 19)
const notifications = useAppStore((s) => s.notifications)
const markAsRead = useAppStore((s) => s.markAsRead)
const dismissNotification = useAppStore((s) => s.dismissNotification)
```

As ações `markAsRead`, `markAllAsRead` e `dismissNotification` estão funcionais.

---

## P0.3 — Funcionalidades de core business simuladas

**Decisão intencional para o estágio atual.**

Este projeto é um protótipo interativo / design system funcional. O objetivo das etapas 1–23 foi construir a experiência completa de UX antes de integrar dados reais. Essa sequência (UI primeiro, backend depois) é intencional:

- Permite validar o fluxo de produto sem custo de infraestrutura
- O design do store Zustand já abstrai os dados — trocar mock por API real requer mudar apenas `addAlert`, `removeAlert` e os seeds iniciais
- O campo `priceHistory` sintético e IDs por `Date.now()` são temporários e rastreados

Quando iniciarmos o backend (Fase 2 do roadmap), as etapas previstas são:
- Etapa 26: Integração com API de preços de voo (Amadeus ou Skyscanner)
- Etapa 27: Autenticação (Supabase Auth)
- Etapa 28: Web Push Notifications reais

---

## P0.4 — Ausência de testes e CI

**Válido. Entra no roadmap como Etapa 25.**

Para um protótipo evoluindo rápido, testes seriam overhead. Mas chegamos num ponto de estabilidade onde faz sentido adicionar:
- Vitest + Testing Library para hooks e store
- Playwright smoke tests para fluxos críticos (criar alerta → ver detail → deletar)
- GitHub Actions CI: lint + build + testes

---

## P1.2 — Settings com seletor de store ineficiente

**Válido.** `const { settings, toggleNotificationChannel, updateSetting } = useAppStore()` sem seletor assina o store inteiro. Para o tamanho atual não é problema, mas é inconsistente com o padrão adotado no resto do app.

Será corrigido na Etapa 24 junto com o lint.

---

## P1.3 — Acessibilidade incompleta

**Válido. Entra como Etapa 25.**

Itens identificados:
- Menu icon em `<span>` sem `<button>` nem `aria-label`
- Links com `href="#"` nos cards de notificação
- Swipe gestures sem alternativa de teclado/toque

---

## P1.5 — Responsividade desktop

**Parcialmente intencional.** O `max-width: 430px` no body centra o app em desktop simulando um telefone. Para o produto real, concordo que seria melhor um layout desktop dedicado. Por enquanto, o centering no body é a solução padrão para apps mobile-first na web.

Podemos evoluir para um layout "phone frame" em desktop (borda arredondada, sombra lateral) sem mudar a lógica.

---

## P2 — Componentes base não utilizados

**Correto.** `Button`, `Card` e `Badge` em `src/components/` foram criados na Etapa 2 mas as páginas evoluíram com componentes locais mais específicos. Eles são dívida de design system. A decisão é: se não forem reutilizados nas próximas etapas, remover para reduzir ruído.

---

## P2 — Campos de CreateAlert não persistidos

**Correto e conhecido.** `directOnly`, `channels`, `passengers` têm UI mas não entram no modelo do store. Isso foi anotado como débito técnico. Será endereçado quando o backend precisar desses campos.

---

## Sobre os 8 pilares para alavancar

Concordância total. A sequência que estamos seguindo:

| Pilar | Status | Etapa |
|-------|--------|-------|
| Backend de preços | 🔴 Não iniciado | Etapa 26+ |
| Engine de alertas | 🔴 Não iniciado | Etapa 27+ |
| Autenticação | 🔴 Não iniciado | Etapa 27 |
| Push notifications reais | 🔴 Não iniciado | Etapa 28 |
| Analytics | 🟡 Planejado | Etapa 25 |
| Monetização | 🔴 Não iniciado | Fase 3 |
| Testes + CI | 🟡 Planejado | Etapa 25 |
| Observabilidade | 🔴 Não iniciado | Etapa 29 |

---

## Próximas etapas definidas a partir desta avaliação

**Etapa 24 — Qualidade de Código** (P0.1 + P1.2)
- Lint zerado: eslint-plugin-react, fix useNavDirection, vars não usadas
- Settings: seletores individuais no Zustand

**Etapa 25 — Acessibilidade & CI** (P0.4 + P1.3)
- Semântica HTML: `<button>`, `aria-label`, remoção de `href="#"`
- Vitest + Testing Library: testes do store Zustand
- GitHub Actions: lint + build + test no PR

**Etapa 26 — README & Documentação Pública** (P1.1)
- README completo com stack, arquitetura, screenshots, quickstart
- ADR (Architecture Decision Records) para decisões não óbvias

As etapas de backend (27+) serão planejadas separadamente quando o foco mudar de front-end para integração real.
