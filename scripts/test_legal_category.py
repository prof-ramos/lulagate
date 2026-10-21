"""Regression checks for conservative category derivation; run with python3."""
from legal_category import legal_category
sources={'valid':{'url':'https://example.org/source'},'invalid':{'url':''}}
def category(text,refs=['valid']): return legal_category({'situacao_juridica':text,'fontes':refs},sources)
assert category('Condenado.') == 'condenado'
assert category('Condenado.',[]) == 'sem_informacao'
assert category('Condenado.',['invalid']) == 'sem_informacao'
assert category('Não investigado, segundo as reportagens.') == 'sem_informacao'
assert category('Condenações anuladas pelo STF; absolvido em outra ação.') == 'condenacao_anulada'
assert category('Investigado. Processo anterior arquivado.') == 'investigado'
assert category('Processo anulado.') == 'sem_informacao'
assert category('Absolvido.') == 'absolvido_arquivado'
assert category('Réu da AP 470.') == 'sem_informacao'

print("Legal category regression checks: PASS")
