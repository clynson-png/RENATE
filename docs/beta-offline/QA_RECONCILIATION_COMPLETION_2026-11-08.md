# Reconciliação da regressão Q&A — 2026-11-08

## Resultado

As falhas apontadas foram reconciliadas no runtime local. A regressão executou as 1.104 perguntas sem fixar IDs de seleção e terminou **PASS**:

- Snapshot original: 960/960.
- Complemento de 50: 50/50.
- Complemento de desempate: 94/94.
- Q&A pertinente/resolução, cards aplicáveis, vínculos das passagens, hashes de PDF/OCR e ordem compacta da interface: 1.104/1.104.
- Chamadas a serviços externos: zero.

O relatório completo por caso está em [`QA_RECONCILIATION_RUNTIME_2026-11-08.json`](QA_RECONCILIATION_RUNTIME_2026-11-08.json). A inspeção focada dos 46 casos históricos está em [`QA_RECONCILIATION_INSPECTION_2026-11-08.json`](QA_RECONCILIATION_INSPECTION_2026-11-08.json). O relatório histórico `QA_PRESENTATION_REGRESSION_2026-11-08.json` foi preservado.

## Correções feitas

- **23 seleções/resoluções:** Q&A exatos agora prevalecem sobre metadados herdados de rota incompletos, respeitando a autoridade ISSF explicitamente solicitada. Onze perguntas de desempate em português ganharam aliases de busca para os Q&A ISSF específicos por evento já existentes. A pergunta de Fogo Central foi vinculada ao Q&A ISSF existente de desempate em final. A duplicata CBTE de duração é reconhecida como a mesma pergunta/resposta nos IDs `CBTE-ARB-012:A03` e `CBTE-ARB-083:A03`.
- **24 vínculos de passagens:** a busca de desempate deixou de ampliar documentos quando o Q&A já cita fontes; passagens diretas ficam limitadas aos documentos citados. Evidência recuperada apenas por rota, sem vínculo direto de fonte, aparece como relacionada/mais próxima. O teste completo verificou 1.104/1.104 vínculos.
- **Nove perguntas sem Q&A pertinente:** receberam respostas e localizadores atuais abaixo. IDs, perguntas e ordenação dos registros foram mantidos; as duas entradas duplicadas da pergunta CBTE receberam o mesmo texto e fonte.

## Respostas e regras citadas

Fonte ISSF: *Edition 2025, Third Print 10/2026*, vigente desde 19/10/2026, PDF local `ADANA-SRC-2A79B10E08375DE1`, SHA-256 `2a79b10e08375de1f0c45f62c19f615f1e665d169e5db4dee7a0805399a2d078`.

1. **CBTE — duração da Carabina Mira Aberta 50 m:** 20 disparos em 25 minutos. Regulamento CBTE, edição 02/01/2025, itens II.f.2–II.f.3, p. 3. PDF local `ADANA-SRC-FC0B85254F843237`, SHA-256 `fc0b85254f84323757a44e11fec87299fbdd7f7603fe0bacf76f7e31927011d1`.
2. **Vagas de final no Skeet:** empates entre 1º e 8º na qualificação são resolvidos por shoot-off; a partir do 9º, aplica-se o countback — ISSF 9.14.1.1.
3. **Cartuchos em alvo simples no Skeet:** depende da estação. Na estação 8, um cartucho; na estação 4, quando se atiram dois alvos simples, dois cartuchos são carregados antes do primeiro — ISSF 9.9.2.4(a–b).
4. **Casas do Skeet:** duas, alta e baixa; o campo tem oito estações — ISSF 6.4.19.1.
5. **Percurso do Skeet:** estações 1–7 no arco e estação 8 junto ao centro da corda; na estação 8 atira-se primeiro no alvo alto e depois no baixo — ISSF 6.4.19.1 e 9.9.2.3.
6. **Pontuação do alvo:** HIT quando o alvo regular é atingido e ao menos um fragmento visível se desprende; sem fragmento visível, inclusive apenas poeira, é LOST. A decisão final é do árbitro — ISSF 9.7.4–9.7.5.
7. **Final individual de Skeet:** oito finalistas — ISSF 9.17.4.2.
8. **Pontuação da qualificação na final Trap/Skeet:** a regra usa a classificação da qualificação para atribuir o Finals Start Number; descreve uma sequência própria de alvos e eliminações na final e não prevê somar a pontuação da qualificação — ISSF 9.17.4.2.
9. **Shoot-off por vaga e empate dentro da final:** vagas 1–8 são decididas por shoot-off na qualificação — ISSF 9.14.1.1. Na final de Skeet, empate do 3º ao 8º lugar é resolvido pelo Start Number; empate pelo ouro/prata leva a shoot-off imediato — ISSF 9.17.4.3.

## Limites

O alias de Fogo Central encaminha para a resposta ISSF existente sobre desempate em finais; não foi criada nova resposta nem alterada rota. A frase sobre não transportar pontuação da qualificação está formulada como leitura do formato definido em 9.17.4.2: a regra fixa o Start Number pela classificação e estabelece uma sequência de final própria.

Build local `npm run build`: PASS, 1.104 Q&A, 27 PDFs, 46 OCRs, 15.174 passagens e 142 cards. A regressão concluiu em runtime local Chromium; não substitui revisão humana visual nem teste em smartphone físico.
