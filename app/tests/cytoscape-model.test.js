import test from 'node:test';
import assert from 'node:assert/strict';
import cytoscape from 'cytoscape';
import {graphElements,proximityPositions,syncSlice,applySelection,layoutGraph,graphStyles} from '../cytoscape-model.js';
import {parallelSlots,STATUS_CONFIG} from '../graph-model.js';
const nodes=[{id:'lula',nome:'Luiz Inácio Lula da Silva',proximidade_lula:1},...Array.from({length:7},(_,i)=>({id:`p${i}`,nome:`Personagem ${i}`,proximidade_lula:[.9,.7,.5,.3,.1,.01,0][i]}))];
const edges=[{id:'e1',origem:'lula',destino:'p0',status:'arquivado',rotulo:'um'},{id:'e2',origem:'p0',destino:'lula',status:'fato_documentado',rotulo:'dois'}];
test('adapter keeps every person, relation, direction and metadata',()=>{
 const cy=cytoscape({headless:true,elements:graphElements(nodes,edges,parallelSlots(edges))});
 assert.equal(cy.nodes().length,8);assert.equal(cy.edges().length,2);
 assert.equal(cy.$id('e2').source().id(),'p0');assert.equal(cy.$id('e2').data('rotulo'),'dois');
 assert.notEqual(cy.$id('e1').data('slot'),cy.$id('e2').data('slot'));cy.destroy();
});
test('preset uses exactly seven editorial radii and Lula remains at origin',()=>{
 const positions=proximityPositions(nodes);assert.deepEqual(positions.lula,{x:0,y:0});
 for(let i=0;i<7;i++)assert.ok(Math.abs(Math.hypot(positions[`p${i}`].x,positions[`p${i}`].y)-(i+1)*160)<1e-8);
 const cy=cytoscape({headless:true,elements:graphElements(nodes,edges)});layoutGraph(cy,'proximidade',positions);
 assert.deepEqual(cy.$id('p6').position(),positions.p6);cy.destroy();
});
test('slice removes real elements, restores them, preserves retained nodes and handles empty graph',()=>{
 const cy=cytoscape({headless:true,elements:graphElements(nodes,edges)}),lula=cy.$id('lula')[0];
 syncSlice(cy,nodes.slice(0,2),edges);assert.equal(cy.nodes().length,2);assert.equal(cy.$id('lula')[0],lula);
 syncSlice(cy,[],[]);assert.equal(cy.elements().length,0);
 syncSlice(cy,nodes,edges);assert.equal(cy.nodes().length,8);assert.equal(cy.edges().length,2);cy.destroy();
});
test('selection changes classes and names on same instance without changing camera or positions',()=>{
 const cy=cytoscape({headless:true,elements:graphElements(nodes,edges)}),lula=cy.$id('lula')[0];cy.zoom(1.3);cy.pan({x:40,y:50});
 const before={zoom:cy.zoom(),pan:{...cy.pan()},position:{...lula.position()}};
 applySelection(cy,'lula',new Set(['p5']));assert.ok(lula.hasClass('selected'));assert.ok(cy.$id('p0').hasClass('neighbor'));assert.ok(cy.$id('p5').hasClass('search-match'));
 assert.equal(lula.data('label'),nodes[0].nome);assert.ok(cy.$id('p6').hasClass('context'));
 applySelection(cy,'p0',new Set());assert.equal(cy.$id('lula')[0],lula);assert.equal(cy.zoom(),before.zoom);assert.deepEqual(cy.pan(),before.pan);assert.deepEqual(lula.position(),before.position);cy.destroy();
});
test('all seven legend patterns map to distinct native edge styles',()=>{
 const styles=graphStyles({ink:'#111',paper:'#fff',node:'#888',accent:'#f00',muted:'#777',bg:'#fff',statuses:Object.fromEntries(Object.keys(STATUS_CONFIG).map(k=>[k,'#888']))});
 const statuses=styles.filter(s=>s.selector.startsWith('edge.status-'));assert.equal(statuses.length,7);
 assert.equal(new Set(statuses.map(s=>JSON.stringify([s.style['line-style'],s.style['line-dash-pattern']]))).size,7);
});
