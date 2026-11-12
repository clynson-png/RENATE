import { useEffect, useRef, useState } from 'react';
import { clearLocalHistory, deleteLocalConversation, getLocalConversation, hasLeadRegistration, hasLocalPin, listLocalConversations, requestPersistentLocalStorage, saveLocalConversation, setLeadRegistrationComplete, setLocalPin, verifyLocalPin } from './localHistory.js';
import { createAtlasSearchClient } from './atlasSearchClient.js';
import { transcribeLocalAudio } from './localSpeech.js';
import { clarificationDecision } from './clarificationPolicy.js';
import { getTurnstileSiteKey, isLeadRegistrationConfigured, submitLead } from './leadRegistration.js';
import TargetReaderView from './target-reader/TargetReaderView.jsx';
import { canSkipLocalAuth } from './localDevelopmentAuth.js';

const installStateText = { INSTALLING: 'Baixando pacote para uso offline', VERIFYING: 'Verificando o pacote local', READY_OFFLINE: 'Pronto para uso offline', PACK_INCOMPLETE: 'Conteúdo local ainda não conectado', PACK_INCOMPATIBLE: 'Pacote incompatível', OFFLINE_NOT_PREPARED: 'Preparação offline pendente' };

function PinGate({ setup, onUnlock }) {
  const [pin, setPin] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(event) {
    event.preventDefault(); setError('');
    if (!/^\d{6,12}$/.test(pin)) return setError('Use um PIN de 6 a 12 algarismos.');
    if (setup && pin !== confirmation) return setError('Os PINs não correspondem.');
    setBusy(true);
    try {
      if (setup) await setLocalPin(pin);
      else if (!(await verifyLocalPin(pin))) return setError('PIN incorreto.');
      onUnlock();
    } catch { setError('Não foi possível guardar ou validar o PIN neste dispositivo.'); }
    finally { setBusy(false); }
  }
  return <main className="pin-gate"><div className="pin-card"><div className="eyebrow"><span /> ACESSO LOCAL</div><h1>{setup ? 'Crie seu PIN' : 'Desbloqueie o RENATE'}</h1><p>{setup ? 'O PIN é guardado somente neste dispositivo. Ele não é enviado à internet e não pode ser recuperado se for esquecido.' : 'Digite seu PIN para abrir os dados locais do RENATE.'}</p><form onSubmit={submit}><label>PIN local<input autoComplete="off" inputMode="numeric" pattern="[0-9]*" type="password" minLength="6" maxLength="12" value={pin} onChange={(event) => setPin(event.target.value.replace(/\D/g, ''))} /></label>{setup && <label>Confirme o PIN<input autoComplete="off" inputMode="numeric" pattern="[0-9]*" type="password" minLength="6" maxLength="12" value={confirmation} onChange={(event) => setConfirmation(event.target.value.replace(/\D/g, ''))} /></label>}{error && <p role="alert" className="pin-error">{error}</p>}<button className="send-button pin-submit" disabled={busy}>{busy ? 'Verificando…' : setup ? 'Criar PIN neste dispositivo' : 'Desbloquear'}</button></form></div></main>;
}

function LeadRegistrationGate({ onComplete }) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState('');
  const [turnstileStatus, setTurnstileStatus] = useState('');
  const turnstileContainer = useRef(null);
  const turnstileWidget = useRef(null);
  const turnstileSiteKey = getTurnstileSiteKey();
  useEffect(() => {
    if (!turnstileSiteKey || !turnstileContainer.current) return undefined;
    let cancelled = false;
    loadTurnstileApi().then((api) => {
      if (cancelled || !turnstileContainer.current) return;
      turnstileWidget.current = api.render(turnstileContainer.current, {
        sitekey: turnstileSiteKey,
        action: 'renate_lead',
        callback: (token) => { setTurnstileToken(token); setTurnstileStatus('Verificação concluída.'); },
        'expired-callback': () => { setTurnstileToken(''); setTurnstileStatus('A verificação expirou. Faça-a novamente.'); },
        'error-callback': () => { setTurnstileToken(''); setTurnstileStatus('Não foi possível validar a verificação. Tente novamente.'); },
      });
    }).catch(() => setTurnstileStatus('A verificação antispam não carregou. Confira sua conexão.'));
    return () => {
      cancelled = true;
      if (turnstileWidget.current && window.turnstile) window.turnstile.remove(turnstileWidget.current);
      turnstileWidget.current = null;
    };
  }, [turnstileSiteKey]);
  async function submit(event) {
    event.preventDefault(); setError(''); setBusy(true);
    try {
      const result = await submitLead({ fullName, email, phone }, turnstileToken);
      if (!result.ok) return setError(result.message);
      await setLeadRegistrationComplete();
      onComplete(result.alreadyRegistered ? result.message : 'Cadastro concluído.');
    } catch { setError('O cadastro foi enviado, mas não foi possível registrar a conclusão neste dispositivo. Tente novamente; o sistema não armazena esses dados localmente.'); }
    finally {
      setBusy(false);
      if (turnstileWidget.current && window.turnstile) window.turnstile.reset(turnstileWidget.current);
      setTurnstileToken('');
    }
  }
  return <main className="pin-gate"><section className="pin-card lead-card"><div className="eyebrow"><span /> PRIMEIRO ACESSO</div><h1>Ative o RENATE</h1><p>Para iniciar, informe seu nome, e-mail e telefone. Esses dados serão usados para registrar o primeiro acesso e permitir contato de suporte. Perguntas, respostas, histórico e PIN permanecem neste dispositivo.</p>{!isLeadRegistrationConfigured() && <p className="pin-error" role="alert">O cadastro inicial ainda não está configurado para conexão segura. Tente novamente mais tarde.</p>}<details className="lead-privacy-notice"><summary>Aviso de privacidade</summary><p>Nome, e-mail e telefone são usados para registrar o primeiro acesso e permitir contato de suporte. O aplicativo não envia perguntas, respostas, PIN ou histórico.</p><p>A lista de contatos fica acessível somente ao administrador autenticado no painel Supabase. Os dados serão mantidos até pedido de exclusão; o canal de privacidade para esse pedido será informado na página oficial antes da publicação.</p><p>O formulário usa a verificação antispam Cloudflare Turnstile. O token é validado no envio e não é salvo na lista de leads.</p></details><form onSubmit={submit}><label>Nome completo<input autoComplete="name" maxLength="160" value={fullName} onChange={(event) => setFullName(event.target.value)} required /></label><label>E-mail<input autoComplete="email" type="email" maxLength="254" value={email} onChange={(event) => setEmail(event.target.value)} required /></label><label>Telefone com DDD<input autoComplete="tel" type="tel" maxLength="32" value={phone} onChange={(event) => setPhone(event.target.value)} required /></label><div className="lead-turnstile" ref={turnstileContainer} aria-label="Verificação antispam" />{turnstileStatus && <p className="lead-captcha-status" role="status">{turnstileStatus}</p>}{error && <p role="alert" className="pin-error">{error}</p>}<button className="send-button pin-submit" disabled={busy || !isLeadRegistrationConfigured() || !turnstileToken}>{busy ? 'Enviando cadastro…' : 'Continuar para instalar'}</button></form></section></main>;
}

let turnstileScriptPromise;
function loadTurnstileApi() {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  if (!turnstileScriptPromise) turnstileScriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.async = true;
    script.defer = true;
    script.dataset.renateTurnstile = 'true';
    script.onload = () => window.turnstile ? resolve(window.turnstile) : reject(new Error('Turnstile did not initialize.'));
    script.onerror = (error) => { turnstileScriptPromise = null; reject(error); };
    document.head.append(script);
  });
  return turnstileScriptPromise;
}

function InstallGate({ prompt, onInstall, onContinue, status }) {
  const installed = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  return <main className="pin-gate"><section className="pin-card lead-card install-card"><div className="eyebrow"><span /> INSTALAÇÃO</div><h1>Instale o RENATE</h1><p>O RENATE foi preparado para funcionar como aplicativo e consultar regras offline depois que os dados locais forem preparados. No Android, instale pelo menu do Chrome ou pelo botão abaixo.</p>{status && <p role="status" className="lead-status">{status}</p>}{prompt && <button className="send-button pin-submit" type="button" onClick={onInstall}>Instalar RENATE</button>}{!prompt && !installed && <div className="install-help"><strong>No Chrome para Android</strong><ol><li>Abra o menu ⋮.</li><li>Toque em “Instalar app” ou “Adicionar à tela inicial”.</li><li>Volte ao RENATE instalado para continuar.</li></ol></div>}<button className="outline-button install-continue" type="button" onClick={onContinue}>{installed ? 'Continuar para criar PIN' : 'Já instalei / continuar'}</button></section></main>;
}

function RulePassages({ passages, figureCrops = [] }) {
  if (!passages?.length) return <p className="no-rule">A biblioteca local não contém passagem correspondente para exibir.</p>;
  return <>{figureCrops.length > 0 && <RuleFigureCrops figureCrops={figureCrops}/>}<div className="rule-passages">{passages.map((passage, index) => <section className="rule-passage" key={`${passage.sourceId}-${passage.locator}-${index}`}><header><strong>{passage.title}</strong><span>{passage.edition}</span><b>{[passage.locator, ...(passage.locatorAliases ?? []).filter((alias) => alias !== passage.locator)].join(' · ')}</b></header>{passage.scope && <small className="answer-provenance">{passage.scope === 'GENERAL_TIE_BREAK' ? 'CRITÉRIO GERAL DE DESEMPATE' : 'REGRA DA PROVA OU FASE'}</small>}<p>{passage.text}</p>{passage.relevance === 'RELATED_NEAREST_AVAILABLE' && <small>Passagem local mais próxima; a relação pode ser indireta.</small>}<a href={packAsset(passage.pdfPath)} target="_blank" rel="noreferrer">Abrir regulamento completo (PDF local)</a></section>)}</div></>;
}

function RuleFigureCrops({ figureCrops }) {
  if (!figureCrops?.length) return null;
  return <div className="rule-figure-crops" aria-label="Figuras e tabelas recortadas das regras locais">{figureCrops.map((figure) => <figure key={figure.figure_id}><img src={packAsset(figure.assetPath)} alt={`${figure.title}, página ${figure.printed_page}: ${figure.description}`} loading="lazy"/><figcaption>{figure.title} · {figure.edition} · p. {figure.printed_page} · {figure.locator} · recorte local da página</figcaption></figure>)}</div>;
}

function packAsset(path) { return String(path ?? '').replace(/^\.\//, '/renate-pack/'); }

function cardSpeechText(card) {
  const parts = [card.authority, card.event, card.category === 'equipment' ? 'Equipamento' : card.category === 'malfunction' ? 'Falhas' : card.phase === 'final' ? 'Final' : 'Qualificação', card.title];
  for (const value of [card.photoNote, card.clarificationText, card.sourceReviewDisclosure]) if (value) parts.push(value);
  for (const row of card.displayRows ?? []) parts.push(`${row.label}: ${row.value}. ${row.authority ?? ''} ${row.locator ?? ''}`);
  for (const section of card.displaySections ?? []) parts.push(`${section.heading}. ${(section.items ?? []).join('. ')}`);
  for (const reference of card.sourceReferences ?? []) parts.push(`Fonte: ${reference.title ?? ''}. ${reference.edition ?? ''}. ${(reference.locators ?? []).join(', ')}.`);
  return parts.filter(Boolean).join('. ').replace(/\s+/g, ' ').trim();
}

function readLocalText(text, voice, { onEnd } = {}) {
  if (!window.speechSynthesis || !window.SpeechSynthesisUtterance || !voice || !text?.trim()) return false;
  const utterance = new SpeechSynthesisUtterance(text.trim());
  utterance.lang = 'pt-BR';
  utterance.voice = voice;
  utterance.rate = 0.96;
  utterance.onend = onEnd;
  window.speechSynthesis.speak(utterance);
  return true;
}

function findLocalPortugueseVoice() {
  if (!window.speechSynthesis) return null;
  return window.speechSynthesis.getVoices().find((voice) => voice.localService && /^pt-BR$/i.test(voice.lang));
}

function waitForLocalPortugueseVoice(timeoutMs = 2000) {
  const available = findLocalPortugueseVoice();
  if (available) return Promise.resolve(available);
  if (!window.speechSynthesis) return Promise.resolve(null);
  return new Promise((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      window.speechSynthesis.removeEventListener?.('voiceschanged', check);
      clearTimeout(timer);
      resolve(findLocalPortugueseVoice());
    };
    const check = () => { if (findLocalPortugueseVoice()) finish(); };
    const timer = setTimeout(finish, timeoutMs);
    window.speechSynthesis.addEventListener?.('voiceschanged', check);
    window.speechSynthesis.getVoices();
  });
}

function LocalRuleDocuments({ message }) {
  const references = message.sourceReferences ?? [];
  const fromReferences = references.map((reference) => ({
    key: reference.document_source_id ?? reference.source_id ?? reference.pdf_path,
    title: reference.title,
    edition: reference.edition,
    pdfPath: reference.pdf_path ?? reference.pdfPath,
  }));
  const fromPassages = (message.rulePassages ?? []).map((passage) => ({
    key: passage.documentSourceId ?? passage.pdfPath,
    title: passage.title,
    edition: passage.edition,
    pdfPath: passage.pdfPath,
  }));
  const documents = [...new Map([...fromReferences, ...fromPassages].filter((item) => item.pdfPath).map((item) => [item.key ?? item.pdfPath, item])).values()];
  if (!documents.length) return null;
  return <nav className="local-rule-documents" aria-label="Regulamentos completos disponíveis neste dispositivo"><strong>Regulamento completo neste dispositivo</strong>{documents.map((document) => <a key={document.key ?? document.pdfPath} href={packAsset(document.pdfPath)} target="_blank" rel="noreferrer">{document.title ?? 'Abrir regulamento'}{document.edition ? ` · ${document.edition}` : ''}</a>)}</nav>;
}

function LocalLibraryView() {
  const [documents, setDocuments] = useState([]);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('Carregando catálogo local…');
  useEffect(() => {
    let active = true;
    fetch('/renate-pack/library-index.json').then((response) => {
      if (!response.ok) throw new Error('Catálogo local indisponível');
      return response.json();
    }).then((index) => {
      if (!active) return;
      setDocuments(index.documents ?? []);
      setStatus(`${index.documents?.length ?? 0} regulamentos disponíveis neste dispositivo.`);
    }).catch(() => { if (active) setStatus('Não foi possível abrir o catálogo local neste dispositivo.'); });
    return () => { active = false; };
  }, []);
  const filtered = documents.filter((document) => `${document.title} ${document.edition} ${document.referencedBy?.join(' ')}`.toLocaleLowerCase('pt-BR').includes(query.trim().toLocaleLowerCase('pt-BR')));
  return <section className="local-library-view" aria-labelledby="library-heading">
    <div className="eyebrow"><span /> BIBLIOTECA LOCAL RENATE</div>
    <h1 id="library-heading">Regulamentos completos</h1>
    <p>Abra qualquer documento incluído neste pacote, mesmo sem iniciar uma conversa. Os PDFs são lidos do armazenamento local do RENATE.</p>
    <label className="library-search">Filtrar por prova, modalidade ou regulamento<input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Ex.: pistola, carabina, WSPS…" /></label>
    <p className="library-status" role="status">{status}</p>
    <div className="library-document-list">{filtered.map((document) => <article className="library-document" key={document.documentSourceId}>
      <div><h2>{document.title}</h2><p>{document.edition}</p><small>{document.referencedBy?.length ? `Usado em ${document.referencedBy.length} rotas` : 'Documento de apoio local'} · PDF verificado por hash</small></div>
      <a href={packAsset(document.pdf?.path)} target="_blank" rel="noreferrer">Abrir PDF completo</a>
    </article>)}{!filtered.length && documents.length > 0 && <p>Nenhum regulamento corresponde ao filtro.</p>}</div>
  </section>;
}

function Cards({ cards }) {
  return cards?.length ? <div className="local-cards">{cards.map((card) => <article className="local-card" data-card-id={card.cardId} key={card.cardId}>
    {card.photoGallery?.length ? <div className="card-photo-gallery">{card.photoGallery.map((photo, index) => <figure key={`${card.cardId}-photo-${index}`}><img className="card-photo" src={packAsset(photo.path)} alt={photo.alt} loading="lazy"/><figcaption>{photo.label}</figcaption></figure>)}</div> : (card.photoPath || card.imagePath) ? <div className="local-card-visual">
      {card.photoPath && <img className="card-photo card-event-photo" src={packAsset(card.photoPath)} alt={card.photoAlt ?? `Imagem complementar: ${card.event}`} loading="lazy"/>}
      {card.imagePath && <img className={`card-photo ${['normative_card', 'local_equipment_card'].includes(card.imageKind) ? 'card-normative-evidence' : ''}`} src={packAsset(card.imagePath)} alt={card.imageAlt ?? `Card: ${card.event}, ${card.phase === 'final' ? 'final' : 'qualificação'}`} loading="lazy"/>}
      {!card.imagePath && !card.photoPath && <div className="card-hero" aria-hidden="true"><span>{card.authority}</span><strong>{card.eventId?.split('.').at(-1)?.toUpperCase()}</strong></div>}
      {card.imageKind === 'photorealistic_illustration' && <small className="card-image-caption">Ilustração fotorrealista · não é fotografia oficial</small>}
    </div> : <div className="card-hero" aria-hidden="true"><span>{card.authority}</span><strong>{card.eventId?.split('.').at(-1)?.toUpperCase()}</strong></div>}
    <div className="local-card-body">
      <small className="card-kicker">{card.authority} · {card.event} · {card.category === 'equipment' ? 'EQUIPAMENTO' : card.category === 'malfunction' ? 'FALHAS' : card.category === 'event_program' ? 'PROGRAMA DE EVENTOS' : card.phase === 'final' ? 'FINAL' : 'QUALIFICAÇÃO'}</small>
      <h3>{card.title ?? card.event}</h3>
      {card.photoNote && <p className="card-photo-note">{card.photoNote}</p>}
      {card.clarificationText && <p className="card-clarification">{card.clarificationText}</p>}
      {card.sourceReviewDisclosure && <p className="card-photo-note">{card.sourceReviewDisclosure}</p>}
      {card.displayRows?.length ? <dl className="card-fact-rows">{card.displayRows.map((row, index) => <div className="card-fact-row" data-card-row={row.slotId} key={`${card.cardId}-${row.slotId}`}><dt>{row.label}</dt><dd>{row.value}<small>{row.authority}{row.locator ? ` · ${row.locator}` : ''}</small></dd></div>)}</dl>
        : card.displaySections?.length ? <div className="card-sections">{card.displaySections.map((section, sectionIndex) => <section className={`card-section ${section.heading.startsWith('Eliminações') ? 'elimination-section' : ''}`} key={`${card.cardId}-section-${sectionIndex}`}><h4>{section.heading}</h4><ul>{section.items.map((item, itemIndex) => <li key={`${card.cardId}-section-${sectionIndex}-item-${itemIndex}`}>{item}</li>)}</ul></section>)}</div>
          : <div className="card-sections"><section className="card-section"><h4>Informações</h4><ul><li>Consulte as passagens locais vinculadas a esta rota.</li></ul></section></div>}
      {card.figureCrops?.length > 0 && <RuleFigureCrops figureCrops={card.figureCrops}/>}
      {card.evidenceType && card.sourceReferences?.length > 0 && <section className="card-section card-evidence"><h4>Fontes normativas</h4><ul>{card.sourceReferences.map((reference) => <li key={`${reference.document_source_id}-${(reference.locators ?? []).join('|')}`}><a href={packAsset(reference.pdf_path)} target="_blank" rel="noreferrer">{reference.title}{reference.edition ? ` · ${reference.edition}` : ''}</a>{reference.locators?.length ? <small> · {reference.locators.join(', ')}</small> : null}</li>)}</ul></section>}
      {card.photoCredit && <small className="card-photo-credit">Foto: {card.photoCredit} · <a href={card.photoSourcePage} target="_blank" rel="noreferrer">fonte</a></small>}
      <small className="card-disclosure">{card.evidenceType ? 'Evidência normativa RENATE; respostas, fontes e localizadores vinculados acima.' : 'Card complementar; consulte as passagens da regra abaixo.'}</small>
    </div>
  </article>)}</div> : null;
}

function MessageDetails({ message, sendQuestion }) {
  const figureContext = [message.question, message.text, ...(message.rulePassages ?? []).map((passage) => passage.text), ...(message.ruleLocators ?? [])].join(' ').toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const sourceFigureCrops = message.figureCrops ?? (message.cards ?? []).flatMap((card) => card.figureCrops ?? []);
  const figureCrops = [...new Map(sourceFigureCrops
    .filter((figure) => !figure.show_when_keywords?.length || figure.show_when_keywords.some((keyword) => figureContext.includes(keyword.toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g, ''))))
    .map((figure) => [figure.figure_id, figure])).values()];
  const showFiguresWithCard = message.cards?.some((card) => card.cardId?.startsWith('issf.pistol.specifications.')) && figureCrops.length > 0;
  const inlinePassages = message.showRulesInitially
    ? (message.showAllRulesInitially ? (message.rulePassages ?? []) : (message.rulePassages ?? []).slice(0, 1))
    : [];
  const remainingPassages = message.showRulesInitially && !message.showAllRulesInitially
    ? (message.rulePassages ?? []).slice(1)
    : message.showRulesInitially ? [] : (message.rulePassages ?? []);
  const hasMorePassages = Boolean(remainingPassages.length || figureCrops.length || message.atlasId || message.origin);
  return <>
    {message.cards?.length > 0 && <Cards cards={message.cards}/>}
    {message.text && <section className="qa-answer"><h3>Resposta do Q&A</h3><p className="assistant-answer-text">{message.text}</p></section>}
    {message.questionOptions?.length > 0 && <div className="clarification-options"><h3>Perguntas do Q&A pertinentes</h3><p>{message.clarificationNumber ? `${message.clarificationNumber}/2 · ` : ''}{message.clarificationReason === 'SAME_QUESTION_DIFFERENT_EVIDENCE' ? 'A mesma pergunta tem respostas registradas em fontes diferentes. Escolha a fonte que quer consultar:' : 'Escolha a pergunta registrada que corresponde ao assunto:'}</p>{message.questionOptions.map((option) => <button key={`${option.atlasId}-${option.text}`} type="button" onClick={() => sendQuestion(option.text, option.atlasId)}><span>{option.text}</span>{option.sourceLabels?.length > 0 && <small>{option.sourceLabels.join(' · ')}</small>}{option.sourceLabels?.length === 0 && option.routeIds?.length > 0 && <small>{option.routeIds.join(' · ')}</small>}</button>)}</div>}
    <LocalRuleDocuments message={message}/>
    {inlinePassages.length > 0 && <RulePassages passages={inlinePassages} figureCrops={showFiguresWithCard ? [] : figureCrops}/>}
    {hasMorePassages && <details className="more-passages"><summary>Deseja ver mais passagens sobre o assunto?</summary><div className="more-passages-content">
      {showFiguresWithCard && <RuleFigureCrops figureCrops={figureCrops}/>}
      {remainingPassages.length > 0 && <RulePassages passages={remainingPassages} figureCrops={showFiguresWithCard ? [] : figureCrops}/>}
      {message.atlasId && <small className="answer-provenance">ATLAS · {message.atlasId}{message.routeIds?.length ? ` · ${message.routeIds[0]}` : ''}</small>}
      {message.origin && <small className="answer-provenance">Fonte local: {message.origin === 'PRETEST_PASS' ? 'preteste registrado como PASS' : message.origin === 'LOCAL_LIBRARY' ? 'biblioteca RENATE' : 'banco ATLAS'}</small>}
    </div></details>}
  </>;
}

export default function App() {
  const localDevelopmentNoLogin = canSkipLocalAuth({
    developmentBuild: import.meta.env.DEV,
    hostname: window.location.hostname,
  });
  const [pinState, setPinState] = useState(localDevelopmentNoLogin ? 'ready' : 'checking');
  const [unlocked, setUnlocked] = useState(localDevelopmentNoLogin);
  const [installPrompt, setInstallPrompt] = useState(null);
  const [installState, setInstallState] = useState('OFFLINE_NOT_PREPARED');
  const [offlinePrepDetail, setOfflinePrepDetail] = useState('');
  const [refreshAvailable, setRefreshAvailable] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [activeView, setActiveView] = useState('conversation');
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [historyStatus, setHistoryStatus] = useState('');
  const [draft, setDraft] = useState('');
  const [atlasReady, setAtlasReady] = useState(false);
  const [recording, setRecording] = useState(false);
  const [speechStatus, setSpeechStatus] = useState('');
  const [audioAccessibilityEnabled, setAudioAccessibilityEnabled] = useState(false);
  const [audioStatus, setAudioStatus] = useState('');
  const searchClientRef = useRef(null);
  const recorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const audioEnabledRef = useRef(false);
  const hoverTimerRef = useRef(null);
  const hoverTargetRef = useRef(null);
  const speechSourceRef = useRef(null);

  useEffect(() => {
    if (localDevelopmentNoLogin) return;
    Promise.all([hasLocalPin(), hasLeadRegistration()]).then(([hasPin, hasRegistration]) => setPinState(hasPin ? 'unlock' : hasRegistration ? 'install' : 'lead')).catch(() => setPinState('error'));
  }, [localDevelopmentNoLogin]);
  useEffect(() => {
    const promptHandler = (event) => { event.preventDefault(); setInstallPrompt(event); };
    const readyHandler = (event) => {
      setInstallState('READY_OFFLINE');
      const { completed, total } = event.detail ?? {};
      setOfflinePrepDetail(total ? `${completed ?? total}/${total} arquivos conferidos e disponíveis neste aparelho.` : 'Pacote local conferido e disponível neste aparelho.');
    };
    const progressHandler = (event) => {
      const { completed = 0, total = 0 } = event.detail ?? {};
      setInstallState('INSTALLING');
      setOfflinePrepDetail(total ? `Download offline: ${completed}/${total} arquivos.` : 'Iniciando o download do pacote offline…');
    };
    const failedHandler = (event) => {
      setInstallState('OFFLINE_NOT_PREPARED');
      setOfflinePrepDetail(event.detail?.message || 'O pacote offline não foi concluído. Verifique a conexão e o espaço disponível e recarregue para tentar novamente.');
    };
    const updateHandler = () => setRefreshAvailable(true);
    window.addEventListener('beforeinstallprompt', promptHandler); window.addEventListener('renate:pwa-offline-ready', readyHandler); window.addEventListener('renate:pwa-offline-progress', progressHandler); window.addEventListener('renate:pwa-offline-failed', failedHandler); window.addEventListener('renate:pwa-update-ready', updateHandler);
    if (window.matchMedia('(display-mode: standalone)').matches) setInstallState('PACK_INCOMPLETE');
    if (window.renateOfflineReady) readyHandler({ detail: window.renateOfflineReady });
    else if (window.renateOfflineProgress) progressHandler({ detail: window.renateOfflineProgress });
    else if (window.renateOfflineFailure) failedHandler({ detail: window.renateOfflineFailure });
    else if (import.meta.env.PROD && navigator.serviceWorker?.controller) navigator.serviceWorker.controller.postMessage({ type: 'CHECK_PRECACHE' });
    return () => { window.removeEventListener('beforeinstallprompt', promptHandler); window.removeEventListener('renate:pwa-offline-ready', readyHandler); window.removeEventListener('renate:pwa-offline-progress', progressHandler); window.removeEventListener('renate:pwa-offline-failed', failedHandler); window.removeEventListener('renate:pwa-update-ready', updateHandler); };
  }, []);
  useEffect(() => {
    const client = createAtlasSearchClient(); searchClientRef.current = client;
    client.initialize().then(() => { setAtlasReady(true); setInstallState((current) => current === 'READY_OFFLINE' ? current : 'VERIFYING'); }).catch(() => setHistoryStatus('Não foi possível preparar o pacote local.'));
    return () => client.close();
  }, []);
  useEffect(() => {
    if (!unlocked) return;
    let active = true;
    listLocalConversations().then((rows) => { if (active) setConversations(rows); }).catch(() => { if (active) setHistoryStatus('O histórico local não está disponível neste navegador.'); });
    requestPersistentLocalStorage().catch(() => false);
    return () => { active = false; };
  }, [unlocked]);

  useEffect(() => () => {
    clearTimeout(hoverTimerRef.current);
    window.speechSynthesis?.cancel();
  }, []);

  async function openLocalConversation(id) { try { setActiveConversation(await getLocalConversation(id)); setMobileNavOpen(false); setHistoryStatus(''); } catch { setHistoryStatus('Não foi possível abrir esta conversa salva no dispositivo.'); } }
  async function removeLocalConversation(id) { if (!window.confirm('Apagar esta conversa salva somente neste dispositivo?')) return; try { await deleteLocalConversation(id); setConversations(await listLocalConversations()); if (activeConversation?.id === id) setActiveConversation(null); setHistoryStatus('Conversa apagada do dispositivo.'); } catch { setHistoryStatus('Não foi possível apagar esta conversa local.'); } }
  async function removeAllLocalHistory() { if (!conversations.length || !window.confirm('Apagar todo o histórico salvo neste dispositivo? Esta ação não pode ser desfeita.')) return; try { await clearLocalHistory(); setConversations([]); setActiveConversation(null); setHistoryStatus('Todo o histórico local foi apagado deste dispositivo.'); } catch { setHistoryStatus('Não foi possível apagar todo o histórico local.'); } }

  async function sendQuestion(questionText, selectedAtlasId = null) {
    const question = questionText.trim(); if (!question || !atlasReady || !searchClientRef.current) return;
    const base = activeConversation ?? { id: crypto.randomUUID(), messages: [], pendingQuestion: null, clarifications: [], clarificationCount: 0 };
    const originalQuestion = base.pendingQuestion ?? question;
    const clarificationText = base.pendingQuestion ? question : '';
    const clarifications = clarificationText ? [...(base.clarifications ?? []), clarificationText] : (base.clarifications ?? []);
    let conversation = { ...base, clarifications, messages: [...base.messages, { role: 'user', text: question, selectedAtlasId, createdAt: Date.now() }] };
    if (!base.pendingQuestion) { conversation.pendingQuestion = question; conversation.clarificationCount = 0; conversation.clarifications = []; }
    setActiveConversation(conversation); setDraft('');
    try { await saveLocalConversation(conversation); setConversations(await listLocalConversations()); }
    catch { setHistoryStatus('A pergunta não foi enviada: não foi possível salvá-la neste dispositivo.'); return; }
    setHistoryStatus('Pesquisando somente no pacote local…');
    try {
      const result = await searchClientRef.current.search({ originalQuestion, clarifications, clarification: clarificationText, question, selectedAtlasId });
      const found = result.result;
      let assistantMessage;
      if (found.status === 'ANSWERED') {
        assistantMessage = { role: 'assistant', question: originalQuestion, text: found.record.answer, atlasId: found.record.atlasId, routeIds: found.record.routeIds, sourceIds: found.record.sourceIds, ruleLocators: found.record.ruleLocators, sourceReferences: found.record.sourceReferences, cards: result.cards, figureCrops: result.figureCrops, rulePassages: result.rulePassages, origin: result.origin, createdAt: Date.now() };
        conversation = { ...conversation, pendingQuestion: null, clarifications: [], clarificationCount: 0 };
        setHistoryStatus('Resposta ATLAS localizada; regras e cards relacionados estão disponíveis localmente.');
      } else if (found.status === 'PRETEST_ANSWERED') {
        assistantMessage = { role: 'assistant', question: originalQuestion, text: found.entry.answer, routeIds: [found.entry.route_id].filter(Boolean), rulePassages: result.rulePassages, cards: result.cards, figureCrops: result.figureCrops, origin: result.origin, createdAt: Date.now() };
        conversation = { ...conversation, pendingQuestion: null, clarifications: [], clarificationCount: 0 };
        setHistoryStatus('Resposta de preteste registrado como PASS localizada no dispositivo.');
      } else {
        const count = base.pendingQuestion ? (base.clarificationCount ?? 0) : 0;
        const clarification = clarificationDecision(found.status, count);
        const canAskAgain = clarification.askAgain;
        const topicSuggestions = found.status === 'TOPIC_SUGGESTIONS_REQUIRED';
        const prompt = topicSuggestions
          ? (found.routeIds?.length ? 'Você deseja saber mais sobre que tema desta prova?' : 'Você deseja saber mais sobre que tema?')
          : found.questionOptions?.length
            ? 'Você deseja saber sobre uma destas perguntas registradas?'
          : 'Você deseja saber sobre este aspecto da prova?';
        assistantMessage = {
          role: 'assistant',
          question: originalQuestion,
          text: topicSuggestions ? `${prompt} Seguem perguntas já respondidas no RENATE e as passagens locais relacionadas.` : canAskAgain ? `${prompt} Enquanto isso, segue a passagem local relacionada.` : found.status === 'RULE_FALLBACK' ? 'Não encontrei uma resposta Q&A correspondente. Seguem as passagens locais mais próximas da sua pergunta.' : 'Após dois esclarecimentos, seguem as passagens locais mais próximas da pergunta.',
          questionOptions: topicSuggestions ? (found.questionOptions ?? []) : canAskAgain ? (found.questionOptions ?? []) : [],
          clarificationReason: found.clarificationReason,
          clarificationNumber: clarification.nextCount,
          rulePassages: result.rulePassages,
          cards: result.cards,
          figureCrops: result.figureCrops,
          origin: result.origin,
          showRulesInitially: true,
          showAllRulesInitially: found.status === 'RULE_FALLBACK',
          createdAt: Date.now(),
        };
        if (canAskAgain) {
          conversation = { ...conversation, pendingQuestion: originalQuestion, clarificationCount: clarification.nextCount };
          setHistoryStatus(`Esclarecimento ${clarification.nextCount} de 2; uma passagem local foi apresentada junto.`);
        } else {
          conversation = { ...conversation, pendingQuestion: null, clarifications: [], clarificationCount: 0 };
          setHistoryStatus('Resposta entregue com a passagem local mais próxima; RENATE não se abstém.');
        }
      }
      conversation = { ...conversation, messages: [...conversation.messages, assistantMessage] };
      setActiveConversation(conversation); await saveLocalConversation(conversation); setConversations(await listLocalConversations());
      if (audioEnabledRef.current && assistantMessage.cards?.length) readCardsOnly(assistantMessage.cards);
    } catch { setHistoryStatus('A busca local falhou. A pergunta e o histórico foram mantidos neste dispositivo.'); }
  }

  async function readCardsOnly(cards) {
    clearHoverRead(true);
    const voice = await waitForLocalPortugueseVoice();
    if (!voice) {
      setAudioStatus('Não encontrei uma voz pt-BR local neste aparelho. A resposta textual continua disponível.');
      return false;
    }
    const texts = (cards ?? []).map(cardSpeechText).filter(Boolean);
    if (!texts.length) {
      setAudioStatus('Esta resposta não apresentou cards para leitura.');
      return false;
    }
    window.speechSynthesis.cancel();
    speechSourceRef.current = 'cards';
    setAudioStatus(`Lendo ${texts.length} ${texts.length === 1 ? 'card' : 'cards'} com a voz local pt-BR.`);
    texts.forEach((text, index) => readLocalText(text, voice, { onEnd: index === texts.length - 1 ? () => {
      if (speechSourceRef.current === 'cards') setAudioStatus('Leitura dos cards concluída.');
    } : undefined }));
    return true;
  }

  async function toggleAudioAccessibility() {
    if (audioEnabledRef.current) {
      audioEnabledRef.current = false;
      setAudioAccessibilityEnabled(false);
      clearTimeout(hoverTimerRef.current);
      hoverTargetRef.current = null;
      speechSourceRef.current = null;
      window.speechSynthesis?.cancel();
      setAudioStatus('Leitura por áudio desativada.');
      return;
    }
    const voice = await waitForLocalPortugueseVoice();
    if (!voice) {
      setAudioStatus('Este navegador não oferece uma voz pt-BR local. Instale uma voz pt-BR no aparelho; a leitura textual continua disponível.');
      return;
    }
    audioEnabledRef.current = true;
    setAudioAccessibilityEnabled(true);
    const latest = [...(activeConversation?.messages ?? [])].reverse().find((message) => message.role === 'assistant');
    if (latest?.cards?.length) await readCardsOnly(latest.cards);
    else setAudioStatus('Leitura ativada. Cards da próxima resposta serão lidos; mantenha o cursor sobre um trecho por 3 segundos para ouvi-lo.');
  }

  function clearHoverRead(stopSpeech = true) {
    clearTimeout(hoverTimerRef.current);
    hoverTimerRef.current = null;
    hoverTargetRef.current = null;
    if (stopSpeech && speechSourceRef.current === 'hover') {
      window.speechSynthesis?.cancel();
      speechSourceRef.current = null;
    }
  }

  function scheduleHoverRead(target) {
    if (!audioEnabledRef.current || !target) return;
    const text = (target.getAttribute('aria-label') || target.innerText || target.textContent || '').replace(/\s+/g, ' ').trim();
    if (!text) return;
    if (speechSourceRef.current === 'hover') {
      window.speechSynthesis?.cancel();
      speechSourceRef.current = null;
    }
    clearHoverRead(false);
    hoverTargetRef.current = target;
    hoverTimerRef.current = setTimeout(async () => {
      if (!audioEnabledRef.current || hoverTargetRef.current !== target) return;
      const voice = await waitForLocalPortugueseVoice();
      if (!voice || !audioEnabledRef.current || hoverTargetRef.current !== target) return;
      window.speechSynthesis.cancel();
      speechSourceRef.current = 'hover';
      setAudioStatus('Lendo o trecho selecionado.');
      readLocalText(text, voice, { onEnd: () => {
        if (speechSourceRef.current === 'hover') {
          speechSourceRef.current = null;
          setAudioStatus('Trecho concluído.');
        }
      } });
    }, 3000);
  }

  function handleAudioPointerOver(event) {
    if (event.pointerType !== 'mouse' || !audioEnabledRef.current) return;
    const target = event.target.closest?.('.assistant-message a, .assistant-message h3, .assistant-message h4, .assistant-message li, .assistant-message p, .assistant-message dt, .assistant-message dd, .assistant-message small');
    if (!target || target.contains(event.relatedTarget)) return;
    scheduleHoverRead(target);
  }

  function handleAudioPointerOut(event) {
    if (event.pointerType !== 'mouse') return;
    const target = hoverTargetRef.current;
    if (target && !target.contains(event.relatedTarget)) clearHoverRead(true);
  }

  function handleAudioFocus(event) {
    if (!audioEnabledRef.current) return;
    const target = event.target.closest?.('.assistant-message a, .assistant-message h3, .assistant-message h4, .assistant-message li, .assistant-message p, .assistant-message dt, .assistant-message dd, .assistant-message small');
    if (target) scheduleHoverRead(target);
  }

  function handleAudioBlur(event) {
    const target = event.target.closest?.('.assistant-message a, .assistant-message h3, .assistant-message h4, .assistant-message li, .assistant-message p, .assistant-message dt, .assistant-message dd, .assistant-message small');
    if (target && hoverTargetRef.current === target) clearHoverRead(true);
  }

  async function toggleRecording() {
    if (recording) { recorderRef.current?.stop(); return; }
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) { setSpeechStatus('Este navegador não oferece gravação de áudio compatível. Digite a pergunta.'); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true }); streamRef.current = stream; chunksRef.current = [];
      const recorder = new MediaRecorder(stream); recorderRef.current = recorder;
      recorder.ondataavailable = (event) => { if (event.data.size) chunksRef.current.push(event.data); };
      recorder.onstop = async () => {
        setRecording(false); stream.getTracks().forEach((track) => track.stop()); streamRef.current = null;
        try { setSpeechStatus('Transcrevendo offline no dispositivo…'); const text = await transcribeLocalAudio(new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' })); setDraft((value) => `${value}${value ? ' ' : ''}${text}`); setSpeechStatus(text ? 'Transcrição local pronta; revise antes de enviar.' : 'Não foi possível reconhecer a fala. Digite a pergunta.'); }
        catch (error) { setSpeechStatus(`Falha no ASR local: ${error.message}. Digite a pergunta.`); }
      };
      recorder.start(); setRecording(true); setSpeechStatus('Gravando no dispositivo. Toque novamente para encerrar.');
    } catch { setSpeechStatus('Não foi possível acessar o microfone. Digite a pergunta.'); }
  }

  async function installApp() { if (!installPrompt) return; await installPrompt.prompt(); await installPrompt.userChoice; setInstallPrompt(null); }
  async function completeInstallStep() { setPinState('setup'); }
  async function applyUpdate() { if (window.confirm('Deseja aplicar a atualização disponível?') && window.renateUpdateSW) await window.renateUpdateSW(true); }
  function submitPin() { setPinState('unlock'); setHistoryStatus(''); setUnlocked(true); }

  if (!localDevelopmentNoLogin && pinState === 'checking') return <main className="pin-gate"><p role="status">Preparando o acesso local…</p></main>;
  if (!localDevelopmentNoLogin && pinState === 'error') return <main className="pin-gate"><p role="alert">O armazenamento local está indisponível neste navegador.</p></main>;
  if (!localDevelopmentNoLogin && pinState === 'lead') return <LeadRegistrationGate onComplete={(message) => { setHistoryStatus(message); setPinState('install'); }} />;
  if (!localDevelopmentNoLogin && pinState === 'install') return <InstallGate prompt={installPrompt} onInstall={installApp} onContinue={completeInstallStep} status={historyStatus || offlinePrepDetail} />;
  if (!localDevelopmentNoLogin && !unlocked) return <PinGate setup={pinState === 'setup'} onUnlock={submitPin}/>;

  return <div className="app-shell">
    {mobileNavOpen && <button className="sidebar-scrim" aria-label="Fechar menu" onClick={() => setMobileNavOpen(false)} />}
    <aside className={`sidebar ${mobileNavOpen ? 'mobile-open' : ''}`}>
      <div className="brand-row"><img className="renate-logo" src="/brand/renate-logo.png" alt="RENATE — Regras Nacionais de Tiro Esportivo" /></div>
      <button className="new-conversation" type="button" onClick={() => { setActiveConversation(null); setMobileNavOpen(false); }}><span>＋</span> Nova conversa</button>
      <button className="clear-history" type="button" onClick={removeAllLocalHistory} disabled={!conversations.length}><span>⌫</span> Limpar histórico</button>
      {historyStatus && <p className="history-status" role="status">{historyStatus}</p>}
      <div className="sidebar-section-title history-heading">HISTÓRICO LOCAL</div>
      <nav className="conversation-list" aria-label="Conversas salvas neste dispositivo">{conversations.map((item) => <div className={`conversation-item ${item.id === activeConversation?.id ? 'selected' : ''}`} key={item.id}><button className="conversation-open" onClick={() => openLocalConversation(item.id)} type="button" title={item.title}><span className="conversation-title">{item.title}</span><span className="conversation-date">{new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(item.updatedAt)}</span></button><button className="delete-chat" onClick={() => removeLocalConversation(item.id)} type="button" aria-label={`Apagar ${item.title}`}>×</button></div>)}{!conversations.length && <p className="history-empty">As conversas ficam salvas neste dispositivo.</p>}</nav>
      <div className="sidebar-section-title">NAVEGAÇÃO</div><nav className="side-nav" aria-label="Navegação principal"><button className={`side-nav-item ${activeView === 'conversation' ? 'selected' : ''}`} type="button" onClick={() => { setActiveView('conversation'); setMobileNavOpen(false); }}><span>◉</span> Conversa</button><button className={`side-nav-item ${activeView === 'library' ? 'selected' : ''}`} type="button" onClick={() => { setActiveView('library'); setMobileNavOpen(false); }}><span>▤</span> Biblioteca de regras</button><button className={`side-nav-item ${activeView === 'target-reader' ? 'selected' : ''}`} type="button" onClick={() => { setActiveView('target-reader'); setMobileNavOpen(false); }}><span>◎</span> Ler alvos</button><button className="side-nav-item" type="button" onClick={() => { setActiveView('conversation'); setMobileNavOpen(false); document.querySelector('.local-card')?.scrollIntoView({ behavior: 'smooth' }); }}><span>▧</span> Cards da conversa</button></nav>
      <div className="sidebar-footer"><span className={`status-dot ${installState === 'READY_OFFLINE' ? 'ready' : ''}`} /><span>{installStateText[installState]}</span><small>{offlinePrepDetail || (atlasReady ? 'Busca local · pacote em verificação.' : 'Preparando busca local…')}</small></div>
    </aside>
    <main className="main-panel">
      <header className="topbar"><button className="mobile-menu" aria-label="Abrir menu" onClick={() => setMobileNavOpen(true)}>☰</button><div className="mobile-brand"><img className="renate-logo" src="/brand/renate-logo.png" alt="RENATE — Regras Nacionais de Tiro Esportivo" /></div><div className="topbar-actions">{installPrompt && <button className="outline-button" onClick={installApp}>Instalar app</button>}{refreshAvailable && <button className="outline-button" onClick={applyUpdate}>Atualização disponível</button>}<button className={`icon-button audio-accessibility ${audioAccessibilityEnabled ? 'audio-active' : ''}`} type="button" onClick={toggleAudioAccessibility} aria-label={audioAccessibilityEnabled ? 'Desativar acessibilidade visual por áudio' : 'Ativar acessibilidade visual por áudio'} aria-pressed={audioAccessibilityEnabled} title="Leitura com voz pt-BR local">{audioAccessibilityEnabled ? '🔊' : '🔈'}</button>{!localDevelopmentNoLogin && <button className="outline-button" onClick={() => { clearHoverRead(true); speechSourceRef.current = null; window.speechSynthesis?.cancel(); setUnlocked(false); }}>Bloquear</button>}<span className="beta-pill">BETA</span></div></header>
      {activeView === 'library' ? <LocalLibraryView/> : activeView === 'target-reader' ? <TargetReaderView/> : <><section className={`conversation-view ${activeConversation ? 'has-history' : ''}`} aria-labelledby="welcome-title" onPointerOver={handleAudioPointerOver} onPointerOut={handleAudioPointerOut} onFocusCapture={handleAudioFocus} onBlurCapture={handleAudioBlur}>
        {activeConversation ? <div className="saved-conversation" aria-live="polite"><h2>{activeConversation.title}</h2>{activeConversation.messages.map((message, index) => <article className={`saved-message ${message.role === 'user' ? 'user-message' : 'assistant-message'}`} key={`${activeConversation.id}-${index}`}><strong>{message.role === 'user' ? 'Você' : 'RENATE'}</strong>{message.role === 'user' ? <p>{message.text}</p> : <MessageDetails message={message} sendQuestion={sendQuestion}/>}</article>)}</div> : <div className="welcome-card"><div className="eyebrow"><span /> ASSISTENTE ESPORTIVO OFFLINE</div><h1 id="welcome-title">Como posso ajudar?</h1><p>Faça uma pergunta sobre regras, equipamentos ou provas. Perguntas, respostas e histórico ficam salvos somente neste dispositivo.</p><div className="pack-notice" role="status"><span className="notice-icon">i</span><span><strong>{atlasReady ? 'Pacote local preparado.' : 'Preparando pacote local.'}</strong> {atlasReady ? 'Busca no ATLAS, pretestes, regras e cards locais.' : 'O campo será liberado após validar os dados.'}</span></div><div className="suggestion-grid" aria-label="Exemplos de perguntas"><span>Regras da prova</span><span>Equipamentos</span><span>Cards e fontes</span></div></div>}
      </section>
      <footer className="composer-wrap"><form className="composer" onSubmit={(event) => { event.preventDefault(); sendQuestion(draft); }}><textarea aria-label="Pergunta" placeholder={atlasReady ? 'Escreva sua pergunta…' : 'Preparando conteúdo local…'} value={draft} onChange={(event) => setDraft(event.target.value)} disabled={!atlasReady} rows="1" onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); event.currentTarget.form.requestSubmit(); } }}/><div className="composer-controls"><span className="composer-hint">{speechStatus || (atlasReady ? 'Busca local · PIN · histórico no dispositivo.' : 'Preparando busca local.')}</span><div className="composer-buttons"><button className={`icon-button ${recording ? 'recording' : ''}`} type="button" onClick={toggleRecording} disabled={!atlasReady} aria-label={recording ? 'Parar gravação' : 'Perguntar por áudio'} title="Transcrição Whisper Tiny offline">{recording ? '■' : '♩'}</button><button className="send-button" type="submit" disabled={!atlasReady || !draft.trim()} aria-label="Enviar pergunta">↑</button></div></div></form>{audioStatus && <p className="audio-status" role="status">{audioStatus}</p>}<p className="disclaimer">RENATE BETA · A leitura por áudio usa apenas voz pt-BR local disponível no aparelho; a resposta textual permanece visível.</p></footer></>}
    </main>
  </div>;
}
