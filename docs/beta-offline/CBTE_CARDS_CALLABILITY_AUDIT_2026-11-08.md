# Auditoria ampliada de alcance dos cartões CBTE — 2026-11-08

## Escopo e limites

Verificação somente no pacote local e no Web Worker de `https://127.0.0.1:4173/`. Foram testados os cartões de prova CBTE por nome e aliases; as famílias `issf.event.*`, `wsps.event.*`, `cbte.issf.*`, `cbte.wsps.program` e a rota `cbte.shotgun.issf` permaneceram bloqueadas e fora da auditoria. Esta etapa foi somente leitura; não alterou código, cartões, aliases ou rotas.

## Cartões de prova por nome/alias

- Foram percorridos 45 cards de fase/variante distribuídos em 17 rotas CBTE incluídas no escopo.
- Cada nome de card e alias foi consultado com indicação explícita CBTE; cards de final também foram consultados com intenção de final.
- Resultado: **111/111 tentativas chamaram o card correspondente**. Nenhum outro card de prova CBTE ficou sem chamada nos nomes e aliases registrados no pacote.
- A auditoria anterior de cobertura por rota segue em **20/20** rotas CBTE com card de qualificação, incluindo as rotas de programa delegadas, apenas para confirmar presença do card correspondente. Essas rotas delegadas ficaram bloqueadas para mudanças.

## Achado separado: cards da categoria equipamento

Quatro cards ligados a uma ou mais rotas CBTE estão no conjunto `equipmentCards`, separado dos cards de fase. Eles não apareceram nas consultas diretas de prova e equipamento abaixo:

| Card | Rota(s) CBTE | Consulta focada | Resultado observado |
|---|---|---|---|
| `CBTE_WRABF_EQUIPMENT_RESTS_V1` | `cbte.wrabf.rifle_international` | `CBTE WRABF carabina apoios equipamento` | Cards de fase WRABF; o card de equipamento não foi incluído |
| `CBTE_DUELO_20S_10M_EQUIPMENT_CLASSIFICATION_V1` | `cbte.duelo.10m` | `CBTE duelo 20 segundos 10m equipamento armas divisões` | Card de qualificação; o card de equipamento não foi incluído |
| `CBTE_TRAP_NACIONAL_EQUIPMENT_AMMUNITION_V1` | `cbte.shotgun.trap_nacional` | `CBTE Trap Nacional arma munição` | Cards de qualificação/final; o card de equipamento não foi incluído |
| `SHOTGUN_TRAP_SKEET_DIMENSIONS_V1` | Rotas CBTE de Trap/Fossa e Skeet | `CBTE Fossa Automática dimensões Trap` | Cards de qualificação/final; o diagrama de equipamento não foi incluído |

O caminho atual do Web Worker acrescenta `equipmentCards` quando o registro tem a rota `renate.alphaomega` e a pergunta pede equipamento. As consultas nominais acima resolvem para as rotas CBTE da prova; por isso os quatro cards não foram chamados nesse contexto. O diagrama de Trap/Skeet tem estado de revisão de origem `NOT_RECORDED_IN_SOURCE_CATALOG` e é visual suplementar, não evidência normativa.

## Conclusão

Os cards de prova CBTE encontrados no escopo estão chamáveis por seus nomes/aliases. Os quatro cards de equipamento são a única classe observada sem chamada junto de perguntas diretas por prova. A escolha de disponibilizá-los nesses contextos precisa ser tratada como ajuste separado da política de apresentação; não foi feita nesta verificação. Nenhum conteúdo ou rota ISSF/WSPS foi aberto para alteração.

## Limite

Esta é uma auditoria de seleção de cards pelo Web Worker de produção local. Não foi feita revisão visual no Android, regressão ampla do app ou reavaliação humana dos conteúdos.
