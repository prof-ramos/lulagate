export function personFromSearch(search,people){
 const params=new URLSearchParams(search);
 const original=params.get('p')||params.get('personagem');
 const id=original==='careca-do-inss'?'antonio-carlos-camilo-antunes':original;
 return people.some(p=>p.id===id)?id:null;
}
