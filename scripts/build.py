import json,os
B='/workspace/lulagate/scripts/'
for f in ['build_sources.py','build_nodes.py','build_edges.py','build_cases.py','build_extra.py']: exec(open(B+f).read())
D='/workspace/lulagate/data'
SD={k:v['data'] for k,v in S.items()}
for e in E:
    if e['periodo'] is None: e['periodo']=dict(inicio=None,fim=None)
    e['data_referencia']=SD[e['fontes'][0]]
for c in C: c['conexoes']=[e['id'] for e in E if c['id'] in e['escandalos']]
for n in N:
    n['escandalos']=sorted({x for e in E if n['id'] in (e['origem'],e['destino']) for x in e['escandalos']}|{c['id'] for c in C if n['id'] in c['personagens']})
    n['conexoes']=[e['id'] for e in E if n['id'] in (e['origem'],e['destino'])]
escala={'0.90–1.00':'Família imediata ou convívio íntimo','0.70–0.89':'Círculo próximo','0.50–0.69':'Vínculo direto, forte e repetido','0.30–0.49':'Vínculo direto pontual ou apenas alegado','0.10–0.29':'Vínculo fraco ou indireto','0.01–0.09':'Apenas contexto','0':'Nenhum vínculo'}
def faixa(v):
    for k in ['0.90','0.70','0.50','0.30','0.10','0.01']:
        if v>=float(k): return next(x for x in escala if x.startswith(k))
    return '0'
for n in N: n['faixa_proximidade']=escala[faixa(n['proximidade_lula'])]
legenda={'condenacao_anulada':'Condenação anulada','arquivado':'Arquivado ou trancado','absolvido':'Absolvido','investigacao_em_curso':'Investigação em curso','fato_documentado':'Fato documentado','associacao_indireta':'Associação indireta','alegacao_nao_comprovada':'Alegação não comprovada'}
sources=list(S.values())
meta=dict(titulo='Lula Gate',idioma='pt-BR',data_corte='2026-10-20',versao='0.1.0',personagem_central='lula',legenda_status=legenda,proximidades=dict(campo='proximidade_lula',escala=escala),
 leitura_conexoes="Cada conexão vai de 'origem' para 'destino'; o 'rotulo' descreve o que a origem é em relação ao destino.")
for name,obj in [('nodes',N),('edges',E),('sources',sources),('cases',C),('groups',groups)]:
    json.dump(obj,open(f'{D}/{name}.json','w'),ensure_ascii=False,indent=2)
meta['metodologia']=open(D+'/metodologia.md').read() if os.path.exists(D+'/metodologia.md') else None
json.dump(dict(meta=meta,personagens=N,conexoes=E,escandalos=C,grupos=groups,fontes=sources),open(f'{D}/dataset.json','w'),ensure_ascii=False,indent=2)
print(len(N),len(E),len(C),len(sources),len(groups))
