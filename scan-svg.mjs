import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const root = dirname(fileURLToPath(import.meta.url));
const file = 'file://' + join(root, 'dist/spiff-mockup-v2.html');
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const page = await browser.newPage({ viewport: { width: 1480, height: 950 } });
page.on('pageerror', e => console.log('[pageerror]', e.message.slice(0, 200)));
await page.goto(file, { waitUntil: 'load' });
await page.waitForTimeout(500);

const VIEWS = ['home', 'ask', 'chat', 'catalog', 'glossary', 'myaccess', 'people', 'rules', 'mcp', 'audit', 'sim', 'workspace', 'library', 'autos', 'dashes', 'teams', 'admin', 'caps'];
const DEEP = ["openDataset('meetings')", "openDataset('travel')", "openRule('r-region-scope')", "openPerson('Thabo Mahlangu')", "openConnector('orbit')", "startOnboarding(0)"];
const seen = new Map();

async function scan(label) {
  const bad = await page.evaluate(() => {
    const out = [];
    document.querySelectorAll('svg').forEach(s => {
      const r = s.getBoundingClientRect();
      if (r.width > 46 || r.height > 46) {
        let chain = [], el = s;
        for (let i = 0; i < 3 && el; i++) { chain.push(el.tagName.toLowerCase() + (el.className && el.className.baseVal !== undefined ? '.' + el.className.baseVal : (typeof el.className === 'string' && el.className ? '.' + el.className.split(' ').slice(0, 2).join('.') : ''))); el = el.parentElement; }
        out.push(Math.round(r.width) + 'x' + Math.round(r.height) + '  ' + chain.join(' < ').slice(0, 130));
      }
    });
    return out;
  });
  bad.forEach(b => { const k = b.replace(/^\d+x\d+\s+/, ''); if (!seen.has(k)) seen.set(k, label + '  ' + b); });
}

for (const v of VIEWS) { await page.evaluate(x => go(x), v); await page.waitForTimeout(230); await scan(v); }
for (const d of DEEP) { await page.evaluate(c => eval(c), d); await page.waitForTimeout(280); await scan(d); await page.evaluate(() => { try { closeModal(); } catch (e) {} try { closeOnboarding(); } catch (e) {} }); }

console.log('=== OVERSIZED SVGs (>46px) ===');
if (!seen.size) console.log('  none');
[...seen.values()].forEach(v => console.log(' ', v));
await browser.close();
