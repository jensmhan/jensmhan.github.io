// Felles moro for forsiden og baksiden:
//  - Merker du låser opp ved å finne påskeegg (lagres i nettleseren)
//  - Små lydeffekter (bare når lyden er slått på)
//  - Regn av chips, øl, pizza, sokker og mynter
//  - Sofaen som snur seg når man går til baksiden
//  - Hemmelige ord man kan skrive på tastaturet
//  - En liten hjelp i konsollen: slabbe.hjelp()
window.slabbe = (() => {
  const MERKER = [
    { id: "stuntmann", navn: "Stuntmann", hint: "Få ham ut av sofaen tre ganger.", tekst: "Han har vondt i ryggen nå. Takk." },
    { id: "vekkerklokke", navn: "Vekkerklokke", hint: "Han sover. Ikke la ham.", tekst: "Pirket på ham ti ganger. Han husker deg." },
    { id: "fluesmekker", navn: "Fluesmekker", hint: "Noe surrer ved søppelsekken.", tekst: "Fem fluer. Søppelsekken er fortsatt full." },
    { id: "chipsjeger", navn: "Chipsjeger", hint: "Det ligger fem chips gjemt rundt på forsiden.", tekst: "Fant alle fem. Spiste dem. Selvfølgelig." },
    { id: "logo", navn: "Logo-pirker", hint: "Hva skjer hvis man maser på logoen?", tekst: "Logoen falt ut av sofaen den også." },
    { id: "polyglott", navn: "Polyglott", hint: "Velkomsten finnes på flere språk.", tekst: "Kan si slabbedask på alle språk som teller." },
    { id: "uttale", navn: "Uttaleekspert", hint: "Lær å si ordet riktig.", tekst: "Slab-be-dask. Med trykk på «dask»." },
    { id: "regel8", navn: "Regelbryter", hint: "Det finnes flere regler enn sju.", tekst: "Du leste regel 8. Det sto at du ikke skulle." },
    { id: "diplom", navn: "Sertifisert", hint: "Ta testen. Svar riktig.", tekst: "Har diplom. Henger det på kjøleskapet." },
    { id: "hemmelig", navn: "Tastaturfingre", hint: "Prøv å skrive noe som slabbedasken liker.", tekst: "Fant et hemmelig ord. Det finnes flere." },
    { id: "konami", navn: "Gamle triks", hint: "↑ ↑ ↓ ↓ …", tekst: "Konami-koden. Alt falt ut av sofaen." },
    { id: "slapp", navn: "Profesjonelt slapp", hint: "Gjør ingenting. Lenge.", tekst: "Gjorde ingenting i ett helt minutt. Naturtalent." },
    { id: "tyv", navn: "Kopimaskin", hint: "Ta med deg litt tekst hjem.", tekst: "Kopierte tekst. Vi la ved en kildehenvisning." },
    { id: "hacker", navn: "Hacker", hint: "Utviklere har sin egen inngang.", tekst: "Fant konsollen. Mamma er stolt." },
    { id: "nattugle", navn: "Nattugle", hint: "Kom innom når alle andre sover.", tekst: "Var her mellom midnatt og fem. Sterkt." },
    { id: "bakside", navn: "Bak sofaen", hint: "Sofaen har en bakside.", tekst: "Fant baksiden. Det er støvete der." },
    { id: "fjernkontroll", navn: "Fjernkontrollen!", hint: "Den ligger alltid mellom putene.", tekst: "Endelig. Etter alle disse årene." },
    { id: "rik", navn: "Sofamillionær", hint: "Det ligger penger i sofaen.", tekst: "Hundre kroner i småmynt. Pizza i kveld." },
    { id: "fanger", navn: "Ølfanger", hint: "Fang ølen. Ikke brokkolien.", tekst: "25 bokser fanget i én omgang." },
    { id: "unnskyldning", navn: "Unnskyldningskunstner", hint: "Lag deg noen gode unnskyldninger.", tekst: "Ti unnskyldninger. Du er dekket ut året." },
    { id: "kundeservice", navn: "Tålmodig kunde", hint: "Kundeservice svarer. Til slutt.", tekst: "Sendte ti meldinger. Fikk ingen hjelp. Som forventet." },
    { id: "stovdott", navn: "Støvdottvenn", hint: "Noe lever under sofaen.", tekst: "Klappet støvdotten. Den heter Bjarne." },
    { id: "konge", navn: "Kongelig", hint: "Kongen drikker aldri alene. Pirk på ølen hans.", tekst: "Kom inn i kjøleskapet. Lenge leve kongen!" },
    { id: "borte", navn: "Gått seg vill", hint: "Prøv en adresse som ikke finnes.", tekst: "Fant en side som ikke finnes. Den lå under sofaen." },
  ];

  const les = (k, fallback) => { try { const v = localStorage.getItem(k); return v === null ? fallback : JSON.parse(v); } catch { return fallback; } };
  const skriv = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
  const funnet = new Set(les("slabbe-merker", []));

  // ---------------- Stil ----------------
  const css = document.createElement("style");
  css.textContent = `
    .slabbe-knapp-merker {
      position: fixed; top: 16px; left: 16px; z-index: 2;
      height: 44px; min-width: 44px; padding: 0 12px 0 10px; border-radius: 999px;
      display: flex; align-items: center; gap: 6px;
      background: var(--bg); color: var(--text); border: 1px solid var(--border);
      box-shadow: 0 2px 8px rgba(0,0,0,.12); cursor: pointer; font: inherit; font-weight: 700; font-size: .9rem;
    }
    .slabbe-knapp-merker:hover { border-color: var(--muted); }
    .slabbe-knapp-merker:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
    .slabbe-knapp-merker.ny { animation: slabbe-hopp .6s ease-out 2; }
    @keyframes slabbe-hopp { 30% { transform: translateY(-8px) rotate(-8deg); } 60% { transform: translateY(0) rotate(4deg); } }

    .slabbe-toasts { position: fixed; inset: auto auto 16px 50%; transform: translateX(-50%); z-index: 6;
      display: flex; flex-direction: column; gap: 8px; align-items: center; pointer-events: none; width: calc(100vw - 32px); max-width: 420px;
      margin: 0; padding: 0; border: 0; background: none; overflow: visible; color: inherit; }
    .slabbe-toast {
      background: #fff; color: #1f2328; border: 3px solid #1f2328; border-radius: 14px;
      padding: 8px 14px; font-weight: 700; box-shadow: 0 4px 0 #1f2328; text-align: center;
      animation: slabbe-inn .35s ease-out both;
    }
    .slabbe-toast small { display: block; font-weight: 500; color: #5c6370; }
    .slabbe-toast.merke { background: #facc15; }
    .slabbe-toast.merke small { color: #4a3f1c; }
    .slabbe-toast.ut { animation: slabbe-ut .3s ease-in both; }
    @keyframes slabbe-inn { from { transform: translateY(30px) scale(.9); opacity: 0; } }
    @keyframes slabbe-ut { to { transform: translateY(20px); opacity: 0; } }

    dialog.slabbe-dialog {
      width: min(560px, calc(100vw - 32px)); max-height: calc(100vh - 48px); padding: 0;
      border: 3px solid #1f2328; border-radius: 18px; background: var(--bg); color: var(--text);
      box-shadow: 0 6px 0 #1f2328;
    }
    dialog.slabbe-dialog::backdrop { background: rgba(15,17,21,.55); }
    .slabbe-dialog .innhold { padding: 20px 20px 24px; }
    .slabbe-dialog h2 { margin: 0 0 4px; font-size: 1.4rem; }
    .slabbe-dialog .lukk {
      position: sticky; top: 0; float: right; margin: 10px 10px 0 0;
      width: 36px; height: 36px; border-radius: 50%; border: 1px solid var(--border);
      background: var(--bg); color: var(--text); font-size: 1.2rem; cursor: pointer; line-height: 1;
    }
    .slabbe-merkeliste { list-style: none; margin: 16px 0 0; padding: 0; display: grid; gap: 8px; }
    .slabbe-merkeliste li { display: flex; gap: 12px; align-items: center; padding: 8px 10px; border: 1px solid var(--border); border-radius: 12px; }
    .slabbe-merkeliste .ikon { flex: 0 0 36px; height: 36px; border-radius: 50%; display: grid; place-items: center;
      background: var(--sofa, #facc15); border: 2px solid #1f2328; color: #1f2328; font-weight: 900; }
    .slabbe-merkeliste li.laast { opacity: .6; }
    .slabbe-merkeliste li.laast .ikon { background: var(--border); }
    .slabbe-merkeliste b { display: block; }
    .slabbe-merkeliste span { color: var(--muted); font-size: .9rem; }
    .slabbe-maaler { height: 12px; border-radius: 999px; background: var(--border); overflow: hidden; margin-top: 10px; }
    .slabbe-maaler div { height: 100%; background: var(--sofa, #facc15); border-right: 2px solid #1f2328; }

    .slabbe-regn { position: fixed; inset: 0; z-index: 5; pointer-events: none; overflow: hidden; }
    .slabbe-regn > div { position: absolute; top: -60px; width: 40px; height: 40px;
      animation: slabbe-fall var(--t) cubic-bezier(.45,.05,.8,.6) var(--d) both; }
    .slabbe-regn svg { width: 100%; height: 100%; display: block; }
    @keyframes slabbe-fall { to { transform: translate(var(--x), calc(100vh + 120px)) rotate(var(--r)); } }

    .slabbe-snu { position: fixed; inset: 0; z-index: 10; perspective: 1400px; pointer-events: none; }
    .slabbe-snu div {
      position: absolute; inset: 0; display: grid; place-items: center;
      background: #facc15; color: #1f2328; font: 900 clamp(1.4rem, 6vw, 2.6rem) system-ui, sans-serif;
      background-image: repeating-linear-gradient(90deg, rgba(0,0,0,.06) 0 2px, transparent 2px 48px);
      border: 6px solid #1f2328; backface-visibility: hidden;
    }
    .slabbe-snu.ut div { animation: slabbe-snu-ut .55s ease-in both; }
    .slabbe-snu.inn div { animation: slabbe-snu-inn .55s ease-out both; }
    @keyframes slabbe-snu-ut { from { transform: rotateY(-90deg); } to { transform: rotateY(0); } }
    @keyframes slabbe-snu-inn { from { transform: rotateY(0); } to { transform: rotateY(90deg); } }

    @media (prefers-reduced-motion: reduce) {
      .slabbe-toast, .slabbe-knapp-merker.ny, .slabbe-snu div { animation-duration: .01s !important; }
    }
  `;
  document.head.append(css);

  // ---------------- Lyd (egne effekter, bare når høyttaleren er på) ----------------
  let ctx = null;
  function lyd(navn) {
    if (!window.slabbeLyd || !window.slabbeLyd.on) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    if (!ctx) ctx = new AC();
    ctx.resume();
    const t = ctx.currentTime;
    const tone = (f, start, dur, type = "triangle", vol = 0.25, til) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = type;
      o.frequency.setValueAtTime(f, t + start);
      if (til) o.frequency.exponentialRampToValueAtTime(til, t + start + dur);
      g.gain.setValueAtTime(0.0001, t + start);
      g.gain.exponentialRampToValueAtTime(vol, t + start + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + start + dur);
      o.connect(g); g.connect(ctx.destination);
      o.start(t + start); o.stop(t + start + dur + 0.05);
    };
    const stoy = (start, dur, freq, vol = 0.3) => {
      const b = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * dur), ctx.sampleRate);
      const d = b.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
      const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
      s.buffer = b; f.type = "bandpass"; f.frequency.value = freq; g.gain.value = vol;
      s.connect(f); f.connect(g); g.connect(ctx.destination);
      s.start(t + start);
    };
    const L = {
      pling() { tone(880, 0, 0.15); tone(1320, 0.1, 0.3); },
      merke() { [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.09, 0.25, "square", 0.08)); },
      knas() { for (let i = 0; i < 5; i++) stoy(i * 0.035 + Math.random() * 0.02, 0.05, 2500 + Math.random() * 2500, 0.5); },
      plopp() { tone(500, 0, 0.12, "sine", 0.35, 120); },
      feil() { tone(160, 0, 0.25, "square", 0.08, 110); },
      svisj() { stoy(0, 0.45, 900, 0.4); },
      mynt() { tone(1568, 0, 0.08, "square", 0.06); tone(2093, 0.07, 0.25, "square", 0.06); },
      pip() { tone(1200, 0, 0.06, "sine", 0.12); },
    };
    if (L[navn]) L[navn]();
    else if (window.slabbeLyd.play) window.slabbeLyd.play(navn); // rap, dunk, pssht, smekk, grynt, klor
  }

  // ---------------- Små meldinger nederst ----------------
  const toasts = document.createElement("div");
  toasts.className = "slabbe-toasts";
  toasts.setAttribute("role", "status");
  toasts.setAttribute("aria-live", "polite");
  if ("popover" in HTMLElement.prototype) toasts.popover = "manual";
  function melding(tekst, under = "", klasse = "", ms = 3200) {
    const t = document.createElement("div");
    t.className = "slabbe-toast " + klasse;
    t.textContent = tekst;
    if (under) { const s = document.createElement("small"); s.textContent = under; t.append(s); }
    toasts.append(t);
    while (toasts.children.length > 3) toasts.firstChild.remove();
    // Legg meldingene øverst, også over en åpen dialog (popover havner i det øverste laget)
    if (toasts.showPopover) { try { toasts.hidePopover(); } catch {} try { toasts.showPopover(); } catch {} }
    setTimeout(() => { t.classList.add("ut"); setTimeout(() => t.remove(), 320); }, ms);
  }

  // ---------------- Merker ----------------
  const knapp = document.createElement("button");
  knapp.type = "button";
  knapp.className = "slabbe-knapp-merker";
  knapp.title = "Merker";
  const tell = () => {
    knapp.innerHTML = `<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M7 4h10v4a5 5 0 0 1-10 0z M7 6H4v1a3 3 0 0 0 3 3 M17 6h3v1a3 3 0 0 1-3 3 M12 13v4 M8 20h8 M9 17h6v3H9z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg><span>${funnet.size}/${MERKER.length}</span>`;
    knapp.setAttribute("aria-label", `Merker: ${funnet.size} av ${MERKER.length}`);
  };
  tell();

  const dialog = document.createElement("dialog");
  dialog.className = "slabbe-dialog";
  dialog.setAttribute("aria-label", "Merker");
  function visMerker() {
    const n = funnet.size, alle = n === MERKER.length;
    dialog.innerHTML = `
      <button class="lukk" type="button" aria-label="Lukk">×</button>
      <div class="innhold">
        <h2>Merker</h2>
        <p style="margin:0;color:var(--muted)">${alle
          ? "Du har alle! Du er offisielt verdensmester i å kaste bort tid. Vi er stolte og litt bekymret."
          : `${n} av ${MERKER.length}. Resten er gjemt rundt på siden. Og bak sofaen.`}</p>
        <div class="slabbe-maaler"><div style="width:${(n / MERKER.length) * 100}%"></div></div>
        <ul class="slabbe-merkeliste">${MERKER.map((m) => funnet.has(m.id)
          ? `<li><span class="ikon">★</span><div><b>${m.navn}</b><span>${m.tekst}</span></div></li>`
          : `<li class="laast"><span class="ikon">?</span><div><b>???</b><span>Hint: ${m.hint}</span></div></li>`).join("")}</ul>
      </div>`;
    dialog.querySelector(".lukk").addEventListener("click", () => dialog.close());
    if (!dialog.open) dialog.showModal();
  }
  knapp.addEventListener("click", () => { knapp.classList.remove("ny"); visMerker(); });
  dialog.addEventListener("click", (e) => { if (e.target === dialog) dialog.close(); });

  function merke(id) {
    const m = MERKER.find((x) => x.id === id);
    if (!m || funnet.has(id)) return false;
    funnet.add(id);
    skriv("slabbe-merker", [...funnet]);
    tell();
    knapp.classList.remove("ny"); void knapp.offsetWidth; knapp.classList.add("ny");
    melding(`Nytt merke: ${m.navn}`, m.tekst, "merke", 4200);
    lyd("merke");
    if (funnet.size === MERKER.length) setTimeout(() => { regn("chips", 50); melding("ALLE MERKENE!", "Gå og gjør noe nyttig nå. Eller ikke.", "merke", 6000); }, 1200);
    return true;
  }

  // ---------------- Regn av rare ting ----------------
  const S = 'stroke="#1f2328" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"';
  const TING = {
    chips: `<path d="M5 21 q3 -15 16 -15 q13 2 14 15 q-4 13 -17 13 q-13 -2 -13 -13z" fill="#f5c542" ${S}/><path d="M12 17 q4 3 8 0 M17 25 q4 3 8 0" stroke="#d99a1e" stroke-width="2" fill="none" stroke-linecap="round"/>`,
    øl: `<rect x="12" y="4" width="16" height="32" rx="3" fill="#c9cdd3" ${S}/><rect x="13.5" y="13" width="13" height="12" fill="#e0a526"/><path d="M15 8 h10" ${S}/>`,
    pizza: `<path d="M5 9 L35 9 L20 37 Z" fill="#f5c542" ${S}/><path d="M5 9 Q20 3 35 9" fill="#cfa772" ${S}/><circle cx="17" cy="16" r="3" fill="#c0392b"/><circle cx="24" cy="22" r="2.6" fill="#c0392b"/><circle cx="19" cy="27" r="2" fill="#c0392b"/>`,
    sokk: `<path d="M14 4 h12 v16 q0 4 3 7 q4 5 -1 8 q-4 2 -8 -2 l-7 -7 q-2 -2 -1 -5 z" fill="#e74c3c" ${S}/><path d="M14 9 h12" stroke="#fafaf7" stroke-width="3"/>`,
    mynt: `<circle cx="20" cy="20" r="14" fill="#f5c542" ${S}/><circle cx="20" cy="20" r="9" fill="none" stroke="#d99a1e" stroke-width="2"/><path d="M20 14 v12" stroke="#d99a1e" stroke-width="3" stroke-linecap="round"/>`,
    fjernkontroll: `<rect x="13" y="3" width="14" height="34" rx="5" fill="#3b4252" ${S}/><circle cx="20" cy="10" r="3" fill="#e74c3c"/><circle cx="17" cy="20" r="1.8" fill="#fafaf7"/><circle cx="23" cy="20" r="1.8" fill="#fafaf7"/><circle cx="17" cy="27" r="1.8" fill="#fafaf7"/><circle cx="23" cy="27" r="1.8" fill="#fafaf7"/>`,
  };
  let regnBoks = null;
  const rolig = matchMedia("(prefers-reduced-motion: reduce)").matches;
  function regn(type = "chips", antall = 30) {
    const typer = type === "alt" ? Object.keys(TING) : [type];
    if (!regnBoks) { regnBoks = document.createElement("div"); regnBoks.className = "slabbe-regn"; regnBoks.setAttribute("aria-hidden", "true"); document.body.append(regnBoks); }
    const n = rolig ? Math.min(8, antall) : antall;
    for (let i = 0; i < n; i++) {
      const d = document.createElement("div");
      const str = 0.7 + Math.random() * 0.8;
      d.style.cssText = `left:${Math.random() * 100}vw; width:${40 * str}px; height:${40 * str}px;` +
        `--t:${(2 + Math.random() * 2).toFixed(2)}s; --d:${(Math.random() * 1.4).toFixed(2)}s;` +
        `--x:${((Math.random() - 0.5) * 160).toFixed(0)}px; --r:${((Math.random() - 0.5) * 900).toFixed(0)}deg;`;
      d.innerHTML = `<svg viewBox="0 0 40 40">${TING[typer[i % typer.length]]}</svg>`;
      d.addEventListener("animationend", () => d.remove());
      regnBoks.append(d);
    }
  }

  // ---------------- Sofaen snur seg ----------------
  function snuTil(url, tekst = "Snur sofaen…") {
    lyd("svisj");
    const s = document.createElement("div");
    s.className = "slabbe-snu ut";
    s.innerHTML = `<div>${tekst}</div>`;
    document.body.append(s);
    try { sessionStorage.setItem("slabbe-snudd", "1"); } catch {}
    setTimeout(() => { location.href = url; }, rolig ? 50 : 600);
  }
  function snuInn() {
    let snudd = false;
    try { snudd = sessionStorage.getItem("slabbe-snudd") === "1"; sessionStorage.removeItem("slabbe-snudd"); } catch {}
    if (!snudd || rolig) return;
    const s = document.createElement("div");
    s.className = "slabbe-snu inn";
    s.innerHTML = "<div></div>";
    document.body.append(s);
    setTimeout(() => s.remove(), 650);
  }

  // ---------------- Hemmelige ord på tastaturet ----------------
  const ord = {};
  let skrevet = "";
  addEventListener("keydown", (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.target.closest && e.target.closest("input, textarea, select, [contenteditable]")) return;
    if (e.key.length !== 1) return;
    skrevet = (skrevet + e.key.toLowerCase()).slice(-20);
    for (const w in ord) if (skrevet.endsWith(w)) { skrevet = ""; ord[w](); break; }
  });

  // ---------------- Ting som gjelder alle sider ----------------
  function start() {
    document.body.append(knapp, dialog, toasts);
    snuInn();
    const h = new Date().getHours();
    if (h < 5) setTimeout(() => merke("nattugle"), 1500);

    // Fanen roper på deg når du går
    const tittel = document.title;
    const rop = ["Kom tilbake! Sofaen er fortsatt varm.", "Hallo? Det er mer chips her.", "Du glemte å ikke gjøre noe."];
    let r = 0;
    document.addEventListener("visibilitychange", () => {
      document.title = document.hidden ? rop[r++ % rop.length] : tittel;
    });

    // Kopierer man tekst, får man kilde på kjøpet
    document.addEventListener("copy", (e) => {
      const valgt = String(getSelection());
      if (!valgt.trim() || !e.clipboardData || (e.target.closest && e.target.closest("input, textarea"))) return;
      e.clipboardData.setData("text/plain", valgt + "\n\n— stjålet fra slabbedask.no, din slabbedask");
      e.preventDefault();
      merke("tyv");
    });

    // Gjør ingenting i ett minutt
    let stille;
    const vakt = () => { clearTimeout(stille); stille = setTimeout(() => { if (!document.hidden) { melding("Du har ikke gjort noe på ett minutt.", "Imponerende. Virkelig."); merke("slapp"); } }, 60000); };
    ["pointermove", "keydown", "scroll", "touchstart"].forEach((t) => addEventListener(t, vakt, { passive: true }));
    vakt();

    console.log("%c  ___\n /   \\__   Hei, du som kikker under panseret.\n|  zZz  |  Skriv slabbe.hjelp() her nede.\n \\_____/", "font: 700 13px monospace; color: #ca8a04");
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();

  return {
    merke, har: (id) => funnet.has(id), merker: visMerker, melding, lyd, regn, snuTil,
    ord: (w, fn) => { ord[w] = fn; }, les, skriv,
    hjelp() {
      merke("hacker");
      console.log([
        "slabbe.regn('chips' | 'øl' | 'pizza' | 'sokk' | 'mynt' | 'alt')  → det regner",
        "slabbe.merker()     → se merkene dine",
        "slabbe.rap()        → han raper (skru på lyden først)",
        "slabbe.bakside()    → bak sofaen",
        "slabbe.nullstill()  → glem alt (merker, chips, penger, rekorder)",
        "Hemmelige ord kan skrives rett på siden. Ingen hint. Ok, ett hint: han er tørst.",
      ].join("\n"));
      return "Lykke til. Eller ikke, vi bryr oss egentlig ikke.";
    },
    rap() { lyd("rap"); return "RAAAP"; },
    bakside() { snuTil("/bakside.html"); return "Snur sofaen…"; },
    nullstill() { try { Object.keys(localStorage).filter((k) => k.startsWith("slabbe-")).forEach((k) => localStorage.removeItem(k)); } catch {} location.reload(); },
  };
})();
