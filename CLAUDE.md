# SkyTrack — Claude Code Context

App mobile-first de alertas de preço de voos, gerado via Stitch (projeto ID: `5461270666877246753`).

## Stack
- **React + Vite** (pasta raiz `/home/grohlbr/github-project/sky-drop/`)
- **Tailwind CSS v4** via `@tailwindcss/vite`
- **React Router v6** para navegação
- **Zustand** para estado global (`src/store/useAppStore.js`)
- **Recharts** para gráficos (chunk separado no build)

## Estrutura
```
src/
  components/     # AppHeader, BottomNav, Button, Card, Badge
  pages/          # Dashboard, CreateAlert, AlertDetail, Notifications, Settings
  data/           # mockData.js — todos os dados mock do app
  store/          # useAppStore.js — estado global (Zustand)
  index.css       # Design tokens como CSS vars + Tailwind
```

## Design System (Stitch "Intelligent Concierge")
- **Cores via CSS vars** — sempre usar `var(--color-*)`, nunca hardcode
- **Tipografia**: headlines `font-['Manrope']`, body/labels `font-['Inter']`
- **Sem bordas 1px** para separação — usar background shifts ou espaçamento
- **Primary**: `#003178` → `#0d47a1` (gradient em CTAs)
- **Secondary** (savings/queda): `#1b6d24`
- **Tertiary** (urgência/alta): `#5b2500`
- **Surface hierarchy**: `lowest (#fff)` > `low` > `container` > `high` > `highest`
- **Sombras**: `box-shadow: 0 2px 12px rgba(26,27,33,0.06)` — nunca preto puro
- **BottomNav**: glassmorphism `rgba(255,255,255,0.80)` + `backdrop-blur: 16px`

## Rotas
| Path | Página |
|------|--------|
| `/dashboard` | Dashboard (home) |
| `/create-alert` | Formulário de novo alerta |
| `/alert/:id` | Detalhe do alerta + gráfico |
| `/notifications` | Lista de notificações |
| `/settings` | Configurações do usuário |

## Tailwind v4 — Regra Crítica de CSS Cascade Layers

**NUNCA** declare estilos CSS fora de uma layer quando o projeto usa Tailwind v4.

Tailwind v4 coloca todos os utilitários em `@layer utilities`. Estilos **fora de qualquer layer** têm prioridade sobre estilos em layers, independente de especificidade. Isso significa que um simples `* { padding: 0 }` fora de uma layer anula **todos** os utilitários de padding/margin do Tailwind (`pt-28`, `p-5`, `mb-4`, etc.).

**Correto:**
```css
@layer base {
  *, *::before, *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }
  body { ... }
  h1, h2, h3 { ... }
}
```

**Errado (quebra todos os utilitários de espaçamento):**
```css
* { margin: 0; padding: 0; }   /* fora de layer — anula pt-28, p-5, etc. */
```

Sempre use `@layer base { }` para qualquer reset ou estilo global neste projeto.

## Convenções
- Componentes locais de página (ex: `AlertCard`) ficam no próprio arquivo da página
- Só promover para `components/` se usado em 2+ páginas
- Mock data centralizado em `mockData.js` — não duplicar dados inline
- Store Zustand para estado que precisa persistir entre páginas
- Build: `npm run build` — deve passar sem warnings

## Scripts
```bash
npm run dev    # dev server
npm run build  # build de produção
npm run lint   # ESLint
```

## Plano
Ver `PLAN.md` na raiz — todas as 7 etapas concluídas ✅
