import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const data=JSON.parse(await readFile(new URL('../../data/dataset.json',import.meta.url),'utf8'));
test('publication excludes hidden allegations, people and restricted PF source',()=>{
 assert.doesNotMatch(JSON.stringify(data),/luchsinger|referência retirada/i);
 const dirceu=data.personagens.find(p=>p.id==='jose-dirceu');
 assert.equal(dirceu.categoria_juridica,'pena_extinta_indulto');assert.match(dirceu.resumo,/^Pena da AP 470 extinta/);
 for(const id of ['kalil-bittar','jonas-suassuna']){
  const person=data.personagens.find(p=>p.id===id);assert.equal(person.categoria_juridica,'absolvido_arquivado');assert.ok(person.fontes.includes('poder360-2022-01-mapa'));
 }
 assert.equal(data.personagens.find(p=>p.id==='delubio-soares').categoria_juridica,'sem_informacao');
});

test('hidden connection IDs never reach publication',()=>{
 for(const id of ['con-054','con-071']) assert.ok(!data.conexoes.some(e=>e.id===id));
 const edge=data.conexoes.find(e=>e.id==='con-006');
 for(const field of ['rotulo','descricao']) {assert.match(edge[field],/pena da AP 470 extinta por indulto/i); assert.match(edge[field],/Lula não foi denunciado/);}
 assert.ok(edge.fontes.includes('pr-a-factcheck-01'));
});
