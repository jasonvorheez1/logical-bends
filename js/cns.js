// FIGHTWIRE — CNS / ST / CMD state file parser.
import { stripComment } from './util.js';
import { compile } from './expr.js';

// Parse a state file into { states: Map<no, StateDef>, sections (non-state ini sections) }
export function parseStates(text, fileTag = '') {
  const states = new Map();
  const others = [];
  let curState = null, curCtrl = null, curOther = null;
  const lines = text.split(/\r?\n/);
  for (let ln = 0; ln < lines.length; ln++) {
    const line = stripComment(lines[ln]).trim();
    if (!line) continue;
    if (line[0] === '[') {
      const inner = line.slice(1, line.lastIndexOf(']') > 0 ? line.lastIndexOf(']') : undefined).trim();
      const low = inner.toLowerCase();
      let m;
      if ((m = low.match(/^statedef\s+(-?\d+)/))) {
        const no = +m[1];
        curState = { no, params: {}, ctrls: [], file: fileTag };
        if (!states.has(no)) states.set(no, curState);
        else curState = { no, params: {}, ctrls: [], dup: true }; // first definition wins
        curCtrl = null; curOther = null;
        continue;
      }
      if (low.startsWith('state ') || low === 'state' || low.startsWith('state,')) {
        if (curState) {
          curCtrl = { label: inner, type: '', triggers: {}, params: {}, persistent: 1, ignorehitpause: false, line: ln + 1, file: fileTag };
          curState.ctrls.push(curCtrl);
        }
        curOther = null;
        continue;
      }
      curState = null; curCtrl = null;
      curOther = { name: inner, lname: low, entries: [], map: {} };
      others.push(curOther);
      continue;
    }
    const eq = line.indexOf('=');
    let key, val;
    if (eq < 0) { key = line.toLowerCase(); val = ''; }
    else { key = line.slice(0, eq).trim().toLowerCase(); val = line.slice(eq + 1).trim(); }
    if (curOther) {
      curOther.entries.push([key, val]);
      if (!(key in curOther.map)) curOther.map[key] = val;
      continue;
    }
    if (curCtrl) {
      if (key === 'type') curCtrl.type = val.toLowerCase().replace(/\s+/g, '');
      else if (key === 'triggerall' || /^trigger\d+$/.test(key)) (curCtrl.triggers[key] ||= []).push(val);
      else if (key === 'persistent') curCtrl.persistent = parseInt(val) || 0;
      else if (key === 'ignorehitpause') curCtrl.ignorehitpause = !!parseInt(val);
      else if (!(key in curCtrl.params)) curCtrl.params[key] = val;
      continue;
    }
    if (curState) {
      if (!(key in curState.params)) curState.params[key] = val;
    }
  }
  for (const st of states.values()) finalizeState(st);
  return { states, others };
}

function finalizeState(st) {
  for (const c of st.ctrls) {
    const all = (c.triggers.triggerall || []).map(compile);
    const groups = [];
    for (let i = 1; ; i++) {
      const t = c.triggers['trigger' + i];
      if (!t) break;
      groups.push(t.map(compile));
    }
    c.tAll = all;
    c.tGroups = groups;
    c.pc = {}; // param compile cache
  }
}

// Commands from a CMD file
export function parseCommands(text) {
  const cmds = [];
  const defaults = { time: 15, buffertime: 1 };
  let cur = null, inDefaults = false;
  for (const raw of text.split(/\r?\n/)) {
    const line = stripComment(raw).trim();
    if (!line) continue;
    if (line[0] === '[') {
      const low = line.toLowerCase();
      cur = null; inDefaults = false;
      if (low.startsWith('[command')) { cur = { name: '', command: '', time: null, buffertime: null }; cmds.push(cur); }
      else if (low.startsWith('[defaults')) inDefaults = true;
      continue;
    }
    const eq = line.indexOf('=');
    if (eq < 0) continue;
    const k = line.slice(0, eq).trim().toLowerCase();
    let v = line.slice(eq + 1).trim();
    if (inDefaults) {
      if (k === 'command.time') defaults.time = parseInt(v) || 15;
      if (k === 'command.buffer.time') defaults.buffertime = parseInt(v) || 1;
    } else if (cur) {
      if (k === 'name') cur.name = v.replace(/^"|"$/g, '');
      else if (k === 'command') cur.command = v;
      else if (k === 'time') cur.time = parseInt(v);
      else if (k === 'buffer.time') cur.buffertime = parseInt(v);
    }
  }
  for (const c of cmds) {
    if (c.time == null || isNaN(c.time)) c.time = defaults.time;
    if (c.buffertime == null || isNaN(c.buffertime)) c.buffertime = defaults.buffertime;
    c.buffertime = Math.max(1, Math.min(30, c.buffertime));
  }
  return cmds.filter(c => c.name && c.command);
}
