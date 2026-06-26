-- Migration 0033: Add event_month_day generated column and optimized index
-- Project: La Gauchita Federal
-- Scope: public.contents
-- Note: All comments use ASCII encoding to avoid system-specific character issues.

-- 1. Add event_month_day stored generated column to contents table
-- This column calculates an integer representation of month and day (e.g. 507 for May 7th)
-- using MMDD formula. It is defined as a STORED column for fast querying.
ALTER TABLE public.contents 
ADD COLUMN IF NOT EXISTS event_month_day INTEGER 
GENERATED ALWAYS AS (
  CASE 
    WHEN event_date IS NULL THEN NULL 
    ELSE (EXTRACT(MONTH FROM event_date)::INTEGER * 100 + EXTRACT(DAY FROM event_date)::INTEGER) 
  END
) STORED;

-- 2. Create functional partial index for scalable daily public queries
-- This index targets public queries that filter by today's date, status and visibility.
CREATE INDEX IF NOT EXISTS idx_contents_event_month_day_public 
ON public.contents (event_month_day) 
WHERE (status = 'published' AND visibility = 'public' AND event_date IS NOT NULL);
