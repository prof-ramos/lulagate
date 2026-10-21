import { chromium } from 'playwright';
import { mkdir, readFile } from 'node:fs/promises';
const root = '/workspace/lulagate';
const dataset = JSON.parse(await readFile(`${root}/data/dataset.json`, 'utf8'));
const person = dataset.personagens.find(p => p.id === 'jose-dirceu') || dataset.personagens.find(p => p.id !== 'lula');
await mkdir(`${root}/shots`, { recursive: true });
const browser = await chromium.launch({ headless: true }).catch(error => {
  console.error(JSON.stringify({ screenshots: 0, launchError: error.message }, null, 2));
  process.exit(1);
});
const errors = [], requests = [];
const shots = [
  ['rede', 'visualizacao=rede'],
  ['proximidade', 'visualizacao=proximidade'],
  ['personagem', `personagem=${encodeURIComponent(person.id)}`],
  ['escandalos', 'modal=escandalos'],
  ['metodologia', 'modal=metodologia'],
  ['mobile-rede', 'visualizacao=rede', true],
  ['mobile-personagem', `personagem=${encodeURIComponent(person.id)}`, true],
];
try {
  for (const [name, query, mobile] of shots) {
    const page = await browser.newPage({ viewport: mobile ? { width: 390, height: 844 } : { width: 1280, height: 800 }, colorScheme: 'light', reducedMotion: 'reduce' });
    page.on('console', msg => { if (msg.type() === 'error') errors.push({ shot: name, type: 'console', message: msg.text() }); });
    page.on('pageerror', error => errors.push({ shot: name, type: 'pageerror', message: error.message }));
    page.on('request', request => { if (!/^(file:|data:)/.test(request.url())) requests.push({ shot: name, url: request.url() }); });
    await page.goto(`file://${root}/dist/index.html?${query}`, { waitUntil: 'load' });
    await page.locator('.node').first().waitFor();
    await page.evaluate(() => document.fonts.ready);
    // The app ticks its force simulation synchronously; also verify rendered positions settle.
    let previous = '', stable = 0;
    for (let i = 0; i < 50 && stable < 4; i++) {
      await page.waitForTimeout(150);
      const current = await page.locator('.graph').evaluate(el => el.innerHTML);
      stable = current === previous ? stable + 1 : 0;
      previous = current;
    }
    if (stable < 4) throw new Error(`${name}: graph did not settle`);
    await page.screenshot({ path: `${root}/shots/${name}.png` });
    console.log(`Saved ${name}.png (${mobile ? '390x844' : '1280x800'})`);
    await page.close();
  }
} finally { await browser.close(); }
console.log(JSON.stringify({ screenshots: shots.length, errors, nonLocalRequests: requests }, null, 2));
if (errors.length) process.exitCode = 1;
