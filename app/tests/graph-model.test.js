import test from 'node:test';
import assert from 'node:assert/strict';
import {filterGraph, parallelSlots, proximityBand, PROXIMITY_BANDS, STATUS_CONFIG, compactLabel} from '../graph-model.js';

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

});
test('verbal proximity bands retain exact methodology semantics without public scores',()=>{
 assert.deepEqual(PROXIMITY_BANDS.map(b=>proximityBand(b.label)),[0,1,2,3,4,5,6]);
 assert.equal(proximityBand('não classificado'),-1);
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
