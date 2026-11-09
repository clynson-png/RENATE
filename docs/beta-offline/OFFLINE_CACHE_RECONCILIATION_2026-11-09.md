# Reconciliação do cache offline — 2026-11-09

## Relato e achados

A usuária informou que o RENATE instalado no Android não baixou regulamentos e documentos da Library para consulta offline. O relatório móvel de 08/11 já delimitava que a validação anterior confirmou entrega HTTPS e do Service Worker, mas não instalação, quota nem reabertura em modo avião.

O pacote local contém 27 PDFs da Library. O build analisado contém 306 recursos no precache, totalizando 363.296.531 bytes. Portanto, os documentos não estavam ausentes dos arquivos locais usados pelo build.

A causa sistêmica confirmada no código era a falta de confirmação de cache íntegro: o Service Worker executava `cache.addAll()` para o conjunto todo, sem progresso; a aplicação descartava erros de registro e marcava `READY_OFFLINE` quando somente o índice ATLAS terminava de carregar. Assim, era possível avançar com rede mesmo sem comprovar que os documentos tinham sido armazenados. A quota/armazenamento disponível no Android pode provocar uma falha, mas não foi observada diretamente no aparelho e não é declarada como causa confirmada.

## Correção aplicada

- O Service Worker agora baixa recursos em sequência, verifica cada resposta pelo SHA-256 do build e grava um marcador de conclusão somente depois que todos os itens passaram.
- Itens válidos de uma tentativa anterior são reaproveitados; isso permite continuar uma preparação interrompida.
- A interface recebe progresso e erro e só mostra `Pronto para uso offline` quando o Service Worker confirma o pacote íntegro. Erros orientam verificar conexão e espaço e recarregar.
- Nenhuma rota, Q&A, alias ou sequência de apresentação foi alterada.

## Build e aceite pendente

- `npx vite build`: **PASS**.
- `node scripts/generate_sw.mjs`: **PASS**, 306 recursos, 363.296.906 bytes, versão de cache `ceff2739cc776b61`.
- A nova versão foi gerada em `dist/`; não foi feito deploy Vercel neste passo.
- A prévia HTTPS local está ativa em `https://172.16.19.157:4173/`. O Service Worker e o manifesto responderam HTTP 200; o manifesto mantém o pacote SHA-256 `5627f767a3ba3f24fadc2c01173ae5768e558aebb58afb0cff797ae5cddfbd55`. O certificado foi renovado para incluir o IP atual da rede.
- Como o IP/origem mudou de `192.168.1.12` para `172.16.19.157`, a PWA antiga não atualiza entre essas origens. No Android, abrir o novo endereço e instalar/adicionar esta origem; antes, instalar e confiar no certificado atualizado em `http://172.16.19.157:4174/renate-local.cer`.
- Não houve teste em aparelho físico. O gate de instalação e reabertura offline no Android permanece **PENDENTE** até a versão atual ser aberta com rede, o status indicar pacote conferido, e então o app ser reaberto em modo avião e um regulamento da Library ser aberto.

