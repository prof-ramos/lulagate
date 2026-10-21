import {compactLabel} from './graph-model.js';

export function initials(person){
 const words=compactLabel(person).trim().split(/\s+/).filter(word=>!['de','da','do','das','dos','e'].includes(word.toLocaleLowerCase('pt-BR')));
 return (words.length>1?words[0][0]+words.at(-1)[0]:words[0]?.[0]||'?').toLocaleUpperCase('pt-BR');
}

// Only local filenames from the bundled dataset may become image requests.
export function portraitSource(person,base='./'){
 const embedded=person.retrato?.base64;
 if(typeof embedded==='string'&&/^data:image\/webp;base64,[A-Za-z0-9+/]+=*$/.test(embedded))return embedded;
 const file=person.retrato?.arquivo;
 return typeof file==='string'&&/^retratos\/[a-z0-9-]+\.webp$/.test(file)?`${base.replace(/\/?$/,'/')}${file}`:null;
}

const initialImages=new Map();
// Called after document.fonts.ready: canvas uses the same local Inter as the UI.
export function initialsImage(person){
 const letters=initials(person);
 if(initialImages.has(letters))return initialImages.get(letters);
 const canvas=document.createElement('canvas');canvas.width=canvas.height=96;
 const context=canvas.getContext('2d');
 context.fillStyle='#E7E3DA';context.fillRect(0,0,96,96);
 context.font='600 30px Inter';context.fillStyle='#1C1B19';context.textAlign='center';context.textBaseline='middle';context.fillText(letters,48,48);
 const image=canvas.toDataURL('image/png');initialImages.set(letters,image);return image;
}
