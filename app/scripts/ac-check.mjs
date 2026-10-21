import {chromium} from 'playwright';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {createServer} from 'node:net';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
const root=fileURLToPath(new URL('../../',import.meta.url)),app=`${root}/app`;
const report={target:'local build',productionVerified:false,results:[]};
const check=async(id,fn)=>{try{const detail=await fn();report.results.push({id,level:id==='AC-10'?'WARN':'BLOCK',status:'PASS',detail});}catch(e){report.results.push({id,level:id==='AC-10'?'WARN':'BLOCK',status:'FAIL',detail:e.message});}};
const run=(cmd,args,cwd=root)=>new Promise((resolve,reject)=>{const p=spawn(cmd,args,{cwd,stdio:'inherit'});p.on('error',reject);p.on('exit',c=>c===0?resolve():reject(Error(`${cmd}: exit ${c}`)));});
const data=JSON.parse(await readFile(`${root}/data/dataset.json`,'utf8'));
await mkdir(`${root}/shots/preview`,{recursive:true});
await check('AC-01',()=>assert.deepEqual(['personagens','conexoes','escandalos','fontes'].map(k=>data[k].length),[63,78,18,103]));
await check('AC-02',()=>run('python3',['scripts/validate.py']));
let browser,server;
try{
 await run('npm',['run','build'],app);
 const port=await new Promise((resolve,reject)=>{const s=createServer();s.on('error',reject);s.listen(0,'127.0.0.1',()=>{const p=s.address().port;s.close(()=>resolve(p));});});
 const origin=`http://127.0.0.1:${port}`;
 server=spawn(process.execPath,['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port',String(port),'--strictPort'],{cwd:app,stdio:'inherit'});
 for(let i=0;i<100;i++){try{if((await fetch(origin)).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
 browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const external=[];
 const context=await browser.newContext({viewport:{width:1280,height:800},reducedMotion:'reduce'});
 context.on('request',r=>{if(!/^(data:|blob:)/.test(r.url())&&new URL(r.url()).origin!==origin)external.push(r.url());});
 const page=await context.newPage();
 const load=async(p=page,query='')=>{await p.goto(`${origin}/?${query}`,{waitUntil:'networkidle'});await p.waitForFunction(()=>window.__cy?.nodes().length>0);await p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));};
 await load();
 const bytes=await page.evaluate(()=>performance.getEntriesByType('navigation').concat(performance.getEntriesByType('resource')).reduce((n,r)=>n+r.transferSize,0));
 await check('AC-12',()=>{assert.ok(bytes>0&&bytes<1500000,`${bytes} bytes`);return {bytes};});
 const labels=async p=>p.evaluate(()=>{
  const cy=window.__cy,z=cy.zoom(),pan=cy.pan();
  const boxes=cy.nodes().filter(n=>Number(n.style('text-opacity'))>0&&n.visible()).map(n=>{const b=n.boundingBox({includeLabels:true,includeOverlays:false});return {id:n.id(),font:parseFloat(n.style('font-size'))*z,x1:b.x1*z+pan.x,y1:b.y1*z+pan.y,x2:b.x2*z+pan.x,y2:b.y2*z+pan.y};});
  const failures=[];
  for(const n of cy.nodes()){
   const text=n.data('label')||'';
   if(/…|\.\.\./.test(text)||n.style('text-wrap')==='ellipsis'||text.split('\n').length>2)failures.push({id:n.id(),reason:'Rótulo truncado ou com mais de duas linhas'});
  }
  for(const b of boxes){if(b.font<11.999||b.x1<0||b.y1<0||b.x2>cy.width()||b.y2>cy.height())failures.push(b);}
  for(let i=0;i<boxes.length;i++)for(let j=i+1;j<boxes.length;j++){const a=boxes[i],b=boxes[j];if(a.x1<b.x2&&a.x2>b.x1&&a.y1<b.y2&&a.y2>b.y1)failures.push([a.id,b.id]);}
  return {visible:boxes.length,lulaVisible:boxes.some(b=>b.id==='lula'),failures};
 });
 const labelCheck=async p=>{const result=await labels(p);assert.ok(result.lulaVisible,'Rótulo de Lula ausente');assert.ok(result.visible>=9,`Apenas ${result.visible} rótulos visíveis; mínimo 9`);assert.deepEqual(result.failures,[]);return result;};
 await check('AC-04',()=>labelCheck(page));
 await check('AC-10',async()=>{for(const name of ['title','description','image','url']){const content=await page.locator(`meta[property="og:${name}"]`).getAttribute('content');assert.ok(content?.trim());if(['image','url'].includes(name))assert.match(content,/^https?:\/\//);}});
 await check('AC-07',async()=>{
  await page.getByRole('button',{name:'Filtros',exact:true}).click();
  const colors=await page.locator('.legal-legend i').evaluateAll(els=>els.map(e=>getComputedStyle(e).backgroundColor));
  assert.equal(colors.length,Object.keys(data.meta.categorias_juridicas).length);assert.equal(new Set(colors).size,colors.length);
  for(const p of data.personagens.filter(p=>p.categoria_juridica!=='sem_informacao'))assert.ok(p.fontes.some(id=>data.fontes.some(s=>s.id===id&&/^https?:\/\//.test(s.url))),p.id);
  await page.keyboard.press('Escape');
 });
 await check('AC-09',async()=>{for(const p of data.personagens.slice(0,3)){const tab=await context.newPage();try{await load(tab,`p=${p.id}`);assert.equal(await tab.locator('.person-panel h2').textContent(),p.nome);}finally{await tab.close();}}});
 await check('AC-08',async()=>{for(const p of data.personagens.filter(p=>p.retrato)){await load(page,`p=${p.id}`);const caption=page.locator('.person-portrait figcaption');await caption.waitFor();const text=await caption.textContent();for(const key of ['autor','licenca'])assert.ok(text.includes(p.retrato[key]),`${p.id}: ${key}`);assert.ok(await caption.locator('a[href^="http"]').count()>=2,p.id);}});
 await load();
 await check('AC-11',async()=>{
  const seen=new Set();
  for(let i=0;i<100;i++){await page.keyboard.press('Tab');const state=await page.evaluate(()=>{const e=document.activeElement,s=getComputedStyle(e);return {id:e.id,label:e.getAttribute('aria-label')||e.textContent.trim(),tag:e.tagName,outline:s.outlineStyle!=='none'&&parseFloat(s.outlineWidth)>0};});if(['BUTTON','INPUT','SELECT'].includes(state.tag))assert.ok(state.outline,`Sem outline: ${state.label}`);seen.add(state.id||state.label);}
  assert.ok(seen.has('search'));assert.ok(seen.has('Filtros'));assert.ok(seen.has('Aumentar zoom'));
  await page.getByRole('button',{name:'Filtros',exact:true}).focus();await page.keyboard.press('Enter');await page.locator('fieldset input').first().focus();await page.keyboard.press('Space');await page.keyboard.press('Escape');
  await page.locator('#search').fill('Lula');await page.locator('#search').press('Enter');await page.locator('.person-panel').waitFor();await page.keyboard.press('Escape');assert.equal(await page.locator('.person-panel').count(),0);
 });
 await check('AC-03',async()=>{await load();await page.locator('#search').fill('Lula');await page.locator('#search').press('Enter');await page.keyboard.press('Escape');await page.getByRole('button',{name:'Filtros',exact:true}).click();await page.locator('fieldset input').first().uncheck();await page.keyboard.press('Escape');await page.getByRole('button',{name:'Metodologia',exact:true}).click();await page.getByRole('dialog').waitFor();await page.keyboard.press('Escape');assert.deepEqual(external,[]);});
 const mobile=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:3,reducedMotion:'reduce'});
 await load(mobile);
 await check('AC-05',async()=>{
  const initial=await labelCheck(mobile);
  await load(mobile,'p=lula');
  const result=await mobile.evaluate(()=>{
   const cy=window.__cy,lula=cy.getElementById('lula');
   const box=lula.renderedBoundingBox({includeLabels:true,includeOverlays:false,useCache:false});
   const overlaps=cy.nodes().filter(n=>n.id()!=='lula').filter(n=>{
    const b=n.renderedBoundingBox({includeLabels:Number(n.style('text-opacity'))>0,includeOverlays:false,useCache:false});
    return box.x1<b.x2&&box.x2>b.x1&&box.y1<b.y2&&box.y2>b.y1;
   }).map(n=>n.id());
   const graph=document.querySelector('.graph').getBoundingClientRect(),panel=document.querySelector('.person-panel').getBoundingClientRect();
   const bodies=cy.nodes().filter(n=>n.visible()).map(n=>({id:n.id(),...n.renderedBoundingBox({includeLabels:false,includeOverlays:false,useCache:false})}))
    .filter(b=>b.x2>0&&b.x1<cy.width()&&b.y2>0&&b.y1<panel.top-graph.top);
   const nodeOverlaps=[];
   for(let i=0;i<bodies.length;i++)for(let j=i+1;j<bodies.length;j++){
    const a=bodies[i],b=bodies[j];
    if(a.x1<b.x2&&a.x2>b.x1&&a.y1<b.y2&&a.y2>b.y1)nodeOverlaps.push([a.id,b.id]);
   }
   return {nodeOverlaps,visibleNodes:bodies.map(b=>b.id),overlaps,visible:Number(lula.style('text-opacity'))>0,inside:box.x1>=0&&box.x2<=cy.width()&&box.y1>=0&&box.y2<=panel.top-graph.top};
  });
  assert.ok(result.visibleNodes.length>1,'Sem vizinhos visíveis acima do painel');assert.ok(result.visible,'Rótulo de Lula oculto em ?p=lula');assert.ok(result.inside,'Lula fora da área livre');assert.deepEqual(result.overlaps,[],'Lula intersecta outros nós');assert.deepEqual(result.nodeOverlaps,[],'Nós sobrepostos acima do painel');return {initial,deepLink:result};
 });
 await check('AC-06',async()=>{
  await load(mobile,'p=lula');const graph=await mobile.locator('.graph').boundingBox(),panel=await mobile.locator('.person-panel').boundingBox();assert.ok(Math.min(graph.y+graph.height,panel.y)-graph.y>=180);
  const node=await mobile.evaluate(()=>{const cy=window.__cy;const n=cy.nodes().filter(n=>n.id()!=='lula'&&n.renderedPosition().x>25&&n.renderedPosition().x<cy.width()-25&&n.renderedPosition().y>25&&n.renderedPosition().y<Math.min(cy.height(),document.querySelector('.person-panel').getBoundingClientRect().top-document.querySelector('.graph').getBoundingClientRect().top)-25)[0];return n?{id:n.id(),...n.renderedPosition()}:null;});assert.ok(node,'Sem nó clicável');await mobile.mouse.click(graph.x+node.x,graph.y+node.y);await mobile.waitForFunction(id=>new URLSearchParams(location.search).get('p')===id,node.id);
 });
}catch(e){report.error=e.message;}finally{await browser?.close();server?.kill();
 for(let i=1;i<=12;i++){const id=`AC-${String(i).padStart(2,'0')}`;if(!report.results.some(r=>r.id===id))report.results.push({id,level:i===10?'WARN':'BLOCK',status:'FAIL',detail:report.error||'Não executado'});}
 report.results.sort((a,b)=>a.id.localeCompare(b.id));
 await writeFile(`${root}/shots/preview/ac-report.json`,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
 if(report.results.some(r=>r.level==='BLOCK'&&r.status!=='PASS'))process.exitCode=1;
}
