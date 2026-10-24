var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/main.ts
var main_exports = {};
__export(main_exports, {
  default: () => StoryPlugin
});
module.exports = __toCommonJS(main_exports);
var import_obsidian12 = require("obsidian");

// src/calendar.ts
function toIndex(d) {
  return d.year * 12 + d.month;
}
function fromIndex(i) {
  return { month: (i % 12 + 12) % 12, year: Math.floor(i / 12) };
}
function parseDate(raw) {
  if (raw == null) return null;
  if (typeof raw === "object") {
    const o = raw;
    const year = Number(o.year);
    const month = Number(o.month ?? 0);
    if (!Number.isFinite(year)) return null;
    return { year, month: Number.isFinite(month) ? Math.min(11, Math.max(0, Math.round(month))) : 0 };
  }
  if (typeof raw === "number") return { year: raw, month: 0 };
  return null;
}
var Calendar = class {
  constructor(settings) {
    this.settings = settings;
  }
  get months() {
    return this.settings.months;
  }
  monthName(m) {
    return this.settings.months[(m % 12 + 12) % 12] ?? `M${m + 1}`;
  }
  format(d) {
    const c = typeof d === "number" ? fromIndex(d) : d;
    return `${this.monthName(c.month)} ${c.year}`;
  }
  formatRange(start, end) {
    if (end == null) return this.format(start);
    const n = end - start;
    return `${this.format(start)} \u2192 ${this.format(end)} \xB7 ${n} month${n === 1 ? "" : "s"}`;
  }
  shortRange(start, end) {
    return end == null ? this.format(start) : `${this.format(start)} \u2192 ${this.format(end)}`;
  }
  age(born) {
    return this.settings.currentYear - born.year;
  }
};

// src/canvas.ts
var import_obsidian = require("obsidian");

// src/model.ts
var STAT_KEYS = ["str", "dex", "con", "int", "wis", "cha"];
var STAT_NAMES = {
  str: "Strength",
  dex: "Dexterity",
  con: "Constitution",
  int: "Intellect",
  wis: "Wisdom",
  cha: "Charisma"
};
var STAT_HINTS = {
  str: "Might, carrying",
  dex: "Agility, aim",
  con: "Endurance",
  int: "Reason, memory",
  wis: "Perception, insight",
  cha: "Presence, persuasion"
};
var str = (v) => v == null ? "" : String(v);
var arr = (v) => Array.isArray(v) ? v : v == null || v === "" ? [] : [v];
function parseCharacter(fm, fallbackName) {
  const vitalsRaw = fm.vitals ?? {};
  const vitals = Object.entries(vitalsRaw).map(([name, v]) => {
    const a = Array.isArray(v) ? v : [v, v];
    return { name, cur: Number(a[0]) || 0, max: Number(a[1]) || 0 };
  });
  const statsRaw = fm.stats ?? {};
  const stats = {};
  for (const k of STAT_KEYS) stats[k] = Number(statsRaw[k] ?? statsRaw[k.toUpperCase()]) || 0;
  const descRaw = fm.description ?? {};
  const description = {};
  for (const [group, fields] of Object.entries(descRaw)) {
    description[group] = {};
    if (fields && typeof fields === "object") {
      for (const [k, v] of Object.entries(fields)) {
        if (v && typeof v === "object" && !Array.isArray(v)) {
          const o = v;
          description[group][k] = { text: str(o.text), color: o.color ? str(o.color) : void 0 };
        } else description[group][k] = { text: str(v) };
      }
    }
  }
  return {
    name: str(fm.name) || fallbackName,
    quote: str(fm.quote),
    portrait: str(fm.portrait),
    status: str(fm.status),
    role: str(fm.role),
    ancestry: str(fm.ancestry),
    born: parseDate(fm.born),
    affiliation: str(fm.affiliation),
    faction: str(fm.faction),
    factionTag: str(fm.faction_tag),
    storyRole: str(fm.story_role),
    vitals,
    stats,
    traits: arr(fm.traits).map(str),
    values: arr(fm.values).map(str),
    weaknesses: arr(fm.weaknesses).map(str),
    goals: arr(fm.goals).map(
      (g) => typeof g === "object" && g ? { text: str(g.text), done: !!g.done } : { text: str(g), done: false }
    ),
    relationships: arr(fm.relationships).map((r) => {
      const o = r ?? {};
      return { who: str(o.who), kind: str(o.kind), score: Number(o.score) || 0 };
    }),
    inventory: arr(fm.inventory).map((i) => {
      const o = typeof i === "object" && i ? i : { item: i };
      return { item: str(o.item), tag: str(o.tag), qty: str(o.qty) };
    }),
    description
  };
}
function parseLink(raw) {
  const m = /^\s*!?\[\[([^\]|#]+)(?:#[^\]|]*)?(?:\|([^\]]+))?\]\]\s*$/.exec(raw ?? "");
  if (!m) return { target: null, display: raw ?? "" };
  const target = m[1].trim();
  return { target, display: (m[2] ?? target.split("/").pop() ?? target).trim() };
}
function linkBasename(raw) {
  const { target, display } = parseLink(raw);
  return target ? (target.split("/").pop() ?? target).replace(/\.md$/, "") : display;
}
function initials(name) {
  const parts = name.replace(/[^\p{L}\p{N}\s]/gu, "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "\u2014";
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}
function isCharacter(app, file) {
  if (!file || file.extension !== "md") return false;
  return app.metadataCache.getFileCache(file)?.frontmatter?.type === "character";
}
function parseEvent(file, fm) {
  const s = parseDate(fm["tl-start"]);
  if (!s) return null;
  const e = parseDate(fm["tl-end"]);
  const laneRaw = str(fm.lane) || "World";
  return {
    path: file.path,
    title: str(fm.title) || file.basename,
    start: toIndex(s),
    end: e ? Math.max(toIndex(s) + 1, toIndex(e)) : null,
    lane: linkBasename(laneRaw) || "World",
    location: str(fm.location),
    laneRaw,
    category: str(fm.category)
  };
}
function collectEvents(app) {
  const out = [];
  for (const f of app.vault.getMarkdownFiles()) {
    const fm = app.metadataCache.getFileCache(f)?.frontmatter;
    if (fm?.type !== "event") continue;
    const ev = parseEvent(f, fm);
    if (ev) out.push(ev);
  }
  return out;
}
function safeFileName(name) {
  return name.replace(/[\\/:*?"<>|#^[\]]/g, "").trim();
}
function joinPath(folder, name) {
  const f = folder.replace(/^\/+|\/+$/g, "");
  return f ? `${f}/${name}` : name;
}
async function ensureFolder(app, folder) {
  const f = folder.replace(/^\/+|\/+$/g, "");
  if (!f) return;
  let acc = "";
  for (const part of f.split("/")) {
    acc = acc ? `${acc}/${part}` : part;
    if (!app.vault.getAbstractFileByPath(acc)) await app.vault.createFolder(acc);
  }
}

// src/canvas.ts
var PPM = 22 * 6;
var CARD_W = 360;
var CARD_H = 180;
var AXIS_Y = 0;
var CANVAS_COLOR = {
  red: "1",
  orange: "2",
  yellow: "3",
  green: "4",
  cyan: "5",
  purple: "6",
  blue: "#4f9dff",
  pink: "#fa99cd"
};
function hash(s) {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = (h << 5) + h + s.charCodeAt(i) | 0;
  return (h >>> 0).toString(36);
}
function canvasPath(plugin) {
  const s = plugin.settings;
  return (0, import_obsidian.normalizePath)(joinPath(s.eventsFolder, `${s.timelineName || "Timeline"}.canvas`));
}
async function syncTimelineToCanvas(plugin) {
  const { app, settings } = plugin;
  const events = collectEvents(app).sort((a, b) => a.start - b.start);
  if (!events.length) {
    new import_obsidian.Notice("No event notes found (notes with type: event and tl-start).");
    return null;
  }
  const path = canvasPath(plugin);
  const existingFile = app.vault.getAbstractFileByPath(path);
  let data = { nodes: [], edges: [] };
  if (existingFile instanceof import_obsidian.TFile) {
    try {
      const parsed = JSON.parse(await app.vault.read(existingFile));
      data = { ...parsed, nodes: parsed.nodes ?? [], edges: parsed.edges ?? [] };
    } catch {
      new import_obsidian.Notice(`${path} isn't valid JSON; leaving it alone.`);
      return null;
    }
  }
  const prev = plugin.canvasRecord;
  const origin = Math.floor(events[0].start / 12) * 12;
  const last = Math.max(...events.map((e) => e.end ?? e.start + 1));
  const span = Math.ceil((last + 1) / 12) * 12 - origin;
  const xOf = (m) => (m - origin) * PPM;
  const userNodes = data.nodes.filter((n) => !n.id.startsWith("ct-"));
  const oldById = new Map(data.nodes.map((n) => [n.id, n]));
  const nodes = [];
  const edges = data.edges.filter((e) => !e.id.startsWith("ct-"));
  const record = { origin, events: {} };
  nodes.push({ id: "ct-axis", type: "text", text: "", x: 0, y: AXIS_Y - 4, width: span * PPM, height: 8 });
  for (let y = origin / 12; y <= (origin + span) / 12; y++) {
    nodes.push({ id: `ct-year-${y}`, type: "text", text: `**${y}**`, x: xOf(y * 12) - 40, y: AXIS_Y + 16, width: 80, height: 50 });
  }
  events.forEach((e, i) => {
    const h = hash(e.path);
    const cardId = `ct-ev-${h}`;
    const anchorId = `ct-anchor-${h}`;
    const above = i % 2 === 0;
    const level = Math.floor(i / 2) % 3;
    const old = oldById.get(cardId);
    const prevRec = prev?.events[e.path];
    const dateUnchanged = prevRec && prevRec.start === e.start && prev?.origin === origin;
    const x = old && dateUnchanged ? old.x : xOf(e.start) - CARD_W / 2;
    const y = old ? old.y : above ? AXIS_Y - 120 - CARD_H - level * (CARD_H + 40) : AXIS_Y + 120 + level * (CARD_H + 40);
    const cat = settings.categories.find((c) => c.key === e.category);
    nodes.push({
      id: cardId,
      type: "file",
      file: e.path,
      x,
      y,
      width: old?.width ?? CARD_W,
      height: old?.height ?? CARD_H,
      ...cat ? { color: CANVAS_COLOR[cat.color] } : {}
    });
    nodes.push({ id: anchorId, type: "text", text: "", x: xOf(e.start) - 6, y: AXIS_Y - 6, width: 12, height: 12, ...cat ? { color: CANVAS_COLOR[cat.color] } : {} });
    const cardAbove = y + CARD_H / 2 < AXIS_Y;
    edges.push({ id: `ct-edge-${h}`, fromNode: cardId, fromSide: cardAbove ? "bottom" : "top", toNode: anchorId, toSide: cardAbove ? "top" : "bottom" });
    record.events[e.path] = { start: e.start, x };
  });
  const minX = Math.min(...nodes.map((n) => n.x)) - 80;
  const maxX = Math.max(...nodes.map((n) => n.x + n.width)) + 80;
  const minY = Math.min(...nodes.map((n) => n.y)) - 80;
  const maxY = Math.max(...nodes.map((n) => n.y + n.height)) + 80;
  const y0 = origin / 12;
  const y1 = (origin + span) / 12;
  nodes.unshift({
    id: "ct-group",
    type: "group",
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
    color: "6",
    label: `${settings.timelineName || "Timeline"} \xB7 ${y0}\u2013${y1}${settings.eraAbbr ? " " + settings.eraAbbr : ""}`
  });
  const out = { ...data, nodes: [...nodes, ...userNodes], edges };
  const json = JSON.stringify(out, null, "	");
  plugin.canvasRecord = record;
  await plugin.saveSettings();
  let file;
  if (existingFile instanceof import_obsidian.TFile) {
    await app.vault.modify(existingFile, json);
    file = existingFile;
  } else {
    await ensureFolder(app, settings.eventsFolder);
    file = await app.vault.create(path, json);
  }
  new import_obsidian.Notice(`Timeline synced to ${path} (${events.length} events).`);
  return file;
}
async function reverseSyncFromCanvas(plugin, file) {
  const rec = plugin.canvasRecord;
  if (!rec || file.path !== canvasPath(plugin)) return;
  let data;
  try {
    data = JSON.parse(await plugin.app.vault.read(file));
  } catch {
    return;
  }
  let changed = 0;
  for (const n of data.nodes ?? []) {
    if (n.type !== "file" || !n.id.startsWith("ct-ev-") || !n.file) continue;
    const r = rec.events[n.file];
    if (!r || Math.abs(n.x - r.x) < PPM / 2) continue;
    const delta = Math.round((n.x - r.x) / PPM);
    const ev = plugin.app.vault.getAbstractFileByPath(n.file);
    if (!(ev instanceof import_obsidian.TFile) || delta === 0) continue;
    const newStart = Math.max(0, r.start + delta);
    await plugin.app.fileManager.processFrontMatter(ev, (fm) => {
      const end = fm["tl-end"];
      fm["tl-start"] = fromIndex(newStart);
      if (end && typeof end === "object") {
        const oldEnd = Number(end.year) * 12 + Number(end.month ?? 0);
        fm["tl-end"] = fromIndex(oldEnd + (newStart - r.start));
      }
    });
    rec.events[n.file] = { start: newStart, x: n.x };
    changed++;
  }
  if (changed) {
    await plugin.saveSettings();
    new import_obsidian.Notice(`Re-dated ${changed} event${changed === 1 ? "" : "s"} from the canvas.`);
  }
}

// src/modals/CityModal.ts
var import_obsidian4 = require("obsidian");

// src/editing.ts
var import_obsidian2 = require("obsidian");
function pathForName(file, name) {
  const base = safeFileName(name) || file.basename;
  const folder = file.parent && file.parent.path !== "/" ? `${file.parent.path}/` : "";
  return (0, import_obsidian2.normalizePath)(`${folder}${base}.${file.extension}`);
}
async function renameToName(app, file, name) {
  const target = pathForName(file, name);
  if (target !== file.path) await app.fileManager.renameFile(file, target);
  return file.path;
}
async function replaceBody(app, file, body) {
  await app.vault.process(file, (text) => {
    const m = /^---\r?\n[\s\S]*?\r?\n---[ \t]*(?:\r?\n|$)/.exec(text);
    const head = m ? m[0] : "";
    return `${head}${head && !head.endsWith("\n") ? "\n" : ""}
${body.trim()}
`;
  });
}
function setOrDelete(fm, key, value) {
  const empty = value == null || value === "" || Array.isArray(value) && !value.length || typeof value === "object" && !Array.isArray(value) && !Object.keys(value).length;
  if (empty) delete fm[key];
  else fm[key] = value;
}

// src/ui/components.ts
var import_obsidian3 = require("obsidian");
var SVG_NS = "http://www.w3.org/2000/svg";
function svgEl(parent, tag, attrs = {}) {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v));
  parent.appendChild(el);
  return el;
}
function renderRadar(parent, values, max, cls = "ct-radar") {
  const cx = 150, cy = 130, R = 95, n = values.length;
  const pt = (i, r) => {
    const a = -Math.PI / 2 + i * 2 * Math.PI / n;
    return [cx + Math.cos(a) * r, cy + Math.sin(a) * r];
  };
  const pts = (r) => values.map((_, i) => pt(i, r(i)).map((v) => v.toFixed(1)).join(",")).join(" ");
  const svg = svgEl(parent, "svg", { viewBox: "0 0 300 260", class: cls });
  for (const f of [0.25, 0.5, 0.75, 1]) svgEl(svg, "polygon", { points: pts(() => R * f), class: "ct-radar-grid" });
  values.forEach((_, i) => {
    const [x, y] = pt(i, R);
    svgEl(svg, "line", { x1: cx, y1: cy, x2: x, y2: y, class: "ct-radar-grid" });
  });
  svgEl(svg, "polygon", { points: pts((i) => R * Math.max(0.05, Math.min(1, values[i] / max))), class: "ct-radar-data" });
  values.forEach((v, i) => {
    const [x, y] = pt(i, R + 20);
    const t = svgEl(svg, "text", { x, y, class: "ct-radar-label" });
    t.textContent = `${STAT_KEYS[i].toUpperCase()} ${v}`;
  });
  return svg;
}
function sectionLabel(parent, text) {
  return parent.createDiv({ cls: "ct-label", text });
}
function pill(parent, text, color, cls = "ct-pill") {
  const el = parent.createSpan({ cls, text });
  el.style.setProperty("--ct-c", `var(--color-${color})`);
  return el;
}
function renderLinkish(app, parent, raw, sourcePath, cls = "") {
  const { target, display } = parseLink(raw);
  if (!target) return parent.createSpan({ text: display, cls });
  const a = parent.createEl("a", { text: display, cls: `internal-link ${cls}`.trim(), attr: { "data-href": target, href: target } });
  const dest = app.metadataCache.getFirstLinkpathDest(target, sourcePath);
  if (!dest) a.addClass("is-unresolved");
  a.addEventListener("click", (e) => {
    e.preventDefault();
    app.workspace.openLinkText(target, sourcePath, import_obsidian3.Keymap.isModEvent(e));
  });
  a.addEventListener("mouseover", (e) => {
    app.workspace.trigger("hover-link", { event: e, source: "worldbuilding", hoverParent: parent, targetEl: a, linktext: target, sourcePath });
  });
  return a;
}
function button(parent, text, onClick, cls = "ct-btn") {
  const b = parent.createEl("button", { text, cls });
  b.addEventListener("click", onClick);
  return b;
}
var NoteSuggest = class extends import_obsidian3.AbstractInputSuggest {
  constructor(app, input, onPick, filter) {
    super(app, input);
    this.input = input;
    this.onPick = onPick;
    this.filter = filter;
  }
  getSuggestions(query) {
    const q = query.replace(/^\[\[|\]\]$/g, "").toLowerCase();
    return this.app.vault.getMarkdownFiles().filter((f) => (!this.filter || this.filter(f)) && f.basename.toLowerCase().includes(q)).slice(0, 30);
  }
  renderSuggestion(file, el) {
    el.setText(file.basename);
    el.createDiv({ text: file.parent?.path ?? "", cls: "ct-suggest-path" });
  }
  selectSuggestion(file) {
    const link = `[[${file.basename}]]`;
    this.input.value = link;
    this.input.dispatchEvent(new Event("input"));
    this.onPick?.(link);
    this.close();
  }
};
var IMAGE_EXT = ["png", "jpg", "jpeg", "gif", "webp", "svg", "bmp", "avif"];
var ImagePickerModal = class extends import_obsidian3.FuzzySuggestModal {
  constructor(app, onPick) {
    super(app);
    this.onPick = onPick;
    this.setPlaceholder("Pick a portrait image from the vault");
  }
  getItems() {
    return this.app.vault.getFiles().filter((f) => IMAGE_EXT.includes(f.extension.toLowerCase()));
  }
  getItemText(f) {
    return f.path;
  }
  onChooseItem(f) {
    this.onPick(f);
  }
};
function resolveImage(app, raw, sourcePath) {
  if (!raw) return null;
  const { target, display } = parseLink(raw);
  const f = app.metadataCache.getFirstLinkpathDest(target ?? display, sourcePath);
  return f ? app.vault.getResourcePath(f) : null;
}
function renderInline(app, parent, text, sourcePath) {
  const re = /!?\[\[[^\]]+\]\]/g;
  let last = 0;
  for (const m of text.matchAll(re)) {
    if (m.index > last) parent.appendText(text.slice(last, m.index));
    renderLinkish(app, parent, m[0], sourcePath);
    last = m.index + m[0].length;
  }
  if (last < text.length) parent.appendText(text.slice(last));
}
var ImageLightbox = class extends import_obsidian3.Modal {
  constructor(app, srcs, index) {
    super(app);
    this.srcs = srcs;
    this.index = index;
  }
  onOpen() {
    this.modalEl.addClass("ct-lightbox-modal");
    this.scope.register([], "ArrowLeft", () => this.go(-1));
    this.scope.register([], "ArrowRight", () => this.go(1));
    this.draw();
  }
  go(d) {
    this.index = (this.index + d + this.srcs.length) % this.srcs.length;
    this.draw();
    return false;
  }
  draw() {
    const el = this.contentEl;
    el.empty();
    const cur = this.srcs[this.index];
    const stage = el.createDiv({ cls: "ct-lightbox" });
    stage.createEl("img", { attr: { src: cur.src, alt: cur.name } });
    if (this.srcs.length > 1) {
      const prev = stage.createEl("button", { cls: "ct-lightbox-nav is-prev", attr: { "aria-label": "Previous image" } });
      (0, import_obsidian3.setIcon)(prev, "chevron-left");
      prev.addEventListener("click", () => this.go(-1));
      const next = stage.createEl("button", { cls: "ct-lightbox-nav is-next", attr: { "aria-label": "Next image" } });
      (0, import_obsidian3.setIcon)(next, "chevron-right");
      next.addEventListener("click", () => this.go(1));
    }
    const cap = el.createDiv({ cls: "ct-lightbox-caption" });
    cap.createSpan({ text: cur.name });
    cap.createSpan({ cls: "ct-mono ct-faint", text: `${this.index + 1} / ${this.srcs.length}` });
  }
  onClose() {
    this.contentEl.empty();
  }
};
function tagInput(app, parent, label, list, color, opts = {}) {
  const wrap = parent.createDiv({ cls: `ct-field ${opts.full === false ? "" : "is-full"}` });
  if (label) wrap.createEl("label", { text: label });
  const box = wrap.createDiv({ cls: "ct-tag-input" });
  const add = (v) => {
    const t = v.trim().replace(/,$/, "");
    if (t) list.push(t);
    draw();
    box.querySelector("input")?.focus();
  };
  const draw = () => {
    box.empty();
    list.forEach((t, i) => {
      const p = box.createSpan({ cls: "ct-pill", text: t });
      p.style.setProperty("--ct-c", `var(--color-${color})`);
      const x = p.createSpan({ cls: "ct-pill-x", text: "\xD7", attr: { "aria-label": `Remove ${t}` } });
      x.addEventListener("click", () => {
        list.splice(i, 1);
        draw();
      });
    });
    const input = box.createEl("input", { type: "text", attr: { placeholder: list.length ? "" : opts.suggestNotes ? "Type a note name" : "Type and press Enter" } });
    input.addEventListener("keydown", (e) => {
      if ((e.key === "Enter" || e.key === ",") && input.value.trim()) {
        e.preventDefault();
        add(input.value);
      } else if (e.key === "Backspace" && !input.value && list.length) {
        list.pop();
        draw();
        box.querySelector("input").focus();
      }
    });
    if (opts.suggestNotes) new NoteSuggest(app, input, (link) => add(link));
  };
  draw();
}

// src/modals/CityModal.ts
var MAX_IMAGES = 5;
var DATE_KEY = /found|built|date|born|est/i;
var asList = (v) => Array.isArray(v) ? v : v == null || v === "" ? [] : [v];
var CityModal = class extends import_obsidian4.Modal {
  constructor(app, plugin, onCreated, file = null) {
    super(app);
    this.plugin = plugin;
    this.onCreated = onCreated;
    this.file = file;
    this.name = "";
    this.motto = "";
    this.images = [];
    this.glance = {};
    this.tables = {};
    this.people = [];
    this.body = "";
    this.originalBody = "";
    this.error = "";
    for (const f of plugin.settings.cityFields) {
      this.glance[f.key] = { kind: DATE_KEY.test(f.key) ? "date" : "text", text: "", date: { month: 0, year: NaN } };
    }
    for (const t of plugin.settings.cityTables) this.tables[t.key] = [];
  }
  get path() {
    if (this.file) return pathForName(this.file, this.name);
    return (0, import_obsidian4.normalizePath)(joinPath(this.plugin.settings.citiesFolder, `${safeFileName(this.name) || "<Name>"}.md`));
  }
  footText() {
    if (!this.file) return `Saves to ${this.path}`;
    return this.path === this.file.path ? `Editing ${this.file.path}` : `Saves and renames to ${this.path}`;
  }
  async load(file) {
    const fm = this.app.metadataCache.getFileCache(file)?.frontmatter ?? {};
    this.name = String(fm.name ?? "") || file.basename;
    this.motto = String(fm.motto ?? "");
    this.images = asList(fm.images ?? fm.image).map(String);
    for (const f of this.plugin.settings.cityFields) {
      const raw = fm[f.key];
      const g = this.glance[f.key];
      const d = raw && typeof raw === "object" && !Array.isArray(raw) ? parseDate(raw) : null;
      if (d) Object.assign(g, { kind: "date", date: d });
      else if (Array.isArray(raw)) Object.assign(g, { kind: "list", text: raw.map(String).join(", ") });
      else if (typeof raw === "number") Object.assign(g, { kind: "number", text: String(raw) });
      else if (raw != null && raw !== "") Object.assign(g, { kind: "text", text: String(raw) });
    }
    for (const t of this.plugin.settings.cityTables) {
      this.tables[t.key] = asList(fm[t.key]).map((r) => r && typeof r === "object" && !Array.isArray(r) ? { ...r } : { [t.columns.split(",")[0].trim()]: r });
    }
    this.people = asList(fm.notable_people).map(String);
    const text = await this.app.vault.cachedRead(file);
    const end = this.app.metadataCache.getFileCache(file)?.frontmatterPosition?.end.offset;
    this.body = this.originalBody = (end != null ? text.slice(end) : text).trim();
  }
  async onOpen() {
    if (this.file) await this.load(this.file);
    this.modalEl.addClass("ct-city-editor-modal");
    this.setTitle(this.file ? "Edit city" : "New city");
    this.render();
  }
  section(parent, title, help) {
    const sec = parent.createDiv({ cls: "ct-stack-8 ct-editor-section" });
    const head = sec.createDiv({ cls: "ct-stack-2" });
    head.createDiv({ cls: "ct-label", text: title });
    if (help) head.createDiv({ cls: "ct-faint ct-12", text: help });
    return sec;
  }
  render() {
    const el = this.contentEl;
    const scroll = el.querySelector(".ct-editor-body")?.scrollTop ?? 0;
    el.empty();
    const body = el.createDiv({ cls: "ct-editor-body" });
    const id = this.section(body, "City");
    const grid = id.createDiv({ cls: "ct-form-grid" });
    const n = grid.createDiv({ cls: "ct-field" });
    n.createEl("label", { text: "Name *" });
    const ni = n.createEl("input", { type: "text", value: this.name, attr: { placeholder: "Kesthaven" } });
    ni.addEventListener("input", () => {
      this.name = ni.value;
      this.footEl?.setText(this.footText());
    });
    if (this.error) n.createDiv({ cls: "ct-error", text: this.error });
    if (!this.file) window.setTimeout(() => ni.focus(), 0);
    const m = grid.createDiv({ cls: "ct-field" });
    m.createEl("label", { text: "Motto" });
    const mi = m.createEl("input", { type: "text", value: this.motto, attr: { placeholder: "The tide keeps no ledger" } });
    mi.addEventListener("input", () => this.motto = mi.value);
    this.renderImages(this.section(body, "Images", `${this.images.length} / ${MAX_IMAGES} \xB7 the first one is shown largest`));
    this.renderGlance(this.section(body, "At a glance"));
    for (const t of this.plugin.settings.cityTables) this.renderTable(this.section(body, t.title), t.key, t.columns);
    const ppl = this.section(body, "Notable people", "Characters whose notes link to this city are added automatically; list anyone else here.");
    tagInput(this.app, ppl, "", this.people, "purple", { suggestNotes: true });
    const desc = this.section(body, "Description", "The note body. Markdown and [[links]] work.");
    const ta = desc.createEl("textarea", { cls: "ct-lore-input is-short", text: this.body });
    ta.addEventListener("input", () => this.body = ta.value);
    const footer = el.createDiv({ cls: "ct-wizard-foot" });
    this.footEl = footer.createDiv({ cls: "ct-faint ct-12", text: this.footText() });
    const btns = footer.createDiv({ cls: "ct-row-8" });
    button(btns, "Cancel", () => this.close());
    button(btns, this.file ? "Save changes" : "Create city", () => this.submit(), "ct-btn mod-cta");
    body.scrollTop = scroll;
  }
  renderImages(sec) {
    const list = sec.createDiv({ cls: "ct-image-list" });
    this.images.forEach((img, i) => {
      const row = list.createDiv({ cls: "ct-image-row" });
      row.createSpan({ cls: "ct-mono ct-faint ct-11", text: String(i + 1) });
      row.createSpan({ cls: "ct-13 ct-image-name", text: img.replace(/^\[\[|\]\]$/g, "") });
      const move = (d, icon, label, disabled) => {
        const b = row.createEl("button", { cls: "ct-icon-btn", attr: { "aria-label": label } });
        (0, import_obsidian4.setIcon)(b, icon);
        b.disabled = disabled;
        b.addEventListener("click", () => {
          [this.images[i], this.images[i + d]] = [this.images[i + d], this.images[i]];
          this.render();
        });
      };
      move(-1, "arrow-up", "Move up", i === 0);
      move(1, "arrow-down", "Move down", i === this.images.length - 1);
      const rm = row.createEl("button", { cls: "ct-icon-btn", attr: { "aria-label": "Remove" } });
      (0, import_obsidian4.setIcon)(rm, "x");
      rm.addEventListener("click", () => {
        this.images.splice(i, 1);
        this.render();
      });
    });
    if (this.images.length < MAX_IMAGES) {
      const add = button(
        sec,
        "Add image",
        () => new ImagePickerModal(this.app, (f) => {
          this.images.push(`[[${f.name}]]`);
          this.render();
        }).open()
      );
      add.addClass("ct-self-start");
      (0, import_obsidian4.setIcon)(add.createSpan({ cls: "ct-btn-icon" }), "image-plus");
    }
  }
  renderGlance(sec) {
    const grid = sec.createDiv({ cls: "ct-form-grid" });
    const s = this.plugin.settings;
    for (const f of s.cityFields) {
      const g = this.glance[f.key];
      const wrap = grid.createDiv({ cls: "ct-field" });
      wrap.createEl("label", { text: g.kind === "list" ? `${f.label} (comma-separated)` : f.label });
      if (g.kind === "date") {
        const row = wrap.createDiv({ cls: "ct-row-8" });
        const sel = row.createEl("select", { cls: "dropdown" });
        s.months.forEach((mo, i) => sel.createEl("option", { text: mo, value: String(i) }));
        sel.value = String(g.date.month);
        sel.addEventListener("change", () => g.date.month = Number(sel.value));
        const yr = row.createEl("input", { type: "number", cls: "ct-year", value: Number.isFinite(g.date.year) ? String(g.date.year) : "", attr: { placeholder: "Year" } });
        yr.addEventListener("input", () => g.date.year = yr.value === "" ? NaN : Number(yr.value));
      } else {
        const input = wrap.createEl("input", { type: g.kind === "number" ? "number" : "text", value: g.text });
        input.addEventListener("input", () => g.text = input.value);
        if (f.key === "region" || f.key === "ruler") new NoteSuggest(this.app, input);
      }
    }
  }
  renderTable(sec, key, columns) {
    const cols = columns.split(",").map((c) => c.trim()).filter(Boolean);
    const rows = this.tables[key];
    const tbl = sec.createDiv({ cls: "ct-edit-table" });
    tbl.style.setProperty("--ct-cols", String(cols.length));
    const head = tbl.createDiv({ cls: "ct-edit-table-row is-head" });
    cols.forEach((c) => head.createSpan({ cls: "ct-faint ct-11", text: c.replace(/_/g, " ") }));
    head.createSpan();
    rows.forEach((r, i) => {
      const row = tbl.createDiv({ cls: "ct-edit-table-row" });
      for (const c of cols) {
        const input = row.createEl("input", { type: "text", value: r[c] == null ? "" : String(r[c]) });
        input.addEventListener("input", () => r[c] = input.value);
      }
      const rm = row.createEl("button", { cls: "ct-icon-btn", attr: { "aria-label": "Remove row" } });
      (0, import_obsidian4.setIcon)(rm, "x");
      rm.addEventListener("click", () => {
        rows.splice(i, 1);
        this.render();
      });
    });
    button(sec, "+ Add row", () => {
      rows.push({});
      this.render();
    }).addClass("ct-self-start");
  }
  /** The frontmatter keys this editor owns, as they should be written. */
  build() {
    const out = { name: this.name.trim(), motto: this.motto.trim(), images: [...this.images] };
    for (const f of this.plugin.settings.cityFields) {
      const g = this.glance[f.key];
      if (g.kind === "date") out[f.key] = Number.isFinite(g.date.year) ? { month: g.date.month, year: g.date.year } : "";
      else if (g.kind === "list") out[f.key] = g.text.split(",").map((x) => x.trim()).filter(Boolean);
      else if (g.kind === "number" && g.text.trim() !== "" && Number.isFinite(Number(g.text))) out[f.key] = Number(g.text);
      else out[f.key] = g.text.trim();
    }
    for (const t of this.plugin.settings.cityTables) {
      const cols = t.columns.split(",").map((c) => c.trim()).filter(Boolean);
      out[t.key] = this.tables[t.key].map((r) => {
        const row = { ...r };
        for (const c of cols) if (row[c] === "") delete row[c];
        return row;
      }).filter((r) => Object.keys(r).length);
    }
    out.notable_people = [...this.people];
    return out;
  }
  async submit() {
    if (!safeFileName(this.name)) this.error = "A name is required.";
    else if (this.path !== this.file?.path && this.app.vault.getAbstractFileByPath(this.path)) this.error = `${this.path} already exists.`;
    else this.error = "";
    if (this.error) return this.render();
    const next = this.build();
    try {
      if (this.file) {
        const file = this.file;
        await this.app.fileManager.processFrontMatter(file, (fm2) => {
          for (const [k, v] of Object.entries(next)) setOrDelete(fm2, k, v);
          delete fm2.image;
        });
        if (this.body.trim() !== this.originalBody) await replaceBody(this.app, file, this.body);
        const renamed = this.path !== file.path;
        await renameToName(this.app, file, this.name);
        this.close();
        new import_obsidian4.Notice(renamed ? `Saved and renamed to ${file.basename}.` : `Saved ${file.basename}.`);
        return;
      }
      const fm = { type: "city" };
      for (const [k, v] of Object.entries(next)) setOrDelete(fm, k, v);
      for (const f of this.plugin.settings.cityFields) if (!(f.key in fm)) fm[f.key] = "";
      await ensureFolder(this.app, this.plugin.settings.citiesFolder);
      const created = await this.app.vault.create(this.path, `---
${(0, import_obsidian4.stringifyYaml)(fm)}---

${this.body.trim()}
`);
      this.close();
      this.onCreated?.(created);
    } catch (e) {
      console.error(e);
      new import_obsidian4.Notice(`Couldn't save city: ${e.message}`);
    }
  }
  onClose() {
    this.contentEl.empty();
  }
};

// src/modals/CharacterWizard.ts
var import_obsidian5 = require("obsidian");

// src/settings.ts
var THEME_COLORS = ["red", "orange", "yellow", "green", "cyan", "blue", "purple", "pink"];
var GROUP_TITLES = {
  appearance: "Appearance",
  personality: "Personality",
  narration: "POV & narration"
};
var DEFAULT_SETTINGS = {
  charactersFolder: "Characters",
  eventsFolder: "Timeline",
  manuscriptFolder: "Manuscript",
  citiesFolder: "Places",
  timelineName: "Saltreach Arc",
  eraName: "Third Age",
  eraAbbr: "TA",
  months: ["Frostmoot", "Thaw", "Seedfall", "Greening", "Highsun", "Emberwane", "Harvest", "Duskfall", "Mists", "Hollow", "Deepcold", "Yearsend"],
  currentYear: 1043,
  categories: [
    { key: "conflict", label: "Conflict", color: "red" },
    { key: "journey", label: "Journey", color: "cyan" },
    { key: "politics", label: "Politics", color: "purple" },
    { key: "personal", label: "Personal", color: "yellow" }
  ],
  descFields: {
    appearance: [
      { key: "eyes", label: "Eyes", type: "color" },
      { key: "hair", label: "Hair", type: "color" },
      { key: "skin", label: "Skin", type: "color" },
      { key: "build", label: "Build", type: "text" },
      { key: "marks", label: "Marks", type: "text" },
      { key: "dress", label: "Dress", type: "text" },
      { key: "mannerism", label: "Mannerism", type: "text" }
    ],
    personality: [
      { key: "core", label: "Core", type: "text" },
      { key: "want", label: "Want", type: "text" },
      { key: "need", label: "Need", type: "text" },
      { key: "fear", label: "Fear", type: "text" },
      { key: "secret", label: "Secret", type: "text" },
      { key: "contradiction", label: "Contradiction", type: "text" },
      { key: "speech", label: "Speech", type: "text" }
    ],
    narration: [
      { key: "pov", label: "POV", type: "enum", options: "First, Close third, Distant third, Omniscient, Second" },
      { key: "tense", label: "Tense", type: "enum", options: "Past, Present" },
      { key: "arc", label: "Arc", type: "text" },
      { key: "notices_first", label: "Notices first", type: "text" },
      { key: "never_describes", label: "Never describes", type: "text" },
      { key: "voice_sample", label: "Voice sample", type: "textarea" }
    ]
  },
  cityFields: [
    { key: "region", label: "Region" },
    { key: "founded", label: "Founded" },
    { key: "population", label: "Population" },
    { key: "government", label: "Government" },
    { key: "ruler", label: "Ruler" },
    { key: "factions", label: "Factions" },
    { key: "languages", label: "Languages" },
    { key: "religion", label: "Religion" },
    { key: "exports", label: "Exports" },
    { key: "climate", label: "Climate" }
  ],
  cityTables: [
    { key: "districts", title: "Districts", columns: "name, character, notes" },
    { key: "landmarks", title: "Landmarks", columns: "name, kind, notes" }
  ],
  pointPool: 26,
  statBase: 8,
  statMin: 3,
  statMax: 18,
  defaultLayout: "full",
  openSheetByDefault: true,
  canvasReverseSync: false
};
function cloneDefaults() {
  return JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
}

// src/modals/CharacterWizard.ts
var STEPS = ["Identity", "Attributes", "Description", "Traits", "Relationships", "Lore"];
var HELP = [
  "Who they are, where they come from, and who they answer to.",
  "Spend points above the base. Lowering a stat below the base refunds points.",
  "The writer's reference you'll lean on while drafting.",
  "Short tags. Press Enter or comma to add one.",
  "Link other character notes and say how this one feels about them.",
  "Backstory and notes. This becomes the note body (Markdown, wikilinks work)."
];
var CharacterWizard = class extends import_obsidian5.Modal {
  constructor(app, plugin, file = null) {
    super(app);
    this.plugin = plugin;
    this.file = file;
    this.step = 0;
    this.reached = 0;
    this.errors = {};
    /** Edit mode: each goal's done state and the body as loaded, so unchanged parts are kept. */
    this.goalDone = /* @__PURE__ */ new Map();
    this.originalLore = "";
    const s = plugin.settings;
    const stats = {};
    STAT_KEYS.forEach((k) => stats[k] = s.statBase);
    const desc = { appearance: {}, personality: {}, narration: {} };
    Object.keys(desc).forEach(
      (g) => s.descFields[g].forEach((f) => desc[g][f.key] = { text: "", color: "" })
    );
    this.draft = {
      name: "",
      quote: "",
      role: "",
      ancestry: "",
      bornMonth: 0,
      bornYear: "",
      affiliation: "",
      faction: "",
      factionTag: "",
      status: "",
      storyRole: "",
      portrait: "",
      stats,
      desc,
      traits: [],
      values: [],
      weaknesses: [],
      goals: [],
      relationships: [],
      lore: ""
    };
  }
  options(f) {
    return (f.options ?? "").split(",").map((o) => o.trim()).filter(Boolean);
  }
  get editing() {
    return !!this.file;
  }
  /** Fills the draft from the note's frontmatter and body. */
  async loadFromFile(file) {
    const fm = this.app.metadataCache.getFileCache(file)?.frontmatter ?? {};
    const c = parseCharacter(fm, file.basename);
    const d = this.draft;
    Object.assign(d, {
      name: c.name,
      quote: c.quote,
      role: c.role,
      ancestry: c.ancestry,
      bornMonth: c.born?.month ?? 0,
      bornYear: c.born ? String(c.born.year) : "",
      affiliation: c.affiliation,
      faction: c.faction,
      factionTag: c.factionTag,
      status: c.status,
      storyRole: c.storyRole,
      portrait: c.portrait,
      traits: [...c.traits],
      values: [...c.values],
      weaknesses: [...c.weaknesses],
      goals: c.goals.map((g) => g.text),
      relationships: c.relationships.map((r) => ({ ...r }))
    });
    c.goals.forEach((g) => this.goalDone.set(g.text, g.done));
    const statsRaw = fm.stats ?? {};
    for (const k of STAT_KEYS) if (statsRaw[k] != null || statsRaw[k.toUpperCase()] != null) d.stats[k] = c.stats[k];
    for (const g of Object.keys(d.desc)) {
      for (const [k, v] of Object.entries(c.description[g] ?? {})) d.desc[g][k] = { text: v.text, color: v.color ?? "" };
    }
    const text = await this.app.vault.cachedRead(file);
    const end = this.app.metadataCache.getFileCache(file)?.frontmatterPosition?.end.offset;
    d.lore = this.originalLore = (end != null ? text.slice(end) : text).trim();
    this.reached = STEPS.length - 1;
  }
  async onOpen() {
    if (this.file) await this.loadFromFile(this.file);
    this.modalEl.addClass("ct-wizard-modal");
    this.contentEl.empty();
    const shell = this.contentEl.createDiv({ cls: "ct-wizard" });
    this.railEl = shell.createDiv({ cls: "ct-wizard-rail" });
    this.mainEl = shell.createDiv({ cls: "ct-wizard-main" });
    this.render();
  }
  get spent() {
    const s = this.plugin.settings;
    return STAT_KEYS.reduce((a, k) => a + (this.draft.stats[k] - s.statBase), 0);
  }
  get filePath() {
    if (this.file) return pathForName(this.file, this.draft.name);
    const name = safeFileName(this.draft.name) || "<Name>";
    return (0, import_obsidian5.normalizePath)(joinPath(this.plugin.settings.charactersFolder, `${name}.md`));
  }
  validateIdentity() {
    this.errors = {};
    const name = safeFileName(this.draft.name);
    if (!name) this.errors.name = "A name is required.";
    else if (this.filePath !== this.file?.path && this.app.vault.getAbstractFileByPath(this.filePath)) this.errors.name = `${this.filePath} already exists. Pick another name.`;
    return !this.errors.name;
  }
  go(step) {
    if (step > this.step && this.step === 0 && !this.validateIdentity()) {
      this.render();
      return;
    }
    this.step = step;
    this.reached = Math.max(this.reached, step);
    this.render();
  }
  render() {
    this.renderRail();
    const main = this.mainEl;
    main.empty();
    const head = main.createDiv({ cls: "ct-wizard-head" });
    const titles = head.createDiv({ cls: "ct-stack-4" });
    titles.createDiv({ cls: "ct-h18", text: STEPS[this.step] });
    titles.createDiv({ cls: "ct-muted ct-13", text: HELP[this.step] });
    if (this.step === 1) {
      const left = this.plugin.settings.pointPool - this.spent;
      const pts = head.createDiv({ cls: "ct-points" });
      pts.createDiv({ cls: `ct-points-num ${left === 0 ? "is-zero" : ""}`, text: String(left) });
      pts.createDiv({ cls: "ct-faint ct-11", text: "points left" });
    }
    const body = main.createDiv({ cls: "ct-wizard-body" });
    [this.stepIdentity, this.stepAttributes, this.stepDescription, this.stepTraits, this.stepRelationships, this.stepLore][this.step].call(this, body);
    const foot = main.createDiv({ cls: "ct-wizard-foot" });
    foot.createDiv({ cls: "ct-faint ct-12", text: this.footText() });
    const btns = foot.createDiv({ cls: "ct-row-8" });
    if (this.step > 0) button(btns, "Back", () => this.go(this.step - 1));
    if (this.editing) {
      if (this.step < STEPS.length - 1) button(btns, `Next: ${STEPS[this.step + 1]}`, () => this.go(this.step + 1));
      button(btns, "Save changes", () => this.save(), "ct-btn mod-cta");
    } else if (this.step < STEPS.length - 1) button(btns, `Next: ${STEPS[this.step + 1]}`, () => this.go(this.step + 1), "ct-btn mod-cta");
    else button(btns, "Create character", () => this.create(), "ct-btn mod-cta");
  }
  renderRail() {
    const rail = this.railEl;
    rail.empty();
    rail.createDiv({ cls: "ct-wizard-title", text: this.editing ? "Edit character" : "New character" });
    STEPS.forEach((label, i) => {
      const done = i < this.step || i <= this.reached && i !== this.step;
      const row = rail.createDiv({ cls: `ct-step ${i === this.step ? "is-current" : ""} ${done ? "is-done" : ""} ${i > this.reached ? "is-future" : ""}` });
      const dot = row.createSpan({ cls: "ct-step-dot" });
      if (done) (0, import_obsidian5.setIcon)(dot, "check");
      else dot.setText(String(i + 1));
      row.createSpan({ text: label });
      if (i <= this.reached && i !== this.step) row.addEventListener("click", () => this.go(i));
    });
  }
  // ---------- field helpers ----------
  field(parent, label, opts) {
    const wrap = parent.createDiv({ cls: `ct-field ${opts.full ? "is-full" : ""}` });
    wrap.createEl("label", { text: label });
    const input = wrap.createEl("input", { type: "text", value: opts.value, attr: { placeholder: opts.placeholder ?? "" } });
    input.addEventListener("input", () => opts.onChange(input.value));
    if (opts.suggest) new NoteSuggest(this.app, input);
    if (opts.error) wrap.createDiv({ cls: "ct-error", text: opts.error });
    return input;
  }
  stepIdentity(body) {
    const d = this.draft;
    const s = this.plugin.settings;
    const grid = body.createDiv({ cls: "ct-form-grid" });
    const nameInput = this.field(grid, "Name *", {
      value: d.name,
      placeholder: "Maren Voss",
      error: this.errors.name,
      full: true,
      onChange: (v) => {
        d.name = v;
        const foot = this.mainEl.querySelector(".ct-wizard-foot .ct-faint");
        if (foot) foot.setText(this.footText());
      }
    });
    if (!this.editing) window.setTimeout(() => nameInput.focus(), 0);
    this.field(grid, "Quote", { value: d.quote, onChange: (v) => d.quote = v, full: true, placeholder: "A line they'd say" });
    this.field(grid, "Role", { value: d.role, onChange: (v) => d.role = v, placeholder: "Cartographer, sellsword" });
    this.field(grid, "Ancestry", { value: d.ancestry, onChange: (v) => d.ancestry = v });
    const born = grid.createDiv({ cls: "ct-field" });
    born.createEl("label", { text: `Born (${s.eraAbbr || "year"})` });
    const row = born.createDiv({ cls: "ct-row-8" });
    const sel = row.createEl("select", { cls: "dropdown" });
    s.months.forEach((m, i) => sel.createEl("option", { text: m, value: String(i) }));
    sel.value = String(d.bornMonth);
    sel.addEventListener("change", () => d.bornMonth = Number(sel.value));
    const yr = row.createEl("input", { type: "number", value: d.bornYear, cls: "ct-year", attr: { placeholder: String(s.currentYear - 20) } });
    yr.addEventListener("input", () => d.bornYear = yr.value);
    this.field(grid, "Story role", { value: d.storyRole, onChange: (v) => d.storyRole = v, placeholder: "Protagonist" });
    this.field(grid, "Affiliation", { value: d.affiliation, onChange: (v) => d.affiliation = v, suggest: true, placeholder: "[[Gilded Compass]]" });
    this.field(grid, "Faction", { value: d.faction, onChange: (v) => d.faction = v, suggest: true, placeholder: "[[The Unmapped]]" });
    this.field(grid, "Faction tag", { value: d.factionTag, onChange: (v) => d.factionTag = v, placeholder: "Outlaw" });
    this.field(grid, "Status", { value: d.status, onChange: (v) => d.status = v, placeholder: "Exiled" });
    const p = grid.createDiv({ cls: "ct-field is-full" });
    p.createEl("label", { text: "Portrait" });
    const pr = p.createDiv({ cls: "ct-row-8" });
    const pin = pr.createEl("input", { type: "text", value: d.portrait, attr: { placeholder: "[[maren.png]]" } });
    pin.addEventListener("input", () => d.portrait = pin.value);
    button(
      pr,
      "Choose\u2026",
      () => new ImagePickerModal(this.app, (f) => {
        d.portrait = `[[${f.name}]]`;
        pin.value = d.portrait;
      }).open()
    );
  }
  stepAttributes(body) {
    const s = this.plugin.settings;
    const d = this.draft;
    const wrap = body.createDiv({ cls: "ct-attr" });
    const rows = wrap.createDiv({ cls: "ct-attr-rows" });
    for (const k of STAT_KEYS) {
      const row = rows.createDiv({ cls: "ct-attr-row" });
      const name = row.createDiv({ cls: "ct-stack-0" });
      name.createDiv({ cls: "ct-13", text: STAT_NAMES[k] });
      name.createDiv({ cls: "ct-faint ct-11", text: STAT_HINTS[k] });
      const set = (delta) => {
        const v = d.stats[k] + delta;
        if (v < s.statMin || v > s.statMax || delta > 0 && this.spent + delta > s.pointPool) return;
        d.stats[k] = v;
        this.render();
      };
      button(row, "\u2212", () => set(-1), "ct-step-btn").setAttr("aria-label", `Lower ${STAT_NAMES[k]}`);
      row.createDiv({ cls: "ct-attr-val", text: String(d.stats[k]) });
      button(row, "+", () => set(1), "ct-step-btn").setAttr("aria-label", `Raise ${STAT_NAMES[k]}`);
    }
    const side = wrap.createDiv({ cls: "ct-attr-side" });
    renderRadar(side, STAT_KEYS.map((k) => d.stats[k]), s.statMax);
    side.createEl("pre", { cls: "ct-yaml", text: "---\nstats:\n" + STAT_KEYS.map((k) => `  ${k}: ${d.stats[k]}`).join("\n") + "\n---" });
  }
  stepDescription(body) {
    var _a, _b;
    const s = this.plugin.settings;
    const groups = body.createDiv({ cls: "ct-stack-20" });
    for (const g of Object.keys(GROUP_TITLES)) {
      if (!s.descFields[g].length) continue;
      const sec = groups.createDiv({ cls: "ct-stack-8" });
      sec.createDiv({ cls: "ct-label", text: GROUP_TITLES[g] });
      const grid = sec.createDiv({ cls: "ct-form-grid" });
      for (const f of s.descFields[g]) {
        const val = (_a = this.draft.desc[g])[_b = f.key] ?? (_a[_b] = { text: "", color: "" });
        const wrap = grid.createDiv({ cls: `ct-field ${f.type === "textarea" ? "is-full" : ""}` });
        wrap.createEl("label", { text: f.label });
        if (f.type === "enum") {
          const sel = wrap.createEl("select", { cls: "dropdown" });
          sel.createEl("option", { text: "\u2014", value: "" });
          this.options(f).forEach((o) => sel.createEl("option", { text: o, value: o }));
          sel.value = val.text;
          sel.addEventListener("change", () => val.text = sel.value);
        } else if (f.type === "textarea") {
          const ta = wrap.createEl("textarea", { text: val.text, attr: { rows: "3" } });
          ta.addEventListener("input", () => val.text = ta.value);
        } else {
          const row = wrap.createDiv({ cls: "ct-row-8" });
          if (f.type === "color") {
            const c = row.createEl("input", { type: "color", value: val.color || "#808080", cls: "ct-color" });
            c.addEventListener("input", () => val.color = c.value);
          }
          const t = row.createEl("input", { type: "text", value: val.text });
          t.addEventListener("input", () => val.text = t.value);
        }
      }
    }
  }
  stepTraits(body) {
    const d = this.draft;
    const g = body.createDiv({ cls: "ct-form-grid" });
    tagInput(this.app, g, "Traits", d.traits, "green");
    tagInput(this.app, g, "Values", d.values, "blue");
    tagInput(this.app, g, "Weaknesses", d.weaknesses, "red");
    tagInput(this.app, g, "Goals", d.goals, "purple");
  }
  stepRelationships(body) {
    const d = this.draft;
    const list = body.createDiv({ cls: "ct-stack-10" });
    d.relationships.forEach((r, i) => {
      const row = list.createDiv({ cls: "ct-relrow" });
      const who = row.createEl("input", { type: "text", value: r.who, attr: { placeholder: "[[Character]]" } });
      who.addEventListener("input", () => r.who = who.value);
      new NoteSuggest(this.app, who);
      const kind = row.createEl("input", { type: "text", value: r.kind, attr: { placeholder: "Partner, rival\u2026" } });
      kind.addEventListener("input", () => r.kind = kind.value);
      const sl = row.createEl("input", { type: "range", attr: { min: "-10", max: "10", step: "1" }, value: String(r.score) });
      const out = row.createSpan({ cls: "ct-mono ct-score", text: String(r.score) });
      sl.addEventListener("input", () => {
        r.score = Number(sl.value);
        out.setText(r.score > 0 ? `+${r.score}` : r.score < 0 ? `\u2212${-r.score}` : "0");
        out.toggleClass("is-pos", r.score > 0);
        out.toggleClass("is-neg", r.score < 0);
      });
      const rm = row.createEl("button", { cls: "ct-icon-btn", attr: { "aria-label": "Remove" } });
      (0, import_obsidian5.setIcon)(rm, "x");
      rm.addEventListener("click", () => {
        d.relationships.splice(i, 1);
        this.render();
      });
    });
    button(list, "+ Add relationship", () => {
      d.relationships.push({ who: "", kind: "", score: 0 });
      this.render();
    });
  }
  stepLore(body) {
    const ta = body.createEl("textarea", { cls: "ct-lore-input", text: this.draft.lore, attr: { placeholder: "Apprenticed to the [[Gilded Compass]] at eleven\u2026" } });
    ta.addEventListener("input", () => this.draft.lore = ta.value);
  }
  // ---------- write ----------
  buildFrontmatter() {
    const d = this.draft;
    const s = this.plugin.settings;
    const fm = { type: "character", name: d.name.trim() };
    const put = (k, v) => {
      if (v == null || v === "" || Array.isArray(v) && !v.length) return;
      fm[k] = v;
    };
    put("quote", d.quote);
    put("portrait", d.portrait);
    put("status", d.status);
    put("role", d.role);
    put("ancestry", d.ancestry);
    if (d.bornYear !== "" && Number.isFinite(Number(d.bornYear))) fm.born = { month: d.bornMonth, year: Number(d.bornYear) };
    put("affiliation", d.affiliation);
    put("faction", d.faction);
    put("faction_tag", d.factionTag);
    put("story_role", d.storyRole);
    fm.stats = { ...d.stats };
    put("traits", d.traits);
    put("values", d.values);
    put("weaknesses", d.weaknesses);
    put("goals", d.goals.map((text) => ({ text, done: this.goalDone.get(text) ?? false })));
    put("relationships", d.relationships.filter((r) => r.who.trim()).map((r) => r.kind.trim() ? r : { who: r.who, score: r.score }));
    const description = {};
    for (const g of Object.keys(GROUP_TITLES)) {
      const out = {};
      for (const f of s.descFields[g]) {
        const v = d.desc[g][f.key];
        if (!v?.text) continue;
        out[f.key] = f.type === "color" && v.color ? { text: v.text, color: v.color } : v.text;
      }
      if (Object.keys(out).length) description[g] = out;
    }
    if (Object.keys(description).length) fm.description = description;
    return fm;
  }
  footText() {
    if (!this.file) return `Saves to ${this.filePath}`;
    return this.filePath === this.file.path ? `Editing ${this.file.path}` : `Saves and renames to ${this.filePath}`;
  }
  /** Edit mode: writes the wizard's keys back in place and keeps everything else in the frontmatter. */
  async save() {
    const file = this.file;
    if (!file) return;
    if (!this.validateIdentity()) {
      this.step = 0;
      this.render();
      return;
    }
    const next = this.buildFrontmatter();
    const managed = ["name", "quote", "portrait", "status", "role", "ancestry", "born", "affiliation", "faction", "faction_tag", "story_role", "stats", "traits", "values", "weaknesses", "goals", "relationships"];
    try {
      await this.app.fileManager.processFrontMatter(file, (fm) => {
        const untouchedStats = fm.stats == null && STAT_KEYS.every((k) => this.draft.stats[k] === this.plugin.settings.statBase);
        for (const k of managed) if (!(k === "stats" && untouchedStats)) setOrDelete(fm, k, next[k]);
        const desc = fm.description && typeof fm.description === "object" ? fm.description : {};
        const nextDesc = next.description ?? {};
        for (const g of Object.keys(GROUP_TITLES)) {
          const group = { ...desc[g] ?? {} };
          for (const f of this.plugin.settings.descFields[g]) setOrDelete(group, f.key, nextDesc[g]?.[f.key]);
          setOrDelete(desc, g, group);
        }
        setOrDelete(fm, "description", desc);
      });
      if (this.draft.lore.trim() !== this.originalLore) await replaceBody(this.app, file, this.draft.lore);
      const renamed = this.filePath !== file.path;
      await renameToName(this.app, file, this.draft.name);
      this.close();
      new import_obsidian5.Notice(renamed ? `Saved and renamed to ${file.basename}.` : `Saved ${file.basename}.`);
    } catch (e) {
      console.error(e);
      new import_obsidian5.Notice(`Couldn't save character: ${e.message}`);
    }
  }
  async create() {
    if (!this.validateIdentity()) {
      this.step = 0;
      this.render();
      return;
    }
    try {
      await ensureFolder(this.app, this.plugin.settings.charactersFolder);
      const content = `---
${(0, import_obsidian5.stringifyYaml)(this.buildFrontmatter())}---

${this.draft.lore.trim()}
`;
      const file = await this.app.vault.create(this.filePath, content);
      this.close();
      await this.plugin.openSheet(file);
    } catch (e) {
      console.error(e);
      new import_obsidian5.Notice(`Couldn't create character: ${e.message}`);
    }
  }
  onClose() {
    this.contentEl.empty();
  }
};

// src/modals/EventModal.ts
var import_obsidian6 = require("obsidian");
var EventModal = class extends import_obsidian6.Modal {
  constructor(app, plugin, prefill = {}, onCreated) {
    super(app);
    this.plugin = plugin;
    this.onCreated = onCreated;
    this.title = "";
    this.end = null;
    this.characters = "";
    this.location = "";
    this.error = "";
    this.start = prefill.start ?? plugin.settings.currentYear * 12;
    this.lane = !prefill.lane || prefill.lane === "World" ? "World" : `[[${prefill.lane}]]`;
    if (this.lane !== "World") this.characters = this.lane;
    this.category = plugin.settings.categories[0]?.key ?? "";
  }
  onOpen() {
    this.modalEl.addClass("ct-event-modal");
    this.setTitle("New event");
    this.render();
  }
  dateInput(parent, idx, onChange) {
    const d = fromIndex(idx);
    const row = parent.createDiv({ cls: "ct-row-8" });
    const sel = row.createEl("select", { cls: "dropdown" });
    this.plugin.settings.months.forEach((m, i) => sel.createEl("option", { text: m, value: String(i) }));
    sel.value = String(d.month);
    const yr = row.createEl("input", { type: "number", value: String(d.year), cls: "ct-year" });
    const fire = () => onChange(toIndex({ month: Number(sel.value), year: Number(yr.value) || 0 }));
    sel.addEventListener("change", fire);
    yr.addEventListener("input", fire);
  }
  render() {
    const el = this.contentEl;
    el.empty();
    const grid = el.createDiv({ cls: "ct-form-grid" });
    const t = grid.createDiv({ cls: "ct-field is-full" });
    t.createEl("label", { text: "Title *" });
    const ti = t.createEl("input", { type: "text", value: this.title, attr: { placeholder: "Betrayal at Varn" } });
    ti.addEventListener("input", () => this.title = ti.value);
    if (this.error) t.createDiv({ cls: "ct-error", text: this.error });
    window.setTimeout(() => ti.focus(), 0);
    const s = grid.createDiv({ cls: "ct-field" });
    s.createEl("label", { text: "Start" });
    this.dateInput(s, this.start, (i) => this.start = i);
    const e = grid.createDiv({ cls: "ct-field" });
    const lab = e.createEl("label", { cls: "ct-row-6" });
    const cb = lab.createEl("input", { type: "checkbox" });
    cb.checked = this.end != null;
    lab.appendText("Has an end (duration)");
    cb.addEventListener("change", () => {
      this.end = cb.checked ? this.start + 12 : null;
      this.render();
    });
    if (this.end != null) this.dateInput(e, this.end, (i) => this.end = i);
    const l = grid.createDiv({ cls: "ct-field" });
    l.createEl("label", { text: "Lane" });
    const li = l.createEl("input", { type: "text", value: this.lane, attr: { placeholder: "[[Character]] or World" } });
    li.addEventListener("input", () => this.lane = li.value);
    new NoteSuggest(this.app, li, void 0, (f) => isCharacter(this.app, f));
    const c = grid.createDiv({ cls: "ct-field" });
    c.createEl("label", { text: "Category" });
    const sel = c.createEl("select", { cls: "dropdown" });
    this.plugin.settings.categories.forEach((cat) => sel.createEl("option", { text: cat.label, value: cat.key }));
    sel.value = this.category;
    sel.addEventListener("change", () => this.category = sel.value);
    const loc = grid.createDiv({ cls: "ct-field is-full" });
    loc.createEl("label", { text: "Location (city)" });
    const loci = loc.createEl("input", { type: "text", value: this.location, attr: { placeholder: "[[Kesthaven]]" } });
    loci.addEventListener("input", () => this.location = loci.value);
    new NoteSuggest(this.app, loci, void 0, (f) => this.app.metadataCache.getFileCache(f)?.frontmatter?.type === "city");
    const ch = grid.createDiv({ cls: "ct-field is-full" });
    ch.createEl("label", { text: "Characters (comma-separated links)" });
    const chi = ch.createEl("input", { type: "text", value: this.characters, attr: { placeholder: "[[Maren Voss]], [[Ilsa Rhee]]" } });
    chi.addEventListener("input", () => this.characters = chi.value);
    const foot = el.createDiv({ cls: "ct-wizard-foot" });
    foot.createDiv({ cls: "ct-faint ct-12", text: `Saves to ${this.plugin.settings.eventsFolder || "/"}` });
    const btns = foot.createDiv({ cls: "ct-row-8" });
    button(btns, "Cancel", () => this.close());
    button(btns, "Create event", () => this.create(), "ct-btn mod-cta");
  }
  async create() {
    const name = safeFileName(this.title);
    const path = (0, import_obsidian6.normalizePath)(joinPath(this.plugin.settings.eventsFolder, `${name}.md`));
    if (!name) this.error = "A title is required.";
    else if (this.app.vault.getAbstractFileByPath(path)) this.error = `${path} already exists.`;
    else this.error = "";
    if (this.error) return this.render();
    const fm = { type: "event", title: this.title.trim(), "tl-start": fromIndex(this.start) };
    if (this.end != null) fm["tl-end"] = fromIndex(Math.max(this.start + 1, this.end));
    fm.lane = this.lane.trim() || "World";
    fm.category = this.category;
    if (this.location.trim()) fm.location = this.location.trim();
    const chars = this.characters.split(",").map((x) => x.trim()).filter(Boolean);
    if (chars.length) fm.characters = chars;
    try {
      await ensureFolder(this.app, this.plugin.settings.eventsFolder);
      const f = await this.app.vault.create(path, `---
${(0, import_obsidian6.stringifyYaml)(fm)}---

`);
      this.close();
      this.onCreated?.(f);
    } catch (err) {
      new import_obsidian6.Notice(`Couldn't create event: ${err.message}`);
    }
  }
  onClose() {
    this.contentEl.empty();
  }
};

// src/SettingsTab.ts
var import_obsidian7 = require("obsidian");
var StorySettingTab = class extends import_obsidian7.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }
  async save(redraw = false) {
    await this.plugin.saveSettings();
    this.plugin.refreshViews();
    if (redraw) this.display();
  }
  display() {
    const { containerEl } = this;
    const s = this.plugin.settings;
    containerEl.empty();
    containerEl.addClass("ct-settings");
    new import_obsidian7.Setting(containerEl).setName("Folders").setHeading();
    const folder = (name, desc, key) => new import_obsidian7.Setting(containerEl).setName(name).setDesc(desc).addText(
      (t) => t.setValue(s[key]).onChange(async (v) => {
        s[key] = v.trim();
        await this.save();
      })
    );
    folder("Characters folder", "Where the wizard saves new character notes.", "charactersFolder");
    folder("Events folder", "Where new event notes and the synced canvas go.", "eventsFolder");
    folder("Cities folder", 'Where "Create new city" saves city notes.', "citiesFolder");
    folder("Manuscript folder", 'Chapter notes here with pov: "[[Character]]" count toward POV totals.', "manuscriptFolder");
    new import_obsidian7.Setting(containerEl).setName("Character sheet").setHeading();
    new import_obsidian7.Setting(containerEl).setName("Default layout").setDesc("Full shows everything at a glance. Dossier uses a header with tabs.").addDropdown(
      (d) => d.addOptions({ full: "Full (three columns)", dossier: "Dossier (tabs)" }).setValue(s.defaultLayout).onChange(async (v) => {
        s.defaultLayout = v;
        await this.save();
      })
    );
    new import_obsidian7.Setting(containerEl).setName("Open character notes as sheets").setDesc("When you open a note with type: character, show the sheet instead of the editor. Use Edit to get back to Markdown.").addToggle(
      (t) => t.setValue(s.openSheetByDefault).onChange(async (v) => {
        s.openSheetByDefault = v;
        await this.save();
      })
    );
    new import_obsidian7.Setting(containerEl).setName("Calendar").setHeading();
    new import_obsidian7.Setting(containerEl).setName("Timeline name").addText(
      (t) => t.setValue(s.timelineName).onChange(async (v) => {
        s.timelineName = v;
        await this.save();
      })
    );
    new import_obsidian7.Setting(containerEl).setName("Era").setDesc("Name and abbreviation, e.g. Third Age / TA.").addText(
      (t) => t.setPlaceholder("Third Age").setValue(s.eraName).onChange(async (v) => {
        s.eraName = v;
        await this.save();
      })
    ).addText(
      (t) => t.setPlaceholder("TA").setValue(s.eraAbbr).onChange(async (v) => {
        s.eraAbbr = v;
        await this.save();
      })
    );
    new import_obsidian7.Setting(containerEl).setName("Current story year").setDesc("Used to compute ages.").addText((t) => {
      t.inputEl.type = "number";
      t.setValue(String(s.currentYear)).onChange(async (v) => {
        const n = Number(v);
        if (Number.isFinite(n)) {
          s.currentYear = n;
          await this.save();
        }
      });
    });
    const months = new import_obsidian7.Setting(containerEl).setName("Months").setDesc("Twelve month names, in order.");
    const mgrid = months.controlEl.createDiv({ cls: "ct-months-grid" });
    s.months.forEach((m, i) => {
      const input = mgrid.createEl("input", { type: "text", value: m });
      input.addEventListener("change", async () => {
        s.months[i] = input.value.trim() || `Month ${i + 1}`;
        await this.save();
      });
    });
    new import_obsidian7.Setting(containerEl).setName("Event categories").setHeading();
    s.categories.forEach((c, i) => {
      new import_obsidian7.Setting(containerEl).setClass("ct-compact-setting").addText((t) => t.setPlaceholder("key").setValue(c.key).onChange(async (v) => {
        c.key = v.trim();
        await this.save();
      })).addText((t) => t.setPlaceholder("Label").setValue(c.label).onChange(async (v) => {
        c.label = v;
        await this.save();
      })).addDropdown((d) => {
        THEME_COLORS.forEach((col) => d.addOption(col, col));
        d.setValue(c.color).onChange(async (v) => {
          c.color = v;
          await this.save();
        });
      }).addExtraButton((b) => b.setIcon("trash").setTooltip("Remove").onClick(async () => {
        s.categories.splice(i, 1);
        await this.save(true);
      }));
    });
    new import_obsidian7.Setting(containerEl).addButton(
      (b) => b.setButtonText("Add category").onClick(async () => {
        s.categories.push({ key: `category${s.categories.length + 1}`, label: "New category", color: "green" });
        await this.save(true);
      })
    );
    new import_obsidian7.Setting(containerEl).setName("Description fields").setHeading();
    containerEl.createDiv({ cls: "setting-item-description", text: "Fields are stored under description.<group>.<key> in the character's frontmatter. Colour fields store { text, color }. Enum options are comma-separated." });
    for (const g of Object.keys(GROUP_TITLES)) {
      new import_obsidian7.Setting(containerEl).setName(GROUP_TITLES[g]).setClass("ct-subheading");
      const list = s.descFields[g];
      list.forEach((f, i) => {
        const row = new import_obsidian7.Setting(containerEl).setClass("ct-compact-setting").addText((t) => t.setPlaceholder("key").setValue(f.key).onChange(async (v) => {
          f.key = v.trim().replace(/\s+/g, "_");
          await this.save();
        })).addText((t) => t.setPlaceholder("Label").setValue(f.label).onChange(async (v) => {
          f.label = v;
          await this.save();
        })).addDropdown(
          (d) => d.addOptions({ text: "Text", color: "Colour", enum: "Choice", textarea: "Long text" }).setValue(f.type).onChange(async (v) => {
            f.type = v;
            await this.save(true);
          })
        );
        if (f.type === "enum")
          row.addText((t) => t.setPlaceholder("Option A, Option B").setValue(f.options ?? "").onChange(async (v) => {
            f.options = v;
            await this.save();
          }));
        row.addExtraButton((b) => b.setIcon("arrow-up").setTooltip("Move up").setDisabled(i === 0).onClick(async () => {
          if (i === 0) return;
          [list[i - 1], list[i]] = [list[i], list[i - 1]];
          await this.save(true);
        })).addExtraButton((b) => b.setIcon("arrow-down").setTooltip("Move down").setDisabled(i === list.length - 1).onClick(async () => {
          if (i === list.length - 1) return;
          [list[i + 1], list[i]] = [list[i], list[i + 1]];
          await this.save(true);
        })).addExtraButton((b) => b.setIcon("trash").setTooltip("Remove").onClick(async () => {
          list.splice(i, 1);
          await this.save(true);
        }));
      });
      new import_obsidian7.Setting(containerEl).addButton(
        (b) => b.setButtonText(`Add ${GROUP_TITLES[g].toLowerCase()} field`).onClick(async () => {
          list.push({ key: `field${list.length + 1}`, label: "New field", type: "text" });
          await this.save(true);
        })
      );
    }
    new import_obsidian7.Setting(containerEl).setName("City sheet").setHeading();
    containerEl.createDiv({ cls: "setting-item-description", text: '"At a glance" rows read these frontmatter keys. Values can be text, [[links]], lists or calendar dates ({ month, year }).' });
    s.cityFields.forEach((f, i) => {
      new import_obsidian7.Setting(containerEl).setClass("ct-compact-setting").addText((t) => t.setPlaceholder("key").setValue(f.key).onChange(async (v) => {
        f.key = v.trim().replace(/s+/g, "_");
        await this.save();
      })).addText((t) => t.setPlaceholder("Label").setValue(f.label).onChange(async (v) => {
        f.label = v;
        await this.save();
      })).addExtraButton((b) => b.setIcon("arrow-up").setTooltip("Move up").setDisabled(i === 0).onClick(async () => {
        if (i === 0) return;
        [s.cityFields[i - 1], s.cityFields[i]] = [s.cityFields[i], s.cityFields[i - 1]];
        await this.save(true);
      })).addExtraButton((b) => b.setIcon("arrow-down").setTooltip("Move down").setDisabled(i === s.cityFields.length - 1).onClick(async () => {
        if (i === s.cityFields.length - 1) return;
        [s.cityFields[i + 1], s.cityFields[i]] = [s.cityFields[i], s.cityFields[i + 1]];
        await this.save(true);
      })).addExtraButton((b) => b.setIcon("trash").setTooltip("Remove").onClick(async () => {
        s.cityFields.splice(i, 1);
        await this.save(true);
      }));
    });
    new import_obsidian7.Setting(containerEl).addButton(
      (b) => b.setButtonText("Add field").onClick(async () => {
        s.cityFields.push({ key: `field${s.cityFields.length + 1}`, label: "New field" });
        await this.save(true);
      })
    );
    new import_obsidian7.Setting(containerEl).setName("Tables").setClass("ct-subheading");
    containerEl.createDiv({ cls: "setting-item-description", text: "Each table reads a frontmatter list of objects, e.g. districts: [{ name, character, notes }]. Columns are the object keys, comma-separated." });
    s.cityTables.forEach((t, i) => {
      new import_obsidian7.Setting(containerEl).setClass("ct-compact-setting").addText((x) => x.setPlaceholder("key").setValue(t.key).onChange(async (v) => {
        t.key = v.trim();
        await this.save();
      })).addText((x) => x.setPlaceholder("Title").setValue(t.title).onChange(async (v) => {
        t.title = v;
        await this.save();
      })).addText((x) => x.setPlaceholder("name, kind, notes").setValue(t.columns).onChange(async (v) => {
        t.columns = v;
        await this.save();
      })).addExtraButton((b) => b.setIcon("trash").setTooltip("Remove").onClick(async () => {
        s.cityTables.splice(i, 1);
        await this.save(true);
      }));
    });
    new import_obsidian7.Setting(containerEl).addButton(
      (b) => b.setButtonText("Add table").onClick(async () => {
        s.cityTables.push({ key: "trade", title: "Trade", columns: "good, partner, notes" });
        await this.save(true);
      })
    );
    new import_obsidian7.Setting(containerEl).setName("Attributes (creation wizard)").setHeading();
    const num = (name, desc, key) => new import_obsidian7.Setting(containerEl).setName(name).setDesc(desc).addText((t) => {
      t.inputEl.type = "number";
      t.setValue(String(s[key])).onChange(async (v) => {
        const n = Number(v);
        if (Number.isFinite(n)) {
          s[key] = n;
          await this.save();
        }
      });
    });
    num("Point pool", "Points to spend above the base.", "pointPool");
    num("Base value", "Every stat starts here.", "statBase");
    num("Minimum", "Lowest allowed stat.", "statMin");
    num("Maximum", "Highest allowed stat; also the radar's outer ring.", "statMax");
    new import_obsidian7.Setting(containerEl).setName("Canvas").setHeading();
    new import_obsidian7.Setting(containerEl).setName("Reverse sync from canvas (experimental)").setDesc('When you drag an event card sideways in the synced canvas and it saves, re-date the event note. Only cards created by "Sync timeline to canvas" are affected.').addToggle(
      (t) => t.setValue(s.canvasReverseSync).onChange(async (v) => {
        s.canvasReverseSync = v;
        await this.save();
      })
    );
  }
};

// src/views/CharacterView.ts
var import_obsidian9 = require("obsidian");

// src/views/NoteSheetView.ts
var import_obsidian8 = require("obsidian");
var NoteSheetView = class extends import_obsidian8.ItemView {
  constructor(leaf, plugin) {
    super(leaf);
    this.plugin = plugin;
    this.file = null;
    this.renderComp = null;
    this.renderToken = 0;
  }
  /** Header actions specific to the subclass. */
  addViewActions() {
  }
  /** The "Edit" button plus a wand icon button that opens the wizard editor. */
  editButtons(parent) {
    button(parent, "Edit", () => this.editSource()).setAttr("aria-label", "Edit the Markdown");
    const wand = button(parent, "", () => this.openEditor(), "ct-btn is-icon");
    wand.setAttr("aria-label", "Edit in wizard");
    (0, import_obsidian8.setIcon)(wand, "wand-sparkles");
  }
  getDisplayText() {
    return this.file?.basename ?? this.fallbackTitle;
  }
  refreshTitle() {
    this.leaf.updateHeader?.();
    this.titleEl?.setText(this.getDisplayText());
  }
  async onOpen() {
    this.contentEl.addClass("ct-view");
    this.addViewActions();
    this.addAction("pencil", "Edit note", () => this.editSource());
    this.addAction("wand-sparkles", "Edit in wizard", () => this.openEditor());
    this.registerEvent(
      this.app.metadataCache.on("changed", (f) => {
        if (f === this.file) this.render();
      })
    );
    this.registerEvent(
      this.app.vault.on("rename", (f) => {
        if (f === this.file) {
          this.refreshTitle();
          this.render();
        }
      })
    );
    this.registerEvent(
      this.app.vault.on("delete", (f) => {
        if (f === this.file) {
          this.file = null;
          this.render();
        }
      })
    );
    this.render();
  }
  getState() {
    return { file: this.file?.path };
  }
  async setState(state, result) {
    if (state.file) {
      const f = this.app.vault.getAbstractFileByPath(state.file);
      this.file = f instanceof import_obsidian8.TFile ? f : null;
    }
    this.refreshTitle();
    await this.render();
    return super.setState(state, result);
  }
  async editSource() {
    if (!this.file) return;
    this.plugin.markEditing(this.leaf, this.file.path);
    await this.leaf.setViewState({ type: "markdown", state: { file: this.file.path, mode: "source" } });
  }
  async update(fn) {
    if (this.file) await this.app.fileManager.processFrontMatter(this.file, fn);
  }
  async render() {
    const token = ++this.renderToken;
    const root = this.contentEl;
    const scroll = root.scrollTop;
    if (this.renderComp) this.removeChild(this.renderComp);
    this.renderComp = this.addChild(new import_obsidian8.Component());
    root.empty();
    const file = this.file;
    const fm = file ? this.app.metadataCache.getFileCache(file)?.frontmatter : null;
    if (!file || !fm || fm.type !== this.noteType) {
      this.renderEmpty(root);
      return;
    }
    const body = await this.readBody(file);
    if (token !== this.renderToken) return;
    this.renderSheet(root, file, fm, body);
    root.scrollTop = scroll;
  }
  async readBody(file) {
    const text = await this.app.vault.cachedRead(file);
    const end = this.app.metadataCache.getFileCache(file)?.frontmatterPosition?.end.offset;
    return (end != null ? text.slice(end) : text).trim();
  }
  renderMarkdown(el, body, file, emptyText) {
    if (!body) {
      el.createDiv({ cls: "ct-faint", text: emptyText });
      return;
    }
    import_obsidian8.MarkdownRenderer.render(this.app, body, el, file.path, this.renderComp);
  }
  async onClose() {
    this.contentEl.empty();
  }
};

// src/views/CharacterView.ts
var VIEW_CHARACTER = "character-sheet";
var VITAL_COLORS = ["red", "green", "blue", "purple"];
var GROUPS = ["appearance", "personality", "narration"];
var TABS = [["overview", "Overview"], ["desc", "Description"], ["rel", "Relationships"], ["inv", "Inventory"], ["lore", "Lore"]];
var CharacterView = class extends NoteSheetView {
  constructor() {
    super(...arguments);
    this.noteType = "character";
    this.fallbackTitle = "Character sheet";
    this.tab = "overview";
    this.layoutOverride = null;
  }
  getViewType() {
    return VIEW_CHARACTER;
  }
  getIcon() {
    return "user-round";
  }
  get layout() {
    return this.layoutOverride ?? this.plugin.settings.defaultLayout;
  }
  openEditor() {
    if (this.file) this.plugin.openWizard(this.file);
  }
  addViewActions() {
    this.addAction("layout-panel-left", "Switch sheet layout", () => {
      this.layoutOverride = this.layout === "full" ? "dossier" : "full";
      this.app.workspace.requestSaveLayout();
      this.render();
    });
  }
  getState() {
    return { ...super.getState(), tab: this.tab, layout: this.layoutOverride ?? void 0 };
  }
  async setState(state, result) {
    if (state.tab) this.tab = state.tab;
    if (state.layout) this.layoutOverride = state.layout;
    return super.setState(state, result);
  }
  renderSheet(root, file, fm, body) {
    const c = parseCharacter(fm, file.basename);
    if (this.layout === "dossier") this.renderDossier(root, file, c, body);
    else this.renderFull(root, file, c, body);
  }
  renderEmpty(root) {
    const box = root.createDiv({ cls: "ct-empty" });
    (0, import_obsidian9.setIcon)(box.createDiv({ cls: "ct-empty-icon" }), "user-round");
    box.createDiv({ cls: "ct-empty-title", text: this.file ? "This note isn't a character" : "No character selected" });
    box.createDiv({ cls: "ct-empty-text", text: "Character notes have type: character in their frontmatter." });
    button(box, "Create new character", () => this.plugin.openWizard(), "ct-btn mod-cta");
  }
  // ---------- shared pieces ----------
  renderPortrait(parent, c, file, cls) {
    const src = resolveImage(this.app, c.portrait, file.path);
    const box = parent.createDiv({ cls: `${cls} ${src ? "" : "is-empty"}`, attr: { "aria-label": "Choose portrait" } });
    if (src) box.createEl("img", { attr: { src, alt: c.name } });
    else box.setText("portrait");
    box.addEventListener(
      "click",
      () => new ImagePickerModal(this.app, (img) => this.update((fm) => fm.portrait = `[[${img.name}]]`)).open()
    );
  }
  renderVital(parent, v, i, thin = false) {
    const row = parent.createDiv({ cls: "ct-vital" });
    const head = row.createDiv({ cls: "ct-vital-head" });
    head.createSpan({ text: v.name.charAt(0).toUpperCase() + v.name.slice(1) });
    const val = head.createSpan({ cls: "ct-mono ct-editable", text: `${v.cur} / ${v.max}`, attr: { "aria-label": "Click to edit" } });
    const track = row.createDiv({ cls: `ct-bar ${thin ? "is-thin" : ""}` });
    const fill = track.createDiv({ cls: "ct-bar-fill" });
    fill.style.width = `${v.max > 0 ? Math.max(0, Math.min(100, v.cur / v.max * 100)) : 0}%`;
    fill.style.background = `var(--color-${VITAL_COLORS[i % VITAL_COLORS.length]})`;
    val.addEventListener("click", () => {
      const input = createEl("input", { type: "text", cls: "ct-inline-input", value: `${v.cur} / ${v.max}` });
      val.replaceWith(input);
      input.focus();
      input.select();
      let done = false;
      const commit = async (save) => {
        if (done) return;
        done = true;
        const m = /^\s*(-?\d+(?:\.\d+)?)\s*(?:\/\s*(-?\d+(?:\.\d+)?))?\s*$/.exec(input.value);
        if (save && m) {
          const cur = Number(m[1]);
          const max = m[2] != null ? Number(m[2]) : v.max;
          await this.update((fm) => {
            fm.vitals = fm.vitals ?? {};
            fm.vitals[v.name] = [cur, max];
          });
        } else this.render();
      };
      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") commit(true);
        if (e.key === "Escape") commit(false);
      });
      input.addEventListener("blur", () => commit(true));
    });
  }
  renderTraitPills(parent, c) {
    const wrap = parent.createDiv({ cls: "ct-pills" });
    c.traits.forEach((t) => pill(wrap, t, "green"));
    c.values.forEach((t) => pill(wrap, `Values: ${t.toLowerCase()}`, "blue"));
    c.weaknesses.forEach((t) => pill(wrap, t, "red"));
    if (!wrap.childElementCount) wrap.createSpan({ cls: "ct-faint", text: "\u2014" });
  }
  bornText(c) {
    if (!c.born) return "";
    const cal = this.plugin.calendar;
    const abbr = this.plugin.settings.eraAbbr;
    return `${cal.format(c.born)}${abbr ? " " + abbr : ""} \xB7 age ${cal.age(c.born)}`;
  }
  toggleGoal(i) {
    return this.update((fm) => {
      const g = fm.goals?.[i];
      if (g == null) return;
      if (typeof g === "object") g.done = !g.done;
      else fm.goals[i] = { text: String(g), done: true };
    });
  }
  renderGoal(parent, g, i) {
    const row = parent.createDiv({ cls: `ct-goal ${g.done ? "is-done" : ""}` });
    const box = row.createSpan({ cls: "ct-check", attr: { role: "checkbox", "aria-checked": String(g.done), tabindex: "0" } });
    if (g.done) (0, import_obsidian9.setIcon)(box, "check");
    row.createSpan({ text: g.text });
    box.addEventListener("click", () => this.toggleGoal(i));
    box.addEventListener("keydown", (e) => {
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        this.toggleGoal(i);
      }
    });
  }
  scoreEl(parent, score) {
    const txt = score > 0 ? `+${score}` : score < 0 ? `\u2212${Math.abs(score)}` : "0";
    parent.createSpan({ cls: `ct-score ct-mono ${score > 0 ? "is-pos" : score < 0 ? "is-neg" : ""}`, text: txt });
  }
  renderRelation(parent, r, file, card = false) {
    const row = parent.createDiv({ cls: card ? "ct-rel-card" : "ct-rel" });
    const name = parseLink(r.who).display;
    row.createSpan({ cls: "ct-avatar", text: initials(name) });
    const mid = row.createDiv({ cls: "ct-rel-mid" });
    renderLinkish(this.app, mid, r.who, file.path, "ct-rel-name");
    if (r.kind) mid.createSpan({ cls: "ct-rel-kind", text: r.kind });
    this.scoreEl(row, r.score);
  }
  backlinks(file) {
    const out = [];
    const resolved = this.app.metadataCache.resolvedLinks;
    for (const src in resolved) {
      if (src !== file.path && resolved[src][file.path]) {
        const f = this.app.vault.getAbstractFileByPath(src);
        if (f instanceof import_obsidian9.TFile) out.push(f);
      }
    }
    return out.sort((a, b) => b.stat.mtime - a.stat.mtime);
  }
  /** Chapters in the manuscript folder, and how many have `pov` linking to this character. */
  povCount(file) {
    const folder = this.plugin.settings.manuscriptFolder.replace(/^\/+|\/+$/g, "");
    if (!folder) return null;
    const chapters = this.app.vault.getMarkdownFiles().filter((f) => f.path.startsWith(folder + "/"));
    if (!chapters.length) return null;
    let pov = 0;
    for (const ch of chapters) {
      const raw = this.app.metadataCache.getFileCache(ch)?.frontmatter?.pov;
      const list = Array.isArray(raw) ? raw : raw ? [raw] : [];
      if (list.some((p) => this.app.metadataCache.getFirstLinkpathDest(linkBasename(String(p)), ch.path) === file)) pov++;
    }
    return { pov, total: chapters.length };
  }
  renderLinked(parent, file) {
    const links = this.backlinks(file);
    const sec = parent.createDiv({ cls: "ct-stack-6" });
    sectionLabel(sec, `Linked notes \xB7 ${links.length}`);
    if (!links.length) sec.createSpan({ cls: "ct-faint ct-13", text: "No notes link here yet." });
    for (const l of links.slice(0, 3)) renderLinkish(this.app, sec, `[[${l.path.replace(/\.md$/, "")}|${l.basename}]]`, file.path, "ct-13");
  }
  headerButtons(parent, file) {
    const btns = parent.createDiv({ cls: "ct-header-btns" });
    this.editButtons(btns);
    button(btns, "Show on timeline", () => this.plugin.openTimeline({ focusLane: file.basename }));
  }
  descValue(c, group, key) {
    return c.description[group]?.[key];
  }
  // ---------- 1a: full three-column layout ----------
  renderFull(root, file, c, body) {
    const page = root.createDiv({ cls: "ct-sheet" });
    const header = page.createDiv({ cls: "ct-sheet-header" });
    const titles = header.createDiv({ cls: "ct-stack-6" });
    titles.createDiv({ cls: "ct-breadcrumb", text: (file.parent?.path ?? "").split("/").filter(Boolean).join(" / ") || "Vault" });
    titles.createDiv({ cls: "ct-name", text: c.name });
    if (c.quote) titles.createDiv({ cls: "ct-quote", text: `\u201C${c.quote}\u201D` });
    this.headerButtons(header, file);
    const grid = page.createDiv({ cls: "ct-grid" });
    const left = grid.createDiv({ cls: "ct-col ct-col-left" });
    this.renderPortrait(left, c, file, "ct-portrait");
    if (c.vitals.length) {
      const v = left.createDiv({ cls: "ct-stack-10" });
      sectionLabel(v, "Vitals");
      c.vitals.forEach((vit, i) => this.renderVital(v, vit, i));
    }
    const t = left.createDiv({ cls: "ct-stack-8" });
    sectionLabel(t, "Traits");
    this.renderTraitPills(t, c);
    const mid = grid.createDiv({ cls: "ct-col ct-col-mid" });
    const props = mid.createDiv({ cls: "ct-props" });
    const prop = (k, fill) => {
      const row = props.createDiv({ cls: "ct-prop" });
      row.createSpan({ cls: "ct-prop-key", text: k });
      fill(row.createDiv({ cls: "ct-prop-val" }));
    };
    if (c.role) prop("Role", (el) => el.setText(c.role));
    if (c.ancestry) prop("Ancestry", (el) => el.setText(c.ancestry));
    if (c.born) prop("Born", (el) => el.setText(this.bornText(c)));
    if (c.affiliation) prop("Affiliation", (el) => renderLinkish(this.app, el, c.affiliation, file.path));
    if (c.faction)
      prop("Faction", (el) => {
        el.addClass("ct-row-8");
        renderLinkish(this.app, el, c.faction, file.path);
        if (c.factionTag) pill(el, c.factionTag, "purple", "ct-pill is-small");
      });
    if (c.status) prop("Status", (el) => el.createSpan({ cls: "ct-status-text", text: c.status }));
    if (STAT_KEYS.some((k) => c.stats[k])) {
      const r = mid.createDiv({ cls: "ct-radar-wrap" });
      renderRadar(r, STAT_KEYS.map((k) => c.stats[k]), this.plugin.settings.statMax);
    }
    const bs = mid.createDiv({ cls: "ct-stack-8" });
    bs.createDiv({ cls: "ct-h16", text: "Backstory" });
    this.renderMarkdown(bs.createDiv({ cls: "ct-body markdown-rendered" }), body, file, "Nothing written yet. Use Edit to add backstory in the note body.");
    const right = grid.createDiv({ cls: "ct-col ct-col-right" });
    const goals = right.createDiv({ cls: "ct-stack-8" });
    sectionLabel(goals, "Goals");
    if (!c.goals.length) goals.createSpan({ cls: "ct-faint ct-13", text: "\u2014" });
    c.goals.forEach((g, i) => this.renderGoal(goals, g, i));
    const rels = right.createDiv({ cls: "ct-stack-8" });
    sectionLabel(rels, "Relationships");
    if (!c.relationships.length) rels.createSpan({ cls: "ct-faint ct-13", text: "\u2014" });
    c.relationships.forEach((r) => this.renderRelation(rels, r, file));
    const inv = right.createDiv({ cls: "ct-stack-6" });
    sectionLabel(inv, "Inventory");
    if (!c.inventory.length) inv.createSpan({ cls: "ct-faint ct-13", text: "\u2014" });
    for (const it of c.inventory) {
      const row = inv.createDiv({ cls: "ct-inv" });
      row.createSpan({ text: it.item + (it.qty && it.qty !== "1" && it.tag !== "currency" ? ` \xD7${it.qty}` : "") });
      const tag = it.tag === "currency" ? it.qty : it.tag;
      row.createSpan({ cls: `ct-inv-tag ${it.tag === "quest" ? "is-quest" : ""} ${it.tag === "currency" ? "ct-mono" : ""}`, text: tag });
    }
    this.renderLinked(right, file);
    this.renderDescriptionFull(page, file, c);
  }
  renderDescriptionFull(page, file, c) {
    const s = this.plugin.settings;
    const sec = page.createDiv({ cls: "ct-desc" });
    const head = sec.createDiv({ cls: "ct-desc-head" });
    head.createDiv({ cls: "ct-h18", text: "Description" });
    head.createDiv({ cls: "ct-faint ct-12", text: "Writer's reference \xB7 used when drafting" });
    const cols = sec.createDiv({ cls: "ct-desc-grid" });
    const pov = this.povCount(file);
    for (const g of GROUPS) {
      const col = cols.createDiv({ cls: "ct-stack-0" });
      col.createDiv({ cls: "ct-desc-group", text: GROUP_TITLES[g] });
      for (const f of s.descFields[g]) {
        if (f.key === "voice_sample") continue;
        this.descRow(col, f.label, this.descValue(c, g, f.key), f.type === "color");
      }
      if (g === "narration") {
        if (c.storyRole) this.descRow(col, "Role", { text: c.storyRole }, false);
        if (pov) this.descRow(col, "Chapters", { text: `${pov.pov} of ${pov.total} from this POV` }, false);
      }
    }
    const sample = this.descValue(c, "narration", "voice_sample")?.text;
    const pv = this.descValue(c, "narration", "pov")?.text;
    const tense = this.descValue(c, "narration", "tense")?.text;
    if (sample || pv || tense) {
      const card = sec.createDiv({ cls: "ct-voice" });
      const row = card.createDiv({ cls: "ct-voice-head" });
      row.createSpan({ cls: "ct-label", text: "Voice sample" });
      if (pv) row.createSpan({ cls: "ct-chip", text: pv });
      if (tense) row.createSpan({ cls: "ct-chip", text: `${tense} tense` });
      if (pov) row.createSpan({ cls: "ct-chip", text: `POV in ${pov.pov} / ${pov.total} chapters` });
      card.createDiv({ cls: "ct-voice-text", text: sample ? `\u201C${sample.replace(/^["“]|["”]$/g, "")}\u201D` : "No voice sample yet." });
    }
  }
  descRow(parent, label, v, isColor) {
    const row = parent.createDiv({ cls: "ct-desc-row" });
    row.createSpan({ cls: "ct-faint", text: label });
    const val = row.createSpan({ cls: "ct-desc-val" });
    if (isColor && v?.color) {
      const sw = val.createSpan({ cls: "ct-swatch" });
      sw.style.background = v.color;
    }
    if (v?.text) val.appendText(v.text);
    else val.createSpan({ cls: "ct-faint", text: "\u2014" });
  }
  // ---------- 1b: dossier layout ----------
  renderDossier(root, file, c, body) {
    const page = root.createDiv({ cls: "ct-dossier" });
    const header = page.createDiv({ cls: "ct-dossier-header" });
    this.renderPortrait(header, c, file, "ct-dossier-portrait");
    const info = header.createDiv({ cls: "ct-dossier-info" });
    const top = info.createDiv({ cls: "ct-row-8" });
    if (c.status) pill(top, c.status, "orange", "ct-pill is-status");
    const sub = [c.storyRole, this.plugin.settings.timelineName].filter(Boolean).join(" \xB7 ");
    if (sub) top.createSpan({ cls: "ct-muted ct-12", text: sub });
    info.createDiv({ cls: "ct-dossier-name", text: c.name });
    const meta = info.createDiv({ cls: "ct-dossier-meta" });
    if (c.role) meta.createSpan({ text: c.role });
    if (c.ancestry) meta.createSpan({ text: c.ancestry });
    if (c.born) meta.createSpan({ text: this.bornText(c) });
    if (c.affiliation) renderLinkish(this.app, meta.createSpan(), c.affiliation, file.path);
    if (c.faction) {
      const f = meta.createSpan({ cls: "ct-row-6" });
      f.createSpan({ cls: "ct-faint", text: "Faction" });
      renderLinkish(this.app, f, c.faction, file.path);
    }
    this.headerButtons(header, file);
    const bar = page.createDiv({ cls: "ct-tabs" });
    for (const [k, label] of TABS) {
      const t = bar.createDiv({ cls: `ct-tab ${this.tab === k ? "is-active" : ""}`, text: label });
      t.addEventListener("click", () => {
        this.tab = k;
        this.app.workspace.requestSaveLayout();
        this.render();
      });
    }
    const content = page.createDiv({ cls: "ct-dossier-content" });
    switch (this.tab) {
      case "overview":
        this.dossierOverview(content, c);
        break;
      case "desc":
        this.dossierDescription(content, file, c);
        break;
      case "rel": {
        const grid = content.createDiv({ cls: "ct-rel-grid" });
        if (!c.relationships.length) content.createDiv({ cls: "ct-faint", text: "No relationships yet." });
        c.relationships.forEach((r) => this.renderRelation(grid, r, file, true));
        break;
      }
      case "inv": {
        const tbl = content.createDiv({ cls: "ct-inv-table" });
        if (!c.inventory.length) content.createDiv({ cls: "ct-faint", text: "Inventory is empty." });
        for (const it of c.inventory) {
          const row = tbl.createDiv({ cls: "ct-inv-row" });
          row.createSpan({ text: it.item });
          row.createSpan({ cls: `ct-inv-tag ${it.tag === "quest" ? "is-quest" : ""}`, text: it.tag });
          row.createSpan({ cls: "ct-mono ct-right", text: it.qty });
        }
        break;
      }
      case "lore": {
        const lore = content.createDiv({ cls: "ct-lore markdown-rendered" });
        this.renderMarkdown(lore, body, file, "Nothing written yet. Use Edit to add backstory in the note body.");
        this.renderLinked(content.createDiv({ cls: "ct-lore-links" }), file);
        break;
      }
    }
  }
  dossierOverview(content, c) {
    const grid = content.createDiv({ cls: "ct-overview" });
    const left = grid.createDiv({ cls: "ct-stack-16" });
    renderRadar(left, STAT_KEYS.map((k) => c.stats[k]), this.plugin.settings.statMax);
    const tiles = left.createDiv({ cls: "ct-stat-tiles" });
    for (const k of STAT_KEYS) {
      const tile = tiles.createDiv({ cls: "ct-stat-tile" });
      tile.createDiv({ cls: "ct-stat-key", text: k.toUpperCase() });
      tile.createDiv({ cls: "ct-stat-val", text: String(c.stats[k]) });
    }
    const right = grid.createDiv({ cls: "ct-stack-24" });
    if (c.vitals.length) {
      const v = right.createDiv({ cls: "ct-stack-10" });
      sectionLabel(v, "Vitals");
      const vg = v.createDiv({ cls: "ct-vitals-2col" });
      c.vitals.forEach((vit, i) => this.renderVital(vg, vit, i, true));
    }
    const tvw = right.createDiv({ cls: "ct-tvw" });
    const list = (label, color, items) => {
      const col = tvw.createDiv({ cls: "ct-stack-6" });
      const l = sectionLabel(col, label);
      l.style.color = `var(--color-${color})`;
      if (!items.length) col.createSpan({ cls: "ct-faint ct-13", text: "\u2014" });
      items.forEach((t) => col.createDiv({ cls: "ct-13", text: t }));
    };
    list("Traits", "green", c.traits);
    list("Values", "blue", c.values);
    list("Weaknesses", "red", c.weaknesses);
    const active = c.goals.find((g) => !g.done);
    if (active) {
      const card = right.createDiv({ cls: "ct-card" });
      sectionLabel(card, "Active goal");
      card.createDiv({ cls: "ct-14", text: active.text });
    }
  }
  dossierDescription(content, file, c) {
    const s = this.plugin.settings;
    const wrap = content.createDiv({ cls: "ct-stack-24" });
    const pov = this.povCount(file);
    for (const g of GROUPS) {
      const row = wrap.createDiv({ cls: "ct-ddesc-row" });
      row.createDiv({ cls: "ct-desc-group", text: GROUP_TITLES[g] });
      const fields = row.createDiv({ cls: "ct-ddesc-fields" });
      const add = (label, v, isColor) => {
        const f = fields.createDiv({ cls: "ct-ddesc-field" });
        f.createDiv({ cls: "ct-faint ct-11", text: label });
        const val = f.createDiv({ cls: "ct-13 ct-desc-val" });
        if (isColor && v?.color) val.createSpan({ cls: "ct-swatch" }).style.background = v.color;
        if (v?.text) val.appendText(v.text);
        else val.createSpan({ cls: "ct-faint", text: "\u2014" });
      };
      for (const f of s.descFields[g]) {
        if (f.key === "voice_sample") continue;
        add(f.label, this.descValue(c, g, f.key), f.type === "color");
      }
      if (g === "narration" && pov) add("Chapters", { text: `${pov.pov} of ${pov.total} from this POV` }, false);
    }
    const sample = this.descValue(c, "narration", "voice_sample")?.text;
    if (sample) {
      const row = wrap.createDiv({ cls: "ct-ddesc-row" });
      row.createDiv({ cls: "ct-desc-group", text: "Voice sample" });
      row.createDiv({ cls: "ct-voice-text", text: `\u201C${sample.replace(/^["“]|["”]$/g, "")}\u201D` });
    }
  }
};

// src/views/CityView.ts
var import_obsidian10 = require("obsidian");
var VIEW_CITY = "city-sheet";
var MIN_SLOTS = 3;
var MAX_SLOTS = 5;
var asList2 = (v) => Array.isArray(v) ? v : v == null || v === "" ? [] : [v];
var CityView = class extends NoteSheetView {
  constructor() {
    super(...arguments);
    this.noteType = "city";
    this.fallbackTitle = "City";
  }
  getViewType() {
    return VIEW_CITY;
  }
  getIcon() {
    return "castle";
  }
  openEditor() {
    if (this.file) this.plugin.openCityModal(this.file);
  }
  renderEmpty(root) {
    const box = root.createDiv({ cls: "ct-empty" });
    (0, import_obsidian10.setIcon)(box.createDiv({ cls: "ct-empty-icon" }), "castle");
    box.createDiv({ cls: "ct-empty-title", text: this.file ? "This note isn't a city" : "No city selected" });
    box.createDiv({ cls: "ct-empty-text", text: "City notes have type: city in their frontmatter." });
    button(box, "Create new city", () => this.plugin.openCityModal(), "ct-btn mod-cta");
  }
  renderSheet(root, file, fm, body) {
    const page = root.createDiv({ cls: "ct-sheet ct-city" });
    const header = page.createDiv({ cls: "ct-sheet-header" });
    const titles = header.createDiv({ cls: "ct-stack-6" });
    titles.createDiv({ cls: "ct-breadcrumb", text: (file.parent?.path ?? "").split("/").filter(Boolean).join(" / ") || "Vault" });
    titles.createDiv({ cls: "ct-name", text: String(fm.name ?? "") || file.basename });
    if (fm.motto) titles.createDiv({ cls: "ct-quote", text: `\u201C${String(fm.motto).replace(/^["“]|["”]$/g, "")}\u201D` });
    const btns = header.createDiv({ cls: "ct-header-btns" });
    this.editButtons(btns);
    button(btns, "Add image", () => this.pickImage());
    this.renderGallery(page, file, fm);
    const grid = page.createDiv({ cls: "ct-city-grid" });
    const desc = grid.createDiv({ cls: "ct-stack-8" });
    desc.createDiv({ cls: "ct-h16", text: "Description" });
    this.renderMarkdown(desc.createDiv({ cls: "ct-body markdown-rendered" }), body, file, "Nothing written yet. Use Edit to describe the city in the note body.");
    this.renderGlance(grid.createDiv({ cls: "ct-stack-8" }), file, fm);
    for (const t of this.plugin.settings.cityTables) this.renderTable(page, file, fm, t.key, t.title, t.columns);
    const bottom = page.createDiv({ cls: "ct-city-bottom" });
    this.renderPeople(bottom.createDiv({ cls: "ct-stack-8" }), file, fm);
    this.renderEvents(bottom.createDiv({ cls: "ct-stack-8" }), file);
  }
  // ---------- gallery ----------
  images(fm) {
    return asList2(fm.images ?? fm.image).map(String).filter(Boolean);
  }
  pickImage() {
    new ImagePickerModal(
      this.app,
      (img) => this.update((fm) => {
        const list = asList2(fm.images ?? fm.image).map(String);
        delete fm.image;
        fm.images = [...list, `[[${img.name}]]`];
      })
    ).open();
  }
  removeImage(index) {
    return this.update((fm) => {
      const list = asList2(fm.images ?? fm.image).map(String);
      list.splice(index, 1);
      delete fm.image;
      fm.images = list;
    });
  }
  renderGallery(page, file, fm) {
    const raw = this.images(fm);
    const all = raw.map((r) => ({ raw: r, src: resolveImage(this.app, r, file.path), name: parseLink(r).display }));
    const viewable = all.filter((i) => i.src).map((i) => ({ src: i.src, name: i.name }));
    const shown = all.slice(0, MAX_SLOTS);
    const slots = Math.min(MAX_SLOTS, Math.max(MIN_SLOTS, shown.length + (shown.length < MAX_SLOTS ? 1 : 0)));
    const gallery = page.createDiv({ cls: "ct-gallery" });
    gallery.style.setProperty("--ct-slots", String(slots - 1));
    for (let i = 0; i < slots; i++) {
      const img = shown[i];
      const slot = gallery.createDiv({ cls: `ct-gallery-slot ${i === 0 ? "is-hero" : ""}` });
      if (!img) {
        slot.addClass("is-empty");
        slot.setAttr("aria-label", "Add image");
        (0, import_obsidian10.setIcon)(slot.createSpan({ cls: "ct-gallery-add" }), "image-plus");
        slot.addEventListener("click", () => this.pickImage());
        continue;
      }
      if (img.src) slot.createEl("img", { attr: { src: img.src, alt: img.name, loading: "lazy" } });
      else {
        slot.addClass("is-missing");
        slot.createSpan({ cls: "ct-mono ct-12", text: `missing: ${img.name}` });
      }
      const extra = all.length - MAX_SLOTS;
      if (i === MAX_SLOTS - 1 && extra > 0) slot.createDiv({ cls: "ct-gallery-more", text: `+${extra}` });
      const rm = slot.createEl("button", { cls: "ct-gallery-remove", attr: { "aria-label": "Remove image from city" } });
      (0, import_obsidian10.setIcon)(rm, "x");
      rm.addEventListener("click", (e) => {
        e.stopPropagation();
        this.removeImage(i);
      });
      if (img.src) {
        const at = viewable.findIndex((v) => v.src === img.src);
        slot.addEventListener("click", () => new ImageLightbox(this.app, viewable, Math.max(0, at)).open());
      }
    }
  }
  // ---------- tables ----------
  /** Renders any frontmatter value: lists, calendar dates, numbers, or text with [[links]]. */
  renderValue(el, raw, sourcePath) {
    if (raw == null || raw === "") {
      el.createSpan({ cls: "ct-faint", text: "\u2014" });
      return;
    }
    if (Array.isArray(raw)) {
      raw.forEach((v, i) => {
        if (i) el.appendText(", ");
        this.renderValue(el, v, sourcePath);
      });
      return;
    }
    if (typeof raw === "object") {
      const d = parseDate(raw);
      if (d) {
        const abbr = this.plugin.settings.eraAbbr;
        const years = this.plugin.settings.currentYear - d.year;
        el.appendText(`${this.plugin.calendar.format(d)}${abbr ? " " + abbr : ""}${years > 0 ? ` \xB7 ${years} years ago` : ""}`);
      } else el.appendText(JSON.stringify(raw));
      return;
    }
    if (typeof raw === "number") {
      el.appendText(raw.toLocaleString());
      return;
    }
    renderInline(this.app, el, String(raw), sourcePath);
  }
  renderGlance(col, file, fm) {
    sectionLabel(col, "At a glance");
    const props = col.createDiv({ cls: "ct-props" });
    const fields = this.plugin.settings.cityFields.filter((f) => fm[f.key] != null && fm[f.key] !== "");
    if (!fields.length) props.createDiv({ cls: "ct-faint ct-13 ct-pad-6", text: "Add fields like region or population to the frontmatter." });
    for (const f of fields) {
      const row = props.createDiv({ cls: "ct-prop is-narrow" });
      row.createSpan({ cls: "ct-prop-key", text: f.label });
      this.renderValue(row.createDiv({ cls: "ct-prop-val" }), fm[f.key], file.path);
    }
  }
  renderTable(page, file, fm, key, title, columns) {
    const rows = asList2(fm[key]);
    if (!rows.length) return;
    const cols = columns.split(",").map((c) => c.trim()).filter(Boolean);
    const sec = page.createDiv({ cls: "ct-stack-8" });
    const head = sec.createDiv({ cls: "ct-row-8" });
    head.createSpan({ cls: "ct-h16", text: title });
    head.createSpan({ cls: "ct-faint ct-12", text: String(rows.length) });
    const wrap = sec.createDiv({ cls: "ct-table-wrap" });
    const table = wrap.createEl("table", { cls: "ct-table" });
    const tr = table.createEl("thead").createEl("tr");
    for (const c of cols) tr.createEl("th", { text: c.replace(/_/g, " ") });
    const tbody = table.createEl("tbody");
    for (const r of rows) {
      const row = tbody.createEl("tr");
      const obj = r && typeof r === "object" && !Array.isArray(r) ? r : { [cols[0]]: r };
      cols.forEach((c, i) => this.renderValue(row.createEl("td", { cls: i === 0 ? "is-first" : "" }), obj[c], file.path));
    }
  }
  renderPeople(col, file, fm) {
    const people = /* @__PURE__ */ new Map();
    const resolved = this.app.metadataCache.resolvedLinks;
    for (const src in resolved) {
      if (!resolved[src][file.path]) continue;
      const f = this.app.vault.getAbstractFileByPath(src);
      if (f instanceof import_obsidian10.TFile && isCharacter(this.app, f)) people.set(f.path, f);
    }
    for (const raw of asList2(fm.notable_people).map(String)) {
      const dest = this.app.metadataCache.getFirstLinkpathDest(linkBasename(raw), file.path);
      if (dest) people.set(dest.path, dest);
      else people.set(raw, null);
    }
    sectionLabel(col, `Notable people \xB7 ${people.size}`);
    if (!people.size) col.createSpan({ cls: "ct-faint ct-13", text: "No characters link here yet." });
    for (const [key, f] of people) {
      const name = f?.basename ?? parseLink(key).display;
      const row = col.createDiv({ cls: "ct-rel" });
      row.createSpan({ cls: "ct-avatar", text: initials(name) });
      const mid = row.createDiv({ cls: "ct-rel-mid" });
      renderLinkish(this.app, mid, f ? `[[${f.path.replace(/\.md$/, "")}|${f.basename}]]` : key, file.path, "ct-rel-name");
      const role = f ? this.app.metadataCache.getFileCache(f)?.frontmatter?.role : null;
      if (role) mid.createSpan({ cls: "ct-rel-kind", text: String(role) });
      row.createSpan();
    }
  }
  renderEvents(col, file) {
    const events = collectEvents(this.app).filter((e) => {
      const t = parseLink(e.location).target;
      return t && this.app.metadataCache.getFirstLinkpathDest(t, e.path) === file;
    }).sort((a, b) => a.start - b.start);
    sectionLabel(col, `Events here \xB7 ${events.length}`);
    if (!events.length) {
      col.createSpan({ cls: "ct-faint ct-13", text: 'Give event notes location: "[[' + file.basename + ']]" to list them here.' });
      return;
    }
    const cats = this.plugin.settings.categories;
    for (const e of events) {
      const row = col.createDiv({ cls: "ct-city-event" });
      const cat = cats.find((c) => c.key === e.category);
      row.createSpan({ cls: "ct-dot" }).style.background = cat ? `var(--color-${cat.color})` : "var(--text-muted)";
      renderLinkish(this.app, row, `[[${e.path.replace(/\.md$/, "")}|${e.title}]]`, file.path, "ct-13");
      row.createSpan({ cls: "ct-mono ct-faint ct-11 ct-city-event-date", text: this.plugin.calendar.shortRange(e.start, e.end) });
    }
  }
};

// src/views/TimelineView.ts
var import_obsidian11 = require("obsidian");
var VIEW_TIMELINE = "story-timeline";
var PPM2 = { era: 7, year: 22, month: 80 };
var PAD = 20;
var ROW_H = 34;
var TimelineView = class extends import_obsidian11.ItemView {
  constructor(leaf, plugin) {
    super(leaf);
    this.plugin = plugin;
    this.events = [];
    this.zoom = "year";
    this.selected = null;
    this.drag = null;
    this.origin = 0;
    this.span = 0;
    this.pendingFocus = null;
  }
  getViewType() {
    return VIEW_TIMELINE;
  }
  getDisplayText() {
    return this.plugin.settings.timelineName || "Timeline";
  }
  getIcon() {
    return "git-commit-horizontal";
  }
  getState() {
    return { zoom: this.zoom, selected: this.selected };
  }
  async setState(state, result) {
    if (state.zoom && state.zoom in PPM2) this.zoom = state.zoom;
    if (state.selected !== void 0) this.selected = state.selected;
    if (state.focusLane) this.pendingFocus = state.focusLane;
    if (this.bodyEl) this.render();
    return super.setState(state, result);
  }
  focusLane(lane) {
    this.pendingFocus = lane;
    this.render();
  }
  async onOpen() {
    this.contentEl.addClass("ct-view", "ct-timeline");
    const refresh = (0, import_obsidian11.debounce)(() => {
      if (!this.drag) {
        this.reload();
        this.render();
      }
    }, 150, true);
    this.registerEvent(this.app.metadataCache.on("changed", refresh));
    this.registerEvent(this.app.vault.on("delete", refresh));
    this.registerEvent(this.app.vault.on("rename", refresh));
    this.registerEvent(this.app.metadataCache.on("resolved", refresh));
    this.reload();
    this.render();
  }
  reload() {
    this.events = collectEvents(this.app);
    if (this.selected && !this.events.some((e) => e.path === this.selected)) this.selected = null;
  }
  ppm() {
    return PPM2[this.zoom];
  }
  color(cat) {
    const c = this.plugin.settings.categories.find((x) => x.key === cat);
    return c ? `var(--color-${c.color})` : "var(--text-muted)";
  }
  x(m) {
    return PAD + (m - this.origin) * this.ppm();
  }
  computeRange() {
    if (this.drag) return;
    if (!this.events.length) {
      this.origin = this.plugin.settings.currentYear * 12;
      this.span = 36;
      return;
    }
    const min = Math.min(...this.events.map((e) => e.start));
    const max = Math.max(...this.events.map((e) => e.end ?? e.start + 1));
    this.origin = Math.floor(min / 12) * 12;
    this.span = Math.ceil((max + 1) / 12) * 12 - this.origin;
  }
  lanes() {
    const set = new Set(this.events.map((e) => e.lane).filter((l) => l !== "World"));
    if (this.pendingFocus && this.pendingFocus !== "World") set.add(this.pendingFocus);
    const counts = (l) => this.events.filter((e) => e.lane === l).length;
    const list = [...set].sort((a, b) => counts(b) - counts(a) || a.localeCompare(b));
    return [...list, "World"];
  }
  render() {
    const root = this.contentEl;
    const sl = this.scrollEl?.scrollLeft ?? 0;
    const st = this.bodyEl?.scrollTop ?? 0;
    root.empty();
    this.computeRange();
    this.renderToolbar(root);
    this.bodyEl = root.createDiv({ cls: "ct-tl-body" });
    this.renderBody();
    this.detailEl = root.createDiv({ cls: "ct-tl-detail" });
    this.renderDetail();
    this.scrollEl.scrollLeft = sl;
    this.bodyEl.scrollTop = st;
    if (this.pendingFocus) this.applyFocus();
  }
  applyFocus() {
    const lane = this.pendingFocus;
    this.pendingFocus = null;
    const evs = this.events.filter((e) => e.lane === lane).sort((a, b) => a.start - b.start);
    if (evs[0]) {
      this.selected = evs[0].path;
      this.renderBody();
      this.renderDetail();
      this.scrollEl.scrollLeft = Math.max(0, this.x(evs[0].start) - 60);
    }
    const laneEl = this.bodyEl.querySelector(`[data-lane="${CSS.escape(lane)}"]`);
    laneEl?.scrollIntoView({ block: "nearest" });
  }
  renderToolbar(root) {
    const s = this.plugin.settings;
    const bar = root.createDiv({ cls: "ct-tl-toolbar" });
    bar.createSpan({ cls: "ct-tl-name", text: s.timelineName || "Timeline" });
    const y0 = Math.floor(this.origin / 12);
    const y1 = Math.floor((this.origin + this.span) / 12);
    bar.createSpan({ cls: "ct-mono ct-faint ct-12", text: `${s.eraName ? s.eraName + " \xB7 " : ""}${y0}\u2013${y1}` });
    const seg = bar.createDiv({ cls: "ct-seg" });
    for (const [k, label] of [["era", "Era"], ["year", "Year"], ["month", "Month"]]) {
      const b = seg.createDiv({ cls: `ct-seg-item ${this.zoom === k ? "is-active" : ""}`, text: label });
      b.addEventListener("click", () => {
        const centre = this.scrollEl ? (this.scrollEl.scrollLeft + this.scrollEl.clientWidth / 2 - PAD) / this.ppm() : 0;
        this.zoom = k;
        this.app.workspace.requestSaveLayout();
        this.render();
        this.scrollEl.scrollLeft = Math.max(0, centre * this.ppm() + PAD - this.scrollEl.clientWidth / 2);
      });
    }
    bar.createDiv({ cls: "ct-spacer" });
    const legend = bar.createDiv({ cls: "ct-legend" });
    for (const c of s.categories) {
      const item = legend.createSpan({ cls: "ct-legend-item" });
      item.createSpan({ cls: "ct-dot" }).style.background = `var(--color-${c.color})`;
      item.appendText(c.label);
    }
    const add = button(bar, "+ Event", () => this.newEvent({}), "ct-btn mod-cta is-small");
    add.setAttr("aria-label", "New event");
  }
  newEvent(prefill) {
    new EventModal(this.app, this.plugin, prefill, (f) => {
      this.selected = f.path;
    }).open();
  }
  renderBody() {
    const body = this.bodyEl;
    body.empty();
    const ppm = this.ppm();
    const lanes = this.lanes();
    const laid = lanes.map((lane) => {
      const evs = this.events.filter((e) => e.lane === lane).sort((a, b) => a.start - b.start);
      const rows = [];
      const items = evs.map((e) => {
        const isBar = e.end != null;
        const x0 = this.x(e.start);
        const lw = (e.title.length + 12) * 6.4 + (isBar ? 0 : 16);
        const x1 = Math.max(isBar ? this.x(e.end) : x0, x0 + lw);
        let r = rows.findIndex((end) => end < x0 - 10);
        if (r < 0) {
          r = rows.length;
          rows.push(0);
        }
        rows[r] = x1;
        return { e, isBar, x0, top: 10 + r * ROW_H };
      });
      return { lane, items, h: Math.max(1, rows.length) * ROW_H + 16 };
    });
    const heads = body.createDiv({ cls: "ct-tl-heads" });
    heads.createDiv({ cls: "ct-tl-ruler-spacer" });
    for (const l of laid) {
      const h = heads.createDiv({ cls: "ct-tl-head" });
      h.style.height = `${l.h}px`;
      h.createSpan({ cls: "ct-avatar is-small", text: l.lane === "World" ? "\u2014" : initials(l.lane) });
      if (l.lane === "World") h.createSpan({ text: "World" });
      else renderLinkish(this.app, h, `[[${l.lane}]]`, "", "ct-tl-lane-link");
    }
    this.scrollEl = body.createDiv({ cls: "ct-tl-scroll" });
    const inner = this.scrollEl.createDiv({ cls: "ct-tl-inner" });
    inner.style.width = `${PAD * 2 + this.span * ppm + 200}px`;
    const ruler = inner.createDiv({ cls: "ct-tl-ruler" });
    const months = this.plugin.settings.months;
    for (let i = 0; i <= this.span; i++) {
      const m = this.origin + i;
      const x = this.x(m);
      const yr = m % 12 === 0 || i === 0;
      const year = Math.floor(m / 12);
      const tick = (h, cls, label, lcls) => {
        const t = ruler.createDiv({ cls: `ct-tick ${cls}` });
        t.style.left = `${x}px`;
        t.style.height = `${h}px`;
        if (label) {
          const lb = ruler.createDiv({ cls: `ct-tick-label ${lcls}`, text: label });
          lb.style.left = `${x + 4}px`;
        }
      };
      if (this.zoom === "era") {
        if (yr) tick(14, "is-major", String(year), "is-muted");
      } else if (this.zoom === "year") {
        if (yr) tick(16, "is-major", String(year), "is-normal");
        else if (m % 3 === 0) tick(6, "is-minor", "", "");
      } else {
        tick(yr ? 18 : 8, yr ? "is-major" : "is-minor", yr ? `${months[0]} ${year}` : months[m % 12] ?? "", yr ? "is-normal" : "is-faint");
      }
      if (yr) {
        const g = inner.createDiv({ cls: "ct-tl-grid" });
        g.style.left = `${x}px`;
      }
    }
    for (const l of laid) {
      const laneEl = inner.createDiv({ cls: "ct-tl-lane", attr: { "data-lane": l.lane } });
      laneEl.style.height = `${l.h}px`;
      laneEl.addEventListener("dblclick", (ev) => {
        if (ev.target !== laneEl) return;
        const rect = laneEl.getBoundingClientRect();
        const m = this.origin + Math.round((ev.clientX - rect.left - PAD) / ppm);
        this.newEvent({ lane: l.lane, start: Math.max(0, m) });
      });
      for (const it of l.items) this.renderEvent(laneEl, it.e, it.isBar, it.x0, it.top);
    }
  }
  renderEvent(laneEl, e, isBar, x0, top) {
    const cal = this.plugin.calendar;
    const el = laneEl.createDiv({ cls: `ct-ev ${isBar ? "is-bar" : "is-point"} ${this.selected === e.path ? "is-selected" : ""}`, attr: { "data-path": e.path } });
    el.style.left = `${x0}px`;
    el.style.top = `${top}px`;
    el.style.setProperty("--ct-c", this.color(e.category));
    const label = (parent) => {
      const l = parent.createDiv({ cls: "ct-ev-label", text: e.title + " " });
      l.createSpan({ cls: "ct-ev-date", text: cal.shortRange(e.start, e.end) });
    };
    if (isBar) {
      label(el);
      const bar = el.createDiv({ cls: "ct-ev-bar ct-ev-mark" });
      bar.style.width = `${Math.max(8, (e.end - e.start) * this.ppm())}px`;
      const handle = bar.createDiv({ cls: "ct-ev-handle", attr: { "aria-label": "Drag to change end" } });
      handle.addEventListener("pointerdown", (ev) => this.startDrag(ev, e, "resize"));
    } else {
      el.createSpan({ cls: "ct-ev-diamond ct-ev-mark" });
      label(el);
    }
    el.addEventListener("pointerdown", (ev) => this.startDrag(ev, e, "move"));
    el.addEventListener("dblclick", (ev) => {
      ev.stopPropagation();
      this.openNote(e.path, ev.ctrlKey || ev.metaKey);
    });
  }
  select(path) {
    this.selected = path;
    this.bodyEl.querySelectorAll(".ct-ev").forEach((n) => n.toggleClass("is-selected", n.dataset.path === path));
    this.renderDetail();
    this.app.workspace.requestSaveLayout();
  }
  startDrag(ev, e, mode) {
    if (ev.button !== 0) return;
    ev.preventDefault();
    ev.stopPropagation();
    this.select(e.path);
    this.drag = { path: e.path, mode, startX: ev.clientX, origStart: e.start, origEnd: e.end, delta: 0 };
    const ppm = this.ppm();
    const move = (m) => {
      const d = this.drag;
      if (!d) return;
      const delta = Math.round((m.clientX - d.startX) / ppm);
      if (delta === d.delta) return;
      d.delta = delta;
      const target = this.events.find((x) => x.path === d.path);
      if (!target) return;
      if (d.mode === "resize" && d.origEnd != null) {
        target.end = Math.max(d.origStart + 1, d.origEnd + delta);
      } else {
        target.start = Math.max(0, d.origStart + delta);
        target.end = d.origEnd != null ? target.start + (d.origEnd - d.origStart) : null;
      }
      const sl = this.scrollEl.scrollLeft;
      const st = this.bodyEl.scrollTop;
      this.renderBody();
      this.scrollEl.scrollLeft = sl;
      this.bodyEl.scrollTop = st;
      this.renderDetail();
    };
    const up = async () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      const d = this.drag;
      const target = d && this.events.find((x) => x.path === d.path);
      if (d && target && d.delta !== 0) {
        const file = this.app.vault.getAbstractFileByPath(d.path);
        if (file instanceof import_obsidian11.TFile) {
          await this.app.fileManager.processFrontMatter(file, (fm) => {
            fm["tl-start"] = fromIndex(target.start);
            if (target.end != null) fm["tl-end"] = fromIndex(target.end);
          });
        }
      }
      this.drag = null;
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
  }
  openNote(path, newLeaf = false) {
    const f = this.app.vault.getAbstractFileByPath(path);
    if (f instanceof import_obsidian11.TFile) this.app.workspace.getLeaf(newLeaf ? "tab" : false).openFile(f);
  }
  renderDetail() {
    const el = this.detailEl;
    if (!el) return;
    el.empty();
    const e = this.events.find((x) => x.path === this.selected);
    if (!e) {
      el.createSpan({ cls: "ct-faint ct-13", text: "Select an event. Drag to re-date, drag the right edge to change its end, double-click to open." });
      return;
    }
    el.createSpan({ cls: "ct-dot is-large" }).style.background = this.color(e.category);
    const t = el.createDiv({ cls: "ct-stack-2 ct-tl-detail-title" });
    t.createSpan({ cls: "ct-14 ct-strong", text: e.title });
    t.createSpan({ cls: "ct-mono ct-muted ct-12", text: this.plugin.calendar.formatRange(e.start, e.end) });
    const lane = el.createDiv({ cls: "ct-stack-2" });
    lane.createSpan({ cls: "ct-faint ct-11", text: "Lane" });
    lane.createSpan({ cls: "ct-13", text: e.lane });
    if (e.location) {
      const loc = el.createDiv({ cls: "ct-stack-2" });
      loc.createSpan({ cls: "ct-faint ct-11", text: "Location" });
      renderLinkish(this.app, loc, e.location, e.path, "ct-13");
    }
    const note = el.createDiv({ cls: "ct-stack-2" });
    note.createSpan({ cls: "ct-faint ct-11", text: "Note" });
    const base = e.path.split("/").pop().replace(/\.md$/, "");
    renderLinkish(this.app, note, `[[${e.path.replace(/\.md$/, "")}|${base}]]`, "", "ct-13").setText(`[[${base}]]`);
    el.createDiv({ cls: "ct-spacer" });
    const open = button(el, "Open note", () => this.openNote(e.path));
    (0, import_obsidian11.setIcon)(open.createSpan({ cls: "ct-btn-icon" }), "arrow-up-right");
  }
  async onClose() {
    this.contentEl.empty();
  }
};

// src/main.ts
var SHEETS = {
  character: { view: VIEW_CHARACTER, icon: "user-round", label: "character sheet" },
  city: { view: VIEW_CITY, icon: "castle", label: "city sheet" }
};
var StoryPlugin = class extends import_obsidian12.Plugin {
  constructor() {
    super(...arguments);
    this.canvasRecord = null;
    /** Leaves where the user pressed Edit, so we don't bounce them back to the sheet. */
    this.editing = /* @__PURE__ */ new WeakMap();
    this.sheetActions = /* @__PURE__ */ new WeakMap();
    this.wizardActions = /* @__PURE__ */ new WeakMap();
  }
  async onload() {
    await this.loadSettings();
    this.calendar = new Calendar(this.settings);
    this.registerView(VIEW_CHARACTER, (leaf) => new CharacterView(leaf, this));
    this.registerView(VIEW_TIMELINE, (leaf) => new TimelineView(leaf, this));
    this.registerView(VIEW_CITY, (leaf) => new CityView(leaf, this));
    this.addRibbonIcon("user-round", "Create new character", () => this.openWizard());
    this.addRibbonIcon("castle", "Create new city", () => this.openCityModal());
    this.addRibbonIcon("git-commit-horizontal", "Open story timeline", () => this.openTimeline());
    this.addCommand({ id: "create-character", name: "Create new character", callback: () => this.openWizard() });
    this.addCommand({
      id: "edit-in-wizard",
      name: "Edit current note in wizard",
      checkCallback: (checking) => {
        const file = this.app.workspace.getActiveFile();
        if (!file || !this.sheetFor(file)) return false;
        if (!checking) this.editInWizard(file);
        return true;
      }
    });
    this.addCommand({ id: "create-city", name: "Create new city", callback: () => this.openCityModal() });
    this.addCommand({ id: "open-timeline", name: "Open story timeline", callback: () => this.openTimeline() });
    this.addCommand({ id: "create-event", name: "Create new timeline event", callback: () => new EventModal(this.app, this).open() });
    this.addCommand({ id: "sync-canvas", name: "Sync timeline to canvas", callback: () => this.syncCanvas() });
    this.addCommand({
      id: "open-character-sheet",
      name: "Open current note as sheet",
      checkCallback: (checking) => {
        const view = this.app.workspace.getActiveViewOfType(import_obsidian12.MarkdownView);
        if (!view?.file || !this.sheetFor(view.file)) return false;
        if (!checking) this.showSheet(view.leaf, view.file);
        return true;
      }
    });
    this.registerEvent(
      this.app.workspace.on("file-menu", (menu, file) => {
        const sheet = file instanceof import_obsidian12.TFile ? this.sheetFor(file) : null;
        if (file instanceof import_obsidian12.TFile && sheet) {
          menu.addItem((i) => i.setTitle(`Open as ${sheet.label}`).setIcon(sheet.icon).onClick(() => this.openSheet(file)));
          menu.addItem((i) => i.setTitle("Edit in wizard").setIcon("wand-sparkles").onClick(() => this.editInWizard(file)));
        }
        if (file instanceof import_obsidian12.TFile && isCharacter(this.app, file)) {
          menu.addItem(
            (i) => i.setTitle("Show on timeline").setIcon("git-commit-horizontal").onClick(() => this.openTimeline({ focusLane: file.basename }))
          );
        }
      })
    );
    this.registerEvent(this.app.workspace.on("file-open", () => this.onFileOpen()));
    this.registerEvent(
      this.app.vault.on("modify", (f) => {
        if (this.settings.canvasReverseSync && f instanceof import_obsidian12.TFile && f.path === canvasPath(this)) reverseSyncFromCanvas(this, f);
      })
    );
    this.addSettingTab(new StorySettingTab(this.app, this));
  }
  // ---------- settings ----------
  async loadSettings() {
    const data = await this.loadData() ?? {};
    const defaults = cloneDefaults();
    const { canvasRecord, ...rest } = data;
    this.settings = { ...defaults, ...rest };
    this.settings.descFields = { ...defaults.descFields, ...rest.descFields ?? {} };
    if (!Array.isArray(this.settings.months) || this.settings.months.length !== 12) this.settings.months = defaults.months;
    this.canvasRecord = canvasRecord ?? null;
  }
  async saveSettings() {
    await this.saveData({ ...this.settings, canvasRecord: this.canvasRecord });
  }
  refreshViews() {
    for (const type of [VIEW_CHARACTER, VIEW_CITY, VIEW_TIMELINE]) {
      for (const leaf of this.app.workspace.getLeavesOfType(type)) {
        const v = leaf.view;
        if (v instanceof TimelineView) {
          v.reload();
          v.render();
        } else if (v instanceof CharacterView || v instanceof CityView) v.render();
      }
    }
  }
  // ---------- character sheet routing ----------
  markEditing(leaf, path) {
    this.editing.set(leaf, path);
  }
  onFileOpen() {
    const view = this.app.workspace.getActiveViewOfType(import_obsidian12.MarkdownView);
    if (!view) return;
    const file = view.file;
    const leaf = view.leaf;
    if (this.editing.has(leaf) && this.editing.get(leaf) !== file?.path) this.editing.delete(leaf);
    const sheet = file ? this.sheetFor(file) : null;
    this.updateSheetAction(view, sheet);
    if (!file || !sheet || !this.settings.openSheetByDefault) return;
    if (this.editing.get(leaf) === file.path) return;
    this.showSheet(leaf, file);
  }
  sheetFor(file) {
    if (file.extension !== "md") return null;
    const type = this.app.metadataCache.getFileCache(file)?.frontmatter?.type;
    return typeof type === "string" ? SHEETS[type] ?? null : null;
  }
  /** A header button on the Markdown view to jump back to the sheet. */
  updateSheetAction(view, sheet) {
    let el = this.sheetActions.get(view);
    if (sheet && !el) {
      el = view.addAction(sheet.icon, `Open ${sheet.label}`, () => {
        if (view.file) this.showSheet(view.leaf, view.file);
      });
      this.sheetActions.set(view, el);
    }
    if (el && sheet) {
      (0, import_obsidian12.setIcon)(el, sheet.icon);
      el.setAttr("aria-label", `Open ${sheet.label}`);
    }
    el?.toggle(!!sheet);
    let wand = this.wizardActions.get(view);
    if (sheet && !wand) {
      wand = view.addAction("wand-sparkles", "Edit in wizard", () => {
        if (view.file) this.editInWizard(view.file);
      });
      this.wizardActions.set(view, wand);
    }
    wand?.toggle(!!sheet);
  }
  async showSheet(leaf, file) {
    const sheet = this.sheetFor(file);
    if (!sheet) return;
    this.editing.delete(leaf);
    await leaf.setViewState({ type: sheet.view, state: { file: file.path }, active: true });
  }
  async openSheet(file) {
    const leaf = this.app.workspace.getLeaf(false);
    await this.showSheet(leaf, file);
    this.app.workspace.revealLeaf(leaf);
  }
  /** New city, or edit `file` in place. */
  openCityModal(file) {
    new CityModal(this.app, this, (f) => this.openSheet(f), file ?? null).open();
  }
  /** New character, or edit `file` in place. */
  openWizard(file) {
    new CharacterWizard(this.app, this, file ?? null).open();
  }
  /** Opens the right form editor for a character or city note. Returns false for other notes. */
  editInWizard(file) {
    const type = this.app.metadataCache.getFileCache(file)?.frontmatter?.type;
    if (type === "character") this.openWizard(file);
    else if (type === "city") this.openCityModal(file);
    else return false;
    return true;
  }
  // ---------- timeline ----------
  async openTimeline(opts = {}) {
    const existing = this.app.workspace.getLeavesOfType(VIEW_TIMELINE)[0];
    if (existing) {
      this.app.workspace.revealLeaf(existing);
      if (opts.focusLane && existing.view instanceof TimelineView) existing.view.focusLane(opts.focusLane);
      return;
    }
    const leaf = this.app.workspace.getLeaf("tab");
    await leaf.setViewState({ type: VIEW_TIMELINE, active: true, state: opts.focusLane ? { focusLane: opts.focusLane } : {} });
    this.app.workspace.revealLeaf(leaf);
  }
  async syncCanvas() {
    const file = await syncTimelineToCanvas(this);
    if (file) await this.app.workspace.getLeaf("tab").openFile(file);
  }
};
