# Skills de design do projeto

Este diretório contém cópias versionadas de duas skills selecionadas da categoria [Design & UI do skills.sh](https://www.skills.sh/topic/design). Elas orientam trabalhos futuros e não alteram a interface nem acrescentam dependências ao site.

| Skill | Origem | Uso | Licença |
| --- | --- | --- | --- |
| `frontend-design` | [anthropics/skills](https://github.com/anthropics/skills/tree/dbd4588f9e1033efb41dad4bef2f7947c8993d44/skills/frontend-design) | Direção visual e implementação | Apache-2.0; texto completo em `skills/frontend-design/LICENSE.txt` |
| `web-design-guidelines` | [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills/tree/063bee94c3f4df8453406c830b0a7df0f2860278/skills/web-design-guidelines) | Revisão de interface e acessibilidade | MIT, conforme a seção License do [README de origem](https://github.com/vercel-labs/agent-skills/blob/063bee94c3f4df8453406c830b0a7df0f2860278/README.md#license) |

Os arquivos `SKILL.md` foram copiados sem alterações. O upstream da Vercel declara MIT no README, mas não fornece um arquivo LICENSE separado nesta revisão. Essa declaração é registrada aqui sem inventar aviso de copyright ou termos adicionais.

O catálogo completo não foi instalado: as duas skills cobrem criação e revisão sem sobrepor várias orientações estéticas ou adicionar fluxos especializados desnecessários. O Superpowers permanece como fluxo de trabalho quando disponível no ambiente; esta instalação não o distribui nem o exige como dependência.

## Uso

O diretório `.agents/skills/` permite descoberta por agentes compatíveis. O `AGENTS.md` na raiz também aponta para cada skill para permitir leitura explícita em ambientes que não façam a descoberta automática. Isso não instala plugins globalmente nem habilita skills em sessões do ChatGPT que não tenham acesso ao checkout do repositório.

Exemplos de pedidos:

- “Melhore a hierarquia e o espaçamento do painel de personagem usando as skills locais.”
- “Revise a acessibilidade da busca, dos filtros e dos modais; apresente os achados antes de corrigir.”

`web-design-guidelines` consulta regras externas atualizadas a cada revisão. A cópia da skill é fixa, mas essas regras remotas podem mudar. Se não houver acesso à fonte, registre a limitação conforme `AGENTS.md`.

## Atualização deliberada

1. Consulte a revisão desejada no repositório original e examine o diff, os arquivos auxiliares e a licença.
2. Substitua apenas os arquivos da skill selecionada, preservando o conteúdo e as licenças aplicáveis.
3. Atualize os commits, hashes SHA-256 e data em `design-skills.json`, além dos links desta documentação.
4. Confira metadados e caminhos, execute `git diff --check` e registre a atualização em commit.

Não rode um instalador para todo o catálogo. Mudanças locais de comportamento devem ficar em `AGENTS.md`, mantendo rastreáveis as cópias de terceiros.
