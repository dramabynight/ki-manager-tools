import { useState, useEffect, useRef } from "react";

// ── Config ────────────────────────────────────────────────────────────────────
const CLAUDE_MODEL = "claude-sonnet-4-6";
// false → Claude Artifact (direct API, no key needed)
// true  → Standalone deployment (proxies through /api/chat)
const USE_PROXY = true;

// ── Constants ─────────────────────────────────────────────────────────────────
const GOOGLE_FONT = `@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap');`;

const CONTEXTS = {
  digital:   { label: "🛒 Digitales Produkt",        example: "E-Bike Konfigurator für Online-Shop", short: "E-Bike Konfigurator" },
  service:   { label: "🎨 Dienstleistung",             example: "KI-Workshop für Projektmanager",      short: "KI-Workshop" },
  nonprofit: { label: "🌱 Non-Profit / Social Impact", example: "Inklusiver Spielplatz-Finder",        short: "Spielplatz-Finder", isNonprofit: true },
  physical:  { label: "🏭 Physisches Produkt",         example: "Modulares Hochbeet für Balkone",      short: "Modulares Hochbeet" },
};

const FIELD_HELP = {
  problem:   { label: "Problem",                       explanation: "Beschreibe die 3 wichtigsten Probleme deiner Kunden. Fokussiere dich auf reale Schmerzen, nicht auf hypothetische.", question: "Was ist der größte Frust deiner Zielgruppe heute?",                                       examples: { digital: "Online-Käufer wissen nicht, welches E-Bike zu ihrem Alltag passt – zu viele Optionen, zu wenig persönliche Beratung.", service: "PM-Teams stehen vor KI-Tools, wissen aber nicht, wo sie sinnvoll anfangen sollen.", nonprofit: "Eltern mit mobilitätseingeschränkten Kindern finden keine barrierefreien Spielplätze.", physical: "Balkon-Gärtner haben wenig Platz und wissen nicht, wie sie platzsparend anbauen können." } },
  customers: { label: "Kundensegmente",                explanation: "Wen willst du als erstes erreichen? Beschreibe eine konkrete Persona, nicht eine vage Gruppe.",                      question: "Wer hat das Problem am stärksten und ist bereit, dafür zu zahlen?",                          examples: { digital: "Urban Commuter, 28–45 J., Großstadt, pendelt täglich, Budget 2.500–4.000 €.", service: "Projektmanager in Konzernen, 30–50 J., verantwortlich für Teams von 5–20 Personen.", nonprofit: "Eltern von Kindern mit körperlicher Einschränkung, 25–45 J., urban, aktiv in Eltern-Communitys.", physical: "Urban Gardener, Mieter mit Balkon, 25–40 J., nachhaltigkeitsbewusst, keine Gartenerfahrung." } },
  uvp:       { label: "Einzigartiges Wertversprechen", explanation: "Ein klarer Satz, warum du anders und besser bist. Was macht dein Angebot unverwechselbar?",                        question: "Warum sollte jemand genau bei dir kaufen – und nicht woanders?",                              examples: { digital: "Das erste E-Bike-Tool, das dir in 3 Minuten das perfekte Modell für deinen Alltag empfiehlt.", service: "KI-Skills lernen anhand echter Projekte – kein Theorie-Overhead.", nonprofit: "Barrierefreie Spielplätze finden – so einfach wie Google Maps.", physical: "Balkongarten ohne Bohren, ohne Frust – in 20 Minuten aufgebaut." } },
  solution:  { label: "Lösung",                        explanation: "Die einfachste Lösung für jedes Problem. Noch keine Features – nur das Kernkonzept.",                              question: "Was ist der kleinste sinnvolle Schritt, der das Problem löst?",                               examples: { digital: "Interaktiver 3-Schritt-Konfigurator mit Lifestyle-Fragen und passenden Modell-Empfehlungen.", service: "1-Tages-Workshop mit konkreten Anwendungsfällen direkt aus dem PM-Alltag.", nonprofit: "Kartenbasierte App mit gefilterten Spielplätzen nach Barrierefreiheitskriterien.", physical: "Modulares Hochbeet-System aus 3 Grundmodulen, steckbar ohne Werkzeug." } },
  channels:  { label: "Kanäle",                        explanation: "Wie erreichst du deine Kunden? Von Awareness bis After-Sales.",                                                     question: "Wo ist deine Zielgruppe schon unterwegs – online und offline?",                               examples: { digital: "SEO auf E-Bike-Keywords, Instagram Ads, YouTube-Reviews, Partnerschaft mit Fahrradläden.", service: "LinkedIn, PM-Konferenzen, Unternehmens-Newsletter, Weiterempfehlung.", nonprofit: "Eltern-Facebook-Gruppen, Kita-Verteiler, lokale Presse, Kooperation mit Behindertenverbänden.", physical: "Instagram Gardening-Community, Pinterest, DM/OBI-Regalplatz, Craft-Messen." } },
  revenue:   { label: "Einnahmen",                     explanation: "Wie verdienst du Geld? Mit welchem Modell und welchem Preis?",                                                      question: "Was sind Kunden bereit zu zahlen – und warum genau das?",                                     examples: { digital: "Affiliate-Provision bei E-Bike-Kauf (5–8%), optional: Premium-Feature.", service: "Workshop: 890 €/Person, Firmen-Paket: 4.800 €, Follow-up Coaching: 150 €/h.", nonprofit: "Fördergelder, Gemeinde-Kooperationen, freiwillige App-Spenden.", physical: "Starter-Set 89 €, Erweiterungs-Module 29–49 €, Bundle-Rabatte." } },
  costs:     { label: "Kostenstruktur",                explanation: "Welche sind deine größten Kostenpositionen in der Frühphase?",                                                      question: "Was kostet dich am meisten – Entwicklung, Marketing, Personal oder Material?",                examples: { digital: "Entwicklung (Konfigurator), Hosting, SEA-Budget, UX-Design.", service: "Trainerzeit, Raummiete, Materialerstellung, Marketing.", nonprofit: "App-Entwicklung, Community-Management, Partnerschaftspflege.", physical: "Produktion, Lagerkosten, Versand, Messe-Auftritte." } },
  metrics:   { label: "Kennzahlen",                    explanation: "Welche 3–5 Zahlen zeigen dir, ob dein Geschäftsmodell funktioniert?",                                               question: "Woran merkst du konkret, dass du auf dem richtigen Weg bist?",                                examples: { digital: "Konfigurations-Abschlussrate, Conversion zu Kauf, Ø Sitzungsdauer, NPS.", service: "Teilnehmerzahl/Quartal, Wiederbuchungsrate, Weiterempfehlungsrate, Auslastung.", nonprofit: "Aktive Nutzer/Monat, Anzahl gelisteter Spielplätze, Bewertungen.", physical: "Verkaufte Sets/Monat, Retourenquote, Kundenzufriedenheit, Wiederkaufsrate." } },
  unfair:    { label: "Unfairer Vorteil",              explanation: "Was kann dir niemand so leicht nachmachen? Das ist dein schwer kopierbarer Vorteil.",                             question: "Was hast du, was Wettbewerber nicht haben – Wissen, Netzwerk, Daten, Erfahrung?",              examples: { digital: "Proprietärer Datensatz aus 10.000 Kundenprofilen mit echten Nutzungsmustern.", service: "15 Jahre PM-Erfahrung + exklusives Trainer-Netzwerk mit KI-Spezialisten.", nonprofit: "Partnerschaft mit 12 Kommunen und direkter Datenzugang zu Spielplatz-Datenbanken.", physical: "Patentiertes Stecksystem und exklusiver Materialeinkauf bei Hersteller." } },
};

const NONPROFIT_LABELS = { revenue: "Wirkung / Impact", costs: "Ressourcen", metrics: "Erfolgsindikatoren" };

const FIELD_COLORS = {
  problem:   { bg: "#F2E8E4", header: "#C17B5A", light: "#FBF5F2" },
  solution:  { bg: "#E4EDE8", header: "#5A8A6B", light: "#F2F8F4" },
  uvp:       { bg: "#E4E8F0", header: "#5A6B8A", light: "#F2F4F8" },
  unfair:    { bg: "#EDE4E8", header: "#8A5A6B", light: "#F8F2F4" },
  customers: { bg: "#EDE8E0", header: "#8A7A5A", light: "#F8F5EE" },
  metrics:   { bg: "#E0EDE8", header: "#5A8A7A", light: "#EEF8F5" },
  channels:  { bg: "#E8E0ED", header: "#7A5A8A", light: "#F5EEF8" },
  costs:     { bg: "#EDE4E0", header: "#8A6A5A", light: "#F8F2EE" },
  revenue:   { bg: "#E0E8ED", header: "#5A7A8A", light: "#EEF5F8" },
};

// Ideal sequence for guided coaching (Ash Maurya order)
const GUIDED_SEQUENCE = ["problem", "customers", "uvp", "solution", "channels", "revenue", "costs", "metrics", "unfair"];

const SYSTEM_PROMPT = `Du bist ein Lean Canvas Coach. Antworte IMMER auf Deutsch. Hilf dem User EIN spezifisches Feld auszufüllen. Stelle 1-2 gezielte, konkrete Fragen. Fülle das Feld NIE selbst aus. Wenn der User antwortet, fasse kurz zusammen und schlage eine knappe, prägnante Formulierung vor (maximal 3-4 Sätze oder Stichpunkte). Formatiere deinen Formulierungsvorschlag mit dem Präfix "💡 Vorschlag:". Halte dich kurz und fokussiert.`;

// ── API helper ────────────────────────────────────────────────────────────────
async function callClaude(messages, system) {
  if (USE_PROXY) {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages, system }),
    });
    return res.json();
  }
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: CLAUDE_MODEL, max_tokens: 1000, system, messages }),
  });
  return res.json();
}

// ── GuidedPanel ───────────────────────────────────────────────────────────────
function GuidedPanel({
  currentFieldKey, currentStep, totalSteps, colors, label,
  msgs, loading, chatInput, hasSuggestion, chatEndRef,
  onSendMessage, onChatInputChange, onAdoptSuggestion, onNext, onBack,
}) {
  const progress = ((currentStep + 1) / totalSteps) * 100;
  const isLast = currentStep === totalSteps - 1;

  return (
    <div style={{
      width: 340, flexShrink: 0,
      background: "#fff",
      border: "1px solid #ECEAE6",
      borderTop: `3px solid ${colors.header}`,
      borderRadius: 10,
      display: "flex",
      flexDirection: "column",
      position: "sticky",
      top: 24,
      maxHeight: "calc(100vh - 48px)",
      overflow: "hidden",
      boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
    }}>
      {/* Header */}
      <div style={{ background: "#fff", color: "#1A1A1A", padding: "12px 16px 10px", flexShrink: 0, borderBottom: "1px solid #ECEAE6" }}>
        <div style={{ fontSize: 11, color: "#7a7069", letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 3, fontWeight: 600 }}>
          Schritt {currentStep + 1} von {totalSteps}
        </div>
        <div style={{ fontWeight: 700, fontSize: 15, color: "#1A1A1A" }}>{label}</div>
        <div style={{ height: 3, background: "#F2F2F0", borderRadius: 2, marginTop: 10 }}>
          <div style={{ height: "100%", width: `${progress}%`, background: colors.header, borderRadius: 2, transition: "width 0.4s ease" }} />
        </div>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1, overflowY: "auto", padding: "12px 14px",
        display: "flex", flexDirection: "column", gap: 8,
        minHeight: 180, maxHeight: 360,
      }}>
        {msgs.length === 0 && loading && (
          <div style={{ color: "#999", fontSize: 12, fontStyle: "italic" }}>KI-Coach lädt…</div>
        )}
        {msgs.map((msg, i) => (
          <div key={i} style={{
            alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
            background: msg.role === "user" ? colors.header : colors.bg,
            color: msg.role === "user" ? "#fff" : "#333",
            borderRadius: msg.role === "user" ? "12px 12px 2px 12px" : "12px 12px 12px 2px",
            padding: "8px 11px", fontSize: 13, maxWidth: "92%", lineHeight: 1.55, whiteSpace: "pre-wrap",
          }}>
            {msg.content}
          </div>
        ))}
        {loading && msgs.length > 0 && (
          <div style={{ fontSize: 12, color: "#999", fontStyle: "italic" }}>Schreibe…</div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Adopt suggestion */}
      {hasSuggestion && (
        <div style={{ padding: "8px 14px", borderTop: `1px solid ${colors.bg}`, flexShrink: 0 }}>
          <button
            onClick={() => onAdoptSuggestion(currentFieldKey)}
            style={{
              background: colors.header, color: "#fff", border: "none", borderRadius: 10,
              padding: "8px 14px", fontSize: 13, cursor: "pointer", fontWeight: 600, width: "100%",
            }}
          >✅ Vorschlag ins Feld übernehmen</button>
        </div>
      )}

      {/* Input */}
      <div style={{ display: "flex", gap: 6, padding: "8px 12px", borderTop: `1px solid ${colors.bg}`, flexShrink: 0 }}>
        <input
          value={chatInput}
          onChange={(e) => onChatInputChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && onSendMessage(currentFieldKey)}
          placeholder="Antworten…"
          style={{
            flex: 1, border: `1.5px solid ${colors.bg}`, borderRadius: 8,
            padding: "7px 11px", fontSize: 13, fontFamily: "Plus Jakarta Sans, sans-serif",
            outline: "none", background: "#fff", color: "#333",
          }}
        />
        <button
          onClick={() => onSendMessage(currentFieldKey)}
          disabled={loading || !chatInput.trim()}
          style={{
            background: colors.header, color: "#fff", border: "none", borderRadius: 8,
            padding: "7px 13px", fontSize: 14, cursor: loading ? "not-allowed" : "pointer",
            opacity: loading || !chatInput.trim() ? 0.5 : 1, fontWeight: 600,
          }}
        >→</button>
      </div>

      {/* Navigation */}
      <div style={{
        display: "flex", justifyContent: "space-between", padding: "10px 14px",
        borderTop: `1px solid ${colors.bg}`, flexShrink: 0,
      }}>
        <button
          onClick={onBack}
          disabled={currentStep === 0}
          style={{
            background: "transparent",
            color: currentStep === 0 ? "#ccc" : colors.header,
            border: `1.5px solid ${currentStep === 0 ? "#eee" : colors.bg}`,
            borderRadius: 8, padding: "7px 14px", fontSize: 13,
            cursor: currentStep === 0 ? "not-allowed" : "pointer",
            fontFamily: "Plus Jakarta Sans, sans-serif", fontWeight: 500,
          }}
        >← Zurück</button>
        <button
          onClick={onNext}
          style={{
            background: isLast ? colors.header : colors.bg,
            color: isLast ? "#fff" : "#555",
            border: "none", borderRadius: 8, padding: "7px 16px", fontSize: 13,
            cursor: "pointer", fontFamily: "Plus Jakarta Sans, sans-serif", fontWeight: 600,
          }}
        >{isLast ? "✓ Fertig" : "Weiter →"}</button>
      </div>
    </div>
  );
}

// ── FieldCard ─────────────────────────────────────────────────────────────────
// Defined at module level to prevent re-mounting on every parent render.
function FieldCard({
  fieldKey, gridStyle, colors, label, help, contextKey, contextShort,
  mode, fieldValue, isHelpOpen, isActive, stepNumber,
  onFieldChange, onToggleHelp, onActivate,
}) {
  const isFilled = !!fieldValue?.trim();
  return (
    <div
      onClick={mode === "guided" ? () => onActivate(fieldKey) : undefined}
      style={{
        ...gridStyle,
        position: "relative",
        background: "#fff",
        borderRadius: 10,
        boxShadow: isActive ? `0 0 0 2px ${colors.header}` : "none",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        border: "1px solid #ECEAE6",
        borderTop: `3px solid ${colors.header}`,
        transition: "box-shadow 0.15s, border 0.15s",
        cursor: mode === "guided" ? "pointer" : "default",
      }}
    >
      {/* Header */}
      <div style={{
        padding: "10px 12px 4px",
        display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
          <span style={{
            background: colors.light, color: colors.header,
            border: `1px solid ${colors.bg}`, borderRadius: 5,
            padding: "1px 6px", fontSize: 11, fontWeight: 700, letterSpacing: 0.3,
            flexShrink: 0,
          }}>{stepNumber}</span>
          <span style={{ fontWeight: 600, fontSize: 13, color: "#1A1A1A", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{label}</span>
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center", flexShrink: 0 }}>
          {isFilled && (
            <span title="Gespeichert" style={{ color: "#5A8A6B", fontSize: 14, fontWeight: 700, lineHeight: 1 }}>✓</span>
          )}
          {isActive && (
            <span style={{ fontSize: 10, background: colors.header, color: "#fff", borderRadius: 4, padding: "1px 6px", fontWeight: 600, letterSpacing: 0.4 }}>
              AKTIV
            </span>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); onToggleHelp(isHelpOpen ? null : fieldKey); }}
            title="Mehr Infos & Beispiel"
            style={{
              background: isHelpOpen ? "#F2F2F2" : "transparent",
              border: "1px solid #E5E3DF", borderRadius: 4, color: "#7a7069",
              fontSize: 11, cursor: "pointer", padding: "1px 6px", fontWeight: 700,
            }}
          >?</button>
        </div>
      </div>

      {/* Always-visible leitfrage */}
      <div style={{ padding: "0 12px 6px", color: "#7a7069", fontSize: 12, fontStyle: "italic", lineHeight: 1.4, flexShrink: 0 }}>
        {help.question}
      </div>

      {/* Help panel (explanation + context-specific example) */}
      {isHelpOpen && (
        <div style={{
          background: "#FAFAF8", padding: "8px 12px", fontSize: 12,
          color: "#4a4a4a", borderTop: "1px solid #ECEAE6", borderBottom: "1px solid #ECEAE6", flexShrink: 0,
        }}>
          <p style={{ margin: "0 0 4px", color: "#3a3a3a" }}>{help.explanation}</p>
          <p style={{ margin: 0, color: "#7a7069" }}>
            <strong style={{ color: colors.header }}>Beispiel ({contextShort}):</strong> {help.examples[contextKey]}
          </p>
        </div>
      )}

      {/* Textarea */}
      <textarea
        value={fieldValue}
        onChange={(e) => { e.stopPropagation(); onFieldChange(fieldKey, e.target.value); }}
        onClick={(e) => e.stopPropagation()}
        placeholder={`z.B.: ${help.examples[contextKey]}`}
        style={{
          flex: 1, border: "none", background: "transparent", resize: "none",
          padding: "4px 12px 12px", fontFamily: "Plus Jakarta Sans, sans-serif",
          fontSize: 13, color: "#1A1A1A", outline: "none", minHeight: 50, lineHeight: 1.5,
        }}
      />
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function LeanCanvas() {
  const [context, setContext] = useState("digital");
  const [mode, setMode] = useState("self");
  const [fields, setFields] = useState({});
  const [helpOpen, setHelpOpen] = useState(null);
  const [guidedStep, setGuidedStep] = useState(0);
  const [chatMessages, setChatMessages] = useState({});
  const [chatInput, setChatInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [suggestion, setSuggestion] = useState({});
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const chatEndRef = useRef(null);

  // Persist to localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("lean-canvas-data");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.fields) setFields(parsed.fields);
        if (parsed.context) setContext(parsed.context);
      }
    } catch (e) {}
  }, []);

  useEffect(() => {
    try { localStorage.setItem("lean-canvas-data", JSON.stringify({ fields, context })); } catch (e) {}
  }, [fields, context]);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, guidedStep]);

  // Initialize guided chat when step changes
  useEffect(() => {
    if (mode !== "guided") return;
    const fieldKey = GUIDED_SEQUENCE[guidedStep];
    if (chatMessages[fieldKey]?.length > 0) return;

    const help = FIELD_HELP[fieldKey];
    const isNonprofit = CONTEXTS[context]?.isNonprofit;
    const fieldLabel = (isNonprofit && NONPROFIT_LABELS[fieldKey]) ? NONPROFIT_LABELS[fieldKey] : help.label;

    // Pass already-filled fields as context to the coach
    const filledContext = GUIDED_SEQUENCE
      .filter(k => fields[k] && k !== fieldKey)
      .map(k => {
        const lbl = (isNonprofit && NONPROFIT_LABELS[k]) ? NONPROFIT_LABELS[k] : FIELD_HELP[k].label;
        return `${lbl}: ${fields[k]}`;
      })
      .join("\n");

    const contextNote = filledContext ? `\n\nBereits ausgefüllte Felder (zur Orientierung):\n${filledContext}` : "";
    const prompt = `Hilf mir das Feld "${fieldLabel}" im Lean Canvas auszufüllen. Kontext: ${CONTEXTS[context].example}. ${help.explanation} Leitfrage: ${help.question}${contextNote}`;

    setChatMessages(prev => ({ ...prev, [fieldKey]: [] }));
    setLoading(true);

    callClaude([{ role: "user", content: prompt }], SYSTEM_PROMPT)
      .then(data => {
        const reply = data.content?.map(b => b.text || "").join("") || "Fehler beim Laden.";
        setChatMessages(prev => ({ ...prev, [fieldKey]: [{ role: "assistant", content: reply }] }));
      })
      .catch(() => {
        setChatMessages(prev => ({ ...prev, [fieldKey]: [{ role: "assistant", content: "Verbindungsfehler. Bitte versuche es erneut." }] }));
      })
      .finally(() => setLoading(false));
  }, [guidedStep, mode]); // eslint-disable-line

  const getFieldLabel = (fieldKey) => {
    if (CONTEXTS[context]?.isNonprofit && NONPROFIT_LABELS[fieldKey]) return NONPROFIT_LABELS[fieldKey];
    return FIELD_HELP[fieldKey]?.label;
  };

  const handleFieldChange = (fieldKey, value) => setFields(prev => ({ ...prev, [fieldKey]: value }));

  const sendChatMessage = async (fieldKey) => {
    if (!chatInput.trim() || loading) return;
    const userMsg = chatInput.trim();
    setChatInput("");
    const existing = chatMessages[fieldKey] || [];
    const newMessages = [...existing, { role: "user", content: userMsg }];
    setChatMessages(prev => ({ ...prev, [fieldKey]: newMessages }));
    setLoading(true);

    const help = FIELD_HELP[fieldKey];
    const apiMessages = [
      { role: "user", content: `Feld: "${getFieldLabel(fieldKey)}". Kontext: ${CONTEXTS[context].example}. ${help.explanation}` },
      ...newMessages,
    ];

    try {
      const data = await callClaude(apiMessages, SYSTEM_PROMPT);
      const reply = data.content?.map(b => b.text || "").join("") || "Fehler.";
      const updated = [...newMessages, { role: "assistant", content: reply }];
      setChatMessages(prev => ({ ...prev, [fieldKey]: updated }));
      if (reply.includes("💡 Vorschlag:")) {
        const text = reply.split("💡 Vorschlag:")[1]?.trim();
        if (text) setSuggestion(prev => ({ ...prev, [fieldKey]: text }));
      }
    } catch (e) {
      setChatMessages(prev => ({ ...prev, [fieldKey]: [...newMessages, { role: "assistant", content: "Verbindungsfehler." }] }));
    }
    setLoading(false);
  };

  const adoptSuggestion = (fieldKey) => {
    if (!suggestion[fieldKey]) return;
    handleFieldChange(fieldKey, suggestion[fieldKey]);
    setSuggestion(prev => ({ ...prev, [fieldKey]: null }));
    // Auto-advance in guided mode after a short pause so user sees the field fill
    if (mode === "guided" && guidedStep < GUIDED_SEQUENCE.length - 1) {
      setTimeout(() => { setGuidedStep(s => s + 1); setChatInput(""); }, 600);
    }
  };

  const goToStep = (step) => { setGuidedStep(step); setChatInput(""); };

  const activateField = (fieldKey) => {
    const idx = GUIDED_SEQUENCE.indexOf(fieldKey);
    if (idx !== -1) goToStep(idx);
  };

  const copyAsText = () => {
    const lines = Object.keys(FIELD_HELP).map(k => `${getFieldLabel(k)}:\n${fields[k] || "(leer)"}`);
    navigator.clipboard.writeText(lines.join("\n\n"));
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const downloadAsMarkdown = () => {
    const ctx = CONTEXTS[context];
    const today = new Date().toISOString().slice(0, 10);
    const lines = [`# Lean Canvas — ${ctx.example}`, "", `*${today}*`, ""];
    GUIDED_SEQUENCE.forEach(k => {
      lines.push(`## ${getFieldLabel(k)}`, "", fields[k]?.trim() || "_(leer)_", "");
    });
    const blob = new Blob([lines.join("\n")], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `lean-canvas-${ctx.short.toLowerCase().replace(/\s+/g, "-")}-${today}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const clearCanvas = () => {
    setFields({}); setChatMessages({}); setSuggestion({}); setGuidedStep(0);
    setChatInput(""); setShowClearDialog(false);
  };

  const currentGuidedKey = GUIDED_SEQUENCE[guidedStep];

  const card = (fieldKey, gridStyle) => (
    <FieldCard
      key={fieldKey}
      fieldKey={fieldKey}
      gridStyle={gridStyle}
      colors={FIELD_COLORS[fieldKey]}
      label={getFieldLabel(fieldKey)}
      help={FIELD_HELP[fieldKey]}
      contextKey={context}
      contextShort={CONTEXTS[context].short}
      mode={mode}
      fieldValue={fields[fieldKey] || ""}
      isHelpOpen={helpOpen === fieldKey}
      isActive={mode === "guided" && currentGuidedKey === fieldKey}
      stepNumber={GUIDED_SEQUENCE.indexOf(fieldKey) + 1}
      onFieldChange={handleFieldChange}
      onToggleHelp={setHelpOpen}
      onActivate={activateField}
    />
  );

  return (
    <div style={{ fontFamily: "Plus Jakarta Sans, sans-serif", background: "#FAFAFA", minHeight: "100vh", padding: "24px 20px", boxSizing: "border-box", color: "#1A1A1A" }}>
      <style>{GOOGLE_FONT}</style>
      <style>{`* { box-sizing: border-box; } textarea::placeholder { color: #c4c4c4; } input::placeholder { color: #c4c4c4; } textarea:focus, input:focus { outline: none; } button:hover { filter: brightness(1.05); }`}</style>

      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 18 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: "#1A1A1A", margin: "0 0 4px", letterSpacing: -0.5 }}>Lean Canvas</h1>
        <p style={{ color: "#7a7069", fontSize: 13, margin: 0 }}>
          Interaktives Business-Modell-Tool · <span style={{ color: "#5A8A6B", fontWeight: 500 }}>✓ Eingaben werden lokal gespeichert</span>
        </p>
      </div>

      {/* Intro card */}
      <div style={{
        maxWidth: 760, margin: "0 auto 18px", padding: "12px 18px",
        background: "#fff", border: "1px solid #ECEAE6", borderRadius: 10,
        fontSize: 13, color: "#3a3a3a", textAlign: "center", lineHeight: 1.55,
      }}>
        <strong style={{ color: "#1A1A1A", fontWeight: 600 }}>So gehst du vor:</strong>{" "}
        1. Kontext wählen · 2. Modus auswählen (Selbst oder Geführt) · 3. Felder in der Reihenfolge 1–9 ausfüllen — Problem zuerst.
      </div>

      {/* Context selector */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center", marginBottom: 12 }}>
        {Object.entries(CONTEXTS).map(([key, ctx]) => (
          <button key={key} onClick={() => setContext(key)} style={{
            background: context === key ? "#1A1A1A" : "#fff",
            color: context === key ? "#fff" : "#1A1A1A",
            border: `1px solid ${context === key ? "#1A1A1A" : "#E5E3DF"}`,
            borderRadius: 8, padding: "7px 14px", fontSize: 13, cursor: "pointer",
            fontFamily: "Plus Jakarta Sans, sans-serif",
            fontWeight: context === key ? 600 : 500, transition: "all 0.15s",
          }}>{ctx.label}</button>
        ))}
      </div>

      {context && (
        <div style={{ textAlign: "center", marginBottom: 16 }}>
          <span style={{ fontSize: 12, color: "#7a7069", background: "#F2F2F0", padding: "4px 12px", borderRadius: 20, border: "1px solid #ECEAE6" }}>
            Beispielkontext: <strong style={{ color: "#1A1A1A" }}>{CONTEXTS[context].example}</strong>
          </span>
        </div>
      )}

      {/* Mode toggle */}
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 22 }}>
        <div style={{ background: "#F2F2F0", border: "1px solid #ECEAE6", borderRadius: 9, padding: 3, display: "flex", gap: 3 }}>
          {[["self", "✏️ Selbst ausfüllen"], ["guided", "✨ Geführter Modus"]].map(([val, lbl]) => (
            <button key={val} onClick={() => { setMode(val); if (val === "guided") { setGuidedStep(0); setChatInput(""); } }} style={{
              background: mode === val ? "#1A1A1A" : "transparent",
              color: mode === val ? "#fff" : "#5a5a5a",
              border: "none", borderRadius: 6, padding: "7px 16px", fontSize: 13, cursor: "pointer",
              fontFamily: "Plus Jakarta Sans, sans-serif",
              fontWeight: mode === val ? 600 : 500, transition: "all 0.15s",
            }}>{lbl}</button>
          ))}
        </div>
      </div>

      {mode === "guided" && (
        <div style={{ textAlign: "center", marginBottom: 18, fontSize: 13, color: "#3a3a3a", background: "#fff", border: "1px solid #ECEAE6", padding: "10px 20px", borderRadius: 10, maxWidth: 560, margin: "0 auto 18px" }}>
          ✨ Der Coach führt dich Schritt für Schritt durch den Canvas. Klicke auf ein Feld, um dorthin zu springen.
        </div>
      )}

      {/* Canvas + optional guided panel */}
      <div style={{ display: "flex", gap: 20, maxWidth: mode === "guided" ? 1580 : 1200, margin: "0 auto 24px", alignItems: "flex-start" }}>

        {/* Canvas grid */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(10, 1fr)", gridTemplateRows: "auto auto auto", gap: 12 }}>
            {card("problem",   { gridColumn: "1 / 3",  gridRow: "1 / 3", minHeight: 200 })}
            {card("solution",  { gridColumn: "3 / 5",  gridRow: "1 / 2", minHeight: 90 })}
            {card("uvp",       { gridColumn: "5 / 7",  gridRow: "1 / 3", minHeight: 200 })}
            {card("unfair",    { gridColumn: "7 / 9",  gridRow: "1 / 2", minHeight: 90 })}
            {card("customers", { gridColumn: "9 / 11", gridRow: "1 / 3", minHeight: 200 })}
            {card("metrics",   { gridColumn: "3 / 5",  gridRow: "2 / 3", minHeight: 90 })}
            {card("channels",  { gridColumn: "7 / 9",  gridRow: "2 / 3", minHeight: 90 })}
            {card("costs",     { gridColumn: "1 / 6",  gridRow: "3 / 4", minHeight: 90 })}
            {card("revenue",   { gridColumn: "6 / 11", gridRow: "3 / 4", minHeight: 90 })}
          </div>
        </div>

        {/* Guided panel */}
        {mode === "guided" && (
          <GuidedPanel
            currentFieldKey={currentGuidedKey}
            currentStep={guidedStep}
            totalSteps={GUIDED_SEQUENCE.length}
            colors={FIELD_COLORS[currentGuidedKey]}
            label={getFieldLabel(currentGuidedKey)}
            msgs={chatMessages[currentGuidedKey] || []}
            loading={loading}
            chatInput={chatInput}
            hasSuggestion={!!suggestion[currentGuidedKey]}
            chatEndRef={chatEndRef}
            onSendMessage={sendChatMessage}
            onChatInputChange={setChatInput}
            onAdoptSuggestion={adoptSuggestion}
            onNext={() => guidedStep < GUIDED_SEQUENCE.length - 1 ? goToStep(guidedStep + 1) : null}
            onBack={() => guidedStep > 0 ? goToStep(guidedStep - 1) : null}
          />
        )}
      </div>

      {/* Action buttons */}
      <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
        <button onClick={copyAsText} style={{
          background: copySuccess ? "#5A8A6B" : "#fff", color: copySuccess ? "#fff" : "#1A1A1A",
          border: `1px solid ${copySuccess ? "#5A8A6B" : "#E5E3DF"}`, borderRadius: 8, padding: "9px 18px", fontSize: 13,
          cursor: "pointer", fontFamily: "Plus Jakarta Sans, sans-serif", fontWeight: 500, transition: "all 0.2s",
        }}>{copySuccess ? "✅ Kopiert!" : "📋 Als Text kopieren"}</button>
        <button onClick={downloadAsMarkdown} style={{
          background: "#fff", color: "#1A1A1A", border: "1px solid #E5E3DF",
          borderRadius: 8, padding: "9px 18px", fontSize: 13, cursor: "pointer",
          fontFamily: "Plus Jakarta Sans, sans-serif", fontWeight: 500,
        }}>📥 Als Markdown herunterladen</button>
        <button onClick={() => setShowClearDialog(true)} style={{
          background: "#fff", color: "#B05A3F", border: "1px solid #ECD8CB",
          borderRadius: 8, padding: "9px 18px", fontSize: 13, cursor: "pointer",
          fontFamily: "Plus Jakarta Sans, sans-serif", fontWeight: 500,
        }}>🔄 Canvas leeren</button>
      </div>

      {/* Clear dialog */}
      {showClearDialog && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "#fff", border: "1px solid #ECEAE6", borderRadius: 12, padding: 28, maxWidth: 380, width: "90%", textAlign: "center", boxShadow: "0 20px 60px rgba(0,0,0,0.18)" }}>
            <h3 style={{ margin: "0 0 8px", color: "#1A1A1A", fontSize: 17, fontWeight: 600 }}>Canvas wirklich leeren?</h3>
            <p style={{ color: "#7a7069", fontSize: 13, margin: "0 0 20px" }}>Alle eingegebenen Inhalte werden unwiderruflich gelöscht.</p>
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <button onClick={() => setShowClearDialog(false)} style={{ background: "#fff", color: "#1A1A1A", border: "1px solid #E5E3DF", borderRadius: 8, padding: "9px 20px", fontSize: 13, cursor: "pointer", fontFamily: "Plus Jakarta Sans, sans-serif", fontWeight: 500 }}>Abbrechen</button>
              <button onClick={clearCanvas} style={{ background: "#B05A3F", color: "#fff", border: "1px solid #B05A3F", borderRadius: 8, padding: "9px 20px", fontSize: 13, cursor: "pointer", fontFamily: "Plus Jakarta Sans, sans-serif", fontWeight: 600 }}>Ja, leeren</button>
            </div>
          </div>
        </div>
      )}

      <p style={{ textAlign: "center", fontSize: 12, color: "#bbb", marginTop: 20 }}>Lean Canvas · Powered by Claude API</p>
    </div>
  );
}
