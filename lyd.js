// Lydene til slabbedasken, laget med Web Audio, så det trengs ingen lydfiler.
// Alt er avslått til man trykker på høyttalerknappen øverst til høyre.
window.slabbeLyd = (() => {
  let ctx = null, out = null, noise = null;
  let on = false, wantSnore = false, snoreTimer = null;

  function init() {
    if (ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    out = ctx.createGain();
    out.gain.value = 0.7;
    const comp = ctx.createDynamicsCompressor();
    out.connect(comp);
    comp.connect(ctx.destination);
    // To sekunder med hvit støy som gjenbrukes til pust, pssht og smekk
    noise = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const d = noise.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }

  // Små byggeklosser
  const gain = () => ctx.createGain();
  const osc = (type) => { const o = ctx.createOscillator(); o.type = type; return o; };
  const filt = (type, f, Q = 1) => {
    const b = ctx.createBiquadFilter();
    b.type = type; b.frequency.value = f; b.Q.value = Q;
    return b;
  };
  const chain = (...n) => { for (let i = 0; i < n.length - 1; i++) n[i].connect(n[i + 1]); };
  function env(g, t, attack, peak, hold, release) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + attack);
    g.gain.setValueAtTime(peak, t + attack + hold);
    g.gain.exponentialRampToValueAtTime(0.0001, t + attack + hold + release);
  }
  function noiseSrc(t, dur) {
    const s = ctx.createBufferSource();
    s.buffer = noise; s.loop = true;
    s.start(t, Math.random() * 1.5);
    s.stop(t + dur + 0.05);
    return s;
  }

  const S = {
    // Ølboksen åpnes
    pssht() {
      const t = ctx.currentTime;
      const c = gain(); env(c, t, 0.002, 0.8, 0, 0.025);
      chain(noiseSrc(t, 0.03), filt("highpass", 2500), c, out);
      const f = filt("bandpass", 5200, 0.8), g = gain();
      f.frequency.setValueAtTime(5200, t + 0.02);
      f.frequency.exponentialRampToValueAtTime(2600, t + 0.45);
      env(g, t + 0.02, 0.01, 0.55, 0.05, 0.4);
      chain(noiseSrc(t + 0.02, 0.5), f, g, out);
    },
    // Han treffer gulvet
    dunk() {
      const t = ctx.currentTime;
      const o = osc("sine"), g = gain();
      o.frequency.setValueAtTime(150, t);
      o.frequency.exponentialRampToValueAtTime(40, t + 0.3);
      env(g, t, 0.005, 1, 0.02, 0.45);
      chain(o, g, out); o.start(t); o.stop(t + 0.6);
      const g2 = gain(); env(g2, t, 0.003, 0.6, 0, 0.15);
      chain(noiseSrc(t, 0.2), filt("lowpass", 500), g2, out);
    },
    // Rap
    rap() {
      const t = ctx.currentTime, dur = 0.8;
      const o = osc("sawtooth");
      o.frequency.setValueAtTime(105, t);
      o.frequency.linearRampToValueAtTime(76, t + dur);
      const wob = osc("sine"), wobG = gain();         // vibrato
      wob.frequency.value = 22; wobG.gain.value = 30;
      chain(wob, wobG); wobG.connect(o.frequency);
      const rug = osc("square"), rugG = gain(), vca = gain(); // ruglete
      rug.frequency.value = 11; rugG.gain.value = 0.25; vca.gain.value = 0.75;
      chain(rug, rugG); rugG.connect(vca.gain);
      const g = gain(); env(g, t, 0.04, 0.6, dur - 0.25, 0.2);
      chain(o, filt("lowpass", 700, 6), vca, g, out);
      [o, wob, rug].forEach((x) => { x.start(t); x.stop(t + dur + 0.1); });
    },
    // Flua blir smekka
    smekk() {
      const t = ctx.currentTime;
      const g = gain(); env(g, t, 0.001, 1, 0, 0.07);
      chain(noiseSrc(t, 0.08), filt("highpass", 1200), g, out);
      const o = osc("sine"), og = gain();
      o.frequency.setValueAtTime(900, t);
      o.frequency.exponentialRampToValueAtTime(180, t + 0.06);
      env(og, t, 0.001, 0.5, 0, 0.06);
      chain(o, og, out); o.start(t); o.stop(t + 0.1);
    },
    // Sur grynt
    grynt() {
      const t = ctx.currentTime, dur = 0.45;
      const o = osc("sawtooth"), g = gain();
      o.frequency.setValueAtTime(130, t);
      o.frequency.exponentialRampToValueAtTime(85, t + dur);
      env(g, t, 0.03, 0.45, dur - 0.15, 0.12);
      chain(o, filt("lowpass", 500, 3), g, out); o.start(t); o.stop(t + dur + 0.05);
    },
    // Klør seg på magen
    klor() {
      const t0 = ctx.currentTime;
      for (let i = 0; i < 4; i++) {
        const t = t0 + i * 0.14, g = gain();
        env(g, t, 0.01, 0.35, 0.03, 0.06);
        chain(noiseSrc(t, 0.1), filt("bandpass", 2400, 1.5), g, out);
      }
    },
    // Ett snork: ruglete innpust, så en myk utpust
    snork() {
      const t = ctx.currentTime;
      const o = osc("sawtooth");
      o.frequency.setValueAtTime(62, t);
      o.frequency.linearRampToValueAtTime(70, t + 1.3);
      const rug = osc("square"), rugG = gain(), vca = gain();
      rug.frequency.value = 26; rugG.gain.value = 0.5; vca.gain.value = 0.5;
      chain(rug, rugG); rugG.connect(vca.gain);
      const g = gain(); env(g, t, 0.7, 0.35, 0.4, 0.35);
      chain(o, filt("lowpass", 380, 4), vca, g, out);
      const ng = gain(); env(ng, t, 0.7, 0.12, 0.4, 0.35);
      chain(noiseSrc(t, 1.5), filt("bandpass", 500, 1), ng, out);
      [o, rug].forEach((x) => { x.start(t); x.stop(t + 1.6); });
      const t2 = t + 1.9, g2 = gain();
      env(g2, t2, 0.15, 0.1, 0.3, 0.7);
      chain(noiseSrc(t2, 1.2), filt("lowpass", 900), g2, out);
    },
  };

  function updateSnore() {
    const should = on && wantSnore;
    if (should && !snoreTimer) { S.snork(); snoreTimer = setInterval(S.snork, 3800); }
    if (!should && snoreTimer) { clearInterval(snoreTimer); snoreTimer = null; }
  }

  return {
    get on() { return on; },
    async toggle() {
      on = !on;
      if (on) {
        init();
        if (!ctx) { on = false; return false; }
        await ctx.resume();
        S.pssht();
      }
      updateSnore();
      return on;
    },
    play(name) { if (on && ctx && S[name]) S[name](); },
    setSnore(v) { if (wantSnore !== v) { wantSnore = v; updateSnore(); } },
  };
})();

// Høyttalerknappen. Valget huskes til neste gang, men nettleseren lar oss ikke
// starte lyd før man har trykket på noe, så da slås den på ved første trykk.
(() => {
  const btn = document.getElementById("lyd");
  if (!btn) return;
  const vis = (on) => {
    btn.classList.toggle("on", on);
    btn.setAttribute("aria-pressed", String(on));
    btn.setAttribute("aria-label", on ? "Slå av lyd" : "Slå på lyd");
  };
  btn.addEventListener("click", async () => {
    const on = await window.slabbeLyd.toggle();
    vis(on);
    try { localStorage.setItem("slabbe-lyd", on ? "på" : "av"); } catch {}
  });

  let lagret = null;
  try { lagret = localStorage.getItem("slabbe-lyd"); } catch {}
  if (lagret !== "på") return;
  const hendelser = ["pointerup", "keydown"];
  const slutt = () => hendelser.forEach((t) => removeEventListener(t, start, true));
  async function start(e) {
    slutt();
    if (e.target.closest && e.target.closest("#lyd")) return; // knappen tar seg av det selv
    if (!window.slabbeLyd.on) vis(await window.slabbeLyd.toggle());
  }
  hendelser.forEach((t) => addEventListener(t, start, true));
})();
