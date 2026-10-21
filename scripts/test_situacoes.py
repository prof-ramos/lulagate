"""Regression checks: invalid situations must fail validation, never be inferred."""
import contextlib
import copy
import io
import json
from pathlib import Path
import tempfile
import unittest
import validate

ROOT = Path(__file__).resolve().parents[1]


class ExplicitSituationValidation(unittest.TestCase):
    def rejects(self, edit):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            data = root / 'data'
            data.mkdir()
            (root / 'scripts').symlink_to(ROOT / 'scripts', target_is_directory=True)
            (root / 'app').symlink_to(ROOT / 'app', target_is_directory=True)
            for path in (ROOT / 'data').iterdir():
                if path.is_file():
                    (data / path.name).symlink_to(path)
            nodes = json.loads((ROOT / 'data/nodes.json').read_text())
            dataset = json.loads((ROOT / 'data/dataset.json').read_text())
            edit(nodes[0])
            dataset['personagens'] = copy.deepcopy(nodes)
            for name, value in [('nodes', nodes), ('dataset', dataset)]:
                (data / f'{name}.json').unlink()
                (data / f'{name}.json').write_text(json.dumps(value, ensure_ascii=False))
            old = validate.DATA
            try:
                validate.DATA = data
                with contextlib.redirect_stdout(io.StringIO()):
                    self.assertEqual(validate.main(), 1)
            finally:
                validate.DATA = old

    def test_missing_situation_is_not_inferred_from_text(self):
        self.rejects(lambda p: p.pop('situacao'))

    def test_invalid_category(self):
        self.rejects(lambda p: p['situacao'].update(categoria='absolvido_arquivado'))

    def test_missing_source(self):
        self.rejects(lambda p: p['situacao'].update(fonte_id='inexistente'))

    def test_invalid_date(self):
        self.rejects(lambda p: p['situacao'].update(data='2026-02-30'))

    def test_future_date(self):
        self.rejects(lambda p: p['situacao'].update(data='2026-10-22'))

    def test_public_score(self):
        self.rejects(lambda p: p.update(proximidade_lula=0.5))


if __name__ == '__main__':
    unittest.main()
