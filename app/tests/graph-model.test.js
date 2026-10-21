import test from 'node:test';
import assert from 'node:assert/strict';
import {filterGraph, parallelSlots, edgePath, proximityBand, PROXIMITY_BANDS, STATUS_CONFIG, compactLabel, wrapLabel} from '../graph-model.js';

const people=[{id:'a'},{id:'b'},{id:'c'}];
const edges=[{id:'z',origem:'a',destino:'b',status:'arquivado',escandalos:['one']},{id:'a',origem:'b',destino:'a',status:'fato_documentado',escandalos:['two']},{id:'c',origem:'b',destino:'c',status:'arquivado',escandalos:['one']}];
test('filters remove unrelated nodes and return an honest empty slice',()=>{
 assert.deepEqual(filterGraph(people,edges,new Set(['arquivado']),'one').nodes.map(p=>p.id),['a','b','c']);
 assert.deepEqual(filterGraph(people,edges,new Set(['fato_documentado']),'two').nodes.map(p=>p.id),['a','b']);
 assert.deepEqual(filterGraph(people,edges,new Set(),'one'),{nodes:[],edges:[]});
});
test('parallel slots are canonical and stable after filtering, including reversed endpoints',()=>{
 const slots=parallelSlots(edges);
 assert.equal(slots.get('a'),-.5);assert.equal(slots.get('z'),.5);
 const positions={a:{x:0,y:0},b:{x:100,y:0}};
 assert.notEqual(edgePath(edges[0],positions,slots),edgePath(edges[1],positions,slots));
 assert.equal(edgePath(edges[0],positions,slots),edgePath(edges.filter(e=>e.id==='z')[0],positions,slots));
});
test('all editorial proximity boundaries retain exact methodology semantics',()=>{
 assert.deepEqual([1,.9,.89,.7,.69,.5,.49,.3,.29,.1,.09,.01,0].map(proximityBand),[0,0,1,1,2,2,3,3,4,4,5,5,6]);
 assert.match(PROXIMITY_BANDS[5].label,/apenas contexto/);assert.match(PROXIMITY_BANDS[6].label,/nenhum vínculo/);
});
test('status legend and paths can share one explicit pattern configuration',()=>{
 assert.equal(Object.keys(STATUS_CONFIG).length,7);
 assert.equal(new Set(Object.values(STATUS_CONFIG).map(status=>status.dash||'solid')).size,7);
 assert.equal(STATUS_CONFIG.alegacao_nao_comprovada.dash,'3 6');
 assert.notEqual(STATUS_CONFIG.arquivado.dash,STATUS_CONFIG.condenacao_anulada.dash);
});

test('compact labels use only existing name parts and retain explicit aliases',()=>{
 assert.equal(compactLabel({nome:'José Aldemário Pinheiro Filho (Léo Pinheiro)'}),'Léo Pinheiro');
 assert.equal(compactLabel({nome:'Frederico Botelho de Barros Viana'}),'Frederico Viana');
 assert.equal(compactLabel({nome:'Renan Filho'}),'Renan Filho');
});
test('wrapping keeps every character and respects narrow measured line widths',()=>{
 const measure=s=>s.length*7;
 const lines=wrapLabel('Antônio Carlos Camilo Antunes (Careca do INSS)',105,measure);
 assert.ok(lines.every(line=>measure(line)<=105));
 assert.equal(lines.join(' '),'Antônio Carlos Camilo Antunes (Careca do INSS)');
 assert.deepEqual(wrapLabel('Extraordinariamente',35,measure),['Extra','ordin','ariam','ente']);
});
