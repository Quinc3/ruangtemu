-- ============================================================
-- MIGRATION: Tambahkan kolom warna ke event_rundown
-- Jalankan setelah skema utama (schema.sql)
-- Aman dijalankan berulang kali
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'event_rundown'
      AND column_name = 'bg_color'
  ) THEN
    ALTER TABLE public.event_rundown ADD COLUMN bg_color TEXT DEFAULT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'event_rundown'
      AND column_name = 'text_color'
  ) THEN
    ALTER TABLE public.event_rundown ADD COLUMN text_color TEXT DEFAULT NULL;
  END IF;
END $$;