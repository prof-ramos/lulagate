# Lula Gate

Aplicação React + Vite, com dados importados de `../data/dataset.json` no build. Não carrega recursos externos em execução. Os retratos são servidos localmente; links para fontes e créditos são abertos somente por ação do usuário.

```sh
cd app
npm ci
npm test
npm run build
```

O `vite-plugin-singlefile` incorpora JavaScript e CSS em `../dist/index.html`. Os retratos de `public/retratos/` são copiados para `../dist/retratos/`; publique esse diretório junto com o HTML. O `base` relativo (`./`) permite servir em subdiretórios do GitHub Pages. O diretório de saída é limpo em cada build.

Para desenvolvimento: `npm run dev`.

Parâmetros de URL: `visualizacao=rede|proximidade`, `personagem=<id>`, `escandalo=<id>` e `modal=escandalos|metodologia`. Abrir uma URL com `escandalo` sem `modal` abre a cronologia no caso indicado. Selecionar um caso nos controles filtra o mapa.

## Organização do mapa

`src.jsx` mantém controles, navegação e conteúdo documental; `Graph.jsx` integra o Cytoscape.js ao ciclo de vida do React; `cytoscape-model.js` adapta os elementos, layouts, seleção e estilos; `graph-model.js` concentra recortes, padrões de status, nomes de exibição e faixas editoriais.

Em Rede, a extensão fCoSE do Cytoscape.js organiza os personagens pelas conexões. A distância entre pontos nessa visualização não mede proximidade editorial nem responsabilidade jurídica. Proximidade usa posições predefinidas em sete faixas da metodologia, com anéis decorativos e legenda recolhível externa ao desenho.

Filtros removem elementos fora do recorte, atualizam contadores e reenquadram o mapa. A Rede é calculada uma vez, com posições iniciais determinísticas e `randomize: false`; filtros e trocas de visualização restauram as posições, inclusive ajustes por arraste. O painel mostra as conexões do recorte e conserva acesso às fontes do personagem. Trocar o personagem com painel já aberto preserva a câmera; abrir ou fechar o painel pode reenquadrar a área útil. Use as setas com foco no mapa para deslocá-lo e os botões para zoom e restauração.

O canvas tem uma lista HTML alternativa de personagens, acessível por teclado, além da busca e do painel de detalhes. Na Rede, arraste os nós para ajustar o mapa; nos dois modos, arraste o fundo para deslocar a câmera. Em Proximidade, as posições dos personagens permanecem fixas para preservar a classificação editorial.

Os testes em `tests/` verificam filtros e recorte vazio, separação estável de relações paralelas, limites das faixas e distinção dos padrões de status. Os testes do adaptador usam uma instância real de Cytoscape em modo headless para verificar elementos, seleção e câmera. Eles não substituem a revisão visual e de interação no navegador.

## Dependência de visualização

Cytoscape.js 3.34.4 e cytoscape-fcose 2.2.0 substituem as dependências diretas de D3. Os pacotes ficam incorporados ao HTML produzido pelo Vite, sem carregar CDN em execução. As versões estão fixadas no manifesto e no lockfile. Licenças em `licenses/`, também incluídas como comentários no HTML de entrada para acompanhar a distribuição.

## Retratos e Wikidata

`data/wikidata-qids.json` conserva o mapeamento conferido de pessoa para QID. `scripts/build_nodes.py` atribui `wikidata_qid` a cada personagem (ou `null`). `data/creditos-imagens.json` e sua cópia CSV registram autor, licença, página no Commons e nome local de cada miniatura. `scripts/build.py` incorpora o campo `retrato` ao dataset; nenhum dado depende de `.incoming/`.

Para regenerar e conferir: `python3 scripts/build.py` e `python3 scripts/validate.py`, a partir da raiz. Ao atualizar créditos, mantenha JSON e CSV sincronizados. URLs de licença vazias são aceitas somente para CC0/domínio público; nesse caso, o painel vincula a licença à página de origem, preservando os metadados recebidos. As imagens ficam somente no painel, com iniciais na ausência de retrato ou em erro de carregamento.

Os testes também verificam iniciais, caminhos relativos, correspondência entre retratos e créditos e espaço entre cápsulas em todos os anéis. O zoom mínimo de 0,75 conserva nomes com pelo menos 9 px; o enquadramento inicial prioriza leitura e pode exigir deslocamento para explorar o mapa completo. Nomes comuns são ocultados abaixo de 9 px; o personagem central, a seleção, o foco e os resultados da busca conservam os rótulos. Os raios continuam representando as mesmas sete faixas editoriais. No mobile, o painel ocupa uma linha própria com cerca de 52% da área disponível abaixo dos controles; o grafo permanece visível acima dele.
