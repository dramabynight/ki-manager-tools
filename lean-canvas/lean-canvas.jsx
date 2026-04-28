import { useState, useEffect, useRef } from "react";
import {
  Pencil, Sparkles, Copy, Download, RotateCcw, Check, Info, HelpCircle,
  ArrowRight, ArrowLeft, Lightbulb, X, Compass,
} from "lucide-react";

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
  problem:   { label: "Problem",                       importHint: "Hast du schon Pain-Points aus Empathy Map oder Journey? Paste sie unten in den Chat — der Coach baut darauf auf.",                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            explanation: "Beschreibe die 3 wichtigsten Probleme deiner Kunden. Fokussiere dich auf reale Schmerzen, nicht auf hypothetische.", question: "Was ist der größte Frust deiner Zielgruppe heute?",                                       examples: { digital: "Online-Käufer wissen nicht, welches E-Bike zu ihrem Alltag passt – zu viele Optionen, zu wenig persönliche Beratung.", service: "PM-Teams stehen vor KI-Tools, wissen aber nicht, wo sie sinnvoll anfangen sollen.", nonprofit: "Eltern mit mobilitätseingeschränkten Kindern finden keine barrierefreien Spielplätze.", physical: "Balkon-Gärtner haben wenig Platz und wissen nicht, wie sie platzsparend anbauen können." } },
  customers: { label: "Kundensegmente",                importHint: "Hast du schon eine Persona aus Empathy Map / Journey? Paste sie unten — der Coach übernimmt Name, Rolle und Kontext.",                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       explanation: "Wen willst du als erstes erreichen? Beschreibe eine konkrete Persona, nicht eine vage Gruppe.",                      question: "Wer hat das Problem am stärksten und ist bereit, dafür zu zahlen?",                          examples: { digital: "Urban Commuter, 28–45 J., Großstadt, pendelt täglich, Budget 2.500–4.000 €.", service: "Projektmanager in Konzernen, 30–50 J., verantwortlich für Teams von 5–20 Personen.", nonprofit: "Eltern von Kindern mit körperlicher Einschränkung, 25–45 J., urban, aktiv in Eltern-Communitys.", physical: "Urban Gardener, Mieter mit Balkon, 25–40 J., nachhaltigkeitsbewusst, keine Gartenerfahrung." } },
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

const SYSTEM_PROMPT = `Du bist ein Lean Canvas Coach. Antworte IMMER auf Deutsch.

REGELN für JEDE Nachricht:
- Maximal 3-4 Sätze. Keine Aufzählungen außer beim Vorschlag.
- Stelle pro Nachricht NUR EINE konkrete Frage. Step-by-step, nicht alles auf einmal.
- Fülle das Feld NIE selbst aus.

Wenn der User bereits Inhalt im Feld hat: beziehe dich KONKRET auf diesen Inhalt mit einer einzigen schärfenden Frage. Keine Würdigung, keine Zusammenfassung, kein "ich höre…". Direkt zur Frage.

Wenn der User antwortet und du genug Substanz hast (nach 2-4 Turns), schlage eine knappe, prägnante Formulierung für das Feld vor. Format: zuerst max. 1 Satz Kommentar, dann auf neuer Zeile "💡 Vorschlag:" gefolgt vom konkreten Text (max 3-4 Sätze oder Stichpunkte).

Wenn der User signalisiert, dass das Feld fertig ist ("passt", "okay", "fertig", "weiter", übernimmt den Vorschlag) oder zwei Mal in Folge zustimmt, dränge NICHT weiter. Antworte einmal kurz bestätigend (max 1 Satz, ohne neue Frage) und überlasse dem User die Initiative. Keine zusätzlichen Schärfungsfragen, keine "noch ein Punkt…".`;

// ── Inline markdown helper (handles **bold**) ─────────────────────────────────
function renderInlineMarkdown(text) {
  if (!text) return null;
  const parts = text.split(/(\*\*[^*\n]+\*\*)/g);
  return parts.map((part, i) =>
    part.startsWith("**") && part.endsWith("**")
      ? <strong key={i}>{part.slice(2, -2)}</strong>
      : <span key={i}>{part}</span>
  );
}

const stripMarkdown = (text) => (text || "").replace(/\*\*([^*\n]+)\*\*/g, "$1");

// ── API helper ────────────────────────────────────────────────────────────────
async function callClaude(messages, system) {
  if (USE_PROXY) {
    const password = localStorage.getItem("lean-canvas-password") || "";
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-cohort-password": password },
      body: JSON.stringify({ messages, system }),
    });
    if (res.status === 401) {
      localStorage.removeItem("lean-canvas-password");
      window.dispatchEvent(new CustomEvent("lean-canvas-auth-required"));
      return { error: "auth" };
    }
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
  currentFieldKey, currentStep, totalSteps, colors, label, importHint,
  msgs, loading, chatInput, hasSuggestion, chatEndRef,
  emptyCount, firstEmptyIndex, firstEmptyLabel,
  onSendMessage, onChatInputChange, onAdoptSuggestion, onNext, onBack, onJumpToFirstEmpty,
}) {
  const progress = ((currentStep + 1) / totalSteps) * 100;
  const isLast = currentStep === totalSteps - 1;
  const allFilled = emptyCount === 0;

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

      {/* Import hint (only on fields that benefit from prior work) */}
      {importHint && (
        <div style={{
          background: "#FFF8E5", border: "1px solid #F2E8C5", color: "#7A6420",
          padding: "8px 12px", fontSize: 12, lineHeight: 1.45,
          margin: "10px 12px 0", borderRadius: 6, flexShrink: 0,
          display: "flex", alignItems: "flex-start", gap: 7,
        }}>
          <Lightbulb size={14} style={{ flexShrink: 0, marginTop: 1 }} />
          <span>{importHint}</span>
        </div>
      )}

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
            {renderInlineMarkdown(msg.content)}
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
              display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7,
            }}
          ><Check size={14} /> Vorschlag ins Feld übernehmen</button>
        </div>
      )}

      {/* Input */}
      <div style={{ display: "flex", gap: 6, padding: "8px 12px", borderTop: `1px solid ${colors.bg}`, flexShrink: 0, alignItems: "flex-end" }}>
        <textarea
          value={chatInput}
          rows={2}
          onChange={(e) => {
            onChatInputChange(e.target.value);
            e.target.style.height = "auto";
            e.target.style.height = Math.min(e.target.scrollHeight, 140) + "px";
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              onSendMessage(currentFieldKey);
            }
          }}
          placeholder="Antworten… (Shift+Enter für neue Zeile)"
          style={{
            flex: 1, border: `1.5px solid ${colors.bg}`, borderRadius: 8,
            padding: "8px 11px", fontSize: 13, fontFamily: "Plus Jakarta Sans, sans-serif",
            outline: "none", background: "#fff", color: "#333",
            resize: "none", lineHeight: 1.45, minHeight: 44, maxHeight: 140, overflowY: "auto",
          }}
        />
        <button
          onClick={() => onSendMessage(currentFieldKey)}
          disabled={loading || !chatInput.trim()}
          style={{
            background: colors.header, color: "#fff", border: "none", borderRadius: 8,
            padding: "8px 13px", cursor: loading ? "not-allowed" : "pointer",
            opacity: loading || !chatInput.trim() ? 0.5 : 1, fontWeight: 600, alignSelf: "flex-end", height: 38,
            display: "inline-flex", alignItems: "center", justifyContent: "center",
          }}
          title="Senden"
        ><ArrowRight size={16} /></button>
      </div>

      {/* Empty-fields indicator */}
      {emptyCount > 0 && (
        <div style={{
          padding: "6px 14px", fontSize: 11, color: "#7a7069",
          borderTop: `1px solid ${colors.bg}`, background: "#FAFAF8",
          display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0,
        }}>
          <span>Noch {emptyCount} {emptyCount === 1 ? "Feld" : "Felder"} leer</span>
          {firstEmptyLabel && currentStep !== firstEmptyIndex && (
            <button
              onClick={onJumpToFirstEmpty}
              style={{
                background: "transparent", color: colors.header,
                border: "none", padding: 0, fontSize: 11, cursor: "pointer",
                fontFamily: "Plus Jakarta Sans, sans-serif", fontWeight: 600,
                textDecoration: "underline",
              }}
            >→ {firstEmptyLabel}</button>
          )}
        </div>
      )}

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
            display: "inline-flex", alignItems: "center", gap: 6,
          }}
        ><ArrowLeft size={13} /> Zurück</button>
        {isLast && !allFilled ? (
          <button
            onClick={onJumpToFirstEmpty}
            style={{
              background: colors.header, color: "#fff",
              border: "none", borderRadius: 8, padding: "7px 16px", fontSize: 13,
              cursor: "pointer", fontFamily: "Plus Jakarta Sans, sans-serif", fontWeight: 600,
              display: "inline-flex", alignItems: "center", gap: 6,
            }}
            title={`Springt zum ersten leeren Feld: ${firstEmptyLabel}`}
          >Zu {firstEmptyLabel} <ArrowRight size={13} /></button>
        ) : (
          <button
            onClick={onNext}
            style={{
              background: isLast ? colors.header : colors.bg,
              color: isLast ? "#fff" : "#555",
              border: "none", borderRadius: 8, padding: "7px 16px", fontSize: 13,
              cursor: "pointer", fontFamily: "Plus Jakarta Sans, sans-serif", fontWeight: 600,
              display: "inline-flex", alignItems: "center", gap: 6,
            }}
          >{isLast ? <><Check size={13} /> Fertig</> : <>Nächster Bereich <ArrowRight size={13} /></>}</button>
        )}
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
  const helpBtnRef = useRef(null);
  const [helpPos, setHelpPos] = useState(null);

  useEffect(() => {
    if (!isHelpOpen) { setHelpPos(null); return; }
    const compute = () => {
      const btn = helpBtnRef.current;
      if (!btn) return;
      const r = btn.getBoundingClientRect();
      const width = 300;
      const margin = 12;
      let right = Math.max(margin, window.innerWidth - r.right);
      if (right + width > window.innerWidth - margin) right = margin;
      setHelpPos({ top: r.bottom + 6, right });
    };
    compute();
    const close = () => onToggleHelp(null);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [isHelpOpen, onToggleHelp]);
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
          <span style={{ fontWeight: 600, fontSize: 13, color: "#1A1A1A", lineHeight: 1.25 }}>{label}</span>
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center", flexShrink: 0 }}>
          {isFilled && (
            <span title="Gespeichert" style={{ color: "#5A8A6B", display: "inline-flex", alignItems: "center" }}>
              <Check size={14} strokeWidth={2.5} />
            </span>
          )}
          {isActive && (
            <span style={{ fontSize: 10, background: colors.header, color: "#fff", borderRadius: 4, padding: "1px 6px", fontWeight: 600, letterSpacing: 0.4 }}>
              AKTIV
            </span>
          )}
          <button
            ref={helpBtnRef}
            onClick={(e) => { e.stopPropagation(); onToggleHelp(isHelpOpen ? null : fieldKey); }}
            title="Mehr Infos & Beispiel"
            style={{
              background: isHelpOpen ? "#F2F2F2" : "transparent",
              border: "1px solid #E5E3DF", borderRadius: 4, color: "#7a7069",
              cursor: "pointer", padding: "2px 4px",
              display: "inline-flex", alignItems: "center", justifyContent: "center",
            }}
          ><Info size={13} /></button>
        </div>
      </div>

      {/* Always-visible leitfrage */}
      <div style={{ padding: "0 12px 6px", color: "#7a7069", fontSize: 12, fontStyle: "italic", lineHeight: 1.4, flexShrink: 0 }}>
        {help.question}
      </div>

      {/* Help popover — position:fixed escapes overflow:hidden of the card */}
      {isHelpOpen && helpPos && (
        <>
          <div
            onClick={(e) => { e.stopPropagation(); onToggleHelp(null); }}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.05)", zIndex: 60 }}
          />
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: "fixed", top: helpPos.top, right: helpPos.right, zIndex: 61,
              width: 300, maxHeight: "60vh", overflowY: "auto",
              background: "#fff", border: "1px solid #ECEAE6",
              boxShadow: "0 12px 32px rgba(0,0,0,0.14)",
              borderRadius: 10, padding: "12px 14px",
              fontSize: 12, color: "#3a3a3a", lineHeight: 1.55,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 8 }}>
              <strong style={{ color: colors.header, fontSize: 12.5 }}>{label}</strong>
              <button
                onClick={(e) => { e.stopPropagation(); onToggleHelp(null); }}
                title="Schließen"
                style={{ background: "transparent", border: "none", cursor: "pointer", color: "#7a7069", padding: 2, display: "inline-flex" }}
              ><X size={14} /></button>
            </div>
            <p style={{ margin: "0 0 10px" }}>{help.explanation}</p>
            <p style={{ margin: 0, color: "#7a7069", fontSize: 11.5 }}>
              <strong style={{ color: colors.header }}>Beispiel ({contextShort}):</strong> {help.examples[contextKey]}
            </p>
          </div>
        </>
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
  const [mode, setMode] = useState("guided");
  const [fields, setFields] = useState({});
  const [helpOpen, setHelpOpen] = useState(null);
  const [guidedStep, setGuidedStep] = useState(0);
  const [chatMessages, setChatMessages] = useState({});
  const [chatInput, setChatInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [suggestion, setSuggestion] = useState({});
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [showCanvasInfo, setShowCanvasInfo] = useState(false);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [authInput, setAuthInput] = useState("");
  const [authError, setAuthError] = useState("");
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
    if (USE_PROXY && !localStorage.getItem("lean-canvas-password")) {
      setShowAuthDialog(true);
    }
    const onAuthRequired = () => { setAuthError("Falsches oder fehlendes Passwort."); setShowAuthDialog(true); };
    window.addEventListener("lean-canvas-auth-required", onAuthRequired);
    return () => window.removeEventListener("lean-canvas-auth-required", onAuthRequired);
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
    const currentValue = fields[fieldKey]?.trim();
    const currentValueNote = currentValue
      ? `\n\nDer Nutzer hat bereits geschrieben: "${currentValue}". Stelle EINE gezielte Frage, die genau diesen Inhalt schärft. Keine Würdigung, keine Wiederholung der Leitfrage.`
      : ` Stelle EINE einstiegsfreundliche Frage, um das Feld zu starten.`;
    const prompt = `Feld: "${fieldLabel}". Kontext: ${CONTEXTS[context].example}. ${help.explanation} Leitfrage: ${help.question}${contextNote}${currentValueNote}`;

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
    const currentVal = fields[fieldKey]?.trim();
    const currentValPrefix = currentVal ? ` Der Nutzer hat aktuell folgenden Inhalt im Feld: "${currentVal}".` : "";
    const apiMessages = [
      { role: "user", content: `Feld: "${getFieldLabel(fieldKey)}". Kontext: ${CONTEXTS[context].example}. ${help.explanation}${currentValPrefix}` },
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
    handleFieldChange(fieldKey, stripMarkdown(suggestion[fieldKey]));
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
  const firstEmptyIndex = GUIDED_SEQUENCE.findIndex(k => !fields[k]?.trim());
  const emptyCount = GUIDED_SEQUENCE.filter(k => !fields[k]?.trim()).length;
  const firstEmptyLabel = firstEmptyIndex >= 0 ? getFieldLabel(GUIDED_SEQUENCE[firstEmptyIndex]) : null;
  const jumpToFirstEmpty = () => { if (firstEmptyIndex >= 0) goToStep(firstEmptyIndex); };

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
      <div style={{ textAlign: "center", marginBottom: 14 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: "#1A1A1A", margin: "0 0 3px", letterSpacing: -0.4 }}>Lean Canvas</h1>
        <p style={{ color: "#7a7069", fontSize: 12, margin: 0 }}>
          Interaktives Business-Modell-Tool · <span style={{ color: "#5A8A6B", fontWeight: 500, display: "inline-flex", alignItems: "center", gap: 4 }}><Check size={12} strokeWidth={2.5} /> Eingaben lokal gespeichert</span>
        </p>
      </div>

      {/* Intro — centered */}
      <div style={{
        maxWidth: 1180, margin: "0 auto 14px", padding: "10px 16px",
        background: "#fff", border: "1px solid #ECEAE6", borderRadius: 10,
        textAlign: "center",
        fontSize: 12, color: "#3a3a3a", lineHeight: 1.6,
      }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
          <strong style={{ color: "#1A1A1A", fontWeight: 600 }}>So gehst du vor:</strong>
          <span><strong style={{ color: "#1A1A1A" }}>1.</strong> Kontext wählen</span>
          <span style={{ color: "#c4c4c4" }}>·</span>
          <span><strong style={{ color: "#1A1A1A" }}>2.</strong> Modus wählen</span>
          <span style={{ color: "#c4c4c4" }}>·</span>
          <span><strong style={{ color: "#1A1A1A" }}>3.</strong> Felder 1–9 ausfüllen <em style={{ color: "#7a7069" }}>(Problem zuerst)</em></span>
          <button
            onClick={() => setShowCanvasInfo(true)}
            style={{
              background: "transparent", border: "none", color: "#5A8A6B",
              cursor: "pointer", fontWeight: 600, fontSize: 12,
              fontFamily: "Plus Jakarta Sans, sans-serif",
              display: "inline-flex", alignItems: "center", gap: 4, padding: 0,
            }}
          ><Info size={13} /> Mehr zum Canvas</button>
        </span>
      </div>

      {/* Canvas info modal */}
      {showCanvasInfo && (
        <div
          onClick={() => setShowCanvasInfo(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20 }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: "#fff", border: "1px solid #ECEAE6", borderRadius: 14, padding: "24px 28px", maxWidth: 560, width: "100%", maxHeight: "85vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.18)" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#1A1A1A" }}>Über das Lean Canvas</h3>
              <button
                onClick={() => setShowCanvasInfo(false)}
                style={{ background: "transparent", border: "none", cursor: "pointer", color: "#7a7069", padding: 4, display: "inline-flex" }}
              ><X size={18} /></button>
            </div>
            <div style={{ fontSize: 13, color: "#3a3a3a", lineHeight: 1.6 }}>
              <p style={{ margin: "0 0 10px" }}>
                Das Lean Canvas wurde 2010 von <strong>Ash Maurya</strong> entwickelt — als problemfokussierte Variante des Business Model Canvas, speziell für frühe Geschäftsideen und Startups.
              </p>
              <h4 style={{ margin: "16px 0 6px", fontSize: 13, color: "#1A1A1A", fontWeight: 600 }}>Verwandt: Business Model Canvas</h4>
              <p style={{ margin: "0 0 8px" }}>
                Das <strong>Business Model Canvas</strong> (Osterwalder, 2008) ist der Vorläufer — ein Strategie-Tool für etablierte Geschäftsmodelle mit Fokus auf Partnerschaften, Schlüsselaktivitäten und Kundenbeziehungen. Maurya tauschte vier Felder aus, um es für Startups passender zu machen: <strong>Problem</strong> statt Key Partners, <strong>Lösung</strong> statt Key Activities, <strong>Kennzahlen</strong> statt Key Resources, <strong>Unfairer Vorteil</strong> statt Customer Relationships.
              </p>
              <h4 style={{ margin: "16px 0 6px", fontSize: 13, color: "#1A1A1A", fontWeight: 600 }}>Warum Reihenfolge 1–9?</h4>
              <p style={{ margin: "0 0 8px" }}>
                Die räumliche Anordnung folgt der klassischen Canvas-Optik (Problem links, Wertversprechen Mitte, Kunde rechts). Die Bearbeitungsreihenfolge ist aber eine andere — sie folgt der Logik:
              </p>
              <ol style={{ margin: "0 0 10px", paddingLeft: 20 }}>
                <li><strong>Problem & Kundensegment</strong> zuerst — ohne klares Problem keine Lösung.</li>
                <li><strong>UVP</strong> als Brücke zwischen Problem und Lösung.</li>
                <li><strong>Lösung & Kanäle</strong> — wie und worüber.</li>
                <li><strong>Einnahmen & Kosten</strong> — Wirtschaftlichkeit prüfen.</li>
                <li><strong>Kennzahlen & Unfairer Vorteil</strong> zum Schluss — Messung und Differenzierung.</li>
              </ol>
              <h4 style={{ margin: "16px 0 6px", fontSize: 13, color: "#1A1A1A", fontWeight: 600 }}>Wie der Coach arbeitet</h4>
              <p style={{ margin: "0 0 8px" }}>
                Im Geführten Modus stellt der KI-Coach <strong>eine Frage pro Schritt</strong>. Er gibt keine fertigen Antworten — du formulierst selbst. Erst wenn du genug Substanz geliefert hast, schlägt er eine Formulierung vor, die du übernehmen oder anpassen kannst.
              </p>
              <p style={{ margin: 0, color: "#7a7069", fontSize: 12, fontStyle: "italic" }}>
                Lerne durch Tun. Die KI ist Sparring-Partnerin, nicht Generator.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Context selector + Mode toggle in one row */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 14, alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 11, color: "#7a7069", fontWeight: 600, letterSpacing: 0.6, textTransform: "uppercase" }}>Kontext</span>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "center" }}>
            {Object.entries(CONTEXTS).map(([key, ctx]) => (
              <button key={key} onClick={() => setContext(key)} style={{
                background: context === key ? "#1A1A1A" : "#fff",
                color: context === key ? "#fff" : "#1A1A1A",
                border: `1px solid ${context === key ? "#1A1A1A" : "#E5E3DF"}`,
                borderRadius: 8, padding: "6px 12px", fontSize: 12, cursor: "pointer",
                fontFamily: "Plus Jakarta Sans, sans-serif",
                fontWeight: context === key ? 600 : 500, transition: "all 0.15s",
              }}>{ctx.label}</button>
            ))}
          </div>
        </div>
        <div style={{ width: 1, height: 28, background: "#E5E3DF" }} />
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 11, color: "#7a7069", fontWeight: 600, letterSpacing: 0.6, textTransform: "uppercase" }}>Modus</span>
          <div style={{ background: "#F2F2F0", border: "1px solid #DCDAD3", borderRadius: 8, padding: 3, display: "flex", gap: 3 }}>
            {[["self", "Selbst ausfüllen", Pencil], ["guided", "Geführter Modus", Sparkles]].map(([val, lbl, Icon]) => (
              <button key={val} onClick={() => { setMode(val); if (val === "guided") { setGuidedStep(0); setChatInput(""); } }} style={{
                background: mode === val ? "#1A1A1A" : "transparent",
                color: mode === val ? "#fff" : "#3a3a3a",
                border: "none", borderRadius: 6, padding: "6px 14px", fontSize: 12, cursor: "pointer",
                fontFamily: "Plus Jakarta Sans, sans-serif",
                fontWeight: mode === val ? 600 : 500, transition: "all 0.15s",
                display: "inline-flex", alignItems: "center", gap: 6,
              }}><Icon size={13} />{lbl}</button>
            ))}
          </div>
        </div>
      </div>

      {mode === "guided" && (
        <div style={{ textAlign: "center", fontSize: 13, color: "#3a3a3a", background: "#fff", border: "1px solid #ECEAE6", padding: "10px 20px", borderRadius: 10, maxWidth: 560, margin: "0 auto 18px" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
            <Sparkles size={14} color="#5A8A6B" /> Der Coach führt dich Schritt für Schritt durch den Canvas. Klicke auf ein Feld, um dorthin zu springen.
          </span>
        </div>
      )}

      {/* Canvas + optional guided panel */}
      <div style={{ display: "flex", gap: 20, maxWidth: mode === "guided" ? 1580 : 1200, margin: "0 auto 24px", alignItems: "flex-start" }}>

        {/* Canvas grid */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(10, 1fr)", gridTemplateRows: "auto auto auto", gap: 12 }}>
            {card("problem",   { gridColumn: "1 / 3",  gridRow: "1 / 3", minHeight: 380 })}
            {card("solution",  { gridColumn: "3 / 5",  gridRow: "1 / 2", minHeight: 185 })}
            {card("uvp",       { gridColumn: "5 / 7",  gridRow: "1 / 3", minHeight: 380 })}
            {card("unfair",    { gridColumn: "7 / 9",  gridRow: "1 / 2", minHeight: 185 })}
            {card("customers", { gridColumn: "9 / 11", gridRow: "1 / 3", minHeight: 380 })}
            {card("metrics",   { gridColumn: "3 / 5",  gridRow: "2 / 3", minHeight: 185 })}
            {card("channels",  { gridColumn: "7 / 9",  gridRow: "2 / 3", minHeight: 185 })}
            {card("costs",     { gridColumn: "1 / 6",  gridRow: "3 / 4", minHeight: 175 })}
            {card("revenue",   { gridColumn: "6 / 11", gridRow: "3 / 4", minHeight: 175 })}
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
            importHint={FIELD_HELP[currentGuidedKey]?.importHint}
            msgs={chatMessages[currentGuidedKey] || []}
            loading={loading}
            chatInput={chatInput}
            hasSuggestion={!!suggestion[currentGuidedKey]}
            chatEndRef={chatEndRef}
            emptyCount={emptyCount}
            firstEmptyIndex={firstEmptyIndex}
            firstEmptyLabel={firstEmptyLabel}
            onSendMessage={sendChatMessage}
            onChatInputChange={setChatInput}
            onAdoptSuggestion={adoptSuggestion}
            onNext={() => {
              const fk = currentGuidedKey;
              const hasPending = !!suggestion[fk];
              const isEmpty = !fields[fk]?.trim();
              if (hasPending && isEmpty) { adoptSuggestion(fk); return; }
              if (guidedStep < GUIDED_SEQUENCE.length - 1) goToStep(guidedStep + 1);
            }}
            onBack={() => guidedStep > 0 ? goToStep(guidedStep - 1) : null}
            onJumpToFirstEmpty={jumpToFirstEmpty}
          />
        )}
      </div>

      {/* Action buttons */}
      <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
        <button onClick={copyAsText} style={{
          background: copySuccess ? "#5A8A6B" : "#fff", color: copySuccess ? "#fff" : "#1A1A1A",
          border: `1px solid ${copySuccess ? "#5A8A6B" : "#E5E3DF"}`, borderRadius: 8, padding: "9px 18px", fontSize: 13,
          cursor: "pointer", fontFamily: "Plus Jakarta Sans, sans-serif", fontWeight: 500, transition: "all 0.2s",
          display: "inline-flex", alignItems: "center", gap: 7,
        }}>{copySuccess ? <><Check size={14} /> Kopiert!</> : <><Copy size={14} /> Als Text kopieren</>}</button>
        <button onClick={downloadAsMarkdown} style={{
          background: "#fff", color: "#1A1A1A", border: "1px solid #E5E3DF",
          borderRadius: 8, padding: "9px 18px", fontSize: 13, cursor: "pointer",
          fontFamily: "Plus Jakarta Sans, sans-serif", fontWeight: 500,
          display: "inline-flex", alignItems: "center", gap: 7,
        }}><Download size={14} /> Als Markdown herunterladen</button>
        <button onClick={() => setShowClearDialog(true)} style={{
          background: "#fff", color: "#B05A3F", border: "1px solid #ECD8CB",
          borderRadius: 8, padding: "9px 18px", fontSize: 13, cursor: "pointer",
          fontFamily: "Plus Jakarta Sans, sans-serif", fontWeight: 500,
          display: "inline-flex", alignItems: "center", gap: 7,
        }}><RotateCcw size={14} /> Canvas leeren</button>
      </div>

      {/* Auth dialog */}
      {showAuthDialog && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1100, padding: 20 }}>
          <div style={{ background: "#fff", border: "1px solid #ECEAE6", borderRadius: 14, padding: 28, maxWidth: 380, width: "100%", boxShadow: "0 20px 60px rgba(0,0,0,0.18)" }}>
            <h3 style={{ margin: "0 0 6px", color: "#1A1A1A", fontSize: 17, fontWeight: 700 }}>Zugang zum Lean Canvas</h3>
            <p style={{ color: "#7a7069", fontSize: 13, margin: "0 0 16px", lineHeight: 1.5 }}>
              Dieses Tool ist für die Kohorte freigeschaltet. Bitte gib das Kurs-Passwort ein.
            </p>
            <input
              type="password"
              autoFocus
              value={authInput}
              onChange={(e) => { setAuthInput(e.target.value); setAuthError(""); }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && authInput.trim()) {
                  localStorage.setItem("lean-canvas-password", authInput.trim());
                  setShowAuthDialog(false);
                  setAuthInput("");
                  setAuthError("");
                }
              }}
              placeholder="Passwort"
              style={{
                width: "100%", padding: "10px 12px", fontSize: 14,
                border: `1.5px solid ${authError ? "#B05A3F" : "#E5E3DF"}`, borderRadius: 8,
                fontFamily: "Plus Jakarta Sans, sans-serif", outline: "none", color: "#1A1A1A",
                boxSizing: "border-box",
              }}
            />
            {authError && <p style={{ color: "#B05A3F", fontSize: 12, margin: "6px 0 0" }}>{authError}</p>}
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}>
              <button
                onClick={() => {
                  if (!authInput.trim()) return;
                  localStorage.setItem("lean-canvas-password", authInput.trim());
                  setShowAuthDialog(false);
                  setAuthInput("");
                  setAuthError("");
                }}
                disabled={!authInput.trim()}
                style={{
                  background: "#1A1A1A", color: "#fff", border: "none", borderRadius: 8,
                  padding: "9px 22px", fontSize: 13, cursor: authInput.trim() ? "pointer" : "not-allowed",
                  opacity: authInput.trim() ? 1 : 0.4,
                  fontFamily: "Plus Jakarta Sans, sans-serif", fontWeight: 600,
                }}
              >Freischalten</button>
            </div>
          </div>
        </div>
      )}

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
