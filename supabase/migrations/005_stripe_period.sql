-- ─────────────────────────────────────────────────────────────────────────────
-- SkyTrack — Etapa 52: current_period_end em profiles
-- ─────────────────────────────────────────────────────────────────────────────

-- Armazena quando o período de assinatura Stripe termina.
-- Usado para reconciliar tier em caso de webhooks perdidos ou atraso de billing.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMPTZ;
