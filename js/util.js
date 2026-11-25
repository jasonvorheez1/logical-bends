// FIGHTWIRE — shared helpers for reading MUGEN text formats.

export function stripComment(line) {
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') inQ = !inQ;
    else if (ch === ';' && !inQ) return line.slice(0, i);
  }
  return line;
}

// Decode bytes as latin1 so odd Shift-JIS comments never throw.
export function bytesToText(buf) {
  const u8 = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let s = '';
  const CH = 0x8000;
  for (let i = 0; i < u8.length; i += CH) s += String.fromCharCode.apply(null, u8.subarray(i, i + CH));
  return s;
}

// Generic INI-ish reader: returns [{name, lname, entries:[[key,val]], map}]
export function parseIni(text) {
  const sections = [];
  let cur = { name: '', lname: '', entries: [], map: {} };
  sections.push(cur);
  for (let raw of text.split(/\r?\n/)) {
    const line = stripComment(raw).trim();
    if (!line) continue;
    if (line[0] === '[') {
      const end = line.indexOf(']');
      const name = line.slice(1, end < 0 ? undefined : end).trim();
      cur = { name, lname: name.toLowerCase(), entries: [], map: {} };
      sections.push(cur);
      continue;
    }
    const eq = line.indexOf('=');
    if (eq < 0) { cur.entries.push([line.toLowerCase(), '']); continue; }
    const k = line.slice(0, eq).trim().toLowerCase();
    const v = line.slice(eq + 1).trim();
    cur.entries.push([k, v]);
    if (!(k in cur.map)) cur.map[k] = v;
  }
  return sections;
}

export function unquote(s) {
  s = (s || '').trim();
  if (s.length >= 2 && s[0] === '"' && s[s.length - 1] === '"') return s.slice(1, -1);
  return s;
}

export function numList(s, def = []) {
  if (s == null || s === '') return def.slice();
  return s.split(',').map((t, i) => {
    const n = parseFloat(t);
    return isNaN(n) ? (def[i] ?? 0) : n;
  });
}

export async function fetchBytes(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`Could not load ${url} (${r.status})`);
  return new Uint8Array(await r.arrayBuffer());
}

export async function fetchText(url) {
  return bytesToText(await fetchBytes(url));
}

// Case-insensitive file lookup inside a character folder via a manifest.
export function resolvePath(base, name) {
  name = (name || '').replace(/\\/g, '/').trim();
  return base.replace(/\/?$/, '/') + name;
}

export const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
