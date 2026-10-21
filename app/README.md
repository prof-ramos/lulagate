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

`src.jsx` mantém controles, navegação e conteúdo documental; `Graph.jsx` renderiza a rede; `graph-model.js` concentra recortes, curvas paralelas, padrões de status e faixas editoriais.

Em Rede, as conexões orientam o posicionamento. A distância entre pontos nessa visualização não mede proximidade editorial nem responsabilidade jurídica. Proximidade mantém os sete anéis da metodologia, com legenda recolhível externa ao desenho.

Filtros removem elementos fora do recorte, atualizam contadores e reenquadram o mapa. O painel mostra as conexões do recorte e conserva acesso às fontes do personagem. Trocar o personagem com painel já aberto preserva a câmera; abrir ou fechar o painel pode reenquadrar a área útil. Use as setas com foco no mapa para deslocá-lo e os botões para zoom e restauração.

Os testes em `tests/graph-model.test.js` verificam filtros e recorte vazio, separação estável de relações paralelas, limites das faixas e distinção dos padrões de status. Eles não substituem a revisão visual e de interação no navegador.
