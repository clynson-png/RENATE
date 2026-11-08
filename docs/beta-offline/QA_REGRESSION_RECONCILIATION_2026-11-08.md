# Reconciliação da regressão runtime — 2026-11-08

Fonte: resultados por caso em [QA_PRESENTATION_REGRESSION_2026-11-08.json](QA_PRESENTATION_REGRESSION_2026-11-08.json). A repetição consultou o worker local para as 1.104 perguntas sem fixar o ID esperado. A regressão continua **FAIL**.

## Seleção e pertinência de Q&A

- Seleção/resolução esperada: **1.081/1.104 PASS; 23 falhas**. Por conjunto: original 951/960 (9 falhas), suplemento 47/50 (3) e entradas posteriores 83/94 (11).
- Existência de resposta Q&A direta ou sugestão pertinente: **1.095/1.104 PASS; 9 falhas**, todas no snapshot original. Oito consultas ISSF receberam sugestões de Q&A de Trap/CBTE; uma consulta CBTE recebeu outra resposta CBTE.
- Portanto, “23 falhas de recuperação” descreve o campo de seleção/resolução esperada; **não** quer dizer que 23 perguntas ficaram sem qualquer Q&A pertinente. O relatório registra 22 casos com exigência de sugestões temáticas e um caso respondido por outra linha CBTE. Há sobreposição entre falha de seleção e falha de pertinência.

## Cards e passagens

- Cards aplicáveis: **1.044/1.061 apresentados; 17 ausentes**. Original: 901/917 (16 ausentes); suplemento: 49/50 (1); entradas posteriores: 94/94 (0).
- O agregado histórico `combined.totals.cardShownWhenApplicable = 1.087` não é a taxa aplicável: inclui 43 perguntas do grupo original nas quais nenhum card era aplicável. Assim, 1.087 = 1.044 cards apresentados em casos aplicáveis + 43 casos sem card aplicável. O denominador correto é 1.061.
- Vínculo das passagens às fontes citadas: **1.080/1.104; 24 falhas** — original 11, suplemento 2, entradas posteriores 11.
- Links locais e hashes das fontes: 1.104/1.104. Disclosure, cabeçalho/localizador e hash do PDF/OCR das passagens: 1.104/1.104. Ordem visual dos blocos: PASS. Chamadas externas: zero.

## Relação com a verificação móvel

A verificação em [`MOBILE_PREVIEW_2026-11-08.json`](MOBILE_PREVIEW_2026-11-08.json) é um gate distinto e passou: confirma entrega HTTPS do build atual, 1.104 Q&A, 138/138 hashes de aprovação de cards, Service Worker e viewport de 390 px sem overflow. Ela não mede pertinência de Q&A, seleção, presença de cards por pergunta ou vínculo de passagens; portanto, não altera o resultado **FAIL** da regressão runtime.

Nenhuma rota, pergunta ou resposta protegida foi alterada para produzir esta reconciliação.
