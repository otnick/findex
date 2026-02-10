-- Shiny catches (rare variants + trophy lengths)
ALTER TABLE public.catches
ADD COLUMN IF NOT EXISTS is_shiny BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS shiny_reason TEXT;

CREATE INDEX IF NOT EXISTS catches_is_shiny_idx
ON public.catches (is_shiny);
