# lulagate

Site interativo (Vite + React + d3) que visualiza a rede de pessoas, casos e fontes do dataset deste repositório.

- Site publicado: https://prof-ramos.github.io/lulagate/
- Metodologia: [data/metodologia.md](data/metodologia.md)
- Dados: `data/` (dataset.json, link-check.csv etc.); scripts de geração em `scripts/`.

## Orientação para agentes

As skills de design do projeto estão versionadas em `.agents/skills/`. Consulte [AGENTS.md](AGENTS.md) para os critérios de uso e [.agents/README.md](.agents/README.md) para origens, licenças e atualização. A instalação orienta trabalhos futuros; não modifica o site publicado.

## Como reconstruir

```bash
cd app && npm ci && npm run build
cp dist/index.html ../docs/index.html
```
