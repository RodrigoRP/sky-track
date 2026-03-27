-- ─────────────────────────────────────────────────────────────────────────────
-- SkyTrack — initial schema
-- Run via: supabase db push  (or paste into the SQL editor in the dashboard)
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Profiles (extends auth.users) ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name        TEXT,
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create a profile row whenever a user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── Alerts ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.alerts (
  id               BIGSERIAL PRIMARY KEY,
  user_id          UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  origin           TEXT NOT NULL,
  destination      TEXT NOT NULL,
  dates            TEXT NOT NULL,
  target_price     INTEGER NOT NULL,
  current_price    INTEGER,
  status           TEXT DEFAULT 'active',
  trend            TEXT DEFAULT 'flat',
  change           INTEGER DEFAULT 0,
  trend_label      TEXT DEFAULT 'Monitoring started',
  peak_price       INTEGER,
  low_price        INTEGER,
  image            TEXT,
  destination_full TEXT,
  alternatives     JSONB DEFAULT '[]',
  price_history    JSONB DEFAULT '[]',
  departure_month  TEXT,
  return_month     TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS alerts_updated_at ON public.alerts;
CREATE TRIGGER alerts_updated_at
  BEFORE UPDATE ON public.alerts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── Price snapshots ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.price_snapshots (
  id         BIGSERIAL PRIMARY KEY,
  alert_id   BIGINT REFERENCES public.alerts(id) ON DELETE CASCADE NOT NULL,
  price      INTEGER NOT NULL,
  source     TEXT DEFAULT 'amadeus',
  checked_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fetching last N snapshots per alert quickly
CREATE INDEX IF NOT EXISTS price_snapshots_alert_checked
  ON public.price_snapshots (alert_id, checked_at DESC);

-- ── Push subscriptions ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id           BIGSERIAL PRIMARY KEY,
  user_id      UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  subscription JSONB NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id)
);

-- ── Push throttle (max 1 push per alert per 4h) ───────────────────────────────
CREATE TABLE IF NOT EXISTS public.push_sent_log (
  alert_id  BIGINT REFERENCES public.alerts(id) ON DELETE CASCADE NOT NULL,
  sent_at   TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (alert_id)
);

-- ── Row Level Security ────────────────────────────────────────────────────────
ALTER TABLE public.profiles           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_snapshots    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_sent_log      ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY "Users manage own profile"
  ON public.profiles FOR ALL USING (auth.uid() = id);

-- Alerts
CREATE POLICY "Users manage own alerts"
  ON public.alerts FOR ALL USING (auth.uid() = user_id);

-- Snapshots — read-only for users (written by Edge Functions with service-role key)
CREATE POLICY "Users read own snapshots"
  ON public.price_snapshots FOR SELECT
  USING (alert_id IN (SELECT id FROM public.alerts WHERE user_id = auth.uid()));

-- Push subscriptions
CREATE POLICY "Users manage own push subscriptions"
  ON public.push_subscriptions FOR ALL USING (auth.uid() = user_id);
