# Lula Gate

Aplicação React + Vite, com dados importados de `../data/dataset.json` no build. Não realiza requisições de rede em execução. Links para fontes são abertos somente por ação do usuário.

```sh
cd /workspace/lulagate/app
npm install
npm run build
```

O `vite-plugin-singlefile` incorpora JavaScript e CSS em `../dist/index.html`. O diretório de saída é limpo em cada build.

Para desenvolvimento: `npm run dev`.

Parâmetros de URL: `visualizacao=rede|proximidade`, `personagem=<id>`, `escandalo=<id>` e `modal=escandalos|metodologia`. Abrir uma URL com `escandalo` sem `modal` abre a cronologia no caso indicado. Selecionar um caso nos controles filtra o mapa.

## Validação neste ambiente

A instalação foi tentada com npm, mas o ambiente retornou `EAI_AGAIN` ao resolver `registry.npmjs.org`. As dependências D3 também não estavam em cache. `npm run build` foi executado e retornou `vite: not found` porque a instalação não pôde terminar. O HTML de distribuição ainda não foi gerado.
