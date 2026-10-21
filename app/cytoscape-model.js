import {initials} from './portrait-model.js';
import cytoscape from 'cytoscape';
import fcose from 'cytoscape-fcose';
import {compactLabel,parallelSlots,proximityBand,STATUS_CONFIG,LEGAL_COLORS,LEGAL_RINGS,nodeSize} from './graph-model.js';

cytoscape.use(fcose);

export const BAND_STEP=160;
export function proximityPositions(people){
 const positions={},placed=[];
 // Capsules remain on their editorial radius; search nearby angles for label clearance.
 const clearance=(a,b)=>Math.max(Math.abs(a.x-b.x)-150,Math.abs(a.y-b.y)-68);
 if(people.some(p=>p.id==='lula'))placed.push({x:0,y:0});
 for(let band=0;band<7;band++){
  const group=people.filter(p=>p.id!=='lula'&&proximityBand(p.proximidade_lula)===band).sort((a,b)=>a.nome.localeCompare(b.nome,'pt-BR'));
  group.forEach((p,i)=>{
   const nominal=i/group.length*Math.PI*2-Math.PI/2,radius=(band+1)*BAND_STEP;
   let best,score=-Infinity;
   for(let step=0;step<720;step++){
    const offset=Math.ceil(step/2)*(step%2?1:-1)*Math.PI/360,angle=nominal+offset;
    const candidate={x:Math.cos(angle)*radius,y:Math.sin(angle)*radius};
    const distance=Math.min(...placed.map(other=>clearance(candidate,other)));
    if(distance>score){best=candidate;score=distance}
    if(distance>=0)break;
   }
   positions[p.id]=best;placed.push(best);
  });
 }
 if(people.some(p=>p.id==='lula'))positions.lula={x:0,y:0};
 return positions;
}
export function graphElements(people,edges,slots=parallelSlots(edges)){
 return [...people.map(p=>({group:'nodes',data:{...p,label:compactLabel(p),compact:compactLabel(p),size:nodeSize(p),legalColor:LEGAL_COLORS[p.categoria_juridica]||LEGAL_COLORS.sem_informacao,ringWidth:(LEGAL_RINGS[p.categoria_juridica]||LEGAL_RINGS.sem_informacao).width,ringStyle:(LEGAL_RINGS[p.categoria_juridica]||LEGAL_RINGS.sem_informacao).style,portrait:p.retrato?.base64||`data:image/svg+xml;charset=utf-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96"><rect width="96" height="96" fill="#E7E3DA"/><text x="48" y="56" text-anchor="middle" font-family="Inter,sans-serif" font-size="30" fill="#1C1B19">${initials(p)}</text></svg>`)}`},classes:p.id==='lula'?'central':''})),...edges.map(e=>({group:'edges',data:{...e,source:e.origem,target:e.destino,slot:slots.get(e.id)||0,curve:(slots.get(e.id)||0)*65*(e.origem<e.destino?1:-1)},classes:`status-${e.status}`}))];
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
  cy.nodes().forEach(n=>{if(matches.has(n.id()))n.addClass('search-match');if(n.id()===focused)n.addClass('focused');n.data('label',n.data('compact'))});
 });
}
export function layoutGraph(cy,view,positions){
 if(view!=='proximidade'){
  const nodes=cy.nodes().sort((a,b)=>a.id().localeCompare(b.id()));
  nodes.forEach((node,i)=>{const angle=i/nodes.length*Math.PI*2;node.position({x:Math.cos(angle)*450,y:Math.sin(angle)*450})});
 }
 const options=view==='proximidade'?{name:'preset',positions}:{name:'fcose',quality:'proof',randomize:false,nodeDimensionsIncludeLabels:true,nodeSeparation:60,nodeRepulsion:()=>45000,idealEdgeLength:()=>110,edgeElasticity:()=>.1,numIter:5000,tile:true,tilingPaddingVertical:36,tilingPaddingHorizontal:48,packComponents:false};
 const layout=cy.layout({...options,animate:false,fit:false});layout.run();return layout;
}
export function applyFocus(cy,focused){
 cy.batch(()=>{cy.nodes('.focused').removeClass('focused');if(focused)cy.getElementById(focused).addClass('focused')});
}
export function graphStyles(t){
 return [
  {selector:'node',style:{shape:'ellipse',width:'data(size)',height:'data(size)',padding:0,label:'data(label)','font-family':'Inter, sans-serif','font-weight':600,'font-size':12,'text-wrap':'ellipsis','text-max-width':140,'min-zoomed-font-size':0,'text-valign':'bottom','text-margin-y':6,'text-outline-color':'#F4F1EA','text-outline-width':2,'text-halign':'center','background-color':'#E7E3DA','background-image':'data(portrait)','background-fit':'cover','background-clip':'node','border-color':'data(legalColor)','border-width':'data(ringWidth)','border-style':'data(ringStyle)',color:t.ink,'overlay-opacity':0}},
  {selector:'edge',style:{width:1,opacity:.18,'curve-style':'unbundled-bezier','control-point-distances':'data(curve)','control-point-weights':.15,'line-color':'#1C1B19','overlay-opacity':0}},
  ...Object.entries(STATUS_CONFIG).map(([status,{dash}])=>({selector:`edge.status-${status}`,style:{'line-style':dash==='1 3'?'dotted':dash?'dashed':'solid',...(dash?{'line-dash-pattern':dash.split(' ').map(Number)}:{})}})),
  {selector:'node.context',style:{opacity:.25}},
  {selector:'edge.context',style:{opacity:.045}},
  {selector:'edge.neighbor',style:{opacity:.65}},
  {selector:'node.search-match, node.selected, node.focused',style:{'underlay-color':t.accent,'underlay-opacity':.15,'underlay-padding':6,'z-index':10,opacity:1}},
 ];
}
