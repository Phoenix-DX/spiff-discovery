#!/usr/bin/env node
/* Spiff v2 — build: concatenate the modular source into one self-contained HTML file. */
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const rd = p => existsSync(join(root, p)) ? readFileSync(join(root, p), 'utf8') : (console.warn('  ! missing ' + p), '');
const dir = p => existsSync(join(root, p)) ? readdirSync(join(root, p)).filter(f => f.endsWith('.js')).sort() : [];

const parts = [];
const add = (label, s) => { parts.push(s); console.log(String(label).padEnd(34), (s.length / 1024).toFixed(1).padStart(8) + ' KB'); };

add('head', rd('src/00-head.html'));
add('css (v1 + v2)', '<style>\n' + rd('src/10-css-v1.css') + '\n/* ===== v2 ===== */\n' + rd('src/11-css-v2.css') + '\n</style>');
add('shell', rd('src/20-shell.html'));
add('vendor: echarts', rd('vendor/echarts-inline.js'));
add('vendor: za-geo', rd('vendor/za-geo.js'));
add('app (v1 engine)', '<script>\n' + rd('src/40-app-v1.js') + '\n</script>');

for (const f of dir('src/data'))  add('data/' + f, rd('src/data/' + f));
for (const f of dir('src/core'))  add('core/' + f, rd('src/core/' + f));
for (const f of dir('src/views')) add('views/' + f, rd('src/views/' + f));
add('boot', rd('src/90-boot-v2.js'));

/* ---- Landscape: merged into the main build on 14 Sep 2026 after the preview on the "landscape" branch. */
for (const f of readdirSync(join(root, 'src/landscape')).filter(f => f.endsWith('.css')).sort()) add('landscape/' + f, '<style>\n' + rd('src/landscape/' + f) + '\n</style>');
for (const f of readdirSync(join(root, 'src/landscape')).filter(f => f.endsWith('.js')).sort()) add('landscape/' + f, rd('src/landscape/' + f));

const out = parts.filter(Boolean).join('\n');
writeFileSync(join(root, 'dist/spiff-mockup-v2.html'), out);
console.log('-'.repeat(46));
console.log('dist/spiff-mockup-v2.html'.padEnd(34), (out.length / 1024 / 1024).toFixed(2).padStart(8) + ' MB');
