import {compactLabel,parallelSlots,proximityBand,STATUS_CONFIG} from './graph-model.js';

export const BAND_STEP=160;
export function proximityPositions(people){
 const positions={};
 for(let band=0;band<7;band++){
  const group=people.filter(p=>p.id!=='lula'&&proximityBand(p.proximidade_lula)===band).sort((a,b)=>a.nome.localeCompare(b.nome,'pt-BR'));
  group.forEach((p,i)=>{const angle=i/group.length*Math.PI*2-Math.PI/2;positions[p.id]={x:Math.cos(angle)*(band+1)*BAND_STEP,y:Math.sin(angle)*(band+1)*BAND_STEP}});
 }
 if(people.some(p=>p.id==='lula'))positions.lula={x:0,y:0};
 return positions;
}
export function graphElements(people,edges,slots=parallelSlots(edges)){
 return [...people.map(p=>({group:'nodes',data:{...p,label:compactLabel(p),compact:compactLabel(p)},classes:p.id==='lula'?'central':''})),...edges.map(e=>({group:'edges',data:{...e,source:e.origem,target:e.destino,slot:slots.get(e.id)||0,curve:(slots.get(e.id)||0)*65*(e.origem<e.destino?1:-1)},classes:`status-${e.status}`}))];
}
// Reconcile the actual graph; retained nodes keep their identity and dragged positions.
export function syncSlice(cy,people,edges,slots){
 const elements=graphElements(people,edges,slots),wanted=new Set(elements.map(e=>e.data.id));
 cy.batch(()=>{
  cy.elements().filter(e=>!wanted.has(e.id())).remove();
  for(const element of elements){const current=cy.getElementById(element.data.id);if(current.length)current.data(element.data);else cy.add(element)}
 });
}
export function applySelection(cy,selected,matches=new Set(),focused=null){
 cy.batch(()=>{
  cy.elements().removeClass('selected neighbor context search-match focused');
  const current=selected?cy.getElementById(selected):cy.collection();
  if(current.length){const local=current.closedNeighborhood();cy.elements().difference(local).addClass('context');local.difference(current).addClass('neighbor');current.addClass('selected')}
  cy.nodes().forEach(n=>{if(matches.has(n.id()))n.addClass('search-match');if(n.id()===focused)n.addClass('focused');n.data('label',n.id()===selected||n.id()===focused?n.data('nome'):n.data('compact'))});
 });
}
export function layoutGraph(cy,view,positions){
 const options=view==='proximidade'?{name:'preset',positions}:{name:'cose',randomize:true,nodeDimensionsIncludeLabels:true,nodeRepulsion:()=>18000,idealEdgeLength:()=>150,edgeElasticity:()=>100,componentSpacing:110,numIter:1000};
 const layout=cy.layout({...options,animate:false,fit:false});layout.run();return layout;
}
export function graphStyles(t){
 return [
  {selector:'node',style:{shape:'round-rectangle',width:'label',height:'label',padding:8,label:'data(label)','font-family':'Arial, Helvetica, sans-serif','font-size':12,'text-wrap':'wrap','text-max-width':185,'text-valign':'center','text-halign':'center','background-color':t.paper,'border-color':t.node,'border-width':1.5,color:t.ink,'overlay-opacity':0}},
  {selector:'node.central',style:{'background-color':t.ink,color:t.paper,'border-color':t.accent,'border-width':2,'font-weight':'bold'}},
  {selector:'edge',style:{width:1.5,'curve-style':'unbundled-bezier','control-point-distances':'data(curve)','control-point-weights':.5,'line-color':t.node,'overlay-opacity':0}},
  ...Object.entries(STATUS_CONFIG).map(([status,{dash}])=>({selector:`edge.status-${status}`,style:{'line-color':t.statuses[status],'line-style':dash?'dashed':'solid',...(dash?{'line-dash-pattern':dash.split(' ').map(Number)}:{})}})),
  {selector:'.context',style:{opacity:.18}},
  {selector:'edge.neighbor',style:{width:3}},
  {selector:'node.neighbor',style:{'border-color':t.accent,'border-width':2}},
  {selector:'node.search-match',style:{'border-color':t.accent,'border-width':3,'font-weight':'bold',opacity:1}},
  {selector:'node.selected, node.focused',style:{'background-color':t.accent,color:t.paper,'border-color':t.ink,'border-width':3,'font-weight':'bold','z-index':10,opacity:1}},
 ];
}
