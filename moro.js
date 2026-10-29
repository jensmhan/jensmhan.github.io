// Påskeegg på forsiden. Merkene, lydene og regnet bor i merker.js.
(() => {
  const S = window.slabbe;
  if (!S) return;
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => [...document.querySelectorAll(s)];
  const pick = (list) => list[Math.floor(Math.random() * list.length)];

  // ---------------- Fem gjemte chips ----------------
  const CHIPS = '<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M5 21 q3 -15 16 -15 q13 2 14 15 q-4 13 -17 13 q-13 -2 -13 -13z" fill="#f5c542" stroke="#1f2328" stroke-width="2.5" stroke-linejoin="round"/><path d="M12 17 q4 3 8 0 M17 25 q4 3 8 0" stroke="#d99a1e" stroke-width="2" fill="none" stroke-linecap="round"/></svg>';
  const spist = new Set(S.les("slabbe-chips", []));
  const alleChips = $$(".gjemt-chips");
  alleChips.forEach((b) => {
    if (spist.has(b.dataset.nr)) return; // allerede funnet, forblir tom og skjult
    b.innerHTML = CHIPS;
    b.addEventListener("click", () => {
      spist.add(b.dataset.nr);
      S.skriv("slabbe-chips", [...spist]);
      b.classList.add("spist");
      setTimeout(() => b.remove(), 420);
      S.lyd("knas");
      const n = spist.size, igjen = alleChips.length - n;
      if (igjen > 0) S.melding(`Chips! ${n} av ${alleChips.length}`, pick(["Knas.", "Fortsatt sprø.", "Litt myk, men ok.", "Smaker paprika.", "Hvor lenge har den ligget der?"]));
      else { S.melding("Alle chipsene funnet!", "Ingen ble delt med noen."); S.regn("chips", 40); S.merke("chipsjeger"); }
    });
  });

  // ---------------- Logoen faller ut av sofaen ----------------
  const logo = $("h1.logo img");
  let logoKlikk = [];
  logo.addEventListener("click", () => {
    const t = performance.now();
    logoKlikk = logoKlikk.filter((k) => t - k < 4000).concat(t);
    S.lyd("pip");
    if (logoKlikk.length >= 7 && !logo.classList.contains("dett")) {
      logoKlikk = [];
      logo.classList.add("dett");
      setTimeout(() => S.lyd("dunk"), 700);
      setTimeout(() => logo.classList.remove("dett"), 2500);
      S.merke("logo");
    }
  });

  // ---------------- Velkomsten på mange språk ----------------
  const lead = $(".lead"), under = $(".under");
  const SPRAAK = [
    ["Velkommen din forbanna slabbedask!", "bokmål"],
    ["Velkomen, din forbaska slabbedask!", "nynorsk"],
    ["Velkømmen, din forbainna slabbedask!", "trøndersk"],
    ["Välkommen din förbannade slabbedask!", "svensk"],
    ["Velkommen din forbandede slabbedask!", "dansk"],
    ["Welcome, you bloody slabbedask!", "engelsk"],
    ["Willkommen, du verdammter Slabbedask!", "tysk"],
    ["Bienvenue, espèce de slabbedask !", "fransk"],
    ["¡Bienvenido, maldito slabbedask!", "spansk"],
    ["Tervetuloa, sinä kirottu slabbedask!", "finsk"],
    ["Bures boahtin, slabbedask!", "nordsamisk"],
    ["Zzz… slabbedask… zzz…", "sofaspråk"],
  ];
  let spr = 0, sett = new Set([0]), underTimer;
  const underTekst = under.textContent;
  lead.title = "Trykk på meg";
  lead.addEventListener("click", () => {
    spr = (spr + 1) % SPRAAK.length;
    sett.add(spr);
    lead.textContent = SPRAAK[spr][0];
    under.textContent = `(${SPRAAK[spr][1]})`;
    clearTimeout(underTimer);
    underTimer = setTimeout(() => { under.textContent = underTekst; }, 2500);
    S.lyd("pip");
    if (sett.size === SPRAAK.length) S.merke("polyglott");
  });

  // ---------------- Uttale ----------------
  const UTTALE = [
    { rate: 0.9, pitch: 1, tekst: "Slab-be-dask. Trykk på «dask»." },
    { rate: 0.35, pitch: 0.8, tekst: "Langsom versjon, for søndager." },
    { rate: 2, pitch: 1.4, tekst: "Stresset slabbedask (finnes ikke i naturen)." },
    { rate: 0.8, pitch: 0.1, tekst: "Slabbedask med morgenstemme." },
    { rate: 1.2, pitch: 2, tekst: "Slabbedask som har pustet inn helium." },
  ];
  let u = 0;
  $(".uttal").addEventListener("click", () => {
    const v = UTTALE[u++ % UTTALE.length];
    S.melding(v.tekst);
    S.merke("uttale");
    if (!("speechSynthesis" in window)) return;
    speechSynthesis.cancel();
    const ytring = new SpeechSynthesisUtterance("slabbedask");
    const stemme = speechSynthesis.getVoices().find((s) => /^(nb|no|nn)/i.test(s.lang));
    if (stemme) ytring.voice = stemme;
    ytring.lang = stemme ? stemme.lang : "nb-NO";
    ytring.rate = v.rate; ytring.pitch = v.pitch;
    speechSynthesis.speak(ytring);
  });

  // ---------------- Regel 8 (og 9) ----------------
  const regler = $(".regler");
  const EKSTRA = ["Ikke les regel 8.", "Nå leste du regel 8 likevel. Typisk.", "Det finnes ingen regel 10. Gå videre."];
  let regelKlikk = 0, ekstra = 0;
  regler.addEventListener("click", () => {
    regelKlikk++;
    if (ekstra >= EKSTRA.length || regelKlikk < (ekstra === 0 ? 7 : 2)) return;
    regelKlikk = 0;
    const li = document.createElement("li");
    li.className = "ny synlig";
    li.innerHTML = `<span class="nr">${8 + ekstra}</span> `;
    li.append(EKSTRA[ekstra]);
    regler.append(li);
    ekstra++;
    S.lyd("plopp");
    if (ekstra === 1) S.merke("regel8");
  });

  // ---------------- Flere sitater ----------------
  const SITATER = [
    ["Fem stjerner. Ville gitt seks, men han lånte den sjette.", "Anmelder i Bergen"],
    ["Han kom for å låne en drill. Det var i 2014.", "Naboen"],
    ["Jeg ba ham ta ut søpla. Nå bor det fluer der.", "Samboer, fortsatt optimist"],
    ["Jeg forstår ikke helt hva dette er, men jeg kjenner meg igjen.", "Mamma"],
    ["Han svarte på meldingen min. Tre uker senere. Med en tommel.", "Venn, antar vi"],
    ["Jeg kalte ham lat. Han sa han var energieffektiv.", "Klimarådgiver"],
    ["Sofaen har formet seg etter ham. Han har ikke formet seg etter noe.", "Møbelekspert"],
    ["Han tilbød seg å hjelpe med flyttingen. Han tok med chips.", "Tidligere samboer"],
    ["Beste gjesten vi har hatt. Han er fortsatt her.", "Vertskap på Voss"],
    ["Han lovet å komme tidlig. Han kom tidlig. Dagen etter.", "Brudgom"],
    ["Jeg ba ham gjøre noe nyttig. Han tok en lur. Det var faktisk det nyttigste i hele uka.", "Psykolog"],
    ["Han heter ikke Kjell, men alle kaller ham Kjell. Han har ikke giddet å rette det.", "Kjell"],
    ["Ti av ti ville ligget her igjen.", "Sofaen"],
    ["Han løper ikke maraton. Han ser maraton. Hele.", "Treneren hans (tidligere)"],
  ];
  let sitatStart = 4;
  $(".flere").addEventListener("click", () => {
    const boks = $(".sitater");
    boks.innerHTML = "";
    for (let i = 0; i < 4; i++) {
      const [tekst, hvem] = SITATER[(sitatStart + i) % SITATER.length];
      const bq = document.createElement("blockquote");
      const p = document.createElement("p"), c = document.createElement("cite");
      p.textContent = `«${tekst}»`; c.textContent = hvem;
      bq.append(p, c);
      boks.append(bq);
    }
    sitatStart = (sitatStart + 4) % SITATER.length;
    S.lyd("plopp");
  });

  // ---------------- Diplomet ----------------
  const esc = (t) => t.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const dato = new Date().toLocaleDateString("nb-NO", { day: "numeric", month: "long", year: "numeric" });
  function diplomSvg(navn) {
    const n = esc(navn.trim() || "Ukjent slabbedask");
    const str = n.length > 22 ? Math.max(26, 54 - (n.length - 22) * 1.4) : 54;
    return `<svg class="diplom-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 560" role="img" aria-label="Diplom for ${n}">
      <rect width="800" height="560" fill="#fffbea"/>
      <rect x="18" y="18" width="764" height="524" rx="18" fill="none" stroke="#1f2328" stroke-width="6"/>
      <rect x="34" y="34" width="732" height="492" rx="10" fill="none" stroke="#eab308" stroke-width="3" stroke-dasharray="14 8"/>
      <g font-family="Georgia, 'Times New Roman', serif" fill="#1f2328" text-anchor="middle">
        <text x="400" y="118" font-size="64" font-weight="700" letter-spacing="10">DIPLOM</text>
        <text x="400" y="170" font-size="22" font-style="italic">Det bekreftes herved at</text>
        <text x="400" y="246" font-size="${str.toFixed(0)}" font-weight="700">${n}</text>
        <path d="M170 266 H630" stroke="#1f2328" stroke-width="2"/>
        <text x="400" y="306" font-size="22" font-style="italic">er en offisielt godkjent</text>
        <text x="400" y="360" font-size="46" font-weight="700" fill="#ca8a04" stroke="#1f2328" stroke-width="1.5" letter-spacing="4">SLABBEDASK</text>
        <text x="400" y="400" font-size="18">med full rett til å ligge på sofaen, låne penner som aldri leveres tilbake</text>
        <text x="400" y="424" font-size="18">og si «bare én til» så mange ganger det måtte være.</text>
        <text x="200" y="490" font-size="16">${esc(dato)}</text>
        <path d="M120 470 H280" stroke="#1f2328" stroke-width="1.5"/>
        <text x="600" y="490" font-size="16">Sofaen, styreleder</text>
        <path d="M530 466 q15 -30 30 -4 q12 18 26 -10 q10 -20 20 2 q8 14 22 -6 q10 -12 22 4" fill="none" stroke="#1f2328" stroke-width="2"/>
      </g>
      <g transform="translate(400 482)">
        <circle r="40" fill="#facc15" stroke="#1f2328" stroke-width="4"/>
        <circle r="31" fill="none" stroke="#1f2328" stroke-width="1.5" stroke-dasharray="3 4"/>
        <g stroke="#1f2328" stroke-width="2.5" stroke-linejoin="round">
          <rect x="-20" y="-10" width="40" height="14" rx="5" fill="#fcd94d"/>
          <rect x="-26" y="-4" width="10" height="20" rx="4" fill="#fcd94d"/>
          <rect x="16" y="-4" width="10" height="20" rx="4" fill="#fcd94d"/>
          <rect x="-18" y="4" width="36" height="10" rx="3" fill="#eab308"/>
        </g>
      </g>
    </svg>`;
  }
  const dlg = document.createElement("dialog");
  dlg.className = "slabbe-dialog";
  dlg.setAttribute("aria-label", "Diplom");
  dlg.innerHTML = `
    <button class="lukk" type="button" aria-label="Lukk">×</button>
    <div class="innhold">
      <h2>Diplomet ditt</h2>
      <p style="margin:0;color:var(--muted)">Lå under sofaputen. Litt chipssmuler på, men gyldig.</p>
      <div class="diplom-skjema">
        <input type="text" maxlength="40" placeholder="Navnet ditt" aria-label="Navnet ditt">
      </div>
      <div class="diplom-vis"></div>
      <div class="smaa-knapper">
        <button class="knapp last-ned" type="button">Last ned</button>
        <button class="knapp nei skriv-ut" type="button">Skriv ut</button>
      </div>
    </div>`;
  document.body.append(dlg);
  const navnFelt = dlg.querySelector("input"), vis = dlg.querySelector(".diplom-vis");
  navnFelt.value = S.les("slabbe-navn", "");
  const tegn = () => { vis.innerHTML = diplomSvg(navnFelt.value); };
  navnFelt.addEventListener("input", () => { S.skriv("slabbe-navn", navnFelt.value); tegn(); });
  dlg.querySelector(".lukk").addEventListener("click", () => dlg.close());
  dlg.addEventListener("click", (e) => { if (e.target === dlg) dlg.close(); });
  function aapneDiplom() {
    tegn();
    dlg.showModal();
    S.merke("diplom");
    S.regn("alt", 24);
  }
  $(".diplom-knapp").addEventListener("click", aapneDiplom);
  if (location.hash === "#diplom") setTimeout(aapneDiplom, 400);

  dlg.querySelector(".last-ned").addEventListener("click", () => {
    const svg = vis.querySelector("svg").outerHTML;
    const img = new Image();
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = 1600; c.height = 1120;
      c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
      c.toBlob((b) => {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(b);
        a.download = "slabbedask-diplom.png";
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 2000);
      });
    };
    img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  });
  dlg.querySelector(".skriv-ut").addEventListener("click", () => {
    const ark = document.createElement("div");
    ark.className = "diplom-print";
    ark.innerHTML = diplomSvg(navnFelt.value);
    document.body.append(ark);
    dlg.close();
    document.documentElement.classList.add("skriv-diplom");
    print();
    document.documentElement.classList.remove("skriv-diplom");
    ark.remove();
  });

  // ---------------- Baksiden ----------------
  $(".snu").addEventListener("click", (e) => { e.preventDefault(); S.snuTil("/bakside.html"); });

  // ---------------- Slabbedasken i bakgrunnen ----------------
  // scene.js stopper klikket når det har gjort sitt, så vi lytter før det (capture)
  let vekket = 0, fluer = 0;
  document.addEventListener("click", (e) => {
    const t = e.target;
    if (!t.closest) return;
    if (t.closest("#person") && ++vekket === 10) S.merke("vekkerklokke");
    const flue = t.closest(".fly-wrap");
    if (flue && !flue.dataset.dead && ++fluer === 5) S.merke("fluesmekker");
  }, true);

  // Han faller ut av sofaen tre ganger
  let paaToppen = true, fall = 0;
  addEventListener("scroll", () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    const p = max > 0 ? scrollY / max : 0;
    if (p < 0.1) paaToppen = true;
    else if (p > 0.75 && paaToppen) {
      paaToppen = false;
      if (++fall === 3) S.merke("stuntmann");
    }
  }, { passive: true });

  // ---------------- Konami: alt faller ut av sofaen ----------------
  const KONAMI = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];
  let k = 0, faller = false;
  addEventListener("keydown", (e) => {
    const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    k = key === KONAMI[k] ? k + 1 : key === KONAMI[0] ? 1 : 0;
    if (k === KONAMI.length) { k = 0; tyngdekraft(); }
  });
  function tyngdekraft() {
    if (faller) return;
    faller = true;
    S.merke("konami");
    const deler = $$("header, .lapp, footer");
    deler.forEach((d) => {
      const r = d.getBoundingClientRect();
      if (r.bottom < 0 || r.top > innerHeight) return;
      const ned = Math.max(0, innerHeight - r.bottom - Math.random() * 30);
      d.classList.add("tyngde");
      d.dataset.foer = d.style.transform;
      d.style.transform = `translateY(${ned}px) rotate(${(Math.random() - 0.5) * 30}deg)`;
    });
    setTimeout(() => { S.lyd("dunk"); S.melding("Alt falt ut av sofaen!", "Det ordner seg. Kanskje."); }, 850);
    setTimeout(() => {
      deler.forEach((d) => { d.classList.add("tilbake"); d.style.transform = d.dataset.foer || ""; });
      setTimeout(() => { deler.forEach((d) => d.classList.remove("tyngde", "tilbake")); faller = false; }, 800);
    }, 3200);
  }

  // ---------------- Kjente slabbedasker: piler og myke kanter ----------------
  const rad = $(".rad"), venstre = $(".pil.venstre"), hoyre = $(".pil.hoyre");
  const kanter = () => {
    const slutt = rad.scrollLeft + rad.clientWidth >= rad.scrollWidth - 4;
    rad.classList.toggle("ikke-start", rad.scrollLeft > 4);
    rad.classList.toggle("slutt", slutt);
    venstre.disabled = rad.scrollLeft <= 4;
    hoyre.disabled = slutt;
  };
  const bla = (retning) => rad.scrollBy({ left: retning * 212, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  venstre.addEventListener("click", () => bla(-1));
  hoyre.addEventListener("click", () => bla(1));
  rad.addEventListener("scroll", kanter, { passive: true });
  addEventListener("resize", kanter);
  kanter();

  // ---------------- Footer: opp igjen og del ----------------
  $(".opp").addEventListener("click", () => {
    scrollTo({ top: 0, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    S.melding("Opp i sofaen!", "Han klatrer. Sakte.");
  });
  $(".del").addEventListener("click", async () => {
    const data = { title: "Slabbedask", text: "Velkommen din forbanna slabbedask!", url: "https://slabbedask.no/" };
    if (navigator.share) {
      try { await navigator.share(data); } catch {} // avbrutt er også greit
      return;
    }
    try {
      await navigator.clipboard.writeText(data.url);
      S.melding("Lenka er kopiert!", "Lim den inn hos en slabbedask du kjenner.");
    } catch {
      S.melding("slabbedask.no", "Fikk ikke kopiert. Du får si det høyt.");
    }
  });

  // ---------------- Hemmelige ord ----------------
  const hemmelig = (fn) => () => { fn(); S.merke("hemmelig"); };
  S.ord("øl", hemmelig(() => { S.regn("øl", 30); S.lyd("pssht"); S.melding("Skål!", "Noen må rydde dette. Ikke vi."); }));
  S.ord("chips", hemmelig(() => { S.regn("chips", 40); S.lyd("knas"); }));
  S.ord("pizza", hemmelig(() => { S.regn("pizza", 30); S.melding("Pizza!", "Hvem betaler? Ikke han."); }));
  S.ord("sokk", hemmelig(() => { S.regn("sokk", 24); S.melding("Sokker!", "Ingen av dem er et par."); }));
  S.ord("penger", hemmelig(() => { S.regn("mynt", 30); S.lyd("mynt"); S.melding("Sofapenger!", "Mer der det kom fra. Bak sofaen."); }));
  S.ord("rap", hemmelig(() => { S.lyd("rap"); S.melding("RAAAAP!", "Unnskyld. Nei forresten."); }));
  S.ord("slabbedask", hemmelig(() => { S.regn("alt", 60); S.melding("Det er deg!", "Du skrev ditt eget navn."); }));
  S.ord("bakside", hemmelig(() => S.snuTil("/bakside.html")));
  S.ord("rydd", hemmelig(() => {
    $$(".lapp").forEach((l) => { l.classList.add("rotete"); l.style.transform = `rotate(${(Math.random() - 0.5) * 6}deg) translateX(${(Math.random() - 0.5) * 30}px)`; });
    S.lyd("feil");
    S.melding("Rydde? Nei.", "Nå ble det verre. Fornøyd?");
  }));
  S.ord("sov", hemmelig(() => {
    if ($(".sover")) return;
    const start = Date.now();
    const s = document.createElement("div");
    s.className = "sover";
    s.innerHTML = "<div><span>Zzz…</span><small>Trykk eller tast for å vekke</small></div>";
    document.body.append(s);
    if (window.slabbeLyd) window.slabbeLyd.play("snork");
    const vekk = () => {
      s.remove();
      removeEventListener("keydown", vekk);
      const sek = Math.round((Date.now() - start) / 1000);
      S.melding("Morn!", sek < 5 ? "Kort lur. Amatør." : `Du sov i ${sek} sekunder. Godt jobba.`);
    };
    s.addEventListener("click", vekk);
    setTimeout(() => addEventListener("keydown", vekk), 50);
  }));
})();
