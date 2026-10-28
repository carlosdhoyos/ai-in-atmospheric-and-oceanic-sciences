// Headless check of one module deck: every slide is shown at desktop (light) and phone (dark) width; reports JS errors,
// horizontal overflow, empty demo hosts and duplicate element ids. Optional screenshots of named slides.
//   node slides/tools/check_deck.js slides/operations.html [outdir slideId slideId …]
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const [file, out, ...shots] = process.argv.slice(2), url = 'file://' + path.resolve(file);
  const b = await chromium.launch(), errs = [];
  for (const [vw, scheme] of [[1280, 'light'], [390, 'dark']]) {
    const p = await b.newPage({ viewport: { width: vw, height: 820 }, colorScheme: scheme });
    p.on('pageerror', e => errs.push(`${vw}: ${e.message}`)); p.on('console', m => m.type() === 'error' && errs.push(`${vw} console: ${m.text()}`));
    await p.goto(url); await p.waitForTimeout(400);
    const n = await p.evaluate(() => document.querySelectorAll('.slide').length), probs = [];
    const dup = await p.evaluate(() => { const c = {}; document.querySelectorAll('[id]').forEach(e => c[e.id] = (c[e.id] || 0) + 1); return Object.keys(c).filter(k => c[k] > 1); });
    if (dup.length) probs.push(`duplicate ids: ${dup.join(',')}`);
    for (let i = 0; i < n; i++) {
      if (i) await p.click('#next');
      await p.waitForTimeout(50);
      const info = await p.evaluate(() => { const s = document.querySelector('.slide.on');
        return { id: s.id, sw: document.documentElement.scrollWidth, iw: innerWidth,
          empty: [...s.querySelectorAll('[id]')].filter(e => /Fig|Read|Calc|Table|Card|Out|Map|Grid/.test(e.id) && !e.innerHTML.trim() && e.tagName !== 'CANVAS' && e.tagName !== 'INPUT').map(e => e.id) }; });
      if (info.sw > info.iw + 1) probs.push(`${info.id}: page ${info.sw}px wide`);
      if (info.empty.length) probs.push(`${info.id}: empty ${info.empty.join(',')}`);
    }
    console.log(`${vw}px ${scheme}: ${n} slides, ${probs.length ? probs.join('; ') : 'ok'}`);
    if (out && vw === 1280) for (const id of shots) {
      const i = await p.evaluate(id => [...document.querySelectorAll('.slide')].findIndex(s => s.id === id), id);
      if (i < 0) { console.log('no slide ' + id); continue; }
      await p.evaluate(i => { location.hash = '#s' + (i + 1); }, i); await p.reload(); await p.waitForTimeout(350);
      await p.screenshot({ path: `${out}/${id}.png` });
    }
  }
  await b.close(); console.log(errs.length ? 'JS ERRORS:\n' + [...new Set(errs)].join('\n') : 'no JS errors');
})();
