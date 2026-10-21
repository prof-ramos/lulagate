import test from 'node:test';
import assert from 'node:assert/strict';
import cytoscape from 'cytoscape';
import {graphElements,proximityPositions,syncSlice,applySelection,layoutGraph,graphStyles,applyFocus} from '../cytoscape-model.js';
import {parallelSlots,STATUS_CONFIG,PROXIMITY_BANDS} from '../graph-model.js';
const nodes=[{id:'lula',nome:'Luiz Inácio Lula da Silva',faixa_proximidade:PROXIMITY_BANDS[0].label},...Array.from({length:7},(_,i)=>({id:`p${i}`,nome:`Personagem ${i}`,faixa_proximidade:PROXIMITY_BANDS[i].label}))];
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
 assert.equal(lula.data('label'),lula.data('compact'));assert.ok(cy.$id('p6').hasClass('context'));
 applySelection(cy,'p0',new Set());assert.equal(cy.$id('lula')[0],lula);assert.equal(cy.zoom(),before.zoom);assert.deepEqual(cy.pan(),before.pan);assert.deepEqual(lula.position(),before.position);cy.destroy();
});
test('all seven legend patterns map to distinct native edge styles',()=>{
 const styles=graphStyles({ink:'#111',paper:'#fff',node:'#888',accent:'#f00',muted:'#777',bg:'#fff',statuses:Object.fromEntries(Object.keys(STATUS_CONFIG).map(k=>[k,'#888']))});
 const statuses=styles.filter(s=>s.selector.startsWith('edge.status-'));assert.equal(statuses.length,7);
 assert.equal(new Set(statuses.map(s=>JSON.stringify([s.style['line-style'],s.style['line-dash-pattern']]))).size,7);
});

test('real dataset layout has case-based dimensions, finite positions and no overlapping node boxes',async()=>{
 const {readFile}=await import('node:fs/promises');
 const data=JSON.parse(await readFile(new URL('../../data/dataset.json',import.meta.url),'utf8'));
 const statuses=Object.fromEntries(Object.keys(STATUS_CONFIG).map(k=>[k,'#666']));
 const cy=cytoscape({headless:true,styleEnabled:true,style:graphStyles({ink:'#222',paper:'#fff',bg:'#eee',muted:'#666',node:'#777',accent:'#457',statuses}),elements:graphElements(data.personagens,data.conexoes)});
 try {
 layoutGraph(cy,'rede');
 assert.equal(cy.nodes().length,data.personagens.length);
 assert.equal(cy.edges().length,data.conexoes.length);
 const nodes=cy.nodes().toArray();
 for(const node of nodes){assert.ok(Number.isFinite(node.position('x'))&&Number.isFinite(node.position('y')));assert.equal(node.width(),node.data('size'));assert.equal(node.height(),node.data('size'))}
 for(let i=0;i<nodes.length;i++)for(let j=i+1;j<nodes.length;j++){
  const a=nodes[i].boundingBox({includeLabels:false,includeOverlays:false}),b=nodes[j].boundingBox({includeLabels:false,includeOverlays:false});
  assert.ok(!(a.x1<b.x2&&a.x2>b.x1&&a.y1<b.y2&&a.y2>b.y1),`overlap: ${nodes[i].id()} / ${nodes[j].id()}`);
 }
 const box=cy.nodes().boundingBox({includeLabels:false,includeOverlays:false});
 assert.ok(box.w>600&&box.h>350,`network must spread in two dimensions: ${box.w} × ${box.h}`);
 const first=nodes[0],before={width:first.width(),height:first.height()};applySelection(cy,first.id());cy.zoom(.2);
 assert.deepEqual({width:first.width(),height:first.height()},before);assert.equal(first.data('label'),first.data('compact'));
 } finally {cy.destroy()}
});

test('all proximity capsules including the 0.30–0.49 ring have space for labels',async()=>{
 const {readFile}=await import('node:fs/promises');
 const data=JSON.parse(await readFile(new URL('../../data/dataset.json',import.meta.url),'utf8'));
 const positions=proximityPositions(data.personagens);
 assert.deepEqual(positions,proximityPositions([...data.personagens].reverse()));
 const people=data.personagens;
 for(let i=0;i<people.length;i++)for(let j=i+1;j<people.length;j++){
  const a=positions[people[i].id],b=positions[people[j].id];
  assert.ok(Math.abs(a.x-b.x)>=150||Math.abs(a.y-b.y)>=68,`label overlap: ${people[i].id} / ${people[j].id}`);
 }
});

test('network layout is repeatable for the same dataset and input order',async()=>{
 const {readFile}=await import('node:fs/promises');
 const data=JSON.parse(await readFile(new URL('../../data/dataset.json',import.meta.url),'utf8'));
 const run=()=>{
  const cy=cytoscape({headless:true,elements:graphElements(data.personagens,data.conexoes)});
  layoutGraph(cy,'rede');
  const positions=Object.fromEntries(cy.nodes().map(n=>[n.id(),{...n.position()}]));cy.destroy();return positions;
 };
 assert.deepEqual(run(),run());
});


test('hover focus preserves selection, search classes, labels and camera',()=>{
 const cy=cytoscape({headless:true,elements:graphElements(nodes,edges)});
 applySelection(cy,'lula',new Set(['p5']));
 const before=cy.elements().map(e=>({id:e.id(),classes:e.classes(),data:{...e.data()}}));
 const camera={zoom:cy.zoom(),pan:{...cy.pan()}};
 applyFocus(cy,'p6');assert.ok(cy.$id('p6').hasClass('focused'));
 assert.ok(cy.$id('lula').hasClass('selected'));assert.ok(cy.$id('p5').hasClass('search-match'));
 applyFocus(cy,null);
 assert.deepEqual(cy.elements().map(e=>({id:e.id(),classes:e.classes(),data:{...e.data()}})),before);
 assert.deepEqual({zoom:cy.zoom(),pan:{...cy.pan()}},camera);cy.destroy();
});
