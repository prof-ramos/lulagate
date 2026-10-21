import React,{useEffect,useLayoutEffect,useMemo,useRef,useState} from 'react';
import {forceSimulation,forceManyBody,forceCollide,forceLink,forceCenter} from 'd3-force';
import {select} from 'd3-selection';
import {zoom,zoomIdentity} from 'd3-zoom';
import {edgePath,parallelSlots,proximityBand,PROXIMITY_BANDS,STATUS_CONFIG} from './graph-model.js';

export default function Graph({data,view,selected,onSelect,visibleNodes,visibleEdges,graphRef,matches}){
 const svg=useRef(),layer=useRef(),zoomRef=useRef();
 const [camera,setCamera]=useState(zoomIdentity),[hovered,setHovered]=useState(null),[bandsOpen,setBandsOpen]=useState(()=>!matchMedia('(max-width:640px)').matches);
 const scale=camera.k;
 const slots=useMemo(()=>parallelSlots(data.conexoes),[data]);
 // Both layouts are stable across filters. Only the relation layout uses links;
 // editorial proximity determines the seven bands exclusively in Proximidade.
 const nodes=useMemo(()=>{
  const ns=data.personagens.map(p=>({...p}));
  PROXIMITY_BANDS.forEach((_,b)=>{
   const list=ns.filter(p=>p.id!=='lula'&&proximityBand(p.proximidade_lula)===b).sort((a,b)=>a.nome.localeCompare(b.nome,'pt-BR'));
   list.forEach((p,i)=>{const angle=i/list.length*Math.PI*2-Math.PI/2;p.x=Math.cos(angle)*(b+1)*108;p.y=Math.sin(angle)*(b+1)*108;if(view==='proximidade'){p.fx=p.x;p.fy=p.y}});
  });
  const lula=ns.find(p=>p.id==='lula');if(lula){lula.x=0;lula.y=0;if(view==='proximidade'){lula.fx=0;lula.fy=0}}
  if(view==='rede'){
   // Equal initial spacing avoids using editorial proximity as a network force.
   ns.forEach((p,i)=>{const angle=i*Math.PI*(3-Math.sqrt(5)),r=75*Math.sqrt(i);p.x=Math.cos(angle)*r;p.y=Math.sin(angle)*r});
   const links=data.conexoes.map(e=>({source:e.origem,target:e.destino}));
   const sim=forceSimulation(ns).force('links',forceLink(links).id(p=>p.id).distance(145).strength(.22)).force('charge',forceManyBody().strength(-350)).force('collide',forceCollide(48).iterations(3)).force('center',forceCenter(0,0)).stop();
   for(let i=0;i<360;i++)sim.tick();
  }
  return ns;
 },[data,view]);
 const byId=useMemo(()=>Object.fromEntries(nodes.map(p=>[p.id,p])),[nodes]);
 const shown=useMemo(()=>visibleNodes.map(p=>byId[p.id]),[visibleNodes,byId]);
 const neighbors=useMemo(()=>new Set(visibleEdges.filter(e=>e.origem===selected||e.destino===selected).flatMap(e=>[e.origem,e.destino])),[visibleEdges,selected]);
 const panelOpen=Boolean(selected);
 useEffect(()=>{
  const z=zoom().scaleExtent([.05,4]).on('zoom',e=>{select(layer.current).attr('transform',e.transform);setCamera(e.transform)});
  zoomRef.current=z;select(svg.current).call(z);return()=>select(svg.current).on('.zoom',null);
 },[]);
 useEffect(()=>{
  const element=svg.current;
  const fit=()=>{
   const rect=element.getBoundingClientRect();if(!rect.width||!rect.height)return;
   let width=rect.width,height=rect.height;
   const panel=document.querySelector('.person-panel');
   if(panel){const box=panel.getBoundingClientRect();if(box.left<rect.right&&box.right>rect.left&&box.top<rect.bottom){if(matchMedia('(max-width:640px)').matches)height=Math.max(1,box.top-rect.top);else width=Math.max(1,box.left-rect.left)}}
   element.setAttribute('viewBox',`0 0 ${rect.width} ${rect.height}`);
   if(!shown.length){select(element).call(zoomRef.current.transform,zoomIdentity.translate(width/2,height/2));return}
   // Include the editorial bands so their order remains inspectable when filtered.
   const radius=view==='proximidade'?756:0;
   const minX=Math.min(...shown.map(p=>p.x-90),...(radius?[-radius]:[])),maxX=Math.max(...shown.map(p=>p.x+90),...(radius?[radius]:[]));
   const minY=Math.min(...shown.map(p=>p.y-40),...(radius?[-radius]:[])),maxY=Math.max(...shown.map(p=>p.y+50),...(radius?[radius]:[]));
   const paddingX=Math.min(52,width*.1),paddingY=Math.min(76,height*.15);
   const k=Math.max(.05,Math.min((width-2*paddingX)/(maxX-minX),(height-2*paddingY)/(maxY-minY)));
   select(element).call(zoomRef.current.transform,zoomIdentity.translate(width/2-(minX+maxX)*k/2,height/2-(minY+maxY)*k/2).scale(k));
  };
  const observer=new ResizeObserver(fit);observer.observe(element);window.addEventListener('resize',fit);
  const frame=requestAnimationFrame(fit);
  graphRef.current={reset:fit,zoomBy:k=>select(element).call(zoomRef.current.scaleBy,k)};
  return()=>{observer.disconnect();window.removeEventListener('resize',fit);cancelAnimationFrame(frame)};
 // Opening or closing a panel may fit; switching between people preserves camera.
 },[shown,view,panelOpen]);
 useLayoutEffect(()=>{
  const occupied=[];
  const overlaps=(a,b)=>a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top;
  const priority=p=>selected===p.id?5:hovered===p.id?4:matches.has(p.id)?3:neighbors.has(p.id)?2:1;
  const labels=new Map([...svg.current.querySelectorAll('.node')].map(el=>[el.dataset.id,el.querySelector('text')]));
  // Reset together before measuring; priority names stay within the usable viewport.
  for(const el of labels.values()){el.style.display='';el.removeAttribute('dx');el.removeAttribute('dy')}
  const viewport=svg.current.getBoundingClientRect();let right=viewport.right,bottom=viewport.bottom;
  const panel=document.querySelector('.person-panel')?.getBoundingClientRect();
  if(panel&&panel.left<viewport.right&&panel.right>viewport.left&&panel.top<viewport.bottom){if(matchMedia('(max-width:640px)').matches)bottom=Math.max(viewport.top,panel.top);else right=Math.max(viewport.left,panel.left)}
  const measured=new Map([...labels].map(([id,el])=>[id,el.getBoundingClientRect()]));
  [...shown].sort((a,b)=>priority(b)-priority(a)||a.nome.localeCompare(b.nome,'pt-BR')).forEach(p=>{
   const el=labels.get(p.id),r=measured.get(p.id);let dx=0,dy=0;
   if(selected===p.id||hovered===p.id){
    dx=Math.max(viewport.left+8-r.left,Math.min(0,right-8-r.right));
    dy=Math.max(viewport.top+64-r.top,Math.min(0,bottom-28-r.bottom));
    el.setAttribute('dx',dx/scale);el.setAttribute('dy',dy/scale);
   }
   const box={left:r.left+dx-4,right:r.right+dx+4,top:r.top+dy-3,bottom:r.bottom+dy+3};
   if(selected!==p.id&&hovered!==p.id&&occupied.some(other=>overlaps(box,other)))el.style.display='none';else occupied.push(box);
  });
 },[shown,selected,hovered,matches,neighbors,camera]);
 const pan=e=>{
  const directions={ArrowLeft:[48,0],ArrowRight:[-48,0],ArrowUp:[0,48],ArrowDown:[0,-48]};
  if(!directions[e.key])return;e.preventDefault();
  const [x,y]=directions[e.key];select(svg.current).call(zoomRef.current.translateBy,x/scale,y/scale);
 };
 return <><svg ref={svg} className="graph" viewBox="0 0 1000 700" tabIndex={0} onKeyDown={pan} aria-describedby="graph-keyboard-help" aria-label={`Mapa interativo: ${shown.length} personagens e ${visibleEdges.length} conexões no recorte`}><g ref={layer}>
  {view==='proximidade'&&shown.length>0&&PROXIMITY_BANDS.map((b,i)=><g key={b.min} className="ring"><circle r={(i+1)*108}/><title>{b.range}: {b.label}</title></g>)}
  <g className="edges">{visibleEdges.map(e=>{const relevant=!selected||e.origem===selected||e.destino===selected;return <path key={e.id} className={`edge status-${e.status} ${relevant?'neighbor':'context'}`} d={edgePath(e,byId,slots)} fill="none" vectorEffect="non-scaling-stroke" strokeWidth={selected&&relevant?2.8:1.5} strokeDasharray={STATUS_CONFIG[e.status]?.dash} opacity={relevant?1:.18}><title>{byId[e.origem]?.nome} → {byId[e.destino]?.nome}: {e.rotulo} · {data.meta.legenda_status[e.status]}</title></path>})}</g>
  {[...shown].sort((a,b)=>Number(a.id===selected)-Number(b.id===selected)).map(p=>{
   const radius=p.id==='lula'?25:12,context=selected&&p.id!==selected&&!neighbors.has(p.id);
   return <g key={p.id} data-id={p.id} className={`node ${selected===p.id?'selected':''} ${neighbors.has(p.id)?'neighbor':''} ${context?'context':''} ${p.id==='lula'?'central':''}`} transform={`translate(${p.x},${p.y})`} opacity={context?.22:1} onMouseEnter={()=>setHovered(p.id)} onMouseLeave={()=>setHovered(null)} onFocus={()=>setHovered(p.id)} onBlur={()=>setHovered(null)} role="button" tabIndex={0} aria-label={`${p.nome}${selected===p.id?', selecionado':''}`} aria-pressed={selected===p.id} onClick={()=>onSelect(p.id)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();onSelect(p.id)}}}>
    <circle className="node-hit" r={Math.max(radius,22/scale)} fill="transparent" style={{pointerEvents:'all',stroke:'none'}}/><circle r={radius}/><text y={radius+17/scale} textAnchor="middle" style={{fontSize:(selected===p.id?14:13)/scale,strokeWidth:3/scale,pointerEvents:'all'}}>{p.id==='lula'&&selected!==p.id?'Lula':p.nome}</text><title>{p.nome} · {p.faixa_proximidade}</title>
   </g>
  })}
 </g></svg><span id="graph-keyboard-help" className="sr-only">Use as setas com foco no mapa ou em um personagem para mover o mapa. Tab percorre os personagens; Enter ou espaço abre seus detalhes. Os botões de zoom ampliam, reduzem e restauram o enquadramento.</span>{view==='proximidade'&&<details className="band-legend" open={bandsOpen} onToggle={e=>setBandsOpen(e.currentTarget.open)}><summary>Faixas de proximidade editorial</summary><ol>{PROXIMITY_BANDS.map((b,i)=><li key={b.min}><span className="band-number">{i+1}</span><strong>{b.range}</strong><span>{b.label}</span></li>)}</ol><p>Do anel interno ao externo. Atribuição editorial, não medida de culpa.</p></details>}</>;
}
