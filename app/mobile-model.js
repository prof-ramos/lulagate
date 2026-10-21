// Rank by documented connections, with deterministic ties; no factual fields change.
export function openingPeople(people,edges,count=10){
 const degree=new Map(people.map(p=>[p.id,0]));
 for(const e of edges)for(const id of [e.origem,e.destino])degree.set(id,(degree.get(id)||0)+1);
 return [...people].sort((a,b)=>(b.id==='lula')-(a.id==='lula')||(degree.get(b.id)-degree.get(a.id))||a.id.localeCompare(b.id)).slice(0,count).map(p=>p.id);
}
// Greedy screen-space label placement. Selected/central names take precedence.
export function readableLabels(nodes,zoom){
 const boxes=[],visible=[];
 for(const n of [...nodes].sort((a,b)=>Number(b.priority)-Number(a.priority))){
  if(!n.priority&&zoom<.85)continue;
  const w=Math.min(88,n.label.length*6.8),x=n.x*zoom,y=n.y*zoom+28;
  const box={left:x-w/2,right:x+w/2,top:y,bottom:y+30};
  if(boxes.some(b=>box.left<b.right+8&&box.right>b.left-8&&box.top<b.bottom+6&&box.bottom>b.top-6))continue;
  boxes.push(box);visible.push(n.id);
 }
 return visible;
}
