import React,{useState} from 'react';
import {initials,portraitSource} from './portrait-model.js';

export default function Portrait({person}){
 const [failed,setFailed]=useState(false);
 const src=portraitSource(person,import.meta.env.BASE_URL),credit=person.retrato;
 if(!src||failed)return <div className="person-initials" aria-label={`Iniciais de ${person.nome}`}>{initials(person)}</div>;
 return <figure className="person-portrait"><img src={src} alt={`Retrato de ${person.nome}`} width="128" height="128" onError={()=>setFailed(true)}/><figcaption>Autor: {credit.autor}<br/><a href={credit.licenca_url||credit.url_origem} target="_blank" rel="noopener noreferrer">{credit.licenca}</a><br/><a href={credit.url_origem} target="_blank" rel="noopener noreferrer">Origem: Wikimedia Commons</a></figcaption></figure>;
}
