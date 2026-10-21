#!/usr/bin/env python3
"""Validate the published data using only the Python standard library."""

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
