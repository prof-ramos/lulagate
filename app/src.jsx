import React,{useState,useEffect,useLayoutEffect,useRef,useMemo} from 'react';
import{createRoot}from'react-dom/client';
import{forceSimulation,forceManyBody,forceCollide,forceRadial}from'd3-force';
import{select}from'd3-selection';
import{zoom,zoomIdentity}from'd3-zoom';
import{marked}from'marked';
import rawData from '../data/dataset.json';
import './style.css';
// Normalize display text once; preserve source URLs and partial dates (years).
const displayText=s=>s.replace(/—/g,'–').replace(/\b(\d{4})-(\d{2})-(\d{2})\b/g,'$3/$2/$1');
function displayData(value,key){
  if(typeof value==='string')return key==='url'?value:displayText(value);
  if(Array.isArray(value))return value.map(item=>displayData(item));
  if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).map(([k,v])=>[k,displayData(v,k)]));
  return value;
}
const data=displayData(rawData);
const people=Object.fromEntries(data.personagens.map(p=>[p.id,p])), sources=Object.fromEntries(data.fontes.map(s=>[s.id,s]));
const statuses=Object.entries(data.meta.legenda_status), colors=['#9a7baf','#81938c','#728c9a','#b29357','#7c8290','#a18a78','#ad8391'];
const styleStatus=s=>({color:colors[statuses.findIndex(([k])=>k===s)]||'#888'});
const bands=[.9,.7,.5,.3,.1,.01,0], bandNames=['0,90–1,00','0,70–0,89','0,50–0,69','0,30–0,49','0,10–0,29','0,01–0,09','0'];
const band=p=>bands.findIndex(n=>p.proximidade_lula>=n);
const date=s=>s?displayText(s):'não informada';
const period=p=>typeof p==='object'?[p?.inicio||'Início não informado',p?.fim||'em aberto'].join(' – '):p;
function readURL(){const q=new URLSearchParams(location.search);return {visualizacao:q.get('visualizacao')==='proximidade'?'proximidade':'rede',personagem:people[q.get('personagem')]?q.get('personagem'):null,escandalo:data.escandalos.some(c=>c.id===q.get('escandalo'))?q.get('escandalo'):null,modal:['escandalos','metodologia'].includes(q.get('modal'))?q.get('modal'):(q.has('escandalo')?'escandalos':null)}}
function Badge({status}){return <span className="badge" style={styleStatus(status)}>{data.meta.legenda_status[status]||status}</span>}
function Sources({ids=[]}){return <ul className="sources">{[...new Set(ids)].map(id=>sources[id]).filter(Boolean).map(s=><li key={s.id}><a href={s.url} target="_blank" rel="noopener noreferrer"><strong>{s.veiculo}</strong><span>{s.titulo} ↗</span><small>{date(s.data)}</small></a></li>)}</ul>}
function Dialog({title,close,children}){const ref=useRef();useEffect(()=>{const old=document.activeElement;ref.current.focus();return()=>old?.focus()},[]);return <div className="backdrop" onClick={close}><section ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-label={title} className="modal" onClick={e=>e.stopPropagation()} onKeyDown={e=>{if(e.key==='Tab'){const els=ref.current.querySelectorAll('button,a,input,select');const first=els[0],last=els[els.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}}}}><header><h2>{title}</h2><button onClick={close} aria-label="Fechar modal">✕</button></header>{children}</section></div>}
function Graph({view,selected,onSelect,enabled,caseId,graphRef,matches}){const svg=useRef(),layer=useRef(),zoomRef=useRef();const [scale,setScale]=useState(1),[hovered,setHovered]=useState(null);const nodes=useMemo(()=>{const ns=data.personagens.map(p=>({...p}));bands.forEach((_,b)=>{const list=ns.filter(p=>p.id!=='lula'&&band(p)===b).sort((a,b)=>b.proximidade_lula-a.proximidade_lula||a.nome.localeCompare(b.nome,'pt-BR'));list.forEach((p,i)=>{const angle=i/list.length*Math.PI*2-Math.PI/2;p.x=Math.cos(angle)*(b+1)*108;p.y=Math.sin(angle)*(b+1)*108;if(view==='proximidade'){p.fx=p.x;p.fy=p.y}})});const lula=ns.find(p=>p.id==='lula');lula.x=0;lula.y=0;lula.fx=0;lula.fy=0;if(view==='rede'){const sim=forceSimulation(ns).randomSource(()=>.42).force('radial',forceRadial(p=>p.id==='lula'?0:100+(1-p.proximidade_lula)*600,0,0).strength(.9)).force('charge',forceManyBody().strength(-90)).force('collide',forceCollide(p=>p.id==='lula'?70:54).strength(1).iterations(3)).stop();for(let i=0;i<320;i++)sim.tick()}return ns},[view]);
const byId=useMemo(()=>Object.fromEntries(nodes.map(p=>[p.id,p])),[nodes]);
const edges=data.conexoes.filter(e=>enabled.has(e.status)&&(!caseId||e.escandalos.includes(caseId)));
const active=new Set(edges.flatMap(e=>[e.origem,e.destino]));
useEffect(()=>{const z=zoom().scaleExtent([.05,4]).on('zoom',e=>{select(layer.current).attr('transform',e.transform);setScale(e.transform.k)});zoomRef.current=z;select(svg.current).call(z);return()=>select(svg.current).on('.zoom',null)},[]);
useEffect(()=>{
  const element=svg.current;
  const fit=()=>{
    const rect=element.getBoundingClientRect();
    if(!rect.width||!rect.height)return;
    let width=rect.width,height=rect.height;
    const panel=document.querySelector('.person-panel');
    if(panel){const box=panel.getBoundingClientRect();if(box.left<rect.right&&box.right>rect.left&&box.top<rect.bottom){if(matchMedia('(max-width:640px)').matches)height=Math.max(1,box.top-rect.top);else width=Math.max(1,box.left-rect.left)}}
    element.setAttribute('viewBox',`0 0 ${rect.width} ${rect.height}`);
    const radius=view==='proximidade'?756:0;
    const minX=Math.min(-radius,...nodes.map(p=>p.x-30)),maxX=Math.max(radius,...nodes.map(p=>p.x+30));
    const minY=Math.min(-radius,...nodes.map(p=>p.y-30)),maxY=Math.max(radius,...nodes.map(p=>p.y+30));
    const paddingX=Math.min(60,width*.12),paddingY=Math.min(76,height*.2);
    const k=Math.max(.05,Math.min((width-2*paddingX)/(maxX-minX),(height-2*paddingY)/(maxY-minY)));
    select(element).call(zoomRef.current.transform,zoomIdentity.translate(width/2-(minX+maxX)*k/2,height/2-(minY+maxY)*k/2+8).scale(k));
  };
  const observer=new ResizeObserver(fit);observer.observe(element);
  window.addEventListener('resize',fit);
  const frame=requestAnimationFrame(fit);
  graphRef.current={reset:fit,zoomBy:k=>select(element).call(zoomRef.current.scaleBy,k)};
  return()=>{observer.disconnect();window.removeEventListener('resize',fit);cancelAnimationFrame(frame)};
},[nodes,selected,view]);
// Measure SVG text after layout in screen pixels, including the current zoom.
// Ring captions reserve space first; node captions then compete by priority.
useLayoutEffect(()=>{
  const occupied=[];
  const box=el=>{const r=el.getBoundingClientRect();return {left:r.left-3,right:r.right+3,top:r.top-3,bottom:r.bottom+3}};
  const overlaps=(a,b)=>a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top;
  svg.current.querySelectorAll('.ring text').forEach(el=>{
    el.setAttribute('dy','0');
    let bounds=box(el),offset=0;
    while(occupied.some(other=>overlaps(bounds,other))){
      offset+=18;
      el.setAttribute('dy',offset/scale);
      bounds=box(el);
    }
    occupied.push(bounds);
  });
  const priority=p=>selected===p.id?3:hovered===p.id?2:matches.has(p.id)?1:0;
  const ordered=[...nodes].sort((a,b)=>priority(b)-priority(a)||b.proximidade_lula-a.proximidade_lula||a.nome.localeCompare(b.nome,'pt-BR'));
  const labels=new Map([...svg.current.querySelectorAll('.node')].map(el=>[el.dataset.id,el.querySelector('text')]));
  ordered.forEach(p=>{
    const el=labels.get(p.id);
    el.style.display='';
    if(!(active.has(p.id)||p.id==='lula'||priority(p))){el.style.display='none';return;}
    const bounds=box(el);
    if(occupied.some(other=>overlaps(bounds,other)))el.style.display='none';
    else occupied.push(bounds);
  });
});
return <svg ref={svg} className="graph" viewBox="0 0 1000 700" aria-label="Mapa interativo de relações"><g ref={layer}>{view==='proximidade'&&bands.map((_,i)=><g key={i} className="ring"><circle r={(i+1)*108}/><text x={Math.cos((-65+i*8)*Math.PI/180)*(i+1)*108} y={Math.sin((-65+i*8)*Math.PI/180)*(i+1)*108} textAnchor="middle" style={{fontSize:11/scale,strokeWidth:3/scale}}>{bandNames[i]} { ['Família imediata','Círculo próximo','Vínculo direto forte','Vínculo direto pontual','Vínculo indireto','Vínculo remoto','Apenas contexto'][i]}</text></g>)}<g>{edges.map(e=>{const a=byId[e.origem],b=byId[e.destino];if(!a||!b)return null;return <line key={e.id} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={styleStatus(e.status).color} strokeWidth={selected&&(e.origem===selected||e.destino===selected)?3:1.5} strokeDasharray={e.status==='alegacao_nao_comprovada'?'3 6':e.status==='associacao_indireta'?'9 5':e.status==='arquivado'||e.status==='condenacao_anulada'?'5 4':undefined} opacity={selected&&e.origem!==selected&&e.destino!==selected?.18:.55}><title>{people[e.origem]?.nome} → {people[e.destino]?.nome}: {e.rotulo} · {data.meta.legenda_status[e.status]}</title></line>})}</g>{nodes.map(p=><g key={p.id} data-id={p.id} className={`node ${selected===p.id?'selected':''} ${p.id==='lula'?'central':''}`} transform={`translate(${p.x},${p.y})`} opacity={active.has(p.id)||p.id==='lula'||selected===p.id||hovered===p.id||matches.has(p.id)?1:.13} onMouseEnter={()=>setHovered(p.id)} onMouseLeave={()=>setHovered(null)} onFocus={()=>setHovered(p.id)} onBlur={()=>setHovered(null)} role="button" tabIndex={0} aria-label={p.nome} onClick={()=>onSelect(p.id)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();onSelect(p.id)}}}><circle r={p.id==='lula'?29:10+p.proximidade_lula*6}/><text y={(p.id==='lula'?29:10+p.proximidade_lula*6)+14/scale} textAnchor="middle" style={{fontSize:11/scale,strokeWidth:3/scale}}>{p.id==='lula'?'Lula':p.nome}</text><title>{p.nome} · {p.faixa_proximidade}</title></g>)}</g></svg>}
function App(){const[state,setState]=useState(readURL),[enabled,setEnabled]=useState(new Set(statuses.map(([k])=>k))),[query,setQuery]=useState(''),[controls,setControls]=useState(false),[theme,setTheme]=useState(()=>{try{return localStorage.getItem('lula-gate-theme')||(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light')}catch{return'light'}});const graphRef=useRef();
const update=patch=>setState(prev=>{const next={...prev,...patch};const url=new URL(location.href);Object.entries(next).forEach(([k,v])=>v?url.searchParams.set(k,v):url.searchParams.delete(k));history.pushState({},'',url);return next});
useEffect(()=>{const url=new URL(location.href);url.searchParams.set('visualizacao',state.visualizacao);history.replaceState({},'',url);const pop=()=>setState(readURL());window.addEventListener('popstate',pop);return()=>window.removeEventListener('popstate',pop)},[]);
useEffect(()=>{document.documentElement.dataset.theme=theme;try{localStorage.setItem('lula-gate-theme',theme)}catch{}},[theme]);
useEffect(()=>{const key=e=>{if(e.key==='Escape'){if(state.modal)update({modal:null});else if(state.personagem)update({personagem:null});else setControls(false)}};window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key)},[state]);
useEffect(()=>{if(state.modal==='escandalos'&&state.escandalo)requestAnimationFrame(()=>document.getElementById(state.escandalo)?.scrollIntoView({block:'start'}))},[state.modal,state.escandalo]);
const openPerson=id=>{update({personagem:id,modal:null});setQuery('')};const person=people[state.personagem];const connected=person?data.conexoes.filter(e=>e.origem===person.id||e.destino===person.id):[];const results=query.trim()?data.personagens.filter(p=>p.nome.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().includes(query.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase())):[];
return <><header className="masthead"><div className="brand"><h1>Lula Gate<span>.</span></h1><p>Relações, contexto e fontes públicas</p></div><nav><button onClick={()=>update({modal:'escandalos'})}>Os casos <span>{data.escandalos.length}</span></button><button onClick={()=>update({modal:'metodologia'})}>Metodologia</button><button aria-label="Alternar tema" onClick={()=>setTheme(theme==='dark'?'light':'dark')}>{theme==='dark'?'☀':'☾'}</button></nav></header><main><aside className={`controls ${controls?'expanded':''}`}><div className="controls-top"><h2>Explore as relações</h2><button className="mobile-toggle" onClick={()=>setControls(!controls)} aria-expanded={controls}>{controls?'Recolher':'Filtros e busca'}</button></div><div className="control-body"><p className="intro">Um mapa de vínculos documentados. Proximidade não é medida de culpa.</p><div className="search"><label htmlFor="search">Buscar personagem</label><input id="search" value={query} placeholder="Digite um nome…" onChange={e=>setQuery(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&results[0])openPerson(results[0].id)}}/>{query&&<div className="results">{results.length?results.map(p=><button key={p.id} onClick={()=>openPerson(p.id)}>{p.nome}</button>):<p>Nenhum personagem encontrado.</p>}</div>}</div><label>Visualização</label><div className="segmented">{[['rede','Rede'],['proximidade','Proximidade']].map(([v,l])=><button key={v} aria-pressed={state.visualizacao===v} className={state.visualizacao===v?'active':''} onClick={()=>update({visualizacao:v})}>{l}</button>)}</div><p className="hint">{state.visualizacao==='rede'?'Quanto mais próximo do centro, maior o vínculo com Lula.':'Sete anéis organizados por faixa de proximidade editorial.'}</p><label htmlFor="case">Filtrar por caso</label><select id="case" value={state.escandalo||''} onChange={e=>update({escandalo:e.target.value||null})}><option value="">Todos os casos</option>{data.escandalos.map(c=><option key={c.id} value={c.id}>{c.titulo}</option>)}</select>{state.escandalo&&<button className="text-button" onClick={()=>update({modal:'escandalos'})}>Ler o caso selecionado ↗</button>}<fieldset><legend>Status das conexões</legend>{statuses.map(([k,l],i)=><label className="check" key={k}><input type="checkbox" checked={enabled.has(k)} onChange={()=>setEnabled(prev=>{const next=new Set(prev);next.has(k)?next.delete(k):next.add(k);return next})}/><span className="line-key" style={{borderColor:colors[i],borderStyle:['arquivado','condenacao_anulada','associacao_indireta','alegacao_nao_comprovada'].includes(k)?'dashed':'solid'}}/>{l}</label>)}</fieldset><p className="hint">Clique em um nome para consultar vínculos e fontes. Arraste o mapa e use o zoom para explorar.</p></div></aside><section className="canvas"><div className="map-caption"><strong>{data.personagens.length} personagens</strong><span>{data.conexoes.length} conexões documentadas</span></div><Graph view={state.visualizacao} selected={state.personagem} onSelect={openPerson} enabled={enabled} caseId={state.escandalo} graphRef={graphRef} matches={new Set(results.map(p=>p.id))}/><div className="zoom-controls"><button aria-label="Aumentar zoom" onClick={()=>graphRef.current.zoomBy(1.3)}>+</button><button aria-label="Diminuir zoom" onClick={()=>graphRef.current.zoomBy(1/1.3)}>−</button><button aria-label="Restaurar enquadramento" onClick={()=>graphRef.current.reset()}>⌖</button></div><span className="map-note">{state.visualizacao==='rede'?'Rede de relações':'Anéis de proximidade'}</span></section>{person&&<aside className="person-panel" aria-label="Detalhes do personagem"><button className="close" aria-label="Fechar personagem" onClick={()=>update({personagem:null})}>✕</button><small>Personagem</small><h2>{person.nome}</h2><p className="occupation">{person.ocupacao}</p><div className="proximity">{person.faixa_proximidade}<span>{person.proximidade_lula.toFixed(2).replace('.',',')}</span></div><h3>Relação com Lula</h3><p>{person.relacao_com_lula}</p><p>{person.resumo}</p>{person.situacao_juridica&&<blockquote>{person.situacao_juridica}</blockquote>}<h3>Grupos e papéis</h3><ul>{person.grupos.map(g=><li key={g.grupo_id}>{data.grupos.find(x=>x.id===g.grupo_id)?.nome} · {g.papel}</li>)}</ul><h3>Conexões <small>({connected.length})</small></h3>{connected.map(e=>{const other=e.origem===person.id?e.destino:e.origem;return <article className="connection" key={e.id}><button className="person-link" onClick={()=>openPerson(other)}>{people[other]?.nome}</button><Badge status={e.status}/><p>{people[e.origem]?.nome} → {people[e.destino]?.nome}: {e.rotulo}</p><p>{e.descricao}</p><small>{period(e.periodo)}</small><Sources ids={e.fontes}/></article>})}<h3>Fontes do personagem</h3><Sources ids={person.fontes||connected.flatMap(e=>e.fontes)}/></aside>}</main><footer><span>Data de corte: 20/10/2026</span><p>Uma conexão não indica culpa. Condenações anuladas e casos arquivados estão identificados.</p></footer>{state.modal&&<Dialog title={state.modal==='metodologia'?'Metodologia':'Os casos'} close={()=>update({modal:null})}>{state.modal==='metodologia'?<div className="markdown" dangerouslySetInnerHTML={{__html:marked.parse(data.meta.metodologia)}}/>:<><p className="modal-intro">Cronologia dos casos, seus desfechos e a versão de Lula, conforme as fontes do levantamento.</p><div className="timeline">{[...data.escandalos].sort((a,b)=>(a.periodo.inicio||'').split('/').reverse().join('-').localeCompare((b.periodo.inicio||'').split('/').reverse().join('-'))).map(c=><article id={c.id} key={c.id} className={state.escandalo===c.id?'case chosen':'case'}><small>{period(c.periodo)}</small><h3>{c.titulo}</h3><Badge status={c.status}/><p>{c.status_detalhe}</p><p>{c.resumo}</p><h4>Papel de Lula</h4><p>{c.papel_de_lula}</p><blockquote><h4>Versão de Lula</h4><p>{c.versao_de_lula}</p></blockquote><div className="people-tags">{c.personagens.map(id=><button key={id} onClick={()=>openPerson(id)}>{people[id]?.nome||id}</button>)}</div><button className="filter-case" onClick={()=>update({escandalo:c.id,modal:null})}>Explorar este caso no mapa</button><details><summary>Fontes ({c.fontes.length})</summary><Sources ids={c.fontes}/></details></article>)}</div></>}</Dialog>}</>}
createRoot(document.getElementById('root')).render(<App/>);
