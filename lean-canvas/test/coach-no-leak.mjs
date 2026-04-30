#!/usr/bin/env node
// Tests that the Lean Canvas coach behaves correctly:
//   1. Does NOT contaminate diverse projects with example terms (the v1.4.11 bug).
//   2. Carries prior-field context forward when advancing through guided steps.
//   3. Emits suggestions in the exact "💡 Vorschlag:" format the frontend parses.
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
  // ── Single-turn contamination checks ────────────────────────────────────────
  {
    id: "coffeeshop-empty",
    note: "Empty field — coach should ask open question, NOT mention E-Bike",
    category: "digitales Produkt (App, SaaS, Online-Service, Marktplatz)",
    field: "Problem",
    explanation: "Beschreibe die 3 wichtigsten Probleme deiner Kunden. Fokussiere dich auf reale Schmerzen, nicht auf hypothetische.",
    question: "Was ist der größte Frust deiner Zielgruppe heute?",
    userContent: null,
    forbidden: ["ebike", "workshop", "spielplatz", "hochbeet"],
  },
  {
    id: "bakery-delivery",
    note: "Bakery delivery — expect coach to talk about bread/bakery, not bikes",
    category: "digitales Produkt (App, SaaS, Online-Service, Marktplatz)",
    field: "Problem",
    explanation: "Beschreibe die 3 wichtigsten Probleme deiner Kunden.",
    question: "Was ist der größte Frust deiner Zielgruppe heute?",
    userContent: "Bürger in der Innenstadt bekommen nach 18 Uhr kein frisches Brot mehr. Die Bäckereien schließen früh, und Lieferdienste haben kaum Bäckereien im Sortiment. Die Folge: viele kaufen abgepacktes Brot aus dem Supermarkt.",
    forbidden: ["ebike", "workshop", "spielplatz", "hochbeet"],
  },
  {
    id: "tax-app-freelancer",
    note: "Tax app for freelancers",
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

  // ── Cross-field carry-over ──────────────────────────────────────────────────
  // Mimics the app: user filled Problem with bakery content, now advances to
  // empty Kundensegmente. Coach's first message MUST reference the bakery
  // context, not ask a generic question or invent a different project.
  {
    id: "carryover-bakery→customers",
    note: "Problem filled with bakery; advancing to Kundensegmente — coach must reference bakery context",
    category: "digitales Produkt (App, SaaS, Online-Service, Marktplatz)",
    field: "Kundensegmente",
    explanation: "Wen willst du als erstes erreichen? Beschreibe eine konkrete Persona, nicht eine vage Gruppe.",
    question: "Wer hat das Problem am stärksten und ist bereit, dafür zu zahlen?",
    userContent: null,
    filledFields: {
      Problem: "Bürger in der Innenstadt bekommen nach 18 Uhr kein frisches Brot mehr. Die Bäckereien schließen früh, und Lieferdienste haben kaum Bäckereien im Sortiment.",
    },
    forbidden: ["ebike", "workshop", "spielplatz", "hochbeet"],
    requiredTerms: [/bäcker/i, /brot/i, /lieferdienst/i, /innenstadt/i, /backwaren/i, /frisch/i],
  },

  // ── Suggestion format ───────────────────────────────────────────────────────
  // Multi-turn: build up substance, then explicitly invite a suggestion.
  // The frontend parses on the literal string "💡 Vorschlag:" — if that drifts
  // (e.g. "**Vorschlag:**" or no emoji), the adopt button silently never shows.
  {
    id: "suggestion-format-yoga",
    note: "After 3 substantive turns + explicit invite, coach must emit literal '💡 Vorschlag:'",
    mode: "multiturn",
    category: "Dienstleistung (Beratung, Workshop, Coaching, Service)",
    field: "Einzigartiges Wertversprechen",
    explanation: "Ein klarer Satz, warum du anders und besser bist.",
    question: "Warum sollte jemand genau bei dir kaufen – und nicht woanders?",
    userContent: "Yoga-Studio nur für Berufstätige Frauen 35-50, ohne Mitgliedschaft, pay-per-class.",
    turns: [
      "Was sie woanders nicht bekommen: keine Mitgliedschaft, keine Verpflichtung. Sie können buchen wie es in ihre Woche passt.",
      "Konkurrenz hat alle 10er-Karten oder Monatsabos. Wir sind die einzigen mit echter Pay-per-class ohne Bindung in der Stadt.",
      "Okay ich glaube wir haben jetzt genug. Kannst du mir bitte einen knappen Vorschlag formulieren, den ich ins Feld übernehmen kann?",
    ],
    forbidden: ["ebike", "spielplatz", "hochbeet"],
    requiredPatternInFinal: /💡 Vorschlag:/,
  },
];

function buildInitialPrompt(tc) {
  let filledNote = "";
  if (tc.filledFields && Object.keys(tc.filledFields).length) {
    const lines = Object.entries(tc.filledFields).map(([k, v]) => `${k}: ${v}`).join("\n");
    filledNote = `\n\nBereits ausgefüllte Felder (zur Orientierung):\n${lines}`;
  }
  const valueNote = tc.userContent
    ? `\n\nDer Nutzer hat bereits geschrieben: "${tc.userContent}". Stelle EINE gezielte Frage, die genau diesen Inhalt schärft. Keine Würdigung, keine Wiederholung der Leitfrage.`
    : ` Stelle EINE einstiegsfreundliche Frage, um das Feld zu starten.`;
  return `Feld: "${tc.field}". Projekt-Kategorie: ${tc.category}. ${tc.explanation} Leitfrage: ${tc.question}${filledNote}${valueNote}`;
}

// Mirrors lean-canvas.jsx sendChatMessage: the API call always re-sends the
// full history prefixed with a per-field context message.
function buildSubsequentMessages(tc, history) {
  const currentValPrefix = tc.userContent ? ` Der Nutzer hat aktuell folgenden Inhalt im Feld: "${tc.userContent}".` : "";
  return [
    { role: "user", content: `Feld: "${tc.field}". Projekt-Kategorie: ${tc.category}. ${tc.explanation}${currentValPrefix}` },
    ...history,
  ];
}

async function callCoach(messages) {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(PASSWORD ? { "x-cohort-password": PASSWORD } : {}),
    },
    body: JSON.stringify({ messages, system: SYSTEM_PROMPT }),
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

function findRequiredTermHit(reply, terms) {
  for (const rx of terms) {
    const m = reply.match(rx);
    if (m) return m[0];
  }
  return null;
}

async function runSingleTurn(tc) {
  const reply = await callCoach([{ role: "user", content: buildInitialPrompt(tc) }]);
  return { firstReply: reply, finalReply: reply };
}

async function runMultiTurn(tc) {
  // First call: same as single-turn — initial prompt with field context.
  const history = [{ role: "user", content: buildInitialPrompt(tc) }];
  let firstReply = await callCoach(history);
  history.push({ role: "assistant", content: firstReply });

  // Subsequent user turns mimic the app's sendChatMessage: rebuild the prefix
  // and append the running history before sending.
  let lastReply = firstReply;
  for (const userMsg of tc.turns || []) {
    history.push({ role: "user", content: userMsg });
    const apiMessages = buildSubsequentMessages(tc, history);
    lastReply = await callCoach(apiMessages);
    history.push({ role: "assistant", content: lastReply });
    await new Promise((r) => setTimeout(r, 600));
  }
  return { firstReply, finalReply: lastReply };
}

async function main() {
  if (!PASSWORD) {
    console.warn("⚠️  No COHORT_PASSWORD set — assuming local/no-auth deployment.");
  }
  console.log(`Testing ${API_URL}\n`);

  let failures = 0;
  for (const tc of TEST_CASES) {
    process.stdout.write(`▸ ${tc.id.padEnd(32)} `);
    try {
      const { firstReply, finalReply } = tc.mode === "multiturn"
        ? await runMultiTurn(tc)
        : await runSingleTurn(tc);

      const problems = [];

      // Contamination check (always against first reply for single-turn,
      // against final reply for multi-turn since drift could appear later)
      const replyToCheck = tc.mode === "multiturn" ? finalReply : firstReply;
      const leaks = findLeaks(replyToCheck, tc.forbidden);
      if (leaks.length) {
        problems.push({ kind: "leak", details: leaks });
      }

      // Required-terms check (positive assertion that coach picked up context)
      if (tc.requiredTerms) {
        const hit = findRequiredTermHit(firstReply, tc.requiredTerms);
        if (!hit) {
          problems.push({
            kind: "missing-context",
            details: `none of [${tc.requiredTerms.map((r) => r.source).join(", ")}] appeared`,
          });
        }
      }

      // Required-pattern check on final reply (suggestion format)
      if (tc.requiredPatternInFinal) {
        if (!tc.requiredPatternInFinal.test(finalReply)) {
          problems.push({
            kind: "missing-pattern",
            details: `${tc.requiredPatternInFinal} not found in final reply`,
          });
        }
      }

      if (problems.length === 0) {
        console.log("✅ clean");
      } else {
        failures++;
        console.log("❌ FAIL");
        console.log(`   note: ${tc.note}`);
        for (const p of problems) {
          if (p.kind === "leak") {
            for (const l of p.details) console.log(`   leaked: "${l.term}" — ${l.context}`);
          } else if (p.kind === "missing-context") {
            console.log(`   missing context: ${p.details}`);
          } else if (p.kind === "missing-pattern") {
            console.log(`   missing pattern: ${p.details}`);
          }
        }
        console.log(`   first:  ${firstReply.slice(0, 200).replace(/\n/g, " ")}…`);
        if (tc.mode === "multiturn") {
          console.log(`   final:  ${finalReply.slice(0, 240).replace(/\n/g, " ")}…`);
        }
        console.log("");
      }
    } catch (e) {
      failures++;
      console.log(`❌ ERROR: ${e.message}`);
    }
    await new Promise((r) => setTimeout(r, 800));
  }

  console.log(`\n${failures === 0 ? "✅" : "❌"} ${TEST_CASES.length - failures}/${TEST_CASES.length} cases pass`);
  process.exit(failures > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error("Fatal:", e);
  process.exit(2);
});
