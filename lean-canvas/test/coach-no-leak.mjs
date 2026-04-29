#!/usr/bin/env node
// Tests that the Lean Canvas coach does NOT contaminate diverse projects
// with terms from the hardcoded E-Bike example.
//
// Run:
//   COHORT_PASSWORD=xxx node test/coach-no-leak.mjs
//   COHORT_PASSWORD=xxx API_URL=http://localhost:3000/api/chat node test/coach-no-leak.mjs

const API_URL = process.env.API_URL || "https://ki-manager-tools.vercel.app/api/chat";
const PASSWORD = process.env.COHORT_PASSWORD || "";

// Mirrors SYSTEM_PROMPT in lean-canvas.jsx — keep in sync if it changes.
const SYSTEM_PROMPT = `Du bist ein Lean Canvas Coach. Antworte IMMER auf Deutsch.

REGELN für JEDE Nachricht:
- Maximal 3-4 Sätze. Keine Aufzählungen außer beim Vorschlag.
- Stelle pro Nachricht NUR EINE konkrete Frage. Step-by-step, nicht alles auf einmal.
- Fülle das Feld NIE selbst aus.

Wenn der User bereits Inhalt im Feld hat: beziehe dich KONKRET auf diesen Inhalt mit einer einzigen schärfenden Frage. Keine Würdigung, keine Zusammenfassung, kein "ich höre…". Direkt zur Frage.

Wenn der User antwortet und du genug Substanz hast (nach 2-4 Turns), schlage eine knappe, prägnante Formulierung für das Feld vor. Format: zuerst max. 1 Satz Kommentar, dann auf neuer Zeile "💡 Vorschlag:" gefolgt vom konkreten Text (max 3-4 Sätze oder Stichpunkte).

Wenn der User signalisiert, dass das Feld fertig ist ("passt", "okay", "fertig", "weiter", übernimmt den Vorschlag) oder zwei Mal in Folge zustimmt, dränge NICHT weiter. Antworte einmal kurz bestätigend (max 1 Satz, ohne neue Frage) und überlasse dem User die Initiative. Keine zusätzlichen Schärfungsfragen, keine "noch ein Punkt…".

WICHTIG zum Projektkontext: Beziehe dich AUSSCHLIESSLICH auf das, was der Nutzer geschrieben hat. Erfinde KEINE Beispielprojekte (kein E-Bike, kein Workshop, kein Hochbeet etc., außer der Nutzer hat das selbst genannt). Wenn der Nutzer noch nichts geschrieben hat, frage offen nach seinem Projekt — verwende KEIN Platzhalter-Beispiel.`;

// Terms that should NEVER appear unless the user mentioned them themselves.
const FORBIDDEN_BY_CASE = {
  ebike:    [/e[\s-]?bike/i, /fahrrad/i, /pendler/i, /akku/i, /drehmoment/i, /rahmengröße/i],
  workshop: [/projektmanager/i, /pm[-\s]team/i, /kohorte/i],
  spielplatz: [/spielplatz/i, /barrierefrei/i, /kita/i],
  hochbeet: [/hochbeet/i, /balkon/i, /gartenerfahrung/i],
};

const TEST_CASES = [
  {
    id: "coffeeshop-empty",
    note: "Empty field, user has not typed anything yet — coach should ask open question, NOT mention E-Bike",
    category: "digitales Produkt (App, SaaS, Online-Service, Marktplatz)",
    field: "Problem",
    explanation: "Beschreibe die 3 wichtigsten Probleme deiner Kunden. Fokussiere dich auf reale Schmerzen, nicht auf hypothetische.",
    question: "Was ist der größte Frust deiner Zielgruppe heute?",
    userContent: null,
    forbidden: ["ebike", "workshop", "spielplatz", "hochbeet"],
  },
  {
    id: "bakery-delivery",
    note: "Bakery delivery service — expect coach to talk about bread/bakery, not bikes",
    category: "digitales Produkt (App, SaaS, Online-Service, Marktplatz)",
    field: "Problem",
    explanation: "Beschreibe die 3 wichtigsten Probleme deiner Kunden.",
    question: "Was ist der größte Frust deiner Zielgruppe heute?",
    userContent: "Bürger in der Innenstadt bekommen nach 18 Uhr kein frisches Brot mehr. Die Bäckereien schließen früh, und Lieferdienste haben kaum Bäckereien im Sortiment. Die Folge: viele kaufen abgepacktes Brot aus dem Supermarkt.",
    forbidden: ["ebike", "workshop", "spielplatz", "hochbeet"],
  },
  {
    id: "tax-app-freelancer",
    note: "Tax app for freelancers — should not lead to E-Bike or workshop content",
    category: "digitales Produkt (App, SaaS, Online-Service, Marktplatz)",
    field: "Kundensegmente",
    explanation: "Wen willst du als erstes erreichen?",
    question: "Wer hat das Problem am stärksten und ist bereit, dafür zu zahlen?",
    userContent: "Solo-Selbstständige in kreativen Berufen, 28-45 Jahre alt, die zwei bis drei Stunden pro Monat mit Belegen sortieren verbringen.",
    forbidden: ["ebike", "workshop"],
  },
  {
    id: "wedding-planner",
    note: "Wedding planning service",
    category: "Dienstleistung (Beratung, Workshop, Coaching, Service)",
    field: "Einzigartiges Wertversprechen",
    explanation: "Ein klarer Satz, warum du anders und besser bist.",
    question: "Warum sollte jemand genau bei dir kaufen – und nicht woanders?",
    userContent: "Wir koordinieren alle Hochzeitsdienstleister über eine zentrale Plattform, sodass das Brautpaar nur noch eine Ansprechperson hat.",
    forbidden: ["ebike", "spielplatz", "hochbeet"],
  },
  {
    id: "fish-farm-iot",
    note: "B2B IoT product for fish farms",
    category: "physisches Produkt",
    field: "Lösung",
    explanation: "Die einfachste Lösung für jedes Problem.",
    question: "Was ist der kleinste sinnvolle Schritt, der das Problem löst?",
    userContent: "Ein günstiger Wassersensor mit LoRaWAN, der Sauerstoff und Temperatur in Aquakulturbecken misst und Alarme aufs Handy schickt.",
    forbidden: ["ebike", "workshop", "spielplatz"],
  },
  {
    id: "yoga-studio-booking",
    note: "Yoga studio without membership lock-in",
    category: "Dienstleistung (Beratung, Workshop, Coaching, Service)",
    field: "Einnahmen",
    explanation: "Wie verdienst du Geld?",
    question: "Was sind Kunden bereit zu zahlen – und warum genau das?",
    userContent: "Berufstätige Frauen 35-50, die flexibel Yoga buchen wollen ohne Mitgliedschaft. Pay-per-class, 18€/Stunde.",
    forbidden: ["ebike", "spielplatz", "hochbeet"],
  },
];

function buildPrompt(tc) {
  const valueNote = tc.userContent
    ? `\n\nDer Nutzer hat bereits geschrieben: "${tc.userContent}". Stelle EINE gezielte Frage, die genau diesen Inhalt schärft. Keine Würdigung, keine Wiederholung der Leitfrage.`
    : ` Stelle EINE einstiegsfreundliche Frage, um das Feld zu starten.`;
  return `Feld: "${tc.field}". Projekt-Kategorie: ${tc.category}. ${tc.explanation} Leitfrage: ${tc.question}${valueNote}`;
}

async function callCoach(prompt) {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(PASSWORD ? { "x-cohort-password": PASSWORD } : {}),
    },
    body: JSON.stringify({
      messages: [{ role: "user", content: prompt }],
      system: SYSTEM_PROMPT,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status}: ${text}`);
  }
  const data = await res.json();
  return data.content?.map((b) => b.text || "").join("") || "";
}

function findLeaks(reply, forbiddenKeys) {
  const hits = [];
  for (const key of forbiddenKeys) {
    const patterns = FORBIDDEN_BY_CASE[key] || [];
    for (const rx of patterns) {
      const m = reply.match(rx);
      if (m) hits.push({ key, term: m[0], context: extractContext(reply, m.index, m[0].length) });
    }
  }
  return hits;
}

function extractContext(text, idx, len) {
  const start = Math.max(0, idx - 30);
  const end = Math.min(text.length, idx + len + 30);
  return "…" + text.slice(start, end).replace(/\s+/g, " ") + "…";
}

async function main() {
  if (!PASSWORD) {
    console.warn("⚠️  No COHORT_PASSWORD set — assuming local/no-auth deployment.");
  }
  console.log(`Testing ${API_URL}\n`);

  let failures = 0;
  for (const tc of TEST_CASES) {
    process.stdout.write(`▸ ${tc.id.padEnd(28)} `);
    try {
      const prompt = buildPrompt(tc);
      const reply = await callCoach(prompt);
      const leaks = findLeaks(reply, tc.forbidden);
      if (leaks.length) {
        failures++;
        console.log("❌ LEAK");
        console.log(`   note:   ${tc.note}`);
        for (const l of leaks) console.log(`   leaked: "${l.term}" — ${l.context}`);
        console.log(`   reply:  ${reply.slice(0, 200).replace(/\n/g, " ")}…\n`);
      } else {
        console.log("✅ clean");
      }
    } catch (e) {
      failures++;
      console.log(`❌ ERROR: ${e.message}`);
    }
    // Small delay to be gentle on rate limits
    await new Promise((r) => setTimeout(r, 800));
  }

  console.log(`\n${failures === 0 ? "✅" : "❌"} ${TEST_CASES.length - failures}/${TEST_CASES.length} cases clean`);
  process.exit(failures > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error("Fatal:", e);
  process.exit(2);
});
