import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {nodeSize,LEGAL_COLORS} from '../graph-model.js';
const data=JSON.parse(readFileSync(new URL('../../data/dataset.json',import.meta.url)));
test('situations are explicit, sourced and dated; no public numerical scores',()=>{
 const sources=new Map(data.fontes.map(s=>[s.id,s]));
 const authored=JSON.parse(readFileSync(new URL('../../scripts/situacoes.json',import.meta.url)));
 for(const p of data.personagens){
  assert.deepEqual(p.situacao,authored[p.id]);
  assert.equal(p.categoria_juridica,p.situacao.categoria);
  assert.ok(LEGAL_COLORS[p.situacao.categoria]);
  assert.ok(p.situacao.texto.trim());
  assert.equal('proximidade_lula' in p,false);assert.equal('nivel_juridico' in p,false);
  if(!['sem_informacao','institucional'].includes(p.situacao.categoria)){
   assert.match(sources.get(p.situacao.fonte_id)?.url,/^https?:\/\//);
   assert.match(p.situacao.data,/^\d{4}-\d{2}-\d{2}$/);
   assert.ok(p.situacao.data<=data.meta.data_atualizacao);
  }
 }
});
test('size grows with case count, Lula retains prominence',()=>{
 assert.ok(nodeSize({escandalos:['a','b']})>nodeSize({escandalos:['a']}));
 assert.ok(nodeSize({id:'lula'})>Math.max(...data.personagens.filter(p=>p.id!=='lula').map(nodeSize)));
});
test('embedded portraits preserve WebP binary data',()=>{
 for(const p of data.personagens.filter(p=>p.retrato)){
  const bytes=Buffer.from(p.retrato.base64.split(',')[1],'base64');
  assert.equal(bytes.toString('ascii',0,4),'RIFF');assert.equal(bytes.toString('ascii',8,12),'WEBP');
  assert.deepEqual(bytes,readFileSync(new URL(`../public/${p.retrato.arquivo}`,import.meta.url)));
 }
});
