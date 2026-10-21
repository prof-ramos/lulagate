"""Conservative display categories, derived exclusively from a person's own status."""
import re
from urllib.parse import urlsplit
CATEGORIES = {'pena_extinta_indulto': 'Pena extinta (indulto)', 'condenado': 'Condenado', 'condenacao_anulada': 'Condenação anulada', 'investigado': 'Investigado', 'absolvido_arquivado': 'Absolvido / arquivado', 'sem_informacao': 'Sem informação'}
def valid_source(source):
    try:
        url = urlsplit(source.get('url', ''))
        return url.scheme in ('http', 'https') and bool(url.hostname)
    except ValueError:
        return False

def legal_category(person, sources):
    if not any(valid_source(sources.get(s, {})) for s in person.get('fontes', [])):
        return 'sem_informacao'
    explicit = person.get('categoria_juridica_declarada')
    if explicit in CATEGORIES:
        return explicit
    text = person.get('situacao_juridica', '').lower()
    if re.search(r'condena(?:ção|ções).*anulad', text):
        return 'condenacao_anulada'
    if re.search(r'\binvestigad[oa]\b', text) and not re.search(r'\bnão investigad', text):
        return 'investigado'
    if re.search(r'\bcondenad[oa]\b', text):
        return 'condenado'
    if re.search(r'absolvid|arquivad|trancad|ação penal encerrada', text):
        return 'absolvido_arquivado'
    return 'sem_informacao'
