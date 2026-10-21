"""Load research inputs without writing published artifacts."""
from pathlib import Path

def load_research():
    root = Path(__file__).resolve().parents[1]
    scope = {"__file__": str(root / "scripts/build.py")}
    for name in ("build_sources.py", "build_nodes.py", "build_edges.py", "build_cases.py", "build_extra.py"):
        path = root / "scripts" / name
        exec(compile(path.read_text(), str(path), "exec"), scope)
    return scope
