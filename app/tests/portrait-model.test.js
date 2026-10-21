import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {initials,portraitSource} from '../portrait-model.js';
const data=JSON.parse(readFileSync(new URL('../../data/dataset.json',import.meta.url)));
const credits=JSON.parse(readFileSync(new URL('../../data/creditos-imagens.json',import.meta.url)));

test('initials respect aliases, accents, particles and single names',()=>{
 for(const [person,expected] of [
  [{id:'lula',nome:'Luiz Inácio Lula da Silva'},'L'],
  [{nome:'José Aldemário Pinheiro Filho (Léo Pinheiro)'},'LP'],
  [{nome:'Marisa Letícia Lula da Silva'},'MS'],
  [{nome:'Érica de Sá'},'ÉS'],[{nome:'  Ana  '},'A'],[{nome:''},'?'],
 ])assert.equal(initials(person),expected);
});

test('portrait source supports relative and GitHub Pages bases and refuses remote or traversing paths',()=>{
 const person={retrato:{arquivo:'retratos/lula.webp'}};
 assert.equal(portraitSource(person),'./retratos/lula.webp');
 assert.equal(portraitSource(person,'/lulagate/'),'/lulagate/retratos/lula.webp');
 assert.equal(portraitSource(person,'/lulagate'),'/lulagate/retratos/lula.webp');
 assert.equal(portraitSource({}),null);
 for(const arquivo of ['https://commons.wikimedia.org/lula.webp','//example.org/lula.webp','../lula.webp','retratos/../lula.webp','/retratos/lula.webp'])assert.equal(portraitSource({retrato:{arquivo}}),null);
});

test('every supplied portrait maps to its person, local file and unchanged attribution',()=>{
 assert.equal(data.personagens.filter(p=>p.retrato).length,credits.length);
 for(const credit of credits){
  const person=data.personagens.find(p=>p.id===credit.pessoa_id);
  assert.equal(person.wikidata_qid,credit.qid);
  assert.match(portraitSource(person),/^data:image\/webp;base64,/);
  assert.ok(existsSync(new URL(`../public/${person.retrato.arquivo}`,import.meta.url)));
  for(const key of ['autor','licenca','licenca_url','url_origem','arquivo_commons'])assert.equal(person.retrato[key],credit[key]);
 }
 for(const person of data.personagens.filter(p=>!p.retrato)){assert.equal(portraitSource(person),null);assert.ok(initials(person).length>=1)}
});
