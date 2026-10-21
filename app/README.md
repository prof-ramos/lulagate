# Lula Gate

Aplicação React + Vite, com dados importados de `../data/dataset.json` no build. Não realiza requisições de rede em execução. Links para fontes são abertos somente por ação do usuário.

```sh
cd app
npm ci
npm test
npm run build
```

O `vite-plugin-singlefile` incorpora JavaScript e CSS em `../dist/index.html`. O diretório de saída é limpo em cada build.

Para desenvolvimento: `npm run dev`.

Parâmetros de URL: `visualizacao=rede|proximidade`, `personagem=<id>`, `escandalo=<id>` e `modal=escandalos|metodologia`. Abrir uma URL com `escandalo` sem `modal` abre a cronologia no caso indicado. Selecionar um caso nos controles filtra o mapa.

## Organização do mapa

`src.jsx` mantém controles, navegação e conteúdo documental; `Graph.jsx` integra o Cytoscape.js ao ciclo de vida do React; `cytoscape-model.js` adapta os elementos, layouts, seleção e estilos; `graph-model.js` concentra recortes, padrões de status, nomes de exibição e faixas editoriais.

Em Rede, o layout CoSE do Cytoscape.js organiza os personagens pelas conexões. A distância entre pontos nessa visualização não mede proximidade editorial nem responsabilidade jurídica. Proximidade usa posições predefinidas em sete faixas da metodologia, com anéis decorativos e legenda recolhível externa ao desenho.

Filtros removem elementos fora do recorte, atualizam contadores e reenquadram o mapa. O painel mostra as conexões do recorte e conserva acesso às fontes do personagem. Trocar o personagem com painel já aberto preserva a câmera; abrir ou fechar o painel pode reenquadrar a área útil. Use as setas com foco no mapa para deslocá-lo e os botões para zoom e restauração.

O canvas tem uma lista HTML alternativa de personagens, acessível por teclado, além da busca e do painel de detalhes. Na Rede, arraste os nós para ajustar o mapa; nos dois modos, arraste o fundo para deslocar a câmera. Em Proximidade, as posições dos personagens permanecem fixas para preservar a classificação editorial.

Os testes em `tests/` verificam filtros e recorte vazio, separação estável de relações paralelas, limites das faixas e distinção dos padrões de status. Os testes do adaptador usam uma instância real de Cytoscape em modo headless para verificar elementos, seleção e câmera. Eles não substituem a revisão visual e de interação no navegador.

## Dependência de visualização

Cytoscape.js 3.34.4 substitui as dependências diretas de D3. O pacote fica incorporado ao HTML produzido pelo Vite, sem carregar CDN em execução. A versão está fixada no manifesto e no lockfile. Licença MIT em `licenses/cytoscape-LICENSE.txt`, também incluída como comentário no HTML de entrada para acompanhar a distribuição.
