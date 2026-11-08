# Importação independente dos cards ADANA

Snapshot registrado em 2026-11-06 por autorização específica do usuário para localizar e clonar os cards existentes em ADANA para `RENATE/`. A pasta contém uma cópia local do catálogo, assets e evidências de governança usados no snapshot. ADANA não é dependência de execução e nenhuma escrita foi feita na origem.

## Conteúdo e estado

- Catálogo original: `adana_competition_cards_v1.snapshot.json`.
- Auditoria de integridade: `IMPORT_AUDIT.json`; confere SHA-256 de cada asset e lista associações, estados de revisão e definições incompletas.
- Assets: `assets/`, copiados para esta pasta e verificados por hash.
- Governança P6: `governance/p6_cards_human_review_20261105.json` e `governance/p6_q5_card_human_adjudication_20261105.json`.
- 31 definições de cards por fase, 3 cards de equipamento e 84 assets distintos no snapshot.
- A evidência humana localizada aprova somente P6 qualificação e final, vinculados aos hashes registrados. Nos outros 29 cards por fase, o catálogo não registra estado de revisão. Esses cards são preservados como importados/candidatos, sem promoção ao chat.
- Uma definição `wsps.event.r6:both` não possui asset individual.

## Empacotamento RENATE

`npm run test:cards-import` valida os assets importados. `npm run pack:local` copia os assets verificados para `public/renate-pack/cards/adana-assets/` e gera `imported-cards-catalog.json` com paths exclusivamente locais de RENATE. Os cards ativos elegíveis em `cards.json` usam uma apresentação compartilhada inspirada no P6; as fases P6 são renderizadas dos slots estruturados aprovados, sem exibir a arte SVG original que contém um rótulo de rascunho obsoleto.

Os cards são suplementos visuais. Eles não são evidência normativa nem substituem as passagens locais. A existência de um asset ou de conteúdo estruturado não implica aprovação humana.
