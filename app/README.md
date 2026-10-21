# Lula Gate

Aplicação React + Vite, com dados importados de `../data/dataset.json` no build. Não carrega recursos externos em execução. Os retratos WebP de até 96 px são incorporados em base64; links para fontes e créditos são abertos somente por ação do usuário.

```sh
cd app
npm ci
npm test
npm run build
```

O `vite-plugin-singlefile` incorpora JavaScript e CSS em `../dist/index.html`. Os retratos de `public/retratos/` são entradas do build de dados e não são duplicados na distribuição. Publique `og.png` junto com o HTML. O `base` relativo (`./`) permite servir em subdiretórios do GitHub Pages. O diretório de saída é limpo em cada build.

Para desenvolvimento: `npm run dev`.

Links curtos: `?p=<id>&v=rede|proximidade`, sincronizados por `history.replaceState`. Os parâmetros antigos continuam aceitos. Parâmetros de URL: `visualizacao=rede|proximidade`, `personagem=<id>`, `escandalo=<id>` e `modal=escandalos|metodologia`. Abrir uma URL com `escandalo` sem `modal` abre a cronologia no caso indicado. Selecionar um caso nos controles filtra o mapa.

## Organização do mapa

`src.jsx` mantém controles, navegação e conteúdo documental; `Graph.jsx` integra o Cytoscape.js ao ciclo de vida do React; `cytoscape-model.js` adapta os elementos, layouts, seleção e estilos; `graph-model.js` concentra recortes, padrões de status, nomes de exibição e faixas editoriais.

Em Rede, a extensão fCoSE do Cytoscape.js organiza os personagens pelas conexões. A distância entre pontos nessa visualização não mede proximidade editorial nem responsabilidade jurídica. Proximidade usa posições predefinidas em sete faixas da metodologia, com anéis decorativos e legenda recolhível externa ao desenho.

Filtros removem elementos fora do recorte, atualizam contadores e reenquadram o mapa. A Rede é calculada uma vez, com posições iniciais determinísticas e `randomize: false`; filtros e trocas de visualização restauram as posições, inclusive ajustes por arraste. O painel mostra as conexões do recorte e conserva acesso às fontes do personagem. Selecionar uma pessoa centraliza o nó na área útil; abrir, fechar ou redimensionar o painel reenquadra essa área. Use as setas com foco no mapa para deslocá-lo e os botões para zoom e restauração.

O canvas tem uma lista HTML alternativa de personagens, acessível por teclado, além da busca e do painel de detalhes. Na Rede, arraste os nós para ajustar o mapa; nos dois modos, arraste o fundo para deslocar a câmera. Em Proximidade, as posições dos personagens permanecem fixas para preservar a classificação editorial.

Os testes em `tests/` verificam filtros e recorte vazio, separação estável de relações paralelas, limites das faixas e distinção dos padrões de status. Os testes do adaptador usam uma instância real de Cytoscape em modo headless para verificar elementos, seleção e câmera. Eles não substituem a revisão visual e de interação no navegador.

## Dependência de visualização

Cytoscape.js 3.34.4 e cytoscape-fcose 2.2.0 substituem as dependências diretas de D3. Os pacotes ficam incorporados ao HTML produzido pelo Vite, sem carregar CDN em execução. As versões estão fixadas no manifesto e no lockfile. Licenças em `licenses/`, também incluídas como comentários no HTML de entrada para acompanhar a distribuição.

## Retratos e Wikidata

`data/wikidata-qids.json` conserva o mapeamento conferido de pessoa para QID. `scripts/build_nodes.py` atribui `wikidata_qid` a cada personagem (ou `null`). `data/creditos-imagens.json` e sua cópia CSV registram autor, licença, página no Commons e nome local de cada miniatura. `scripts/build.py` incorpora o campo `retrato` ao dataset; nenhum dado depende de `.incoming/`.

Para regenerar e conferir: `python3 scripts/build.py` e `python3 scripts/validate.py`, a partir da raiz. Ao atualizar créditos, mantenha JSON e CSV sincronizados. URLs de licença vazias são aceitas somente para CC0/domínio público; nesse caso, o painel vincula a licença à página de origem, preservando os metadados recebidos. As imagens ficam somente no painel, com iniciais na ausência de retrato ou em erro de carregamento.

Os testes também verificam iniciais, incorporação binária dos retratos, créditos, tamanhos por número de casos, seleção e layout. `python3 scripts/validate.py` exige situações explícitas, fontes e datas válidas; nenhuma categoria é inferida de texto. No mobile, a Rede abre com Lula e as nove pessoas com mais conexões, em posições iniciais organizadas para leitura. Rótulos são renderizados com 12 px, com supressão de colisões; os demais aparecem ao ampliar. Os nós mantêm alvo de pelo menos 44 px. Cor e forma indicam a categoria jurídica; tamanho representa quantidade de casos. A promessa e a busca ficam acima do canvas. Filtros abrem numa folha inferior sobreposta com botão de resultados. No mobile, o painel abre em meia altura, pode ser arrastado entre 35% e 72% ou alternado por botão. A lista de nomes oferece navegação com Tab/Enter; Esc fecha folhas e painel.

Compartilhamento usa `navigator.share`, com cópia como fallback; exige suporte e contexto seguro do navegador. A imagem social própria de 1200 × 630 é reproduzível com `python3 scripts/build_og.py` (Pillow). O tour de três passos é opcional, com dispensa lembrada em localStorage. Tela cheia e exportação PNG são acionadas pelos controles do mapa.

Para conferir os critérios de aceitação localmente: `node scripts/ac-check.mjs`.
O script reconstrói a aplicação, usa uma porta livre do Vite preview e grava
`shots/preview/ac-report.json`, com PASS/FAIL por AC e saída 1 se algum BLOCK
falhar. Testa desktop 1280 × 800 e mobile 390 × 844 com DPR 3. Falhas de
infraestrutura são registradas como FAIL, sem aprovação presumida. O relatório
identifica o alvo como build local; não certifica o SHA publicado em produção.
`window.__cy` expõe a instância do mapa para inspeção das caixas e da câmera.
