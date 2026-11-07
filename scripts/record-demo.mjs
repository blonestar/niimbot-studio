// Records the README demo (docs/demo.gif) and screenshots (docs/screenshot-*.png).
// It drives the real app like a user would. It connects to a real D110 and prints one label.
//
//   npm run build
//   echo '{"locale":"en","profileId":"niimbot-d110"}' > /tmp/demo-profile/settings.json
//   ./node_modules/electron/dist/electron . --user-data-dir=/tmp/demo-profile --remote-debugging-port=9334
//   node scripts/record-demo.mjs /tmp/demo-out
//   cd /tmp/demo-out && ffmpeg -f concat -safe 0 -i frames.txt -vf "setpts=PTS/1.5,fps=12,scale=960:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=128:stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=4:diff_mode=rectangle" -loop 0 demo.gif
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const OUT = process.argv[2];
mkdirSync(join(OUT, "frames"), { recursive: true });
const W = 1280, H = 960;

const page = (await (await fetch("http://127.0.0.1:9334/json")).json()).find((t) => t.type === "page");
const ws = new WebSocket(page.webSocketDebuggerUrl);
let nextId = 0;
const pending = new Map();
const frames = [];
let recording = false;
ws.onmessage = (m) => {
  const d = JSON.parse(m.data);
  if (d.id && pending.has(d.id)) return pending.get(d.id)(d);
  if (d.method === "Page.screencastFrame") {
    const { data, metadata, sessionId } = d.params;
    if (recording) frames.push({ t: metadata.timestamp, data });
    send("Page.screencastFrameAck", { sessionId });
  }
};
await new Promise((r) => (ws.onopen = r));
function send(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = ++nextId;
    pending.set(id, (d) => (d.error ? reject(new Error(`${method}: ${d.error.message}`)) : resolve(d.result)));
    ws.send(JSON.stringify({ id, method, params }));
  });
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function ev(expression) {
  const r = await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true, userGesture: true });
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description ?? "eval failed");
  return r.result.value;
}

await send("Emulation.setDeviceMetricsOverride", { width: W, height: H, deviceScaleFactor: 1, mobile: false });
await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-color-scheme", value: "dark" }] });
await sleep(400);

const helpers = `
window.__q = (sel, i = 0) => document.querySelectorAll(sel)[i];
window.__rect = (sel, i = 0) => { const r = __q(sel, i).getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; };
window.__byText = (sel, text) => [...document.querySelectorAll(sel)].find((e) => e.textContent.trim() === text);
window.__rectText = (sel, text) => { const r = __byText(sel, text).getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; };
window.__setValue = (el, v) => {
  const proto = el instanceof HTMLSelectElement ? HTMLSelectElement.prototype : el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(proto, "value").set.call(el, v);
  el.dispatchEvent(new Event(el instanceof HTMLSelectElement ? "change" : "input", { bubbles: true }));
};
if (!document.getElementById("demo-cursor")) {
  const c = document.createElement("div");
  c.id = "demo-cursor";
  c.innerHTML = '<svg width="28" height="28" viewBox="0 0 28 28"><path d="M3 2 L3 22 L8.5 16.8 L12.2 25 L15.6 23.5 L12 15.6 L19.5 15.6 Z" fill="#fff" stroke="#111" stroke-width="1.6" stroke-linejoin="round"/></svg>';
  Object.assign(c.style, { position: "fixed", left: "0", top: "0", zIndex: 2147483647, pointerEvents: "none", transform: "translate(640px, 420px)", filter: "drop-shadow(0 2px 3px rgb(0 0 0 / .4))" });
  document.body.appendChild(c);
  const ring = document.createElement("div");
  ring.id = "demo-ring";
  Object.assign(ring.style, { position: "fixed", width: "34px", height: "34px", margin: "-17px 0 0 -17px", borderRadius: "50%", border: "3px solid #3a86ff", zIndex: 2147483646, pointerEvents: "none", opacity: 0, left: 0, top: 0 });
  document.body.appendChild(ring);
}
window.__cursor = (x, y) => { document.getElementById("demo-cursor").style.transform = "translate(" + x + "px," + y + "px)"; };
window.__ring = (x, y) => {
  const r = document.getElementById("demo-ring");
  r.animate([{ left: x + "px", top: y + "px", opacity: .9, transform: "scale(.4)" }, { left: x + "px", top: y + "px", opacity: 0, transform: "scale(1.3)" }], { duration: 450, easing: "ease-out" });
};
`;
const injectHelpers = () => ev(helpers);
await injectHelpers();

let mouse = { x: 640, y: 420 };
let pressed = false;
const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);
async function moveTo(x, y, ms = 550) {
  const from = { ...mouse };
  const steps = Math.max(1, Math.round(ms / 16));
  for (let i = 1; i <= steps; i++) {
    const k = ease(i / steps);
    mouse = { x: from.x + (x - from.x) * k, y: from.y + (y - from.y) * k };
    await send("Input.dispatchMouseEvent", { type: "mouseMoved", x: mouse.x, y: mouse.y, button: pressed ? "left" : "none", buttons: pressed ? 1 : 0 });
    await ev(`__cursor(${mouse.x}, ${mouse.y})`);
    await sleep(8);
  }
}
const center = (r) => ({ x: r.x + r.w / 2, y: r.y + r.h / 2 });
async function down() {
  pressed = true;
  await ev(`__ring(${mouse.x}, ${mouse.y})`);
  await send("Input.dispatchMouseEvent", { type: "mousePressed", x: mouse.x, y: mouse.y, button: "left", buttons: 1, clickCount: 1 });
}
async function up() {
  pressed = false;
  await send("Input.dispatchMouseEvent", { type: "mouseReleased", x: mouse.x, y: mouse.y, button: "left", buttons: 0, clickCount: 1 });
}
async function clickAt(p, ms) {
  await moveTo(p.x, p.y, ms);
  await sleep(120);
  await down();
  await sleep(60);
  await up();
}
const clickSel = async (sel, i = 0, ms) => clickAt(center(await ev(`__rect(${JSON.stringify(sel)}, ${i})`)), ms);
const clickText = async (sel, text, ms) => clickAt(center(await ev(`__rectText(${JSON.stringify(sel)}, ${JSON.stringify(text)})`)), ms);
async function drag(from, to, ms = 900) {
  await moveTo(from.x, from.y);
  await sleep(150);
  await down();
  await sleep(120);
  await moveTo(to.x, to.y, ms);
  await sleep(120);
  await up();
}
async function key(keyName, code, modifiers = 0, text) {
  await send("Input.dispatchKeyEvent", { type: "keyDown", key: keyName, code, modifiers, text, windowsVirtualKeyCode: keyName.length === 1 ? keyName.toUpperCase().charCodeAt(0) : undefined });
  await send("Input.dispatchKeyEvent", { type: "keyUp", key: keyName, code, modifiers });
}
async function type(text, perChar = 70) {
  for (const ch of text) {
    if (ch === "\n") await key("Enter", "Enter", 0, "\r");
    else await send("Input.insertText", { text: ch });
    await sleep(perChar);
  }
}
const selectAll = () => key("a", "KeyA", 2);
async function chooseOption(sel, value, i = 0) {
  await moveTo(...Object.values(center(await ev(`__rect(${JSON.stringify(sel)}, ${i})`))).slice(0, 2));
  await sleep(150);
  await down();
  await up();
  await key("Escape", "Escape");
  await sleep(150);
  await ev(`__setValue(__q(${JSON.stringify(sel)}, ${i}), ${JSON.stringify(value)})`);
}
async function setField(sel, value, i = 0) {
  await clickSel(sel, i);
  await selectAll();
  await type(String(value), 90);
}

const cardRect = (name) =>
  ev(`(() => { const r = [...document.querySelectorAll(".model-card")].find((b) => b.querySelector("strong").textContent === ${JSON.stringify(name)}).getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; })()`);
const elRect = (i) => ev(`__rect(".box", ${i})`);
const labelRect = () => ev(`__rect(".label")`);
/** Point on the label given in millimetres. */
async function mm(x, y) {
  const l = await labelRect();
  return { x: l.x + (x / 40) * l.w, y: l.y + (y / 12) * l.h };
}
async function resizeTo(i, xMm, yMm) {
  const r = await elRect(i);
  await drag({ x: r.x + r.w, y: r.y + r.h }, await mm(xMm, yMm), 800);
}
async function moveBoxTo(i, xMm, yMm) {
  const r = await elRect(i);
  const l = await labelRect();
  const k = l.w / 40;
  await drag(center(r), { x: l.x + xMm * k + r.w / 2, y: l.y + yMm * k + r.h / 2 }, 800);
}
async function prepLabel(text, font, bold = true) {
  await ev(`__setValue(document.getElementById("text-input"), ${JSON.stringify(text)})`);
  await ev(`__setValue(__q(".inspector select"), ${JSON.stringify(font)})`);
  if (!bold) await ev(`__q(".inspector .toggle", 0).click()`);
  await key("s", "KeyS", 2);
  await sleep(300);
  await ev(`__byText("button", "New").click()`);
  await sleep(300);
}

// ---- preparation (not recorded): a few saved labels in the library ----
await ev(`__setValue(__q(".label-size select"), "12x40")`);
await sleep(200);
await prepLabel("FRAGILE", "Red Hat Display");
await prepLabel("Basil", "Comfortaa");
await prepLabel("Router · LAN 1", "Red Hat Text");
await prepLabel("Cinnamon", "URW Gothic");
await ev(`document.activeElement?.blur()`);
await sleep(500);

// ---- recording ----
await send("Page.startScreencast", { format: "png", maxWidth: W, maxHeight: H, everyNthFrame: 1 });
recording = true;
await sleep(800);

// 1. pick the printer model in Settings
await clickSel(".topbar .icon-button");
await sleep(800);
for (const name of ["B1", "D11S", "D110"]) {
  await clickAt(center(await cardRect(name)), 600);
  await sleep(900);
}
await clickSel(".topbar .icon-button");
await sleep(600);

// 2. connect over Bluetooth
await clickText(".printer-status button", "Connect printer");
for (let i = 0; i < 60 && !(await ev(`!!document.querySelector(".device-list button")`)); i++) await sleep(250);
await sleep(500);
await clickAt(center(await ev(`(() => { const r = [...document.querySelectorAll(".device-list button")].find((b) => b.textContent.startsWith("D110")).getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; })()`)));
for (let i = 0; i < 80 && !(await ev(`!!document.querySelector(".dot.ok")`)); i++) await sleep(250);
await sleep(900);

// 3. title in a script font
await clickSel("#text-input");
await selectAll();
await type("Earl Grey", 90);
await sleep(400);
await chooseOption(".inspector select", "URW Bookman");
await sleep(300);
await clickSel(".inspector .toggle", 1);
await sleep(700);
await resizeTo(0, 30, 8.6);
await sleep(600);

// 4. a small subtitle under it
await clickText(".add-buttons button", "+ Text");
await sleep(400);
await clickSel("#text-input");
await selectAll();
await type("LOOSE LEAF TEA · 2026", 55);
await sleep(300);
await clickSel(".inspector .toggle", 0);
await sleep(300);
await resizeTo(1, 30, 3.4);
await sleep(300);
await moveBoxTo(1, 1, 8.6);
await sleep(500);

// 5. a cup on the right
await clickText(".add-buttons button", "+ Text");
await sleep(400);
await clickSel("#text-input");
await selectAll();
await type("☕", 90);
await chooseOption(".inspector select", "Symbola");
await sleep(400);
await resizeTo(2, 9, 11);
await sleep(300);
await moveBoxTo(2, 31, 0.5);
await sleep(900);

// 6. save, then print one label
await clickSel('.doc-controls button[title^="Save"]');
await sleep(1100);
await clickText(".print-panel button", "Print");
for (let i = 0; i < 120 && !(await ev(`!!document.querySelector(".print-panel .ok, .print-panel .error")`)); i++) await sleep(250);
console.log("print result:", await ev(`document.querySelector(".print-panel .ok, .print-panel .error")?.textContent`));
await sleep(2200);
recording = false;
await send("Page.stopScreencast");
// frame list for ffmpeg's concat demuxer
let list = "";
frames.forEach((f, i) => {
  const name = `f${String(i).padStart(5, "0")}.png`;
  writeFileSync(join(OUT, "frames", name), Buffer.from(f.data, "base64"));
  const dur = i + 1 < frames.length ? frames[i + 1].t - f.t : 2;
  list += `file 'frames/${name}'\nduration ${dur.toFixed(3)}\n`;
});
list += `file 'frames/f${String(frames.length - 1).padStart(5, "0")}.png'\n`;
writeFileSync(join(OUT, "frames.txt"), list);

// ---- static screenshots: dark and light ----
await clickSel(".box", 0);
await ev(`document.getElementById("demo-cursor").style.display = "none"`);
await sleep(300);
for (const scheme of ["dark", "light"]) {
  await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-color-scheme", value: scheme }] });
  await sleep(500);
  const { data } = await send("Page.captureScreenshot", { format: "png" });
  writeFileSync(join(OUT, `screenshot-${scheme}.png`), Buffer.from(data, "base64"));
}
await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-color-scheme", value: "dark" }] });
await ev(`document.getElementById("demo-cursor").style.display = ""`);

console.log(`frames=${frames.length} seconds=${(frames.at(-1).t - frames[0].t).toFixed(1)}`);
ws.close();
