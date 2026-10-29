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
    <svg viewBox="0 0 64 64" aria-hidden="true"><rect width="64" height="64" rx="15" fill="#1f2328"/><rect x="10" y="24" width="44" height="17" rx="6" fill="#facc15"/><rect x="3" y="31" width="11" height="22" rx="5" fill="#facc15"/><rect x="50" y="31" width="11" height="22" rx="5" fill="#facc15"/><rect x="10" y="40" width="44" height="13" rx="3" fill="#facc15"/><rect x="8" y="52" width="4" height="6" rx="1.5" fill="#facc15"/><rect x="52" y="52" width="4" height="6" rx="1.5" fill="#facc15"/><rect x="26" y="10" width="12" height="11" rx="2" fill="#e6e8eb"/><path d="M28 10 v-3 a4 4 0 0 1 8 0 v3" fill="none" stroke="#e6e8eb" stroke-width="2.4"/></svg>
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
