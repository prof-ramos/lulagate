import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {formatDate} from '../date-model.js';
test('source dates retain supplied precision in Brazilian format',()=>{
 assert.equal(formatDate('2022-01-18'),'18/01/2022');
 assert.equal(formatDate('2022-01'),'01/2022');
 assert.equal(formatDate('2022'),'2022');
 assert.equal(formatDate('18/01/2022'),'18/01/2022');
 assert.equal(formatDate(null),'não informada');
 const sources=JSON.parse(readFileSync(new URL('../../data/sources.json',import.meta.url)));
 assert.equal(formatDate(sources.find(s=>s.id==='poder360-2022-01-mapa').data),'18/01/2022');
});
