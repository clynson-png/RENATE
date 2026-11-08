import { useEffect, useMemo, useState } from "react";
import "./RulesReader.css";

const RULES_API = "http://127.0.0.1:8795";

async function rulesRequest(path, options = {}) {
  const response = await fetch(`${RULES_API}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || `Leitor REGRAS respondeu HTTP ${response.status}.`);
  return payload;
}

function formatSourcePath(path) {
  return String(path || "").replaceAll("/", " · ");
}

export default function RulesReader({ onBack }) {
  const [authorities, setAuthorities] = useState([]);
  const [authority, setAuthority] = useState("");
  const [documents, setDocuments] = useState([]);
  const [sourceId, setSourceId] = useState("");
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState("");
  const [modal, setModal] = useState(null);

  const selectedDocument = useMemo(() => documents.find((item) => item.source_id === sourceId) || null, [documents, sourceId]);
  const pdfUrl = selectedDocument ? `${RULES_API}/api/pdf?source_id=${encodeURIComponent(selectedDocument.source_id)}` : "";

  useEffect(() => {
    let current = true;
    rulesRequest("/health")
      .then(() => rulesRequest("/api/authorities"))
      .then((payload) => {
        if (!current) return;
        setAuthorities(payload.authorities || []);
        setChecking(false);
      })
      .catch((failure) => {
        if (!current) return;
        setChecking(false);
        setError(failure.message);
      });
    return () => { current = false; };
  }, []);

  useEffect(() => {
    let current = true;
    setDocuments([]);
    setSourceId("");
    setHits([]);
    if (!authority) return () => { current = false; };
    rulesRequest(`/api/documents?authority=${encodeURIComponent(authority)}`)
      .then((payload) => {
        if (!current) return;
        setDocuments(payload.documents || []);
        setError("");
      })
      .catch((failure) => { if (current) setError(failure.message); });
    return () => { current = false; };
  }, [authority]);

  async function search(event) {
    event.preventDefault();
    if (!authority || query.trim().length < 2) return;
    setLoading(true);
    setError("");
    setHits([]);
    try {
      const payload = await rulesRequest("/api/search", {
        method: "POST",
        body: JSON.stringify({ authority, source_id: sourceId || null, query: query.trim(), limit: 15 }),
      });
      setHits(payload.hits || []);
    } catch (failure) {
      setError(failure.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="rules-reader-screen">
      <header className="rules-reader-topbar">
        <button className="rules-back-button" type="button" onClick={onBack}>← <span>Voltar à ADANA</span></button>
        <div className="rules-brand"><span className="rules-brand-mark">A</span><strong>ADANA</strong><span>REGRAS</span></div>
        <div className="rules-reader-status"><i />{checking ? "Conectando ao Meilisearch" : error && !authorities.length ? "Leitor indisponível" : "Busca Meilisearch"}</div>
      </header>

      <section className="rules-reader-heading">
        <div className="rules-eyebrow">LEITOR DE REGULAMENTOS · CONSULTA LOCAL</div>
        <h1>Regras <span>do esporte</span></h1>
        <p>Escolha a autoridade, abra o regulamento e pesquise o assunto. Os resultados vêm do Meilisearch e mantêm documento, edição, regra/seção, página e trecho localizável.</p>
      </section>

      <section className="rules-reader-controls" aria-label="Selecionar regulamento e pesquisar">
        <label className="rules-field"><span>1 · AUTORIDADE</span>
          <select value={authority} onChange={(event) => { setAuthority(event.target.value); setError(""); }}>
            <option value="">Selecione a autoridade</option>
            {authorities.map((item) => <option value={item.id} key={item.id}>{item.label} · {item.document_count} documentos</option>)}
          </select>
        </label>
        <label className="rules-field rules-document-field"><span>2 · REGULAMENTO</span>
          <select value={sourceId} onChange={(event) => { setSourceId(event.target.value); setHits([]); }} disabled={!authority || !documents.length}>
            <option value="">Todos os documentos desta autoridade</option>
            {documents.map((item) => <option key={`${item.source_id}:${item.source_sha256}`} value={item.source_id}>{item.title}{item.edition ? ` · ${item.edition}` : ""}</option>)}
          </select>
        </label>
        <form className="rules-search-form" onSubmit={search}>
          <label className="rules-field"><span>3 · ASSUNTO OU NÚMERO DA REGRA</span>
            <div className="rules-search-input-wrap"><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={authority ? "Ex.: posição prone, regra 6.11.9, bandoleira…" : "Escolha primeiro a autoridade"} disabled={!authority} /><button type="submit" disabled={!authority || query.trim().length < 2 || loading}>{loading ? "Buscando…" : "Pesquisar"}</button></div>
          </label>
        </form>
      </section>

      {error && <div className="rules-reader-error" role="alert">{error}{!authorities.length && <small>Confirme se o serviço de leitura REGRAS e o Meilisearch estão ativos.</small>}</div>}

      <div className="rules-reader-layout">
        <aside className="rules-doc-panel">
          <div className="rules-panel-kicker">REGULAMENTO SELECIONADO</div>
          {!authority ? <p className="rules-empty-state">Selecione ISSF, WSPS, CBTE ou WRABF para listar os documentos indexados.</p> : !selectedDocument ? <p className="rules-empty-state">Escolha um regulamento para ver os dados da fonte e abrir o PDF completo.</p> : (
            <>
              <h2>{selectedDocument.title}</h2>
              {selectedDocument.edition && <p className="rules-edition">{selectedDocument.edition}</p>}
              <dl className="rules-source-meta">
                <div><dt>Autoridade</dt><dd>{selectedDocument.authorities.join(" · ")}</dd></div>
                {selectedDocument.publisher && <div><dt>Publicador</dt><dd>{selectedDocument.publisher}</dd></div>}
                <div><dt>Passagens indexadas</dt><dd>{selectedDocument.indexed_passage_count}</dd></div>
                <div><dt>Arquivo</dt><dd>{formatSourcePath(selectedDocument.relative_path)}</dd></div>
                <div><dt>SHA-256 do PDF</dt><dd className="rules-hash">{selectedDocument.source_sha256}</dd></div>
              </dl>
              <button className="rules-open-pdf" type="button" onClick={() => setModal({ url: pdfUrl, title: selectedDocument.title, page: null })}>Abrir regulamento completo <span>↗</span></button>
              <p className="rules-source-note">O arquivo só abre se o hash atual corresponder ao catálogo da Library.</p>
            </>
          )}
        </aside>

        <section className="rules-results-panel" aria-live="polite">
          <div className="rules-results-heading"><div><div className="rules-panel-kicker">LOCALIZADORES DO MEILISEARCH</div><h2>{loading ? "Buscando no índice…" : hits.length ? `${hits.length} páginas ou trechos encontrados` : "Resultados da pesquisa"}</h2></div><span className="rules-search-badge">MEILISEARCH · SOMENTE</span></div>
          {!hits.length && !loading ? <div className="rules-no-results">{query && !error ? "Nenhuma passagem localizada. Tente outro termo ou retire o filtro de regulamento." : "Os resultados mostrarão número de regra/seção, edição, página e trecho encontrado."}</div> : (
            <div className="rules-hit-list">{hits.map((hit, index) => {
              const doc = hit.source;
              const page = hit.physical_page;
              const hitPdf = `${RULES_API}/api/pdf?source_id=${encodeURIComponent(doc.source_id)}${page ? `#page=${page}` : ""}`;
              return <article className="rules-hit" key={`${doc.source_id}-${page}-${index}`}>
                <div className="rules-hit-meta"><span>{doc.title}</span>{doc.edition && <span>{doc.edition}</span>}</div>
                <div className="rules-hit-title"><strong>{hit.rule_references?.length ? `Regra/seção ${hit.rule_references.join(", ")}` : hit.chapter || "Trecho do regulamento"}</strong><span>{hit.locator}{hit.printed_page ? ` · página impressa ${hit.printed_page}` : ""}</span></div>
                {hit.passages.map((passage) => <section className={`rules-excerpt ${passage.is_translation ? "rules-excerpt-pt" : ""}`} key={passage.indexed_document_id}>
                  <h3>{passage.language_label}{passage.language && passage.language !== "UNKNOWN" ? ` · ${passage.language}` : ""}</h3>
                  <p>{passage.excerpt}</p>
                </section>)}
                <div className="rules-hit-actions"><button type="button" onClick={() => setModal({ url: hitPdf, title: doc.title, page })}>Abrir página no PDF</button><button type="button" className="rules-link-button" onClick={() => { setSourceId(doc.source_id); setModal({ url: `${RULES_API}/api/pdf?source_id=${encodeURIComponent(doc.source_id)}`, title: doc.title, page: null }); }}>Ler o PDF completo</button></div>
                <div className="rules-hit-provenance">Fonte local · {doc.relative_path} · SHA-256 {doc.source_sha256}</div>
              </article>;
            })}</div>
          )}
        </section>
      </div>

      {modal && <div className="rules-pdf-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setModal(null); }}>
        <section className="rules-pdf-modal" role="dialog" aria-modal="true" aria-label={`Leitor PDF ${modal.title}`}>
          <header><div><strong>{modal.title}</strong><span>{modal.page ? `PDF · página ${modal.page}` : "Regulamento completo"}</span></div><div className="rules-pdf-modal-actions"><a href={modal.url} target="_blank" rel="noreferrer">Abrir em nova aba ↗</a><button type="button" onClick={() => setModal(null)} aria-label="Fechar leitor PDF">×</button></div></header>
          <iframe title={`PDF ${modal.title}`} src={modal.url} />
        </section>
      </div>}
    </main>
  );
}
