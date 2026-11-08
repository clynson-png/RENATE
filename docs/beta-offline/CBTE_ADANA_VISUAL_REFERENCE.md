# Referência visual CBTE e composição de conversa

**Inspecionado em:** 2026-11-07  
**Destino:** tokens e evidências dentro de RENATE; nenhum logo CBTE foi utilizado.

## Evidência do site CBTE

Páginas/recursos consultados:

- Página inicial oficial: https://www.cbte.org.br/
- Manual de Identidade CBTE, publicado no site oficial: https://www.cbte.org.br/wp-content/uploads/manual-1.pdf
- Página oficial da marca: https://www.cbte.org.br/logo-cbte/
- CSS de componentes: `https://www.cbte.org.br/wp-content/plugins/houseweb-shootingwpplugin/_frontend/assets/css/default.css?ver=7.1.4`
- Tipografia: `https://www.cbte.org.br/wp-content/uploads/elementor/google-fonts/css/roboto.css?ver=1742931359` e `https://www.cbte.org.br/wp-content/uploads/elementor/google-fonts/css/robotoslab.css?ver=1742931372`.

A página declara tokens globais Elementor `primary #6EC1E4`, `secondary #54595F`, `text #7A7A7A`, `accent #61CE70`; Roboto (primary/text, pesos 600/400) e Roboto Slab (secondary, 400). O CSS de navegação/widgets também usa verde `#009449`, ativo `#00A652`, azul escuro `#034D73`, azul `#0A567D` e borda `#094B6D`. O Manual de Identidade oficial define para a marca azul RGB(3,78,162) / `#034EA2`, verde RGB(0,166,81) / `#00A651`, amarelo RGB(255,242,0) / `#FFF200` e branco; indica Zona Pro para a tipografia da marca. O manual prevalece para as cores institucionais; o CSS do site serve como referência complementar de interface.

## Tokens aplicados ao shell

| Token | Valor | Uso e evidência |
|---|---|---|
| `--cbte-green` | `#00A651` | Verde da paleta oficial do Manual de Identidade |
| `--cbte-blue` | `#034EA2` | Azul da paleta oficial do Manual de Identidade |
| `--cbte-yellow` | `#FFF200` | Amarelo da paleta oficial; usado como detalhe, sem texto pequeno sobre ele |
| `--cbte-ink` | `#231F20` | Preto institucional indicado pelo manual para aplicações monocromáticas |
| `--cbte-gray` | `#656B70` | Texto secundário com contraste em superfícies claras |
| `--cbte-green-ink` | `#007A3D` | Variação escura para texto pequeno; o verde oficial permanece em acentos/superfícies |
| Fonte da interface | Roboto local | Site usa Roboto na interface; pacote local já contém WOFF2. Zona Pro consta no manual para a marca, não há arquivo dessa fonte no RENATE |

Roboto usa SIL Open Font License 1.1 e Roboto Slab Apache-2.0 nos projetos Google Fonts. As quatro cópias WOFF2 (121.644 bytes) ficam em `public/fonts/`; os avisos estão em `docs/licenses/`. Não há CDN. O site informa que a reprodução da marca CBTE requer autorização prévia. Por isso, o app não reproduz o logo CBTE, o selo de 120 anos nem a tipografia Zona Pro. RENATE agora usa sua própria arte, `docs/Logo RENATE_ Alvo Esportivo Brasileiro.png`, nas posições de marca desktop e móvel; a cópia servida offline fica em `public/brand/renate-logo.png`.

### Hierarquia tipográfica conferida por seção

| Seção | Tipografia/cor do texto | Tamanhos aplicados |
|---|---|---|
| Marca RENATE e navegação lateral | Roboto; branco sobre azul CBTE; amarelo somente em acentos | Marca 17 px; navegação 13 px; rótulos/estado 12 px |
| Cabeçalho e controles | Roboto; azul CBTE; etiqueta BETA amarela com texto preto | Botões 12–13 px; BETA 12 px |
| Abertura e conversa | Roboto; títulos azul CBTE; corpo preto institucional | Título 32–44 px (mobile 30–38); corpo 16 px (mobile 15); proveniência 12 px |
| Avisos e formulários | Roboto; texto preto/cinza com azul nos rótulos | Aviso 14 px; rótulos 13 px; entrada 16–18 px |
| Biblioteca | Roboto; títulos azul; descrição preta/cinza | Título 28–38 px; nome do documento 16 px; edição 13 px; metadados 12 px |
| Passagens de regra | Roboto; cabeçalho azul com branco; texto preto/cinza | Corpo 14 px; título/localizador 13 px; edição/link 12 px |
| Cards | Roboto; título azul; texto preto; verde escuro para rótulos | Título 20–21 px; texto 13–14 px; metadados/rótulos 12 px |

Para texto pequeno, o verde oficial `#00A651` não é usado como cor de texto sobre branco; ele fica em faixas, ícones ou elementos decorativos. Azul `#034EA2`, verde escuro `#007A3D`, cinza `#656B70` e preto institucional `#231F20` dão contraste para conteúdo; amarelo `#FFF200` fica com texto escuro e função de destaque.

## Composição de conversa

O shell próprio segue a composição/interação das referências visuais que já estão dentro de `data/imports/day1_2026-11-06/visual-reference/adana-ui/`: navegação lateral e conversas no desktop, área de conversa, cabeçalho e composer; no celular, navegação em drawer e composer responsivo. Os arquivos do ADANA servem somente para consulta visual; nenhum JSX/CSS, chamada de API, serviço ou token de estilo foi importado para runtime. Em 2026-11-07, a Skin RENATE foi ajustada com o azul, verde e amarelo oficiais, superfícies claras e cards compatíveis com a paleta; a aparência própria de conversas e navegação foi preservada.

O app compilado precacheia seus assets e mantém estado de pacote incompleto até ATLAS, Library e cards estarem integrados. O shell conversacional é responsivo (drawer/composer em viewport móvel e navegação lateral em desktop), conforme a inspeção e o teste de browser. Whisper Tiny está integrado ao botão de gravação e tem prova de inferência PT-BR sintética offline; fala humana e aparelhos continuam pendentes. A saída de áudio/TTS permanece desabilitada até existir voz PT-BR offline aprovada.

## Limites

O site oficial comprova os estilos entregues na data da inspeção, não licença de marca. Não foram copiados logo, imagem institucional ou selo CBTE.
