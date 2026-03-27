# SkyTrack — Plano de Codificação

App de alertas de preço de voos. Stack: **React + Vite + Tailwind CSS** (PWA mobile-first), React Router, Zustand, Recharts.

---

## Etapa 1 — Setup & Design Tokens ✅
- [x] Inicializar projeto com Vite + React + Tailwind
- [x] Configurar tokens do design system (cores, tipografia Manrope/Inter, espaçamentos, bordas)
- [x] Configurar React Router com as 5 rotas
- [x] Criar mock data (alertas, deals, notificações)

## Etapa 2 — Componentes Base ✅
- [x] `BottomNav` — barra de navegação flutuante (glassmorphism)
- [x] `AppHeader` — header com logo, título e avatar
- [x] `Button` — primário (gradient), secundário, ghost
- [x] `Card` — container com sombra tonal
- [x] `Badge` — price drop, target reached, urgency

## Etapa 3 — Tela Dashboard ✅
- [x] Hero section "Monitor Smart." com contagem de savings
- [x] Cards de alertas ativos (NYC→LON, SFO→TYO)
- [x] Seção "Best Deals Today" com cards de destino
- [x] FAB "Create New Alert"

## Etapa 4 — Tela Create Alert ✅
- [x] Inputs origem/destino com swap
- [x] Seletor de datas (Fixed/Flexible)
- [x] Slider de preço alvo
- [x] Seletor de passageiros
- [x] Toggles de preferências (direct flights only)
- [x] Checkboxes de canais de notificação (Push, WhatsApp, Email)
- [x] Botão "Start Monitoring"

## Etapa 5 — Tela Alert Detail ✅
- [x] Display de preço atual com indicador de tendência
- [x] Painel de histórico de preços (sparkline chart — 30 dias)
- [x] Seção "Smart Alternatives" (aeroporto alternativo, data alternativa)
- [x] Card de destino com "Book Now"

## Etapa 6 — Tela Notifications ✅
- [x] Cards de notificação: Price Drop, Target Reached, Flash Sale
- [x] Timestamps, badges, botões "View Deal"
- [x] Estado de "End of updates"

## Etapa 7 — Tela Settings ✅
- [x] Card de perfil do usuário (Premium Member)
- [x] Toggles de canais de notificação
- [x] Selects de moeda e idioma
- [x] Toggle Real-time / Daily Summary
- [x] Preferências de viagem expansíveis
- [x] Botão Sign Out

---

## Etapa 8 — Conectar Store & Navegação Dinâmica ✅
> Fazer o app funcionar de verdade: dados fluem pelo store, telas se comunicam.

- [x] Dashboard lê alertas do store Zustand (não do mockData diretamente)
- [x] AlertDetail dinâmico: busca alerta por `:id` via `useParams` → fallback ao primeiro alerta se não achar
- [x] Após criar alerta no CreateAlert, redireciona para o detail do alerta criado
- [x] Dashboard: alertas criados pelo usuário aparecem imediatamente na lista
- [x] activeAlerts no mockData enriquecidos com campos de detalhe (priceHistory, image, alternatives)
- [x] addAlert gera priceHistory sintética e campos completos para novos alertas
- [x] Smart Alternatives oculta quando lista está vazia (alertas novos)

## Etapa 9 — Persistência Local ✅
> Dados sobrevivem ao refresh.

- [x] `zustand/middleware` persist com `localStorage` (já incluído no Zustand v5)
- [x] Alertas e settings persistem entre sessões (notifications excluídas — são efêmeras)
- [x] Versionamento de schema (`STORE_VERSION = 1`) com função `migrate()` para upgrades
- [x] Fallback gracioso quando localStorage indisponível (modo privado, storage cheio)

## Etapa 10 — Interatividade dos Formulários ✅
> Formulários respondendo de verdade.

- [x] CreateAlert: autocomplete de aeroporto (60 aeroportos, busca por código IATA ou nome da cidade)
- [x] CreateAlert: date pickers reais com `<input type="month">` — modo Fixed mostra 2 campos, Flexible mostra banner informativo
- [x] CreateAlert: validação completa (campos vazios, origin = destination, data retorno < ida)
- [x] Settings: `BottomSheet` reutilizável — sheets para moeda, idioma e cabine preferida
- [x] Settings: confirmação de "Sign Out" com bottom sheet (cancel + confirm)
- [x] AlertDetail: botão "Book Now" abre Google Flights com a rota correta (`target="_blank"`)

## Etapa 11 — Animações de Página ✅
> Experiência nativa mobile com transições suaves.

- [x] Instalar `framer-motion` v12
- [x] `PageTransition` component com slide direcional (forward=right, back=left) + easing nativo
- [x] `useNavDirection` hook detecta profundidade da rota e define direção automaticamente
- [x] `AnimatePresence mode="wait"` no App.jsx para transições limpas entre rotas
- [x] Stagger de cards no Dashboard (hero, alertas e deals entram em cascata)
- [x] Stagger de cards no Notifications (header + cada card com delay)
- [x] Stagger no AlertDetail (hero price, chart, alternatives, image)
- [x] Fade-up no hero do CreateAlert
- [x] Variantes reutilizáveis em `useAnimVariants.js` (listVariants, cardVariants, fadeUpVariants)

## Etapa 12 — PWA (Progressive Web App) ✅
> Instalável, funciona offline, ícones na home screen.

- [x] `vite-plugin-pwa` v1.2 configurado no vite.config.js
- [x] `manifest.webmanifest`: nome completo + short_name, theme `#003178`, background `#faf8ff`, `display: standalone`, `start_url: /dashboard`
- [x] 3 ícones SVG com identidade SkyTrack: 192px, 512px, maskable (safe zone 80%)
- [x] Service Worker Workbox (generateSW): precache de 18 assets (803 KB), runtime cache para Google Fonts + Unsplash
- [x] `InstallPrompt` component: bottom sheet com spring animation, lista de benefícios, aparece 3s após carregar, 1x por sessão (sessionStorage)
- [x] Meta tags iOS: `apple-mobile-web-app-capable`, `apple-touch-icon`, `viewport-fit=cover`
- [x] `registerSW` no main.jsx para auto-update silencioso

## Etapa 13 — Dark Mode ✅
> Tema escuro completo via CSS vars.

- [x] Definir paleta dark em `@media (prefers-color-scheme: dark)` no index.css
- [x] Toggle manual em Settings (salvo no store + localStorage) — seletor 3 opções: System / Light / Dark
- [x] Glassmorphism do Header e BottomNav via `--color-glass` var (adapta ao tema)
- [x] Migração v2 do store: campo `theme` adicionado a settings existentes
- [x] `useEffect` em App.jsx aplica `data-theme` no `<html>` ao mudar tema

## Etapa 14 — Deploy (Vercel) ✅
> App online com URL pública e auto-deploy.

- [x] `vercel.json` com SPA rewrites (já criado)
- [x] Deploy via `vercel --prod` — https://sky-drop-woad.vercel.app/dashboard
- [ ] Domínio customizado opcional via Vercel dashboard
- [ ] Variáveis de ambiente configuradas no painel Vercel

## Etapa 15 — Gerenciamento de Alertas ✅
> Usuário controla o ciclo de vida dos alertas: pausar, editar e deletar.

- [x] Swipe-to-delete nos AlertCards do Dashboard (arrastar para esquerda revela botão Delete vermelho)
- [x] Botão "Delete Alert" na tela AlertDetail (com bottom sheet de confirmação)
- [x] Toggle Ativo/Pausado por alerta — badge "Paused" + opacidade reduzida no card
- [x] Tela "All Alerts" (`/alerts`) — lista com filtro tabs: All / Active / Paused + swipe-to-delete
- [x] Botão "View All" no Dashboard navega para `/alerts`
- [x] BottomNav: "Activity" → `/alerts` com ícone `radar`; "Alerts" → `/notifications`
- [x] `toggleAlertStatus` action no store + migração v3 (adiciona `status: 'active'` a alertas existentes)

## Etapa 16 — Feedback Visual & Micro-interações ✅
> Sensação de app nativo: respostas imediatas a cada ação.

- [x] Toast notifications (`useToast` hook + `Toaster` componente com AnimatePresence) — success/error/default
- [x] Toasts em: criar alerta, deletar alerta (Dashboard + AlertDetail + Alerts), pausar/resumir, refresh
- [x] Skeleton loaders (`AlertCardSkeleton`) para AlertCards
- [x] Empty state animado no Dashboard quando não há alertas (ícone + texto + fade-up)
- [x] Botão "Refresh prices" (ícone `sync` girando) no Dashboard com toast de confirmação

## Etapa 17 — Onboarding ✅
> Primeira experiência guiada para novos usuários.

- [x] Splash screen animada: logo + wordmark + tagline + loading dots pulsantes (2s)
- [x] 3 slides swipeable (drag + botão Next): Track / Notify / Save — com ícone, título, subtítulo e stat pill
- [x] Skip button sempre visível no topo direito
- [x] Progress dots clicáveis na base de cada slide
- [x] Botão muda para "Get Started" no último slide
- [x] `setOnboardingDone` persiste no store + localStorage — onboarding nunca repete
- [x] Migração v4: usuários existentes recebem `onboardingDone: true` automaticamente

## Etapa 18 — Gráfico Interativo & Price Analytics ✅
> AlertDetail com análise de preço mais rica.

- [x] Tooltip com data + preço (design invertido, legível)
- [x] `ReferenceDot` marcando o ponto mais baixo do histórico com label "Low"
- [x] Badge "Best Price Ever" no hero quando `currentPrice ≤ lowPrice`
- [x] Card "AI Forecast" com regressão linear dos últimos 5 pontos → trending_down / trending_up / trending_flat
- [x] Barra "Potential Savings" no Dashboard quando há alertas abaixo do preço alvo

---

## Etapa 19 — Notificações Interativas ✅
> A tela de notificações é estática — transformar em funcional.

- [x] Estado de lido/não-lido por notificação (ponto azul, fundo destacado)
- [x] Botão "Mark all as read" no header
- [x] Swipe-to-dismiss individual (mesmo padrão do swipe-delete dos alertas)
- [x] Badge de contagem não lidas no ícone do BottomNav
- [x] Agrupamento por data: "Today", "Yesterday", "This Week"
- [x] Botão "Copy Code" em notificações do tipo `flash_sale` (copia promo code para clipboard)

## Etapa 20 — Editar Alertas ✅
> Usuário pode ajustar o target price e as datas de um alerta existente.

- [x] Botão "Edit" na tela AlertDetail (seção de ações — 3 botões: Edit, Pause, Delete)
- [x] Bottom sheet de edição: slider de target price + seletor de datas
- [x] `updateAlert` action no store
- [x] Toast "Alert updated" ao salvar
- [x] Validação: target price > 0, datas válidas

## Etapa 21 — Search & Sort nos Alertas ✅
> Quanto mais alertas o usuário tem, mais necessária a busca.

- [x] Barra de busca no topo da tela `/alerts` (filtra por origem, destino ou rota "NYC → LON")
- [x] Dropdown de ordenação: Lowest Price / Biggest Drop / Newest First (bottom sheet)
- [x] Estado vazio específico para busca sem resultados ("No alerts matching…")
- [x] Persistir sort preference no store (`settings.sortAlerts`)

## Etapa 22 — Stats & Conquistas ✅
> Engajamento via métricas pessoais e gamificação leve.

- [x] Card de stats no Settings: total de alertas, total de savings, alertas ativos
- [x] 4 badges desbloqueáveis: First Alert, Monitoring Pro (5+), First Saving, Big Saver ($500+)
- [x] Badges no card de perfil com spring animation ao desbloquear
- [x] Dados calculados do store (sem backend)

## Etapa 23 — APIs Nativas & Share ✅
> Integrações com recursos do dispositivo para experiência mobile completa.

- [x] Botão "Share Deal" no header do AlertDetail usa Web Share API (`navigator.share`)
- [x] Fallback: copia URL para clipboard se share não disponível
- [x] Haptic feedback (`navigator.vibrate`) nos CTAs: "Book Now", "Create Alert", "Edit", delete confirmado
- [x] "Copy Code" nas notificações Flash Sale copia o promo code + haptic + toast
- [ ] Badge dinâmico no `manifest.webmanifest` com contagem de alertas ativos *(complexidade PWA — deixado para versão futura)*

## Etapa 24 — Qualidade de Código ✅
> Corrigir lint, seletores do Zustand e bugs de render detectados em code review.

- [x] `eslint-plugin-react` instalado — `jsx-uses-vars` resolve falsos positivos do `motion`
- [x] `useNavDirection` reescrito com `useState` durante render — remove mutação de ref no render
- [x] Variáveis não usadas removidas: `setHydrated` (Dashboard), `n` (Notifications), `s` (Settings badges)
- [x] Settings: seletores individuais do Zustand (P1.2 do code review)
- [x] `npm run lint` passa com 0 erros

---

## Etapa 25 — Acessibilidade ✅
> Semântica HTML correta e navegação inclusiva. Achados P1.3 do code review.

- [x] `AppHeader`: ícone de menu em `<span>` → `<button aria-label="Menu">`
- [x] `BottomNav`: `<NavLink>` com `aria-label` para leitores de tela
- [x] Notificações: links `href="#"` nos cards → `<button aria-label="View deal">`
- [x] `AlertDetail`: botão Share com `aria-label="Share this deal"`
- [x] `CreateAlert`: swap button com `aria-label`; inputs de data com `id` + `htmlFor`
- [x] Cores de foco visíveis para navegação por teclado (`focus-visible` ring em `index.css`)

## Etapa 26 — Testes Automatizados & CI ✅
> Confiança para evoluir sem regressões. Achado P0.4 do code review.

- [x] Instalados: Vitest + @testing-library/react + @testing-library/dom + jsdom
- [x] `src/test/store.test.js` — 14 testes: `addAlert`, `removeAlert`, `toggleAlertStatus`, `updateAlert`, `updateSetting`, todas as actions de notificação
- [x] `src/test/useNavDirection.test.jsx` — direção inicial = 0
- [x] `npm test` passa com 15 testes ✅
- [x] GitHub Actions `.github/workflows/ci.yml`: lint + test + build em push/PR no main

## Etapa 27 — README & Documentação Pública ✅
> Onboarding de devs, parceiros e avaliadores técnicos. Achado P1.1 do code review.

- [x] README reescrito: descrição do produto, features, stack, quickstart
- [x] Seção de arquitetura: estrutura de pastas, store Zustand, regra de seletores
- [x] Tabela de rotas e design tokens
- [x] Instruções de deploy (Vercel)
- [x] Seção de roadmap apontando para `PLAN.md` e `DEVNOTES.md`
- [x] Badge de CI no topo do README

## Etapa 28 — Desktop & Responsividade ✅
> App utilizável em telas grandes sem perder a identidade mobile-first. Achado P1.5 do code review.

- [x] Layout centrado em desktop: "phone frame" com sombra lateral e borda arredondada
- [x] `max-width: 430px` mantido, mas com fundo decorativo atrás do frame (gradiente ou blur)
- [x] BottomNav se adapta: em telas largas, pode virar sidebar left nav (≥ 768px)
- [x] Tipografia escala com `clamp()` para não quebrar em telas muito pequenas (< 360px)
- [x] Testar em 3 breakpoints: 360px (mínimo), 430px (padrão), 1280px (desktop)

## Etapa 29 — Analytics de Produto 🗂️ BACKLOG
> Medir o que importa para tomar decisões. Adiado — adiciona complexidade desnecessária na fase inicial.

- [ ] Integrar Posthog (self-hosted ou cloud) — plano free, privacy-first, sem cookie banner
- [ ] Evento `onboarding_completed` com número de slides vistos
- [ ] Evento `alert_created` com `{ origin, destination, targetPrice }`
- [ ] Evento `alert_deleted` e `alert_paused`
- [ ] Evento `booking_clicked` (Book Now) com `{ alertId, currentPrice }`
- [ ] Evento `notification_opened` e `promo_code_copied`
- [ ] Dashboard básico no Posthog: funil criação→booking, retenção D1/D7

## Etapa 30 — Backend: Autenticação ✅
> Conta real para o usuário. Pré-requisito para sincronização e notificações reais.

- [x] Supabase Auth: login com Google + email/senha
- [x] Tela de login/signup substituindo o perfil mockado em Settings
- [x] Após login, alertas do localStorage migram para o backend (merge)
- [x] JWT nas requests; refresh automático (via Supabase client)
- [x] Settings: foto de perfil e nome reais do OAuth
- [x] Logout real: limpa store + redireciona para login
- [x] Graceful degradation: sem env vars, app funciona como protótipo local

## Etapa 31 — Backend: Alertas & Preços Reais ✅
> Monitoramento real — o core de valor do produto.

- [x] Supabase Database: tabelas `alerts`, `price_snapshots`, `profiles`, `push_subscriptions` (`supabase/migrations/001_initial.sql`)
- [x] Integração com API de preços (Amadeus Flight Offers sandbox)
- [x] Edge Function `price-check`: fetch preço → snapshot → atualiza alerta → dispara push
- [x] `priceHistory` real substituindo o histórico sintético do mock
- [x] Botão "Refresh prices" em AlertDetail (visível apenas com Supabase ativo)
- [x] Migração do store: dados locais → Supabase ao fazer primeiro login

## Etapa 32 — Push Notifications Reais ✅
> O produto só tem valor se o usuário é avisado sem abrir o app.

- [x] Web Push API: solicitação de permissão no onboarding (slide 4, aparece se suportado)
- [x] Service Worker customizado (`src/sw.js`, modo `injectManifest`) com handler `push` + `notificationclick`
- [x] Backend: Edge Function `send-push` (web-push + VAPID) disparada pelo `price-check`
- [x] Opt-in granular: toggle Push em Settings chama `subscribeToPush()`/`unsubscribeFromPush()`
- [x] Fallback: e-mail via Resend quando push não disponível (iOS Safari < 16.4)
- [x] Throttle: máx 1 push/alerta a cada 4h (tabela `push_sent_log`)

---

## Etapa 33 — Cron de Preços Automático ✅
> Sem isso o produto não funciona de forma autônoma — o usuário depende de abrir o app para ver preços atualizados.

- [x] Habilitar `pg_cron` no Supabase (Dashboard → Database → Extensions)
- [x] SQL: `cron.schedule('price-check-all', '0 */6 * * *', ...)` a cada 6h — conservador para quota free do Amadeus
- [x] Edge Function `price-check-all`: busca todos alertas ativos → invoca `price-check` em lotes de 5 com delay de 2s entre lotes
- [x] Logs de execução: coluna `last_checked_at` em `alerts` (`supabase/migrations/002_cron.sql`)
- [x] Pausa automática: alertas sem login há 30 dias são pausados (`auto_pause_inactive_alerts` function + cron diário às 3h UTC)

## Etapa 34 — Autocomplete de Aeroportos ✅
> O campo de origem/destino aceita qualquer texto hoje — sem sugestões, o usuário precisa saber o código IATA de cor.

- [x] Componente `AirportInput` em `CreateAlert.jsx`: busca local com dropdown de sugestões (cidade + código IATA)
- [x] Dataset estático com 150 aeroportos dos mais movimentados do mundo — cobertura completa do Brasil (30 aeroportos) + principais hubs internacionais
- [x] Bandeira do país exibida ao lado de cada resultado via emoji (função `getFlag`)
- [x] Busca por código IATA, nome da cidade ou código de país
- [ ] Amadeus Airport Search API — mantido para quando o Amadeus estiver configurado

## Etapa 35 — Sincronização em Tempo Real ✅
> Quando o cron atualiza um preço, o usuário vê a mudança instantaneamente — sem precisar dar refresh.

- [x] Supabase Realtime: `supabase.channel('alerts-{userId}').on('postgres_changes', ...)` em `useAuth.js`
- [x] Quando `alerts` mudar no banco → `updateAlert` + `setRecentlyUpdated` no store automaticamente
- [x] Indicador visual: anel verde no card + animação de escala no preço por 3s (`recentlyUpdatedId` no store)
- [x] Toast in-app quando queda de preço detectada enquanto o app está aberto (5s de duração)
- [x] Realtime só processa quando `document.visibilityState === 'visible'`
- [x] Profile name/avatar agora lidos de `profiles` table (sobrescreve metadata OAuth)

## Etapa 36 — Gestão de Conta ✅
> Usuário precisa de controle sobre seus dados — também necessário para GDPR/LGPD.

- [x] Settings: editar nome (bottom sheet com input → salvo em `profiles.name` via Supabase)
- [x] Alterar senha para usuários email/senha: `supabase.auth.updateUser({ password })` (oculto para OAuth)
- [x] Exportar dados: JSON com todos os alertas + info do usuário, download via Blob
- [x] Deletar conta: `supabase.rpc('delete_user')` → cascata deleta todos os dados → logout
- [x] Migration `003_account.sql`: função `delete_user()` + storage bucket `avatars`
- [ ] Upload de avatar: bucket criado, aguarda implementação do UI de upload

## Etapa 37 — Hardening de Produção ✅
> Preparar o app para usuários reais — erros silenciosos e ausência de limites são problemas em produção.

- [x] `ErrorBoundary` global em `App.jsx` — fallback UI amigável com detalhes em dev mode
- [x] Limite de alertas: Free = 5, verificado no store (`addAlert` retorna `null`) + trigger SQL na RLS
- [x] Toast informativo em `CreateAlert` quando limite atingido
- [x] Health check em `api/health.js` (Vercel serverless) — retorna status + versão + timestamp
- [ ] Sentry: stub preparado no `ErrorBoundary` — requer `npm install @sentry/react` + DSN

## Etapa 38 — Monetização (Stripe) ✅
> Modelo freemium: Free (5 alertas) → Premium (ilimitado + alertas prioritários + WhatsApp).

- [x] Migration `004_stripe.sql`: coluna `tier` + `stripe_customer_id` em `profiles` + trigger SQL de limite
- [x] Edge Function `create-checkout-session`: cria/reutiliza customer Stripe + sessão de checkout
- [x] Edge Function `stripe-webhook`: valida assinatura + atualiza tier em `checkout.session.completed` e `subscription.deleted`
- [x] `useAuth.js`: lê `tier` do profiles e inclui no user do store
- [x] Settings: banner de upgrade quando `tier = free && alerts >= 5` + badge "Premium" quando ativo
- [x] Secrets necessários: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_ID`, `APP_URL`

## Etapa 39 — Internacionalização (i18n) ✅
> App bilíngue EN/PT. Duas línguas apenas — sem proliferação de traduções não mantidas.

- [x] `react-i18next` + `i18next` instalados e configurados em `src/i18n.js`
- [x] `src/locales/en.json` e `src/locales/pt.json` — cobertura completa: nav, settings, dashboard, alerts, notifications, createAlert
- [x] `src/main.jsx` importa `i18n` antes do App
- [x] LANGUAGES reduzido para `['English', 'Português']` em Settings
- [x] Troca de idioma em Settings chama `i18n.changeLanguage()` + salva no store
- [x] `BottomNav` usa `useTranslation` — labels trocam imediatamente ao mudar idioma
- [x] Aplicar `useTranslation` em Dashboard, Notifications e Alerts — todas as strings visíveis traduzidas
- [x] Aplicar `useTranslation` em CreateAlert e AlertDetail — progressivo (→ Etapa 45)

## Etapa 40 — Qualidade: UX de Notificações ✅
> Fechar o gap entre notificação gerada e destino de navegação. Sem `alertId`, o "View Deal" cai em `/alerts` — experiência fraca.

- [x] Garantir que `send-push` inclua `alertId` no payload de todas as notificações geradas (→ Etapa 50)
- [x] Garantir que notificações in-app (store) criadas pelo Realtime também incluam `alertId` (→ Etapa 50)
- [x] Destino único de `View Deal`: navega para `/alert/:id` quando `alertId` disponível (fallback `/alerts`)
- [x] Mock data: `alertId: 1` em PriceDrop e `alertId: 2` em TargetReached (FlashSale sem alerta específico)

## Etapa 41 — Qualidade: Cobertura de Testes Críticos ✅
> Testes que previnem regressões nos fluxos de maior risco — sync e navegação.

- [x] Teste de corrida: `addAlert` + `removeAlert` antes do ack remoto — sem alerta fantasma (`store.race.test.js`)
- [x] Rollback de `addAlert` quando `insertAlert` rejeita
- [x] `updateAlert`/`toggleAlertStatus` em alerta com ID temporário — changes refletidas localmente
- [x] Testes de `useNavDirection`: initial, deep link, forward (0→1, 0→2), back (2→0, 1→0), same depth
- [ ] Teste de integração: fluxo auth → migrate → fetch alerts do Supabase (com mock do cliente)

## Etapa 42 — Qualidade: Reconciliação de IDs ✅
> Eliminar a corrida entre ID temporário local e ID real do servidor em operações rápidas.

- [x] `pendingIds: { [tempId]: true }` — rastreia alertas aguardando confirmação do servidor
- [x] `idMap: { [tempId]: serverId }` — resolve tempId → serverId após confirmação
- [x] `opQueue: []` — acumula operações (update/toggle/delete) feitas enquanto alert está pending
- [x] `removeAlert`/`updateAlert`/`toggleAlertStatus` verificam `pendingIds` — enfileiram se pending, resolvem via `idMap` se já confirmado
- [x] Ao confirmar: processa fila, dispara API calls com serverId correto, limpa estado transitório
- [x] 16 novos testes em `store.race.test.js` cobrindo todos os cenários

---

## Bloco A — Hardening Backend (Edge Functions) 🗂️ PRÓXIMO

> Confiabilidade do core em produção. Requer acesso ao código em `supabase/functions/`.

## Etapa 43 — price-check: parsing de data robusto ✅
> Regex `\d{1,2}` em texto livre pode capturar "20" de "2026" e consultar datas erradas.

- [x] Persistir `departure_month` / `return_month` em formato canônico `YYYY-MM` nos alertas
- [x] `price-check` Edge Function usa `departure_month` diretamente em vez de inferir da string da UI
- [x] Remover `parseDepartureDate` ou restringir para fallback apenas

## Etapa 44 — price-check-all: métrica de sucesso real ✅
> `Promise.allSettled` conta `fulfilled` como sucesso mesmo quando `supabase.functions.invoke` retorna `error`.

- [x] Validar `r.status === 'fulfilled' && !r.value.error` para contar como sucesso
- [x] Logar `alertId` com falha para facilitar troubleshooting
- [x] Retornar `{ checked, failed, alertsFailed: [] }` na resposta da função

---

## Bloco B — i18n Completo ✅

> Fechar rollout de tradução nas telas de maior frequência.

## Etapa 45 — i18n: CreateAlert e AlertDetail ✅
- [x] Aplicar `useTranslation` em `CreateAlert.jsx` — form labels, placeholders, botões, validações
- [x] Aplicar `useTranslation` em `AlertDetail.jsx` — preços, seções, botões de ação

---

## Bloco C — Produto ⬜

## Etapa 46 — "Última verificação" no card do alerta ✅
> Reforça confiança do usuário no cron sem precisar abrir o detalhe.

- [x] Exibir `last_checked_at` formatado ("há 2h", "há 5min") no `AlertCard` do Dashboard e em `/alerts`
- [x] Ocultar quando `last_checked_at` for nulo (alerta recém-criado ou sem Supabase)

## Etapa 47 — Analytics de Produto (Posthog) ⬜ [BACKLOG]
> Medir funil criação→booking e retenção D1/D7. Etapa 29 promovida para execução.

- [ ] Integrar Posthog JS SDK (plano free, privacy-first)
- [ ] Evento `alert_created` com `{ origin, destination, targetPrice }`
- [ ] Evento `alert_deleted`, `alert_paused`, `booking_clicked`
- [ ] Evento `onboarding_completed`, `notification_opened`, `promo_code_copied`
- [ ] Dashboard mínimo: funil criação→booking, retenção D1/D7

## Etapa 48 — Observabilidade (Sentry) ⬜ [BACKLOG]
> Stub já existe no ErrorBoundary — só precisa do DSN e do pacote.

- [ ] `npm install @sentry/react`
- [ ] Configurar DSN no Sentry + variável `VITE_SENTRY_DSN`
- [ ] Ativar `Sentry.init` no `ErrorBoundary` e no `main.jsx`
- [ ] Testar captura de erro em dev antes de produção

## Etapa 49 — Avatar Upload ✅
> Bucket `avatars` já criado na Etapa 36 — falta o UI.

- [x] Botão de foto no card de perfil em Settings → abre file picker
- [x] Upload para `supabase.storage.from('avatars')` com path `{userId}/avatar`
- [x] Atualiza `profiles.avatar_url` + store após upload

---

## Bloco D — Qualidade Restante ✅

## Etapa 50 — Testes: auth flow + send-push alertId ✅
- [x] Teste de integração: auth → migrate → fetch alerts (mock do cliente Supabase)
- [x] `send-push` Edge Function: incluir `alertId` no payload das notificações geradas
- [x] Notificações in-app criadas pelo Realtime incluem `alertId` para navegação direta

---

## Bloco E — Confiabilidade Backend ✅
> Itens P1/P2 da revisão 2026-03-26 ainda abertos.

## Etapa 51 — Push: limpar subscriptions 410 expiradas ✅
> Endpoints expirados continuam sendo tentados indefinidamente — degradação silenciosa de entrega.

- [x] Em `send-push`, quando `statusCode === 410`: deletar a subscription expirada do banco (`push_subscriptions`)
- [x] Retornar `{ pushed, expired }` na resposta para rastreio

## Etapa 52 — Stripe: cobrir `customer.subscription.updated` ✅
> Webhook cobre apenas `checkout.session.completed` e `subscription.deleted` — renovações e mudanças de status não refletem o tier.

- [x] Adicionar handler para `customer.subscription.updated` em `stripe-webhook`
- [x] Mapear `status: active/trialing → tier: premium`, demais → `tier: free`
- [x] Persistir `current_period_end` em `profiles` para reconciliação futura

---

## Bloco F — i18n Finalização ✅
> i18n P2 da revisão: telas de entrada e monetização ainda parcialmente hardcoded.

## Etapa 53 — i18n: Login, Settings e locale dinâmico ✅
- [x] Aplicar `useTranslation` em `Login.jsx` — todos os textos da tela de entrada
- [x] Aplicar `useTranslation` em `Settings.jsx` — textos de upgrade, badges, seções
- [x] `formatMonth` em `CreateAlert.jsx` usa `i18n.language` em vez de `'en'` fixo

---

## Bloco G — Documentação ✅

## Etapa 54 — README: atualizar placeholders e contagem de testes ✅
> Badge CI e URL de clone ainda com `your-username` — perde credibilidade externa.

- [x] Substituir `your-username` por `RodrigoRP/sky-track` no README
- [x] Atualizar contagem de testes: 35 → 39
- [x] Adicionar `useAuth.test.js` na listagem de arquivos de teste
- [x] Revisar seção de backlog (Posthog, Sentry)
