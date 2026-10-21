// One pattern per source status: legends and rendered edges use the same values.
export const STATUS_CONFIG={
 condenacao_anulada:{dash:'5 4'}, arquivado:{dash:'1 3'},
 absolvido:{dash:'5 4'}, investigacao_em_curso:{dash:'5 4'},
 fato_documentado:{dash:undefined}, associacao_indireta:{dash:'1 3'},
 alegacao_nao_comprovada:{dash:'1 3'},
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
// Context names shorten only existing words; details always retain the full name.
export function compactLabel(person){
 const alias=person.nome.match(/\(([^)]+)\)/)?.[1];if(alias)return alias;
 if(person.id==='lula')return 'Lula';
 const words=person.nome.trim().split(/\s+/);return words.length>3?`${words[0]} ${words.at(-1)}`:person.nome;
}

// Unused styles are available without assigning new categories to the dataset.
export const LEGAL_RINGS={
 condenado:{color:'#7A2E0E',width:3,style:'solid'},
 reu:{color:'#C2610C',width:3,style:'solid'},
 investigado:{color:'#3D5A80',width:2,style:'solid'},
 condenacao_anulada:{color:'#6E6A63',width:2,style:'dashed'},
 absolvido_arquivado:{color:'#6E6A63',width:2,style:'dashed'},
 arquivado:{color:'#A8A29E',width:2,style:'dotted'},
 sem_informacao:{color:'#D6D3CE',width:1,style:'solid'},
};
export const LEGAL_COLORS=Object.fromEntries(Object.entries(LEGAL_RINGS).map(([key,ring])=>[key,ring.color]));
export const nodeSize=(p,maxCases=3)=>p.id==='lula'?88:32+32*Math.sqrt(Math.min(maxCases,p.escandalos?.length||0)/Math.max(1,maxCases));
