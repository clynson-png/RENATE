# Cards de falhas em provas ISSF de pistola — 2026-11-08

## Escopo

Foram criados quatro cards explicativos, cada qual vinculado somente ao seu `route_id`. O Web Worker os seleciona quando a pergunta contém `falha` ou `falhas` e identifica a prova correspondente. A seleção não altera o resolvedor, os aliases canônicos, os IDs de rota nem o conteúdo das demais rotas.

| Prova | `route_id` | Regras particulares no card |
|---|---|---|
| Pistola Standard | `issf.event.11` | Até duas reclamações em partida de 60 tiros, ou uma por etapa quando excepcionalmente dividida em duas; repetição e formulário STDP; soma dos cinco menores valores, incluindo zeros acrescentados. |
| Pistola de Tiro Rápido 25 m | `issf.event.09` | Uma reclamação por etapa de 30 tiros; repetição e formulário RFPM; soma do menor valor de cada um dos cinco alvos. |
| Pistola 25 m | `issf.event.08` | Uma reclamação por etapa de 30 tiros; completar tiros faltantes na série seguinte; precisão: `48 s × tiros faltantes`, com exemplo `2 × 48 = 96 s`; etapa rápida inicia na primeira exposição do alvo. |
| Fogo Central | `issf.event.10` | Uma reclamação por etapa de 30 tiros; o mesmo procedimento de complementação de Pistola 25 m, incluindo a distinção de tempo entre precisão e etapa rápida. |

## Exemplos explícitos de pontuação (ISSF 8.9.4.5(d))

- **Pistola Standard — cinco menores valores globais:** série original: X e 8; falha admissível no terceiro tiro. Na repetição: X, X, X, 9 e 9. X conta 10. Entre os valores `10, 8, 10, 10, 10, 9, 9`, contam os cinco menores: `8 + 9 + 9 + X(10) + X(10) = 46 pontos`.
- **Tiro Rápido — menor valor alvo a alvo:** série original: alvo 1 = X(10), alvo 2 = 8; falha admissível no terceiro tiro. Na repetição: alvos 1–5 = 9, 9, X(10), 8, 9. Seleciona-se o menor valor em cada alvo: `9 + 8 + 10 + 8 + 9 = 44 pontos`. Esta conta é por alvo; não se escolhem globalmente os cinco menores valores como na Standard.

## Conteúdo comum

Os cards resumem as classes de falha admissível (AM) e não admissível (NAM), a comunicação ao Árbitro de Linha, o limite de reclamações, a decisão após inspeção, os efeitos de NAM sobre tiros não disparados e as regras próprias de pontuação de cada prova. Falhas em séries de ensaio não podem ser reclamadas. As finais são apontadas para ISSF 6.17.4.o/6.17.5.k; o card não aplica automaticamente a elas o procedimento de qualificação.

## Tempo de complementação — Pistola 25 m e Fogo Central

Na etapa de precisão, ISSF 8.7.6.4 determina 240 segundos para uma série normal de cinco tiros. ISSF 8.9.4.6(b) determina 48 segundos para cada tiro de complementação, regra também indicada para séries interrompidas em ISSF 8.8.1(d). Assim:

`tempo disponível = (240 s ÷ 5 tiros) × quantidade de tiros faltantes = 48 s × tiros faltantes`

Exemplo: três tiros foram disparados antes de uma falha admissível; faltam dois. A complementação é de `48 × 2 = 96 segundos`. Na etapa rápida, não se aplica essa conta: a série de complementação deve começar na primeira exposição do alvo (ISSF 8.9.4.6(b)). Tiros não disparados ou que não acertem o alvo valem zero e a série de cinco tiros é pontuada normalmente (8.9.4.6(c–d)).

## Fonte

- ISSF Rule Book 2026, Edition 2025, Third Print 10/2026, vigente desde 19/10/2026.
- Documento local: `ADANA-SRC-2A79B10E08375DE1`.
- PDF SHA-256: `2a79b10e08375de1f0c45f62c19f615f1e665d169e5db4dee7a0805399a2d078`.
- Localizadores: ISSF 8.7.6.4, pp. 364–365; 8.8.1(d), p. 366; 8.9.1, p. 369; 8.9.3–8.9.4.6, pp. 369–372; 6.17.4.o; 6.17.5.k.

## Validação e limites

- As regras e os exemplos foram conferidos contra o OCR local da terceira impressão ISSF e preservam o resumo sem copiar longos trechos.
- `npm run build`: PASS; 1.104 Q&A, 27 PDFs, 46 OCRs, 15.174 passagens, 138 cards (99 normativos, 9 de equipamento), 34 recortes. SHA-256 do pacote `6be1e25c451cd02251d304c9da77c70424040827213e28a18cc02e1e8c8464f2`; `cards.json` SHA-256 `06ffa0e813ffb5529c83af30910543ce1d6201478c8e758c7ae4a4d2544d5ee8`.
- Verificação focada no Web Worker servido em `https://localhost:4173`: **8/8 casos passaram**. Os quatro nomes de prova com `falha(s)` retornaram o card com o `eventId` esperado e referência PDF/hash/localizador. Controles confirmaram que sem `falha`, sem prova, e com WSPS P5 nenhum card de falhas ISSF é retornado. A pergunta combinada com dimensões apresentou o card de equipamento antes do card de falhas.
- Para Pistola 25 m e Fogo Central, o card contém o cálculo `240 ÷ 5 = 48 segundos por tiro faltante` e o exemplo `2 × 48 = 96 segundos`; o texto distingue esse cálculo da etapa rápida. As consultas nominais “Pistola 25 metros” e “Fogo Central” chamam os cards ligados respectivamente a `issf.event.08` e `.10`; a alteração não modifica o resolvedor canônico do roteador.
- Pistola Standard: exemplo explícito `X, 8; falha; repetição X, X, X, 9, 9` → cinco menores `8, 9, 9, X, X` = 46 pontos. Tiro Rápido: exemplo explícito por alvo `min(10,9), min(8,9), 10, 8, 9` = 44 pontos. Ambos citam ISSF 8.9.4.5(d); a notação X(10) é explicitada.
- Os cards citam locadores específicos: 8.7.6.4, pp. 364–365; 8.8.1(d), p. 366; 8.9.1, p. 369; 8.9.3–8.9.4.6, pp. 369–372; e 6.17.4.o/6.17.5.k para finais. Ambos estão vinculados ao PDF ISSF local com SHA-256 `2a79b10e08375de1f0c45f62c19f615f1e665d169e5db4dee7a0805399a2d078`.
- `https://localhost:4173/renate-pack/cards.json` respondeu HTTP 200 após o build.
- A compilação e a seleção mecânica não substituem revisão humana do conteúdo nem validação visual em Android/iPhone. Não foi executada regressão global do ADANA nem alterado qualquer arquivo/rota da aplicação principal.
