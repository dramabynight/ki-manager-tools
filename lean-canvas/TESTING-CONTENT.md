# Testing Content — Lean Canvas

Quick copy-paste material for testing v1.4.x. Pick a context, then use the matching block.

---

## Context: 🛒 Digitales Produkt — E-Bike Konfigurator

### Problem (Feld 1)
Online-Käufer wissen nicht, welches E-Bike zu ihrem Alltag passt. Zu viele Optionen, zu wenig persönliche Beratung. Die Angst, sich beim Kauf zu blamieren, blockiert die Entscheidung. Reviews helfen nicht, weil jeder andere Bedürfnisse hat.

### Kundensegmente (Feld 2)
Lisa, 34, Pendlerin, fährt 12 km zur Arbeit, Großstadt, Budget 2.500–4.000 €. Unsicher bei Spec-Fragen (Motor, Akku, Rahmengröße), will sich beim Kauf nicht blamieren und sucht eine vertrauenswürdige Beratung.

### Einzigartiges Wertversprechen (Feld 3)
Das erste E-Bike-Tool, das dir in 3 Minuten das perfekte Modell für deinen Alltag empfiehlt — ohne Spec-Frust, ohne Beratungsgespräch.

### Lösung (Feld 4)
Interaktiver 3-Schritt-Konfigurator: Lifestyle-Fragen (Pendelweg, Hobbys, Budget) → Modell-Empfehlungen → Vergleichsansicht mit den 3 besten Treffern.

### Kanäle (Feld 5)
SEO auf E-Bike-Keywords, Instagram Ads, YouTube-Reviews, Partnerschaft mit lokalen Fahrradläden für Probefahrten.

### Einnahmen (Feld 6)
Affiliate-Provision bei E-Bike-Kauf (5–8 %). Optional: Premium-Feature für detaillierten Vergleich (4,99 € einmalig).

### Kostenstruktur (Feld 7)
Entwicklung des Konfigurators, Hosting, SEA-Budget, UX-Design, Datenpflege der Modell-Datenbank.

### Kennzahlen (Feld 8)
Konfigurations-Abschlussrate, Conversion zu Kauf, durchschnittliche Sitzungsdauer, NPS.

### Unfairer Vorteil (Feld 9)
Proprietärer Datensatz aus 10.000 Kundenprofilen mit echten Nutzungsmustern. Direkter Datenzugang zu drei großen E-Bike-Herstellern.

---

## Context: 🎨 Dienstleistung — KI-Workshop

### Problem
Projektmanager:innen stehen vor KI-Tools, wissen aber nicht, wo sie sinnvoll anfangen sollen. Allgemeine Trainings sind zu theoretisch, eigene Versuche frustrieren. Es fehlt Begleitung am echten Projekt.

### Kundensegmente
Projektmanager:innen in Konzernen, 30–50 J., verantwortlich für Teams von 5–20 Personen, mittlere Tech-Affinität, zeitlich unter Druck.

---

## Test-Szenarien

### A. Geführter Modus — frisches Feld
1. Default beim Laden: **Geführter Modus**. Kontext: Digitales Produkt.
2. Coach stellt EINE Frage zum Problem-Feld.
3. Antworte: *„Lisa, 34, pendelt täglich 12 km, weiß nicht welches E-Bike passt"*
4. Coach schärft mit einer einzigen Folgefrage.
5. Antworte: *„Das wirklich Frustrierende ist die Auswahl-Lähmung — sie scrollt seit Wochen"*
6. Nach 2–4 Turns: Coach liefert `💡 Vorschlag:` — grüner Button erscheint.
7. **„Vorschlag übernehmen"** klicken → Feld füllt sich, springt zu Schritt 2.

### B. Geführter Modus — bestehender Inhalt
1. In Selbst-Modus: Problem-Feld füllen mit Block oben.
2. Auf Geführt umschalten.
3. Coach soll konkret auf den eingegebenen Text Bezug nehmen, **keine generische Einstiegsfrage**.

### C. Coach stoppt
1. In Geführt: nach 2–3 Antworten sage *„passt"* oder *„fertig"*.
2. Coach soll **kurz bestätigen, ohne neue Frage**.

### D. Skip-and-Recover
1. In Geführt direkt auf das Feld „Unfairer Vorteil" (9) klicken.
2. Felder 2–8 leer lassen.
3. Unten: Button zeigt **„Zu Kundensegmente →"** (nicht „Fertig").
4. Indikator **„Noch 8 Felder leer"** sichtbar.

### E. Field-Info-Popover
1. Auf das `ⓘ` bei einem schmalen Feld (z.B. Lösung, Kanäle) klicken.
2. Popover erscheint **rechtsbündig unter dem Button**, schwebt über andere Felder, nicht abgeschnitten.
3. Klick außerhalb oder auf X schließt es.

### F. Export
1. Mehrere Felder füllen.
2. **„Als Markdown herunterladen"** → `.md` Datei.
3. **„Als Text kopieren"** → in beliebigen Editor einfügen.

### G. Auth
1. Inkognito-Tab öffnen → Passwort-Modal erscheint.
2. Falsches Passwort → Fehler-Hinweis.
3. Richtiges Passwort → Tool freigeschaltet, Modal weg.

### H. Persistence
1. Felder füllen, Seite neu laden → Inhalt bleibt.
2. „Canvas leeren" → Bestätigung → alle Felder leer (Passwort bleibt).

---

## Quick-Stress-Snippets

**Coach soll sofort antworten — kurze User-Eingaben:**
- *„weiß nicht"*
- *„pass passt"*
- *„hilf mir mehr"*
- *„gib mir nen Beispiel"*

**Lange User-Eingaben (Markdown-Render testen):**
```
Eigentlich denke ich an drei Probleme:
1. **Auswahllähmung** — zu viele Modelle
2. **Spec-Sprache** — niemand versteht Drehmoment
3. **Vertrauen** — Reviews sind oft gefakt
```
→ Bold-Rendering im Chat prüfen.
