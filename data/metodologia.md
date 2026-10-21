# Metodologia

Todas as informações deste mapa vêm de reportagens já publicadas por veículos de imprensa estabelecidos ou de documentos oficiais (STF, STJ, TRF4, PF, CGU, TCU, Câmara, Senado, Presidência, TSE). Nomes, datas, valores, conexões e situações jurídicas são os que essas fontes noticiaram até a data de corte. O mapa não traz apuração própria nem informação inédita.

## Avisos importantes

- **Uma conexão neste mapa não indica culpa.** Vínculos familiares, funcionais, políticos, sociais ou de negócios são registrados porque foram documentados, não porque provem crime.
- Cada caso e cada conexão traz um campo `status`: `condenacao_anulada`, `arquivado` (inclui ações trancadas e prescritas), `absolvido`, `investigacao_em_curso`, `fato_documentado`, `associacao_indireta` e `alegacao_nao_comprovada`.
- Lula nega as acusações. Sua versão está no campo `versao_de_lula` de cada caso; quando não foi localizada manifestação dele nas fontes, isso é dito explicitamente.
- **Até a data de corte, Lula não tem condenação vigente.** As condenações do triplex do Guarujá (2017/2018) e do sítio de Atibaia (2019) foram anuladas pelo STF em 2021: em 08/03/2021 o ministro Edson Fachin declarou a incompetência da 13ª Vara Federal de Curitiba (HC 193.726), e em 23/06/2021 o Plenário confirmou a suspeição de Sergio Moro (HC 164.493). Os casos foram depois encerrados por prescrição na Justiça Federal do DF. As ações do Instituto Lula e do caso Gripen foram trancadas pelo STF em 2023. Lula foi absolvido nos casos quadrilhão do PT (2019), obstrução de Justiça (2018) e Zelotes/MP 471 (2021).
- Anulação, arquivamento e trancamento não equivalem a absolvição de mérito; o mapa registra exatamente o desfecho processual noticiado.
- Relatórios de CPI/CPMI não indiciam nem condenam: registram sugestões às autoridades. Alegações de testemunhas citadas nesses relatórios aparecem como `alegacao_nao_comprovada`.
- Investigações sobre parentes (Lulinha, Frei Chico) não envolvem Lula como investigado.

## Critérios

- Cada caso e cada conexão tem pelo menos uma fonte com URL, veículo e data.
- Proximidade (`proximidade_lula`, de 0 a 1) em sete faixas: 0,90 a 1,00 família imediata ou convívio íntimo; 0,70 a 0,89 círculo próximo; 0,50 a 0,69 vínculo direto, forte e repetido; 0,30 a 0,49 vínculo direto pontual ou apenas alegado; 0,10 a 0,29 vínculo fraco ou indireto; 0,01 a 0,09 apenas contexto; 0 nenhum vínculo. Os valores são atribuição editorial a partir dos vínculos documentados, não cálculo automático nem medida de culpa.
- `nivel_juridico` (0 a 4) é escala separada sobre a situação jurídica da própria pessoa.
- Valores são nominais, na moeda noticiada.
- Alegações sem fonte verificável ficaram de fora.

## Data de corte

20/10/2026.

## Veículos de imprensa (19)

- Agência Brasil
- BBC News Brasil
- CNN Brasil
- Consultor Jurídico (ConJur)
- DW Brasil
- Estadão
- Estadão (Blog do Fausto Macedo)
- Folha de S.Paulo
- Folha de S.Paulo (Mônica Bergamo)
- G1
- G1 (Jornal Nacional)
- Gazeta do Povo
- Metrópoles
- O Globo
- O Globo (Lauro Jardim)
- Poder360
- R7
- UOL
- Valor Econômico

## Documentos e órgãos oficiais (12)

- Agência Câmara de Notícias
- Agência Senado
- Consultor Jurídico (ConJur)
- Controladoria-Geral da União
- Polícia Federal
- Presidência da República
- STF (LexML)
- Superior Tribunal de Justiça
- Supremo Tribunal Federal
- Supremo Tribunal Federal (via G1)
- TRF4
- Tribunal Superior Eleitoral (via Poder360)

## Categorias jurídicas dos nós

O build deriva `categoria_juridica` apenas de `situacao_juridica` da própria pessoa e exige pelo menos uma referência em `fontes` que exista em `sources.json` (a coleção de fontes deste projeto) com URL HTTP(S) e host. A validação é estrutural e não verifica disponibilidade remota. Status de conexões, casos, ocupações e nível jurídico não atribuem categoria à pessoa.

Categorias declaradas explicitamente na pesquisa, com fontes próprias, têm precedência sobre a inferência textual. “Pena extinta (indulto)” registra a extinção da pena da AP 470 de José Dirceu; o painel também informa as anulações e a prescrição na Lava Jato. Indulto não equivale a absolvição.

A regra de inferência, em ordem: menção explícita a condenação ou condenações anuladas; investigado ou investigada (exceto “não investigado”); condenado ou condenada; absolvido, arquivado, trancado ou ação penal encerrada. Os dois últimos desfechos compartilham a categoria “Absolvido / arquivado” apenas para navegação, sem equivalência jurídica. As demais situações e pessoas sem fonte válida recebem “Sem informação”, que significa ausência de classificação nestas categorias, não ausência de antecedentes. O texto original continua em destaque no painel. Anulação de processo, sem menção explícita a condenação anulada, não basta para essa categoria. A ordem resolve textos com múltiplos desfechos e não representa uma conclusão jurídica atualizada além do dataset.

As cores identificam essas seis categorias, acompanhadas de nomes e contagens nos filtros. O tamanho dos nós representa o número de casos associados, com destaque adicional para Lula; não representa culpa ou gravidade. A seleção destaca as conexões imediatas e esmaece o restante.

Retratos locais são miniaturas WebP de até 96 px, incorporadas em base64 ao dataset pelo build, com créditos preservados. A imagem social é criada localmente por `scripts/build_og.py`.
