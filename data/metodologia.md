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
- A proximidade editorial usa sete rótulos verbais: família imediata ou convívio íntimo; círculo próximo; vínculo direto, forte e repetido; vínculo direto pontual ou apenas alegado; vínculo fraco ou indireto; apenas contexto; nenhum vínculo. Não é uma medida de culpa ou responsabilidade jurídica. Pontuações de pesquisa não são publicadas no dataset nem exibidas no painel.
- Valores são nominais, na moeda noticiada.
- Alegações sem fonte verificável ficaram de fora.

## Data de corte

21/10/2026.

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

## Documentos e órgãos oficiais

- Agência Câmara de Notícias
- Agência Senado
- Controladoria-Geral da União
- Presidência da República
- STF (LexML)
- Superior Tribunal de Justiça
- Supremo Tribunal Federal
- Supremo Tribunal Federal (via G1)
- TRF4
- Tribunal Superior Eleitoral (via Poder360)

## Categorias jurídicas dos nós

Cada pessoa possui um registro explícito `situacao`, com `categoria`, `fonte_id`, `data` (AAAA-MM-DD) e `texto`, editado em `scripts/situacoes.json`. Nenhuma categoria é derivada de palavras, regex, ocupação, casos, conexões ou pontuações. O build apenas copia o registro; os campos de compatibilidade `categoria_juridica` e `situacao_juridica` reproduzem sua categoria e seu texto.

O vocabulário é: condenado, réu, investigado, indiciado, condenação anulada, absolvido, arquivado, prescrição, atuação institucional ou profissional (não é parte) e situação não levantada por este mapa. Absolvição, arquivamento e prescrição são categorias distintas. Atuação institucional é usada para quem aparece nas fontes citadas como julgador, advogado, parlamentar da CPMI ou autoridade sem imputação naquele registro; não é uma certificação geral sobre outros processos. Na dúvida, registra-se `sem_informacao`, com o texto “Situação não levantada por este mapa”. Extinção por morte, indulto e ANPP são descritos em texto, sem forçar equivalência com as demais categorias.

Exceto nas categorias `sem_informacao` e `institucional`, a validação exige fonte existente com URL HTTP(S) e data ISO válida, não posterior a `meta.data_atualizacao`. A data identifica a referência da situação; quando a fonte só informa mês ou ano, usa-se a data da revisão editorial e isso não certifica nova consulta ao andamento processual. A revisão editorial global é de 21/10/2026. Afirmações cuja atualidade não foi reconfirmada são delimitadas pela data da fonte, especialmente prisões e manifestações da PGR. A validação estrutural não verifica disponibilidade remota ou o mérito das fontes.

Cor, forma e rótulo identificam a categoria; a categoria institucional usa cinza neutro. O tamanho representa o número de casos, não culpa ou gravidade. Os casos são separados entre “Casos em que Lula foi investigado ou réu” e “Casos de terceiros, contexto”. A presença de Lula num caso de terceiros não o torna parte na investigação.

ConJur é imprensa jurídica, não órgão oficial. A cópia de sentença hospedada no ConJur é identificada como cópia de decisão, com veículo de imprensa jurídica. Colunas de bastidor não equivalem a documentos oficiais. A fonte restrita da PF sobre Mapa da Mina foi substituída pela reportagem do Poder360 de 18/01/2022. A notícia inacessível da CGU sobre Rosemary foi substituída pelo ato de destituição no Diário Oficial da União; a URL pública do relatório administrativo não foi confirmada.

Retratos locais são miniaturas WebP de até 96 px, incorporadas ao dataset, com autor, licença, link de origem e indicação de redução no painel. A imagem social é criada localmente por `scripts/build_og.py`.

## Correções e direito de resposta

Se você é citado neste mapa e quer corrigir uma informação ou publicar sua versão, abra uma issue em https://github.com/prof-ramos/lulagate/issues. Informe o registro, o trecho e as fontes da correção. O prazo editorial de resposta é de até 48 horas no período eleitoral e 7 dias fora dele. Correções são publicadas no próprio registro e documentadas com data no [registro público de correções](https://github.com/prof-ramos/lulagate/blob/main/CHANGELOG-PR-B.md). O [PR A](https://github.com/prof-ramos/lulagate/blob/main/CHANGELOG-PR-A.md) registra as ocultações anteriores.

Contato por e-mail: **TODO: informar e-mail de contato do responsável**. Nenhum endereço de e-mail foi localizado nos READMEs do projeto; o canal de issues está disponível.

## Expediente

Autor e responsável editorial: Gabriel Ramos. Data de atualização: 21/10/2026. Contato: https://github.com/prof-ramos/lulagate/issues. E-mail: **TODO: informar e-mail de contato do responsável**.
