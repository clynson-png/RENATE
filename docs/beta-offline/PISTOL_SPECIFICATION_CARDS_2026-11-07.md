# Cards de especificações de pistola — 2026-11-07

## Cards criados

- `issf.pistol.specifications.10m`: ISSF 10 m Air Pistol e WSPS P1, P2, P5 e P6.
- `issf.pistol.specifications.25m`: ISSF 25 m (Rimfire, Centre Fire, Standard e Rapid Fire) e WSPS P3.

As duas entradas são cards de equipamento com fatos normativos, fontes, edição, SHA-256 e localizadores. O seletor considera as rotas/eventos no campo `eventIds`; quando a pergunta resolve uma rota ISSF ou WSPS abrangida, o mesmo card de especificações é selecionado. A resposta também mostra o recorte do diagrama de punho junto do card.

## Valores do quadro ISSF 8.12

| Especificação | Pistola de Ar 10 m | Pistolas 25 m Rimfire/Centre Fire |
|---|---:|---:|
| Caixa de medição | 420 × 200 × 50 mm | 300 × 150 × 50 mm |
| Peso máximo da pistola | 1.500 g | 1.400 g |
| Peso mínimo do gatilho | 500 g | 1.000 g |
| Comprimento máximo do cano | Só tamanho da caixa | 153 mm |
| Raio máximo da linha de mira | Só tamanho da caixa | 220 mm |

O peso da pistola considera acessórios, pesos de equilíbrio e carregador vazio. A medição na caixa considera acessórios instalados e admite tolerância de fabricação de 0 a +1 mm por dimensão. O quadro indica que a pistola de ar com carregador pode ser medida sem ele.

O card de 10 m transcreve as restrições de punho da regra 8.4.1.5 e inclui a previsão própria do WSPS P5 Appendix 6: punho não pode envolver a mão, entre outras restrições. O card de 25 m transcreve a regra 8.4.1.6: em particular, limite de 30 mm na parte traseira do punho que repousa sobre a mão, comparado com 40 mm em 10 m. Ambos registram que nenhuma parte do punho/armação/acessórios pode tocar o pulso e explicam os ângulos do apoio.

O ISSF Rule Book §8.1.1 define as regras de pistola como aplicáveis a todos os eventos ISSF de pistola. O WSPS Rulebook §1.1.3 aplica as regras ISSF salvo disposição WSPS conflitante. O WSPS §5.1.4 determina que P3 siga as regras ISSF de pistola 25 m; o P5 também tem o Appendix 6 próprio. O escopo dos cards cobre pistolas 10 m e 25 m; não transfere esses limites a pistola 50 m, que consta no quadro ISSF como “sem restrição” de peso/caixa.

## Recortes locais apresentados com os cards

- Card 10 m, recorte das colunas e linha “10m Air Pistol” do quadro ISSF 8.12, p. 375: [`issf-pistol-10m-spec-table-p375.png`](../../data/imports/renate_generated_cards_2026-11-07/figures/issf-pistol-10m-spec-table-p375.png). SHA-256 `360f70e58bffe6b6b3188d318a6f5dd92e26ee6cf9b1d17d87d994cda5b9d0e4`.
- Card 25 m, recorte das linhas Rimfire/Centre Fire e notas de medição do quadro ISSF 8.12, p. 375: [`issf-pistol-25m-spec-table-p375.png`](../../data/imports/renate_generated_cards_2026-11-07/figures/issf-pistol-25m-spec-table-p375.png). SHA-256 `80217bfb593ada68a0bb5cb600ff77f340fd4eee3973595133ab31b526e1776b`.
- Diagrama oficial comparativo dos punhos 10 m/25 m, regra ISSF 8.4.1.5–8.4.1.6, p. 355, mostrado junto dos cards: [`issf-pistol-grip-dimensions-p355.png`](../../data/imports/renate_generated_cards_2026-11-07/figures/issf-pistol-grip-dimensions-p355.png). SHA-256 `63ce4abdd40cde9742a6c83e9e346e7840198e26c572e610f34932990e26a9f4`.

Os recortes foram feitos de páginas já incluídas na Library RENATE; os documentos originais não foram alterados.

## Fontes locais

- ISSF Rule Book 2026, Edition 2025, Third Print 10/2026, vigente desde 19/10/2026. Fonte `ADANA-SRC-2A79B10E08375DE1`; PDF SHA-256 `2a79b10e08375de1f0c45f62c19f615f1e665d169e5db4dee7a0805399a2d078`; localizadores 8.1.1, 8.4.1.5–8.4.1.6, 8.4.2, 8.4.3.1–8.4.3.5 e 8.12.
- WSPS Rulebook 2026 vFinal, vigente desde 01/01/2026. Fonte `ADANA-SRC-892D95743F291E6F`; PDF SHA-256 `892d95743f291e6f3226461d321dde73e3eec2cbc157b5d818e56b0e46a81f87`; localizadores 1.1.3, 5.1.3–5.1.5.
- WSPS Rulebook Appendices 2026 vFinal. Fonte `ADANA-SRC-3B1650384F55C206`; PDF SHA-256 `3b1650384f55c206cde8617f073ca6c6871433958b8f702ca678b873b04ee369`; Appendix 6, §§1.1 e 3, p. 34.

## Pacote

- `npm run build`: PASS.
- Pacote: 1.010 Q&A, 24 PDFs, 43 OCRs, 15.010 passagens, 91 cards normativos e 34 recortes de figuras/tabelas.
- SHA-256 do pacote: `72bdec681963e95a1d5d0fd9befcc674a6b16e2fc9f0d729724c7b25f46508eb`.
- Build comprova geração do pacote, não aceite visual em browser ou em aparelhos.
