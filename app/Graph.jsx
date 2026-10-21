import React,{useEffect,useMemo,useRef,useState} from 'react';
import cytoscape from 'cytoscape';
import {parallelSlots,PROXIMITY_BANDS,STATUS_CONFIG} from './graph-model.js';
import {BAND_STEP,proximityPositions,syncSlice,applySelection,layoutGraph,graphStyles} from './cytoscape-model.js';

export default function Graph({data,view,selected,onSelect,visibleNodes,visibleEdges,graphRef,matches}){
 const container=useRef(null),cyRef=useRef(null),fitRef=useRef(()=>{}),onSelectRef=useRef(onSelect),stateRef=useRef({});
 const [camera,setCamera]=useState({zoom:1,pan:{x:0,y:0}}),[focused,setFocused]=useState(null),[peopleOpen,setPeopleOpen]=useState(false),[bandsOpen,setBandsOpen]=useState(()=>!matchMedia('(max-width:640px)').matches);
 const slots=useMemo(()=>parallelSlots(data.conexoes),[data]),positions=useMemo(()=>proximityPositions(data.personagens),[data]);
 const panelOpen=Boolean(selected),people=useMemo(()=>[...visibleNodes].sort((a,b)=>a.nome.localeCompare(b.nome,'pt-BR')),[visibleNodes]);
 const focusPerson=visibleNodes.find(p=>p.id===(focused||selected));
 onSelectRef.current=onSelect;
 stateRef.current={view,selected,matches,focused};

 useEffect(()=>{
  const element=container.current;
  const cy=cytoscape({container:element,elements:[],layout:{name:'preset'},minZoom:.06,maxZoom:3.5,wheelSensitivity:.25,selectionType:'single',autounselectify:true,boxSelectionEnabled:false});
  cyRef.current=cy;
  const theme=()=>{
   const css=getComputedStyle(element),token=name=>css.getPropertyValue(`--${name}`).trim();
   const statuses=Object.fromEntries(Object.keys(STATUS_CONFIG).map(status=>[status,getComputedStyle(element.parentElement.querySelector(`.graph-theme-probe.status-${status}`)).getPropertyValue('--status-color').trim()]));
   cy.style(graphStyles({ink:token('ink'),paper:token('paper'),bg:token('bg'),muted:token('muted'),node:token('node'),accent:token('accent'),statuses}));
  };
  const cameraChanged=()=>setCamera({zoom:cy.zoom(),pan:{...cy.pan()}});
  cy.on('viewport',cameraChanged);
  cy.on('tap','node',e=>onSelectRef.current(e.target.id()));
  cy.on('mouseover','node',e=>setFocused(e.target.id()));
  cy.on('mouseout','node',()=>setFocused(null));
  const fit=()=>{
   if(cy.destroyed())return;
   cy.resize();const rect=element.getBoundingClientRect();if(!rect.width||!rect.height)return;
   let left=18,top=68,right=rect.width-18,bottom=rect.height-52;
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
   if(list&&list.top<rect.top+bottom){if(rect.width>700&&list.height>80)left=Math.max(left,list.right-rect.left+16);else bottom=Math.min(bottom,list.top-rect.top-16)}
   // Expanded overlays can leave only a small viewport; keep a useful camera at its centre.
   const width=Math.max(100,right-left),height=Math.max(100,bottom-top),center={x:left+width/2,y:top+height/2};
   if(!cy.nodes().length){cy.pan(center);return}
   const box=cy.elements().boundingBox({includeLabels:true,includeOverlays:false});
   if(stateRef.current.view==='proximidade'){const radius=PROXIMITY_BANDS.length*BAND_STEP;box.x1=Math.min(box.x1,-radius);box.y1=Math.min(box.y1,-radius);box.x2=Math.max(box.x2,radius);box.y2=Math.max(box.y2,radius);box.w=box.x2-box.x1;box.h=box.y2-box.y1}
   const zoom=Math.max(cy.minZoom(),Math.min(1.35,(width-36)/Math.max(1,box.w),(height-36)/Math.max(1,box.h)));
   cy.viewport({zoom,pan:{x:center.x-(box.x1+box.x2)/2*zoom,y:center.y-(box.y1+box.y2)/2*zoom}});
  };
  fitRef.current=fit;
  graphRef.current={reset:fit,zoomBy:factor=>{const rect=element.getBoundingClientRect();cy.zoom({level:Math.max(cy.minZoom(),Math.min(cy.maxZoom(),cy.zoom()*factor)),renderedPosition:{x:rect.width/2,y:rect.height/2}})}};
  theme();const observer=new MutationObserver(theme);observer.observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
  const resize=new ResizeObserver(fit);resize.observe(element);window.addEventListener('resize',fit);
  return()=>{observer.disconnect();resize.disconnect();window.removeEventListener('resize',fit);cy.destroy();cyRef.current=null;graphRef.current=null};
 },[graphRef]);

 useEffect(()=>{
  const cy=cyRef.current;if(!cy)return;
  syncSlice(cy,visibleNodes,visibleEdges,slots);
  if(view==='proximidade')cy.nodes().ungrabify();else cy.nodes().grabify();
  layoutGraph(cy,view,positions);
  const state=stateRef.current;applySelection(cy,state.selected,state.matches,state.focused);
  const frame=requestAnimationFrame(()=>fitRef.current());return()=>cancelAnimationFrame(frame);
 },[visibleNodes,visibleEdges,view,slots,positions]);
 useEffect(()=>{const cy=cyRef.current;if(cy)applySelection(cy,selected,matches,focused)},[selected,matches,focused]);
 // Only changes in available viewport trigger fitting; switching an open person's identity does not.
 useEffect(()=>{const frame=requestAnimationFrame(()=>fitRef.current());return()=>cancelAnimationFrame(frame)},[panelOpen,bandsOpen,peopleOpen]);
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
  <span id="graph-keyboard-help" className="sr-only">Na Rede, arraste personagens para reorganizar. Na Proximidade, os personagens permanecem em sua faixa editorial. Arraste o fundo para mover o mapa. Com foco no mapa, use as setas para mover, mais e menos para ampliar ou reduzir e zero para restaurar. A lista Personagens do recorte permite consultar todos os nomes com Tab e abrir detalhes com Enter ou espaço.</span>
  {focusPerson&&focused&&focused!==selected&&<div className="graph-focus-name" aria-live="polite">{focusPerson.nome}</div>}
  <details className="graph-people" open={peopleOpen} onToggle={e=>setPeopleOpen(e.currentTarget.open)}><summary>Personagens do recorte ({people.length})</summary><p>Tab percorre os nomes; Enter abre os detalhes. No mapa, use as setas para mover e + / − para zoom.</p><ul>{people.map(person=><li key={person.id}><button aria-pressed={selected===person.id} onFocus={()=>setFocused(person.id)} onBlur={()=>setFocused(null)} onClick={()=>onSelect(person.id)}>{person.nome}{selected===person.id&&<span className="sr-only">, selecionado</span>}</button></li>)}</ul>{!people.length&&<p>Nenhum personagem no recorte atual.</p>}</details>
  {view==='proximidade'&&<details className="band-legend" open={bandsOpen} onToggle={e=>setBandsOpen(e.currentTarget.open)}><summary>Faixas de proximidade editorial</summary><ol>{PROXIMITY_BANDS.map((band,i)=><li key={band.min}><span className="band-number">{i+1}</span><strong>{band.range}</strong><span>{band.label}</span></li>)}</ol><p>Do anel interno ao externo. Atribuição editorial, não medida de culpa.</p></details>}
  <span className="graph-theme-probes" aria-hidden="true">{Object.keys(STATUS_CONFIG).map(status=><span key={status} className={`graph-theme-probe status-${status}`}/>)}</span>
 </>;
}
