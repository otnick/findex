-- ============================================
-- ACHIEVEMENTS DEDUPE (2026-02-05)
-- Keep newer achievements:
--   Erstfang, Großer Fang, Deutschland komplett III
-- Remove older duplicates:
--   Anfänger, Riesen-Fang, Deutschland Meister
-- ============================================

BEGIN;

-- Anfänger -> Erstfang
WITH old AS (
  SELECT id FROM achievements WHERE name = 'Anfänger'
),
new AS (
  SELECT id FROM achievements WHERE name = 'Erstfang'
)
INSERT INTO user_achievements (user_id, achievement_id, unlocked_at, progress)
SELECT ua.user_id, new.id, ua.unlocked_at, ua.progress
FROM user_achievements ua, old, new
WHERE ua.achievement_id = old.id
ON CONFLICT (user_id, achievement_id) DO NOTHING;

DELETE FROM user_achievements
WHERE achievement_id IN (SELECT id FROM achievements WHERE name = 'Anfänger');
DELETE FROM achievements WHERE name = 'Anfänger';

-- Riesen-Fang -> Großer Fang
WITH old AS (
  SELECT id FROM achievements WHERE name = 'Riesen-Fang'
),
new AS (
  SELECT id FROM achievements WHERE name = 'Großer Fang'
)
INSERT INTO user_achievements (user_id, achievement_id, unlocked_at, progress)
SELECT ua.user_id, new.id, ua.unlocked_at, ua.progress
FROM user_achievements ua, old, new
WHERE ua.achievement_id = old.id
ON CONFLICT (user_id, achievement_id) DO NOTHING;

DELETE FROM user_achievements
WHERE achievement_id IN (SELECT id FROM achievements WHERE name = 'Riesen-Fang');
DELETE FROM achievements WHERE name = 'Riesen-Fang';

-- Deutschland Meister -> Deutschland komplett III
WITH old AS (
  SELECT id FROM achievements WHERE name = 'Deutschland Meister'
),
new AS (
  SELECT id FROM achievements WHERE name = 'Deutschland komplett III'
)
INSERT INTO user_achievements (user_id, achievement_id, unlocked_at, progress)
SELECT ua.user_id, new.id, ua.unlocked_at, ua.progress
FROM user_achievements ua, old, new
WHERE ua.achievement_id = old.id
ON CONFLICT (user_id, achievement_id) DO NOTHING;

DELETE FROM user_achievements
WHERE achievement_id IN (SELECT id FROM achievements WHERE name = 'Deutschland Meister');
DELETE FROM achievements WHERE name = 'Deutschland Meister';

COMMIT;
