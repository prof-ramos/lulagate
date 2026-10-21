import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const data=JSON.parse(await readFile(new URL('../../data/dataset.json',import.meta.url),'utf8'));
test('publication excludes hidden allegations, people and restricted PF source',()=>{
 assert.doesNotMatch(JSON.stringify(data),/luchsinger|mesada|mantega-lobby|pf-2019-12-10-mapa/i);
 const dirceu=data.personagens.find(p=>p.id==='jose-dirceu');
 assert.equal(dirceu.categoria_juridica,'pena_extinta_indulto');assert.match(dirceu.resumo,/^Pena da AP 470 extinta/);
 for(const id of ['kalil-bittar','jonas-suassuna']){
  const person=data.personagens.find(p=>p.id===id);assert.equal(person.categoria_juridica,'absolvido_arquivado');assert.ok(person.fontes.includes('poder360-2022-01-mapa'));
 }
 assert.equal(data.personagens.find(p=>p.id==='delubio-soares').categoria_juridica,'sem_informacao');
});
