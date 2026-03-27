-- ─────────────────────────────────────────────────────────────────────────────
-- SkyTrack — Etapa 36: Gestão de Conta
-- ─────────────────────────────────────────────────────────────────────────────

-- ── delete_user(): chamado pelo frontend via supabase.rpc('delete_user') ──────
-- Deleta o usuário autenticado e todos os seus dados em cascata.
-- SECURITY DEFINER permite que a função execute com privilégios elevados,
-- necessário para deletar de auth.users.
CREATE OR REPLACE FUNCTION public.delete_user()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  uid UUID := auth.uid();
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Dados em cascata são deletados automaticamente pelas FK constraints:
  --   profiles, alerts, price_snapshots, push_subscriptions, push_sent_log
  DELETE FROM auth.users WHERE id = uid;
END;
$$;

-- Garantir que só o próprio usuário pode chamar a função
REVOKE ALL ON FUNCTION public.delete_user() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_user() TO authenticated;

-- ── Storage bucket para avatars ───────────────────────────────────────────────
-- Execute via Dashboard → Storage → New bucket:
--   Nome: avatars
--   Public: false
--
-- Ou via SQL (requer extensão storage já habilitada):
INSERT INTO storage.buckets (id, name, public)
  VALUES ('avatars', 'avatars', false)
  ON CONFLICT (id) DO NOTHING;

-- RLS para o bucket avatars
CREATE POLICY "Users manage own avatar"
  ON storage.objects FOR ALL
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1])
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
