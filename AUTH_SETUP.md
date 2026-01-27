# 🔐 Authentication Setup - Schritt für Schritt

## ✅ Was ist neu?

- **Login & Registrierung** - Vollständiges Auth-System
- **Cloud-Sync** - Deine Fänge werden in Supabase gespeichert
- **Multi-Device** - Greife von überall auf deine Daten zu
- **Magic Link** - Login ohne Passwort per E-Mail
- **Sicher** - Row Level Security (RLS) aktiviert

## 🚀 Setup in 5 Minuten

### 1. Supabase Projekt erstellen

1. Gehe zu **https://supabase.com** und melde dich an
2. Klick **"New Project"**
3. Fülle aus:
   - Name: `fishing-tracker`
   - Database Password: Wähle ein sicheres Passwort
   - Region: `Europe (Frankfurt)` oder `Stockholm`
4. Klick **"Create new project"**
5. Warte 1-2 Minuten

### 2. SQL Schema ausführen

1. **Öffne SQL Editor:**
   - Linke Sidebar → **"SQL Editor"** Icon
   - Oder klick "+ New query"

2. **Kopiere & Führe aus:**
   - Öffne die Datei `supabase/schema.sql`
   - Kopiere den kompletten Inhalt (Strg+A, Strg+C)
   - Paste in den SQL Editor
   - Klick **"Run"** (oder Strg+Enter)
   - ✅ Erfolgsmeldung: "Success. No rows returned"

3. **Überprüfen:**
   - Sidebar → **"Table Editor"**
   - Du solltest die Tabelle **"catches"** sehen

### 3. Authentication aktivieren

1. **Gehe zu Authentication:**
   - Linke Sidebar → **"Authentication"**

2. **Email Provider aktivieren:**
   - Tab **"Providers"**
   - Toggle bei **"Email"** auf grün
   - Optional: **"Confirm email"** ausschalten für schnelleres Testing

3. **Optional: Email Templates anpassen:**
   - Tab **"Email Templates"**
   - Passe Confirm signup / Magic Link an

### 4. API Credentials holen

1. **Project Settings öffnen:**
   - Linke Sidebar (ganz unten) → **"Project Settings"** (Zahnrad)

2. **API Tab:**
   - Im Menü → **"API"**
   - Kopiere:
     - **Project URL** (z.B. `https://abcdefgh.supabase.co`)
     - **anon public** key (unter "Project API keys")

### 5. Environment Variables setzen

**Erstelle `.env.local` in deinem Projekt:**

```env
NEXT_PUBLIC_SUPABASE_URL=https://deine-projekt-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ey...deine-keys-hier
```

**⚠️ Wichtig:**
- Ersetze die Werte mit deinen echten Credentials!
- Diese Datei NICHT in Git committen (ist in `.gitignore`)

### 6. App neu starten

```bash
# Stoppe den Dev-Server (Strg+C)
# Starte neu:
npm run dev
```

## 🎉 Fertig!

Du solltest jetzt den **Login/Register Screen** sehen!

### Ersten Account erstellen:

1. Klick **"Jetzt registrieren"**
2. Gib deine E-Mail und ein Passwort ein (min. 6 Zeichen)
3. Klick **"Registrieren"**
4. ✅ Du siehst: "Account erstellt! Bitte bestätige deine E-Mail-Adresse."

### Email-Bestätigung (falls aktiviert):

1. Check deine E-Mails (auch Spam!)
2. Klick den Bestätigungslink
3. Du wirst automatisch eingeloggt

### Oder: Email-Bestätigung ausschalten

1. Supabase → Authentication → Providers
2. Email → Settings
3. **"Confirm email"** deaktivieren
4. Jetzt kannst du dich sofort ohne Bestätigung anmelden!

## 🪄 Magic Link (Login ohne Passwort)

1. Gib nur deine E-Mail ein
2. Klick **"Magic Link senden"**
3. Check deine E-Mails
4. Klick den Link → Automatisch eingeloggt!

## ✨ Was funktioniert jetzt?

- ✅ **Registrierung** mit E-Mail + Passwort
- ✅ **Login** mit E-Mail + Passwort
- ✅ **Magic Link** Login (ohne Passwort)
- ✅ **Cloud-Sync** - Fänge werden in Supabase gespeichert
- ✅ **Multi-Device** - Login von überall
- ✅ **Sicher** - Nur du siehst deine Fänge (RLS)
- ✅ **Automatische Session** - Bleibt eingeloggt

## 🔧 Troubleshooting

### Problem: "Invalid login credentials"

**Lösung:**
- Passwort falsch eingegeben
- Account noch nicht bestätigt (check E-Mail)
- Oder: Email-Bestätigung in Supabase ausschalten

### Problem: "Email rate limit exceeded"

**Lösung:**
- Zu viele E-Mails in kurzer Zeit
- Warte 1 Minute und versuche es erneut

### Problem: Keine E-Mail erhalten

**Lösung:**
1. Check Spam-Ordner
2. In Supabase → Authentication → Email Templates
3. Prüfe "From email" - sollte von Supabase sein
4. Für Production: Custom SMTP einrichten

### Problem: "Failed to fetch"

**Lösung:**
- `.env.local` Datei erstellt?
- Dev-Server neu gestartet?
- Credentials richtig kopiert?

### Problem: Kann nicht auf Tabelle zugreifen

**Lösung:**
- SQL Schema ausgeführt?
- RLS Policies aktiviert?
- In Supabase → Table Editor → catches → "Policies" Tab checken

## 🎯 Nächste Schritte

Jetzt wo Auth läuft:

1. **Teste es:** Erstelle einen Account, füge Fänge hinzu
2. **Multi-Device:** Login von anderem Gerät - Daten sind da!
3. **Foto-Upload:** Nächstes Feature (kommt bald)
4. **Social Features:** Freunde, Rankings, etc.

## 💡 Tipps

### Development vs Production

**Während Entwicklung:**
- Email-Bestätigung AUS (schneller testen)
- Verwende Test-E-Mails

**Für Production:**
- Email-Bestätigung AN (Sicherheit)
- Custom SMTP einrichten
- Custom Email Templates

### Row Level Security (RLS)

Die SQL Schema hat automatisch RLS aktiviert:
- Jeder User sieht nur seine eigenen Fänge
- Kein User kann Daten von anderen sehen/ändern
- Automatisch durch `user_id` Filter

### Session Management

- Session läuft automatisch
- Bleibt eingeloggt (LocalStorage)
- Logout löscht Session
- Bei Inaktivität: Auto-Logout nach X Tagen (konfigurierbar)

## 🔐 Sicherheit

**Was ist sicher:**
- ✅ Passwörter werden gehasht (nie im Klartext)
- ✅ JWT Tokens für Authentication
- ✅ HTTPS erzwungen
- ✅ Row Level Security aktiv
- ✅ API Keys sind public-safe (anon key)

**Was du NIE tun solltest:**
- ❌ Service Role Key im Frontend verwenden
- ❌ `.env.local` in Git committen
- ❌ RLS Policies deaktivieren

## 🚀 Deployment

Bei Deployment (Vercel, Netlify, etc.):

1. **Environment Variables setzen:**
   - In Hosting-Platform: Settings → Environment Variables
   - Füge `NEXT_PUBLIC_SUPABASE_URL` hinzu
   - Füge `NEXT_PUBLIC_SUPABASE_ANON_KEY` hinzu

2. **Email Redirect URLs:**
   - Supabase → Authentication → URL Configuration
   - Füge deine Production URL hinzu: `https://deine-app.vercel.app`

## ❓ Fragen?

- Supabase Docs: https://supabase.com/docs
- Supabase Discord: https://discord.supabase.com
- Next.js Auth Guide: https://supabase.com/docs/guides/auth/auth-helpers/nextjs

---

**Happy Fishing! 🎣**