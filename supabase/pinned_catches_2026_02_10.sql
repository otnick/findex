-- Pinned catches for public profile showcase (Vitrine)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS pinned_catch_ids UUID[] DEFAULT '{}'::uuid[];

CREATE INDEX IF NOT EXISTS profiles_pinned_catch_ids_gin
ON public.profiles USING GIN (pinned_catch_ids);
