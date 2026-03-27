-- ─────────────────────────────────────────────────────────────────────────────
-- SkyTrack — Etapa 33: Cron de Preços Automático
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. Adicionar last_checked_at em alerts ────────────────────────────────────
ALTER TABLE public.alerts
  ADD COLUMN IF NOT EXISTS last_checked_at TIMESTAMPTZ;

-- ── 2. Habilitar extensões ────────────────────────────────────────────────────
-- Habilitar no Dashboard: Database → Extensions → pg_cron e pg_net
-- Ou rodar:
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- ── 3. Auto-pause: alertas de usuários inativos há 30 dias ───────────────────
CREATE OR REPLACE FUNCTION public.auto_pause_inactive_alerts()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.alerts
  SET status = 'paused'
  WHERE status = 'active'
    AND user_id IN (
      SELECT id FROM auth.users
      WHERE last_sign_in_at < NOW() - INTERVAL '30 days'
        OR last_sign_in_at IS NULL
    );
END;
$$;

-- ── 4. Agendar crons ──────────────────────────────────────────────────────────
--
-- ANTES DE RODAR ESTA PARTE:
--   1. Faça deploy da Edge Function:
--      supabase functions deploy price-check-all
--
--   2. Substitua os dois placeholders abaixo:
--      - YOUR_PROJECT_REF  → encontre em: Dashboard → Settings → General (ex: jcoegpszwwrpjvncsyyz)
--      - YOUR_SERVICE_ROLE_KEY → encontre em: Dashboard → Settings → API → service_role (secret key)
--
-- Cron A: verificar preços a cada 6 horas (conservador para o plano free do Amadeus)
SELECT cron.schedule(
  'price-check-all',
  '0 */6 * * *',
  $$
  SELECT net.http_post(
    url     := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/price-check-all',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb,
    body    := '{}'::jsonb
  )
  $$
);

-- Cron B: pausar alertas de usuários inativos (diário às 3h UTC)
SELECT cron.schedule(
  'auto-pause-inactive',
  '0 3 * * *',
  $$ SELECT public.auto_pause_inactive_alerts() $$
);
