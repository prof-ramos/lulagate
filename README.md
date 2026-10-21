# lulagate

Site interativo (Vite + React + Cytoscape.js) que visualiza a rede de pessoas, casos e fontes do dataset deste repositório.

- Site publicado: https://prof-ramos.github.io/lulagate/
- Metodologia: [data/metodologia.md](data/metodologia.md)
- Dados: `data/` (dataset.json, link-check.csv etc.); scripts de geração em `scripts/`.

## Orientação para agentes

As skills de design do projeto estão versionadas em `.agents/skills/`. Consulte [AGENTS.md](AGENTS.md) para os critérios de uso e [.agents/README.md](.agents/README.md) para origens, licenças e atualização. A instalação orienta trabalhos futuros; não modifica o site publicado.

## Como reconstruir

```bash
cd app && npm ci && npm run build
cp ../dist/index.html ../docs/index.html
cp -R ../dist/retratos ../docs/
```

## Tamanho da distribuição

Após `cd app && npm run build` (bytes, sem compressão de transporte):

- `dist/index.html`: 1.011.180 bytes (987,5 KiB), incluindo JavaScript, CSS e dataset; 294.908 bytes com gzip.
- `dist/retratos/`: 32 fotos WebP, 225.876 bytes (220,6 KiB).
- `dist/` completo: 1.237.056 bytes (1.208,1 KiB).

## Prévias locais

Execute `cd app && node scripts/shots.mjs`. O script reconstrói `dist`, inicia Vite preview e usa Playwright headless para salvar as quatro prévias solicitadas e duas vistas de Proximidade em `shots/preview/`. Verifica erros de navegador, recursos externos, ausência de resultados, filtros, zoom e reserva de espaço do grafo no mobile. Se o ambiente bloquear portas locais, serve os mesmos arquivos de `dist` pela interceptação de requisições do Playwright. Requer Chromium instalado e permissão do ambiente para iniciar o navegador.

Nesta execução, `npm ci` (cache local), `npm test`, `npm run build` e `python3 scripts/validate.py` passaram. A geração das prévias foi tentada, mas o sandbox bloqueou a inicialização do Chromium (`Operation not permitted`); os PNGs e a revisão visual continuam pendentes.
