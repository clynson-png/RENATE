import { useEffect, useMemo, useRef, useState } from 'react';
import { analyzeCalibratedRifleTarget, loadTargetReaderOpenCV, prepareTargetReaderImage, releaseTargetReaderImage, scoreRawImpact } from './targetReaderEngine.js';
import { deleteTargetReaderSessions, listTargetReaderSessions, saveTargetReaderSession } from './targetReaderStore.js';
import './targetReader.css';

const TOTAL_SHOTS = 60;
const TARGETS_PER_STRIP = 5;
const VISUAL_PROJECTILE_DIAMETER_MM = 3.5;

function localDateTimeValue(date = new Date()) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

function normalize(value) { return String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLocaleLowerCase('pt-BR'); }

function createDefaultCalibrations(width, height) {
  const vertical = height >= width;
  return Array.from({ length: TARGETS_PER_STRIP }, (_, index) => ({
    centerX: vertical ? 0.5 : 0.11 + index * 0.165,
    centerY: vertical ? 0.11 + index * 0.165 : 0.5,
    referenceRadius: 0.13,
    centerAdjusted: false,
    diameterAdjusted: false,
  }));
}

function sessionLabel(session) {
  const date = session.eventDateTime ? new Date(session.eventDateTime).toLocaleString('pt-BR') : '';
  return `${session.athleteName} · ${session.eventName} · ${date}`;
}

function escapeCsv(value) { return `"${String(value ?? '').replaceAll('"', '""')}"`; }
function shotDecimal(shot) { return Number(shot.decimalScore ?? shot.score ?? 0); }
function formatDecimal(value) { return Number(value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }); }

function downloadCsv(sessions, label) {
  const rows = [['ID da leitura', 'Status da leitura', 'Atleta', 'CBTE', 'Evento', 'Data e hora', 'Série', 'Disparo', 'Alvo da fita', 'Pontos decimais', 'Pontos inteiros', 'Direção', 'Distância radial (mm)', 'Leitura']];
  for (const session of sessions) for (const shot of session.shots ?? []) {
    rows.push([session.id, session.status, session.athleteName, session.cbteNumber, session.eventName, session.eventDateTime, shot.series, shot.shotInSeries, shot.targetNumber, formatDecimal(shotDecimal(shot)), shot.score, shot.direction, shot.radialMm, shot.source]);
  }
  const csv = `\uFEFF${rows.map((row) => row.map(escapeCsv).join(';')).join('\r\n')}`;
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const anchor = document.createElement('a');
  anchor.href = url; anchor.download = `${label}-${new Date().toISOString().slice(0, 10)}.csv`; anchor.click();
  URL.revokeObjectURL(url);
}

export default function TargetReaderView() {
  const [sessions, setSessions] = useState([]);
  const [session, setSession] = useState(null);
  const [screen, setScreen] = useState('home');
  const [metadata, setMetadata] = useState({ athleteName: '', cbteNumber: '', eventName: '', eventDateTime: localDateTimeValue() });
  const [filterAthlete, setFilterAthlete] = useState('');
  const [filterEvent, setFilterEvent] = useState('');
  const [selectedSessionIds, setSelectedSessionIds] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [photo, setPhoto] = useState(null);
  const [imageSize, setImageSize] = useState(null);
  const [calibrations, setCalibrations] = useState([]);
  const [shotCounts, setShotCounts] = useState(Array(TARGETS_PER_STRIP).fill(1));
  const [activeTarget, setActiveTarget] = useState(0);
  const [analysis, setAnalysis] = useState(null);
  const [reviewCanvasWidth, setReviewCanvasWidth] = useState(0);
  const [dragMode, setDragMode] = useState('');
  const [draggingImpact, setDraggingImpact] = useState(null);
  const cameraInput = useRef(null);
  const photoInput = useRef(null);
  const imageRef = useRef(null);
  const reviewImageRef = useRef(null);
  const objectUrlRef = useRef('');
  const targetImageRef = useRef(null);

  useEffect(() => {
    listTargetReaderSessions().then(setSessions).catch((reason) => setError(reason.message));
    return () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
      releaseTargetReaderImage(targetImageRef.current);
    };
  }, []);

  useEffect(() => {
    if (screen !== 'review') { setReviewCanvasWidth(0); return undefined; }
    const measure = () => setReviewCanvasWidth(reviewImageRef.current?.getBoundingClientRect().width || 0);
    measure();
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure);
    if (reviewImageRef.current && observer) observer.observe(reviewImageRef.current);
    window.addEventListener('resize', measure);
    return () => { observer?.disconnect(); window.removeEventListener('resize', measure); };
  }, [screen, analysis?.width]);

  const filteredSessions = useMemo(() => sessions.filter((item) => {
    const athleteMatch = !filterAthlete || normalize(item.athleteName) === normalize(filterAthlete);
    const eventMatch = !filterEvent || normalize(item.eventName).includes(normalize(filterEvent));
    return athleteMatch && eventMatch;
  }), [sessions, filterAthlete, filterEvent]);
  const athleteSessions = sessions.filter((item) => normalize(item.athleteName) === normalize(filterAthlete));
  const eventSessions = sessions.filter((item) => normalize(item.eventName) === normalize(filterEvent));
  const visibleSessionIds = filteredSessions.map((item) => item.id);
  const allVisibleSessionsSelected = visibleSessionIds.length > 0 && visibleSessionIds.every((id) => selectedSessionIds.includes(id));

  const remaining = Math.max(0, TOTAL_SHOTS - (session?.shots?.length ?? 0));
  const selectedTotal = shotCounts.reduce((sum, value) => sum + Number(value), 0);
  const remainderAfterStrip = remaining - selectedTotal;
  const firstTargetCalibrated = Boolean(calibrations[0]?.centerAdjusted && calibrations[0]?.diameterAdjusted);
  const canRead = calibrations.length === TARGETS_PER_STRIP && firstTargetCalibrated && selectedTotal <= remaining && (remainderAfterStrip === 0 || remainderAfterStrip >= TARGETS_PER_STRIP);
  const canAcceptStrip = Boolean(analysis) && analysis.targets.every((target, index) => target.impacts.length === Number(shotCounts[index])) && selectedTotal <= remaining;

  async function refreshSessions(nextSession) {
    setSession(nextSession);
    setSessions(await listTargetReaderSessions());
  }

  function toggleSessionSelection(sessionId, checked) {
    setSelectedSessionIds((current) => checked
      ? (current.includes(sessionId) ? current : [...current, sessionId])
      : current.filter((id) => id !== sessionId));
  }

  function toggleVisibleSessionSelection(checked) {
    setSelectedSessionIds((current) => checked
      ? [...new Set([...current, ...visibleSessionIds])]
      : current.filter((id) => !visibleSessionIds.includes(id)));
  }

  async function deleteSessions(sessionIds) {
    const uniqueIds = [...new Set(sessionIds)];
    if (!uniqueIds.length || busy) return;
    setBusy(true); setError(''); setMessage('');
    try {
      const deletedCount = await deleteTargetReaderSessions(uniqueIds);
      setSessions(await listTargetReaderSessions());
      setSelectedSessionIds((current) => current.filter((id) => !uniqueIds.includes(id)));
      setMessage(`${deletedCount} leitura${deletedCount === 1 ? '' : 's'} excluída${deletedCount === 1 ? '' : 's'} do armazenamento deste aparelho.`);
    } catch (reason) { setError(reason.message); }
    finally { setBusy(false); }
  }

  function confirmDeleteSession(item) {
    if (window.confirm(`Excluir toda a leitura de ${item.athleteName} · ${item.eventName}? Esta ação apaga os disparos desta leitura deste aparelho.`)) {
      void deleteSessions([item.id]);
    }
  }

  function confirmDeleteSelectedSessions() {
    const count = selectedSessionIds.length;
    if (count && window.confirm(`Excluir ${count} leitura${count === 1 ? '' : 's'} selecionada${count === 1 ? '' : 's'}? Todos os disparos dessas leituras serão apagados deste aparelho.`)) {
      void deleteSessions(selectedSessionIds);
    }
  }

  async function beginSession(event) {
    event.preventDefault(); setError(''); setMessage(''); setBusy(true);
    try {
      const created = {
        id: crypto.randomUUID(), athleteName: metadata.athleteName.trim(), cbteNumber: metadata.cbteNumber.trim(),
        eventName: metadata.eventName.trim(), eventDateTime: new Date(metadata.eventDateTime).toISOString(),
        status: 'IN_PROGRESS', shots: [], stripsScanned: 0, createdAt: Date.now(), updatedAt: Date.now(),
      };
      await saveTargetReaderSession(created);
      await refreshSessions(created);
      setScreen('scan');
      setMessage('Sessão local iniciada. Os dados serão gravados neste aparelho; as fotos não são salvas.');
    } catch (reason) { setError(reason.message); }
    finally { setBusy(false); }
  }

  function clearPhoto() {
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    objectUrlRef.current = '';
    releaseTargetReaderImage(targetImageRef.current);
    targetImageRef.current = null;
    setPhoto(null); setImageSize(null); setCalibrations([]); setAnalysis(null);
  }

  function choosePhoto(file) {
    if (!file) return;
    clearPhoto();
    objectUrlRef.current = URL.createObjectURL(file);
    setPhoto({ file, url: objectUrlRef.current, name: file.name || 'foto da fita' });
    setShotCounts(Array(TARGETS_PER_STRIP).fill(1));
    setActiveTarget(0);
    setError(''); setMessage('');
  }

  function handlePhotoInput(event) {
    choosePhoto(event.currentTarget.files?.[0]);
    event.currentTarget.value = '';
  }

  function onPhotoLoaded(event) {
    const { naturalWidth: width, naturalHeight: height } = event.currentTarget;
    setImageSize({ width, height });
    setCalibrations(createDefaultCalibrations(width, height));
  }

  function calibrationPoint(event) {
    const bounds = imageRef.current?.getBoundingClientRect();
    if (!bounds) return null;
    return { x: Math.max(0, Math.min(1, (event.clientX - bounds.left) / bounds.width)), y: Math.max(0, Math.min(1, (event.clientY - bounds.top) / bounds.height)), width: bounds.width, height: bounds.height };
  }

  function moveCalibration(event, finish = false) {
    if (!dragMode) return;
    const point = calibrationPoint(event);
    if (!point) return;
    setCalibrations((current) => {
      if (dragMode === 'radius') {
        const first = current[0];
        const radius = Math.hypot((point.x - first.centerX) * point.width, (point.y - first.centerY) * point.height) / point.width;
        const sharedRadius = Math.max(0.02, Math.min(0.48, radius));
        return current.map((item) => ({ ...item, referenceRadius: sharedRadius, diameterAdjusted: true }));
      }
      const active = current[activeTarget];
      const dx = point.x - active.centerX;
      const dy = point.y - active.centerY;
      return current.map((item, index) => {
        if (activeTarget === 0) return { ...item, centerX: Math.max(0, Math.min(1, item.centerX + dx)), centerY: Math.max(0, Math.min(1, item.centerY + dy)), centerAdjusted: true };
        return index === activeTarget ? { ...item, centerX: point.x, centerY: point.y, centerAdjusted: true } : item;
      });
    });
    if (finish) setDragMode('');
  }

  async function readStrip() {
    setError(''); setMessage(''); setBusy(true);
    try {
      const cv = await loadTargetReaderOpenCV();
      const bitmap = await createImageBitmap(photo.file);
      const scale = Math.min(1, 1400 / Math.max(bitmap.width, bitmap.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(bitmap.width * scale)); canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      canvas.getContext('2d', { willReadFrequently: true }).drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      bitmap.close?.();
      releaseTargetReaderImage(targetImageRef.current);
      targetImageRef.current = prepareTargetReaderImage(cv, canvas);
      const targets = calibrations.map((calibration) => ({ ...calibration, impacts: analyzeCalibratedRifleTarget(cv, targetImageRef.current.gray, calibration) }));
      targets.forEach((target, index) => { target.targetNumber = index + 1; target.expectedShots = Number(shotCounts[index]); });
      setAnalysis({ targets, width: targetImageRef.current.width, height: targetImageRef.current.height });
      setScreen('review'); setMessage('Pontos RAW em azul. Confira a contagem de cada alvo e corrija marcações antes de aceitar a fita.');
    } catch (reason) { setError(`Não foi possível ler esta foto. ${reason.message || 'Verifique o enquadramento e calibre novamente.'}`); }
    finally { setBusy(false); }
  }

  function updateImpact(targetIndex, impactIndex, update) {
    setAnalysis((current) => ({ ...current, targets: current.targets.map((target, index) => index !== targetIndex ? target : ({
      ...target, impacts: target.impacts.map((impact, itemIndex) => itemIndex === impactIndex ? { ...impact, ...update } : impact),
    })) }));
  }

  function beginImpactDrag(event, targetIndex, impactIndex) {
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    setActiveTarget(targetIndex);
    setDraggingImpact({ targetIndex, impactIndex, pointerId: event.pointerId });
  }

  function moveImpactMarker(event, finish = false) {
    if (!draggingImpact || draggingImpact.pointerId !== event.pointerId) return;
    event.preventDefault();
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(analysis.width, ((event.clientX - bounds.left) / bounds.width) * analysis.width));
    const y = Math.max(0, Math.min(analysis.height, ((event.clientY - bounds.top) / bounds.height) * analysis.height));
    const { targetIndex, impactIndex } = draggingImpact;
    const calibration = calibrations[targetIndex];
    const center = { x: calibration.centerX * analysis.width, y: calibration.centerY * analysis.height };
    const pixelsPerMm = (calibration.referenceRadius * analysis.width) / 15.25;
    const currentImpact = analysis.targets[targetIndex].impacts[impactIndex];
    if (currentImpact) {
      const impact = {
        ...currentImpact,
        x,
        y,
        source: 'MANUAL',
        confidence: 1,
        radiusPx: (VISUAL_PROJECTILE_DIAMETER_MM / 2) * pixelsPerMm,
      };
      const scored = scoreRawImpact(impact, center, pixelsPerMm);
      updateImpact(targetIndex, impactIndex, { x, y, source: impact.source, confidence: impact.confidence, radiusPx: impact.radiusPx, ...scored, direction: directionForImpact(impact, center, pixelsPerMm), needsReview: true });
    }
    if (finish) setDraggingImpact(null);
  }

  function removeImpact(targetIndex, impactIndex) {
    setAnalysis((current) => ({ ...current, targets: current.targets.map((target, index) => index !== targetIndex ? target : ({ ...target, impacts: target.impacts.filter((_, itemIndex) => itemIndex !== impactIndex) })) }));
  }

  function addImpact(event) {
    const activeTargetData = analysis.targets[activeTarget];
    const expectedShots = shotCountForTarget(activeTarget);
    if (activeTargetData.impacts.length >= expectedShots) {
      setError(`Alvo ${activeTarget + 1} já está completo. Selecione um alvo com slot vazio.`);
      return;
    }
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - bounds.left) / bounds.width) * analysis.width;
    const y = ((event.clientY - bounds.top) / bounds.height) * analysis.height;
    const calibration = calibrations[activeTarget];
    const center = { x: calibration.centerX * analysis.width, y: calibration.centerY * analysis.height };
    const pixelsPerMm = (calibration.referenceRadius * analysis.width) / 15.25;
    const impact = { id: `MANUAL_${Date.now()}`, x, y, radiusPx: (VISUAL_PROJECTILE_DIAMETER_MM / 2) * pixelsPerMm, source: 'MANUAL', confidence: 1 };
    if (Math.hypot(x - center.x, y - center.y) / pixelsPerMm > 45.5 / 2 + 4.5) {
      setError(`Marque o impacto dentro da área do alvo ${activeTarget + 1}.`);
      return;
    }
    setError('');
    const scored = scoreRawImpact(impact, center, pixelsPerMm);
    const direction = directionForImpact(impact, center, pixelsPerMm);
    setAnalysis((current) => ({ ...current, targets: current.targets.map((target, index) => index !== activeTarget ? target : ({ ...target, impacts: [...target.impacts, { ...impact, ...scored, direction, needsReview: true }] })) }));
    const nextTargetWithSlot = Array.from({ length: TARGETS_PER_STRIP }, (_, offset) => (activeTarget + offset) % TARGETS_PER_STRIP)
      .find((targetIndex) => analysis.targets[targetIndex].impacts.length + (targetIndex === activeTarget ? 1 : 0) < shotCountForTarget(targetIndex));
    if (nextTargetWithSlot !== undefined) setActiveTarget(nextTargetWithSlot);
  }

  function reorderImpact(targetIndex, impactIndex, delta) {
    setAnalysis((current) => ({ ...current, targets: current.targets.map((target, index) => {
      if (index !== targetIndex) return target;
      const next = [...target.impacts]; const other = impactIndex + delta;
      if (other < 0 || other >= next.length) return target;
      [next[impactIndex], next[other]] = [next[other], next[impactIndex]];
      return { ...target, impacts: next };
    }) }));
  }

  async function acceptStrip() {
    if (!session || !canAcceptStrip) return;
    setBusy(true); setError('');
    try {
      const nextShots = [...session.shots];
      for (const target of analysis.targets) for (const impact of target.impacts) {
        const shotNumber = nextShots.length + 1;
        nextShots.push({
          shotNumber, series: Math.ceil(shotNumber / 10), shotInSeries: ((shotNumber - 1) % 10) + 1,
          targetNumber: target.targetNumber, score: impact.score, decimalScore: shotDecimal(impact), direction: impact.direction,
          radialMm: impact.radialMm, source: impact.source === 'MANUAL' ? 'MANUAL' : 'RAW_VISION',
        });
      }
      const complete = nextShots.length === TOTAL_SHOTS;
      const nextSession = { ...session, shots: nextShots, stripsScanned: session.stripsScanned + 1, status: complete ? 'READY_TO_FINALIZE' : 'IN_PROGRESS', completedAt: null, updatedAt: Date.now() };
      await saveTargetReaderSession(nextSession);
      await refreshSessions(nextSession);
      clearPhoto(); setScreen('scan');
      setMessage(complete ? '60 disparos gravados localmente. A tabela final está pronta.' : `${selectedTotal} disparos da fita gravados. Progresso: ${nextShots.length}/60.`);
    } catch (reason) { setError(reason.message); }
    finally { setBusy(false); }
  }

  async function finalizeSession() {
    if (!session || session.shots.length !== TOTAL_SHOTS) return;
    const next = { ...session, status: 'COMPLETE', completedAt: session.completedAt || Date.now(), updatedAt: Date.now() };
    try { await saveTargetReaderSession(next); await refreshSessions(next); setScreen('report'); setMessage('Tabela salva neste aparelho.'); }
    catch (reason) { setError(reason.message); }
  }

  function openSession(item) { setSession(item); setScreen(item.status === 'COMPLETE' ? 'report' : 'scan'); setError(''); setMessage(''); }

  const shotCountForTarget = (index) => Number(shotCounts[index] || 1);
  const impactMarkerSizePx = (targetIndex) => {
    const targetCalibration = calibrations[targetIndex];
    const displayWidth = reviewCanvasWidth || imageRef.current?.getBoundingClientRect().width;
    if (!targetCalibration || !displayWidth) return 13;
    return displayWidth * targetCalibration.referenceRadius * 2 * VISUAL_PROJECTILE_DIAMETER_MM / 30.5;
  };
  const tableRows = Array.from({ length: 6 }, (_, index) => {
    const shots = (session?.shots ?? []).filter((shot) => shot.series === index + 1).sort((a, b) => a.shotInSeries - b.shotInSeries);
    return { series: index + 1, shots, total: shots.reduce((sum, shot) => sum + Math.round(shotDecimal(shot) * 10), 0) / 10 };
  });
  const sessionTotal = (session?.shots ?? []).reduce((sum, shot) => sum + Math.round(shotDecimal(shot) * 10), 0) / 10;

  return <section className="target-reader-view" aria-labelledby="target-reader-heading">
    <header className="target-reader-heading"><div><span className="target-reader-kicker">MÓDULO LOCAL · CARABINA DE AR 10 M</span><h1 id="target-reader-heading">Ler alvos</h1><p>Leitor RAW independente. As imagens são processadas no aparelho e não ficam armazenadas.</p></div><button type="button" className="target-reader-back" onClick={() => { setScreen('home'); setSession(null); clearPhoto(); }}>Voltar</button></header>
    {message && <p className="target-reader-message" role="status">{message}</p>}
    {error && <p className="target-reader-error" role="alert">{error}</p>}

    {screen === 'home' && <>
      <div className="target-reader-columns">
        <form className="target-reader-card" onSubmit={beginSession}>
          <h2>Nova leitura</h2><p>Identifique o atleta e a atividade antes de fotografar e salvar qualquer alvo.</p>
          <label>Nome do atleta <input required maxLength="160" value={metadata.athleteName} onChange={(event) => setMetadata({ ...metadata, athleteName: event.target.value })} /></label>
          <label>Número CBTE (opcional) <input inputMode="numeric" maxLength="30" value={metadata.cbteNumber} onChange={(event) => setMetadata({ ...metadata, cbteNumber: event.target.value })} /></label>
          <label>Evento <input required maxLength="200" placeholder="Campeonato…, treino, prova online…" value={metadata.eventName} onChange={(event) => setMetadata({ ...metadata, eventName: event.target.value })} /></label>
          <label>Data e hora <input required type="datetime-local" value={metadata.eventDateTime} onChange={(event) => setMetadata({ ...metadata, eventDateTime: event.target.value })} /></label>
          <button className="target-reader-primary" disabled={busy}>{busy ? 'Preparando…' : 'Iniciar leitura'}</button>
        </form>
        <section className="target-reader-card target-reader-search"><h2>Resultados neste aparelho</h2><p>Consulte leituras, exclua provas e exporte os disparos em CSV.</p>
          <label>Atleta <input value={filterAthlete} onChange={(event) => setFilterAthlete(event.target.value)} placeholder="Nome exato do atleta" /></label>
          <label>Evento <input value={filterEvent} onChange={(event) => setFilterEvent(event.target.value)} placeholder="Nome exato do evento" /></label>
          <div className="target-reader-actions">
            <button type="button" className="target-reader-secondary" onClick={() => downloadCsv(eventSessions, 'renate-provas-evento')} disabled={!filterEvent.trim() || !eventSessions.length}>CSV do evento · {eventSessions.length} provas</button>
            <button type="button" className="target-reader-secondary" onClick={() => downloadCsv(athleteSessions, 'renate-provas-atleta')} disabled={!filterAthlete.trim() || !athleteSessions.length}>CSV do atleta · {athleteSessions.length} provas</button>
            <button type="button" className="target-reader-danger" onClick={confirmDeleteSelectedSessions} disabled={!selectedSessionIds.length || busy}>Excluir selecionadas · {selectedSessionIds.length}</button>
          </div>
          <label className="target-reader-select-visible"><input type="checkbox" checked={allVisibleSessionsSelected} onChange={(event) => toggleVisibleSessionSelection(event.target.checked)} disabled={!filteredSessions.length || busy} />Selecionar todas as {filteredSessions.length} leituras exibidas</label>
          <div className="target-reader-session-list">{filteredSessions.map((item) => <div className="target-reader-session-entry" key={item.id}>
            <label className="target-reader-session-select"><input type="checkbox" checked={selectedSessionIds.includes(item.id)} onChange={(event) => toggleSessionSelection(item.id, event.target.checked)} disabled={busy} aria-label={`Selecionar leitura de ${item.athleteName}, ${item.eventName}`} /></label>
            <button type="button" className="target-reader-session-open" onClick={() => openSession(item)}><span>{sessionLabel(item)}</span><b>{item.shots?.length ?? 0}/60 · {item.status === 'COMPLETE' ? 'completa' : 'em andamento'}</b></button>
            <button type="button" className="target-reader-danger target-reader-delete-one" onClick={() => confirmDeleteSession(item)} disabled={busy} aria-label={`Excluir leitura de ${item.athleteName}, ${item.eventName}`}>Excluir</button>
          </div>)}{!filteredSessions.length && <small>Nenhuma leitura local encontrada.</small>}</div>
        </section>
      </div>
    </>}

    {screen === 'scan' && session && <>
      <div className="target-reader-progress"><strong>{session.athleteName}</strong><span>{session.eventName} · {new Date(session.eventDateTime).toLocaleString('pt-BR')}</span><b>{session.shots.length}/60 disparos</b></div>
      {remaining > 0 ? <section className="target-reader-card target-reader-strip">
        <h2>Fita {session.stripsScanned + 1} · cinco alvos</h2><p>Escolha quantos disparos há em cada alvo. O total da fita não pode passar os {remaining} disparos restantes.</p>
        <div className="target-reader-counts">{shotCounts.map((count, index) => <label key={`count-${index}`}>Alvo {index + 1}<select value={count} onChange={(event) => setShotCounts((current) => current.map((value, itemIndex) => itemIndex === index ? Number(event.target.value) : value))}>{[1, 2, 3, 4, 5].map((option) => <option key={option} value={option}>{option} {option === 1 ? 'disparo' : 'disparos'}</option>)}</select></label>)}</div>
        <p className={selectedTotal > remaining || (remainderAfterStrip > 0 && remainderAfterStrip < TARGETS_PER_STRIP) ? 'target-reader-inline-error' : 'target-reader-subtle'}>{selectedTotal} disparos nesta fita · {remaining} restantes.{remainderAfterStrip > 0 && remainderAfterStrip < TARGETS_PER_STRIP ? ' Ajuste a quantidade para não deixar menos de cinco disparos, pois cada próxima fita contém cinco alvos.' : ''}</p>
        <div className="target-reader-photo-actions"><button type="button" className="target-reader-secondary" onClick={() => cameraInput.current?.click()}>Tirar foto da fita</button><button type="button" className="target-reader-secondary" onClick={() => photoInput.current?.click()}>Abrir uma foto</button></div>
        <input ref={cameraInput} className="target-reader-hidden-input" type="file" accept="image/*" capture="environment" onChange={handlePhotoInput} />
        <input ref={photoInput} className="target-reader-hidden-input" type="file" accept="image/*" onChange={handlePhotoInput} />
        {photo && <>
          <h3>Calibre a fita · {photo.name}</h3>
          <p>{imageSize ? 'Ajuste o ponto e o círculo do Alvo 1. Os cinco alvos aparecem juntos; o diâmetro calibrado no primeiro é compartilhado pelos demais. Se necessário, arraste os outros pontos para centralizá-los.' : 'Carregando a foto para exibir a calibração…'}</p>
          <div className="target-reader-canvas" ref={imageRef} onPointerMove={(event) => moveCalibration(event)} onPointerUp={(event) => moveCalibration(event, true)} onPointerCancel={() => setDragMode('')}>
            <img src={photo.url} alt="Fita de cinco alvos para calibração" onLoad={onPhotoLoaded} onError={() => setError('Não foi possível carregar a imagem selecionada neste navegador. Escolha outra foto.')} draggable="false" />
            {imageSize && calibrations.map((item, index) => <div key={`calibration-${index}`} className="target-reader-calibration-overlay">
              <div className="target-reader-calibration-circle" style={{ left: `${item.centerX * 100}%`, top: `${item.centerY * 100}%`, width: `${item.referenceRadius * 200}%` }} />
              <button type="button" aria-label={`Arrastar ponto central de 0,5 mm do alvo ${index + 1}`} className="target-reader-center-point" style={{ left: `${item.centerX * 100}%`, top: `${item.centerY * 100}%`, '--point-size': `${Math.max(1, (imageRef.current?.getBoundingClientRect().width || 1) * item.referenceRadius * 2 * 0.5 / 30.5)}px` }} onPointerDown={(event) => { event.preventDefault(); setActiveTarget(index); setDragMode('center'); event.currentTarget.setPointerCapture(event.pointerId); }} />
              {index === 0 && <button type="button" aria-label="Ajustar o diâmetro dos cinco alvos" className="target-reader-radius-handle" style={{ left: `${(item.centerX + item.referenceRadius) * 100}%`, top: `${item.centerY * 100}%` }} onPointerDown={(event) => { event.preventDefault(); setActiveTarget(0); setDragMode('radius'); event.currentTarget.setPointerCapture(event.pointerId); }} />}
              <span className="target-reader-calibration-number" style={{ left: `${item.centerX * 100}%`, top: `${(item.centerY - item.referenceRadius - 0.012) * 100}%` }}>{index + 1}</span>
            </div>)}
          </div>
          {imageSize && <>
            <div className="target-reader-calibration-status"><span className={firstTargetCalibrated ? 'ready' : ''}>Alvo 1: {firstTargetCalibrated ? 'calibrado' : 'ajuste o ponto central e o diâmetro'}</span><span className={calibrations.length === TARGETS_PER_STRIP && calibrations[0]?.diameterAdjusted ? 'ready' : ''}>Alvos 2–5: círculos sincronizados com o Alvo 1 · ajuste os pontos somente se necessário</span></div>
            <button type="button" className="target-reader-primary" disabled={!canRead || busy} onClick={readStrip}>{busy ? 'Lendo impactos RAW…' : 'Ler a fita'}</button>
          </>}
        </>}
      </section> : <section className="target-reader-card"><h2>60 disparos alcançados</h2><p>Salve e apresente a tabela final.</p><button type="button" className="target-reader-primary" onClick={finalizeSession}>Salvar e apresentar a tabela</button></section>}
      <TargetSeriesTable rows={tableRows} total={sessionTotal} shotCount={session.shots.length} />
    </>}

    {screen === 'review' && photo && analysis && session && <section className="target-reader-card target-reader-review">
      <h2>Revisar a leitura RAW da fita</h2><p>Os marcadores azuis são impactos identificados pelo algoritmo. Toque na marca para incluir um ponto manual e arraste a bola azul de 3,5 mm para ajustar sua posição. A pontuação é recalculada pela borda da bola voltada ao centro do alvo enquanto você ajusta.</p>
      <p className="target-reader-subtle">Depois de cada marcação, o leitor seleciona o próximo alvo com slot vazio. Se preferir, escolha manualmente outro alvo abaixo.</p>
      <div className="target-reader-target-tabs">{analysis.targets.map((target, index) => <button type="button" key={`review-tab-${index}`} className={activeTarget === index ? 'selected' : ''} onClick={() => setActiveTarget(index)}>Alvo {index + 1} · {target.impacts.length}/{shotCountForTarget(index)}{target.impacts.length >= shotCountForTarget(index) ? ' ✓' : ''}</button>)}</div>
      <div ref={reviewImageRef} className="target-reader-canvas target-reader-result-canvas" onClick={addImpact} onPointerMove={moveImpactMarker} onPointerUp={(event) => moveImpactMarker(event, true)} onPointerCancel={() => setDraggingImpact(null)}>
        <img src={photo.url} alt="Fita com impactos RAW identificados" draggable="false" />
        {analysis.targets.flatMap((target, targetIndex) => target.impacts.flatMap((impact, impactIndex) => {
          const markerSize = impactMarkerSizePx(targetIndex);
          return <button type="button" key={impact.id} aria-label={`Arrastar e ajustar a bola de 3,5 mm do impacto ${impactIndex + 1} no alvo ${targetIndex + 1}`} className="target-reader-impact-dot" style={{ left: `${(impact.x / analysis.width) * 100}%`, top: `${(impact.y / analysis.height) * 100}%`, '--impact-diameter': `${markerSize}px` }} onPointerDown={(event) => beginImpactDrag(event, targetIndex, impactIndex)} onClick={(event) => event.stopPropagation()} />;
        }))}
      </div>
      <div className="target-reader-impact-groups">{analysis.targets.map((target, targetIndex) => <section key={`target-impact-${targetIndex}`} className={target.impacts.length === shotCountForTarget(targetIndex) ? 'count-match' : 'count-mismatch'}>
        <h3>Alvo {targetIndex + 1} · {target.impacts.length}/{shotCountForTarget(targetIndex)} disparos {target.impacts.length === shotCountForTarget(targetIndex) ? '✓' : '· revisar'}</h3>
        {target.impacts.map((impact, impactIndex) => <div className="target-reader-impact-row" key={impact.id}><span>Impacto {impactIndex + 1} · {impact.source === 'MANUAL' ? 'manual' : `RAW ${Math.round(impact.confidence * 100)}%`}</span><label>Pontos decimais<select value={Math.round(shotDecimal(impact) * 10)} onChange={(event) => { const decimalTenths = Number(event.target.value); updateImpact(targetIndex, impactIndex, { decimalScore: decimalTenths / 10, score: Math.floor(decimalTenths / 10), ringBoundary: true }); }}>{Array.from({ length: 110 }, (_, index) => 109 - index).map((tenths) => <option key={tenths} value={tenths}>{formatDecimal(tenths / 10)}</option>)}</select></label><b>{impact.direction} · {impact.radialMm} mm</b><div className="target-reader-row-actions"><button type="button" disabled={impactIndex === 0} onClick={() => reorderImpact(targetIndex, impactIndex, -1)}>↑</button><button type="button" disabled={impactIndex === target.impacts.length - 1} onClick={() => reorderImpact(targetIndex, impactIndex, 1)}>↓</button><button type="button" onClick={() => removeImpact(targetIndex, impactIndex)}>Remover</button></div></div>)}
      </section>)}</div>
      <p className="target-reader-subtle">A ordem dos alvos segue de cima para baixo na fita. Dentro de cada alvo, ajuste a ordem com as setas. C significa marcação que toca o ponto central; Q1–Q4 são quadrantes de 90°.</p>
      <div className="target-reader-actions"><button type="button" className="target-reader-secondary" onClick={() => { setScreen('scan'); setAnalysis(null); }}>Refazer foto/calibração</button><button type="button" className="target-reader-primary" disabled={!canAcceptStrip || busy} onClick={acceptStrip}>{busy ? 'Gravando…' : `Aceitar fita · ${selectedTotal} disparos`}</button></div>
    </section>}

    {screen === 'report' && session && <>
      <div className="target-reader-complete"><span>LEITURA CONCLUÍDA</span><h2>{session.athleteName}</h2><p>{session.cbteNumber ? `CBTE ${session.cbteNumber} · ` : ''}{session.eventName} · {new Date(session.eventDateTime).toLocaleString('pt-BR')}</p><strong>{session.shots.length} disparos · {formatDecimal(sessionTotal)} pontos</strong></div>
      <TargetSeriesTable rows={tableRows} total={sessionTotal} shotCount={session.shots.length} />
      <div className="target-reader-actions"><button type="button" className="target-reader-secondary" onClick={() => downloadCsv([session], 'renate-leitura-atleta')}>Exportar CSV desta leitura</button><button type="button" className="target-reader-primary" onClick={() => { setScreen('home'); setSession(null); }}>Voltar aos resultados</button></div>
    </>}
  </section>;
}

function TargetSeriesTable({ rows, total, shotCount }) {
  return <section className="target-reader-table-wrap"><h2>Relatório por série</h2><div className="target-reader-table-scroll"><table className="target-reader-table"><thead><tr><th>Série</th>{Array.from({ length: 10 }, (_, index) => <th key={`t${index}`}>T{index + 1}</th>)}<th>TOTAL da série</th></tr></thead><tbody>{rows.map((row) => <tr key={row.series}><th>Série {row.series}</th>{Array.from({ length: 10 }, (_, index) => { const shot = row.shots.find((item) => item.shotInSeries === index + 1); return <td key={`${row.series}-${index}`} title={shot ? `Alvo ${shot.targetNumber} · ${shot.direction} · ${shot.radialMm} mm` : ''}>{shot ? <><b>{formatDecimal(shotDecimal(shot))}</b><small>{shot.direction}</small></> : '—'}</td>; })}<td className="target-reader-series-total">{row.shots.length ? formatDecimal(row.total) : '—'}</td></tr>)}</tbody><tfoot><tr><th colSpan="11">TOTAL FINAL · {shotCount}/60 disparos</th><td>{shotCount ? formatDecimal(total) : '—'}</td></tr></tfoot></table></div></section>;
}

function directionForImpact(impact, center, pixelsPerMm) {
  const dx = (impact.x - center.x) / pixelsPerMm; const dy = (impact.y - center.y) / pixelsPerMm;
  if (Math.hypot(dx, dy) <= 2.25) return 'C';
  if (dx >= 0 && dy < 0) return 'Q1';
  if (dx < 0 && dy < 0) return 'Q2';
  if (dx < 0 && dy >= 0) return 'Q3';
  return 'Q4';
}
