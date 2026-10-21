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
 {label:'família imediata ou convívio íntimo'},
 {label:'círculo próximo'},
 {label:'vínculo direto, forte e repetido'},
 {label:'vínculo direto pontual ou apenas alegado'},
 {label:'vínculo fraco ou indireto'},
 {label:'apenas contexto'},
 {label:'nenhum vínculo'},
];
export const proximityBand=value=>PROXIMITY_BANDS.findIndex(b=>b.label===value?.toLocaleLowerCase('pt-BR'));
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
 if(person.id==='antonio-carlos-camilo-antunes')return 'Antônio Carlos Camilo Antunes';
 if(person.id==='lula')return 'Lula';
 const words=person.nome.trim().split(/\s+/);return words.length>3?`${words[0]} ${words.at(-1)}`:person.nome;
}

export const LEGAL_COLORS={condenado:'#994500',condenacao_anulada:'#6551a3',investigado:'#006d8f',absolvido:'#24704e',arquivado:'#24704e',prescricao:'#24704e',indiciado:'#006d8f',reu:'#994500',institucional:'#687078',sem_informacao:'#626c77'};
export const nodeSize=p=>p.id==='lula'?82:28+Math.min(32,Math.sqrt(p.escandalos?.length||0)*10);
