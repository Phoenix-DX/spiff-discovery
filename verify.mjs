import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { mkdirSync } from 'node:fs';

const root = dirname(fileURLToPath(import.meta.url));
const file = 'file://' + join(root, 'dist/spiff-mockup-v2.html');
mkdirSync(join(root, 'shots'), { recursive: true });

const ROUTES = [
  ['home', null], ['ask', null], ['chat', null], ['workspace', null], ['dashes', null],
  ['catalog', null], ['sources', null], ['myaccess', null], ['glossary', null],
  ['teams', null], ['library', null], ['autos', null],
  ['people', null], ['rules', null], ['mcp', null], ['audit', null],
  ['admin', null], ['caps', null], ['sim', null]
];

const DEEP = [
  ["openDataset('meetings')", 'dataset-meetings'],
  ["openDataset('travel')", 'dataset-travel'],
  ["openDataset('care')", 'dataset-care'],
  ["openRule('r-region-scope')", 'rule-region'],
  ["openRule('r-pastoral-block')", 'rule-pastoral'],
  ["openPerson('Thabo Mahlangu')", 'person-thabo'],
  ["openConnector('orbit')", 'connector-orbit'],
  ["openSource('assemble-repo')", 'source-assemble-repo'],
  ["openSource('warehouse','connection')", 'source-warehouse-conn'],
  ["openSource('finance-erp')", 'source-finance'],
  ["registerSourceWizard()", 'modal-register-source'],
  ["openFromCard('ldm')", 'answer-ldm'],
  ["startOnboarding(0)", 'onboarding'],
  ["requestAccessModal('budgets')", 'modal-request']
];

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const page = await browser.newPage({ viewport: { width: 1480, height: 950 } });

const errs = [], warns = [];
page.on('console', m => { if (m.type() === 'error') errs.push('[console] ' + m.text().slice(0, 300)); if (m.type() === 'warning') warns.push(m.text().slice(0, 160)); });
page.on('pageerror', e => errs.push('[pageerror] ' + (e.message || e).toString().slice(0, 400)));

await page.goto(file, { waitUntil: 'load' });
await page.waitForTimeout(700);

console.log('=== LOAD ===');
console.log('errors after load:', errs.length);
errs.forEach(e => console.log('   ', e));

const report = [];
for (const [v] of ROUTES) {
  const before = errs.length;
  const info = await page.evaluate(view => {
    try { go(view); } catch (e) { return { err: e.message }; }
    const el = document.getElementById('view-' + view);
    const t = el ? el.innerText.trim() : '';
    return { len: el ? el.innerHTML.length : -1, text: t.length, snip: t.slice(0, 60).replace(/\s+/g, ' ') };
  }, v);
  await page.waitForTimeout(220);
  const newErrs = errs.slice(before);
  report.push({ route: v, ...info, errs: newErrs.length });
  console.log(String(v).padEnd(12), 'html=' + String(info.len).padStart(7), 'text=' + String(info.text).padStart(6), newErrs.length ? '  ERR ' + newErrs[0].slice(0, 160) : '', info.snip ? '  | ' + info.snip : '');
}

console.log('\n=== DEEP LINKS ===');
for (const [js, name] of DEEP) {
  const before = errs.length;
  await page.evaluate(code => { try { eval(code); } catch (e) { console.error('deep:' + code + ' -> ' + e.message); } }, js);
  await page.waitForTimeout(260);
  const n = errs.length - before;
  console.log(String(name).padEnd(20), n ? 'ERR ' + errs.slice(before)[0].slice(0, 200) : 'ok');
  if (name === 'modal-request' || name === 'onboarding' || name === 'modal-register-source') {
    await page.evaluate(() => { try { closeModal(); } catch (e) {} try { closeOnboarding(); } catch (e) {} });
  }
}

console.log('\n=== SIMULATOR ===');
{
  const before = errs.length;
  await page.evaluate(() => { go('catalog'); startSim('Thabo Mahlangu'); });
  await page.waitForTimeout(300);
  await page.evaluate(() => { go('myaccess'); });
  await page.waitForTimeout(300);
  await page.evaluate(() => { stopSim(); });
  await page.waitForTimeout(200);
  console.log('sim round-trip:', errs.length - before ? 'ERR ' + errs.slice(before)[0].slice(0, 200) : 'ok');
}

console.log('\n=== DARK MODE + SCREENSHOTS ===');
for (const theme of ['light', 'dark']) {
  await page.evaluate(t => document.documentElement.setAttribute('data-theme', t), theme);
  for (const v of ['home', 'catalog', 'chat', 'people', 'rules', 'mcp', 'audit', 'sim', 'myaccess']) {
    await page.evaluate(view => go(view), v);
    await page.waitForTimeout(260);
    await page.screenshot({ path: join(root, 'shots', v + '-' + theme + '.png') });
  }
  // deep pages
  await page.evaluate(() => openDataset('meetings'));
  await page.waitForTimeout(300);
  await page.screenshot({ path: join(root, 'shots', 'dataset-' + theme + '.png'), fullPage: false });
}

console.log('\n=== HORIZONTAL OVERFLOW @1480 and @1100 ===');
for (const w of [1480, 1100]) {
  await page.setViewportSize({ width: w, height: 900 });
  for (const v of ['home', 'catalog', 'sources', 'people', 'rules', 'mcp', 'audit', 'sim', 'chat', 'myaccess']) {
    await page.evaluate(view => go(view), v);
    await page.waitForTimeout(180);
    const o = await page.evaluate(() => {
      const s = document.querySelector('.scroll');
      return { sw: s.scrollWidth, cw: s.clientWidth, body: document.body.scrollWidth - document.body.clientWidth };
    });
    if (o.sw - o.cw > 4) console.log('  overflow', w, v, o.sw + ' > ' + o.cw);
  }
}
console.log('  (nothing listed = no horizontal overflow)');

console.log('\n=== TOTAL ERRORS:', errs.length, '===');
[...new Set(errs)].slice(0, 40).forEach(e => console.log(' *', e));

await browser.close();
