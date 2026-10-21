# lulagate

Site interativo (Vite + React + d3) que visualiza a rede de pessoas, casos e fontes do dataset deste repositório.

- Site publicado: https://prof-ramos.github.io/lulagate/
- Metodologia: [data/metodologia.md](data/metodologia.md)
- Dados: `data/` (dataset.json, link-check.csv etc.); scripts de geração em `scripts/`.

## Como reconstruir

```bash
cd app && npm ci && npm run build
cp dist/index.html ../docs/index.html
```
