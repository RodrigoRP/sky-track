# SkyTrack — Developer Notes

Referência técnica de comportamentos não óbvios do projeto.

---

## Onboarding

### Ver o onboarding novamente (dev/teste)

O onboarding aparece **apenas uma vez** por usuário. Após concluir ou pressionar "Skip", o campo `onboardingDone: true` é salvo no `localStorage` via Zustand persist.

Para forçar a exibição novamente:

**Opção 1 — DevTools (mais rápido)**
1. Abra o Chrome DevTools (`F12`)
2. Aba **Application** → **Local Storage** → `http://localhost:5173`
3. Clique com o botão direito em `skytrack-store` → **Delete**
4. Recarregue a página (`F5`)

**Opção 2 — Console**
```js
localStorage.removeItem('skytrack-store')
location.reload()
```

**Opção 3 — Só pular o onboarding sem apagar dados**
```js
const store = JSON.parse(localStorage.getItem('skytrack-store'))
store.state.settings.onboardingDone = false
localStorage.setItem('skytrack-store', JSON.stringify(store))
location.reload()
```

### Por que usuários existentes não veem o onboarding?

A migração `v4` do store Zustand detecta que já existe estado persistido (versão anterior) e automaticamente define `onboardingDone: true`. Apenas usuários com `localStorage` vazio (primeira visita) passam pelo onboarding.

---

## Zustand — Regra de Seletores (React 18)

### Problema: tela branca sem erro visível

Em Zustand v5 + React 18, seletores que retornam **novos objetos** a cada chamada quebram o `useSyncExternalStore`:

```js
// ❌ ERRADO — novo objeto a cada render → React detecta "snapshot instável" → tela branca
const { alerts, removeAlert } = useAppStore((s) => ({
  alerts: s.alerts,
  removeAlert: s.removeAlert,
}))

// ✅ CORRETO — seletores separados, referências estáveis
const alerts = useAppStore((s) => s.alerts)
const removeAlert = useAppStore((s) => s.removeAlert)
```

**Regra:** nunca retorne `{ a, b }` em um seletor Zustand. Selecione cada valor individualmente.

---

## Tailwind v4 — CSS Cascade Layers

### Problema: utilitários de espaçamento ignorados (`pt-28`, `p-5`, etc.)

Tailwind v4 coloca todos os utilitários em `@layer utilities`. Estilos **fora de qualquer layer** têm prioridade sobre eles, independente de especificidade.

```css
/* ❌ ERRADO — anula TODOS os pt-*, p-*, m-* do Tailwind */
* { margin: 0; padding: 0; }

/* ✅ CORRETO */
@layer base {
  *, *::before, *::after { margin: 0; padding: 0; }
}
```

Sempre use `@layer base { }` para resets globais neste projeto.

---

## Framer Motion v12 — AnimatePresence

### Problema: tela branca ao usar `AnimatePresence` envolvendo `<Routes>`

Em framer-motion v12, `AnimatePresence mode="wait"` envolvendo o componente `<Routes>` do React Router v6 causa crash silencioso.

```jsx
// ❌ QUEBRA a aplicação inteira
<AnimatePresence mode="wait">
  <Routes key={location.pathname}>...</Routes>
</AnimatePresence>

// ✅ Solução: PageTransition por página (entrance-only, sem exit)
// Ver src/components/PageTransition.jsx
```

`AnimatePresence` pode ser usado normalmente dentro de componentes menores (ex: Toaster, modais).

---

## Store — Versionamento e Migrações

O store Zustand usa versionamento para upgrades de schema:

| Versão | Mudança |
|--------|---------|
| v1 | Campos de detalhe adicionados aos alertas (`priceHistory`, `image`, etc.) |
| v2 | Campo `theme` adicionado às settings |
| v3 | Campo `status` (`active`/`paused`) adicionado aos alertas |
| v4 | Campo `onboardingDone` adicionado às settings |

Para adicionar uma nova migração, incremente `STORE_VERSION` em `src/store/useAppStore.js` e adicione um bloco `if (version < N)` na função `migrate()`.

---

## Dark Mode

### Forçar tema para teste

```js
// Forçar dark (ignora preferência do sistema)
document.documentElement.dataset.theme = 'dark'

// Forçar light
document.documentElement.dataset.theme = 'light'

// Voltar ao sistema
delete document.documentElement.dataset.theme
```

O toggle permanente fica em **Settings → Appearance** (System / Light / Dark).
