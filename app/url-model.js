export function personFromSearch(search,people){
 const params=new URLSearchParams(search);
 const id=params.get('p')||params.get('personagem');
 return people.some(p=>p.id===id)?id:null;
}
