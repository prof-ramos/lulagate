import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {personFromSearch} from '../url-model.js';
import {openingPeople,readableLabels} from '../mobile-model.js';
const data=JSON.parse(readFileSync(new URL('../../data/dataset.json',import.meta.url)));
test('canonical dataset counts remain exact',()=>{
 assert.deepEqual([data.personagens.length,data.conexoes.length,data.escandalos.length,data.fontes.length],[63,78,18,103]);
});
test('mobile opening includes Lula and nine most connected people deterministically',()=>{
 const ids=openingPeople(data.personagens,data.conexoes);assert.equal(ids.length,10);assert.equal(ids[0],'lula');
 assert.deepEqual(ids,openingPeople([...data.personagens].reverse(),data.conexoes));
 const degree=id=>data.conexoes.filter(e=>e.origem===id||e.destino===id).length;
 assert.ok(Math.min(...ids.slice(1).map(degree))>=Math.max(...data.personagens.filter(p=>!ids.includes(p.id)).map(p=>degree(p.id))));
});
test('screen label collision prioritizes selected people and reveals context on zoom',()=>{
 const nodes=[{id:'a',label:'Nome longo',x:0,y:0,priority:0},{id:'b',label:'Selecionado',x:0,y:0,priority:3},{id:'c',label:'Contexto',x:300,y:0,priority:0}];
 assert.deepEqual(readableLabels(nodes,.5),['b']);assert.deepEqual(readableLabels(nodes,1),['b','c']);
});
test('OG contains absolute site and image URLs and descriptive text',()=>{
 const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
 for(const name of ['title','description','image','url'])assert.match(html,new RegExp(`property="og:${name}" content="[^" ]`));
 for(const name of ['image','url']){
  const value=html.match(new RegExp(`property="og:${name}" content="([^"]+)"`))[1];
  const url=new URL(value);assert.equal(url.origin,'https://prof-ramos.github.io');assert.ok(url.pathname.startsWith('/lulagate/'));
 }
 const image=readFileSync(new URL('../public/og.png',import.meta.url));assert.equal(image.readUInt32BE(16),1200);assert.equal(image.readUInt32BE(20),630);
});
test('source embeds no remote fonts, scripts or styles',()=>{
 for(const name of ['index.html','style.css','src.jsx','Graph.jsx']){
  const source=readFileSync(new URL(`../${name}`,import.meta.url),'utf8');
  assert.doesNotMatch(source,/@import\s+url|fonts\.googleapis|fonts\.gstatic|<script[^>]+src="https?:|<link[^>]+href="https?:|fetch\(/);
 }
});

test('short and legacy person deep links select three real people and reject unknown IDs',()=>{
 for(const person of data.personagens.slice(0,3)){
  assert.equal(personFromSearch(`?p=${person.id}`,data.personagens),person.id);
  assert.equal(personFromSearch(`?personagem=${person.id}&visualizacao=proximidade`,data.personagens),person.id);
 }
 assert.equal(personFromSearch('?p=invalid',data.personagens),null);
});
test('ten opening labels fit the mobile grid without collision at initial zoom',()=>{
 const ids=openingPeople(data.personagens,data.conexoes);
 const grid=[[0,0],[-150,-150],[0,-150],[150,-150],[-150,0],[150,0],[-150,150],[0,150],[150,150],[0,300]];
 const nodes=ids.map((id,i)=>({id,label:data.personagens.find(p=>p.id===id).nome,x:grid[i][0],y:grid[i][1],priority:1}));
 assert.equal(readableLabels(nodes,.65).length,10);
});
