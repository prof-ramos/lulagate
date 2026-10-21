import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {LEGAL_RINGS,nodeSize} from '../graph-model.js';
import {graphElements,graphStyles} from '../cytoscape-model.js';
const data=JSON.parse(readFileSync(new URL('../../data/dataset.json',import.meta.url)));
test('dossier rings preserve categories and selection never replaces legal borders',()=>{
 assert.equal(LEGAL_RINGS.sem_informacao.color,'#D6D3CE');
 assert.deepEqual(LEGAL_RINGS.absolvido_arquivado,LEGAL_RINGS.condenacao_anulada);
 assert.ok(!data.personagens.some(p=>p.categoria_juridica==='reu'));
 const elements=graphElements(data.personagens,[]);
 for(const {data:p} of elements){assert.equal(p.size,nodeSize(p));assert.equal(p.ringStyle,LEGAL_RINGS[p.categoria_juridica].style);assert.ok(p.portrait.startsWith('data:image/'));}
 const styles=graphStyles({ink:'#1C1B19',accent:'#1F3A5F'});
 assert.equal(styles[0].style.shape,'ellipse');
 for(const style of styles.filter(s=>/selected|neighbor|focused/.test(s.selector)))assert.equal(style.style['border-color'],undefined);
 assert.equal(nodeSize({escandalos:[]}),32);assert.equal(nodeSize({escandalos:['a','b','c']}),64);assert.equal(nodeSize({id:'lula'}),88);
});
