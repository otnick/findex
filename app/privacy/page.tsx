export const metadata = {
  title: 'Datenschutzerklärung – FishBox',
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-deep-blue text-white">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-2">Datenschutzerklärung</h1>
        <p className="text-ocean-light mb-8">Zuletzt aktualisiert: 17. Februar 2026</p>

        <div className="space-y-8 text-white/80 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">1. Verantwortlicher</h2>
            <p>
              FishBox wird betrieben von Nick Schumacher.<br />
              Kontakt: <a href="mailto:schumacher@nickot.is" className="text-ocean-light hover:underline">schumacher@nickot.is</a>
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">2. Welche Daten wir erheben</h2>

            <h3 className="font-semibold text-white mt-4 mb-2">Kontodaten</h3>
            <p>Bei der Registrierung speichern wir deine E-Mail-Adresse und ein verschlüsseltes Passwort. Optional kannst du einen Benutzernamen, eine Bio und ein Profilbild angeben.</p>

            <h3 className="font-semibold text-white mt-4 mb-2">Fangdaten</h3>
            <p>Wenn du einen Fang einträgst, speichern wir: Fischart, Länge, Gewicht, Datum, Uhrzeit, Köder, Notizen und ob der Fang öffentlich sichtbar ist.</p>

            <h3 className="font-semibold text-white mt-4 mb-2">Standortdaten</h3>
            <p>Mit deiner Erlaubnis erfassen wir GPS-Koordinaten deines Fangorts. Diese werden auch aus EXIF-Daten hochgeladener Fotos ausgelesen. Die Koordinaten werden für Reverse Geocoding an OpenStreetMap Nominatim gesendet, um den Ortsnamen zu ermitteln.</p>

            <h3 className="font-semibold text-white mt-4 mb-2">Fotos</h3>
            <p>Du kannst bis zu 6 Fotos pro Fang hochladen. Fotos werden komprimiert und in unserem Cloud-Speicher (Supabase Storage) gespeichert. Das Hauptfoto wird zur KI-gestützten Fischerkennung an unseren Erkennungsdienst gesendet.</p>

            <h3 className="font-semibold text-white mt-4 mb-2">Wetterdaten</h3>
            <p>Basierend auf deinem Standort und Zeitpunkt rufen wir Wetterdaten von Open-Meteo ab (Temperatur, Wind, Luftdruck, Luftfeuchtigkeit).</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">3. Drittanbieter-Dienste</h2>
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-white/20">
                  <th className="text-left py-2 pr-4 text-white">Dienst</th>
                  <th className="text-left py-2 pr-4 text-white">Daten</th>
                  <th className="text-left py-2 text-white">Zweck</th>
                </tr>
              </thead>
              <tbody className="text-white/70">
                <tr className="border-b border-white/10">
                  <td className="py-2 pr-4">Supabase</td>
                  <td className="py-2 pr-4">Alle Nutzerdaten</td>
                  <td className="py-2">Datenbank, Authentifizierung, Speicher</td>
                </tr>
                <tr className="border-b border-white/10">
                  <td className="py-2 pr-4">OpenStreetMap Nominatim</td>
                  <td className="py-2 pr-4">GPS-Koordinaten</td>
                  <td className="py-2">Reverse Geocoding</td>
                </tr>
                <tr className="border-b border-white/10">
                  <td className="py-2 pr-4">Open-Meteo</td>
                  <td className="py-2 pr-4">GPS-Koordinaten, Datum</td>
                  <td className="py-2">Wetterdaten</td>
                </tr>
                <tr className="border-b border-white/10">
                  <td className="py-2 pr-4">Fish Detection API</td>
                  <td className="py-2 pr-4">Fangfotos</td>
                  <td className="py-2">KI-Fischerkennung</td>
                </tr>
              </tbody>
            </table>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">4. Keine Werbung oder Tracking</h2>
            <p>FishBox verwendet keine Werbenetzwerke, Analyse-Tools oder Tracking-Dienste. Wir verkaufen oder teilen deine Daten nicht mit Dritten zu Werbezwecken.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">5. Datenspeicherung</h2>
            <p>Deine Daten werden auf Servern von Supabase (AWS, EU-Region) gespeichert. Fotos werden in Supabase Storage gehostet. Wir bewahren deine Daten auf, solange dein Konto aktiv ist.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">6. Deine Rechte</h2>
            <p>Du hast das Recht auf:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Auskunft über deine gespeicherten Daten</li>
              <li>Berichtigung unrichtiger Daten</li>
              <li>Löschung deines Kontos und aller zugehörigen Daten</li>
              <li>Export deiner Daten</li>
            </ul>
            <p className="mt-2">Kontaktiere uns unter <a href="mailto:schumacher@nickot.is" className="text-ocean-light hover:underline">schumacher@nickot.is</a> für diese Anfragen.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">7. Änderungen</h2>
            <p>Wir können diese Datenschutzerklärung jederzeit aktualisieren. Bei wesentlichen Änderungen informieren wir dich innerhalb der App.</p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-white/10 text-center text-white/50 text-sm">
          <a href="/" className="text-ocean-light hover:underline">Zurück zu FishBox</a>
        </div>
      </div>
    </div>
  )
}
