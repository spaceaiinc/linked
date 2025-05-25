-- Add priority column to scout_screening_patterns
ALTER TABLE public.scout_screening_patterns
ADD COLUMN priority SMALLINT NOT NULL DEFAULT 0;

-- Ensure priority defaults to order creation for existing rows (already 0)
-- Add index for faster ordering
CREATE INDEX scout_screening_patterns_priority_index ON public.scout_screening_patterns(priority); 