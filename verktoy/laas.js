#!/usr/bin/env node
// Passordbeskyttelse for slabbedask.no
//
// Nettstedet ligger på GitHub Pages, som ikke har noen server som kan sjekke passord.
// Derfor krypteres hver side i sin helhet (med JavaScript og tegningen bakt inn) med
// passordet, og det som publiseres er bare en innloggingsside med kryptert innhold.
// Kildefilene ligger også kryptert, i verktoy/kilde.json, så de kan hentes fram igjen.
//
//   SLABBE_PASSORD=... node verktoy/laas.js pakk-ut <mappe>   henter kildefilene til <mappe>
//   SLABBE_PASSORD=... node verktoy/laas.js bygg <mappe>      krypterer <mappe> og legger sidene på plass
//
// Passordet gis som miljøvariabel, så det ikke havner i historikken til terminalen.
// Bytter man passord, må alle skrive det inn på nytt.

const { webcrypto: crypto } = require("crypto");
const fs = require("fs");
const path = require("path");

const ROT = path.join(__dirname, "..");
const ARKIV = path.join(__dirname, "kilde.json");
const SIDER = ["index.html", "bakside.html", "kongen.html", "404.html"];
const INNEBYGD = { "/scene.svg": "scene.svg" }; // filer som scriptene henter, og som bakes inn
const BARE_KILDE = ["moro.js", "merker.js", "lyd.js", "scene.js", "scene.svg", "kongen-hallen.html"];
const RUNDER = 310000;

const b64 = (u) => Buffer.from(u).toString("base64");
const fraB64 = (t) => new Uint8Array(Buffer.from(t, "base64"));

async function nokkel(passord, salt) {
  const raa = await crypto.subtle.importKey("raw", new TextEncoder().encode(passord.normalize("NFC")), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey({ name: "PBKDF2", salt, iterations: RUNDER, hash: "SHA-256" }, raa,
    { name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt"]);
}
async function krypter(key, tekst) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const data = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(tekst));
  return { i: b64(iv), d: b64(new Uint8Array(data)) };
}
async function dekrypter(key, { i, d }) {
  return new TextDecoder().decode(await crypto.subtle.decrypt({ name: "AES-GCM", iv: fraB64(i) }, key, fraB64(d)));
}

// Baker inn lokale script og filer, så hele siden er én tekst som kan krypteres
function bakInn(html, kilde) {
  const les = (f) => fs.readFileSync(path.join(kilde, f), "utf8");
  const trygg = (t) => t.replace(/<\/script/gi, "<\\/script");
  let filer = "";
  if (html.includes('src="/scene.js"')) {
    const innhold = {};
    for (const [url, fil] of Object.entries(INNEBYGD)) innhold[url] = les(fil);
    filer = `<script>window.slabbeFiler = ${trygg(JSON.stringify(innhold))};</script>\n  `;
  }
  let forste = true;
  return html.replace(/<script src="\/([\w.-]+\.js)" defer><\/script>/g, (_, fil) => {
    const ut = (forste ? filer : "") + `<script>\n${trygg(les(fil))}\n</script>`;
    forste = false;
    return ut;
  });
}

// Det som er åpent i <head>: tittel, ikoner og forhåndsvisning når lenka deles
function aapentHode(html) {
  const hode = html.match(/<head>([\s\S]*?)<\/head>/)[1];
  return (hode.match(/<title>[\s\S]*?<\/title>|<meta (?!charset|name="viewport")[^>]*>|<link rel="(?:icon|apple-touch-icon)"[^>]*>/g) || [])
    .map((l) => "  " + l).join("\n");
}

function innlogging(hode, salt, pakke) {
  return `<!DOCTYPE html>
<html lang="no">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
${hode}
  <meta name="robots" content="noindex, nofollow">
  <style>
    :root { --bg: #fafaf7; --text: #1f2328; --muted: #5c6370; --border: #e5e7eb; --kort: #fff; --accent: #2563eb; }
    @media (prefers-color-scheme: dark) { :root { --bg: #0f1115; --text: #e6e8eb; --muted: #9aa1ab; --border: #262a33; --kort: #181b21; --accent: #60a5fa; } }
    * { box-sizing: border-box; }
    body { margin: 0; min-height: 100vh; min-height: 100svh; display: grid; place-items: center; padding: 24px 16px;
      font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; background: var(--bg); color: var(--text); line-height: 1.6; }
    .venter main { visibility: hidden; }
    main { width: min(380px, 100%); text-align: center; }
    svg { width: 88px; height: 88px; display: block; margin: 0 auto 12px; }
    h1 { margin: 0; font-size: 1.9rem; line-height: 1.1; font-weight: 900; }
    p { margin: 8px 0 0; color: var(--muted); }
    form { display: flex; flex-direction: column; gap: 10px; margin-top: 22px; }
    input { font: inherit; font-size: 1.05rem; padding: 12px 16px; border-radius: 14px; border: 2px solid var(--border);
      background: var(--kort); color: var(--text); text-align: center; }
    input:focus { outline: 2px solid var(--accent); outline-offset: 1px; }
    button { font: inherit; font-weight: 800; cursor: pointer; padding: 12px 22px; border-radius: 999px;
      border: 2px solid #1f2328; background: #facc15; color: #1f2328; }
    button:hover { background: #eab308; }
    button:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
    button:disabled { opacity: .6; cursor: progress; }
    .svar { min-height: 1.6em; font-weight: 600; }
    .svar.feil { color: #d64545; }
    .riste { animation: riste .4s ease-in-out; }
    @keyframes riste { 25%, 75% { transform: translateX(-8px); } 50% { transform: translateX(8px); } }
    @media (prefers-reduced-motion: reduce) { .riste { animation: none; } }
  </style>
</head>
<body class="venter">
  <main>
    <svg viewBox="0 0 64 64" style="overflow: visible" aria-hidden="true"><defs><clipPath id="ramme"><rect width="64" height="64" rx="15"/></clipPath><radialGradient id="hud" cx=".4" cy=".35" r=".75"><stop offset="0" stop-color="#f7d3b6"/><stop offset=".65" stop-color="#edb894"/><stop offset="1" stop-color="#d79a78"/></radialGradient></defs><rect width="64" height="64" rx="15" fill="#1f2328"/><g clip-path="url(#ramme)"><path d="M45.5 9.5 h6 l-6 6.5 h6" fill="none" stroke="#facc15" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M53.5 4 h3.6 l-3.6 4 h3.6" fill="none" stroke="#facc15" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><g transform="rotate(-9 32 36)"><ellipse cx="16.5" cy="35" rx="3.2" ry="4.2" fill="#e8ad8a" stroke="#1f2328" stroke-width="1.6"/><ellipse cx="47.5" cy="35" rx="3.2" ry="4.2" fill="#e8ad8a" stroke="#1f2328" stroke-width="1.6"/><path d="M17 33 C17 20 24 14 32 14 C40 14 47 20 47 33 C47 44 41 51 32 51 C23 51 17 44 17 33 Z" fill="url(#hud)" stroke="#1f2328" stroke-width="1.8"/><path d="M18.5 38 C20 46 25 50.5 32 50.5 C39 50.5 44 46 45.5 38 C42 42 38 43 35 41.5 Q32 43.5 29 41.5 C26 43 22 42 18.5 38 Z" fill="#5b4a3f" opacity=".34"/><path d="M16.6 31 C15.5 19 23 12 32 12 C41 12 48.5 19 47.4 31 C45.5 25 42 22.5 38.5 23.5 C35.5 20.5 30 21 27 23.5 C23 22 19 25 16.6 31 Z" fill="#4b3a2d" stroke="#1f2328" stroke-width="1.5" stroke-linejoin="round"/><path d="M30.5 12.5 C28 7.5 31.5 4.5 35 5.5 C32.5 6.5 32.5 9.5 34.5 11.5 Z" fill="#4b3a2d" stroke="#1f2328" stroke-width="1.3" stroke-linejoin="round"/><path d="M22 20 q5 -5 11 -5 M36 15.5 q5 1 8 5" fill="none" stroke="#7a604c" stroke-width="1.1" stroke-linecap="round"/><path d="M21.5 28 q4.5 -3.4 9 -1.6 l-.4 1.6 q-4 -1 -8 1.2 z M33.5 26.4 q4.5 -1.8 9 1.6 l-.6 1.2 q-4 -2.2 -8 -1.2 z" fill="#3d3029"/><ellipse cx="26" cy="32.5" rx="3.8" ry="2.6" fill="#fbf7f0"/><ellipse cx="38" cy="32.5" rx="3.8" ry="2.6" fill="#fbf7f0"/><circle cx="26.5" cy="33.8" r="1.7" fill="#1f2328"/><circle cx="38.5" cy="33.8" r="1.7" fill="#1f2328"/><path d="M21.8 33.3 Q26 31.6 30.2 33.3 V29 H21.8 Z M33.8 33.3 Q38 31.6 42.2 33.3 V29 H33.8 Z" fill="#e9b391"/><path d="M22 33.3 Q26 31.7 30 33.3 M34 33.3 Q38 31.7 42 33.3" fill="none" stroke="#1f2328" stroke-width="1.6" stroke-linecap="round"/><path d="M23 36.4 q3 1.4 6 0 M35 36.4 q3 1.4 6 0" fill="none" stroke="#c98a68" stroke-width=".9" stroke-linecap="round" opacity=".8"/><ellipse cx="21.5" cy="38" rx="3" ry="2" fill="#e8907a" opacity=".45"/><ellipse cx="42.5" cy="38" rx="3" ry="2" fill="#e8907a" opacity=".45"/><ellipse cx="32" cy="38" rx="3.6" ry="3" fill="#e3917d" stroke="#1f2328" stroke-width="1.2"/><ellipse cx="33" cy="37" rx="1.1" ry=".7" fill="#fff" opacity=".6"/><path d="M26.5 43.2 Q32 46.6 37.5 42.6" fill="none" stroke="#1f2328" stroke-width="1.7" stroke-linecap="round"/><path d="M37 43.4 q1.6 3.6 .2 5.4 q-1.8 -.8 -1.1 -4.6z" fill="#bfe3f5"/></g><path d="M-2 47 Q8 40 17 46.5 Q24 51.5 32 51.5 Q40 51.5 47 46.5 Q56 40 66 47 V66 H-2 Z" fill="#facc15" stroke="#1f2328" stroke-width="1.8" stroke-linejoin="round"/><path d="M17 47.5 Q24 53 32 53 Q40 53 47 47.5" fill="none" stroke="#ca8a04" stroke-width="1.6" stroke-linecap="round"/><path d="M4 56 h56" stroke="#eab308" stroke-width="2"/></g><rect x=".75" y=".75" width="62.5" height="62.5" rx="14.25" fill="none" stroke="#4a5160" stroke-width="1.5"/><g transform="translate(52 52)"><circle r="11" fill="#e6e8eb" stroke="#1f2328" stroke-width="2.2"/><path d="M-3.6 -1.5 v-2.6 a3.6 3.6 0 0 1 7.2 0 v2.6" fill="none" stroke="#1f2328" stroke-width="2.2"/><rect x="-5.6" y="-1.8" width="11.2" height="8.4" rx="2" fill="#1f2328"/></g></svg>
    <h1>Privat sofa</h1>
    <p>Denne siden er bare for de som kan passordet.</p>
    <form>
      <input type="password" name="passord" placeholder="Passord" aria-label="Passord" autocomplete="current-password" required>
      <button type="submit">Kom inn</button>
    </form>
    <p class="svar" role="status" aria-live="polite"></p>
  </main>
  <script>
  (() => {
    const SALT = "${b64(salt)}", RUNDER = ${RUNDER}, PAKKE = ${JSON.stringify(pakke)};
    const LAGER = "slabbe-tilgang";
    const fraB64 = (t) => Uint8Array.from(atob(t), (c) => c.charCodeAt(0));
    const tilB64 = (u) => btoa(String.fromCharCode(...new Uint8Array(u)));
    const form = document.querySelector("form"), svar = document.querySelector(".svar"), knapp = form.querySelector("button");
    const vis = () => { document.body.classList.remove("venter"); form.passord.focus(); };

    // Bytter ut hele dokumentet med den dekrypterte siden. Det må vente til innloggingssiden
    // er ferdig lest inn, ellers blir innholdet skrevet inn i den i stedet for å erstatte den.
    const ferdig = new Promise((ok) => document.readyState === "loading"
      ? addEventListener("DOMContentLoaded", () => setTimeout(ok), { once: true }) : ok());
    async function skriv(html) {
      await ferdig;
      document.open(); document.write(html); document.close();
    }
    async function aapne(key) {
      await skriv(new TextDecoder().decode(await crypto.subtle.decrypt({ name: "AES-GCM", iv: fraB64(PAKKE.i) }, key, fraB64(PAKKE.d))));
    }

    if (!window.crypto || !crypto.subtle) {
      svar.textContent = "Nettleseren din kan ikke åpne denne siden. Prøv en nyere nettleser.";
      return vis();
    }

    // Husker deg fra sist (nøkkelen, ikke passordet)
    let lagret = null;
    try { lagret = localStorage.getItem(LAGER); } catch {}
    (lagret
      ? crypto.subtle.importKey("raw", fraB64(lagret), "AES-GCM", false, ["decrypt"]).then(aapne)
      : Promise.reject()
    ).catch(() => { try { localStorage.removeItem(LAGER); } catch {} vis(); });

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      knapp.disabled = true; svar.className = "svar"; svar.textContent = "Sjekker…";
      try {
        const raa = await crypto.subtle.importKey("raw", new TextEncoder().encode(form.passord.value.normalize("NFC")), "PBKDF2", false, ["deriveKey"]);
        const key = await crypto.subtle.deriveKey({ name: "PBKDF2", salt: fraB64(SALT), iterations: RUNDER, hash: "SHA-256" }, raa,
          { name: "AES-GCM", length: 256 }, true, ["decrypt"]);
        const html = new TextDecoder().decode(await crypto.subtle.decrypt({ name: "AES-GCM", iv: fraB64(PAKKE.i) }, key, fraB64(PAKKE.d)));
        try { localStorage.setItem(LAGER, tilB64(await crypto.subtle.exportKey("raw", key))); } catch {}
        await skriv(html);
      } catch {
        knapp.disabled = false;
        svar.className = "svar feil"; svar.textContent = "Feil passord.";
        form.classList.remove("riste"); void form.offsetWidth; form.classList.add("riste");
        form.passord.select();
      }
    });
  })();
  </script>
</body>
</html>
`;
}

async function main() {
  const [kommando, mappe] = process.argv.slice(2);
  const passord = process.env.SLABBE_PASSORD;
  if (!passord || !["bygg", "pakk-ut"].includes(kommando) || !mappe) {
    console.error("Bruk: SLABBE_PASSORD=... node verktoy/laas.js bygg|pakk-ut <mappe>");
    process.exit(1);
  }
  const arkiv = fs.existsSync(ARKIV) ? JSON.parse(fs.readFileSync(ARKIV, "utf8")) : null;

  if (kommando === "pakk-ut") {
    if (!arkiv) throw new Error("fant ikke " + ARKIV);
    const key = await nokkel(passord, fraB64(arkiv.salt));
    let filer;
    try { filer = JSON.parse(await dekrypter(key, arkiv.filer)); }
    catch { console.error("Feil passord."); process.exit(1); }
    fs.mkdirSync(mappe, { recursive: true });
    for (const [navn, innhold] of Object.entries(filer)) fs.writeFileSync(path.join(mappe, navn), innhold);
    console.log(`Pakket ut ${Object.keys(filer).length} filer til ${mappe}`);
    return;
  }

  // bygg: samme salt som før, så de som allerede er logget inn slipper å skrive passordet igjen
  const salt = arkiv ? fraB64(arkiv.salt) : crypto.getRandomValues(new Uint8Array(16));
  const key = await nokkel(passord, salt);
  if (arkiv) {
    try { await dekrypter(key, arkiv.filer); }
    catch { console.error("Passordet åpner ikke det gamle arkivet. Slett verktoy/kilde.json hvis du vil bytte passord."); process.exit(1); }
  }
  const kilder = {};
  for (const f of [...SIDER, ...BARE_KILDE]) {
    const p = path.join(mappe, f);
    if (fs.existsSync(p)) kilder[f] = fs.readFileSync(p, "utf8");
  }
  for (const side of SIDER) {
    const html = kilder[side];
    const pakke = await krypter(key, bakInn(html, mappe));
    fs.writeFileSync(path.join(ROT, side), innlogging(aapentHode(html), salt, pakke));
  }
  fs.writeFileSync(ARKIV, JSON.stringify({ salt: b64(salt), runder: RUNDER, filer: await krypter(key, JSON.stringify(kilder)) }) + "\n");
  console.log(`Låste ${SIDER.length} sider og lagret ${Object.keys(kilder).length} kildefiler kryptert`);
}
main().catch((e) => { console.error(e); process.exit(1); });
