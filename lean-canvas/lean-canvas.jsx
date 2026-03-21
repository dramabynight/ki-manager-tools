import { useState, useEffect, useRef } from "react";

// ── Config ────────────────────────────────────────────────────────────────────
// Update this to switch Claude models
const CLAUDE_MODEL = "claude-sonnet-4-6";

// DEPLOYMENT MODE
// false → Claude Artifact: direct API call, no key needed (works inside claude.ai)
// true  → Standalone app: routes through /api/chat proxy (needs ANTHROPIC_API_KEY env var)
const USE_PROXY = true;

const GOOGLE_FONT = `@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap');`;

const CONTEXTS = {
  digital: {
    label: "🛒 Digitales Produkt",
    example: "E-Bike Konfigurator für Online-Shop",
    short: "E-Bike Konfigurator",
  },
  service: {
    label: "🎨 Dienstleistung",
    example: "KI-Workshop für Projektmanager",
    short: "KI-Workshop",
  },
  nonprofit: {
    label: "🌱 Non-Profit / Social Impact",
    example: "Inklusiver Spielplatz-Finder",
    short: "Spielplatz-Finder",
    isNonprofit: true,
  },
  physical: {
    label: "🏭 Physisches Produkt",
    example: "Modulares Hochbeet für Balkone",
    short: "Modulares Hochbeet",
  },
};

const FIELD_HELP = {
  problem: {
    label: "Problem",
    explanation: "Beschreibe die 3 wichtigsten Probleme deiner Kunden. Fokussiere dich auf reale Schmerzen, nicht auf hypothetische.",
    question: "Was ist der größte Frust deiner Zielgruppe heute?",
    examples: {
      digital: "Online-Käufer wissen nicht, welches E-Bike zu ihrem Alltag passt – zu viele Optionen, zu wenig persönliche Beratung.",
      service: "PM-Teams stehen vor KI-Tools, wissen aber nicht, wo sie sinnvoll anfangen sollen – ohne praktischen Einstieg bleibt alles Theorie.",
      nonprofit: "Eltern mit mobilitätseingeschränkten Kindern finden keine barrierefreien Spielplätze in ihrer Nähe.",
      physical: "Balkon-Gärtner haben wenig Platz und wissen nicht, wie sie platzsparend und effizient anbauen können.",
    },
  },
  solution: {
    label: "Lösung",
    explanation: "Die einfachste Lösung für jedes Problem. Noch keine Features – nur das Kernkonzept.",
    question: "Was ist der kleinste sinnvolle Schritt, der das Problem löst?",
    examples: {
      digital: "Interaktiver 3-Schritt-Konfigurator mit Lifestyle-Fragen und passenden Modell-Empfehlungen.",
      service: "1-Tages-Workshop mit konkreten Anwendungsfällen direkt aus dem PM-Alltag der Teilnehmer.",
      nonprofit: "Kartenbasierte App mit gefilterten Spielplätzen nach Barrierefreiheitskriterien.",
      physical: "Modulares Hochbeet-System aus 3 Grundmodulen, steckbar ohne Werkzeug.",
    },
  },
  uvp: {
    label: "Einzigartiges Wertversprechen",
    explanation: "Ein klarer Satz, warum du anders und besser bist. Was macht dein Angebot unverwechselbar?",
    question: "Warum sollte jemand genau bei dir kaufen – und nicht woanders?",
    examples: {
      digital: "Das erste E-Bike-Tool, das dir in 3 Minuten das perfekte Modell für deinen Alltag empfiehlt.",
      service: "KI-Skills lernen anhand echter Projekte – kein Theorie-Overhead.",
      nonprofit: "Barrierefreie Spielplätze finden – so einfach wie Google Maps.",
      physical: "Balkongarten ohne Bohren, ohne Frust – in 20 Minuten aufgebaut.",
    },
  },
  unfair: {
    label: "Unfairer Vorteil",
    explanation: "Was kann dir niemand so leicht nachmachen? Das ist dein schwer kopierbarer Vorteil.",
    question: "Was hast du, was Wettbewerber nicht haben – Wissen, Netzwerk, Daten, Erfahrung?",
    examples: {
      digital: "Proprietärer Datensatz aus 10.000 Kundenprofilen mit echten Nutzungsmustern.",
      service: "15 Jahre PM-Erfahrung + exklusives Trainer-Netzwerk mit KI-Spezialisten.",
      nonprofit: "Partnerschaft mit 12 Kommunen und direkter Datenzugang zu offiziellen Spielplatz-Datenbanken.",
      physical: "Patentiertes Stecksystem und exklusiver Materialeinkauf bei Hersteller.",
    },
  },
  customers: {
    label: "Kundensegmente",
    explanation: "Wen willst du als erstes erreichen? Beschreibe eine konkrete Persona, nicht eine vage Gruppe.",
    question: "Wer hat das Problem am stärksten und ist bereit, dafür zu zahlen?",
    examples: {
      digital: "Urban Commuter, 28–45 J., wohnt in Großstadt, pendelt täglich, Budget 2.500–4.000 €.",
      service: "Projektmanager in Konzernen, 30–50 J., verantwortlich für Teams von 5–20 Personen.",
      nonprofit: "Eltern von Kindern mit körperlicher Einschränkung, 25–45 J., urban, aktiv in Eltern-Communitys.",
      physical: "Urban Gardener, Mieter mit Balkon, 25–40 J., nachhaltigkeitsbewusst, keine Gartenerfahrung.",
    },
  },
  metrics: {
    label: "Kennzahlen",
    explanation: "Welche 3–5 Zahlen zeigen dir, ob dein Geschäftsmodell funktioniert?",
    question: "Woran merkst du konkret, dass du auf dem richtigen Weg bist?",
    examples: {
      digital: "Konfigurations-Abschlussrate, Conversion zu Kauf, Ø Sitzungsdauer, NPS.",
      service: "Teilnehmerzahl/Quartal, Wiederbuchungsrate, Weiterempfehlungsrate, Auslastung.",
      nonprofit: "Aktive Nutzer/Monat, Anzahl gelisteter Spielplätze, Bewertungen, Reichweite in Zielgruppe.",
      physical: "Verkaufte Sets/Monat, Retourenquote, Kundenzufriedenheit, Wiederkaufsrate.",
    },
  },
  channels: {
    label: "Kanäle",
    explanation: "Wie erreichst du deine Kunden? Von Awareness bis After-Sales.",
    question: "Wo ist deine Zielgruppe schon unterwegs – online und offline?",
    examples: {
      digital: "SEO auf E-Bike-Keywords, Instagram Ads, YouTube-Reviews, Partnerschaft mit Fahrradläden.",
      service: "LinkedIn, PM-Konferenzen, Unternehmens-Newsletter, Weiterempfehlung.",
      nonprofit: "Eltern-Facebook-Gruppen, Kita-Verteiler, lokale Presse, Kooperation mit Behindertenverbänden.",
      physical: "Instagram Gardening-Community, Pinterest, DM/OBI-Regalplatz, Craft-Messen.",
    },
  },
  costs: {
    label: "Kostenstruktur",
    explanation: "Welche sind deine größten Kostenpositionen in der Frühphase?",
    question: "Was kostet dich am meisten – Entwicklung, Marketing, Personal oder Material?",
    examples: {
      digital: "Entwicklung (Konfigurator), Hosting, SEA-Budget, UX-Design.",
      service: "Trainerzeit, Raummiete, Materialerstellung, Marketing.",
      nonprofit: "App-Entwicklung, Community-Management, Partnerschaftspflege.",
      physical: "Produktion, Lagerkosten, Versand, Messe-Auftritte.",
    },
  },
  revenue: {
    label: "Einnahmen",
    explanation: "Wie verdienst du Geld? Mit welchem Modell und welchem Preis?",
    question: "Was sind Kunden bereit zu zahlen – und warum genau das?",
    examples: {
      digital: "Affiliate-Provision bei E-Bike-Kauf (5–8%), optional: Premium-Konfigurator-Feature.",
      service: "Workshop: 890 €/Person, Firmen-Paket: 4.800 €, Follow-up Coaching: 150 €/h.",
      nonprofit: "Fördergelder, Gemeinde-Kooperationen, freiwillige App-Spenden.",
      physical: "Starter-Set 89 €, Erweiterungs-Module 29–49 €, Bundle-Rabatte.",
    },
  },
};

const NONPROFIT_LABELS = {
  revenue: "Wirkung / Impact",
  costs: "Ressourcen",
  metrics: "Erfolgsindikatoren",
};

const FIELD_COLORS = {
  problem: { bg: "#F2E8E4", header: "#C17B5A", light: "#FBF5F2" },
  solution: { bg: "#E4EDE8", header: "#5A8A6B", light: "#F2F8F4" },
  uvp: { bg: "#E4E8F0", header: "#5A6B8A", light: "#F2F4F8" },
  unfair: { bg: "#EDE4E8", header: "#8A5A6B", light: "#F8F2F4" },
  customers: { bg: "#EDE8E0", header: "#8A7A5A", light: "#F8F5EE" },
  metrics: { bg: "#E0EDE8", header: "#5A8A7A", light: "#EEF8F5" },
  channels: { bg: "#E8E0ED", header: "#7A5A8A", light: "#F5EEF8" },
  costs: { bg: "#EDE4E0", header: "#8A6A5A", light: "#F8F2EE" },
  revenue: { bg: "#E0E8ED", header: "#5A7A8A", light: "#EEF5F8" },
};

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



// ── FieldCard ─────────────────────────────────────────────────────────────────
// Defined at MODULE LEVEL — not inside LeanCanvas.
// Defining a component inside another component causes React to treat it as a
// new type on every render, unmounting/remounting it and losing textarea focus
// after each keystroke (the "one character at a time" bug).
function FieldCard({
  fieldKey, gridStyle, colors, label, help, contextKey, contextShort,
  mode, fieldValue, isHelpOpen, isChatOpen, msgs, loading, chatInput,
  hasSuggestion, chatEndRef,
  onFieldChange, onToggleHelp, onOpenChat, onSendMessage, onChatInputChange, onAdoptSuggestion,
}) {
  return (
    <div style={{
      ...gridStyle,
      background: colors.light,
      borderRadius: 14,
      boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
      border: `1.5px solid ${colors.bg}`,
      transition: "box-shadow 0.2s",
    }}>
      {/* Header */}
      <div style={{
        background: colors.header, color: "#fff", padding: "8px 12px",
        display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0,
      }}>
        <span style={{ fontWeight: 600, fontSize: 13, letterSpacing: 0.3 }}>{label}</span>
        <div style={{ display: "flex", gap: 6 }}>
          {mode === "guided" && (
            <button
              onClick={() => onOpenChat(fieldKey)}
              title="KI-Coaching öffnen"
              style={{
                background: isChatOpen ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.18)",
                border: "none", borderRadius: 6, color: "#fff", fontSize: 13,
                cursor: "pointer", padding: "2px 7px", fontWeight: 600, transition: "background 0.15s",
              }}
            >✨</button>
          )}
          <button
            onClick={() => onToggleHelp(isHelpOpen ? null : fieldKey)}
            title="Hilfe anzeigen"
            style={{
              background: isHelpOpen ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.18)",
              border: "none", borderRadius: 6, color: "#fff", fontSize: 12,
              cursor: "pointer", padding: "2px 7px", fontWeight: 700, transition: "background 0.15s",
            }}
          >?</button>
        </div>
      </div>

      {/* Help panel */}
      {isHelpOpen && (
        <div style={{
          background: colors.bg, padding: "10px 12px", fontSize: 12,
          color: "#4a4a4a", borderBottom: `1px solid ${colors.header}30`, flexShrink: 0,
        }}>
          <p style={{ margin: "0 0 4px", fontWeight: 500 }}>{help.explanation}</p>
          <p style={{ margin: "0 0 4px", color: colors.header, fontStyle: "italic" }}>❓ {help.question}</p>
          <p style={{ margin: 0, color: "#666" }}>
            <strong>Beispiel ({contextShort}):</strong> {help.examples[contextKey]}
          </p>
        </div>
      )}

      {/* Textarea */}
      <textarea
        value={fieldValue}
        onChange={(e) => onFieldChange(fieldKey, e.target.value)}
        placeholder={`${label} beschreiben…`}
        style={{
          flex: 1, border: "none", background: "transparent", resize: "none",
          padding: "10px 12px", fontFamily: "Plus Jakarta Sans, sans-serif",
          fontSize: 13, color: "#3a3a3a", outline: "none", minHeight: 70, lineHeight: 1.5,
        }}
      />

      {/* Chat area */}
      {isChatOpen && (
        <div style={{
          background: "#fff", borderTop: `2px solid ${colors.header}40`,
          display: "flex", flexDirection: "column", maxHeight: 300, flexShrink: 0,
        }}>
          <div style={{
            flex: 1, overflowY: "auto", padding: "10px 12px",
            display: "flex", flexDirection: "column", gap: 8, maxHeight: 200,
          }}>
            {msgs.length === 0 && loading && (
              <div style={{ color: "#888", fontSize: 12, fontStyle: "italic" }}>KI-Coach antwortet…</div>
            )}
            {msgs.map((msg, i) => (
              <div key={i} style={{
                alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
                background: msg.role === "user" ? colors.header : colors.bg,
                color: msg.role === "user" ? "#fff" : "#333",
                borderRadius: msg.role === "user" ? "12px 12px 2px 12px" : "12px 12px 12px 2px",
                padding: "8px 10px", fontSize: 12, maxWidth: "90%", lineHeight: 1.5, whiteSpace: "pre-wrap",
              }}>
                {msg.content}
              </div>
            ))}
            {loading && msgs.length > 0 && (
              <div style={{ fontSize: 12, color: "#888", fontStyle: "italic" }}>Schreibe…</div>
            )}
            <div ref={chatEndRef} />
          </div>

          {hasSuggestion && (
            <div style={{ padding: "6px 12px", borderTop: `1px solid ${colors.bg}` }}>
              <button
                onClick={() => onAdoptSuggestion(fieldKey)}
                style={{
                  background: colors.header, color: "#fff", border: "none", borderRadius: 8,
                  padding: "5px 12px", fontSize: 12, cursor: "pointer", fontWeight: 600, width: "100%",
                }}
              >✅ Vorschlag ins Feld übernehmen</button>
            </div>
          )}

          <div style={{ display: "flex", gap: 6, padding: "8px 10px", borderTop: `1px solid ${colors.bg}` }}>
            <input
              value={chatInput}
              onChange={(e) => onChatInputChange(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && onSendMessage(fieldKey)}
              placeholder="Antworten…"
              style={{
                flex: 1, border: `1.5px solid ${colors.bg}`, borderRadius: 8,
                padding: "6px 10px", fontSize: 12, fontFamily: "Plus Jakarta Sans, sans-serif",
                outline: "none", background: colors.light, color: "#333",
              }}
            />
            <button
              onClick={() => onSendMessage(fieldKey)}
              disabled={loading || !chatInput.trim()}
              style={{
                background: colors.header, color: "#fff", border: "none", borderRadius: 8,
                padding: "6px 12px", fontSize: 13,
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading || !chatInput.trim() ? 0.5 : 1, fontWeight: 600,
              }}
            >→</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function LeanCanvas() {
  const [context, setContext] = useState("digital");
  const [mode, setMode] = useState("self"); // "self" | "guided"
  const [fields, setFields] = useState({});
  const [helpOpen, setHelpOpen] = useState(null);
  const [activeChat, setActiveChat] = useState(null);
  const [chatMessages, setChatMessages] = useState({});
  const [chatInput, setChatInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [suggestion, setSuggestion] = useState({});
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const chatEndRef = useRef(null);

  // Load from localStorage
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

  // Save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("lean-canvas-data", JSON.stringify({ fields, context }));
    } catch (e) {}
  }, [fields, context]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, activeChat]);

  const getFieldLabel = (fieldKey) => {
    if (CONTEXTS[context]?.isNonprofit && NONPROFIT_LABELS[fieldKey]) {
      return NONPROFIT_LABELS[fieldKey];
    }
    return FIELD_HELP[fieldKey]?.label;
  };

  const handleFieldChange = (fieldKey, value) => {
    setFields((prev) => ({ ...prev, [fieldKey]: value }));
  };

  const openChat = async (fieldKey) => {
    if (activeChat === fieldKey) {
      setActiveChat(null);
      return;
    }
    setActiveChat(fieldKey);
    if (!chatMessages[fieldKey] || chatMessages[fieldKey].length === 0) {
      const fieldLabel = getFieldLabel(fieldKey);
      const help = FIELD_HELP[fieldKey];
      const example = help.examples[context];
      const initialPrompt = `Hilf mir das Feld "${fieldLabel}" im Lean Canvas auszufüllen. Kontext: ${CONTEXTS[context].example}. ${help.explanation} Leitfrage: ${help.question}`;
      
      const initMsg = [{ role: "user", content: initialPrompt }];
      setChatMessages((prev) => ({ ...prev, [fieldKey]: [] }));
      setLoading(true);

      try {
        const data = await callClaude(initMsg, SYSTEM_PROMPT);
        const reply = data.content?.map((b) => b.text || "").join("") || "Fehler beim Laden.";
        setChatMessages((prev) => ({
          ...prev,
          [fieldKey]: [{ role: "assistant", content: reply }],
        }));
      } catch (e) {
        setChatMessages((prev) => ({
          ...prev,
          [fieldKey]: [{ role: "assistant", content: "Verbindungsfehler. Bitte versuche es erneut." }],
        }));
      }
      setLoading(false);
    }
  };

  const sendChatMessage = async (fieldKey) => {
    if (!chatInput.trim() || loading) return;
    const userMsg = chatInput.trim();
    setChatInput("");

    const existingMessages = chatMessages[fieldKey] || [];
    const newMessages = [...existingMessages, { role: "user", content: userMsg }];
    setChatMessages((prev) => ({ ...prev, [fieldKey]: newMessages }));
    setLoading(true);

    const fieldLabel = getFieldLabel(fieldKey);
    const help = FIELD_HELP[fieldKey];
    const apiMessages = [
      { role: "user", content: `Feld: "${fieldLabel}". Kontext: ${CONTEXTS[context].example}. ${help.explanation}` },
      ...newMessages,
    ];

    try {
      const data = await callClaude(apiMessages, SYSTEM_PROMPT);
      const reply = data.content?.map((b) => b.text || "").join("") || "Fehler.";
      const updatedMessages = [...newMessages, { role: "assistant", content: reply }];
      setChatMessages((prev) => ({ ...prev, [fieldKey]: updatedMessages }));

      // Extract suggestion
      if (reply.includes("💡 Vorschlag:")) {
        const suggestionText = reply.split("💡 Vorschlag:")[1]?.trim();
        if (suggestionText) setSuggestion((prev) => ({ ...prev, [fieldKey]: suggestionText }));
      }
    } catch (e) {
      setChatMessages((prev) => ({
        ...prev,
        [fieldKey]: [...newMessages, { role: "assistant", content: "Verbindungsfehler." }],
      }));
    }
    setLoading(false);
  };

  const adoptSuggestion = (fieldKey) => {
    if (suggestion[fieldKey]) {
      handleFieldChange(fieldKey, suggestion[fieldKey]);
      setSuggestion((prev) => ({ ...prev, [fieldKey]: null }));
    }
  };

  const copyAsText = () => {
    const lines = Object.keys(FIELD_HELP).map((key) => {
      const label = getFieldLabel(key);
      const value = fields[key] || "(leer)";
      return `${label}:\n${value}`;
    });
    navigator.clipboard.writeText(lines.join("\n\n"));
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const clearCanvas = () => {
    setFields({});
    setChatMessages({});
    setSuggestion({});
    setActiveChat(null);
    setShowClearDialog(false);
  };

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
      isChatOpen={activeChat === fieldKey && mode === "guided"}
      msgs={chatMessages[fieldKey] || []}
      loading={loading}
      chatInput={activeChat === fieldKey ? chatInput : ""}
      hasSuggestion={!!suggestion[fieldKey]}
      chatEndRef={activeChat === fieldKey ? chatEndRef : null}
      onFieldChange={handleFieldChange}
      onToggleHelp={setHelpOpen}
      onOpenChat={openChat}
      onSendMessage={sendChatMessage}
      onChatInputChange={setChatInput}
      onAdoptSuggestion={adoptSuggestion}
    />
  );

  return (
    <div style={{
      fontFamily: "Plus Jakarta Sans, sans-serif",
      background: "#FAF8F5",
      minHeight: "100vh",
      padding: "24px 20px",
      boxSizing: "border-box",
    }}>
      <style>{GOOGLE_FONT}</style>
      <style>{`
        * { box-sizing: border-box; }
        textarea::placeholder { color: #bbb; }
        input::placeholder { color: #bbb; }
        textarea:focus, input:focus { outline: none; }
        button:hover { filter: brightness(1.08); }
      `}</style>

      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <h1 style={{
          fontSize: 28,
          fontWeight: 700,
          color: "#2C2420",
          margin: "0 0 4px",
          letterSpacing: -0.5,
        }}>Lean Canvas</h1>
        <p style={{ color: "#7a7069", fontSize: 14, margin: 0 }}>
          Dein interaktives Business-Modell-Tool • <span style={{ color: "#5A8A6B", fontWeight: 500 }}>✓ Deine Eingaben werden lokal gespeichert</span>
        </p>
      </div>

      {/* Context selector */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center", marginBottom: 16 }}>
        {Object.entries(CONTEXTS).map(([key, ctx]) => (
          <button
            key={key}
            onClick={() => setContext(key)}
            style={{
              background: context === key ? "#2C2420" : "#fff",
              color: context === key ? "#fff" : "#2C2420",
              border: `2px solid ${context === key ? "#2C2420" : "#ddd5cc"}`,
              borderRadius: 10,
              padding: "8px 16px",
              fontSize: 13,
              cursor: "pointer",
              fontFamily: "Plus Jakarta Sans, sans-serif",
              fontWeight: context === key ? 600 : 400,
              transition: "all 0.15s",
              boxShadow: context === key ? "0 2px 8px rgba(44,36,32,0.2)" : "none",
            }}
          >
            {ctx.label}
          </button>
        ))}
      </div>

      {context && (
        <div style={{ textAlign: "center", marginBottom: 16 }}>
          <span style={{ fontSize: 12, color: "#9a897e", background: "#F0EBE5", padding: "4px 12px", borderRadius: 20 }}>
            Beispielkontext: <strong>{CONTEXTS[context].example}</strong>
          </span>
        </div>
      )}

      {/* Mode toggle */}
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}>
        <div style={{
          background: "#EDE8E0",
          borderRadius: 12,
          padding: 4,
          display: "flex",
          gap: 4,
        }}>
          {[["self", "✏️ Selbst ausfüllen"], ["guided", "✨ Geführter Modus"]].map(([val, label]) => (
            <button
              key={val}
              onClick={() => { setMode(val); setActiveChat(null); }}
              style={{
                background: mode === val ? "#2C2420" : "transparent",
                color: mode === val ? "#fff" : "#6a5a50",
                border: "none",
                borderRadius: 9,
                padding: "8px 18px",
                fontSize: 13,
                cursor: "pointer",
                fontFamily: "Plus Jakarta Sans, sans-serif",
                fontWeight: mode === val ? 600 : 400,
                transition: "all 0.15s",
              }}
            >{label}</button>
          ))}
        </div>
      </div>

      {mode === "guided" && (
        <div style={{
          textAlign: "center",
          marginBottom: 20,
          fontSize: 13,
          color: "#5A8A6B",
          background: "#F0F7F3",
          padding: "10px 20px",
          borderRadius: 10,
          maxWidth: 560,
          margin: "0 auto 20px",
        }}>
          ✨ Klicke auf das <strong>✨</strong>-Icon in einem Feld, um den KI-Coach zu öffnen. Er stellt dir gezielte Fragen und hilft dir, jeden Bereich auszufüllen.
        </div>
      )}

      {/* Canvas Grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(10, 1fr)",
        gridTemplateRows: "auto auto auto",
        gap: 12,
        maxWidth: 1200,
        margin: "0 auto 24px",
      }}>
        {card("problem",   { gridColumn: "1 / 3",  gridRow: "1 / 3", minHeight: 280 })}
        {card("solution",  { gridColumn: "3 / 5",  gridRow: "1 / 2", minHeight: 130 })}
        {card("uvp",       { gridColumn: "5 / 7",  gridRow: "1 / 3", minHeight: 280 })}
        {card("unfair",    { gridColumn: "7 / 9",  gridRow: "1 / 2", minHeight: 130 })}
        {card("customers", { gridColumn: "9 / 11", gridRow: "1 / 3", minHeight: 280 })}
        {card("metrics",   { gridColumn: "3 / 5",  gridRow: "2 / 3", minHeight: 130 })}
        {card("channels",  { gridColumn: "7 / 9",  gridRow: "2 / 3", minHeight: 130 })}
        {card("costs",     { gridColumn: "1 / 6",  gridRow: "3 / 4", minHeight: 110 })}
        {card("revenue",   { gridColumn: "6 / 11", gridRow: "3 / 4", minHeight: 110 })}
      </div>

      {/* Action buttons */}
      <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
        <button
          onClick={copyAsText}
          style={{
            background: copySuccess ? "#5A8A6B" : "#fff",
            color: copySuccess ? "#fff" : "#2C2420",
            border: "2px solid #ddd5cc",
            borderRadius: 10,
            padding: "10px 20px",
            fontSize: 14,
            cursor: "pointer",
            fontFamily: "Plus Jakarta Sans, sans-serif",
            fontWeight: 500,
            transition: "all 0.2s",
          }}
        >{copySuccess ? "✅ Kopiert!" : "📋 Als Text kopieren"}</button>
        <button
          onClick={() => setShowClearDialog(true)}
          style={{
            background: "#fff",
            color: "#C17B5A",
            border: "2px solid #f0c8b4",
            borderRadius: 10,
            padding: "10px 20px",
            fontSize: 14,
            cursor: "pointer",
            fontFamily: "Plus Jakarta Sans, sans-serif",
            fontWeight: 500,
          }}
        >🔄 Canvas leeren</button>
      </div>

      {/* Clear dialog */}
      {showClearDialog && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.4)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
        }}>
          <div style={{
            background: "#fff",
            borderRadius: 16,
            padding: 32,
            maxWidth: 380,
            width: "90%",
            textAlign: "center",
            boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
          }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🔄</div>
            <h3 style={{ margin: "0 0 8px", color: "#2C2420", fontSize: 18 }}>Canvas wirklich leeren?</h3>
            <p style={{ color: "#7a7069", fontSize: 14, margin: "0 0 20px" }}>
              Alle eingegebenen Inhalte werden unwiderruflich gelöscht.
            </p>
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <button
                onClick={() => setShowClearDialog(false)}
                style={{
                  background: "#EDE8E0",
                  color: "#2C2420",
                  border: "none",
                  borderRadius: 10,
                  padding: "10px 22px",
                  fontSize: 14,
                  cursor: "pointer",
                  fontFamily: "Plus Jakarta Sans, sans-serif",
                  fontWeight: 500,
                }}
              >Abbrechen</button>
              <button
                onClick={clearCanvas}
                style={{
                  background: "#C17B5A",
                  color: "#fff",
                  border: "none",
                  borderRadius: 10,
                  padding: "10px 22px",
                  fontSize: 14,
                  cursor: "pointer",
                  fontFamily: "Plus Jakarta Sans, sans-serif",
                  fontWeight: 600,
                }}
              >Ja, leeren</button>
            </div>
          </div>
        </div>
      )}

      <p style={{ textAlign: "center", fontSize: 12, color: "#bbb", marginTop: 20 }}>
        Lean Canvas • Powered by Claude API
      </p>
    </div>
  );
}
