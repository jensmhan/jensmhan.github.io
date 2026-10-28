// Slabbedasken i bakgrunnen: ruller ut av sofaen etter hvert som du blar nedover.
(() => {
  const host = document.getElementById("scene");
  if (!host) return;

  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const seg = (p, a, b) => clamp((p - a) / (b - a)); // 0→1 mellom a og b
  const lerp = (a, b, t) => a + (b - a) * t;
  const easeIn = (t) => t * t;
  const easeOut = (t) => 1 - (1 - t) * (1 - t);
  const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

  // Tidslinje (andel av hvor langt ned på siden du har bladd)
  const T = {
    zzzOut: [0.12, 0.24], // slutter å snorke
    slide: [0.16, 0.38],  // glir mot kanten
    fall: [0.38, 0.6],    // faller
    land: [0.6, 0.72],    // treffer gulvet
    beer: [0.38, 0.66],   // ølen flyr
    puddle: [0.66, 0.9],  // ølen renner ut
    zzzIn: [0.86, 0.96],  // sovner igjen på gulvet
  };

  const PX = 500, PY = 352; // omdreiningspunkt: der han ligger på setet
  const DROP = 182;         // hvor langt ned han faller
  const CAN = { x: 413, y: 228 }; // midten av ølboksen
  const CAN_END = { x: 836, y: 538 };

  fetch("/scene.svg")
    .then((r) => r.text())
    .then((svg) => {
      host.innerHTML = svg;
      const $ = (id) => host.querySelector("#" + id);
      const el = {
        person: $("person"), arm: $("arm"), beer: $("beer"), grip: $("grip"),
        zzz: $("zzz"), sleepy: $("eyes-sleepy"), shock: $("eyes-shock"),
        mouthS: $("mouth-sleepy"), mouthO: $("mouth-shock"),
        puddle: $("puddle"), dunk: $("dunk"),
      };

      function render(p) {
        const slide = easeInOut(seg(p, ...T.slide));
        const fall = easeIn(seg(p, ...T.fall));
        const land = seg(p, ...T.land);

        const ty = lerp(0, 14, slide) + lerp(0, DROP - 14, fall);
        const rot = lerp(0, -5, slide) * (1 - fall);
        let sx = 1, sy = 1;
        if (land > 0 && land < 1) {
          const b = Math.sin(land * Math.PI);
          sx = 1 + 0.06 * b;
          sy = 1 - 0.08 * b;
        }
        const body = `translate(${PX} ${PY + ty}) rotate(${rot}) scale(${sx} ${sy}) translate(${-PX} ${-PY})`;
        el.person.setAttribute("transform", body);
        el.grip.setAttribute("transform", body);

        // Armen slenger opp i fallet og legger seg langs gulvet etterpå
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

        el.zzz.setAttribute("opacity", Math.max(1 - seg(p, ...T.zzzOut), seg(p, ...T.zzzIn)).toFixed(3));
        const scared = p > 0.3 && p < 0.8;
        el.sleepy.setAttribute("opacity", scared ? 0 : 1);
        el.mouthS.setAttribute("opacity", scared ? 0 : 1);
        el.shock.setAttribute("opacity", scared ? 1 : 0);
        el.mouthO.setAttribute("opacity", scared ? 1 : 0);
      }

      // Lar deg forhåndsvise et bestemt punkt: slabbedask.no/?fall=0.5
      const forced = new URLSearchParams(location.search).get("fall");
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
