-- ─────────────────────────────────────────────────────────────────────────────
-- SkyTrack — Etapa 38: Monetização (Stripe)
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Adicionar campos de tier e Stripe em profiles ─────────────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS tier TEXT DEFAULT 'free' CHECK (tier IN ('free', 'premium')),
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT UNIQUE;

-- ── RLS: limite de 5 alertas para usuários free ───────────────────────────────
-- Esta policy bloqueia INSERT no banco quando o usuário free já tem 5 alertas.
-- O frontend também verifica, mas a RLS é a garantia de segurança real.
CREATE OR REPLACE FUNCTION public.check_alert_limit()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  user_tier TEXT;
  alert_count INT;
BEGIN
  SELECT tier INTO user_tier FROM public.profiles WHERE id = NEW.user_id;
  IF COALESCE(user_tier, 'free') = 'free' THEN
    SELECT COUNT(*) INTO alert_count FROM public.alerts WHERE user_id = NEW.user_id;
    IF alert_count >= 5 THEN
      RAISE EXCEPTION 'Free plan limit reached: maximum 5 alerts allowed';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_alert_limit ON public.alerts;
CREATE TRIGGER enforce_alert_limit
  BEFORE INSERT ON public.alerts
  FOR EACH ROW EXECUTE FUNCTION public.check_alert_limit();

-- ─────────────────────────────────────────────────────────────────────────────
-- Secrets necessários (Supabase Dashboard → Edge Functions → Secrets):
--   STRIPE_SECRET_KEY   → sk_live_... ou sk_test_...
--   STRIPE_WEBHOOK_SECRET → whsec_...
--   STRIPE_PRICE_ID     → price_... (ID do plano premium mensal/anual)
--   APP_URL             → https://sky-drop-woad.vercel.app
-- ─────────────────────────────────────────────────────────────────────────────
