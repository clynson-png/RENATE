import { useCallback, useEffect, useRef, useState } from "react";
import RulesReader from "./RulesReader.jsx";

async function request(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const failure = new Error(payload.error || `A API respondeu com HTTP ${response.status}.`);
    failure.payload = payload;
    throw failure;
  }
  return payload;
}

async function streamRequest(path, body, onStatus) {
  const response = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "text/event-stream" },
    body: JSON.stringify({ ...body, stream: true }),
  });
  if (!response.ok || !response.headers.get("content-type")?.includes("text/event-stream")) {
    const payload = await response.json().catch(() => ({}));
    const failure = new Error(payload.error || `A API respondeu com HTTP ${response.status}.`);
    failure.payload = payload;
    throw failure;
  }
  if (!response.body) throw new Error("A conexão de resposta progressiva foi encerrada.");
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let finalEvent = null;
  const dispatch = (block) => {
    let eventName = "message";
    const dataLines = [];
    for (const line of block.split(/\r?\n/)) {
      if (line.startsWith("event:")) eventName = line.slice(6).trim();
      else if (line.startsWith("data:")) dataLines.push(line.slice(5).trimStart());
    }
    if (!dataLines.length) return;
    let payload;
    try { payload = JSON.parse(dataLines.join("\n")); } catch { return; }
    // Provisional Qwen tokens are not an answer. Keep the Skin in its
    // progress state until the API sends the final, provenance-checked event.
    if ((eventName === "status" || eventName === "clarification") && typeof onStatus === "function") {
      onStatus({ ...payload, event: eventName });
    }
    if (eventName === "final") finalEvent = payload;
  };
  while (true) {
    const { value, done } = await reader.read();
    buffer += decoder.decode(value || new Uint8Array(), { stream: !done });
    const blocks = buffer.split(/\r?\n\r?\n/);
    buffer = blocks.pop() || "";
    for (const block of blocks) dispatch(block);
    if (finalEvent) {
      await reader.cancel().catch(() => {});
      break;
    }
    if (done) break;
  }
  if (buffer.trim()) dispatch(buffer);
  if (!finalEvent) throw new Error("A resposta progressiva terminou sem o evento final da API.");
  if (finalEvent.http_status !== 200) {
    const failure = new Error(finalEvent.payload?.error || "A consulta não foi concluída.");
    failure.payload = finalEvent.payload || {};
    throw failure;
  }
  return finalEvent.payload;
}

function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(date);
}

function answerTitle(status, result = {}) {
  if (result.clarification_state?.required_context === "slot") return "Esclarecimento para completar a resposta";
  if (result.clarification_required || status === "CLARIFICATION_REQUIRED") return "Ajuste sua pergunta";
  if (result.automatic_validation_status === "INCOMPLETE_OR_UNSUPPORTED") return "Resposta não validada — suporte incompleto";
  if (status === "ANSWERED_PARTIAL") return "Resposta parcial — lacunas identificadas";
  if (status === "EVIDENCE_READY") return "Trechos encontrados na Library";
  if (status === "EVIDENCE_PARTIAL") return "Evidências parciais — faltam relações";
  if (status === "ANSWERED") return "Resposta";
  if (status === "API_INTERNAL_ERROR") return "Falha interna da API";
  if (status === "MODEL_GENERATING") return "Resposta em elaboração";
  if (status === "INSUFFICIENT_EVIDENCE") return "A composição não foi concluída";
  if (status === "MODEL_UNAVAILABLE") return "O modelo local não respondeu";
  if (status === "MODEL_INCOMPLETE") return "A resposta ficou incompleta";
  if (status === "REQUEST_FAILED") return "O envio foi interrompido";
  if (status === "RETRIEVAL_UNAVAILABLE" || status === "LIBRARY_UNAVAILABLE") return "A biblioteca está indisponível";
  return "Não foi possível concluir a consulta";
}

export default function App() {
  const [activeScreen, setActiveScreen] = useState("conversation");
  const [health, setHealth] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [question, setQuestion] = useState("");
  const [internetAccess, setInternetAccess] = useState(true);
  const [busy, setBusy] = useState(false);
  const [clearingHistory, setClearingHistory] = useState(false);
  const [error, setError] = useState("");
  const [historyNotice, setHistoryNotice] = useState("");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [voiceOutputSupported, setVoiceOutputSupported] = useState(false);
  const [voiceListening, setVoiceListening] = useState(false);
  const [voiceError, setVoiceError] = useState("");
  const [voiceRepliesEnabled, setVoiceRepliesEnabled] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState(null);
  const endRef = useRef(null);
  const inputRef = useRef(null);
  const voiceRecognitionRef = useRef(null);
  const voiceBaseTextRef = useRef("");

  const rememberConversation = useCallback((id) => {
    setConversationId(id || null);
    try {
      if (id) window.localStorage.setItem("adana.activeConversationId", id);
      else window.localStorage.removeItem("adana.activeConversationId");
    } catch { /* Keep conversation rendering available when storage is blocked. */ }
  }, []);

  useEffect(() => {
    setVoiceSupported(Boolean(window.SpeechRecognition || window.webkitSpeechRecognition));
    setVoiceOutputSupported(Boolean(window.speechSynthesis && window.SpeechSynthesisUtterance));
    return () => {
      voiceRecognitionRef.current?.stop?.();
      voiceRecognitionRef.current = null;
      window.speechSynthesis?.cancel?.();
    };
  }, []);

  function speakAnswer(text, messageId = null) {
    if (!window.speechSynthesis || !window.SpeechSynthesisUtterance) {
      setVoiceError("A leitura de respostas não está disponível neste navegador.");
      return;
    }
    window.speechSynthesis.cancel();
    if (speakingMessageId === messageId && messageId !== null) {
      setSpeakingMessageId(null);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "pt-BR";
    utterance.onstart = () => setSpeakingMessageId(messageId || "active");
    utterance.onend = () => setSpeakingMessageId(null);
    utterance.onerror = () => {
      setSpeakingMessageId(null);
      setVoiceError("Não consegui reproduzir a resposta em voz.");
    };
    window.speechSynthesis.speak(utterance);
  }

  function toggleVoiceInput() {
    if (voiceListening) {
      voiceRecognitionRef.current?.stop?.();
      return;
    }
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) {
      setVoiceError("O reconhecimento de voz não está disponível neste navegador.");
      return;
    }
    setVoiceError("");
    voiceBaseTextRef.current = question.trim();
    try {
      const recognition = new Recognition();
      recognition.lang = "pt-BR";
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      recognition.onstart = () => setVoiceListening(true);
      recognition.onresult = (event) => {
        const transcript = Array.from(event.results || [])
          .map((result) => result[0]?.transcript || "")
          .join(" ")
          .trim();
        if (!transcript) return;
        const base = voiceBaseTextRef.current;
        setQuestion(base ? `${base} ${transcript}` : transcript);
        window.requestAnimationFrame(() => inputRef.current?.focus());
      };
      recognition.onerror = (event) => {
        const messages = {
          "not-allowed": "Permita o acesso ao microfone no navegador para ditar a pergunta.",
          "service-not-allowed": "O navegador não autorizou o serviço de reconhecimento de voz.",
          "no-speech": "Não detectei fala. Tente novamente ou digite sua pergunta.",
          network: "O serviço de reconhecimento de voz está indisponível. Você pode digitar a pergunta.",
          aborted: "A captura de voz foi interrompida.",
        };
        setVoiceError(messages[event.error] || "Não consegui transcrever a fala. Você pode digitar a pergunta.");
        setVoiceListening(false);
      };
      recognition.onend = () => {
        setVoiceListening(false);
        voiceRecognitionRef.current = null;
      };
      voiceRecognitionRef.current = recognition;
      recognition.start();
    } catch {
      voiceRecognitionRef.current = null;
      setVoiceListening(false);
      setVoiceError("Não foi possível iniciar o microfone. Confira a permissão do navegador.");
    }
  }

  const refreshHealth = useCallback(async () => {
    try {
      const data = await request("/health");
      setHealth(data);
    } catch {
      setHealth({ status: "degraded", components: {} });
    }
  }, []);

  const refreshConversations = useCallback(async () => {
    const data = await request("/v1/conversations");
    setConversations(data.conversations || []);
    return data.conversations || [];
  }, []);

  const openConversation = useCallback(async (id) => {
    setError("");
    rememberConversation(id);
    setMobileSidebarOpen(false);
    const data = await request(`/v1/conversations/${encodeURIComponent(id)}`);
    setMessages(data.messages || []);
  }, [rememberConversation]);

  const createConversation = useCallback(async () => {
    setError("");
    const data = await request("/v1/conversations", { method: "POST", body: "{}" });
    rememberConversation(data.conversation.id);
    setMessages([]);
    setConversations((current) => [data.conversation, ...current]);
    setMobileSidebarOpen(false);
    inputRef.current?.focus();
  }, [rememberConversation]);

  useEffect(() => {
    let active = true;
    refreshHealth();
    const timer = window.setInterval(refreshHealth, 20000);
    refreshConversations()
      .then((items) => {
        if (!active) return;
        if (!items.length) {
          rememberConversation(null);
          setMessages([]);
          return;
        }
        let rememberedId = null;
        try { rememberedId = window.localStorage.getItem("adana.activeConversationId"); } catch { /* Use the newest saved conversation. */ }
        const selected = items.find((item) => item.id === rememberedId) || items[0];
        if (selected?.id) openConversation(selected.id);
      })
      .catch((cause) => active && setError(cause.message));
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [createConversation, openConversation, refreshConversations, refreshHealth, rememberConversation]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, busy]);

  async function submitQuestion(event, selectedResearchPassageId = null, originalQuestion = null) {
    event?.preventDefault?.();
    const text = (originalQuestion || question).trim();
    if (!text || busy || text.length > 4000) return;
    if (voiceListening) voiceRecognitionRef.current?.stop?.();
    setError("");
    setBusy(true);
    const pendingId = `stream-${Date.now()}`;
    let activeId = conversationId;
    const existingMessageIds = new Set(messages.map((item) => String(item.id)));
    try {
      if (!activeId) {
        const created = await request("/v1/conversations", { method: "POST", body: "{}" });
        activeId = created.conversation.id;
        rememberConversation(activeId);
      }
      setMessages((current) => [...current, {
        id: pendingId,
        question: text,
        created_at: new Date().toISOString(),
        result: { answer_status: "MODEL_GENERATING", answer: "", progress_message: "Consulta recebida; preparando a busca." },
      }]);
      const streamed = await streamRequest(`/v1/conversations/${encodeURIComponent(activeId)}/messages`,
        {
          question: text,
          answer_mode: "response",
          include_citations: true,
          internet_access: internetAccess,
          ...(selectedResearchPassageId ? { selected_research_passage_id: selectedResearchPassageId } : {}),
        }, (progress) => {
        setMessages((current) => current.map((item) => item.id === pendingId
          ? { ...item, result: {
            ...item.result,
            progress_message: progress.message || item.result.progress_message,
            ...(progress.clarification_prompt ? { clarification_prompt: progress.clarification_prompt } : {}),
            ...(progress.stage === "competition_card_ready"
              && progress.competition_card?.status === "READY"
              && typeof progress.competition_card?.event_id === "string"
              && Boolean(progress.competition_card?.image_url)
              ? { competition_card: progress.competition_card }
              : {}),
          } }
          : item));
      });
      const savedMessage = streamed?.message_id && streamed?.result
        ? { id: streamed.message_id, question: streamed.question || text,
            result: streamed.result, created_at: new Date().toISOString() }
        : null;
      let latestAnswer = savedMessage?.result?.answer || streamed?.result?.answer || "";
      let finalAnswerStatus = savedMessage?.result?.answer_status || streamed?.result?.answer_status || "";
      let renderedPersistedThread = false;
      try {
        const thread = await request(`/v1/conversations/${encodeURIComponent(activeId)}`);
        if (Array.isArray(thread.messages) && thread.messages.length) {
          setMessages(thread.messages);
          renderedPersistedThread = true;
          const currentMessage = [...thread.messages].reverse().find((item) => item.question === text);
          latestAnswer = currentMessage?.result?.answer
            || [...thread.messages].reverse().find((item) => item.result?.answer)?.result?.answer
            || latestAnswer;
          finalAnswerStatus = currentMessage?.result?.answer_status || finalAnswerStatus;
        }
      } catch {
        // The successful SSE result below remains renderable if the history read fails.
      }
      if (!renderedPersistedThread) {
        const fallbackMessage = savedMessage || (streamed?.result ? {
          id: streamed.message_id || pendingId,
          question: streamed.question || text,
          created_at: new Date().toISOString(),
          result: streamed.result,
        } : {
          id: pendingId,
          question: text,
          created_at: new Date().toISOString(),
          result: {
            answer_status: "REQUEST_FAILED",
            answer: "A API respondeu, mas não consegui atualizar o histórico desta conversa.",
          },
        });
        finalAnswerStatus = fallbackMessage.result?.answer_status || finalAnswerStatus;
        setMessages((current) => {
          const found = current.some((item) => item.id === pendingId);
          return found
            ? current.map((item) => item.id === pendingId ? fallbackMessage : item)
            : [...current, fallbackMessage];
        });
      }
      await Promise.all([refreshConversations(), refreshHealth()]);
      if (voiceRepliesEnabled) {
        if (latestAnswer) speakAnswer(latestAnswer);
      }
      setQuestion(finalAnswerStatus === "CLARIFICATION_REQUIRED" ? text : "");
    } catch (cause) {
      let recoveredMessage = null;
      if (activeId) {
        try {
          const thread = await request(`/v1/conversations/${encodeURIComponent(activeId)}`);
          recoveredMessage = [...(thread.messages || [])].reverse().find((item) =>
            item.question === text && !existingMessageIds.has(String(item.id))) || null;
          if (recoveredMessage) {
            setMessages(thread.messages || []);
            setError("");
            setQuestion(recoveredMessage.result?.answer_status === "CLARIFICATION_REQUIRED" ? text : "");
            if (voiceRepliesEnabled && recoveredMessage.result?.answer) {
              speakAnswer(recoveredMessage.result.answer, recoveredMessage.id);
            }
            refreshConversations();
            refreshHealth();
          }
        } catch {
          // Keep the visible failure below when the persisted thread is unavailable too.
        }
      }
      if (recoveredMessage) return;
      const statusMessages = {
        MODEL_UNAVAILABLE: "O modelo local não respondeu. Verifique se o llamafile está iniciado e tente novamente.",
        RETRIEVAL_UNAVAILABLE: "A busca local está indisponível. Verifique o Meilisearch e tente novamente.",
        LIBRARY_UNAVAILABLE: "O catálogo da biblioteca não pôde ser carregado. Tente novamente após verificar a Library.",
        STORAGE_UNAVAILABLE: "Não foi possível salvar esta conversa. A resposta não foi adicionada ao histórico.",
      };
      const failureStatus = cause.payload?.answer_status || "REQUEST_FAILED";
      const failureMessage = statusMessages[failureStatus] || cause.message || "A consulta falhou. Tente novamente.";
      setMessages((current) => current.map((item) => item.id === pendingId
        ? { ...item, result: { answer_status: failureStatus, answer: failureMessage } }
        : item));
      setError(failureMessage);
      refreshHealth();
    } finally {
      setBusy(false);
      inputRef.current?.focus();
    }
  }

  async function deleteConversation(id) {
    if (!window.confirm("Excluir esta conversa e as referências salvas nela?")) return;
    try {
      await request(`/v1/conversations/${encodeURIComponent(id)}`, { method: "DELETE" });
      const remaining = await refreshConversations();
      if (id === conversationId) {
        if (remaining.length) await openConversation(remaining[0].id);
        else await createConversation();
      }
    } catch (cause) {
      setError(cause.message);
    }
  }

  async function clearHistory() {
    if (busy || clearingHistory || conversations.length === 0) return;
    if (!window.confirm("Limpar todas as conversas? Antes de apagar, o histórico será arquivado em audits/old_history.")) return;
    setError("");
    setHistoryNotice("");
    setClearingHistory(true);
    try {
      const result = await request("/v1/conversations/clear", { method: "POST", body: "{}" });
      setConversations([]);
      setMessages([]);
      rememberConversation(null);
      setMobileSidebarOpen(false);
      setHistoryNotice(result.archive_file
        ? `Histórico arquivado em ${result.archive_file}`
        : "Histórico já estava vazio.");
    } catch (cause) {
      setError(cause.message);
    } finally {
      setClearingHistory(false);
    }
  }

  function goHome() {
    setError("");
    setMobileSidebarOpen(false);
    inputRef.current?.focus();
  }

  function prepareQuestion(draft = "") {
    setQuestion(draft);
    setMobileSidebarOpen(false);
    window.requestAnimationFrame(() => inputRef.current?.focus());
  }

  const connected = health?.status === "available";
  const indexCount = health?.components?.library_index?.documents;

  if (activeScreen === "rules") return <RulesReader onBack={() => setActiveScreen("conversation")} />;

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileSidebarOpen ? "drawer-open" : ""}`}>
        <div className="brand-row">
          <div className="brand-mark" aria-hidden="true">A</div>
          <div><strong>ADANA</strong><span>Biblioteca de treinamento</span></div>
        </div>
        <button className="new-chat" onClick={createConversation} type="button"><span aria-hidden="true">＋</span> Nova conversa</button>
        <button className="clear-history" onClick={clearHistory} type="button" disabled={busy || clearingHistory || conversations.length === 0}>
          <span aria-hidden="true">⌫</span>{clearingHistory ? "Arquivando e limpando…" : "Limpar histórico"}
        </button>
        {historyNotice && <p className="clear-history-notice" role="status">{historyNotice}</p>}
        <div className="sidebar-label">Suas conversas</div>
        <nav className="conversation-list" aria-label="Conversas salvas">
          {conversations.map((item) => (
            <div className={`conversation-item ${item.id === conversationId ? "selected" : ""}`} key={item.id}>
              <button className="conversation-open" onClick={() => openConversation(item.id)} type="button" title={item.title}>
                <span className="conversation-title">{item.title || "Nova conversa"}</span>
                <span className="conversation-date">{formatDate(item.updated_at)}</span>
              </button>
              <button className="delete-chat" onClick={() => deleteConversation(item.id)} type="button" aria-label={`Excluir ${item.title || "conversa"}`} title="Excluir conversa">×</button>
            </div>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <span className={`status-dot ${connected ? "online" : "offline"}`} />
          <span>{connected ? "Serviços locais conectados" : "Serviço local indisponível"}</span>
          {Number.isInteger(indexCount) && <small>{indexCount.toLocaleString("pt-BR")} passagens catalogadas</small>}
        </div>
      </aside>
      <button className={`sidebar-scrim ${mobileSidebarOpen ? "open" : ""}`} aria-label="Fechar histórico" onClick={() => setMobileSidebarOpen(false)} type="button" />

      <main className="main-panel">
        <header className="topbar">
          <div className="topbar-start">
            <button className="history-toggle" aria-label="Abrir histórico de conversas" onClick={() => setMobileSidebarOpen(true)} type="button"><HistoryIcon /><span>Histórico</span></button>
            <button className="topbar-brand" onClick={goHome} type="button" aria-label="Ir para o início"><span className="brand-mark" aria-hidden="true">A</span><strong>ADANA</strong></button>
          </div>
          <button className="rules-topbar-link" type="button" onClick={() => setActiveScreen("rules")} aria-label="Abrir leitor de regras">REGRAS <span>↗</span></button>
          <div className={`connection-pill ${connected ? "connected" : "disconnected"}`}>
            <span className="status-dot" />{connected ? "Biblioteca pronta" : "Conectando serviços locais"}
          </div>
        </header>

        <section className={`conversation-view ${messages.length ? "has-messages" : "empty"}`} aria-live="polite">
          {messages.length === 0 ? (
            <div className="home-dashboard">
              <section className="home-branding" aria-label="ADANA">
                <div className="welcome-eyebrow"><span className="status-dot online" /> ASSISTENTE DE ESPORTES</div>
                <h1 className="home-wordmark"><span>A</span>DANA</h1>
                <p className="home-tagline">Regras claras. <strong>Treino com propósito.</strong></p>
                <div className={`voice-ready-pill ${voiceListening ? "is-listening" : ""}`}><span />{voiceListening ? "OUVINDO" : voiceSupported ? "PRONTO PARA OUVIR" : "CONSULTA POR TEXTO"}</div>
              </section>
              <div className={`voice-stage ${voiceListening ? "is-listening" : ""}`}>
                <Waveform className="waveform waveform-left" />
                <button className={`voice-orb ${voiceListening ? "listening" : ""}`} onClick={toggleVoiceInput} type="button" disabled={!voiceSupported || busy} aria-label={voiceListening ? "Parar de ouvir" : "Fazer pergunta por voz"} title={voiceSupported ? (voiceListening ? "Parar de ouvir" : "Falar pergunta") : "Use o campo de texto para perguntar"}>
                  <span className="voice-orb-ring" aria-hidden="true" />
                  <span className="voice-orb-core"><MicrophoneIcon /></span>
                </button>
                <Waveform className="waveform waveform-right" />
              </div>
              <p className="voice-hint">{voiceListening ? "Fale em português. Revise a transcrição antes de enviar." : voiceSupported ? "Toque no microfone para perguntar por voz" : "Digite sua pergunta no campo abaixo"}</p>
              <div className="instruction-card"><MessageIcon /><p>Para consultar uma regra,<br /><strong>diga o esporte e a situação.</strong></p></div>
              <div className="home-actions" aria-label="Ações da ADANA">
                <button className="home-action action-rules" type="button" onClick={() => setActiveScreen("rules")}><BookIcon /><span>Consultar regra</span><ChevronIcon /></button>
                <button className="home-action action-training unavailable" type="button" disabled title="Montagem de treinos ainda não está integrada ao HCI"><TrainingIcon /><span>Montar treino<small>Indisponível nesta versão</small></span><ChevronIcon /></button>
                <button className="home-action action-analysis" type="button" onClick={() => prepareQuestion("Descreva a situação esportiva que deseja analisar e informe a disciplina e a federação.")}><AnalysisIcon /><span>Analisar situação</span><ChevronIcon /></button>
              </div>
              <div className="home-note"><span className="status-dot online" /> {connected ? `${indexCount?.toLocaleString("pt-BR") || ""} passagens disponíveis na Library` : "Conectando aos serviços locais"}</div>
            </div>
          ) : (
            <div className="message-stack">
              <section className="home-branding conversation-brand" aria-label="ADANA em conversa">
                <div className="welcome-eyebrow"><span className="status-dot online" /> ASSISTENTE DE ESPORTES</div>
                <h1 className="home-wordmark"><span>A</span>DANA</h1>
                <p className="home-tagline">Regras claras. <strong>Treino com propósito.</strong></p>
                <div className={`voice-ready-pill ${busy ? "is-listening" : ""}`}><span />{busy ? "CONSULTANDO" : "CONVERSA ADANA"}</div>
              </section>
              {messages.map((message) => {
                const result = message.result || {};
                const allCitations = result.citations || [];
                const citations = allCitations.filter((citation) => ["EVIDENCE_READY", "EVIDENCE_PARTIAL", "ANSWERED_PARTIAL"].includes(result.answer_status)
                  || result.automatic_validation_status === "INCOMPLETE_OR_UNSUPPORTED"
                  || citation.source_role !== "NORMATIVE_RULE_SOURCE");
                const ruleDisclosures = result.rule_disclosures || [];
                const competitionCard = result.competition_card || result.decision_frame?.routing_contract?.competition_card;
                const isWspsEquipmentCard = String(competitionCard?.id || "").startsWith("WSPS_EQUIPMENT_");
                const resolvedEventId = String(
                  result.decision_frame?.routing_contract?.authority_event_route?.event_id
                  || competitionCard?.event_id
                  || ""
                );
                const phaseCardPhases = new Set(["qualification", "final"]);
                const isPhaseCard = Boolean(
                  competitionCard?.status === "READY"
                  && typeof competitionCard?.event_id === "string"
                  && competitionCard.event_id === resolvedEventId
                  && phaseCardPhases.has(String(competitionCard?.phase || "").toLowerCase())
                  && Boolean(competitionCard?.image_url)
                );
                const competitionCardFigures = competitionCard?.status === "READY"
                  ? [competitionCard, ...(competitionCard.supplemental_cards || [])]
                    .filter((card) => card?.status === "READY")
                    .map((card, cardIndex) => (
                      <figure className="competition-event-card" key={`${card.event_id}-${card.image_filename}-${cardIndex}`} style={{ margin: "18px 0", padding: "14px", border: "1px solid rgba(91, 205, 221, .24)", borderRadius: "14px", background: "rgba(7, 18, 22, .55)" }}>
                        <a href={card.image_url} target="_blank" rel="noreferrer" aria-label={`Ampliar card da prova ${card.event}`}>
                          <img src={card.image_url} alt={`${card.authority} · ${card.event} · ${card.phase ? `card da fase ${card.phase}` : "card de especificações da prova"}`} loading="eager" fetchPriority="high" onError={(event) => { event.currentTarget.hidden = true; const fallback = event.currentTarget.closest("figure")?.querySelector(".competition-card-image-fallback"); if (fallback) fallback.hidden = false; }} style={{ display: "block", maxWidth: "100%", maxHeight: "680px", objectFit: "contain", margin: "0 auto", borderRadius: "8px" }} />
                          <div className="competition-card-image-fallback" hidden style={{ padding: "22px", textAlign: "center", border: "1px dashed rgba(91, 205, 221, .35)", borderRadius: "8px", color: "var(--muted, #9ab4b7)" }}>
                            <strong style={{ display: "block", color: "var(--text, #e5eeee)" }}>{card.authority} · {card.event}</strong>
                            <span>Biocard da fase {card.phase === "final" ? "final" : card.phase === "qualification" ? "qualificação" : "da prova"}</span>
                            <small style={{ display: "block", marginTop: "6px" }}>A imagem não carregou; a consulta continua.</small>
                          </div>
                        </a>
                        <figcaption style={{ marginTop: "10px", color: "var(--muted, #9ab4b7)", fontSize: ".88rem" }}>{card.authority} · {card.event} · {card.caption}</figcaption>
                      </figure>
                    ))
                  : null;
                const wspsCardSourceRefs = isWspsEquipmentCard ? (competitionCard?.source_refs || []) : [];
                const wspsCardRuleCitations = isWspsEquipmentCard ? allCitations.filter((citation) => {
                  if (citation.source_role !== "NORMATIVE_RULE_SOURCE") return false;
                  const sourceId = String(citation.source_id || "");
                  const sourceHash = String(citation.source_sha256 || "").toLowerCase();
                  const citationPage = Number(citation.page || citation.physical_page || 0);
                  return wspsCardSourceRefs.some((sourceRef) =>
                    sourceId === String(sourceRef.source_id || "")
                    && sourceHash === String(sourceRef.source_sha256 || "").toLowerCase()
                    && (!sourceRef.pages?.length || sourceRef.pages.map(Number).includes(citationPage))
                  );
                }) : [];
                return (
                  <article className="exchange" key={message.id}>
                    <div className="question-row"><div className="person-icon" aria-hidden="true">EU</div><div className="question-text">{message.question}</div></div>
                    <div className={`answer-card ${result.answer_status === "INSUFFICIENT_EVIDENCE" ? "abstention" : ""}`}>
                      <div className="answer-heading"><div className="assistant-mark" aria-hidden="true">A</div><div><strong>{answerTitle(result.answer_status, result)}</strong><span>{formatDate(message.created_at)}</span></div></div>
                      {isPhaseCard && competitionCardFigures}
                      <p className="answer-text">{result.answer_status === "MODEL_GENERATING" ? "" : (result.answer || "Não foi possível recuperar a resposta desta conversa.")}</p>
                      {result.research_pages?.length > 0 && <section className="research-page-fallback" aria-label="Páginas de pesquisa para consulta" style={{ margin: "14px 0", padding: "12px 14px", border: "1px solid rgba(91, 205, 221, .24)", borderRadius: "12px", background: "rgba(7, 18, 22, .45)" }}>
                        <strong>Qual dessas passagens responde melhor à sua pergunta?</strong>
                        <p>Escolha uma passagem. A pergunta original e a passagem serão persistidas na conversa e enviadas diretamente ao Qwen para compor a resposta.</p>
                        <ul style={{ margin: "8px 0 0", paddingLeft: "20px" }}>{result.research_pages.map((page, index) => (
                          <li key={`${page.source_id || page.title}-${page.locator}-${index}`} style={{ margin: "6px 0" }}>
                            <div>{page.url
                              ? <a href={page.url} target="_blank" rel="noreferrer">{page.title || "Fonte recuperada"}</a>
                              : <strong>{page.title || "Fonte recuperada"}</strong>}
                              {page.edition ? ` · ${page.edition}` : ""}{page.locator ? ` · ${page.locator}` : ""}</div>
                            {page.normative_references?.length > 0 && <div><strong>Referência normativa:</strong> {page.normative_references.join(", ")}</div>}
                            {page.rule_text && <blockquote className="research-rule-text" lang="pt-BR">{page.rule_text}</blockquote>}
                            <button type="button" disabled={busy || !page.passage_id || !page.rule_text}
                              onClick={() => submitQuestion(null, page.passage_id, message.question)}>
                              Usar esta regra com o Qwen
                            </button>
                          </li>
                        ))}</ul>
                      </section>}
                      {result.automatic_validation_status === "INCOMPLETE_OR_UNSUPPORTED" && <div className="abstention-note" role="status">A resposta não passou pela validação de suporte da regra. Confira as evidências abaixo; não a trate como resposta normativa concluída.</div>}
                      {result.answer_status === "EVIDENCE_PARTIAL" && result.incomplete_slots?.length > 0 && <div className="incomplete-slots" role="note">
                        <strong>Relações ainda sem evidência suficiente:</strong>
                        <ul>{result.incomplete_slots.map((slot, index) => <li key={`${slot.id || slot.slot_id || "slot"}-${index}`}>{slot.focus || slot.subject || slot.id || slot.slot_id}{slot.action ? ` — ${slot.action}` : ""}{slot.context ? `: ${slot.context}` : ""}</li>)}</ul>
                      </div>}
                      {result.answer && result.answer_status !== "MODEL_GENERATING" && <button className="speak-answer-button" type="button" disabled={!voiceOutputSupported} onClick={() => {
                        if (speakingMessageId === message.id || speakingMessageId === "active") {
                          window.speechSynthesis?.cancel?.();
                          setSpeakingMessageId(null);
                        } else speakAnswer(result.answer, message.id);
                      }} aria-label={speakingMessageId === message.id || speakingMessageId === "active" ? "Parar leitura da resposta" : "Ouvir resposta"}>{speakingMessageId === message.id || speakingMessageId === "active" ? "■ Parar áudio" : "▶ Ouvir resposta"}</button>}
                      {result.progress_message && result.answer_status === "MODEL_GENERATING" && <div className="progress-note" role="status">{result.progress_message}</div>}
                      {result.clarification_prompt && <div className="clarification-note" role="status"><strong>Para completar esta relação:</strong> {result.clarification_prompt}</div>}
                      {result.answer_status === "ANSWERED_PARTIAL" && <div className="abstention-note">A evidência enviada sustenta parte da resposta. Itens sem suporte nesta consulta: {(result.incomplete_slots || []).map((slot) => typeof slot === "string" ? slot : slot.focus || slot.id).join(", ") || "não identificados"}.</div>}
                      {!isPhaseCard && competitionCardFigures}
                      {(result.decision_frame?.routing_contract?.equipment_dimension_route?.illustrations || []).map((figure) => (
                        <figure className="dimension-figure-card" key={figure.id} style={{ margin: "18px 0", padding: "14px", border: "1px solid rgba(91, 205, 221, .24)", borderRadius: "14px", background: "rgba(7, 18, 22, .55)" }}>
                          <a href={figure.image_url} target="_blank" rel="noreferrer" aria-label={`Ampliar figura ${figure.rule_reference}`}>
                            <img src={figure.image_url} alt={figure.alt || `Figura normativa ${figure.rule_reference}`} loading="lazy" style={{ display: "block", maxWidth: "100%", maxHeight: "620px", objectFit: "contain", margin: "0 auto", borderRadius: "8px" }} />
                          </a>
                          <figcaption style={{ marginTop: "10px", color: "var(--muted, #9ab4b7)", fontSize: ".88rem" }}>{figure.authority} · Regra {figure.rule_reference} · PDF p. {figure.printed_page} · {figure.language || "manual oficial"}. Consulte também o trecho citado abaixo.</figcaption>
                        </figure>
                      ))}
                      {citations.length > 0 && <div className="evidence-list">
                        {citations.map((citation, index) => (
                          <details className="evidence-card" key={`${citation.source_id}-${citation.locator}-${index}`} open={index === 0 || Boolean(result.decision_frame?.explicit_context?.all_authorities)}>
                            <summary>
                              <span className="evidence-icon" aria-hidden="true">▤</span>
                              <span className="evidence-title-wrap"><strong>{citation.source || "Fonte catalogada"}</strong><small>{citation.author ? `${citation.author} · ` : ""}{citation.locator || (citation.page ? `PDF p. ${citation.page}` : "Localizador não disponível")}</small></span>
                              <span className="evidence-chevron" aria-hidden="true">⌄</span>
                            </summary>
                            {citation.evidence_translation ? <div className="bilingual-evidence-panels">
                              <section className="evidence-language-panel evidence-language-panel-pt" aria-label="Regra em português" lang="pt-BR">
                                <h4>Texto em português · OCR aprovado</h4>
                                <blockquote>{citation.portuguese_excerpt || citation.excerpt || "Trecho em português não disponível nesta citação."}{citation.portuguese_excerpt ? (citation.portuguese_excerpt_truncated ? "…" : "") : (citation.excerpt_truncated ? "…" : "")}</blockquote>
                                <small>{citation.translation_edition ? `Edição do OCR: ${citation.translation_edition} · ` : ""}{citation.translation_currentity_basis ? "validado como atual por autoridade humana em 26/10/2026 · " : ""}{citation.translation_locator || "Localizador do OCR não disponível"} · OCR hash-verificado e vinculado à regra original</small>
                              </section>
                              <section className="evidence-language-panel evidence-language-panel-original" aria-label="Regra no idioma original" lang={citation.original_excerpt_language === "en" ? "en" : undefined}>
                                <h4>{citation.original_excerpt_language === "en" ? "Texto original · inglês" : "Texto original · idioma da fonte"}</h4>
                                {citation.original_excerpt
                                  ? <blockquote>{citation.original_excerpt}{citation.original_excerpt_truncated ? "…" : ""}</blockquote>
                                  : <p className="evidence-language-missing">O original não está vinculado a esta passagem recuperada.</p>}
                                <small>{citation.locator || (citation.page ? `PDF p. ${citation.page}` : "Localizador da fonte não disponível")}</small>
                              </section>
                            </div> : citation.excerpt ? <section className="evidence-language-panel evidence-language-panel-original" aria-label="Trecho da fonte" lang={citation.source_language || undefined}>
                              <h4>{citation.source_kind === "OFFICIAL_WEB_SOURCE" ? "Trecho da página oficial" : "Trecho da fonte"}</h4>
                              <blockquote>{citation.excerpt}{citation.excerpt_truncated ? "…" : ""}</blockquote>
                            </section> : null}
                            {citation.evidence_translation && <span className="translation-preference-label">OCR português aprovado pelo usuário · {citation.translation_locator || "localizador da tradução disponível"} · SHA-256 conferido</span>}
                            {citation.edition && <span className="edition-label">Edição/registro: {citation.edition}</span>}
                            {citation.last_used_date && <span className="edition-label">Consulta realizada em: {citation.last_used_date}</span>}
                            {citation.rule_transcription?.requested_items?.length > 0 && <details className="rule-transcription">
                              <summary>Ver transcrição da regra · {citation.rule_transcription.requested_items.join(", ")}</summary>
                              <div className="rule-disclosure-content">
                                {citation.rule_transcription.transcription_status !== "NOT_FOUND_IN_VERIFIED_SOURCE"
                                  ? <>
                                    <strong>{citation.rule_transcription.source} · {citation.rule_transcription.edition}</strong>
                                    {(citation.rule_transcription.rules || []).map((rule, ruleIndex) => <div className="rule-disclosure-item" key={`${rule.item}-${ruleIndex}`}>
                                      <b>Item/regra {rule.item}{rule.subject ? ` — ${rule.subject}` : ""}</b>
                                      <blockquote>{rule.paragraph}</blockquote>
                                      {rule.locator && <small>Transcrição recuperada em: {rule.locator}</small>}
                                    </div>)}
                                    {citation.rule_transcription.unresolved_items?.length > 0 && <p>Não localizei a transcrição verificada dos itens: {citation.rule_transcription.unresolved_items.join(", ")}.</p>}
                                  </>
                                  : <p>O número da regra foi identificado, mas a transcrição integral não foi localizada no texto verificado desta fonte.</p>}
                              </div>
                            </details>}
                          </details>
                        ))}
                      </div>}
                      {(ruleDisclosures.length > 0 || isWspsEquipmentCard || isPhaseCard) && <details className="rule-disclosure">
                        <summary>Deseja ver a regra?</summary>
                        <div className="rule-disclosure-content">
                          {isWspsEquipmentCard && <p>Referências ISSF aparecem somente como regras técnicas incorporadas pela WSPS; em caso de conflito, prevalece a regra WSPS.</p>}
                          {isPhaseCard && <>
                            <p>Card visual da fase {competitionCard.phase === "final" ? "final" : "qualificação"}. Consulte a resposta e as regras citadas para a fundamentação normativa.</p>
                            {String(competitionCard.authority || "").toUpperCase() === "WSPS" && <p>A WSPS é a fonte principal; referências ISSF aparecem somente para lacunas técnicas incorporadas pela WSPS.</p>}
                            {competitionCard.rule_references?.length > 0 && <ul className="rule-reference-list">
                              {competitionCard.rule_references.map((reference, index) => <li key={`${reference}-${index}`}>{reference}</li>)}
                            </ul>}
                          </>}
                          {ruleDisclosures.map((disclosure, disclosureIndex) => (
                            <section className="rule-disclosure-source" key={`${disclosure.source}-${disclosureIndex}`}>
                              <strong>{disclosure.source}</strong>
                              <small>{disclosure.edition} · Vigência: {disclosure.effective_date} · Última consulta: {disclosure.last_used_date}</small>
                              {(disclosure.rules || []).map((rule, ruleIndex) => (
                                <div className="rule-disclosure-item" key={`${rule.item}-${ruleIndex}`}>
                                  <b>Item/regra {rule.item}{rule.subject ? ` — ${rule.subject}` : ""}</b>
                                  <blockquote>{rule.paragraph}</blockquote>
                                </div>
                              ))}
                              {(isWspsEquipmentCard || isPhaseCard) && (disclosure.citations || []).filter((citation) => citation.evidence_translation).map((citation, citationIndex) => (
                                <div className="bilingual-evidence-panels" key={`wsps-rule-translation-${citation.source_id}-${citationIndex}`}>
                                  <section className="evidence-language-panel evidence-language-panel-pt" aria-label="Regra WSPS em português" lang="pt-BR">
                                    <h4>Regra em português · OCR aprovado</h4>
                                    <blockquote>{citation.portuguese_excerpt || citation.excerpt || "Trecho em português vinculado à regra não disponível."}{citation.portuguese_excerpt_truncated ? "…" : ""}</blockquote>
                                    <small>{citation.translation_locator || "Localizador do OCR não disponível"} · SHA-256 verificado e vinculado à fonte</small>
                                  </section>
                                  <section className="evidence-language-panel evidence-language-panel-original" aria-label="Regra WSPS no idioma original" lang={citation.original_excerpt_language === "en" ? "en" : undefined}>
                                    <h4>Texto original · inglês</h4>
                                    {citation.original_excerpt
                                      ? <blockquote>{citation.original_excerpt}{citation.original_excerpt_truncated ? "…" : ""}</blockquote>
                                      : <p className="evidence-language-missing">O trecho original não está vinculado a esta citação.</p>}
                                    <small>{citation.locator || "Localizador da regra original não disponível"}</small>
                                  </section>
                                </div>
                              ))}
                              {(disclosure.citations || []).map((citation, citationIndex) => (
                                <div className="rule-disclosure-citation" key={`${citation.source_id}-${citation.locator}-${citationIndex}`}>
                                  {citation.source || "Fonte normativa"} · {citation.locator || (citation.page ? `PDF p. ${citation.page}` : "Localizador não disponível")}
                                  {citation.author ? ` · ${citation.author}` : ""}
                                  {citation.original_path ? <small>{citation.original_path}</small> : null}
                                </div>
                              ))}
                            </section>
                          ))}
                          {isWspsEquipmentCard && ruleDisclosures.length === 0 && wspsCardRuleCitations.map((citation, citationIndex) => {
                            const verifiedRules = citation.rule_transcription?.rules || [];
                            return <section className="rule-disclosure-source" key={`wsps-card-cited-rule-${citation.source_id}-${citationIndex}`}>
                              <strong>{citation.source || "Fonte normativa WSPS"}</strong>
                              <small>{citation.edition || "Edição catalogada"} · {citation.locator || (citation.page ? `PDF p. ${citation.page}` : "Localizador não disponível")}</small>
                              {verifiedRules.length > 0 ? verifiedRules.map((rule, ruleIndex) => (
                                <div className="rule-disclosure-item" key={`${rule.item}-${ruleIndex}`}>
                                  <b>Item/regra {rule.item}{rule.subject ? ` — ${rule.subject}` : ""}</b>
                                  <blockquote>{rule.paragraph}</blockquote>
                                  {rule.locator && <small>{rule.locator}</small>}
                                </div>
                              )) : <div className="rule-disclosure-item">
                                <b>Trecho normativo citado · número não transcrito</b>
                                <blockquote>{citation.portuguese_excerpt || citation.excerpt || "Trecho da regra não disponível nesta citação."}{citation.portuguese_excerpt_truncated || citation.excerpt_truncated ? "…" : ""}</blockquote>
                              </div>}
                              {citation.evidence_translation && <div className="bilingual-evidence-panels">
                                <section className="evidence-language-panel evidence-language-panel-pt" aria-label="Regra WSPS em português" lang="pt-BR">
                                  <h4>Regra em português · OCR aprovado</h4>
                                  <blockquote>{citation.portuguese_excerpt || citation.excerpt || "Trecho em português não disponível."}{citation.portuguese_excerpt_truncated ? "…" : ""}</blockquote>
                                  <small>{citation.translation_locator || "Localizador do OCR não disponível"} · SHA-256 verificado</small>
                                </section>
                                <section className="evidence-language-panel evidence-language-panel-original" aria-label="Regra WSPS no idioma original" lang={citation.original_excerpt_language === "en" ? "en" : undefined}>
                                  <h4>Texto original · inglês</h4>
                                  {citation.original_excerpt
                                    ? <blockquote>{citation.original_excerpt}{citation.original_excerpt_truncated ? "…" : ""}</blockquote>
                                    : <p className="evidence-language-missing">O texto original não está vinculado a esta citação.</p>}
                                  <small>{citation.locator || "Localizador da regra original não disponível"}</small>
                                </section>
                              </div>}
                              {citation.original_path && <small>{citation.original_path}</small>}
                            </section>;
                          })}
                          {isWspsEquipmentCard && ruleDisclosures.length === 0 && wspsCardRuleCitations.length === 0 && <section className="rule-disclosure-source">
                            <strong>Referências normativas citadas no card</strong>
                            <p>A resposta desta consulta ainda não trouxe trechos normativos citados para abrir. Os localizadores vinculados a este card são:</p>
                            {wspsCardSourceRefs.map((sourceRef, sourceIndex) => <div className="rule-disclosure-item" key={`wsps-card-reference-${sourceRef.source_id}-${sourceIndex}`}>
                              <b>{sourceRef.source_key === "issf" ? "ISSF incorporada pela WSPS" : (sourceRef.authority || "WSPS")} · {(sourceRef.rules || []).join(", ") || "regra indicada no card"}</b>
                              <small>{sourceRef.source} · PDF pp. {(sourceRef.pages || []).join(", ")}</small>
                            </div>)}
                            {!wspsCardSourceRefs.length && (competitionCard?.rule_references || []).map((reference) => <div className="rule-disclosure-item" key={`wsps-card-reference-${reference}`}><b>Regra {reference}</b></div>)}
                          </section>}
                        </div>
                      </details>}
                      {result.answer_status === "INSUFFICIENT_EVIDENCE" && <div className="abstention-note">A resposta explicativa não foi concluída nesta tentativa. Isso não afirma que a informação esteja ausente da Library.</div>}
                    </div>
                  </article>
                );
              })}
              <div ref={endRef} />
            </div>
          )}
          {busy && <div className="loading-row"><span className="loader" /><span>ADANA está trabalhando. As etapas e lacunas identificadas aparecem junto à consulta.</span></div>}
          {error && <div className="error-banner" role="alert"><span>{error}</span><button type="button" onClick={() => setError("")} aria-label="Fechar aviso">×</button></div>}
        </section>

        <footer className="composer-wrap">
          {!connected && <div className="service-hint">Verifique se Meilisearch e llamafile estão iniciados. A interface continua disponível, mas novas consultas precisam da API e da biblioteca.</div>}
          <form className="composer" onSubmit={submitQuestion}>
            <label htmlFor="question-input" className="sr-only">Sua pergunta</label>
            <label className="internet-toggle"><input type="checkbox" checked={internetAccess} onChange={(event) => setInternetAccess(event.target.checked)} disabled={busy} /> <span>Pesquisar também nas fontes oficiais da internet</span></label>
            <label className="voice-reply-toggle"><input type="checkbox" checked={voiceRepliesEnabled} onChange={(event) => setVoiceRepliesEnabled(event.target.checked)} disabled={busy || !voiceOutputSupported} /> <span>Responder também por voz</span></label>
            <div className="composer-input-row">
              <textarea id="question-input" ref={inputRef} value={question} onChange={(event) => setQuestion(event.target.value)} onKeyDown={(event) => {
                const composing = event.isComposing || event.nativeEvent?.isComposing || event.nativeEvent?.keyCode === 229;
                if (event.key === "Enter" && !event.shiftKey && !composing) {
                  event.preventDefault();
                  event.currentTarget.form?.requestSubmit();
                }
              }} maxLength={4000} placeholder="Digite sua pergunta ou use o microfone…" rows={1} disabled={busy} />
              <button className={`voice-input-button ${voiceListening ? "listening" : ""}`} type="button" onClick={toggleVoiceInput} disabled={!voiceSupported || busy} aria-label={voiceListening ? "Parar reconhecimento de voz" : "Ditar pergunta"} title={voiceSupported ? (voiceListening ? "Parar de ouvir" : "Ditar pergunta") : "Reconhecimento de voz indisponível neste navegador"}><MicrophoneIcon /></button>
            </div>
            <div className="composer-bottom"><span>{voiceError ? <span className="voice-error" role="status">{voiceError}</span> : voiceListening ? <span className="voice-live" role="status">Ouvindo… a pergunta não será enviada até você tocar em enviar.</span> : <>Revise a transcrição antes de enviar · {question.length}/4000</>}</span><button type="submit" disabled={!question.trim() || busy} aria-label="Enviar pergunta">{busy ? <span className="button-spinner" /> : <span aria-hidden="true">↑</span>}</button></div>
          </form>
          <p className="disclaimer">A fala é transcrita no navegador e as respostas podem ser lidas em voz alta. Revise a transcrição antes de enviar. A busca online prioriza portais oficiais identificados no contexto.</p>
        </footer>
        <nav className="bottom-nav" aria-label="Navegação principal">
          <button className={!messages.length ? "active" : ""} onClick={goHome} type="button"><HomeIcon /><span>Início</span></button>
          <button onClick={() => setMobileSidebarOpen(true)} type="button"><HistoryIcon /><span>Histórico</span></button>
          <button type="button" disabled title="Perfil não disponível nesta versão"><ProfileIcon /><span>Perfil</span></button>
        </nav>
      </main>
    </div>
  );
}

function MicrophoneIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 14a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v5a3 3 0 0 0 3 3Z" /><path d="M19 11a7 7 0 0 1-14 0M12 18v4m-4 0h8" /></svg>;
}

function HistoryIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M3 12a9 9 0 1 0 2.6-6.4L3 8" /><path d="M3 3v5h5M12 7v5l3.5 2" /></svg>;
}

function BookIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M3 5.5c3.2-1.5 6.2-1.2 9 1v14c-2.8-2.2-5.8-2.5-9-1zM21 5.5c-3.2-1.5-6.2-1.2-9 1v14c2.8-2.2 5.8-2.5 9-1z" /></svg>;
}

function TrainingIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><rect x="4" y="5" width="16" height="16" rx="2" /><path d="M9 5V3h6v2M8 12l2 2 5-5M8 17h8" /></svg>;
}

function AnalysisIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4 20V13h4v7M10 20V8h4v12M16 20V4h4v16" /><path d="m5 8 4-3 4 2 6-5" /></svg>;
}

function MessageIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M20 11.5a7.5 7.5 0 0 1-7.5 7.5H6l-3 2v-5.2A7.5 7.5 0 1 1 20 11.5Z" /><path d="M7 10h8M7 14h5" /></svg>;
}

function ChevronIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="m9 5 7 7-7 7" /></svg>;
}

function HomeIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7h-6v7H4a1 1 0 0 1-1-1z" /></svg>;
}

function ProfileIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="12" cy="7" r="4" /><path d="M4 21a8 8 0 0 1 16 0z" /></svg>;
}

function Waveform({ className = "" }) {
  const heights = [10, 14, 20, 29, 42, 67, 40, 56, 84, 112, 78, 58, 42, 28, 19, 12, 7];
  const gradientId = `wave-${className.replace(/\s+/g, "-")}`;
  return <svg className={className} viewBox="0 0 340 120" aria-hidden="true" focusable="false" preserveAspectRatio="none">
    <defs><linearGradient id={gradientId} x1="0" x2="1"><stop offset="0" stopColor="#b8f34e" stopOpacity=".18" /><stop offset=".55" stopColor="#b8f34e" /><stop offset="1" stopColor="#39dff2" /></linearGradient></defs>
    <g stroke={`url(#${gradientId})`} strokeWidth="4" strokeLinecap="round">{heights.map((height, index) => <line key={index} x1={12 + index * 19} y1={(120 - height) / 2} x2={12 + index * 19} y2={(120 + height) / 2} />)}</g>
  </svg>;
}
