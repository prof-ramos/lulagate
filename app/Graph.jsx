import React,{useEffect,useMemo,useRef,useState} from 'react';
import cytoscape from 'cytoscape';
import {openingPeople,readableLabels} from './mobile-model.js';
import {parallelSlots,PROXIMITY_BANDS,STATUS_CONFIG} from './graph-model.js';
import {BAND_STEP,proximityPositions,syncSlice,applySelection,layoutGraph,graphStyles,applyFocus} from './cytoscape-model.js';

export default function Graph({data,view,selected,onSelect,visibleNodes,visibleEdges,graphRef,matches,sheetHeight}){
 const networkPositions=useRef(null),previousView=useRef(null),fitFrame=useRef(null);
 const container=useRef(null),cyRef=useRef(null),fitRef=useRef(()=>{}),onSelectRef=useRef(onSelect),stateRef=useRef({});
 const [camera,setCamera]=useState({zoom:1,pan:{x:0,y:0}}),[focused,setFocused]=useState(null),[peopleOpen,setPeopleOpen]=useState(false),[bandsOpen,setBandsOpen]=useState(()=>!matchMedia('(max-width:640px)').matches);
 const slots=useMemo(()=>parallelSlots(data.conexoes),[data]),positions=useMemo(()=>proximityPositions(data.personagens),[data]);
 const opening=useMemo(()=>new Set(openingPeople(data.personagens,data.conexoes)),[data]);
 const people=useMemo(()=>[...visibleNodes].sort((a,b)=>a.nome.localeCompare(b.nome,'pt-BR')),[visibleNodes]);
 const focusPerson=visibleNodes.find(p=>p.id===(focused||selected));
 onSelectRef.current=onSelect;
 stateRef.current={view,selected,matches,focused,opening};

 useEffect(()=>{
  const element=container.current;
  const cy=cytoscape({container:element,elements:[],layout:{name:'preset'},minZoom:.18,maxZoom:3.5,wheelSensitivity:.25,selectionType:'single',autounselectify:true,boxSelectionEnabled:false});
  cyRef.current=cy;
  const theme=()=>{
   const css=getComputedStyle(element),token=name=>css.getPropertyValue(`--${name}`).trim();
   const statuses=Object.fromEntries(Object.keys(STATUS_CONFIG).map(status=>[status,getComputedStyle(element.parentElement.querySelector(`.graph-theme-probe.status-${status}`)).getPropertyValue('--status-color').trim()]));
   cy.style(graphStyles({ink:token('ink'),paper:token('paper'),bg:token('bg'),muted:token('muted'),node:token('node'),accent:token('accent'),statuses}));
  };
  const cameraChanged=()=>{
   const zoom=cy.zoom();setCamera({zoom,pan:{...cy.pan()}});
   const priorities=stateRef.current.opening||new Set();
   const visible=new Set(readableLabels(cy.nodes().map(n=>({id:n.id(),label:n.data('compact'),...n.position(),priority:n.id()===stateRef.current.selected?3:n.id()==='lula'?2:priorities.has(n.id())?1:0})),zoom));
   cy.batch(()=>cy.nodes().forEach(n=>{
    n.style({'font-size':12/zoom,'text-max-width':88/zoom,'text-margin-y':6/zoom,'text-opacity':visible.has(n.id())?1:0,width:Math.max(n.data('size'),44/zoom),height:Math.max(n.data('size'),44/zoom)});
   }));
  };
  cy.on('viewport',cameraChanged);
  cy.on('tap','node',e=>onSelectRef.current(e.target.id()));
  cy.on('mouseover','node',e=>setFocused(e.target.id()));
  cy.on('mouseout','node',()=>setFocused(null));
  const fit=()=>{
   if(cy.destroyed())return;
   cy.resize();const rect=element.getBoundingClientRect();if(!rect.width||!rect.height)return;
   let left=18,top=38,right=rect.width-18,bottom=rect.height-66;
   let rightInset=0,bottomInset=0;
   const panel=document.querySelector('.person-panel')?.getBoundingClientRect();
   if(panel&&panel.left<rect.right&&panel.right>rect.left&&panel.top<rect.bottom&&panel.bottom>rect.top){
    if(panel.width>rect.width*.75){bottomInset=Math.max(0,rect.bottom-panel.top);bottom=Math.min(bottom,panel.top-rect.top-16)}
    else {rightInset=Math.max(0,rect.right-panel.left);right=Math.min(right,panel.left-rect.left-18)}
   }
   element.parentElement.style.setProperty('--graph-right-inset',`${rightInset}px`);
   element.parentElement.style.setProperty('--graph-bottom-inset',`${bottomInset}px`);
   const band=element.parentElement.querySelector('.band-legend')?.getBoundingClientRect();
   if(band){if(rect.width>700)right=Math.min(right,band.left-rect.left-16);else top=Math.max(top,band.bottom-rect.top+14)}
   const list=element.parentElement.querySelector('.graph-people')?.getBoundingClientRect();
   if(list?.querySelector('section')&&list.top<rect.top+bottom){if(rect.width>700&&list.height>80)left=Math.max(left,list.right-rect.left+16);else bottom=Math.min(bottom,list.top-rect.top-16)}
   // Expanded overlays can leave only a small viewport; keep a useful camera at its centre.
   const width=Math.max(100,right-left),height=Math.max(100,bottom-top),center={x:left+width/2,y:top+height/2};
   if(!cy.nodes().length){cy.pan(center);return}
   const mobile=rect.width<=640;
   const target=mobile&&stateRef.current.view==='rede'?cy.nodes().filter(n=>stateRef.current.opening.has(n.id())):cy.elements();
   const box=target.boundingBox({includeLabels:false,includeOverlays:false});
   if(stateRef.current.view==='proximidade'){const radius=PROXIMITY_BANDS.length*BAND_STEP;box.x1=Math.min(box.x1,-radius);box.y1=Math.min(box.y1,-radius);box.x2=Math.max(box.x2,radius);box.y2=Math.max(box.y2,radius);box.w=box.x2-box.x1;box.h=box.y2-box.y1}
   const zoom=Math.max(cy.minZoom(),Math.min(1.35,(width-36)/Math.max(1,box.w),(height-36)/Math.max(1,box.h)));
   const selectedNode=cy.getElementById(stateRef.current.selected||'');
   const point=selectedNode.length?selectedNode.position():{x:(box.x1+box.x2)/2,y:(box.y1+box.y2)/2};
   cy.viewport({zoom,pan:{x:center.x-point.x*zoom,y:center.y-point.y*zoom}});cameraChanged();
  };
  fitRef.current=()=>{cancelAnimationFrame(fitFrame.current);fitFrame.current=requestAnimationFrame(fit)};
  graphRef.current={exportPNG:()=>{const a=document.createElement('a');a.href=cy.png({full:true,scale:2,bg:getComputedStyle(element).getPropertyValue('--bg').trim()});a.download='lula-gate.png';a.click()},reset:fit,zoomBy:factor=>{const rect=element.getBoundingClientRect();cy.zoom({level:Math.max(cy.minZoom(),Math.min(cy.maxZoom(),cy.zoom()*factor)),renderedPosition:{x:rect.width/2,y:rect.height/2}})}};
  theme();const observer=new MutationObserver(theme);observer.observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
  const requestFit=()=>fitRef.current();
  const resize=new ResizeObserver(requestFit);resize.observe(element);window.addEventListener('resize',requestFit);
  return()=>{observer.disconnect();resize.disconnect();window.removeEventListener('resize',requestFit);cancelAnimationFrame(fitFrame.current);cy.destroy();cyRef.current=null;graphRef.current=null};
 },[graphRef]);

 useEffect(()=>{
  const cy=cyRef.current;if(!cy)return;
  if(previousView.current==='rede'&&networkPositions.current)cy.nodes().forEach(n=>{networkPositions.current[n.id()]={...n.position()}});
  if(view==='rede'&&!networkPositions.current){
   syncSlice(cy,data.personagens,data.conexoes,slots);layoutGraph(cy,view);
   networkPositions.current=Object.fromEntries(cy.nodes().map(n=>[n.id(),{...n.position()}]));
   if(matchMedia('(max-width:640px)').matches){
    const ids=openingPeople(data.personagens,data.conexoes);
    const grid=[{x:0,y:0},{x:-150,y:-150},{x:0,y:-150},{x:150,y:-150},{x:-150,y:0},{x:150,y:0},{x:-150,y:150},{x:0,y:150},{x:150,y:150},{x:0,y:300}];
    ids.forEach((id,i)=>{networkPositions.current[id]=grid[i]});
    cy.nodes().filter(n=>!ids.includes(n.id())).forEach((n,i)=>{const angle=i/53*Math.PI*2;networkPositions.current[n.id()]={x:Math.cos(angle)*1100,y:Math.sin(angle)*1100}});
   }
  }
  syncSlice(cy,visibleNodes,visibleEdges,slots);
  if(view==='proximidade')cy.nodes().ungrabify();else cy.nodes().grabify();
  layoutGraph(cy,'proximidade',view==='rede'?networkPositions.current:positions);
  previousView.current=view;
  const state=stateRef.current;applySelection(cy,state.selected,state.matches,state.focused);
  fitRef.current();return()=>cancelAnimationFrame(fitFrame.current);
 },[visibleNodes,visibleEdges,view,slots,positions]);
 useEffect(()=>{const cy=cyRef.current;if(cy)applySelection(cy,selected,matches,stateRef.current.focused)},[selected,matches]);
 useEffect(()=>{if(cyRef.current)applyFocus(cyRef.current,focused)},[focused]);
 // Only changes in available viewport trigger fitting; switching an open person's identity does not.
 useEffect(()=>{fitRef.current()},[selected,sheetHeight,bandsOpen,peopleOpen]);
 useEffect(()=>{const close=e=>{if(e.key==='Escape')setPeopleOpen(false)};window.addEventListener('keydown',close);return()=>window.removeEventListener('keydown',close)},[]);
 const pan=e=>{
  const cy=cyRef.current;if(!cy)return;
  const directions={ArrowLeft:{x:48,y:0},ArrowRight:{x:-48,y:0},ArrowUp:{x:0,y:48},ArrowDown:{x:0,y:-48}};
  if(directions[e.key]){e.preventDefault();cy.panBy(directions[e.key])}
  else if(e.key==='+'||e.key==='='){e.preventDefault();graphRef.current.zoomBy(1.3)}
  else if(e.key==='-'){e.preventDefault();graphRef.current.zoomBy(1/1.3)}
  else if(e.key==='0'){e.preventDefault();fitRef.current()}
 };
 return <>
  {view==='proximidade'&&visibleNodes.length>0&&<svg className="graph-rings" aria-hidden="true"><g transform={`translate(${camera.pan.x},${camera.pan.y}) scale(${camera.zoom})`}>{PROXIMITY_BANDS.map((band,i)=><circle key={band.min} r={(i+1)*BAND_STEP}/>)}</g></svg>}
  <div ref={container} className="graph" tabIndex={0} onKeyDown={pan} role="region" aria-label={`Mapa interativo: ${visibleNodes.length} personagens e ${visibleEdges.length} conexões no recorte`} aria-describedby="graph-keyboard-help"/>
  <span id="graph-keyboard-help" className="sr-only">Na Rede, arraste personagens para reorganizar. Na Proximidade, os personagens permanecem em sua faixa editorial. Arraste o fundo para mover o mapa. Com foco no mapa, use as setas para mover, mais e menos para ampliar ou reduzir e zero para restaurar. O botão Ver lista de nomes permite consultar todos os nomes com Tab e abrir detalhes com Enter ou espaço.</span>
  {focusPerson&&focused&&focused!==selected&&<div className="graph-focus-name" aria-live="polite">{focusPerson.nome}</div>}
  <div className="graph-people"><button aria-expanded={peopleOpen} aria-controls="people-list" onClick={()=>setPeopleOpen(!peopleOpen)}>Ver lista de nomes ({people.length})</button>{peopleOpen&&<section id="people-list" aria-label="Lista de nomes" onKeyDown={e=>{if(e.key==='Escape'){e.stopPropagation();setPeopleOpen(false);e.currentTarget.parentElement.querySelector('button').focus()}}}><button onClick={()=>setPeopleOpen(false)}>Fechar lista</button><p>Tab percorre os nomes; Enter abre os detalhes.</p><ul>{people.map(person=><li key={person.id}><button aria-pressed={selected===person.id} onFocus={()=>setFocused(person.id)} onBlur={()=>setFocused(null)} onClick={()=>{setPeopleOpen(false);onSelect(person.id)}}>{person.nome}</button></li>)}</ul>{!people.length&&<p>Nenhum personagem no recorte atual.</p>}</section>}</div>
  {view==='proximidade'&&<details className="band-legend" open={bandsOpen} onToggle={e=>setBandsOpen(e.currentTarget.open)}><summary>Faixas de proximidade editorial</summary><ol>{PROXIMITY_BANDS.map((band,i)=><li key={band.min}><span className="band-number">{i+1}</span><strong>{band.range}</strong><span>{band.label}</span></li>)}</ol><p>Do anel interno ao externo. Atribuição editorial, não medida de culpa.</p></details>}
  <span className="graph-theme-probes" aria-hidden="true">{Object.keys(STATUS_CONFIG).map(status=><span key={status} className={`graph-theme-probe status-${status}`}/>)}</span>
 </>;
}
