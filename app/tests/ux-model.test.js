import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {nodeSize,LEGAL_COLORS} from '../graph-model.js';
const data=JSON.parse(readFileSync(new URL('../../data/dataset.json',import.meta.url)));
test('legal categories require person evidence and conservative explicit text',()=>{
 const sources=new Map(data.fontes.map(s=>[s.id,s]));
 for(const p of data.personagens){assert.ok(LEGAL_COLORS[p.categoria_juridica]);if(p.categoria_juridica!=='sem_informacao')assert.ok(p.fontes.some(id=>/^https?:\/\//.test(sources.get(id)?.url)))}
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
