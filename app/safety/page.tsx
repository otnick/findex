export const metadata = {
  title: 'Kindersicherheitsstandards – FinDex',
}

export default function SafetyPage() {
  return (
    <div className="min-h-screen bg-deep-blue text-white">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-2">Kindersicherheitsstandards</h1>
        <p className="text-ocean-light mb-8">Zuletzt aktualisiert: 17. Februar 2026</p>

        <div className="space-y-8 text-white/80 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">1. Zielgruppe</h2>
            <p>
              FinDex richtet sich an Angler ab 16 Jahren. Die App ist nicht für Kinder unter 13 Jahren bestimmt
              und wir richten uns nicht gezielt an Minderjährige.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">2. Registrierung</h2>
            <p>
              Zur Nutzung der App ist eine Registrierung mit E-Mail-Adresse erforderlich.
              Wir erheben kein Alter bei der Registrierung, da die App nicht für Kinder konzipiert ist.
              Sollten wir Kenntnis darüber erlangen, dass ein Kind unter 13 Jahren ein Konto erstellt hat,
              werden wir dieses Konto und alle zugehörigen Daten umgehend löschen.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">3. Soziale Funktionen</h2>
            <p>FinDex bietet soziale Funktionen wie:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Öffentliches Teilen von Fangfotos in der Community-Galerie</li>
              <li>Kommentare und Likes auf Fänge anderer Nutzer</li>
              <li>Freundesliste und Leaderboard</li>
            </ul>
            <p className="mt-3">
              Alle geteilten Inhalte sind Fangberichte (Fischfotos, Fangdaten, Standorte).
              Es gibt keine private Nachrichtenfunktion (Direct Messages) zwischen Nutzern.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">4. Inhaltsmoderation</h2>
            <p>
              Hochgeladene Fotos werden durch unsere KI-Fischerkennung verarbeitet.
              Nutzer können unangemessene Inhalte melden. Wir behalten uns vor,
              Inhalte zu entfernen und Konten zu sperren, die gegen unsere Nutzungsbedingungen verstoßen.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">5. Datenschutz für Minderjährige</h2>
            <p>
              Wir sammeln wissentlich keine personenbezogenen Daten von Kindern unter 13 Jahren.
              Wenn ein Elternteil oder Erziehungsberechtigter feststellt, dass ein Kind uns
              ohne Zustimmung personenbezogene Daten übermittelt hat, bitten wir um Kontaktaufnahme
              unter <a href="mailto:schumacher@nickot.is" className="text-ocean-light hover:underline">schumacher@nickot.is</a>,
              damit wir die entsprechenden Daten umgehend löschen können.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">6. Werbung und Käufe</h2>
            <p>
              Sollte FinDex zukünftig Werbung oder In-App-Käufe anbieten, werden diese
              klar gekennzeichnet und nicht gezielt an Minderjährige gerichtet.
              Personalisierte Werbung wird nur mit ausdrücklicher Zustimmung der Nutzer geschaltet.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">7. Kontakt</h2>
            <p>
              Bei Fragen zur Kindersicherheit kontaktiere uns unter:{' '}
              <a href="mailto:schumacher@nickot.is" className="text-ocean-light hover:underline">schumacher@nickot.is</a>
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-white/10 text-center text-white/50 text-sm">
          <a href="/privacy" className="text-ocean-light hover:underline mr-6">Datenschutzerklärung</a>
          <a href="/" className="text-ocean-light hover:underline">Zurück zu FinDex</a>
        </div>
      </div>
    </div>
  )
}
