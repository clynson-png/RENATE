# Auditoria de apresentação dos cartões ISSF — 2026-11-08

## Escopo

Somente apresentação dos cartões das rotas `issf.event.01` a `issf.event.19` no runtime local do RENATE. WSPS, CBTE e WRABF não foram alvo de alteração; nenhum cartão ou dado dessas famílias foi editado.

## Achados antes do ajuste

- `RFP` e `RFPM` não resolviam um cartão ISSF específico.
- `Pistola de tiro rápido 25m` e `Tiro rápido 25m` podiam selecionar somente o cartão compartilhado `issf.pistol.specifications.25m`, cujo `eventId` é `issf.event.08`, omitindo os cartões da rota `issf.event.09`.
- `Pistola Standard ISSF` e `Standard Pistol ISSF` podiam herdar a resposta/rota WSPS P5 sem apresentar o cartão `issf.event.11:qualification`.
- Nomes ambíguos como `50m Pistol` e `Trap` podiam cair em outra autoridade ou não apresentar cartão ISSF.
- A apresentação suprimia o cartão específico da fase quando um cartão de especificação compartilhado aparecia entre os candidatos.

## Ajustes

- Acrescentados aliases ISSF para RFP/RFPM, Tiro Rápido 25 m, Standard Pistol ISSF, 50m Pistol ISSF e Trap ISSF.
- Aliases explícitos e inequívocos priorizam a rota ISSF correspondente. Para nomes que colidem entre autoridades, a apresentação do cartão usa autoridade ISSF explícita ou o contexto de uma resposta já identificada como ISSF; uma Q&A de outra rota não toma o lugar do cartão ISSF.
- Com uma única rota ISSF resolvida, o cartão de fase cujo `eventId` coincide com essa rota é preservado e priorizado. Cartões compartilhados de equipamento continuam elegíveis quando a pergunta realmente pede um detalhe de equipamento.

## Verificação focada

- Matriz das 19 rotas: **19/19** apresentaram pelo menos um cartão cujo `eventId` corresponde à rota consultada. Para nomes ambíguos, o ensaio usou autoridade explícita (`ISSF <nome>`).
- Aliases `RFP`, `RFPM`, `RFP-RFPM-Tiro rápido 25m`, `Pistola de tiro rápido 25m` e `Tiro rápido 25 m ISSF`: cartões específicos `issf.event.09:qualification` e `issf.event.09:final`.
- `Pistola Standard ISSF` e `Standard Pistol ISSF`: cartão específico `issf.event.11:qualification`. Para `Standard Pistol ISSF`, o preteste local diferencia expressamente a ISSF Standard Pistol 25 m da WSPS P5 10 m Air Pistol Standard.
- `ISSF 50m Pistol`: `issf.event.12:qualification`; `ISSF Trap`: cartões de qualificação e final de `issf.event.13`.
- Amostras de controle WSPS P5, consulta CBTE `Tiro rápido` e WRABF 50 m mantiveram os cartões anteriores. Nenhum conteúdo dessas autoridades foi atualizado.
- Verificação executada no Web Worker local com o pacote RENATE. `npm run build`: PASS; pacote local manteve 1.104 Q&A, 15.174 passagens e 134 cartões. Service Worker regenerado com cache `70d55106a374c29f`. Não foi executada a suíte ampla do app.

## Limite para nomes compartilhados

Quando o texto isolado da prova é ambíguo entre autoridades, a seleção do cartão ISSF exige o sinal de autoridade `ISSF` ou uma resposta que já esteja identificada como ISSF. Isso evita reinterpretar consultas WSPS/CBTE que compartilhem o mesmo nome.
