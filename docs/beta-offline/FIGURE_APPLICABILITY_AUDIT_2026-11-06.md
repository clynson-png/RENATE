# RENATE — Auditoria de figuras aplicáveis

**Data:** 2026-11-06  
**Escopo:** 960 casos ATLAS presentes no snapshot; somente PDFs/OCRs locais de RENATE.  
**Fronteira:** nenhum arquivo foi consultado, extraído ou alterado fora de RENATE.

## Resultado

O catálogo passou de 13 para **33 recortes PNG locais**, todos ligados a PDF, edição, página/localizador e hashes no manifesto. Os novos recortes foram extraídos de manuais já presentes em `RENATE/library/`; não é necessário que a usuária busque ou carregue imagens para as figuras abaixo.

O teste Chromium passou com:

- respostas, fontes, localizadores e passagens PDF/OCR: **960/960**;
- casos cobertos que retornaram figura local: **812**, com hash e proveniência válidos em **812/812**;
- verificações explícitas de associação figura-pergunta: **9/9**, sem figura requerida ausente;
- cards e fotos nos casos em que o card é diretamente aplicável: **45/45**;
- zero chamadas externas.

A contagem 812/812 confirma integridade dos recortes retornados; não é uma afirmação de que toda figura concebível ou toda rota sem caso de teste foi mapeada.

## Recortes adicionados nesta auditoria

| Conteúdo | Fonte local e página |
|---|---|
| Três centros do alvo CMA 25 m | Regulamento CBTE CMA 25 m, p. 2 |
| Alvo de Tiro Rápido do Duelo 25 m | Regulamento CBTE Duelo 20 s, p. 2 |
| Alvo de pistola de precisão do Duelo 10 m | Regulamento CBTE Duelo 20 s 10 m, p. 2 |
| Empunhaduras/talas permitidas e vedadas no Duelo | Regulamento CBTE Duelo 20 s, p. 4; Duelo 10 m, p. 6 |
| Alvos ISSF de carabina, pistola, Moving Target e prato | ISSF Rule Book 2026, pp. 195–203 e 206 |
| Medidores de rigidez da roupa e flexibilidade da sola do calçado | ISSF Rule Book 2026, pp. 228–229 |
| Extensões e adaptações de gatilho | WSPS Appendices 2026, Appendix 4, pp. 22–23 |
| Dimensões da parte superior do suporte SH2 e alinhamento do rifle/yoke | WSPS Appendices 2026, Appendix 5, pp. 25 e 28 |

Os recortes já existentes mantêm as figuras de carabina, caixa e punho de pistola, calçado, casaco, calça, acessórios CBTE CMA 10 m, eventos P4/P5 e suporte/molas SH2 (Appendix 5, pp. 24, 26–27; Appendix 6, p. 34).

## Figuras que a usuária precisa buscar e colocar em `RENATE/img/`

**Nenhuma figura adicional foi identificada como necessária para os 960 casos testados e os tópicos listados acima.** As figuras correspondentes estavam nas cópias PDF locais e foram recortadas diretamente delas, preservando a origem e o localizador.

Cinco rotas não têm perguntas no snapshot ATLAS (`cbte.cmp.rimfire_sporter`, `cbte.shotgun.automatic_trap`, `cbte.shotgun.issf`, `cbte.shotgun.trap_nacional`, `issf.event.14`). Sem perguntas e relações de regra para essas rotas, não há base para especificar quais figuras seriam aplicáveis. Isso não gera pedido de imagem agora.

## Consulta do regulamento completo

O item permanente **Biblioteca de regras** abre e filtra os PDFs do pacote sem iniciar uma conversa. Cada resposta com fonte também liga diretamente ao PDF completo local. Essa navegação foi verificada no Chromium sem pergunta prévia e sem requisição de rede. A ação **Consultar passagens da regra** exibe os recortes aplicáveis acima das passagens citadas.

## Artefatos

- Manifesto com PDFs/páginas/hashes: `data/imports/day1_2026-11-06/figure-crops/manifest.json`.
- Recortes: `data/imports/day1_2026-11-06/figure-crops/*.png`.
- Resultado individual dos 960 casos: `docs/beta-offline/CONTENT_PRESENTATION_960_2026-11-06.json`.
- Teste completo do browser: `docs/beta-offline/FIGURE_BROWSER_TEST_2026-11-06.log`.
