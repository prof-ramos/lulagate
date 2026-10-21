// One pattern per source status: legends and rendered edges use the same values.
export const STATUS_CONFIG={
 condenacao_anulada:{dash:'10 3 2 3'},
 arquivado:{dash:'5 4'},
 absolvido:{dash:'1 3'},
 investigacao_em_curso:{dash:'12 3'},
 fato_documentado:{dash:undefined},
 associacao_indireta:{dash:'9 5'},
 alegacao_nao_comprovada:{dash:'3 6'},
};
export const PROXIMITY_BANDS=[
 {min:.9,range:'0,90–1,00',label:'família imediata ou convívio íntimo'},
 {min:.7,range:'0,70–0,89',label:'círculo próximo'},
 {min:.5,range:'0,50–0,69',label:'vínculo direto, forte e repetido'},
 {min:.3,range:'0,30–0,49',label:'vínculo direto pontual ou apenas alegado'},
 {min:.1,range:'0,10–0,29',label:'vínculo fraco ou indireto'},
 {min:.01,range:'0,01–0,09',label:'apenas contexto'},
 {min:0,range:'0',label:'nenhum vínculo'},
];
export const proximityBand=value=>PROXIMITY_BANDS.findIndex(b=>value>=b.min);
export function filterGraph(people,edges,enabled,caseId){
 const visibleEdges=edges.filter(e=>enabled.has(e.status)&&(!caseId||e.escandalos.includes(caseId)));
 const active=new Set(visibleEdges.flatMap(e=>[e.origem,e.destino]));
 return {nodes:people.filter(p=>active.has(p.id)),edges:visibleEdges};
}
export function parallelSlots(edges){
 const groups=new Map(),slots=new Map();
 for(const e of edges){const key=[e.origem,e.destino].sort().join('\0');if(!groups.has(key))groups.set(key,[]);groups.get(key).push(e)}
 for(const group of groups.values())group.sort((a,b)=>a.id.localeCompare(b.id)).forEach((e,i)=>slots.set(e.id,i-(group.length-1)/2));
 return slots;
}
export function edgePath(edge,positions,slots){
 const [first,last]=[edge.origem,edge.destino].sort();
 const a=positions[first],b=positions[last];if(!a||!b)return '';
 const dx=b.x-a.x,dy=b.y-a.y,length=Math.hypot(dx,dy)||1,offset=(slots.get(edge.id)||0)*48;
 return `M ${a.x} ${a.y} Q ${(a.x+b.x)/2-dy/length*offset} ${(a.y+b.y)/2+dx/length*offset} ${b.x} ${b.y}`;
}
// Context names shorten only existing words; details always retain the full name.
export function compactLabel(person){
 const alias=person.nome.match(/\(([^)]+)\)/)?.[1];if(alias)return alias;
 if(person.id==='lula')return 'Lula';
 const words=person.nome.trim().split(/\s+/);return words.length>3?`${words[0]} ${words.at(-1)}`:person.nome;
}
export function wrapLabel(text,maxWidth,measure){
 const lines=[];let line='';
 for(const word of text.trim().split(/\s+/)){
  if(line&&measure(`${line} ${word}`)<=maxWidth){line+=` ${word}`;continue}
  if(line){lines.push(line);line=''}
  let part='';
  for(const char of word){if(part&&measure(part+char)>maxWidth){lines.push(part);part=''}part+=char}
  line=part;
 }
 if(line)lines.push(line);return lines;
}
