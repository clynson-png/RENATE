# Reteste de falhas, equipamentos e acessibilidade por áudio — 2026-11-08

## Resultado

- Falhas ISSF: os quatro cards específicos aparecem para Standard, Tiro Rápido, Pistola 25 m e Fogo Central.
- Equipamentos: os cards CBTE WRABF, Duelo, Trap Nacional e o suplemento dimensional Trap/Skeet aparecem. Em consulta nominada, os cards de equipamento vêm antes dos cards de fase/prova.
- Acessibilidade: o ícone liga/desliga a leitura. A ativação lê somente os cards da resposta mais recente; novas respostas também leem somente seus cards enquanto o modo estiver ligado. Mouse parado por 3 segundos e foco por teclado leem somente o trecho alvo.
- Voz PT-BR local do dispositivo: a interface exige que o navegador marque a voz como local (`localService`) e use `pt-BR`; sem isso, não ativa áudio e mantém o texto.
- TTS offline de produção: continua sem aprovação. A verificação do browser usa voz simulada; não substitui reprodução ou teste em modo avião no Android/iPhone.

## Casos do Web Worker

Worker de produção carregado no Chromium a partir de `https://127.0.0.1:4173/`. Catálogo inicializado com 1.104 Q&A, 13 pretestes, 27 documentos, 15.174 passagens e 129 cards de runtime.

| Pergunta | Cards relevantes observados | Resultado |
|---|---|---|
| `falha admissível pistola standard ISSF` | `issf.event.11:malfunctions` primeiro; card de qualificação também exibido | PASS |
| `falha não admissível pistola de tiro rápido 25 m ISSF` | `issf.event.09:malfunctions` primeiro; cards de qualificação/final também exibidos | PASS |
| `falha admissível pistola 25 metros ISSF` | `issf.event.08:malfunctions` | PASS |
| `falha pistola fogo central ISSF` | `issf.event.10:malfunctions` | PASS |
| `CBTE WRABF dimensões apoio armamento` | `CBTE_WRABF_EQUIPMENT_RESTS_V1` antes dos cards WRABF | PASS |
| `CBTE Duelo 20 segundos 10m equipamento arma` | `CBTE_DUELO_20S_10M_EQUIPMENT_CLASSIFICATION_V1` antes do card da prova | PASS |
| `CBTE Trap Nacional equipamento arma medidas` | `SHOTGUN_TRAP_SKEET_DIMENSIONS_V1` e `CBTE_TRAP_NACIONAL_EQUIPMENT_AMMUNITION_V1` antes dos cards de fase | PASS |
| `CBTE Trap Skeet shotgun dimensions` | os dois cards de equipamento Trap/Skeet/Nacional antes dos cards de fase | PASS |
| `como é a prova de pistola 25m ISSF` | nenhum card de falha; card de especificações de pistola 25 m | PASS |
| `largura dimensões isoladas` | cards amplos de equipamento de várias autoridades, sem card de prova/falha | PASS, resultado amplo esperado sem modalidade informada |

Observação: em perguntas ISSF de Standard e Tiro Rápido, além do card de falhas, o seletor apresenta cards de fase da prova. O card de falhas vem primeiro. Não foi suprimida essa informação de prova.

## Interface de leitura por áudio

Chromium/Playwright com uma voz local `pt-BR` simulada:

- Ícone acessível por `aria-label` e `aria-pressed`: PASS.
- Ativação com dois cards: gerou duas falas correspondentes aos cards; o texto da resposta fora dos cards não foi narrado: PASS.
- Mouse sobre o título do card por mais de 3 segundos: falou apenas o título: PASS.
- Foco de teclado sobre um link por mais de 3 segundos: falou apenas o texto do link: PASS.
- Mouse sobre o título com a opção desligada: não iniciou fala: PASS.
- Sem voz local: modo permaneceu desligado, exibiu a indisponibilidade e manteve o campo de texto habilitado: PASS.

Esta automação prova estado, seleção do texto e gatilhos da UI; não prova áudio real audível. No Android, é necessário instalar/selecionar voz `pt-BR` local, recarregar a página e testar; compatibilidade offline não foi verificada aqui.

## Regressão da UI móvel para cards de falha

Na URL LAN atual `https://192.168.1.12:4173/`, Chromium/Playwright em viewport de 390 × 844 px abriu uma conversa nova para cada pergunta e encontrou o card específico como primeiro card:

| Pergunta | Primeiro card esperado | Resultado |
|---|---|---|
| `Quais são as falhas admissíveis e não admissíveis na prova de Pistola Standard ISSF?` | `issf.event.11:malfunctions` | PASS |
| `Como é o procedimento de falha na prova de Pistola de Tiro Rápido 25 m ISSF?` | `issf.event.09:malfunctions` | PASS |
| `O que fazer em caso de falha admissível na Pistola 25 m ISSF?` | `issf.event.08:malfunctions` | PASS |
| `Como funciona a falha admissível na Pistola Fogo Central ISSF?` | `issf.event.10:malfunctions` | PASS |

Resultado: 4/4 cards corretos na UI da versão servida na rota móvel. Este é teste responsivo em Chromium, não instrumentação do Android real. A confirmação da usuária cobre o acesso da prévia no celular; o teste de apresentação em aparelho físico continua fora desta evidência.

## Build e pacote

- `npm run build`: PASS.
- Pacote RENATE: 1.104 Q&A, 27 PDFs, 46 OCRs, 15.174 passagens, 138 cards padronizados.
- `packageSha256` informado pelo empacotador: `6be1e25c451cd02251d304c9da77c70424040827213e28a18cc02e1e8c8464f2`.
- Service worker gerado com 306 entradas e 363.297.504 bytes em precache.
- Não executada a regressão completa de 960 perguntas, nem testes reais de som/Android/iPhone.
