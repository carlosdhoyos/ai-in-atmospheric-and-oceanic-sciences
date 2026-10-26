// Browser check for the generated pages (used by `python3 scripts/update.py verify`).
// Loads index.html and eda.html headless, exercises every guided view and the main controls, and fails on any
// JavaScript error, an empty chart, or horizontal overflow at phone width.
//   node scripts/verify_pages.js <repo root>
let chromium;
try { ({ chromium } = require('playwright')); } catch (e) { console.log('playwright not installed; skipping'); process.exit(0); }
const root = process.argv[2] || '.';
(async () => {
  const b = await chromium.launch(); const errs = []; const notes = [];
  const page = async (file, vw = 1200) => {
    const p = await b.newPage({ viewport: { width: vw, height: 900 } });
    p.on('pageerror', e => errs.push(`${file}@${vw}: ${e.message}`));
    await p.goto(`file://${root}/${file}`); await p.waitForTimeout(500); return p;
  };
  const idx = await page('index.html');
  const n = await idx.locator('.paper').count();
  if (!n) errs.push('index.html: no papers rendered');
  await idx.click('#tab-insights'); await idx.waitForTimeout(200);
  for (const id of ['#timeline svg', '#trend svg', '#pivot table']) if (!(await idx.locator(id).count())) errs.push(`index.html: ${id} missing`);
  const eda = await page('eda.html');
  const views = await eda.locator('[data-preset]').evaluateAll(bs => bs.map(b => b.dataset.preset));
  for (const v of views) {
    await eda.click(`[data-preset="${v}"]`); await eda.waitForTimeout(120);
    const note = (await eda.textContent('#preset-note')).trim();
    if (!note) errs.push(`eda.html: guided view "${v}" has an empty note`);
    notes.push(`${v}: ${note.slice(0, 110)}…`);
  }
  const jp = await page('journals.html');
  const venues = await jp.locator('#j-table tr.vrow').count();
  if (!venues) errs.push('journals.html: scorecard is empty');
  if (!(await jp.locator('#j-scatter svg circle').count())) errs.push('journals.html: volume/impact chart is empty');
  if (!(await jp.isHidden('#insights')) || !(await jp.isHidden('#list'))) errs.push('journals.html: other views are visible');
  await jp.click('#j-table th[data-sort="n"]'); await jp.click('#j-table tr.vrow');
  if (!(await jp.locator('#j-table tr.detail').count())) errs.push('journals.html: venue details do not open');
  notes.push(`journals: ${venues} venues; ${(await jp.textContent('#j-findings')).slice(0, 110)}…`);
  for (const f of ['index.html', 'eda.html', 'journals.html']) {
    const m = await page(f, 390);
    if (await m.evaluate(() => document.documentElement.scrollWidth > innerWidth)) errs.push(`${f}: horizontal overflow at 390px`);
  }
  await b.close();
  console.log(`pages: ${n} papers rendered; ${views.length} guided views`);
  notes.forEach(x => console.log('  ' + x));
  if (errs.length) { console.error(errs.join('\n')); process.exit(1); }
})();
