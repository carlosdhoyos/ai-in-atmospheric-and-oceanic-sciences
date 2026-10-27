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
  const heapMB = async p => {  // JS heap after a forced GC (Chromium DevTools protocol)
    const s = await p.context().newCDPSession(p);
    await s.send('HeapProfiler.collectGarbage'); await s.send('Performance.enable');
    const m = (await s.send('Performance.getMetrics')).metrics.find(x => x.name === 'JSHeapUsedSize');
    return Math.round(m.value / 2 ** 20);
  };
  const idx = await page('index.html');
  const n = await idx.locator('.paper').count();
  if (!n) errs.push('index.html: no papers rendered');
  // the list renders in chunks: few rows in the DOM, a small heap, and counts/BibTeX over the full selection
  if (n > 100) errs.push(`index.html: ${n} paper rows in the DOM after load (expected <= 100)`);
  const heap = await heapMB(idx);
  if (heap > 100) errs.push(`index.html: JS heap ${heap} MB after load (expected < 100 MB)`);
  const total = +(await idx.textContent('#summary')).match(/^([\d,]+)/)[1].replace(/,/g, '');
  await idx.click('#bib-all');
  const nBib = ((await idx.inputValue('#bibtext')).match(/^@/gm) || []).length;
  if (nBib !== total) errs.push(`index.html: BibTeX has ${nBib} entries, the selection has ${total}`);
  await idx.click('#bibclose');
  await idx.locator('#more').scrollIntoViewIfNeeded(); await idx.waitForTimeout(300);
  const n2 = await idx.locator('.paper').count();
  if (n2 <= n) errs.push('index.html: scrolling to the end of the list does not load more papers');
  await idx.click('.paper button[data-act="abs"]');
  if (!(await idx.locator('.paper .abstract').count())) errs.push('index.html: abstract does not open');
  if ((await idx.locator('.paper').count()) !== n2) errs.push('index.html: opening an abstract re-rendered the list');
  notes.push(`list: ${n} rows after load, ${n2} after scrolling, of ${total}; heap ${heap} MB; BibTeX ${nBib} entries`);
  await idx.click('#tab-insights'); await idx.waitForTimeout(200);
  for (const id of ['#timeline svg', '#trend svg', '#pivot table']) if (!(await idx.locator(id).count())) errs.push(`index.html: ${id} missing`);
  await idx.click('#tab-reviews'); await idx.waitForTimeout(200);
  const nRev = await idx.locator('#r-top .rcard').count();
  if (!nRev || !(await idx.locator('#r-bysub h5').count())) errs.push('index.html: key reviews section is empty');
  const rid = await idx.getAttribute('#r-top .rcard:last-child button[data-open]', 'data-open');
  await idx.click('#r-top .rcard:last-child button[data-open]');
  if (!(await idx.isVisible('#list')) || !(await idx.locator(`.paper[data-id="${rid}"] .summary-card`).count()))
    errs.push('index.html: review "Summary" link does not open the paper');
  notes.push(`reviews: ${nRev} top cards, ${await idx.locator('#r-bysub h5').count()} subfields`);
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
  console.log(`pages: ${n} paper rows rendered after load; ${views.length} guided views`);
  notes.forEach(x => console.log('  ' + x));
  if (errs.length) { console.error(errs.join('\n')); process.exit(1); }
})();
