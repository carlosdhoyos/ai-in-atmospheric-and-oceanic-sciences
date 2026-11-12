/* ═════════ Earth-2 deck · shared library ═════════
   ATM    a synthetic "atmosphere": analytic 500 hPa geopotential-like field on the sphere that evolves in time
          (Rossby-like waves drifting east at speeds that depend on wavenumber). Used as the "truth" in toy forecasts.
   FFT    radix-2 FFT (1-D, 2-D), real DFT helpers, power-law random fields, radially averaged power spectra
   HPX    HEALPix (ring scheme): number of pixels, pixel centres, angle → pixel
   MET    metrics: rmse, bias, acc (anomaly correlation), crps (ensemble), csi, spread
   CM     colour maps: vir (viridis), div (blue-white-red), precip, temp
   VIZ    raster (canvas), globe (orthographic canvas, drag to rotate), legend, curves, bars, quiz           */

/* ───────── synthetic atmosphere ───────── */
const ATM = (() => {
  const R = rng(20260126), D2R = Math.PI / 180;
  // waves: zonal wavenumber m, amplitude (m), phase, speed (deg lon per day), latitude centre, hemisphere
  const W = [];
  [3, 4, 5, 6, 7, 8, 9, 11, 13, 16, 19, 23].forEach(m => [1, -1].forEach(h => W.push({ m, h,
    A: (m <= 8 ? 70 : 32) * (0.6 + 0.8 * R()) * (m <= 8 ? 1 : 8 / m), ph: 2 * Math.PI * R(),
    c: 13 - 70 / (m * m) + 2 * (R() - .5), lat: h * (40 + 14 * (R() - .5)), w: m <= 8 ? 16 : 10, g: 0.15 * (R() - .5) })));
  const base = lat => 5780 - 560 * Math.pow(Math.abs(Math.sin(lat * D2R)), 1.6);
  // geopotential height (m) at lon, lat (degrees) and time t (hours); opts.kmax drops waves with m > kmax
  function z500(lon, lat, t = 0, { kmax = 99, amp = 1 } = {}) {
    let z = base(lat); const d = t / 24;
    for (const w of W) { if (w.m > kmax) continue; const env = Math.exp(-(((lat - w.lat) / w.w) ** 2));
      if (env < 1e-3) continue;
      z += amp * w.A * (1 + w.g * Math.sin(d / 3 + w.ph)) * env * Math.cos(w.m * (lon - w.c * d) * D2R + w.ph); }
    return z;
  }
  // a gridded snapshot: nlon × nlat cells (cell centres), row 0 = north
  function grid(nlon, nlat, t = 0, opts) {
    const a = new Float64Array(nlon * nlat);
    for (let j = 0; j < nlat; j++) { const lat = 90 - (j + .5) * 180 / nlat;
      for (let i = 0; i < nlon; i++) a[j * nlon + i] = z500((i + .5) * 360 / nlon, lat, t, opts); }
    return a;
  }
  const lats = nlat => Array.from({ length: nlat }, (_, j) => 90 - (j + .5) * 180 / nlat);
  return { z500, grid, lats, base, waves: W, RANGE: [4950, 5950] };
})();

/* ───────── FFT and random fields ───────── */
const FFT = (() => {
  // in-place radix-2 complex FFT; n must be a power of two; inv = true for the inverse (scaled by 1/n)
  function fft(re, im, inv = false) {
    const n = re.length;
    for (let i = 1, j = 0; i < n; i++) { let bit = n >> 1; for (; j & bit; bit >>= 1) j ^= bit; j ^= bit;
      if (i < j) { [re[i], re[j]] = [re[j], re[i]]; [im[i], im[j]] = [im[j], im[i]]; } }
    for (let len = 2; len <= n; len <<= 1) { const a = (inv ? 2 : -2) * Math.PI / len, wr = Math.cos(a), wi = Math.sin(a);
      for (let i = 0; i < n; i += len) { let cr = 1, ci = 0;
        for (let k = 0; k < len / 2; k++) { const ur = re[i + k], ui = im[i + k], vr = re[i + k + len / 2] * cr - im[i + k + len / 2] * ci, vi = re[i + k + len / 2] * ci + im[i + k + len / 2] * cr;
          re[i + k] = ur + vr; im[i + k] = ui + vi; re[i + k + len / 2] = ur - vr; im[i + k + len / 2] = ui - vi;
          const t = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = t; } } }
    if (inv) for (let i = 0; i < n; i++) { re[i] /= n; im[i] /= n; }
  }
  // 2-D FFT of an n × n field (row-major); returns {re, im}
  function fft2(f, n, inv = false, imIn = null) {
    const re = Float64Array.from(f), im = imIn ? Float64Array.from(imIn) : new Float64Array(n * n), rr = new Float64Array(n), ii = new Float64Array(n);
    for (let j = 0; j < n; j++) { for (let i = 0; i < n; i++) { rr[i] = re[j * n + i]; ii[i] = im[j * n + i]; } fft(rr, ii, inv); for (let i = 0; i < n; i++) { re[j * n + i] = rr[i]; im[j * n + i] = ii[i]; } }
    for (let i = 0; i < n; i++) { for (let j = 0; j < n; j++) { rr[j] = re[j * n + i]; ii[j] = im[j * n + i]; } fft(rr, ii, inv); for (let j = 0; j < n; j++) { re[j * n + i] = rr[j]; im[j * n + i] = ii[j]; } }
    return { re, im };
  }
  // real 1-D signal → amplitude and phase of wavenumbers 0 … n/2 (any n; plain DFT)
  function dft(x) { const n = x.length, out = [];
    for (let k = 0; k <= n / 2; k++) { let a = 0, b = 0; for (let i = 0; i < n; i++) { a += x[i] * Math.cos(2 * Math.PI * k * i / n); b -= x[i] * Math.sin(2 * Math.PI * k * i / n); }
      out.push({ k, re: a, im: b, amp: Math.hypot(a, b) * (k === 0 || 2 * k === n ? 1 : 2) / n, ph: Math.atan2(b, a) }); }
    return out; }
  // rebuild a real signal of length n from dft() output, keeping only the wavenumbers where keep(k) is true
  function idft(F, n, keep = () => true) { const x = new Float64Array(n);
    F.forEach(c => { if (!keep(c.k)) return; for (let i = 0; i < n; i++) x[i] += c.amp * Math.cos(2 * Math.PI * c.k * i / n + c.ph); });
    return x; }
  /* a random n × n field with power spectrum ∝ k^(-beta), zero mean, unit variance; seed fixes it.
     Larger beta = smoother. Periodic (wraps around). */
  function noise2(n, { beta = 3, seed = 1, kmin = 1, kmax = 1e9 } = {}) {
    const r = rng(seed), re = new Float64Array(n * n), im = new Float64Array(n * n);
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) { const kx = i <= n / 2 ? i : i - n, ky = j <= n / 2 ? j : j - n, k = Math.hypot(kx, ky);
      if (k < kmin || k > kmax) continue; const a = Math.pow(k, -beta / 2) * gauss(r), ph = 2 * Math.PI * r(); re[j * n + i] = a * Math.cos(ph); im[j * n + i] = a * Math.sin(ph); }
    const f = fft2(re, n, true, im).re, m = mean(f), s = sd(f) || 1;
    return f.map(v => (v - m) / s);
  }
  // radially averaged power spectrum of an n × n field: [[k, power]…] for k = 1 … n/2
  function spectrum2(f, n) {
    const m = mean(f), F = fft2(f.map(v => v - m), n), P = new Float64Array(n / 2 + 1), C = new Float64Array(n / 2 + 1);
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) { const kx = i <= n / 2 ? i : i - n, ky = j <= n / 2 ? j : j - n, k = Math.round(Math.hypot(kx, ky));
      if (k >= 1 && k <= n / 2) { P[k] += (F.re[j * n + i] ** 2 + F.im[j * n + i] ** 2) / (n * n); C[k]++; } }
    const out = []; for (let k = 1; k <= n / 2; k++) out.push([k, C[k] ? P[k] / C[k] : 0]); return out;
  }
  // box blur of an n × n periodic field with radius r (cells); repeated twice ≈ Gaussian
  function blur(f, n, r) { if (r <= 0) return Float64Array.from(f); let a = Float64Array.from(f);
    for (let pass = 0; pass < 2; pass++) { const b = new Float64Array(n * n), c = new Float64Array(n * n), w = 2 * r + 1;
      for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) { let s = 0; for (let d = -r; d <= r; d++) s += a[j * n + ((i + d + n) % n)]; b[j * n + i] = s / w; }
      for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) { let s = 0; for (let d = -r; d <= r; d++) s += b[((j + d + n) % n) * n + i]; c[j * n + i] = s / w; }
      a = c; }
    return a; }
  // average n × n down to (n/f) × (n/f) blocks, and nearest / bilinear back up
  function coarsen(f, n, fac) { const m = n / fac, o = new Float64Array(m * m);
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) o[Math.floor(j / fac) * m + Math.floor(i / fac)] += f[j * n + i] / (fac * fac); return o; }
  function upsample(c, m, fac, bilinear = true) { const n = m * fac, o = new Float64Array(n * n);
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
      if (!bilinear) { o[j * n + i] = c[Math.floor(j / fac) * m + Math.floor(i / fac)]; continue; }
      const x = (i + .5) / fac - .5, y = (j + .5) / fac - .5, x0 = Math.floor(x), y0 = Math.floor(y), fx = x - x0, fy = y - y0, g = (a, b) => c[((b % m + m) % m) * m + ((a % m + m) % m)];
      o[j * n + i] = (1 - fx) * (1 - fy) * g(x0, y0) + fx * (1 - fy) * g(x0 + 1, y0) + (1 - fx) * fy * g(x0, y0 + 1) + fx * fy * g(x0 + 1, y0 + 1); }
    return o; }
  return { fft, fft2, dft, idft, noise2, spectrum2, blur, coarsen, upsample };
})();

/* ───────── HEALPix (ring scheme) ───────── */
const HPX = (() => {
  const npix = ns => 12 * ns * ns;
  // pixel centres: [{theta (colatitude, rad), phi (lon, rad), ring}]
  function centers(ns) { const out = [];
    for (let i = 1; i < 4 * ns; i++) {
      let z, n, shift;
      if (i < ns) { z = 1 - i * i / (3 * ns * ns); n = 4 * i; shift = .5; }
      else if (i <= 3 * ns) { z = 4 / 3 - 2 * i / (3 * ns); n = 4 * ns; shift = ((i + ns) & 1) ? 1 : .5; }
      else { const ii = 4 * ns - i; z = -(1 - ii * ii / (3 * ns * ns)); n = 4 * ii; shift = .5; }
      for (let j = 1; j <= n; j++) out.push({ theta: Math.acos(z), phi: (j - shift) * 2 * Math.PI / n, ring: i });
    }
    return out; }
  // angle → ring-scheme pixel index (theta colatitude, phi longitude, radians)
  function ang2pix(ns, theta, phi) {
    const z = Math.cos(theta), za = Math.abs(z); let tt = ((phi % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI) / (Math.PI / 2);
    if (za <= 2 / 3) {
      const t1 = ns * (.5 + tt), t2 = ns * z * .75, jp = Math.floor(t1 - t2), jm = Math.floor(t1 + t2), ir = ns + 1 + jp - jm, ks = 1 - (ir & 1);
      let ip = Math.floor((jp + jm - ns + ks + 1) / 2); ip = ((ip % (4 * ns)) + 4 * ns) % (4 * ns);
      return 2 * ns * (ns - 1) + (ir - 1) * 4 * ns + ip;
    }
    const tp = tt - Math.floor(tt), tmp = ns * Math.sqrt(3 * (1 - za)), jp = Math.floor(tp * tmp), jm = Math.floor((1 - tp) * tmp), ir = jp + jm + 1;
    let ip = Math.floor(tt * ir); ip = ip % (4 * ir);
    return z > 0 ? 2 * ir * (ir - 1) + ip : 12 * ns * ns - 2 * ir * (ir + 1) + ip;
  }
  return { npix, centers, ang2pix };
})();

/* ───────── metrics ───────── */
const MET = (() => {
  // optional weights w (e.g. cos(latitude)) for area-weighted scores on a lat-lon grid
  const wsum = (a, w) => w ? a.reduce((s, v, i) => s + v * w[i], 0) / w.reduce((s, v) => s + v, 0) : mean(a);
  const rmse = (f, o, w) => Math.sqrt(wsum(Array.from(f, (v, i) => (v - o[i]) ** 2), w));
  const bias = (f, o, w) => wsum(Array.from(f, (v, i) => v - o[i]), w);
  // anomaly correlation: anomalies against a climatology c (array or number)
  function acc(f, o, c, w) { const cc = i => typeof c === "number" ? c : c[i]; let n = 0, a = 0, b = 0;
    for (let i = 0; i < f.length; i++) { const wi = w ? w[i] : 1, fa = f[i] - cc(i), oa = o[i] - cc(i); n += wi * fa * oa; a += wi * fa * fa; b += wi * oa * oa; }
    return n / Math.sqrt(a * b || 1); }
  // CRPS of an ensemble (array of numbers) for one observation y: E|X − y| − ½ E|X − X'|
  function crps(ens, y) { const m = ens.length; let a = 0, b = 0;
    for (let i = 0; i < m; i++) { a += Math.abs(ens[i] - y); for (let j = 0; j < m; j++) b += Math.abs(ens[i] - ens[j]); }
    return a / m - b / (2 * m * m); }
  // critical success index for a threshold: hits / (hits + misses + false alarms)
  function csi(f, o, thr) { let h = 0, m = 0, fa = 0; for (let i = 0; i < f.length; i++) { const a = f[i] >= thr, b = o[i] >= thr; if (a && b) h++; else if (b) m++; else if (a) fa++; }
    return h + m + fa ? h / (h + m + fa) : 1; }
  return { rmse, bias, acc, crps, csi };
})();

/* ───────── colour maps ───────── */
const CM = (() => {
  const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const ramp = stops => { const S = stops.map(hex); return t => { t = clamp(isFinite(t) ? t : 0, 0, 1) * (S.length - 1); const i = Math.min(Math.floor(t), S.length - 2), f = t - i;
    return `rgb(${S[i].map((v, k) => Math.round(v + (S[i + 1][k] - v) * f)).join(",")})`; }; };
  const vir = ramp(["#440154", "#482878", "#3e4989", "#31688e", "#26828e", "#1f9e89", "#35b779", "#6ece58", "#b5de2b", "#fde725"]);
  const div = ramp(["#2166ac", "#4393c3", "#92c5de", "#d1e5f0", "#f7f7f7", "#fddbc7", "#f4a582", "#d6604d", "#b2182b"]);
  const temp = ramp(["#313695", "#4575b4", "#74add1", "#abd9e9", "#e0f3f8", "#fee090", "#fdae61", "#f46d43", "#d73027", "#a50026"]);
  const precipR = ramp(["#c6dbef", "#6baed6", "#2171b5", "#31a354", "#addd8e", "#fed976", "#fd8d3c", "#e31a1c", "#99000d"]);
  // precipitation: values below 'dry' (0..1 scale) are transparent-ish (drawn in --well by VIZ.raster when lo-clipped)
  const precip = t => precipR(t);
  // rgb array for fast canvas painting
  const rgb = (f, t) => f(t).slice(4, -1).split(",").map(Number);
  return { vir, div, temp, precip, ramp, rgb };
})();

/* ───────── drawing ───────── */
const VIZ = (() => {
  // cached colour lookup (256 steps) so big canvases stay fast
  const lut = f => { const L = new Uint8ClampedArray(256 * 3); for (let i = 0; i < 256; i++) { const c = CM.rgb(f, i / 255); L[i * 3] = c[0]; L[i * 3 + 1] = c[1]; L[i * 3 + 2] = c[2]; } return L; };
  const LUTS = new Map(), getLut = f => { if (!LUTS.has(f)) LUTS.set(f, lut(f)); return LUTS.get(f); };
  const wellRGB = () => { const d = document.createElement("canvas").getContext("2d"); d.fillStyle = css("--well"); d.fillRect(0, 0, 1, 1); return [...d.getImageData(0, 0, 1, 1).data].slice(0, 3); };

  /* raster: values (array, row-major, row 0 at top) of nx × ny drawn on a canvas, one pixel per cell, scaled by CSS.
     opts: color (CM map), lo, hi, mask(v,i) → true to paint --well instead, scale (css px per cell; default fills width),
     smooth (true: bilinear browser scaling), onCell(i, j, evt) on click, onHover(i, j | -1), overlay(ctx, sx, sy) to draw on top */
  function raster(host, values, nx, ny, { color = CM.vir, lo = null, hi = null, mask = null, smooth = false, onCell = null, onHover = null, overlay = null, maxWidth = null, round = 8 } = {}) {
    if (lo == null || hi == null) { let a = Infinity, b = -Infinity; for (const v of values) { if (v < a) a = v; if (v > b) b = v; } lo = lo ?? a; hi = hi ?? b; }
    const L = getLut(color), base = document.createElement("canvas"); base.width = nx; base.height = ny;
    const bg = base.getContext("2d"), img = bg.createImageData(nx, ny), well = wellRGB();
    for (let k = 0; k < nx * ny; k++) { const v = values[k], o = k * 4;
      if (mask && mask(v, k)) { img.data[o] = well[0]; img.data[o + 1] = well[1]; img.data[o + 2] = well[2]; img.data[o + 3] = 255; continue; }
      const t = Math.round(clamp((v - lo) / (hi - lo || 1), 0, 1) * 255) * 3; img.data[o] = L[t]; img.data[o + 1] = L[t + 1]; img.data[o + 2] = L[t + 2]; img.data[o + 3] = 255; }
    bg.putImageData(img, 0, 0);
    const S = Math.max(1, Math.ceil(640 / nx)), cv = document.createElement("canvas"); cv.width = nx * S; cv.height = ny * S;
    const g = cv.getContext("2d"); g.imageSmoothingEnabled = smooth; g.drawImage(base, 0, 0, cv.width, cv.height);
    if (overlay) overlay(g, S, S);
    Object.assign(cv.style, { width: "100%", height: "auto", display: "block", borderRadius: round + "px" }); if (maxWidth) cv.style.maxWidth = maxWidth + "px";
    host.innerHTML = ""; host.appendChild(cv);
    const at = e => { const r = cv.getBoundingClientRect(); return [Math.floor((e.clientX - r.left) / r.width * nx), Math.floor((e.clientY - r.top) / r.height * ny)]; };
    if (onCell) { cv.style.cursor = "crosshair"; cv.addEventListener("click", e => { const [i, j] = at(e); if (i >= 0 && j >= 0 && i < nx && j < ny) onCell(i, j, e); }); }
    if (onHover) { cv.addEventListener("mousemove", e => { const [i, j] = at(e); onHover(i, j); }); cv.addEventListener("mouseleave", () => onHover(-1, -1)); }
    return { canvas: cv, ctx: g, S, lo, hi };
  }

  /* globe: orthographic view of a field f(latDeg, lonDeg) → value. opts: size (px), lon0/lat0 (view centre, degrees),
     color, lo, hi, graticule (deg spacing or 0), drag (true: drag to rotate; calls onRotate(lon0, lat0)),
     edges(latDeg, lonDeg) → true to draw a dark pixel (cell outlines, e.g. HEALPix boundaries) */
  function globe(host, f, { size = 300, lon0 = 0, lat0 = 20, color = CM.vir, lo = 0, hi = 1, graticule = 30, drag = true, onRotate = null, edges = null, res = 1 } = {}) {
    const cv = document.createElement("canvas"), N = Math.round(size * res); cv.width = N; cv.height = N;
    Object.assign(cv.style, { width: "100%", maxWidth: size + "px", height: "auto", display: "block", margin: "0 auto", cursor: drag ? "grab" : "default", touchAction: "none" });
    host.innerHTML = ""; host.appendChild(cv);
    const g = cv.getContext("2d"), L = getLut(color), D = Math.PI / 180, fg = CM.rgb(() => css("--fg"), 0);
    function draw() {
      const img = g.createImageData(N, N), sl = Math.sin(lat0 * D), cl = Math.cos(lat0 * D), r = N / 2 - 1;
      for (let py = 0; py < N; py++) for (let px = 0; px < N; px++) {
        const x = (px - N / 2 + .5) / r, y = -(py - N / 2 + .5) / r, rr = x * x + y * y; if (rr > 1) continue;
        const z = Math.sqrt(1 - rr), lat = Math.asin(y * cl + z * sl) / D, lon = lon0 + Math.atan2(x, z * cl - y * sl) / D, o = (py * N + px) * 4;
        const lonN = ((lon % 360) + 540) % 360 - 180;
        let c;
        if (edges && edges(lat, lonN)) c = [20, 20, 20];
        else { const t = Math.round(clamp((f(lat, lonN) - lo) / (hi - lo || 1), 0, 1) * 255) * 3; c = [L[t], L[t + 1], L[t + 2]]; }
        let shade = .55 + .45 * z;
        if (graticule) { const a = Math.abs(((lat + 90) % graticule) - graticule / 2), b = Math.abs(((lonN + 180) % graticule) - graticule / 2); if (a > graticule / 2 - .5 || b > graticule / 2 - .5 / Math.max(.2, Math.cos(lat * D))) shade *= .78; }
        img.data[o] = c[0] * shade; img.data[o + 1] = c[1] * shade; img.data[o + 2] = c[2] * shade; img.data[o + 3] = 255;
      }
      g.putImageData(img, 0, 0);
      g.beginPath(); g.arc(N / 2, N / 2, r, 0, 2 * Math.PI); g.strokeStyle = css("--line"); g.lineWidth = 1.5; g.stroke();
    }
    draw();
    if (drag) { let d0 = null;
      cv.addEventListener("pointerdown", e => { d0 = [e.clientX, e.clientY, lon0, lat0]; cv.setPointerCapture(e.pointerId); cv.style.cursor = "grabbing"; });
      cv.addEventListener("pointermove", e => { if (!d0) return; const k = 180 / cv.getBoundingClientRect().width; lon0 = d0[2] - (e.clientX - d0[0]) * k; lat0 = clamp(d0[3] + (e.clientY - d0[1]) * k, -85, 85); draw(); });
      const up = () => { if (d0 && onRotate) onRotate(lon0, lat0); d0 = null; cv.style.cursor = "grab"; };
      cv.addEventListener("pointerup", up); cv.addEventListener("pointercancel", up); }
    return { canvas: cv, redraw: (nf) => { if (nf) f = nf; draw(); }, view: () => [lon0, lat0] };
  }

  // a horizontal colour bar
  function legend(host, { color = CM.vir, min = 0, max = 1, label = "", digits = 0, width = 240 } = {}) {
    const svg = svgIn(host, width, 34), n = 48; svg.style.maxWidth = width + "px";
    for (let i = 0; i < n; i++) el("rect", { x: 4 + i * (width - 8) / n, y: 4, width: (width - 8) / n + .5, height: 10, fill: color((i + .5) / n) }, svg);
    el("text", { x: 4, y: 28, "font-size": 11, class: "mono", fill: css("--muted") }, svg, fmt(min, digits));
    el("text", { x: width - 4, y: 28, "font-size": 11, class: "mono", fill: css("--muted"), "text-anchor": "end" }, svg, fmt(max, digits));
    el("text", { x: width / 2, y: 28, "font-size": 11, fill: css("--muted"), "text-anchor": "middle" }, svg, label);
  }

  /* curves: series [{ pts: [[x,y]…], col: token, label, dash?, w?, band?: [[x,lo,hi]…] }]; opts: xr, yr, xl, yl, W, H,
     marks [[x, label, token]], logx / logy (log axes), legendAt 'br' | 'tr' | 'tl' | 'bl' */
  function curves(host, series, { xr = [0, 1], yr = [0, 1], xl = "", yl = "", W = 460, H = 240, marks = [], xf = v => fmt(v, 1), yf = v => fmt(v, 1), xt = null, yt = null, legendAt = "br", logx = false, logy = false } = {}) {
    const svg = svgIn(host, W, H), tx = v => logx ? Math.log10(v) : v, ty = v => logy ? Math.log10(Math.max(v, 1e-30)) : v;
    const A = axes(svg, { W, H, m: { l: 46, r: 12, t: 12, b: 28 }, x0: tx(xr[0]), x1: tx(xr[1]), y0: ty(yr[0]), y1: ty(yr[1]),
      xt: (xt || [xr[0], logx ? Math.sqrt(xr[0] * xr[1]) : (xr[0] + xr[1]) / 2, xr[1]]).map(tx), yt: (yt || [yr[0], logy ? Math.sqrt(yr[0] * yr[1]) : (yr[0] + yr[1]) / 2, yr[1]]).map(ty),
      xf: v => xf(logx ? 10 ** v : v), yf: v => yf(logy ? 10 ** v : v), xl, yl });
    const X = v => A.x(clamp(tx(v), tx(xr[0]), tx(xr[1]))), Y = v => A.y(clamp(ty(v), ty(yr[0]), ty(yr[1])));
    marks.forEach(([x, lab, tok]) => { el("line", { x1: X(x), x2: X(x), y1: 12, y2: H - 28, stroke: css(tok || "--muted"), "stroke-dasharray": "3 3" }, svg);
      const right = X(x) > W - 90; el("text", { x: X(x) + (right ? -4 : 4), y: 24, "font-size": 10.5, "text-anchor": right ? "end" : "start", fill: css(tok || "--muted") }, svg, lab); });
    series.forEach(s => { if (s.band) el("path", { d: path(s.band.map(([x, lo]) => [X(x), Y(lo)]).concat(s.band.slice().reverse().map(([x, , hi]) => [X(x), Y(hi)]))) + "Z", fill: css(s.col), opacity: .16, stroke: "none" }, svg); });
    series.forEach(s => el("path", { d: path(s.pts.map(([x, y]) => [X(x), Y(y)])), fill: "none", stroke: css(s.col), "stroke-width": s.w || 2, "stroke-dasharray": s.dash || "", opacity: s.op ?? 1 }, svg));
    const lab = series.filter(s => s.label), lx = legendAt.includes("r") ? W - 16 : 54, anchor = legendAt.includes("r") ? "end" : "start";
    let ly = legendAt.includes("b") ? H - 36 - 14 * (lab.length - 1) : 26;
    lab.forEach(s => { el("text", { x: lx, y: ly, "text-anchor": anchor, "font-size": 11, fill: css(s.col) }, svg, (s.dash ? "- - " : "— ") + s.label); ly += 14; });
    return { svg, X, Y };
  }

  /* bars: items [{label, v, col?}]; opts: W, max, digits, unit */
  function bars(host, items, { W = 420, rowH = 24, max = null, digits = 1, labelW = 150, unit = "" } = {}) {
    const H = items.length * rowH + 6, svg = svgIn(host, W, H), mx = max || Math.max(...items.map(i => Math.abs(i.v)), 1e-9), span = W - labelW - 70;
    items.forEach((it, r) => { const y = 4 + r * rowH, w = span * Math.abs(it.v) / mx;
      el("text", { x: labelW - 8, y: y + rowH / 2 + 3, "text-anchor": "end", "font-size": 11.5, fill: css("--fg") }, svg, it.label);
      el("rect", { x: labelW, y: y + 3, width: Math.max(w, 1), height: rowH - 8, rx: 3, fill: css(it.col || "--accent"), opacity: .85 }, svg);
      el("text", { x: labelW + w + 4, y: y + rowH / 2 + 3, class: "mono", "font-size": 11, fill: css("--muted") }, svg, fmt(it.v, digits) + unit); });
    return svg;
  }

  /* a short multiple-choice quiz. questions: [{ q, opts: [...], right: index, why }] */
  function quiz(host, questions) {
    host.innerHTML = questions.map((Q, n) => `<div class="card" style="margin-bottom:8px"><p style="margin:0 0 6px"><b>${Q.q}</b></p><div class="chips">${Q.opts.map((o, i) => `<button class="chip" type="button" data-q="${n}" data-i="${i}">${o}</button>`).join("")}</div><p class="note" data-fb="${n}" style="margin:6px 0 0"></p></div>`).join("");
    $$("button[data-q]", host).forEach(b => b.addEventListener("click", () => {
      const Q = questions[+b.dataset.q], ok = +b.dataset.i === Q.right, fb = host.querySelector(`[data-fb="${b.dataset.q}"]`);
      $$(`button[data-q="${b.dataset.q}"]`, host).forEach(x => x.setAttribute("aria-pressed", x === b));
      fb.innerHTML = `<b style="color:var(${ok ? "--ok" : "--lw"})">${ok ? "Right." : "Not quite: " + Q.opts[Q.right] + "."}</b> ${Q.why}`;
    }));
  }
  return { raster, globe, legend, curves, bars, quiz };
})();
