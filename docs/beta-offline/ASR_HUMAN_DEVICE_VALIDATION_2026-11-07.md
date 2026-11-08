# Validação humana de ASR em aparelhos — 2026-11-07

## Estado

O build de produção local inclui Whisper Tiny q8 integrado ao botão de gravação. Em 2026-11-07, a usuária confirmou que conseguiu abrir e ler a interface no celular. O teste automatizado com fala sintética passou novamente; isso não confirma permissão do microfone nem transcrição de fala humana no telefone.

| Ambiente | Estado | Evidência |
|---|---|---|
| Chromium desktop, ASR sintético offline | PASS | `npm run test:audio-browser`, 2026-11-07; Whisper Tiny local, zero solicitações externas. |
| Chromium desktop, fala humana | PENDENTE | O ensaio anterior capturou música; não conta como fala humana em português. |
| Interface legível em celular | PASS, confirmação da usuária | A página abriu e pôde ser lida. Android também capturou e transcreveu; iPhone segue no fim da sequência. |
| Android real, permissão e fala humana (lotes iniciais) | PARCIAL — 2/6 aprovadas pela usuária | Captura/transcrição funcionaram. Em cada um de dois lotes de três, uma tentativa passou. |
| Android real, configuração restaurada da primeira passagem | PASS — aceite explícito da usuária | A usuária considerou PASS o lote de quatro gravações registrado abaixo. O dado observado permanece: 1/4 semanticamente correspondente (`9` por “nove”), nenhuma saída literalmente idêntica. |
| iPhone real, permissão e fala humana | PENDENTE | Fazer três gravações; conferir permissão e transcrição no campo antes de enviar. |

### Atualização do gate de acesso móvel — 2026-11-08

- **PASS — rota de acesso à versão atual:** a usuária confirmou que o RENATE está funcionando no celular. A URL `https://192.168.1.12:4173/` respondeu HTTP 200 e entregou o bundle atual `index-CHTgE-4I.js`; o serviço já ativo foi preservado.
- Este resultado fecha somente o gate de acesso pela rede local à prévia atual. Não comprova instalação PWA, quota, reabertura em modo avião, leitura audível/TTS ou conteúdo dos cards no aparelho.

### Resultado Android informado pela usuária — 2026-11-07

Frase lida: “Na competição de tiro esportivo, o árbitro confirmou nove tiros.”

1. `Na competição de --atirios sportivo--, o hábito confirmou 9 tios` — erro de reconhecimento.
2. 100% da frase falada — acerto exato informado pela usuária.
3. `Na competição de tiro, é de Portugal. O arbitro confirmou 9 tirUs` — erro de reconhecimento.

Resultado do primeiro lote: a captura/transcrição está operacional, com 1/3 exatas. No segundo lote, a usuária informou novamente 1/3 aprovada e enviou estas saídas:

1. `Na competição de atirios portivo o árbitro confirmou noventivos`
2. `Na competição de tiro esportivo o árbitro confirmou nove tios`
3. `na competição de aquilo, o ábitro confirmou 9 tiros`

A usuária não indicou qual saída desse segundo lote correspondeu ao PASS; os textos foram preservados sem reclassificação. Antes da correção descrita abaixo, o total informado foi 2/6 aprovações em Android.

### Android após o ajuste do sinal, antes da normalização lexical — 2026-11-07

1. `Na competição de tiro esportivo o arbitro confirmou 9 tiros`
2. `Na competição de Itiro esportivo o árbitro confirmou 9 tiros`
3. `Na competição, de tiro, é sportivo. O ábirto confirmou 9 tiros`

A primeira contém as palavras da frase com acento omitido em “árbitro” e o número “nove” apresentado como `9`; as duas últimas têm erro em palavras/segmentação. Para tratar esses erros repetidos, foi adicionada uma normalização local, limitada a variantes observadas de vocabulário de tiro esportivo. A correção altera o texto reconhecido antes de colocá-lo no campo editável; não substitui a frase completa.

### Ajuste do caminho de áudio — 2026-11-07

- A conversão agora escolhe o canal com maior energia, em vez de fazer média entre canais que poderiam se cancelar; recorta silêncio nas extremidades e normaliza o nível com ganho limitado.
- Whisper Tiny usa busca de 3 hipóteses (`num_beams: 3`) em português. A camada contextual de correção lexical foi experimentada e depois removida a pedido da usuária; a versão atual mostra o texto bruto do modelo.
- `npm run test:audio-browser` passou com fala sintética offline e zero acessos externos. Isso não comprova melhora na transcrição acústica.
- Revisão das transcrições humanas e teste no iPhone permanecem pendentes; o gate geral de fala humana/dispositivos não está fechado.

### Android após a camada lexical — lote recebido em 2026-11-07

1. `Na competição de direi, eu vou continuarmos com o filme a 9 tiros`
2. `Na competição de um tiro esportivo, o árbitro confirmou 9 tírus`
3. `Na competição, debilha, e o objetivo lá, entre o confirmou 9 tiros.`

A segunda saída é a mais próxima, mas ainda contém erro em `tírus`; as demais desviam bastante da frase. A usuária pediu reverter a configuração recente e fazer somente mudanças pequenas. A normalização textual foi removida; foram mantidos o canal de maior energia, o corte de silêncio, a normalização limitada de volume e `num_beams: 3`, correspondentes ao ajuste anterior considerado melhor. O lote foi feito antes dessa reversão; validar uma gravação na versão atual.

### Restauração da configuração da primeira passagem — 2026-11-07

- Após a usuária informar que o resultado continuava pior que na primeira passagem, removi todas as alterações do processamento de sinal: seleção do canal de maior energia, corte de silêncio nas bordas e ganho limitado.
- Restaurada a mistura simples dos canais e removido `num_beams: 3`; a chamada mantém apenas idioma português e tarefa de transcrição. A saída continua sendo o texto bruto do Whisper.
- O preview de produção local foi reconstruído e reiniciado para servir essa configuração. Aguardar uma nova gravação Android antes de decidir outro ajuste. iPhone permanece para o final.

### Android após restaurar a primeira configuração — novo lote recebido

Frase de referência: “Na competição de tiro esportivo, o árbitro confirmou nove tiros.”

1. `Na competição de que ir importivo o árbitro confirmou novos itivos` — erros em “tiro esportivo” e “nove tiros”.
2. `Na competição de tiro esportivo o árbitro confirmou 9 tiros` — conteúdo reconhecido; “nove” foi normalizado como `9`, sem outras divergências lexicais.
3. `Na competição, eu tenho um objetivo, o árbitro confirmou 9 tiros` — inserção e substituição de trecho.
4. `Na competição, debimir o objetivo lá dentro de um filme novo nove tiros` — grande desvio da frase.

Resultado observado: 1/4 com conteúdo correspondente, considerando `9` equivalente a “nove”; 0/4 literalmente idênticas à frase de referência. **Aceite:** a usuária determinou que o teste seja considerado PASS. Manter a configuração restaurada; o teste iPhone permanece pendente e para o final.

## Iniciar a plataforma offline

No PowerShell, a partir da pasta RENATE:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\start-renate.ps1
```

O script compila a versão de produção local, gera certificado autoassinado com IP da Wi-Fi, inicia preview HTTPS e publica o certificado público somente na rede local. A URL de aparelho e os endereços para obter certificado/perfil são impressos no terminal. Para encerrar:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\start-renate.ps1 -Stop
```

No Android, baixe `renate-local.cer` do endereço HTTP local e adicione-o como certificado de CA do usuário. No iPhone, baixe `renate-local.mobileconfig`; abra **Ajustes > Perfil Baixado** e instale-o. Depois habilite confiança total em **Ajustes > Geral > Sobre > Ajustes de Confiança do Certificado**. A Apple exige essa etapa para perfis instalados manualmente. Abra então a URL HTTPS da RENATE no mesmo Wi-Fi e permita o microfone. O certificado tem validade de 30 dias e é destinado apenas a esta rede de teste.

## Roteiro de fala

No Android e no iPhone, faça três gravações separadas dizendo em voz natural:

> Na competição de tiro esportivo, o árbitro confirmou nove tiros.

Pare a gravação, confira a transcrição no campo de pergunta e não envie a pergunta durante a medição. Registre o texto exatamente como exibido e se a permissão/gravação funcionou. Compare reconhecimento de “competição”, “árbitro”, “nove” e “tiros”, incluindo acentos, omissões e inserções. O gate de fala humana só fecha depois da revisão desses resultados; a verificação automatizada do preview não conta como fala humana.

## Verificação automatizada de prontidão

`node scripts/check_device_preview.mjs` abre o preview local, confirma origem segura, API de microfone, `MediaRecorder` e ausência de solicitações fora dos endereços locais. Ela não grava áudio nem substitui os três ensaios humanos por aparelho.

**Executado em 2026-11-07, após rebuild/restart do preview:** `PASS_LOCAL_PREVIEW_READY` em `https://localhost:4173/` e no IP LAN `https://192.168.1.12:4173/`; `isSecureContext=true`, `getUserMedia=true`, `MediaRecorder=true`, entrega do certificado/perfil disponível e zero solicitações externas. `humanSpeechCaptured=false`. A usuária confirmou que a interface abre e é legível no celular; faltam o teste do microfone e as seis transcrições humanas.
