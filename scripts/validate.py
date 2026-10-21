#!/usr/bin/env python3
"""Validate the published data using only the Python standard library."""

from legal_category import legal_category, CATEGORIES
from research import load_research
import base64
import csv
import re
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


def main():
    checks = {}
    errors = []

    def check(name, condition, message):
        checks.setdefault(name, True)
        if not condition:
            checks[name] = False
            errors.append(f"{name}: {message}")

    loaded = {}
    for name in (*COLLECTIONS, "dataset"):
        path = DATA / f"{name}.json"
        try:
            value = json.loads(path.read_text(encoding="utf-8"))
            expected = dict if name == "dataset" else list
            check("File structure", isinstance(value, expected),
                  f"{path.name} must contain a {expected.__name__}")
            loaded[name] = value if isinstance(value, expected) else expected()
        except (OSError, UnicodeError, ValueError) as exc:
            check("File structure", False, f"{path.name}: {exc}")
            loaded[name] = {} if name == "dataset" else []

    research = load_research()
    research_ids = {r['id'] for key in ('N', 'E') for r in research[key]}
    try:
        hidden = json.loads((DATA / 'ocultos.json').read_text(encoding='utf-8'))
        check("Hidden records", isinstance(hidden, list), "ocultos.json must be a list")
        hidden_ids = set()
        for entry in hidden:
            valid = isinstance(entry, dict)
            ident = entry.get('id') if valid else None
            check("Hidden records", valid and ident in research_ids and ident not in hidden_ids,
                  f"unknown or duplicate hidden id {ident!r}")
            check("Hidden records", valid and nonempty(entry.get('motivo')), f"{ident}: empty reason")
            check("Hidden records", valid and nonempty(entry.get('referencia')) and nonempty(entry.get('data')), f"{ident}: missing audit metadata")
            hidden_ids.add(ident)
        check("Hidden records", not hidden_ids.intersection(r['id'] for key in ('nodes', 'edges') for r in loaded[key]), "hidden record published")
    except (OSError, ValueError, TypeError) as exc:
        check("Hidden records", False, str(exc))

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
        category = node.get("categoria_juridica")
        check("Legal category", category in CATEGORIES and category == legal_category(node, indexes["sources"]), f"{label}: invalid category or missing valid person source")
        value = node.get("proximidade_lula")
        check("Proximity", type(value) in (int, float) and math.isfinite(value) and 0 <= value <= 1,
              f"{label}.proximidade_lula must be a number in [0, 1]")
        references(node, "grupos", "groups", label, group_objects=True)

    for name, key in COLLECTIONS.items():
        combined = loaded["dataset"].get(key)
        check("Dataset counts", isinstance(combined, list) and len(combined) == len(loaded[name]),
              f"dataset.{key}: expected {len(loaded[name])}, got "
              f"{len(combined) if isinstance(combined, list) else 'missing/non-list'}")

    # Image metadata is a local, auditable input; no Commons requests at runtime.
    try:
        credits = json.loads((DATA / "creditos-imagens.json").read_text(encoding="utf-8"))
        qids = json.loads((DATA / "wikidata-qids.json").read_text(encoding="utf-8"))
        with (DATA / "creditos-imagens.csv").open(encoding="utf-8", newline="") as handle:
            csv_credits = list(csv.DictReader(handle))
        check("Portrait credits", isinstance(credits, list), "credits must be a list")
        credits = credits if isinstance(credits, list) else []
        check("Portrait credits", csv_credits == credits, "CSV and JSON credits differ")
    except (OSError, ValueError) as exc:
        check("Portrait credits", False, str(exc))
        credits, qids = [], {}
    check("Wikidata", isinstance(qids, dict), "QID mapping must be an object")
    qids = qids if isinstance(qids, dict) else {}
    for ident, qid in qids.items():
        check("Wikidata", ident in research_ids and isinstance(qid, str) and bool(re.fullmatch(r"Q\d+", qid)),
              f"invalid mapping {ident!r}: {qid!r}")
    check("Wikidata", len(set(qids.values())) == len(qids), "duplicate people in QID mapping")
    credit_index, image_files = {}, set()
    fields = {"pessoa_id", "qid", "arquivo_commons", "autor", "licenca", "licenca_url", "url_origem", "arquivo_local"}
    for credit in credits:
        if not isinstance(credit, dict):
            check("Portrait credits", False, "credit must be an object")
            continue
        ident = credit.get("pessoa_id")
        check("Portrait credits", set(credit) == fields and all(nonempty(credit.get(k)) for k in fields - {"licenca_url"}) and isinstance(credit.get("licenca_url"), str),
              f"{ident}: missing or invalid credit fields")
        check("Portrait credits", isinstance(ident, str) and ident in indexes["nodes"] and ident not in credit_index,
              f"unknown or duplicate person {ident!r}")
        if not isinstance(ident, str):
            continue
        credit_index[ident] = credit
        check("Portrait license", bool(re.fullmatch(r"(?:CC0|Public domain|CC BY(?:-SA)? \d+\.\d+(?: [a-z]{2})?)", credit.get("licenca", ""))),
              f"{ident}: license must be free, without NC/ND")
        try:
            origin = urlsplit(credit.get("url_origem", ""))
            valid_origin = origin.scheme == "https" and origin.hostname == "commons.wikimedia.org" and not origin.username and not origin.password
        except ValueError:
            valid_origin = False
        check("Portrait origin", valid_origin, f"{ident}: origin must be HTTPS Wikimedia Commons")
        check("Portrait license", http_url(credit.get("licenca_url")) or credit.get("licenca") in {"CC0", "Public domain"} and credit.get("licenca_url") == "", f"{ident}: invalid license URL")
        filename = credit.get("arquivo_local", "")
        safe = isinstance(filename, str) and bool(re.fullmatch(r"[a-z0-9-]+\.webp", filename))
        check("Portrait files", safe and (DATA.parent / "app/public/retratos" / filename).is_file(),
              f"{ident}: missing or invalid local image {filename!r}")
        check("Portrait files", filename not in image_files, f"duplicate image {filename!r}")
        image_files.add(filename)
        check("Wikidata", credit.get("qid") == qids.get(ident) and ident in qids,
              f"{ident}: credit QID differs from mapping")
    actual_images = {p.name for p in (DATA.parent / "app/public/retratos").glob("*.webp")}
    check("Portrait files", actual_images == image_files, "local images and credits must correspond exactly")
    dataset_people = loaded["dataset"].get("personagens", [])
    check("Dataset consistency", dataset_people == loaded["nodes"], "dataset.personagens differs from nodes.json")
    for node in records("nodes"):
        ident = node["id"]
        qid = node.get("wikidata_qid")
        check("Wikidata", "wikidata_qid" in node and (qid is None or isinstance(qid, str) and bool(re.fullmatch(r"Q\d+", qid))) and qid == qids.get(ident),
              f"{ident}: invalid or inconsistent QID")
        credit = credit_index.get(ident)
        expected = dict(arquivo="retratos/" + credit["arquivo_local"], **{k: credit.get(k) for k in ("autor", "licenca", "licenca_url", "url_origem", "arquivo_commons")}) if credit and isinstance(credit.get("arquivo_local"), str) else None
        if expected:
            expected["base64"] = "data:image/webp;base64," + base64.b64encode((DATA.parent / "app/public/retratos" / credit["arquivo_local"]).read_bytes()).decode()
        check("Portrait mapping", "retrato" in node and node.get("retrato") == expected,
              f"{ident}: portrait differs from credits or has no credits")

    for path in sorted(DATA.rglob("*")):
        if path.is_file():
            try:
                content = path.read_bytes()
                for number, line in enumerate(content.splitlines(), 1):
                    check("No em dash", b"\xe2\x80\x94" not in line,
                          f"{path.relative_to(DATA)}:{number} contains U+2014")
            except OSError as exc:
                check("No em dash", False, f"cannot read {path}: {exc}")

    print("Counts: " + ", ".join(f"{name}={len(loaded[name])}" for name in COLLECTIONS))
    for name, passed in checks.items():
        print(f"{'PASS' if passed else 'FAIL'} {name}")
    print(f"Errors: {len(errors)}")
    for error in errors:
        print(f"- {error}")
    print("Validation " + ("FAILED" if errors else "PASSED"))
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main())
