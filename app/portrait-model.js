import {compactLabel} from './graph-model.js';

export function initials(person){
 const words=compactLabel(person).trim().split(/\s+/).filter(word=>!['de','da','do','das','dos','e'].includes(word.toLocaleLowerCase('pt-BR')));
 return (words.length>1?words[0][0]+words.at(-1)[0]:words[0]?.[0]||'?').toLocaleUpperCase('pt-BR');
}

// Only local filenames from the bundled dataset may become image requests.
export function portraitSource(person,base='./'){
 const file=person.retrato?.arquivo;
 return typeof file==='string'&&/^retratos\/[a-z0-9-]+\.webp$/.test(file)?`${base.replace(/\/?$/,'/')}${file}`:null;
}
