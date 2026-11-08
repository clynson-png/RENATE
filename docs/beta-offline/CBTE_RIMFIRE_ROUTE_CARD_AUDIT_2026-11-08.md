# Auditoria de apresentação dos cartões CBTE — 2026-11-08

## Escopo

Auditoria das rotas CBTE que possuem cards no pacote local RENATE, com correção concentrada em `cbte.cmp.rimfire_sporter` e `cbte.fclass.rimfire`. As rotas próprias `issf.event.*` e `wsps.event.*`, além das rotas delegadas `cbte.issf.*` e `cbte.wsps.program`, ficaram bloqueadas e não foram modificadas. Nenhum fato, texto ou fonte dos cards foi alterado.

## Achados antes do ajuste

- `CBTE Carabina CMP Fogo Circular Sporter` resolvia a rota `cbte.cmp.rimfire_sporter`, mas mostrava apenas o card geral e omitira os cards Class O, Class T e Carabina Tática Rimfire.
- Consultas explícitas por classe ou divisão não mostravam de forma consistente o card geral acompanhado do detalhe nomeado.
- `CBTE F-Class Rimfire` sem a palavra “Carabina” não resolvia a rota `cbte.fclass.rimfire` nem apresentava o card.
- Os cards locais existiam no pacote; a falha estava na resolução de aliases e na seleção de cards do Web Worker.

## Ajustes

- Registrados aliases de rota para `CMP Rimfire Sporter`, `Carabina CMP Sporter`, `Carabina CMP Fogo Circular Sporter`, `F-Class Rimfire` e variantes relacionadas.
- Para uma rota CBTE única, o cartão geral e os cards associados à rota são preservados. Quando a consulta nomeia Class O, Class T ou Carabina Tática, o card geral acompanha o detalhe explicitamente solicitado; para o nome geral da prova, aparecem os cards dessa rota.
- O ramo CBTE exclui as rotas delegadas `cbte.issf.carabina`, `cbte.issf.pistola` e `cbte.wsps.program`. A seleção ISSF e WSPS permanece intacta.

## Verificação focada

- Auditoria das 20 rotas CBTE com card de qualificação: **20/20** resolveram a rota esperada e apresentaram pelo menos um card com `eventId` correspondente.
- CMP Rimfire Sporter geral: os quatro cards locais foram apresentados: card geral, Class O / Mira Aberta, Class T / Mira Fechada e Carabina Tática Rimfire.
- Consultas `CBTE CMP Class O`, `CBTE CMP Class T` e `CBTE CMP Carabina Tática Rimfire`: cada uma apresentou o card geral mais o detalhe solicitado.
- `CBTE Carabina F-Class Rimfire` e `CBTE F-Class Rimfire`: ambas resolveram `cbte.fclass.rimfire` e apresentaram `cbte.fclass.rimfire:qualification`.
- Controles de consulta ISSF e WSPS foram observados sem edição de seus aliases, cards ou rotas. O controle WSPS P5 continua retornando o card compartilhado `issf.pistol.specifications.10m`, igual à observação anterior à mudança; isso permanece fora deste escopo/bloqueio e requer auditoria autorizada separadamente. Nenhuma regressão ampla da aplicação foi executada.
- `npm run build`: PASS; 1.104 Q&A, 27 PDFs, 46 OCRs, 15.174 passagens e 134 cards padronizados. SHA-256 do pacote: `2d23430009ebd1d011d408f1ba18fa1d966c515bd1614160d7b659a8e4b7f235`; Service Worker: cache `0fef8f612f999e44`.
- A prévia HTTPS em `https://127.0.0.1:4173/` respondeu HTTP 200. O Web Worker servido em 4173 passou novamente a matriz CBTE **20/20** e os casos de CMP/F-Class. Isso confirma o bundle local; não substitui validação visual no Android.

## Limites

Esta auditoria confirma seleção de cards no Web Worker local. O build e a seleção de cards não substituem revisão visual em navegador/celular nem aprovação humana do conteúdo. WRABF, embora representado no catálogo CBTE, não foi alterado nesta correção focal de CMP/F-Class Rimfire.
