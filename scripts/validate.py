#!/usr/bin/env python3
"""Validate the published data using only the Python standard library."""

import argparse
import calendar
from datetime import date
import re
import unicodedata
import json
import math
from pathlib import Path
import sys
from urllib.parse import urlsplit


DATA = Path(__file__).resolve().parents[1] / "data"
STATUSES = {
    "condenacao_anulada", "arquivado", "absolvido", "investigacao_em_curso",
    "fato_documentado", "associacao_indireta", "alegacao_nao_comprovada",
}
COLLECTIONS = {
    "nodes": "personagens", "edges": "conexoes", "sources": "fontes",
    "cases": "escandalos", "groups": "grupos",
}


def nonempty(value):
    return isinstance(value, str) and bool(value.strip())


def http_url(value):
    if not nonempty(value):
        return False
    try:
        parsed = urlsplit(value)
        return parsed.scheme.lower() in {"http", "https"} and bool(parsed.hostname)
    except ValueError:
        return False


def normalized(value):
    return ''.join(c for c in unicodedata.normalize('NFD', str(value).lower()) if unicodedata.category(c) != 'Mn')


def iso_date(value):
    try:
        return date.fromisoformat(value) if isinstance(value, str) and re.fullmatch(r'\d{4}-\d{2}-\d{2}', value) else None
    except ValueError:
        return None


def legal_violations(data, pages=None):
    """Pure legal audit; no network, mutations, or dependency on published files."""
    terms = json.loads(Path(__file__).with_name('termos.json').read_text(encoding='utf-8'))
    result = []
    cutoff = iso_date(data.get('dataset', {}).get('meta', {}).get('data_corte')) or date.today()
    sources = {s.get('id'): s for s in data.get('sources', []) if isinstance(s, dict)}
    def records(name):
        value = data.get(name, [])
        return [r for r in value if isinstance(r, dict)] if isinstance(value, list) else []
    def emit(n, r, message):
        result.append(dict(id=f'R{n:02}_{terms["regras"][n-1]}', nivel='aviso' if n in (12, 18) else 'erro', registro=str(r.get('id', '?')), mensagem=message))
    def text(r):
        return normalized(' '.join(strings(r)))
    def contains(value, words):
        return any(re.search(r'(?<!\w)' + re.escape(normalized(w)) + r'(?!\w)', normalized(value)) for w in words)
    def refs(r):
        return r.get('fontes') if isinstance(r.get('fontes'), list) else []
    def domain(url):
        try:
            return (urlsplit(url).hostname or '').lower()
        except (ValueError, TypeError):
            return ''
    def status(r):
        return r.get('status', r.get('categoria_juridica'))
    all_records = records('nodes') + records('edges') + records('cases')
    # Parecer lulagate-coleta-lgpd, regra 1
    for r in all_records:
        if not refs(r) or any(not isinstance(i, str) or i not in sources for i in refs(r)):
            emit(1, r, 'Fontes ausentes ou desconhecidas')
    for r in sources.values():
        host = domain(r.get('url'))
        # Parecer lulagate-coleta-lgpd, regra 2
        if not any(host == d or host.endswith('.' + d) for d in terms['dominios_permitidos']):
            emit(2, r, 'Domínio fora da lista permitida')
        # Parecer lulagate-coleta-lgpd, regra 3
        dt = iso_date(r.get('data'))
        if not (nonempty(r.get('veiculo')) and dt and dt <= cutoff and str(r.get('url', '')).startswith('https://') and host and http_url(r.get('url_arquivo')) and domain(r.get('url_arquivo')) in terms['arquivos_permitidos'] and iso_date(r.get('acesso_em'))):
            emit(3, r, 'Metadados da fonte incompletos ou inválidos')
        # Parecer lulagate-coleta-lgpd, regra 4
        if contains(text(r), terms['fontes_proibidas']) or domain(r.get('url')) in ('drive.google.com', 'docs.google.com'):
            emit(4, r, 'Possível fonte proibida')
    for r in records('nodes'):
        cls = r.get('classe_pessoa')
        # Parecer lulagate-coleta-lgpd, regra 5
        if cls not in ('agente_publico', 'pessoa_publica', 'pessoa_exposta', 'privada'):
            emit(5, r, 'Classe ausente ou inválida')
        # Parecer lulagate-coleta-lgpd, regra 6
        vehicles = {normalized(sources[i].get('veiculo', '')).strip() for i in refs(r) if isinstance(i, str) and i in sources} - {''}
        if cls in ('privada', 'pessoa_exposta') and len(vehicles) < 2:
            emit(6, r, 'Exige duas fontes de veículos ou órgãos distintos')
        # Parecer lulagate-coleta-lgpd, regra 7
        if cls == 'privada' and (len(str(r.get('relevancia_publica_direta') or '').strip()) < 30 or not r.get('revisao_humana')):
            emit(7, r, 'Relevância direta ou revisão humana ausente')
        # Parecer lulagate-coleta-lgpd, regra 8
        own = any(status(e) == 'fato_documentado' and r.get('id') in (e.get('origem'), e.get('destino')) and refs(e) for e in records('edges'))
        proximity = r.get('proximidade_lula', 0)
        if cls == 'privada' and not own and isinstance(proximity, (int, float)) and proximity > .29:
            emit(8, r, 'Proximidade privada sem vínculo documentado próprio')
    for r in all_records:
        # Parecer lulagate-coleta-lgpd, regra 9
        if status(r) not in STATUSES or any(r[k] not in STATUSES for k in ('status', 'categoria_juridica') if k in r):
            emit(9, r, 'Status ausente ou fora do vocabulário')
    for r in records('edges'):
        # Parecer lulagate-coleta-lgpd, regra 10
        if status(r) == 'associacao_indireta' and not any(sources.get(i, {}).get('menciona_ambos') is True for i in refs(r) if isinstance(i, str)):
            emit(10, r, 'Fonte conjunta não registrada')
        # Parecer lulagate-coleta-lgpd, regra 11
        inherited = r.get('fontes_herdadas', [])
        if not refs(r) or (isinstance(inherited, list) and all(i in inherited for i in refs(r))) or r.get('inferida_por_transitividade') is True:
            emit(11, r, 'Conexão sem evidência própria')
    for r in all_records:
        # Parecer lulagate-coleta-lgpd, regra 12
        dt = iso_date(r.get('data_referencia'))
        threshold = cutoff.replace(year=cutoff.year - 2, day=min(cutoff.day, calendar.monthrange(cutoff.year - 2, cutoff.month)[1]))
        if status(r) == 'investigacao_em_curso' and (not dt or dt < threshold):
            emit(12, r, 'Revisar investigação sem referência recente')
        # Parecer lulagate-coleta-lgpd, regra 13
        endings = {'absolvido': ['absolvid', 'absolvi'], 'arquivado': ['arquivad', 'arquivamento', 'trancad', 'prescri'], 'condenacao_anulada': ['anulad', 'anulacao']}
        if status(r) in endings and not any(w in normalized(r.get('resumo', '')) for w in endings[status(r)]):
            emit(13, r, 'Resumo sem desfecho explícito')
    for name in ('nodes', 'edges', 'cases', 'sources', 'groups'):
        for r in records(name):
            # Parecer lulagate-coleta-lgpd, regra 14
            patterns = [r'\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b', r'(?<!\d)(?:\+55\s*)?\(?\d{2}\)?[\s.-]*9?\d{4}[-\s]\d{4}(?!\d)', r'\b\d{5}-\d{3}\b', r'[\w.+-]+@[\w.-]+\.[a-z]{2,}', r'\b(?:rua|av\.|avenida)\s+[^\n,]{1,70},?\s+\d+\b']
            if any(re.search(pattern, value, re.I) for value in strings(r) for pattern in patterns):
                emit(14, r, 'Possível dado pessoal identificador')
            # Parecer lulagate-coleta-lgpd, regra 15
            if any(normalized(k) in terms['campos_proibidos'] for k in keys(r)):
                emit(15, r, 'Campo pessoal ou sensível proibido')
            # Parecer lulagate-coleta-lgpd, regra 20
            if any(k in ('sigilo', 'segredo_justica', 'segredo_de_justica') and v is True for k, v in items(r)) or 'segredo de justica' in text(r):
                emit(20, r, 'Material marcado como sigiloso')
    for r in records('nodes'):
        # Parecer lulagate-coleta-lgpd, regra 16
        birth = iso_date(r.get('data_nascimento'))
        age = r.get('idade')
        if r.get('menor_de_idade') is True or (isinstance(age, (int, float)) and age < 18) or (birth and (cutoff.year - birth.year - ((cutoff.month, cutoff.day) < (birth.month, birth.day))) < 18):
            emit(16, r, 'Pessoa menor de idade')
        public = r.get('classe_pessoa') in ('agente_publico', 'pessoa_publica')
        # Parecer lulagate-coleta-lgpd, regra 17
        if not public and (any('filiacao' in normalized(k) for k in keys(r)) or contains(text(r), ['filiado', 'filiada', 'filiação partidária'])):
            emit(17, r, 'Filiação de pessoa não pública')
        # Parecer lulagate-coleta-lgpd, regra 18
        if r.get('classe_pessoa') != 'agente_publico' and contains(r.get('resumo', ''), terms['lexico_sensivel']):
            emit(18, r, 'Possível informação sensível; revisão humana')
        # Parecer lulagate-coleta-lgpd, regra 21
        portrait = r.get('retrato', r.get('foto'))
        if portrait and (not public or not isinstance(portrait, dict) or normalized(portrait.get('licenca', '')) not in terms['licencas_livres'] or not http_url(portrait.get('url_origem'))):
            emit(21, r, 'Retrato sem classe pública, licença livre ou origem')
        # Parecer lulagate-coleta-lgpd, regra 22
        logs = [l for l in records('revisoes') if l.get('id') == r.get('id') and all(nonempty(l.get(k)) for k in ('revisor', 'decisao', 'motivo')) and iso_date(l.get('data')) and iso_date(l['data']) <= date.today() and (not iso_date(r.get('atualizado_em')) or iso_date(l['data']) >= iso_date(r['atualizado_em']))]
        if not logs:
            emit(22, r, 'Registro de revisão ausente ou desatualizado')
    # Parecer lulagate-coleta-lgpd, regra 19
    for r in all_records:
        # Only explicitly delimited, sourced quotations can exempt the quoted words.
        raw = ' '.join(strings(r))
        for quote in re.findall(r'["“]([^"”]+)["”]', raw):
            if any(isinstance(i, str) and i in sources for i in refs(r)):
                raw = raw.replace(quote, '')
        if contains(raw, terms['rotulos_proibidos']) or (contains(raw, [terms['vocabulario_controlado'][3].split()[0], 'condenada']) and status(r) not in ('condenacao_anulada',)):
            emit(19, r, 'Vocabulário incompatível com presunção de inocência')
    # Parecer lulagate-coleta-lgpd, regra 23
    for r in records('retificacoes'):
        if r.get('status') in ('aberto', 'aberta', 'pendente'):
            dt = iso_date(r.get('data', r.get('recebido_em')))
            if not dt or (date.today() - dt).days > 7:
                emit(23, r, 'Pedido aberto sem data válida ou há mais de sete dias')
    # Parecer lulagate-coleta-lgpd, regra 24
    for name in ('inicio', 'metodologia'):
        page = normalized((pages or {}).get(name, ''))
        plain = re.sub(r'<[^>]*>|[*_]', '', page)
        if not re.search(r'conexao(?:\s+\w+){0,5}\s+nao indica culpa', plain) or not re.search(r'(?:href\s*=\s*["\'][^"\']*retifica|\]\([^)]*retifica)', page):
            emit(24, {'id': name}, 'Aviso público ou link de retificação ausente')
    # Parecer lulagate-coleta-lgpd, regra 25
    for r in records('edges'):
        if status(r) != 'fato_documentado' and contains(' '.join(str(r.get(k, '')) for k in ('rotulo', 'descricao', 'resumo', 'tipo')), terms['imputacao_crime']) and not (nonempty(r.get('versao_do_citado')) or r.get('versao_nao_localizada') is True):
            emit(25, r, 'Imputação sem registro do contraditório')
    return result


def strings(value):
    if isinstance(value, str):
        yield value
    elif isinstance(value, dict):
        for child in value.values():
            yield from strings(child)
    elif isinstance(value, list):
        for child in value:
            yield from strings(child)


def items(value):
    if isinstance(value, dict):
        for k, v in value.items():
            yield k, v
            yield from items(v)
    elif isinstance(value, list):
        for v in value:
            yield from items(v)


def keys(value):
    return (k for k, _ in items(value))


def main(argv=None):
    parser = argparse.ArgumentParser()
    parser.add_argument("--mode", choices=("warn", "strict"), default="warn")
    parser.add_argument("--json", action="store_true", dest="json_output")
    parser.add_argument("--data-dir", type=Path, default=DATA)
    args = parser.parse_args(argv)
    data_dir = args.data_dir

    checks = {}
    errors = []

    def check(name, condition, message):
        checks.setdefault(name, True)
        if not condition:
            checks[name] = False
            errors.append(f"{name}: {message}")

    loaded = {}
    for name in (*COLLECTIONS, "dataset"):
        path = data_dir / f"{name}.json"
        try:
            value = json.loads(path.read_text(encoding="utf-8"))
            expected = dict if name == "dataset" else list
            check("File structure", isinstance(value, expected),
                  f"{path.name} must contain a {expected.__name__}")
            loaded[name] = value if isinstance(value, expected) else expected()
        except (OSError, UnicodeError, ValueError) as exc:
            check("File structure", False, f"{path.name}: {exc}")
            loaded[name] = {} if name == "dataset" else []

    indexes = {}
    seen_ids = set()
    for name in COLLECTIONS:
        indexes[name] = {}
        for position, record in enumerate(loaded[name]):
            label = f"{name}[{position}]"
            check("File structure", isinstance(record, dict), f"{label} must be an object")
            if not isinstance(record, dict):
                continue
            ident = record.get("id")
            valid = nonempty(ident)
            check("Unique IDs", valid, f"{label} needs a non-empty string id")
            if valid:
                check("Unique IDs", ident not in seen_ids, f"duplicate id {ident!r}")
                seen_ids.add(ident)
                indexes[name][ident] = record

    def records(name):
        return (r for r in loaded[name] if isinstance(r, dict))

    def references(record, field, target, label, group_objects=False):
        values = record.get(field)
        check("References", isinstance(values, list), f"{label}.{field} must be a list")
        if not isinstance(values, list):
            return
        for value in values:
            ident = value.get("grupo_id") if group_objects and isinstance(value, dict) else value
            check("References", isinstance(ident, str) and ident in indexes[target],
                  f"{label}.{field} references unknown id {ident!r}")

    for source in records("sources"):
        for field in ("url", "veiculo", "data"):
            check("Source fields", nonempty(source.get(field)),
                  f"source {source.get('id')!r} needs non-empty {field}")

    for name in ("edges", "cases"):
        for record in records(name):
            label = f"{name} {record.get('id')!r}"
            refs = record.get("fontes")
            check("Evidence", isinstance(refs, list) and bool(refs),
                  f"{label} needs a non-empty fontes list")
            sources = []
            for ident in refs if isinstance(refs, list) else []:
                source = indexes["sources"].get(ident) if isinstance(ident, str) else None
                check("Evidence", source is not None, f"{label} has unknown source {ident!r}")
                if source is not None:
                    sources.append(source)
            check("Evidence", any(http_url(s.get("url")) for s in sources),
                  f"{label} needs a source with a non-empty HTTP(S) URL")
            status = record.get("status")
            check("Statuses", isinstance(status, str) and status in STATUSES,
                  f"{label} has invalid status {status!r}")
            period = record.get("periodo")
            check("Periods", isinstance(period, dict), f"{label}.periodo must be an object")
            period = period if isinstance(period, dict) else {}
            if name == "edges":
                dated = any(nonempty(period.get(k)) for k in ("inicio", "fim"))
                check("Periods", dated or any(nonempty(s.get("data")) for s in sources),
                      f"{label} needs a period date or a source date")
                for field in ("origem", "destino"):
                    ident = record.get(field)
                    check("References", isinstance(ident, str) and ident in indexes["nodes"],
                          f"{label}.{field} references unknown node {ident!r}")
                references(record, "escandalos", "cases", label)
            else:
                check("Periods", nonempty(period.get("inicio")), f"{label} needs periodo.inicio")
                references(record, "personagens", "nodes", label)
                check("Lula's version", nonempty(record.get("versao_de_lula")),
                      f"{label} needs non-empty versao_de_lula")

    for node in records("nodes"):
        label = f"node {node.get('id')!r}"
        value = node.get("proximidade_lula")
        check("Proximity", type(value) in (int, float) and math.isfinite(value) and 0 <= value <= 1,
              f"{label}.proximidade_lula must be a number in [0, 1]")
        references(node, "grupos", "groups", label, group_objects=True)

    for name, key in COLLECTIONS.items():
        combined = loaded["dataset"].get(key)
        check("Dataset counts", isinstance(combined, list) and len(combined) == len(loaded[name]),
              f"dataset.{key}: expected {len(loaded[name])}, got "
              f"{len(combined) if isinstance(combined, list) else 'missing/non-list'}")

    for path in sorted(data_dir.rglob("*")):
        if path.is_file():
            try:
                content = path.read_bytes()
                for number, line in enumerate(content.splitlines(), 1):
                    check("No em dash", b"\xe2\x80\x94" not in line,
                          f"{path.relative_to(data_dir)}:{number} contains U+2014")
            except OSError as exc:
                check("No em dash", False, f"cannot read {path}: {exc}")

    for name in ("revisoes", "retificacoes"):
        try:
            loaded[name] = json.loads((data_dir / f"{name}.json").read_text(encoding="utf-8"))
        except (OSError, ValueError):
            loaded[name] = []
    def read_page(path):
        try:
            return path.read_text(encoding="utf-8")
        except OSError:
            return ""
    pages = {"inicio": read_page(data_dir.parent / "docs" / "index.html"),
             "metodologia": read_page(data_dir / "metodologia.md")}
    violations = legal_violations(loaded, pages)
    failed = bool(errors) or (args.mode == "strict" and any(v["nivel"] == "erro" for v in violations))
    if args.json_output:
        print(json.dumps({"mode": args.mode, "checks": checks, "errors": errors,
                          "violations": violations, "passed": not failed}, ensure_ascii=False))
    else:
        print("Counts: " + ", ".join(f"{name}={len(loaded[name])}" for name in COLLECTIONS))
        for name, passed in checks.items():
            print(f"{'PASS' if passed else 'FAIL'} {name}")
        print(f"Errors: {len(errors)}")
        for error in errors:
            print(f"- {error}")
        for ident in sorted({v["id"] for v in violations}):
            group = [v for v in violations if v["id"] == ident]
            print(f"{ident} ({group[0]['nivel']}): {len(group)}")
            for v in group[:5]:
                print(f"- {v['registro']}: {v['mensagem']}")
        print("Validation " + ("FAILED" if failed else "PASSED"))
    return int(failed)


if __name__ == "__main__":
    sys.exit(main())
