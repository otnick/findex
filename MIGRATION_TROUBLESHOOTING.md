# 🔧 Multiple Photos Migration - Troubleshooting

## ❌ Error: "column photo does not exist"

### Problem:
Die `catches` Tabelle hat noch keine `photo` Spalte.

### Lösung - Option 1: Automatische Migration (Empfohlen)
```sql
-- In Supabase SQL Editor:
-- Kopiere ALLES aus: supabase/multiple_photos_migration.sql
-- Diese Version fügt die Spalte automatisch hinzu!
```

### Lösung - Option 2: Simple Migration (wenn keine alte Daten)
```sql
-- In Supabase SQL Editor:
-- Kopiere aus: supabase/simple_photos_migration.sql
-- Erstellt nur die neue Tabelle ohne Migration
```

### Lösung - Option 3: Manuell Spalte hinzufügen
```sql
-- 1. Photo Spalte hinzufügen
ALTER TABLE catches ADD COLUMN IF NOT EXISTS photo TEXT;

-- 2. Dann normale Migration
-- Kopiere aus: supabase/multiple_photos_migration.sql
```

---

## ✅ Verification - Hat es funktioniert?

```sql
-- Check 1: Tabelle existiert?
SELECT * FROM catch_photos LIMIT 1;
-- Sollte: Tabelle existiert (auch wenn leer)

-- Check 2: Spalte existiert?
SELECT photo FROM catches LIMIT 1;
-- Sollte: NULL oder Foto-URL

-- Check 3: RLS aktiv?
SELECT tablename, rowsecurity FROM pg_tables 
WHERE tablename = 'catch_photos';
-- Sollte: rowsecurity = true

-- Check 4: Policies existieren?
SELECT policyname FROM pg_policies 
WHERE tablename = 'catch_photos';
-- Sollte: 5 Policies
```

---

## 📋 Welche Migration nutzen?

### Nutze `multiple_photos_migration.sql` wenn:
✅ Du hast bereits Fänge in der DB
✅ Du möchtest alte Photos migrieren
✅ Du brauchst backwards compatibility
✅ Du hast `photo` Spalte ODER willst sie hinzufügen

### Nutze `simple_photos_migration.sql` wenn:
✅ Frische Installation
✅ Keine alten Daten
✅ Einfach nur neue Tabelle
✅ Schnell & simpel

---

## 🔄 Step-by-Step: Fresh Start

Wenn du KOMPLETT neu starten willst:

```sql
-- 1. Alte Tabelle löschen (falls existiert)
DROP TABLE IF EXISTS catch_photos CASCADE;

-- 2. Photo Spalte sicherstellen
ALTER TABLE catches ADD COLUMN IF NOT EXISTS photo TEXT;

-- 3. Neue Tabelle erstellen
-- Kopiere ALLES aus: supabase/multiple_photos_migration.sql
-- Paste & RUN

-- 4. Verify
SELECT COUNT(*) FROM catch_photos;
-- Sollte: Anzahl deiner Catches mit Photos
```

---

## 🎯 Common Issues:

### Issue 1: "relation catch_photos already exists"
**Lösung:**
```sql
-- Tabelle existiert schon - kein Problem!
-- Skip die CREATE TABLE Zeile
-- Oder:
DROP TABLE catch_photos CASCADE;
-- Dann nochmal Migration laufen lassen
```

### Issue 2: "policy already exists"
**Lösung:**
```sql
-- Policies existieren schon - kein Problem!
-- Migration hat DROP POLICY IF EXISTS
-- Sollte automatisch funktionieren
```

### Issue 3: "function already exists"
**Lösung:**
```sql
-- Function existiert schon - kein Problem!
-- Migration hat CREATE OR REPLACE
-- Updated automatisch
```

### Issue 4: No photos migrated
**Check:**
```sql
-- Haben Catches überhaupt Photos?
SELECT COUNT(*) FROM catches WHERE photo IS NOT NULL;

-- Wenn 0: Normal! Keine Photos zum migrieren
-- Wenn >0 aber catch_photos leer:
INSERT INTO catch_photos (catch_id, photo_url, order_index)
SELECT id, photo, 0
FROM catches
WHERE photo IS NOT NULL AND photo != '';
```

---

## 🚀 Quick Commands:

### Reset Everything:
```sql
DROP TABLE IF EXISTS catch_photos CASCADE;
DROP FUNCTION IF EXISTS update_catch_primary_photo CASCADE;
-- Dann Migration nochmal laufen lassen
```

### Check Status:
```sql
-- Tabellen
\dt

-- Spalten von catches
\d catches

-- Spalten von catch_photos
\d catch_photos

-- Policies
SELECT * FROM pg_policies WHERE tablename IN ('catches', 'catch_photos');
```

### Test Insert:
```sql
-- Test photo einfügen
INSERT INTO catch_photos (catch_id, photo_url, order_index)
VALUES (
  (SELECT id FROM catches LIMIT 1),
  'https://example.com/test.jpg',
  0
);

-- Check
SELECT * FROM catch_photos;
```

---

## ✅ Success Checklist:

Nach erfolgreicher Migration:

- [ ] `catch_photos` Tabelle existiert
- [ ] `catches.photo` Spalte existiert
- [ ] RLS ist enabled auf `catch_photos`
- [ ] 5 Policies existieren
- [ ] Trigger `sync_catch_primary_photo` existiert
- [ ] Function `update_catch_primary_photo` existiert
- [ ] Alte Photos wurden migriert (wenn vorhanden)

---

## 📞 Wenn gar nichts geht:

**Nuclear Option - Fresh Start:**

```sql
-- 1. Complete Reset
DROP TABLE IF EXISTS catch_photos CASCADE;
DROP FUNCTION IF EXISTS update_catch_primary_photo CASCADE;
DROP TRIGGER IF EXISTS sync_catch_primary_photo ON catch_photos;

-- 2. Simple Table
CREATE TABLE catch_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  catch_id UUID NOT NULL REFERENCES catches(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Basic RLS
ALTER TABLE catch_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "catch_photos_policy" ON catch_photos
  USING (true)
  WITH CHECK (true);

-- 4. Done - Funktioniert!
```

Dann kannst du später die richtigen Policies hinzufügen.

---

**Bei Fragen: Check die SQL Errors genau!** 🔍

Meistens steht da genau was fehlt! 💡
