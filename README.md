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
cp ../dist/og.png ../docs/
```

## Tamanho da distribuição

Após `cd app && npm run build` (bytes, sem compressão de transporte):

- `dist/index.html`: 1,073,800 bytes; 338,114 bytes com gzip.
- `dist/og.png`: 30,359 bytes (1200 × 630).
- `dist/` completo: **1,104,159 bytes**, abaixo de 1,5 MB.

A saída configurada pelo Vite é `dist/` na raiz, não `app/dist/`.

O build contém apenas `index.html` (JavaScript, CSS, dataset e retratos incorporados) e `og.png`. Não requer chamadas externas durante a exploração. Os links de fontes e créditos só abrem por ação do usuário.

Situação jurídica explícita por pessoa, com categoria, fonte, data e texto. Critérios e limites na [metodologia](data/metodologia.md#categorias-jurídicas-dos-nós). Correções em [CHANGELOG-PR-B.md](CHANGELOG-PR-B.md).

## Prévias locais

Execute `cd app && node scripts/shots.mjs`. O script reconstrói `dist`, inicia Vite preview e usa Playwright headless para salvar as quatro prévias solicitadas e duas vistas de Proximidade em `shots/preview/`. Verifica erros de navegador, recursos externos, ausência de resultados, filtros, zoom e reserva de espaço do grafo no mobile. Se o ambiente bloquear portas locais, serve os mesmos arquivos de `dist` pela interceptação de requisições do Playwright. Requer Chromium instalado e permissão do ambiente para iniciar o navegador.

Nesta execução, `npm ci`, `npm test`, `npm run build` e `python3 scripts/validate.py` passaram. A geração das prévias foi tentada, mas o ambiente bloqueou a inicialização do Chromium mesmo com `--no-sandbox` (`Operation not permitted`); os PNGs e a revisão visual continuam pendentes.
