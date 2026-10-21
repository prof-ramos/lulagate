# Auditoria das regras do parecer lulagate-coleta-lgpd

Implementação da seção “Regras para validate.py” do parecer de 21/10/2026,
com 25 regras. Não substitui revisão editorial ou jurídica.

Uso: `python3 scripts/validate.py [--mode warn|strict] [--json]`.
`warn` é o padrão: regras novas são reportadas sem alterar a saída 0 das
checagens antigas aprovadas. `strict` retorna 1 para erros novos; R12 e R18
são avisos. As checagens antigas continuam bloqueantes em ambos os modos.
A saída textual agrupa por ID, com contagem e até cinco exemplos. JSON contém
todas as violações, nível, registro, mensagem, checagens antigas e resultado.
`--data-dir` permite testar coleções isoladas; a página inicial é procurada em
`docs/index.html` no diretório pai da pasta de dados.

## Contrato de dados

`data/schema.json` usa JSON Schema 2020-12 e descreve um objeto com as coleções
`nodes`, `edges`, `cases`, `sources`, `groups`, `dataset`, `revisoes` e
`retificacoes`. Cada definição também pode ser referenciada individualmente.
Campos existentes foram inferidos dos registros, inclusive estruturas aninhadas.
Os novos campos são opcionais no schema para compatibilidade estrutural;
as regras exigem seu preenchimento quando aplicável. O script usa apenas a
biblioteca padrão e não executa um motor genérico de JSON Schema.

- Pessoa: `classe_pessoa`, `relevancia_publica_direta`, `revisao_humana`,
  `status` ou `categoria_juridica`. `atualizado_em` permite verificar a data
  da revisão. `retrato` (ou `foto`) é objeto com `licenca` e `url_origem`.
- Fonte: `url_arquivo`, `acesso_em` e **`menciona_ambos` ficam em sources.json**.
  `menciona_ambos: true` declara que a fonte menciona os dois extremos da
  conexão indireta que a referencia. Se a fonte for reutilizada, o editor
  precisa conferir todos esses pares; o booleano não identifica o par.
- Aresta: `versao_do_citado` é texto não vazio; alternativamente,
  `versao_nao_localizada` deve ser o booleano `true`. `fontes_herdadas` lista
  fontes obtidas apenas de outras arestas; `inferida_por_transitividade: true`
  registra inferência vedada.
- Revisão: `id` da pessoa, `revisor`, `data` ISO, `decisao`, `motivo`.
  Sem histórico de alterações confiável, R22 exige revisão de todas as pessoas;
  havendo `atualizado_em`, a revisão deve ser posterior ou da mesma data.
- Retificação: `id`, `status` (`aberto`, `aberta` ou `pendente` enquanto aberta),
  `data` ISO de recebimento (ou `recebido_em`). O prazo usa a data real da
  execução, inclusive para datasets com corte histórico. Encerramento é
  declaração editorial; o script não comprova o atendimento.

## Heurísticas e limites

| Regras | Verificação e limite |
| --- | --- |
| R01 | Referências não vazias e IDs existentes; não comprova conteúdo da fonte. |
| R02 | Domínios estáticos em termos.json, derivados dos veículos e órgãos permitidos na metodologia. Aceita subdomínios por fronteira de ponto; não segue redirecionamentos. Veículos de um mesmo grupo podem compartilhar domínio. |
| R03 | Datas ISO válidas, publicação até o corte, HTTPS e arquivo em serviço permitido. Não acessa URL nem comprova captura. |
| R04 | Léxico e URLs de vazamento/Drive; não determina origem ilícita ou autenticidade. |
| R05–R07 | Classe declarada, contagem de veículos distintos e justificativa de 30 caracteres mais revisão humana não vazia. Nomes diferentes não garantem independência societária/editorial; a justificativa deve ser avaliada por pessoa. |
| R08 | Procura aresta incidente, documentada e com fontes. Não comprova que o conteúdo sustenta a proximidade atribuída. |
| R09 | Vocabulário fechado já existente no projeto; aceita status ou categoria_juridica e valida ambos se presentes. Não infere status de texto livre. |
| R10–R11 | Declaração de fonte conjunta e de fontes herdadas. Compartilhar fontes entre arestas não é, sozinho, prova de transitividade. Inferência não declarada pode escapar. |
| R12 | Corte menos dois anos de calendário; data ausente também gera aviso. Não consulta andamento judicial. |
| R13 | Radicais de desfecho no resumo; não mede destaque visual, veracidade ou negações. |
| R14 | Percorre textos aninhados das cinco coleções: CPF, telefone, CEP, e-mail e endereço com número. Pode sinalizar e-mail institucional ou número legítimo e não detectar identificadores ofuscados. |
| R15 | Chaves proibidas em qualquer profundidade, mesmo vazias; não identifica sinônimos desconhecidos. |
| R16 | Idade declarada, nascimento ou flag. Ausência desses campos não comprova maioridade; nascimento continua proibido por R15. |
| R17 | Chaves de filiação e expressões de filiação; cargo político e identidade pública exigem classificação editorial correta. |
| R18 | Léxico sensível no resumo de quem não está classificado como agente_publico, incluindo pessoa_publica; gera somente aviso. Não detecta toda inferência sensível. |
| R19 | Rótulos proibidos e “condenado/condenada”. Aspas literais com referência a fonte válida isentam o trecho citado; não comprovam atribuição ou fidelidade. No vocabulário fechado atual, condenacao_anulada é o status compatível com menção histórica a condenação; demais casos exigem revisão editorial. Os termos controlados são referência de redação, não obrigação de conter todas as expressões. |
| R20 | Flags sigilo/segredo_justica/segredo_de_justica e expressão segredo de justiça. Não verifica processos nem distingue negação textual. |
| R21 | Classe pública, nome de licença livre da lista e URL de origem; não comprova direitos autorais. |
| R22 | Log completo de todas as pessoas e data, quando atualização conhecida. Não verifica identidade do revisor nem histórico Git. |
| R23 | Pedidos abertos por mais de sete dias corridos; exatamente sete dias não falha. Data ausente/inválida em pedido aberto também falha. |
| R24 | Aviso literal normalizado (aceita “conexão neste mapa não indica culpa”) e link HTML/Markdown cujo destino contenha retifica, nas duas páginas. Não verifica destino, renderização, proeminência ou canal de e-mail. |
| R25 | Léxico de imputação em rotulo, descricao, resumo e tipo de aresta com status diferente de fato_documentado. Exige versão não vazia ou booleano de busca sem resultado. Não avalia imputação implícita, negação, qualidade da resposta ou diligência da busca. |

O vocabulário controlado, termos proibidos, léxico sensível, imputações,
licenças e domínios ficam em `scripts/termos.json`. Mudanças editoriais nessas
listas devem ser revistas em conjunto com as regras. Datas do conteúdo usam
`dataset.meta.data_corte`; na ausência de corte válido usa-se a data da execução.
Os arquivos de dados existentes e as páginas públicas não são corrigidos pelo
validador. Os logs começam vazios, de modo que R22 aponta a revisão pendente.
