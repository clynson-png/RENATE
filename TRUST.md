# RENATE — TRUST

## Fonte de respostas

O RENATE usa diretamente o snapshot local dos 960 Q&A aprovados do ATLAS. O snapshot é a fonte canônica das perguntas e respostas; o Golden Set é somente um manifesto de teste com IDs, hashes e expectativas, sem perguntas ou respostas duplicadas. O runtime não lê o manifesto. O índice de busca aponta para os registros originais. A associação ALPHAOMEGA classifica 43 desses registros e não cria respostas duplicadas.

## Regra e evidência

- Resposta encontrada no ATLAS: apresentar o texto aprovado sem reescrita. A ação **Consultar passagens da regra** abre todas as passagens selecionadas, identificadas por regulamento, vigência e artigo/localizador. A resposta também mantém visíveis os links para os PDFs completos locais que a fundamentam.
- A biblioteca completa de regulamentos é uma área permanente de RENATE, acessível pela navegação sem iniciar uma conversa. O usuário pode filtrar os documentos e abrir qualquer PDF incluído no pacote. A leitura da norma completa é uma ação direta do atleta; não depende de pergunta, esclarecimento ou resposta do chatbot.
- Sem resposta correspondente no ATLAS: apresentar diretamente as passagens locais pertinentes com esses mesmos identificadores.
- Para perguntas de equipamento, medidas, armamento ou controle, pré-recortar como PNG a página pertinente do PDF local, vinculá-la à fonte/edição/página/hash e exibi-la acima das passagens quando as regras forem mostradas. Preservar rótulos e contexto; não redesenhar.
- Mostrar somente cards pertinentes que estejam prontos; card não substitui a regra citada.
- A abstenção nunca é permitida, inclusive quando nenhuma resposta ou passagem parece suficiente. Depois de pesquisar ATLAS, pretestes `PASS` e Library local, apresentar a passagem mais próxima disponível e identificá-la como aproximação quando necessário. Não entregar vazio, recusa nem fato normativo inventado.
- Em ambiguidade entre Q&A, mostrar, quando disponível, a pergunta ATLAS exata que delimita a informação em falta. Pedir esclarecimento no máximo duas vezes; desde o primeiro pedido, exibir junto uma passagem local relacionada. Cada resposta refaz a busca local usando a pergunta original e todos os esclarecimentos persistidos. Depois de dois pedidos, encerrar perguntas e exibir a regra local mais próxima.
- A resposta da Library deve preservar texto literal do OCR aprovado, edição, artigo/localizador, fonte/PDF e hash. A passagem é resposta direta somente quando sua cobertura for suficiente; caso contrário, rotulá-la como relacionada/mais próxima. Se a busca do OCR não encontrar coincidência, ainda exibir o melhor trecho ranqueado do corpus allowlisted sem chamá-lo de resposta exata.
- Respostas de pretestes das rotas com resultado gravado `PASS` entram no banco suplementar local conforme a solicitação humana; preservar pergunta, resposta, caso, resultado, evidência e fontes. Pretestes não substituem o snapshot ATLAS nem a passagem normativa local.
- Perguntas, respostas, esclarecimentos e fontes exibidas são salvos só no histórico local do PWA. O usuário pode apagar uma conversa ou todo o histórico; nenhuma conversa vai para a internet.

## Critério de aceite

O teste final executa os 960 casos referenciados no Golden Set contra o snapshot ATLAS. `PASS` exige 100% de seleção correta do Q&A, da resposta aprovada e da apresentação aplicável de regras, cards e figuras; casos sem correspondência exata/ambíguos devem mostrar a passagem local relacionada conforme a regra das duas clarificações. RENATE não se abstém. Os três grupos de perguntas duplicadas com respostas conflitantes pedem esclarecimento e também mostram regra local. Não há PASS parcial.

**Evidência de 2026-11-06:** FlexSearch e a apresentação local passaram 960/960 casos no Chromium 158 para resposta, fonte, localizador e passagem com hash PDF/OCR. Os 45 casos com card aplicável apresentaram card/foto locais. O catálogo tem 33 recortes; os 812 resultados que retornaram figura passaram hash e proveniência (812/812), e nove associações explícitas figura-pergunta passaram (9/9). O menu permanente da Library e os links aos PDFs completos funcionaram sem pergunta e sem requisição externa. Whisper Tiny integrado passou amostra PT-BR sintética offline. Cinco rotas não têm caso ATLAS no snapshot; fala humana e dispositivos móveis não foram validados.

## Execução offline

O ATLAS é lido do snapshot incluído em RENATE; não há conexão ao ATLAS, ao ADANA ou a backend durante busca e resposta. As passagens, PDFs, OCRs, cards e figuras vêm do pacote local versionado.

Whisper Tiny multilingual foi aprovado pelo usuário como ASR do RENATE e transcreveu offline uma amostra PT-BR sintetizada no Chromium 158. O export ONNX foi empacotado com revisões, hashes e ambos os avisos/licenças publicados (MIT e Apache-2.0); `npm run test:model-provenance` passou 23/23 arquivos. Avaliação com fala humana e em aparelhos continua pendente. A síntese de saída PT-BR não está aprovada: Kokoro JS não ofereceu voz portuguesa no teste.

O runtime resolve source IDs pelos caminhos locais registrados em `data/imports/day1_2026-11-06/atlas/atlas_source_bindings_2026-11-06.jsonl`; não abre os caminhos originais de `source_references.path` do snapshot.
