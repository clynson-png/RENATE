# Ajustes solicitados na revisão humana dos cards — 2026-11-07

Arquivo recebido: `tests/renate-card-human-review.json`  
Catálogo avaliado: `public/renate-pack/cards.json`  
Escopo: somente o pacote local de RENATE.

## Correções aplicadas

- `issf.event.10:qualification`: removida a arte de carabinas; a fotografia local da pistola 25 m passa a ser a imagem principal.
- `issf.event.15` a `issf.event.18` (qualificação e finais disponíveis): removida a arte de Trap/Skeet; cada prova usa sua fotografia local de alvo móvel.
- `wsps.event.r1` e `wsps.event.r2` (qualificação e final): incluída ilustração fotorrealista local da posição SH1 em pé, identificada como ilustração não oficial. Imagens de atletas sentados em cadeira foram excluídas por não corresponderem às provas R1/R2.
- `wsps.event.r5:final`: o card recebeu seções no padrão R4, com regras WSPS 4.1.9.1–4.1.9.4 verificadas no OCR local. A sequência e os comandos específicos da final continuam identificados como dependentes do documento WSPS Finals Commands, ausente da Library.
- `SHOTGUN_TRAP_SKEET_DIMENSIONS_V1`: adicionadas fotografias locais de Trap/Skeet e uma imagem fotorrealista de prato gerada por IA. O diagrama com os pontos de medição permanece como referência técnica.
- `cbte.wrabf.rifle_international:qualification`: adicionada a fotografia `img/wrabf_issf.png` como ilustração local de competidores e mantida a imagem do alvo oficial WRABF 50 m em separado. A foto original foi preservada; SHA-256 `cef1ad2d2125d2708abf08ddbbadb982a0dabeaf9264d094da86808812141a50`. A foto não é evidência normativa; regras e fatos permanecem apoiados pelas fontes locais.
- `public/cards-review.html`: decisões antigas vinculadas a hashes diferentes agora aparecem como pendentes, não contam como aprovação e não são incluídas no próximo export.

## Ainda pendente

- `wsps.event.r5:qualification` e `cbte.cmp.rimfire_sporter:qualification`: foram marcados `CHANGES`, mas o campo de observação está vazio; nenhum defeito específico foi inferido.

A fotografia WRABF agora está presente. Não foi registrada licença independente para o arquivo fornecido pela usuária; conservar a proveniência local e não redistribuir fora do pacote autorizado.

Os cards alterados precisam de nova revisão humana pelo ID/hash, incluindo a qualificação WRABF, cuja imagem foi adicionada após o export anterior. As decisões `APPROVE` do export permanecem preservadas apenas para conteúdo cujo hash não mudou.
