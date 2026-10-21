import copy
import unittest
import json
import tempfile
import subprocess
import sys
from pathlib import Path
from datetime import date, timedelta
from scripts import validate


class RulesTest(unittest.TestCase):
    def fixture(self):
        return dict(nodes=[dict(id='p', tipo='pessoa', classe_pessoa='agente_publico', fontes=['s'], status='fato_documentado', resumo='Registro público', proximidade_lula=0.1, grupos=[])], edges=[dict(id='e', origem='p', destino='p', status='fato_documentado', fontes=['s'], escandalos=[], periodo={})], cases=[], groups=[], sources=[dict(id='s', veiculo='G1', data='2026-01-01', url='https://g1.globo.com/a', url_arquivo='https://web.archive.org/web/20260101/https://g1.globo.com/a', acesso_em='2026-10-20')], dataset={'meta': {'data_corte': '2026-10-20'}}, revisoes=[dict(id='p', revisor='Ana', data='2026-10-20', decisao='aprovar', motivo='Conferido')], retificacoes=[])

    def check_rule(self, number, mutate):
        good = self.fixture()
        p, source = good['nodes'][0], good['sources'][0]
        if number in (6, 7, 8):
            p.update(classe_pessoa='privada', relevancia_publica_direta='Objeto central de reportagem sobre contrato público', revisao_humana='Ana')
            good['sources'].append(dict(source, id='s2', veiculo='BBC', url='https://bbc.com/a'))
            p['fontes'].append('s2')
        if number == 10:
            good['edges'][0]['status'] = 'associacao_indireta'
            source['menciona_ambos'] = True
        if number == 12:
            p.update(status='investigacao_em_curso', data_referencia='2026-10-20')
        if number == 13:
            p.update(status='absolvido', resumo='Foi absolvido no julgamento')
        if number == 16:
            p['idade'] = 18
        if number == 17:
            p['filiacao_partidaria'] = 'PT'
        if number == 20:
            source['sigilo'] = False
        if number == 18:
            p.update(classe_pessoa='privada', resumo='Registro público')
        if number == 19:
            p['resumo'] = 'A fonte disse "corrupto"'
        if number == 21:
            p['retrato'] = dict(licenca='CC-BY', url_origem='https://bbc.com/foto')
        if number == 23:
            good['retificacoes'] = [dict(id='r', status='aberto', data=date.today().isoformat())]
        if number == 25:
            good['edges'][0].update(status='investigacao_em_curso', descricao='Investigação de corrupção', versao_do_citado='Nega a acusação')
        pages = {'inicio': 'Conexão não indica culpa [Retificação](RETIFICACAO.md)', 'metodologia': 'Conexão não indica culpa [Retificação](RETIFICACAO.md)'}
        self.assertFalse(any(v['id'].startswith(f'R{number:02}_') for v in self.audit_tmp(good, pages)))
        bad = copy.deepcopy(good)
        mutate(bad, pages)
        self.assertTrue(any(v['id'].startswith(f'R{number:02}_') for v in self.audit_tmp(bad, pages)))

    def audit_tmp(self, data, pages):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            for name, value in data.items():
                (root / (name + '.json')).write_text(json.dumps(value), encoding='utf-8')
            loaded = {name: json.loads((root / (name + '.json')).read_text()) for name in data}
            return validate.legal_violations(loaded, pages)


def scenario(n):
    def change(d, pages):
        p, s = d['nodes'][0], d['sources'][0]
        if n == 1: p['fontes'] = ['missing']
        if n == 2: s['url'] = 'https://g1.globo.com.evil.test/a'
        if n == 3: s['data'] = '2027-01-01'
        if n == 4: s['titulo'] = 'exclusivo vazado'
        if n == 5: p.pop('classe_pessoa')
        if n == 6: p['fontes'] = ['s']
        if n == 7: p.pop('revisao_humana')
        if n == 8:
            p.update(classe_pessoa='privada', proximidade_lula=.9)
            d['edges'] = []
        if n == 9: p['status'] = 'culpado'
        if n == 10: s['menciona_ambos'] = False
        if n == 11: d['edges'] = [dict(id='e', fontes=['s'], fontes_herdadas=['s'])]
        if n == 12: p.update(status='investigacao_em_curso', data_referencia='2024-10-19')
        if n == 13: p['resumo'] = 'Registro público'
        if n == 14: p['resumo'] = 'Contato: 123.456.789-00'
        if n == 15: p['cpf'] = None
        if n == 16: p['idade'] = 17
        if n == 17: p.update(classe_pessoa='privada', filiacao_partidaria='PT')
        if n == 18: p.update(classe_pessoa='privada', resumo='Tratamento de câncer')
        if n == 19: p['resumo'] = 'É corrupto'
        if n == 20: s['sigilo'] = True
        if n == 21: p['retrato'] = {'url': 'https://example.org/photo'}
        if n == 22: d['revisoes'] = []
        if n == 23: d['retificacoes'] = [dict(id='r', status='aberto', data=(date.today() - timedelta(days=8)).isoformat())]
        if n == 24: pages['inicio'] = 'Sem aviso'
        if n == 25: d['edges'][0].pop('versao_do_citado')
    return change


for number in range(1, 26):
    setattr(RulesTest, f'test_R{number:02}_passa_e_viola', lambda self, n=number: self.check_rule(n, scenario(n)))

class ModesTest(unittest.TestCase):
    fixture = RulesTest.fixture
    audit_tmp = RulesTest.audit_tmp
    def run_cli(self, mode=None, warning_only=False, legacy_error=False):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            data_dir = root / 'data'
            data_dir.mkdir()
            (root / 'docs').mkdir()
            page = 'Conexão não indica culpa [Retificação](RETIFICACAO.md)'
            (root / 'docs/index.html').write_text(page)
            (data_dir / 'metodologia.md').write_text(page)
            d = self.fixture()
            d['dataset'].update({key: d[name] for name, key in validate.COLLECTIONS.items()})
            if warning_only:
                d['nodes'][0].update(status='investigacao_em_curso', data_referencia='2000-01-01')
            else:
                d['nodes'][0].pop('classe_pessoa')
            if legacy_error:
                d['nodes'][0]['proximidade_lula'] = 2
            for name, value in d.items():
                (data_dir / (name + '.json')).write_text(json.dumps(value))
            args = [sys.executable, str(Path(validate.__file__)), '--data-dir', str(data_dir), '--json']
            if mode:
                args += ['--mode', mode]
            proc = subprocess.run(args, text=True, capture_output=True)
            return proc.returncode, json.loads(proc.stdout)

    def test_modes_and_json(self):
        for mode in (None, 'warn'):
            code, report = self.run_cli(mode)
            self.assertEqual(code, 0)
            self.assertTrue(report['passed'])
            self.assertTrue(report['violations'])
        self.assertEqual(self.run_cli('strict')[0], 1)
        self.assertEqual(self.run_cli('strict', warning_only=True)[0], 0)
        for mode in ('warn', 'strict'):
            self.assertEqual(self.run_cli(mode, legacy_error=True)[0], 1)

    def test_contraditorio_alternatives(self):
        d = self.fixture()
        edge = d['edges'][0]
        edge.update(status='associacao_indireta', descricao='Acusação de corrupção', versao_nao_localizada=True)
        self.assertFalse(any(v['id'].startswith('R25') for v in self.audit_tmp(d, {})))
        edge['versao_nao_localizada'] = 'true'
        self.assertTrue(any(v['id'].startswith('R25') for v in self.audit_tmp(d, {})))
        edge['status'] = 'fato_documentado'
        self.assertFalse(any(v['id'].startswith('R25') for v in self.audit_tmp(d, {})))


if __name__ == '__main__':
    unittest.main()
