# RENATE — Relatório de implementação e aceite do Dia 3

**Atualizado:** 2026-11-06  
**Estado:** `PASS` para os 960 casos ATLAS presentes no snapshot; cobertura de cinco rotas sem casos permanece não medida.  
**Escopo:** somente arquivos de RENATE; o ADANA principal não foi alterado.

## Resultado

- Pacote local reproduzível: 960 Q&A ATLAS, 13 respostas de pretestes `PASS`, 21 PDFs, 40 OCRs, 14.674 passagens, 30 cards ativos em 15 rotas e 33 recortes PNG.
- `npm run test:pack`: `PASS`. SHA-256 do pacote atualizado: `60171673782cfec825eeb52c773fb6112792c0b8b11b9a2b47b4b34962cddd67`.
- `npm run test:locators`: `PASS`, 8/8 cenários de parser.
- `npm run build`: `PASS`; Service Worker com 267 entradas / 339.196.564 bytes.
- O menu **Biblioteca de regras** permite filtrar e abrir qualquer PDF do pacote antes de iniciar uma conversa. Toda resposta com fonte local oferece links para abrir os regulamentos completos citados. A consulta não depende de pergunta ao chatbot.
- A ação **Consultar passagens da regra** revela todas as passagens localizadas, identificadas por regulamento, vigência/edição e artigo/localizador. Figuras PNG locais pertinentes ficam acima das passagens.

## Avaliação dos 960 casos

`npm run test:browser` percorreu os 960 casos no Chromium 158 e terminou com código 0.

| Verificação | Resultado |
|---|---:|
| Resposta ATLAS esperada | 960/960 |
| Conjunto de fontes esperado | 960/960 |
| Localizadores esperados visíveis | 960/960 |
| Passagem local com PDF/OCR, hashes, cabeçalho e texto válidos | 960/960 |
| Casos com card diretamente aplicável | 45 |
| Card e foto local apresentados corretamente | 45/45 |
| Resultados que retornaram recorte configurado com hash/proveniência válidos | 812/812 |
| Associações críticas figura-pergunta verificadas explicitamente | 9/9 |
| Cards renderizados individualmente com ordem e imagem local | 30/30 |

Os 812 casos são resultados em que o runtime retornou um recorte configurado; 812/812 mede a validade das imagens retornadas, não prova que toda figura possível esteja cadastrada. Nove associações explícitas cobrem alvos CBTE/ISSF, empunhadura, medidor de roupa e mola de gatilho. O catálogo inclui recortes ISSF de alvos, medidores de roupa/calçado; CBTE CMA e Duelo; WSPS Appendices 4 e 5; além dos recortes anteriores de equipamento e suporte SH2. O inventário completo com páginas está em `FIGURE_APPLICABILITY_AUDIT_2026-11-06.md`.

O inventário tem 62 identidades de rota: 57 têm casos ATLAS e passaram os casos vinculados; cinco não têm caso no snapshot (`cbte.cmp.rimfire_sporter`, `cbte.shotgun.automatic_trap`, `cbte.shotgun.issf`, `cbte.shotgun.trap_nacional`, `issf.event.14`). O teste PASS vale para os 960 casos presentes; não se infere cobertura de perguntas para as cinco rotas sem caso.

## Navegador, offline e privacidade

- Chromium 158 confirmou PIN local, autosave/restauração do histórico, layout responsivo, navegação mobile, pesquisa offline, Biblioteca independente, abertura de PDF completo, cards, figuras, até dois pedidos de esclarecimento com regra em cada turno, fallback local sem abstenção e zero chamadas externas.
- `npm run test:policy`: `PASS`, 2/2. `npm run test:history`: `PASS`, 4/4.
- `npm run test:cards-import`: `PASS`, 84/84 assets íntegros. O catálogo registra aprovação explícita por hash somente para P6 qualificação/final; essa informação de governança não altera os resultados mecânicos de apresentação dos demais cards.
- `npm run test:lead-privacy`: auditoria estática `PASS`; configuração/RLS Supabase não foi executada.
- Whisper Tiny passou inferência offline com amostra PT-BR sintética. Fala humana em Android/iPhone ainda não foi avaliada; TTS PT-BR permanece bloqueado.

## Evidências

- `CONTENT_PRESENTATION_960_2026-11-06.json` — resultado por caso para respostas, fontes, localizadores, passagens, cards e figuras.
- `ROUTE_CARD_COVERAGE_2026-11-06.csv` — matriz das 62 rotas.
- `BROWSER_RUNTIME_ACCEPTANCE_2026-11-06.json` — UI, navegação, offline, cards e acesso local aos PDFs.
- `SEARCH_BROWSER_960_2026-11-06.json` — seleção do banco e resumo da apresentação.
- `data/imports/day1_2026-11-06/figure-crops/manifest.json` — origem/hash/página dos 33 recortes.

## Próximos passos

1. Obter ou registrar casos ATLAS aprovados para as cinco rotas sem caso, se os dados necessários estiverem disponíveis dentro de RENATE.
2. Validar instalação, armazenamento e Whisper Tiny com fala humana em Android e iPhone; manter TTS bloqueado.
3. Depois dos testes locais em aparelhos e atualização do aceite, configurar Supabase/RLS para lead inicial e hospedagem Vercel/HTTPS.
