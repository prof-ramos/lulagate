# Instruções para agentes

## Contexto e escopo

Este projeto é um mapa interativo de pessoas, casos e fontes, em React, Vite e D3. Leia `README.md`, `app/README.md` e `data/metodologia.md` antes de trabalhar na interface. O código principal está em `app/src.jsx` e `app/style.css`.

Preserve a arquitetura e o funcionamento sem requisições de rede em execução. Skills são instruções de desenvolvimento; não devem ser importadas pelo aplicativo, incluídas no bundle ou exigir dependências de produção.

## Skills de design

As skills locais ficam em `.agents/skills/`. Leia apenas a skill pertinente à tarefa:

| Situação | Skill |
| --- | --- |
| Criar ou reformular componentes e definir tipografia, cores, espaçamento e hierarquia | `.agents/skills/frontend-design/SKILL.md` |
| Revisar uma interface ou verificar acessibilidade, interação e responsividade | `.agents/skills/web-design-guidelines/SKILL.md` |

Em mudanças visuais, use `frontend-design` durante a implementação e `web-design-guidelines` na revisão final. Em auditorias, reporte os problemas antes de alterar o código, salvo se o pedido já incluir as correções. Para tarefas sem interface, não carregue essas skills.

O briefing do usuário, a metodologia e as convenções existentes prevalecem sobre preferências genéricas das skills. Use pt-BR e capitalização natural do português; não aplique automaticamente regras editoriais inglesas como Title Case. Preserve textos e afirmações fornecidos. Não invente estatísticas, fontes, depoimentos ou conteúdo factual para preencher layouts.

Para `web-design-guidelines`, use a ferramenta de consulta HTTP disponível no ambiente no lugar de `WebFetch`, quando necessário. Busque as regras na URL indicada pela skill. Se a consulta falhar, declare a limitação e revise os critérios locais deste arquivo; não afirme conformidade integral com regras não consultadas. Quando o pedido já indicar a tela ou componente, deduza os arquivos pelo código antes de solicitar caminhos ao usuário.

Origem, versões fixadas, licenças e atualização: `.agents/README.md` e `.agents/design-skills.json`. Não execute instaladores ou atualize as cópias automaticamente.

## Critérios locais para alterações visuais

- Preserve fontes consultáveis, datas, metodologia, legendas e desfechos processuais. Uma conexão não significa culpa; proximidade não mede responsabilidade jurídica.
- Mantenha distinguíveis os estados definidos no dataset. Não use apenas cor para transmitir situação jurídica nem destaque visual que transforme alegações em fatos comprovados.
- Priorize leitura do grafo, rótulos legíveis, filtros compreensíveis e acesso aos detalhes e às fontes. Evite decoração ou movimento que prejudique a exploração.
- Verifique hierarquia tipográfica, alinhamento e espaçamento, contraste, foco visível, navegação por teclado, nomes acessíveis e preferência por movimento reduzido.
- Verifique telas estreitas e desktop, textos longos, ausência de resultados, abertura e fechamento dos modais, busca, filtros, zoom e seleção de personagens e casos.
- Preserve os parâmetros de URL e os links diretos existentes, incluindo `visualizacao`, `personagem`, `escandalo` e `modal`.

## Verificação e entrega

Para alterações no aplicativo, instale as dependências com `npm ci` em `app/` e execute `npm run build`. Confira `app/vite.config.js`: a saída atual é `dist/index.html` na raiz do repositório. Não publique ou substitua `docs/index.html` apenas para instalar skills.

Se dados forem alterados, execute também `python3 scripts/validate.py`. Para mudanças de UI, faça uma revisão visual em tamanhos de tela representativos quando houver navegador disponível e registre o que foi realmente verificado. Informe falhas e limitações; não declare testes que não executou.

Para alterações apenas nas instruções e skills, confira os caminhos, metadados, licenças, hashes do manifesto e `git diff --check`; não é necessário reconstruir o site.
