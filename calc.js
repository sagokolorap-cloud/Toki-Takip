// Hesaplama motoru: ayni dosya hem telefonda hem testlerde calisir.
(function (root) {
  function addMonths(y, m, n) { const t = y * 12 + m + n; return [Math.floor(t / 12), t % 12]; }
  function ymKey(y, m) { return y + '-' + String(m + 1).padStart(2, '0'); }
  function parseYM(s) { const p = s.split('-'); return [+p[0], +p[1] - 1]; }

  // cfg: {price, downPct, n, start:'YYYY-MM', delivery:'YYYY-MM'|'', kdvPct, zams:[{ym, rate}]}
  function simulate(cfg, nowYM, nowDay) {
    const pd = cfg.payDay == null ? 20 : +cfg.payDay;
    const price = +cfg.price, n = +cfg.n;
    const down = price * (+cfg.downPct) / 100;
    let debt = price - down, paid = down, kdv = 0, kdvStarted = false;
    const zam = {}; (cfg.zams || []).forEach(z => { zam[z.ym] = (zam[z.ym] || 0) + (+z.rate); });
    const [sy, sm] = parseYM(cfg.start);
    const rows = [];
    for (let i = 0; i < n; i++) {
      const [y, m] = addMonths(sy, sm, i), key = ymKey(y, m);
      const rem = n - i; let zr = zam[key] || 0;
      if (zr) { debt *= 1 + zr / 100; if (kdvStarted) kdv *= 1 + zr / 100; }
      if (!kdvStarted && cfg.delivery && key >= cfg.delivery) {
        kdvStarted = true; kdv = (paid + debt) * (+cfg.kdvPct) / 100;
      }
      const inst = debt / rem, kinst = kdvStarted ? kdv / rem : 0;
      debt -= inst; kdv -= kinst; paid += inst;
      const tot = inst + kinst, kp = cfg.komPct == null ? 0.5 : +cfg.komPct, bp = cfg.bsmvPct == null ? 5 : +cfg.bsmvPct;
      const kom = tot * kp / 100, bsmv = kom * bp / 100;
      rows.push({ i: i + 1, ym: key, zam: zr, inst, kinst, total: tot, kom, bsmv, bank: tot + kom + bsmv,
        debtLeft: Math.max(debt, 0), kdvLeft: Math.max(kdv, 0), price: paid + debt + 0,
        day: pd, due: key < nowYM || (key === nowYM && nowDay >= pd) });
    }
    return { down, rows };
  }
  const api = { simulate, addMonths, ymKey, parseYM };
  if (typeof module !== 'undefined') module.exports = api; else root.Calc = api;
})(typeof window !== 'undefined' ? window : globalThis);
