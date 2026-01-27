# 🗄️ Datenbank-Migration - Step-by-Step Guide

## 📋 Überblick

Du musst 2 Migrations-Dateien ausführen:
1. `schema.sql` - Basis-Schema (Falls noch nicht gemacht)
2. `social_migration.sql` - Social Features + Profile

---

## 🚀 OPTION 1: Komplette Neuinstallation (Empfohlen wenn leer)

### Schritt 1: Supabase öffnen

1. Gehe zu [supabase.com](https://supabase.com)
2. Login
3. Wähle dein Projekt
4. Sidebar → **SQL Editor**

### Schritt 2: Basis-Schema ausführen

1. In SQL Editor → **New query**
2. Öffne auf deinem Computer: `supabase/schema.sql`
3. Kopiere **GESAMTEN Inhalt**
4. Füge in SQL Editor ein
5. Klick **RUN** (unten rechts)
6. ✅ Warte auf "Success"

**Was wird erstellt:**
- `catches` Tabelle
- `fish-photos` Storage Bucket
- RLS Policies
- Triggers

### Schritt 3: Social Features Migration

1. In SQL Editor → **New query** (wieder)
2. Öffne auf deinem Computer: `supabase/social_migration.sql`
3. Kopiere **GESAMTEN Inhalt**
4. Füge in SQL Editor ein
5. Klick **RUN**
6. ✅ Warte auf "Success"

**Was wird erstellt:**
- `profiles` Tabelle
- `friendships` Tabelle
- `catch_likes` Tabelle
- `catch_comments` Tabelle
- `activities` Tabelle
- Auto-create Profile Trigger
- RLS Policies für alle
- Indexes

### Schritt 4: Verify

```sql
-- Prüfe ob Tabellen existieren:
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';
```

Du solltest sehen:
- catches
- profiles
- friendships
- catch_likes
- catch_comments
- activities

✅ **FERTIG!**

---

## 🔄 OPTION 2: Bestehende Datenbank (Du hast schon User/Catches)

### Schritt 1: Backup erstellen (WICHTIG!)

1. Supabase → **Database** → **Backups**
2. Klick **Create backup**
3. Warte bis fertig
4. ✅ Jetzt safe!

### Schritt 2: Prüfe was du hast

```sql
-- Prüfe Tabellen:
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';

-- Prüfe User:
SELECT COUNT(*) FROM auth.users;

-- Prüfe Catches:
SELECT COUNT(*) FROM catches;
```

### Schritt 3: Social Migration ausführen

**WICHTIG:** Wenn du schon `catches` Tabelle hast, überspringe `schema.sql`!

1. SQL Editor → **New query**
2. Öffne `supabase/social_migration.sql`
3. Kopiere **GESAMTEN Inhalt**
4. Füge ein
5. Klick **RUN**

**Wenn Fehler "already exists":**
Das ist OK! Bedeutet nur dass manche Sachen schon da sind.

### Schritt 4: Profile für bestehende User erstellen

```sql
-- Erstelle Profile für alle existierenden User:
INSERT INTO public.profiles (id, username)
SELECT 
    id,
    SPLIT_PART(email, '@', 1)
FROM auth.users
WHERE NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE profiles.id = auth.users.id
)
ON CONFLICT (id) DO NOTHING;
```

Kopiere das ☝️, füge in SQL Editor ein, RUN!

### Schritt 5: Alte Spalten aufräumen (Optional)

Wenn du alte Version mit `display_name` hattest:

```sql
-- Entferne alte display_name Spalte:
ALTER TABLE public.profiles DROP COLUMN IF EXISTS display_name;
```

### Schritt 6: Verify

```sql
-- Prüfe ob alle User Profile haben:
SELECT 
    u.email,
    p.username,
    p.bio
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id;
```

Jeder User sollte einen username haben!

✅ **FERTIG!**

---

## 🐛 Troubleshooting

### ❌ Error: "relation already exists"

**Das ist OK!** Bedeutet nur dass die Tabelle schon existiert.

**Lösung:** Ignorieren oder diese Zeilen auskommentieren:
```sql
-- CREATE TABLE IF NOT EXISTS ... schon da
```

### ❌ Error: "column already exists"

**Das ist OK!** Spalte ist schon da.

**Lösung:** In Migration diese Zeile finden und auskommentieren oder löschen.

### ❌ Error: "permission denied"

**Problem:** Nicht als postgres/service_role

**Lösung:**
1. Supabase → **Settings** → **Database**
2. Kopiere **Connection String**
3. Oder: Nutze SQL Editor (automatisch richtige Permissions)

### ❌ "profiles" Tabelle existiert, aber leer

**Lösung:** Schritt 4 aus Option 2 ausführen (Profile erstellen)

### ❌ Error: "function already exists"

**Das ist OK!** Function ist schon da.

**Lösung:** 
```sql
-- Erst löschen, dann neu erstellen:
DROP FUNCTION IF EXISTS create_profile_for_user() CASCADE;
-- Dann Function neu erstellen
```

### ❌ Trigger funktioniert nicht

**Problem:** Trigger existiert nicht oder falsch

**Lösung:**
```sql
-- Prüfe ob Trigger existiert:
SELECT * FROM pg_trigger WHERE tgname = 'create_profile_trigger';

-- Wenn nicht da, nochmal erstellen:
-- (Code aus social_migration.sql kopieren)
```

---

## ✅ Verification Checklist

Nach der Migration sollte alles funktionieren:

```sql
-- 1. Tabellen existieren?
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
-- Erwartung: catches, profiles, friendships, catch_likes, catch_comments, activities

-- 2. Profile vorhanden?
SELECT COUNT(*) FROM public.profiles;
-- Erwartung: Mindestens 1 (dein User)

-- 3. Trigger aktiv?
SELECT tgname FROM pg_trigger WHERE tgname = 'create_profile_trigger';
-- Erwartung: 1 Zeile

-- 4. RLS aktiv?
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';
-- Erwartung: Alle Tabellen haben rowsecurity = true

-- 5. Policies existieren?
SELECT tablename, policyname FROM pg_policies WHERE schemaname = 'public';
-- Erwartung: Mehrere Policies pro Tabelle
```

Alles grün? **PERFEKT!** ✅

---

## 🎯 Quick Test in der App

### 1. Test Profile:
1. Login
2. Gehe zu **Profil**
3. Du solltest sehen: `@username`
4. Klick **Bearbeiten**
5. Ändere Username
6. Speichern
7. ✅ Sollte funktionieren!

### 2. Test Social Feed:
1. Mache einen Fang **öffentlich** (🌍)
2. Gehe zu **Social**
3. Dein Fang sollte erscheinen mit `@username`
4. Klick ❤️
5. Counter sollte steigen
6. ✅ Funktioniert!

### 3. Test Freunde:
1. Gehe zu **Freunde**
2. Suche deinen eigenen Username
3. (Oder erstelle Test-Account)
4. Anfrage senden
5. ✅ Sollte funktionieren!

### 4. Test Bestenliste:
1. Gehe zu **Bestenliste**
2. Du solltest dich sehen mit `@username`
3. Filter ändern (Zeitraum, Kategorie, Fischart)
4. ✅ Sollte funktionieren!

---

## 📊 Migration-Reihenfolge (Zusammenfassung)

### Neu (Leere DB):
```
1. schema.sql ausführen
2. social_migration.sql ausführen
3. Fertig! ✅
```

### Bestehend (Mit Daten):
```
1. Backup erstellen ⚠️
2. social_migration.sql ausführen
3. Profile für bestehende User erstellen
4. (Optional) Alte Spalten aufräumen
5. Verify
6. Fertig! ✅
```

---

## 💡 Pro-Tipps

### Tipp 1: Immer Backup!
Vor JEDER Migration → Backup erstellen!

### Tipp 2: Teste erst lokal
Wenn du lokale Supabase hast, teste dort zuerst.

### Tipp 3: Schrittweise
Führe Migration in Schritten aus, nicht alles auf einmal.

### Tipp 4: Errors notieren
Wenn Errors kommen, notiere sie. Meist sind sie harmlos ("already exists").

### Tipp 5: SQL Editor nutzen
Nicht über psql/CLI - SQL Editor in Supabase ist einfacher!

---

## 📞 Wenn gar nichts funktioniert

### Letzte Option: Reset

**⚠️ ACHTUNG: Löscht ALLE Daten!**

```sql
-- NUR wenn du von vorne anfangen willst:

-- Alle Tabellen löschen:
DROP TABLE IF EXISTS public.activities CASCADE;
DROP TABLE IF EXISTS public.catch_comments CASCADE;
DROP TABLE IF EXISTS public.catch_likes CASCADE;
DROP TABLE IF EXISTS public.friendships CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.catches CASCADE;

-- Dann von vorne: schema.sql + social_migration.sql
```

---

## ✅ Success!

Wenn alles geklappt hat, solltest du jetzt haben:

- ✅ Alle Tabellen erstellt
- ✅ Profile für alle User
- ✅ Trigger funktioniert (neue User → Auto-Profile)
- ✅ RLS Policies aktiv
- ✅ App funktioniert ohne Errors

**GRATULATION!** 🎉

---

## 🚀 Nächste Schritte

Nach erfolgreicher Migration:

1. **App testen** (siehe Quick Test oben)
2. **Profil bearbeiten** (Username setzen)
3. **Ersten öffentlichen Fang** machen
4. **Social Features nutzen**
5. **Zeig's deinen Freunden!**

**Du hast es geschafft!** 💪

---

**Bei Fragen: Schau in die Troubleshooting-Sektion oder melde dich!** 📧
