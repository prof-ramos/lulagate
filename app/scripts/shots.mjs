import { chromium } from 'playwright';
import { mkdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { resolve, sep } from 'node:path';
import assert from 'node:assert/strict';

const root=fileURLToPath(new URL('../../',import.meta.url));
const app=new URL('../',import.meta.url);
const run=(command,args)=>new Promise((resolve,reject)=>{
 const child=spawn(command,args,{cwd:fileURLToPath(app),stdio:'inherit'});
 child.on('error',reject);child.on('exit',code=>code===0?resolve():reject(new Error(`${command}: ${code}`)));
});
await run('npm',['run','build']);
let virtual=false;
const port=await new Promise((resolve,reject)=>{
 const server=createServer();server.on('error',reject);server.listen(0,'127.0.0.1',()=>{const {port}=server.address();server.close(()=>resolve(port))});
}).catch(error=>{if(error.code!=='EPERM')throw error;virtual=true;return 4173});
const origin=`http://127.0.0.1:${port}`;
const server=virtual?null:spawn(process.execPath,['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port',String(port),'--strictPort'],{cwd:fileURLToPath(app),stdio:'inherit'});
let browser;
const errors=[],external=[];
const dataset=JSON.parse(await readFile(`${root}/data/dataset.json`,'utf8'));
const person=dataset.personagens.find(p=>p.id==='jose-dirceu'&&p.retrato)||dataset.personagens.find(p=>p.retrato);
await mkdir(`${root}/shots/preview`,{recursive:true});
try {
 for(let i=0;!virtual&&i<100;i++){
  try {if((await fetch(origin)).ok)break}catch{}
  if(i===99)throw new Error('Vite preview não iniciou');
  await new Promise(resolve=>setTimeout(resolve,100));
 }
 browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const shots=[['desktop-1280x800',1280,800,''],['mobile-390x844',390,844,''],['mobile-painel-390x844',390,844,`personagem=${person.id}`],['desktop-painel',1280,800,`personagem=${person.id}`],['desktop-proximidade',1280,800,'visualizacao=proximidade'],['mobile-proximidade',390,844,'visualizacao=proximidade']];
 for(const [name,width,height,query] of shots){
  const page=await browser.newPage({viewport:{width,height},colorScheme:'light',reducedMotion:'reduce'});
  page.on('pageerror',e=>errors.push(`${name}: ${e.message}`));
  page.on('console',m=>{if(m.type()==='error')errors.push(`${name}: ${m.text()}`)});
  await page.route('**/*',async route=>{
   const url=route.request().url();
   if(!url.startsWith(origin+'/')&&!/^(data:|blob:)/.test(url)){external.push(url);return route.abort()}
   if(virtual){
    const pathname=decodeURIComponent(new URL(url).pathname);
    const base=resolve(root,'dist'),file=resolve(base,pathname==='/'?'index.html':'.'+pathname);
    if(!file.startsWith(base+sep))return route.abort();
    const body=await readFile(file);
    return route.fulfill({body,contentType:file.endsWith('.webp')?'image/webp':file.endsWith('.html')?'text/html':'application/octet-stream'});
   }
   return route.continue();
  });
  await page.goto(`${origin}/?${query}`,{waitUntil:'networkidle'});
  await page.locator('.graph canvas').first().waitFor();
  await page.evaluate(()=>document.fonts.ready);
  if(query.startsWith('personagem=')){
   await page.locator('.person-portrait img').evaluate(async img=>{await img.decode()});
   assert.equal(await page.locator('.person-portrait figcaption a').count(),2);
   if(width<640){
    const graph=await page.locator('.graph').boundingBox(),panel=await page.locator('.person-panel').boundingBox();
    assert.ok(graph.height>=180&&graph.y+graph.height<=panel.y+1,'painel deve reservar área visível do grafo');
   }
  }
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'overflow horizontal');
  await page.screenshot({path:`${root}/shots/preview/${name}.png`});
  // Verify accessible entry points, filtering, empty state, and direct-link dialogs.
  if(name==='desktop-1280x800'){
   await page.locator('#search').fill('zzzzsemresultado');
   await page.getByText('Nenhum personagem encontrado.',{exact:true}).waitFor();
   await page.locator('#search').fill(person.nome);
   await page.locator('.results button').first().click();
   await page.getByRole('button',{name:'Fechar personagem',exact:true}).click();
   for(const box of await page.locator('fieldset input').all())await box.uncheck();
   await page.getByText('Nenhuma conexão neste recorte',{exact:true}).waitFor();
   await page.getByRole('button',{name:'Limpar filtros',exact:true}).click();
   await page.getByRole('button',{name:'Aumentar zoom',exact:true}).click();
   await page.getByRole('button',{name:'Restaurar enquadramento',exact:true}).click();
  }
  console.log(`Saved ${name}.png`);
  await page.close();
 }
 assert.deepEqual(external,[],'requisições externas');
 assert.deepEqual(errors,[],'erros de navegador');
 console.log(JSON.stringify({screenshots:shots.length,errors,externalRequests:external},null,2));
} finally {await browser?.close();server?.kill()}
