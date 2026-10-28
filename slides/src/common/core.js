/* ───────── helpers shared by every demo ───────── */
const NS = "http://www.w3.org/2000/svg";
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const fmt = (v, d = 2) => (Object.is(v, -0) ? 0 : v).toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });
const fmtN = v => Math.round(v).toLocaleString("en-US");
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const css = name => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
function el(tag, attrs = {}, parent, text) {
  const e = document.createElementNS(NS, tag);
  for (const k in attrs) e.setAttribute(k, attrs[k]);
  if (text != null) e.textContent = text;
  if (parent) parent.appendChild(e);
  return e;
}
function svgIn(host, w, h) { host.innerHTML = ""; return el("svg", { viewBox: `0 0 ${w} ${h}`, role: "img" }, host); }
function press(group, btn) { group.forEach(b => b.setAttribute("aria-pressed", b === btn ? "true" : "false")); }
/* chips: <div class="chips" data-chips="name"><button class="chip" data-v="...">  → onChange(value) */
function chips(host, onChange) {
  const bs = $$("button.chip", host);
  bs.forEach(b => b.addEventListener("click", () => { press(bs, b); onChange(b.dataset.v, b); }));
  const on = bs.find(b => b.getAttribute("aria-pressed") === "true") || bs[0];
  if (on) press(bs, on);
  return () => (bs.find(b => b.getAttribute("aria-pressed") === "true") || bs[0]).dataset.v;
}
/* range slider bound to an <output> next to it */
function slider(id, fmtFn, onInput) {
  const r = document.getElementById(id), o = r.parentElement.querySelector("output");
  const show = () => { if (o) o.textContent = fmtFn ? fmtFn(+r.value) : r.value; };
  r.addEventListener("input", () => { show(); onInput && onInput(+r.value); });
  show();
  return () => +r.value;
}
const relu = x => Math.max(0, x), sigm = x => 1 / (1 + Math.exp(-x));
const gelu = x => 0.5 * x * (1 + Math.tanh(Math.sqrt(2 / Math.PI) * (x + 0.044715 * x ** 3)));
const softmax = (xs, T = 1) => { const m = Math.max(...xs), e = xs.map(x => Math.exp((x - m) / T)), s = e.reduce((a, b) => a + b, 0); return e.map(v => v / s); };
const mean = a => a.reduce((s, v) => s + v, 0) / a.length;
const sd = a => { const m = mean(a); return Math.sqrt(a.reduce((s, v) => s + (v - m) ** 2, 0) / a.length); };
/* seeded random numbers so every viewer sees the same example data */
function rng(seed) { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function gauss(r) { let u = 0, v = 0; while (!u) u = r(); while (!v) v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }
/* linear scale */
const lin = (d0, d1, r0, r1) => v => r0 + (v - d0) / (d1 - d0 || 1) * (r1 - r0);
/* line chart helper: axes with ticks, returns {x, y, g} */
function axes(svg, { W, H, m = { l: 40, r: 12, t: 12, b: 26 }, x0, x1, y0, y1, xt = [], yt = [], xl = "", yl = "", xf = v => v, yf = v => v }) {
  const x = lin(x0, x1, m.l, W - m.r), y = lin(y0, y1, H - m.b, m.t);
  yt.forEach(v => { el("line", { x1: m.l, x2: W - m.r, y1: y(v), y2: y(v), class: "grid" }, svg); el("text", { x: m.l - 6, y: y(v) + 4, "text-anchor": "end", class: "mut mono", "font-size": 11 }, svg, yf(v)); });
  xt.forEach(v => el("text", { x: x(v), y: H - m.b + 16, "text-anchor": "middle", class: "mut mono", "font-size": 11 }, svg, xf(v)));
  el("line", { x1: m.l, x2: W - m.r, y1: H - m.b, y2: H - m.b, class: "ax" }, svg);
  if (xl) el("text", { x: W - m.r, y: H - 2, "text-anchor": "end", class: "mut", "font-size": 11 }, svg, xl);
  if (yl) el("text", { x: m.l, y: m.t - 2, class: "mut", "font-size": 11 }, svg, yl);
  return { x, y };
}
const path = (pts) => pts.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" ");

/* demos register here and run the first time their slide is shown (and again on theme change) */
const DEMOS = {};
function demo(id, init) { DEMOS[id] = { init, render: null }; }
function runDemo(slide) {
  const d = slide && DEMOS[slide.id]; if (!d) return;
  if (!d.render) { d.render = d.init(slide) || (() => {}); }
  else if (d.onShow) d.onShow();
}
document.addEventListener("themechange", () => Object.values(DEMOS).forEach(d => d.render && d.render()));

/* ───────── theme ───────── */
$("#themeTg").addEventListener("click", () => {
  const d = document.documentElement, dark = (d.dataset.theme || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")) === "dark";
  d.dataset.theme = dark ? "light" : "dark";
  try { localStorage.setItem("theme", d.dataset.theme); } catch (e) {}
  document.dispatchEvent(new Event("themechange"));
});
matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => document.dispatchEvent(new Event("themechange")));

/* ───────── navigation ───────── */
const slides = $$(".slide"), dots = $("#dots"), main = $("#main");
let cur = 0;
slides.forEach((s, i) => {
  const b = document.createElement("button"); b.className = "g" + (s.dataset.g || "");
  b.setAttribute("aria-label", "Slide " + (i + 1) + ": " + (s.querySelector("h1,h2") || {}).textContent);
  b.onclick = () => go(i); dots.appendChild(b);
});
function go(i) {
  cur = clamp(i, 0, slides.length - 1);
  slides.forEach((s, k) => s.classList.toggle("on", k === cur));
  [...dots.children].forEach((d, k) => d.classList.toggle("on", k === cur));
  $("#counter").textContent = (cur + 1) + " / " + slides.length;
  $("#secLabel").innerHTML = "<b>" + slides[cur].dataset.sec + "</b>";
  $("#prev").disabled = cur === 0; $("#next").disabled = cur === slides.length - 1;
  main.scrollTop = 0;
  runDemo(slides[cur]);
  fitSlide();
  try { history.replaceState(null, "", "#s" + (cur + 1)); } catch (e) {}
}
/* on wide screens, zoom a slide that is taller than the window down to fit (never below 0.7) */
function fitSlide() {
  const sl = slides[cur]; sl.style.zoom = "";
  if (window.innerWidth < 900) return;
  const avail = main.clientHeight, need = sl.offsetHeight;
  if (need > avail + 4) sl.style.zoom = Math.max(0.7, (avail - 4) / need).toFixed(3);
}
let fitT; window.addEventListener("resize", () => { clearTimeout(fitT); fitT = setTimeout(fitSlide, 150); });
$("#prev").onclick = () => go(cur - 1); $("#next").onclick = () => go(cur + 1);
document.addEventListener("click", e => {
  const b = e.target.closest("[data-go]"); if (!b) return;
  const v = b.dataset.go; go(isNaN(+v) ? slides.indexOf(document.getElementById(v)) : +v);
});
document.addEventListener("keydown", e => {
  if (["INPUT", "SELECT", "TEXTAREA"].includes(e.target.tagName) || e.metaKey || e.ctrlKey || e.altKey) return;
  if (["ArrowRight", "PageDown"].includes(e.key) || (e.key === " " && e.target.tagName !== "BUTTON")) { e.preventDefault(); go(cur + 1); }
  if (["ArrowLeft", "PageUp"].includes(e.key)) { e.preventDefault(); go(cur - 1); }
  if (e.key === "Home") go(0); if (e.key === "End") go(slides.length - 1);
});
let tx = null, ty = null;
main.addEventListener("touchstart", e => { if (e.target.closest("input,svg,canvas,.nosw")) { tx = null; return; } tx = e.touches[0].clientX; ty = e.touches[0].clientY; }, { passive: true });
main.addEventListener("touchend", e => {
  if (tx == null) return; const dx = e.changedTouches[0].clientX - tx, dy = e.changedTouches[0].clientY - ty;
  if (Math.abs(dx) > 70 && Math.abs(dx) > 2 * Math.abs(dy)) go(cur + (dx < 0 ? 1 : -1)); tx = null;
});

/* table of contents built from the slides themselves */
(function () {
  const host = $("#tocList"); if (!host) return; let sec = null;
  slides.forEach((s, i) => {
    if (i < 2) return;
    if (s.dataset.sec !== sec) { sec = s.dataset.sec; const h = document.createElement("h4"); h.textContent = sec; host.appendChild(h); }
    const b = document.createElement("button"); b.dataset.go = i;
    b.innerHTML = `<span>${i + 1}</span><span></span>`; b.lastChild.textContent = (s.querySelector("h1,h2") || {}).textContent || "";
    host.appendChild(b);
  });
})();
