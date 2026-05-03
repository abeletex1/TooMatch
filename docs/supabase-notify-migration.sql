-- ============================================================================
-- Too Match — Migración: notificaciones de match por email
-- ============================================================================
-- Cómo correrlo:
--   Supabase Dashboard → SQL Editor → pega y ejecuta
-- ============================================================================


-- 1. Nueva columna en matches para saber si ya se envió el email
alter table public.matches
  add column if not exists notified_at timestamptz;


-- 2. Cron job: llama a la Edge Function cada día a las 17:30 UTC (19:30 España verano)
--    Requiere pg_cron habilitado (en Supabase ya lo está en proyectos Pro).
--    Si estás en Free tier, usa el cron externo de cron-job.org (ver abajo).
select cron.schedule(
  'notify-daily-matches',           -- nombre del job (único)
  '30 17 * * *',                    -- cron: 17:30 UTC = 19:30 CEST
  $$
    select net.http_post(
      url    := 'https://<TU_PROJECT_REF>.supabase.co/functions/v1/notify-daily-matches',
      headers := '{"Authorization": "Bearer <TU_ANON_KEY>", "Content-Type": "application/json"}'::jsonb,
      body   := '{}'::jsonb
    );
  $$
);


-- ============================================================================
-- ALTERNATIVA FREE TIER: cron externo con cron-job.org
-- ============================================================================
-- Si el plan de Supabase es Free, pg_cron no está disponible.
-- En ese caso:
--   1. Ve a https://cron-job.org → crea cuenta gratis
--   2. Crea un nuevo cron job con:
--      URL: https://<TU_PROJECT_REF>.supabase.co/functions/v1/notify-daily-matches
--      Method: POST
--      Header: Authorization: Bearer <TU_ANON_KEY>
--      Schedule: todos los días a las 17:30 UTC
-- ============================================================================
