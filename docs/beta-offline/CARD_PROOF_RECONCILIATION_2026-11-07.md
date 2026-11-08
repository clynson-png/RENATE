# Reconciliação de cards por prova — 2026-11-07

## Resultado

Os cards agregados encontrados em `dist/renate-pack/cards/other` foram reconciliados com o catálogo offline do RENATE. Os arquivos visuais de origem foram preservados e reaproveitados; cada card individual recebeu identidade de prova, fatos específicos e referência à regra local com edição, hash do PDF e localizador.

- **Light:** 8 provas (Revólver 5 m; Pistola 5 m; Rifle de Precisão 15 m Bolt/Lever; Rifle Rápido 10 m Semi-Auto; Fuzil Tático 25 m; Fuzil de Precisão 50 m; Espingarda 10 m; Espingarda 10 m Semi-Auto).
- **WRABF:** 7 divisões (Rimfire International Sporter, Rimfire Light, Rimfire Heavy, Air Light, Air Heavy, Air Unlimited e Air Springer). A Air Springer está identificada como divisão praticada no Brasil, fora do regulamento internacional WRABF.
- **CMP:** 3 classes (Mira Aberta/Class O, Mira Fechada/Class T e Tática Rimfire).
- Foram corrigidas também a resolução das cards WSPS P1, P2, P3, R3 e R11. A rota resolvida agora determina o card; R11 não cai mais no P6 por conter “mixed team”.

## Verificação

- `npm run build`: PASS.
- Pacote: 1.010 Q&A, 15.010 passagens e 89 cards de evidência normativa; SHA-256 `028bd3ebc090f6cee4fb99a8891806ef059fd62a34fc9b5d0b8d820b3af5856f`.
- Reexecução local, sem rede, das 82 perguntas da matriz: **82/82** chamaram card da prova esperada, sem card de outra prova.
- Resultado linha a linha: [`MODALITY_PROOF_QUESTION_TEST_AFTER_RECONCILIATION_2026-11-07.csv`](MODALITY_PROOF_QUESTION_TEST_AFTER_RECONCILIATION_2026-11-07.csv).

## Fontes locais usadas

- Provas Nacionais Light CBTE, §§III.1.1–III.3.2, pp. 4–6.
- Regulamento Específico CBTE WRABF, V2/2024, §B.6.2, pp. 5–7.
- Regulamento CBTE Carabina CMP Sporter, atualizado em 09/01/2025, §§1.2, 2.1 e 4.1–4.2.

Não foi iniciada instância de rede, autenticação ou serviço externo.
