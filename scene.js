// Slabbedasken i bakgrunnen.
//  - Ruller ut av sofaen når du blar nedover
//  - Klikk på ham: han raper, klør seg på magen eller sier noe
//  - Når musa er nær, våkner han og følger den med blikket. Klikk for mye, og han blir sur.
//  - Fluene ved søppelsekken kan smekkes
//  - Endrer seg med klokka (natt, morgen, kveld), i desember, 17. mai og utover fredagskvelden
//
// Forhåndsvisning i adressefeltet:
//   ?fall=0.5            hvor langt i fallet (0–1)
//   ?tid=natt            natt | morgen | dag | kveld
//   ?dato=12-24          late som det er en annen dato (MM-DD)
//   ?dag=fredag&time=21  late som det er fredag kl. 21
(() => {
  const host = document.getElementById("scene");
  if (!host) return;

  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const seg = (p, a, b) => clamp((p - a) / (b - a)); // 0→1 mellom a og b
  const lerp = (a, b, t) => a + (b - a) * t;
  const easeIn = (t) => t * t;
  const easeOut = (t) => 1 - (1 - t) * (1 - t);
  const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
  const pick = (list) => list[Math.floor(Math.random() * list.length)];
  const lyd = (navn) => window.slabbeLyd && window.slabbeLyd.play(navn);
  const NS = "http://www.w3.org/2000/svg";

  // ---------------- Tid og stemning ----------------
  const q = new URLSearchParams(location.search);
  const now = new Date();
  const hour = q.has("time") ? Number(q.get("time")) : now.getHours();
  const [month, day] = q.has("dato")
    ? q.get("dato").split("-").map(Number)
    : [now.getMonth() + 1, now.getDate()];
  const fredag = q.has("dag") ? q.get("dag") === "fredag" : now.getDay() === 5;
  const lordagsnatt = !q.has("dag") && now.getDay() === 6 && hour < 6;
  const tid = q.get("tid") ||
    (hour >= 22 || hour < 6 ? "natt" : hour < 10 ? "morgen" : hour >= 18 ? "kveld" : "dag");
  const jul = month === 12;
  const syttende = month === 5 && day === 17;
  // Fredag fra kl. 16: én ekstra boks/pizzaeske per time, helt til natt til lørdag
  const fredagsrot = lordagsnatt ? 9 : fredag && hour >= 16 ? Math.min(9, hour - 15) : 0;
  document.documentElement.dataset.tid = tid;

  // ---------------- Replikker ----------------
  const REPLIKKER = [
    "Ikke nå…", "Jeg hviler øya.", "Kan noen hente en øl til?", "Fem minutter til…",
    "Jeg skal rydde i morgen.", "Har noen sett fjernkontrollen?", "Det var ikke jeg som spiste pizzaen.",
    "Trening? Jeg løfter øl.", "Jeg er ikke lat, jeg sparer energi.", "Er det mer chips?",
  ];
  const PA_GULVET = ["Jeg ligger godt her, egentlig.", "Gulvet er den nye sofaen.", "Ikke hjelp meg opp.", "Hvem flytta sofaen?"];
  const SUR = ["Gi deg!", "Hallo?! Jeg sover!", "Slutt å pirke!", "Seriøst…", "Har du ikke noe bedre å gjøre?"];
  const ekstra = [];
  if (tid === "natt") ekstra.push("Bare én episode til…", "Hva er klokka? Gidder ikke sjekke.");
  if (tid === "morgen") ekstra.push("Er det morgen allerede?", "Jeg har ikke sovet, jeg har hvilt.");
  if (tid === "kveld") ekstra.push("Er det middag snart?");
  if (fredag) ekstra.push("Det er fredag, bror!", "Helg! Ikke at det er noen forskjell.");
  if (jul) ekstra.push("Ho ho… hø.", "Er det ribbe igjen?");
  if (syttende) ekstra.push("Hipp hipp… zzz.", "Gratulerer med dagen!");

  // ---------------- Tidslinje for fallet ----------------
  const T = {
    zzzOut: [0.12, 0.24], // slutter å snorke
    slide: [0.16, 0.38],  // glir mot kanten
    fall: [0.38, 0.6],    // faller
    land: [0.6, 0.72],    // treffer gulvet
    beer: [0.38, 0.66],   // ølen flyr
    puddle: [0.66, 0.9],  // ølen renner ut
    zzzIn: [0.86, 0.96],  // sovner igjen på gulvet
  };
  const PX = 500, PY = 352;            // omdreiningspunkt: der han ligger på setet
  const DROP = 182;                    // hvor langt ned han faller
  const CAN = { x: 413, y: 228 };      // midten av ølboksen
  const CAN_END = { x: 836, y: 538 };

  fetch("/scene.svg")
    .then((r) => r.text())
    .then((markup) => {
      host.innerHTML = markup;
      const svg = host.querySelector("svg");
      const $ = (id) => host.querySelector("#" + id);
      const el = {
        person: $("person"), arm: $("arm"), beer: $("beer"), grip: $("grip"), belly: $("belly"),
        zzz: $("zzz"), puddle: $("puddle"), dunk: $("dunk"), fx: $("fx"),
        sleepy: $("eyes-sleepy"), shock: $("eyes-shock"), awake: $("eyes-awake"),
        mouthS: $("mouth-sleepy"), mouthO: $("mouth-shock"), mouthA: $("mouth-awake"),
        brows: $("brows"), browsAngry: $("brows-angry"), mouthAngry: $("mouth-angry"),
        pupilL: $("pupil-l"), pupilR: $("pupil-r"),
        bubble: $("bubble"), bubbleBox: $("bubble-box"), bubbleText: $("bubble-text"),
      };

      // ---- Tid og stemning ----
      if (tid === "natt") {
        const logo = document.querySelector("h1.logo img");
        if (logo) logo.src = "/logo-natt.svg";
        $("night").style.display = "";
        $("glow").style.display = "none";
        $("bulb-glass").setAttribute("fill", "#a7adb5");
      }
      if (tid === "morgen") {
        $("sun").style.display = "";
        $("eyebags").setAttribute("opacity", 1);
      }
      if (tid === "kveld") {
        $("glow").setAttribute("r", 64);
        $("glow").setAttribute("fill", "#ffd36b");
        $("evening").style.display = "";
      }
      if (jul) { $("xmas").style.display = ""; $("hat").style.display = ""; }
      if (syttende) $("flag").style.display = "";
      host.querySelectorAll("#fredag .ekstra").forEach((g, i) => {
        if (i < fredagsrot) g.style.display = "";
      });

      // ---- Tilstand ----
      let P = 0;               // hvor langt ned på siden (0–1)
      let lastP = null;
      let dropY = 0;           // hvor langt ned kroppen er nå
      let awakeUntil = 0, angryUntil = 0;
      let clicks = [];
      const pupil = { x: 0, y: 0 };

      function mood() {
        if (P > 0.3 && P < 0.8) return "shock";
        const t = performance.now();
        if (t < angryUntil) return "angry";
        if (t < awakeUntil) return "awake";
        return "sleep";
      }

      const show = (node, on) => node.setAttribute("opacity", on ? 1 : 0);
      function renderFace() {
        const m = mood();
        show(el.sleepy, m === "sleep");
        show(el.mouthS, m === "sleep");
        show(el.shock, m === "shock");
        show(el.mouthO, m === "shock");
        show(el.awake, m === "awake" || m === "angry");
        show(el.mouthA, m === "awake");
        show(el.browsAngry, m === "angry");
        show(el.mouthAngry, m === "angry");
        show(el.brows, m !== "angry");
        const pt = `translate(${pupil.x.toFixed(2)} ${pupil.y.toFixed(2)})`;
        el.pupilL.setAttribute("transform", pt);
        el.pupilR.setAttribute("transform", pt);
        const zz = m === "sleep" ? Math.max(1 - seg(P, ...T.zzzOut), seg(P, ...T.zzzIn)) : 0;
        el.zzz.setAttribute("opacity", zz.toFixed(3));
        if (window.slabbeLyd) window.slabbeLyd.setSnore(m === "sleep" && (P < 0.12 || P > 0.86));
      }

      // ---- Fallet ----
      function render(p) {
        P = p;
        const slide = easeInOut(seg(p, ...T.slide));
        const fall = easeIn(seg(p, ...T.fall));
        const land = seg(p, ...T.land);

        dropY = lerp(0, 14, slide) + lerp(0, DROP - 14, fall);
        const rot = lerp(0, -5, slide) * (1 - fall);
        let sx = 1, sy = 1;
        if (land > 0 && land < 1) {
          const b = Math.sin(land * Math.PI);
          sx = 1 + 0.06 * b;
          sy = 1 - 0.08 * b;
        }
        const body = `translate(${PX} ${PY + dropY}) rotate(${rot}) scale(${sx} ${sy}) translate(${-PX} ${-PY})`;
        el.person.setAttribute("transform", body);
        el.grip.setAttribute("transform", body);

        // Armen slenger opp i fallet og legger seg ned etterpå
        const armA = p < T.land[0]
          ? lerp(0, -125, easeOut(seg(p, 0.36, 0.56)))
          : lerp(-125, -78, easeInOut(seg(p, T.land[0], 0.8)));
        el.arm.setAttribute("transform", `rotate(${armA} 330 342)`);

        // Ølboksen følger hånden til han faller, så flyr den i en bue
        if (p < T.beer[0]) {
          el.beer.setAttribute("transform", body);
        } else {
          const t = seg(p, ...T.beer);
          const x = lerp(CAN.x, CAN_END.x, t);
          const y = lerp(CAN.y + 14, CAN_END.y, t) - 210 * Math.sin(Math.PI * t);
          const r = lerp(-5, 450, easeOut(t));
          el.beer.setAttribute("transform", `translate(${x} ${y}) rotate(${r}) translate(${-CAN.x} ${-CAN.y})`);
        }

        const pud = easeOut(seg(p, ...T.puddle));
        el.puddle.setAttribute("transform", `translate(836 556) scale(${pud}) translate(-836 -556)`);

        const dunkIn = easeOut(seg(p, 0.6, 0.64)) * (1 - seg(p, 0.78, 0.86));
        const ds = 0.6 + 0.4 * easeOut(seg(p, 0.6, 0.64));
        el.dunk.setAttribute("opacity", dunkIn.toFixed(3));
        el.dunk.setAttribute("transform", `translate(660 405) scale(${ds}) translate(-660 -405)`);

        // Lyder når han lander, og når han er tilbake i sofaen med en ny øl
        if (lastP !== null) {
          if (lastP < T.land[0] && p >= T.land[0]) lyd("dunk");
          if (lastP > 0.4 && p < 0.15) lyd("pssht");
          if (Math.abs(p - lastP) > 0.02 && p > 0.3 && p < 0.8) hideBubble();
        }
        lastP = p;
        if (el.bubble.getAttribute("opacity") !== "0") placeBubble();
        renderFace();
      }

      // ---- Snakkeboble ----
      let bubbleTimer = null;
      function placeBubble() {
        const w = el.bubbleText.getComputedTextLength() + 32, h = 42, r = 14;
        const x = 290, y = 214 + dropY - h - 14;
        el.bubbleText.setAttribute("x", x + 16);
        el.bubbleText.setAttribute("y", y + 28);
        el.bubbleBox.setAttribute("d",
          `M${x + r} ${y} H${x + w - r} Q${x + w} ${y} ${x + w} ${y + r} V${y + h - r}` +
          ` Q${x + w} ${y + h} ${x + w - r} ${y + h} H${x + 42} L${x + 6} ${y + h + 24} L${x + 24} ${y + h}` +
          ` H${x + r} Q${x} ${y + h} ${x} ${y + h - r} V${y + r} Q${x} ${y} ${x + r} ${y} Z`);
      }
      function say(text, ms = 2800) {
        el.bubbleText.textContent = text;
        placeBubble();
        el.bubble.setAttribute("opacity", 1);
        clearTimeout(bubbleTimer);
        bubbleTimer = setTimeout(hideBubble, ms);
      }
      function hideBubble() { el.bubble.setAttribute("opacity", 0); }

      function jiggle() {
        el.belly.classList.remove("jiggle");
        el.belly.getBoundingClientRect(); // start animasjonen på nytt
        el.belly.classList.add("jiggle");
      }

      // ---- Klikk på ham ----
      function act() {
        const onFloor = P > 0.8;
        const hasBeer = P < 0.3;
        const choices = ["prat", "prat", "rap", "klør"];
        if (hasBeer) choices.push("øl");
        const a = pick(choices);
        if (a === "rap") { say("RAAAP!"); lyd("rap"); jiggle(); }
        else if (a === "klør") { say("*klør seg på magen*"); lyd("klor"); jiggle(); }
        else if (a === "øl") { say("Ahh… en til."); lyd("pssht"); }
        else say(pick(onFloor ? PA_GULVET.concat(ekstra) : REPLIKKER.concat(ekstra, ekstra)));
      }
      el.person.addEventListener("click", (e) => {
        e.stopPropagation();
        const t = performance.now();
        if (mood() === "shock") { say("Aaaaah!", 1200); return; }
        clicks = clicks.filter((c) => t - c < 3000);
        clicks.push(t);
        if (mood() === "angry" || clicks.length >= 4) {
          angryUntil = t + 3500;
          awakeUntil = t + 6000;
          clicks = [];
          say(pick(SUR));
          lyd("grynt");
        } else {
          awakeUntil = Math.max(awakeUntil, t + 5000);
          act();
        }
        renderFace();
      });

      // ---- Øynene følger musa ----
      addEventListener("pointermove", (e) => {
        if (e.pointerType !== "mouse") return;
        const r = el.person.getBoundingClientRect();
        const pad = 140;
        const near = e.clientX > r.left - pad && e.clientX < r.right + pad &&
                     e.clientY > r.top - pad && e.clientY < r.bottom + pad;
        if (near && mood() !== "shock") awakeUntil = Math.max(awakeUntil, performance.now() + 2500);
        const a = el.pupilL.getBoundingClientRect(), b = el.pupilR.getBoundingClientRect();
        const cx = (a.left + a.right + b.left + b.right) / 4, cy = (a.top + a.bottom + b.top + b.bottom) / 4;
        const dx = e.clientX - cx, dy = e.clientY - cy, d = Math.hypot(dx, dy) || 1;
        const k = Math.min(1, d / 120);
        pupil.x = (dx / d) * 3.4 * k;
        pupil.y = clamp((dy / d) * 3.4 * k, -0.4, 2.8);
        renderFace();
      }, { passive: true });
      setInterval(renderFace, 300); // sovner igjen når tiden er ute

      // ---- Smekk flua ----
      const toSvg = (x, y) => {
        const pt = svg.createSVGPoint();
        pt.x = x; pt.y = y;
        return pt.matrixTransform(svg.getScreenCTM().inverse());
      };
      const mk = (tag, attrs = {}) => {
        const n = document.createElementNS(NS, tag);
        for (const k in attrs) n.setAttribute(k, attrs[k]);
        return n;
      };
      host.querySelectorAll(".fly-wrap").forEach((wrap) => {
        wrap.addEventListener("click", (e) => {
          e.stopPropagation();
          if (wrap.dataset.dead) return;
          const r = wrap.querySelector(".fly-body").getBoundingClientRect();
          const pt = toSvg(r.left + r.width / 2, r.top + r.height / 2);
          wrap.dataset.dead = "1";
          wrap.style.visibility = "hidden";
          lyd("smekk");

          const txt = mk("text", {
            x: pt.x, y: pt.y - 14, "text-anchor": "middle", fill: "#fff",
            style: "font: 900 20px Poppins, system-ui, sans-serif; paint-order: stroke; stroke: #1f2328; stroke-width: 5px; stroke-linejoin: round",
          });
          txt.textContent = "SMEKK!";
          const dead = mk("g");
          dead.innerHTML =
            '<ellipse cx="-3" cy="-4" rx="3" ry="4.5" fill="#d6ecff" stroke="#1f2328" stroke-width="1"/>' +
            '<ellipse cx="3" cy="-4" rx="3" ry="4.5" fill="#d6ecff" stroke="#1f2328" stroke-width="1"/>' +
            '<circle r="3.4" fill="#1f2328"/>' +
            '<path d="M-3 3 l-3 4 M0 3.5 v5 M3 3 l3 4" stroke="#1f2328" stroke-width="1.2" stroke-linecap="round"/>';
          el.fx.append(txt, dead);

          const floor = 458, t0 = performance.now();
          (function fallFly(t) {
            const k = seg(t - t0, 0, 700);
            const y = lerp(pt.y, floor, easeIn(k));
            dead.setAttribute("transform", `translate(${pt.x + 10 * k} ${y}) rotate(${180 * k})`);
            txt.setAttribute("opacity", (1 - seg(t - t0, 500, 900)).toFixed(2));
            const fade = 1 - seg(t - t0, 2800, 3400);
            dead.setAttribute("opacity", fade.toFixed(2));
            if (fade > 0) requestAnimationFrame(fallFly); else { dead.remove(); txt.remove(); }
          })(t0);

          setTimeout(() => {            // en ny flue kommer etter en stund
            delete wrap.dataset.dead;
            wrap.style.visibility = "";
          }, 5000 + Math.random() * 3000);
        });
      });

      // ---- Blaing ----
      const forced = q.get("fall");
      const progress = () => {
        if (forced !== null) return clamp(parseFloat(forced) || 0);
        const max = document.documentElement.scrollHeight - innerHeight;
        return max > 0 ? clamp(scrollY / max) : 0;
      };
      let queued = false;
      const update = () => { queued = false; render(progress()); };
      const queue = () => { if (!queued) { queued = true; requestAnimationFrame(update); } };
      addEventListener("scroll", queue, { passive: true });
      addEventListener("resize", queue);
      update();
    })
    .catch(() => {});
})();
