// FIGHTWIRE — SND reader + WebAudio playback with MUGEN-style channels.

const rd32 = (d, o) => (d[o] | (d[o + 1] << 8) | (d[o + 2] << 16) | (d[o + 3] << 24)) >>> 0;

export function parseSND(bytes) {
  const d = bytes;
  const sounds = new Map();
  const n = rd32(d, 16);
  let off = rd32(d, 20);
  for (let i = 0; i < n && off > 0 && off + 16 <= d.length; i++) {
    const next = rd32(d, off), len = rd32(d, off + 4);
    const g = rd32(d, off + 8), s = rd32(d, off + 12);
    const key = g * 65536 + s;
    if (!sounds.has(key) && len > 0) sounds.set(key, { raw: d.subarray(off + 16, off + 16 + len), buf: null, pending: null });
    if (!next || next <= off) break;
    off = next;
  }
  return sounds;
}

class AudioSys {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.sfxGain = null;
    this.musicGain = null;
    this.volume = 0.8;
  }
  ensure() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return this.ctx; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = this.volume;
    this.master.connect(this.ctx.destination);
    this.sfxGain = this.ctx.createGain(); this.sfxGain.connect(this.master);
    this.musicGain = this.ctx.createGain(); this.musicGain.gain.value = 0.35; this.musicGain.connect(this.master);
    return this.ctx;
  }
  setVolume(v) { this.volume = v; if (this.master) this.master.gain.value = v; if (this._track) this._track.volume = Math.min(1, v * 0.7); }

  async decode(snd) {
    if (snd.buf) return snd.buf;
    if (snd.pending) return snd.pending;
    const ctx = this.ensure();
    if (!ctx) return null;
    snd.pending = ctx.decodeAudioData(snd.raw.slice().buffer).then(b => (snd.buf = b)).catch(() => (snd.buf = null, snd.failed = true, null));
    return snd.pending;
  }
  async decodeBank(bank, onProgress) {
    if (!bank) return;
    const list = [...bank.values()];
    let i = 0;
    const workers = Array.from({ length: 6 }, async () => {
      while (i < list.length) { const s = list[i++]; await this.decode(s); if (onProgress) onProgress(i / list.length); }
    });
    await Promise.all(workers);
  }
  // play(bank, g, n, {channel, owner, volume, pan, freqmul, loop, lowpriority})
  play(bank, g, n, o = {}) {
    if (!bank) return;
    const snd = bank.get(g * 65536 + n);
    if (!snd) return;
    const ctx = this.ensure();
    if (!ctx) return;
    const start = () => {
      if (!snd.buf) return;
      const chans = o.owner ? (o.owner._sndChannels ||= new Map()) : null;
      if (chans && o.channel != null && o.channel >= 0) {
        const prev = chans.get(o.channel);
        if (prev && prev.playing) {
          if (o.lowpriority) return;
          try { prev.src.stop(); } catch {}
        }
      }
      const src = ctx.createBufferSource();
      src.buffer = snd.buf;
      if (o.freqmul && o.freqmul !== 1) src.playbackRate.value = Math.max(0.1, o.freqmul);
      src.loop = !!o.loop;
      const gain = ctx.createGain();
      gain.gain.value = Math.max(0, Math.min(2, o.volume ?? 1));
      let node = src;
      node.connect(gain);
      let out = gain;
      if (ctx.createStereoPanner && o.pan) {
        const p = ctx.createStereoPanner();
        p.pan.value = Math.max(-1, Math.min(1, o.pan));
        gain.connect(p); out = p;
      }
      out.connect(this.sfxGain);
      const rec = { src, playing: true };
      src.onended = () => { rec.playing = false; };
      src.start();
      if (chans && o.channel != null && o.channel >= 0) chans.set(o.channel, rec);
      if (o.owner) (o.owner._sndAll ||= new Set()).add(rec), src.addEventListener('ended', () => o.owner._sndAll?.delete(rec));
    };
    if (snd.buf) start();
    else if (!snd.failed) this.decode(snd).then(start);
  }
  stop(owner, channel = -1) {
    if (!owner) return;
    if (channel < 0) {
      for (const r of owner._sndAll || []) { try { r.src.stop(); } catch {} }
      owner._sndAll?.clear();
      owner._sndChannels?.clear();
      return;
    }
    const r = owner._sndChannels?.get(channel);
    if (r) { try { r.src.stop(); } catch {} owner._sndChannels.delete(channel); }
  }
  isPlaying(owner, channel) {
    const r = owner?._sndChannels?.get(channel);
    return !!(r && r.playing);
  }

  // --- synthesized UI sounds, so menus need no extra files ---
  blip(freq = 660, dur = 0.06, type = 'square', vol = 0.15) {
    const ctx = this.ensure(); if (!ctx) return;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.value = freq;
    g.gain.setValueAtTime(vol, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
    o.connect(g); g.connect(this.sfxGain);
    o.start(); o.stop(ctx.currentTime + dur + 0.02);
  }
  move() { if (this.uiBank) return this.play(this.uiBank, 100, 0, { channel: 0, owner: this }); this.blip(880, 0.04, 'square', 0.08); }
  confirm() { if (this.uiBank) return this.play(this.uiBank, 100, 1, { channel: 0, owner: this }); this.blip(523, 0.06, 'square', 0.12); setTimeout(() => this.blip(1046, 0.1, 'square', 0.12), 60); }
  back() { if (this.uiBank) return this.play(this.uiBank, 100, 2, { channel: 0, owner: this }); this.blip(330, 0.08, 'triangle', 0.15); }

  // --- streamed music tracks (title / select / vs / win) ---
  playTrack(url, loop = true) {
    const ctx = this.ensure();
    if (this._trackUrl === url && this._track && !this._track.paused) return;
    this.stopMusic();
    const el = new Audio(url);
    el.loop = loop;
    el.volume = Math.min(1, this.volume * 0.7);
    this._track = el; this._trackUrl = url;
    el.play().catch(() => { this._pendingTrack = el; });
  }
  resumePending() { if (this._pendingTrack) { this._pendingTrack.play().catch(() => {}); this._pendingTrack = null; } }
  sting(kind) {
    const ctx = this.ensure(); if (!ctx) return;
    const seq = {
      round: [[392, .09], [523, .09], [659, .18]],
      fight: [[784, .06], [988, .06], [1175, .25]],
      ko: [[220, .15], [165, .15], [110, .4]],
      win: [[523, .1], [659, .1], [784, .1], [1046, .3]],
    }[kind] || [];
    let t = 0;
    for (const [f, d] of seq) { setTimeout(() => this.blip(f, d, 'sawtooth', 0.12), t * 1000); t += d * 0.9; }
  }

  // --- tiny procedural music loop for menus/fights ---
  startMusic(style = 'menu') {
    const ctx = this.ensure(); if (!ctx) return;
    const tracks = { title: 'ui/music/Title.mp3', menu: 'ui/music/Title.mp3', select: 'ui/music/Select.mp3', vs: 'ui/music/Vs.mp3', win: 'ui/music/WIN.mp3' };
    if (tracks[style]) return this.playTrack(tracks[style], style !== 'vs');
    this.stopMusic();
    const bpm = style === 'fight' ? 132 : 96;
    const step = 60 / bpm / 2;
    const roots = style === 'fight' ? [45, 45, 48, 43] : [50, 46, 41, 43];
    let i = 0;
    const tick = () => {
      const t = ctx.currentTime + 0.05;
      const bar = Math.floor(i / 8) % roots.length;
      const r = roots[bar];
      const note = (m) => 440 * Math.pow(2, (m - 69) / 12);
      // bass
      if (i % 2 === 0 || style === 'fight') this._tone(note(r - 12 + (i % 8 === 6 ? 12 : 0)), t, step * 0.9, 'sawtooth', 0.09, 900);
      // arp
      const arp = [0, 7, 12, 15, 12, 7, 3, 7];
      if (style === 'menu' || i % 2 === 1) this._tone(note(r + 12 + arp[i % 8]), t, step * 0.5, 'square', 0.035, 2400);
      // hats / kick
      if (style === 'fight') {
        if (i % 4 === 0) this._kick(t);
        this._hat(t + (i % 2 ? 0 : 0), i % 2 ? 0.03 : 0.015);
      }
      i++;
    };
    tick();
    this._musicTimer = setInterval(tick, step * 1000);
  }
  stopMusic() {
    if (this._musicTimer) clearInterval(this._musicTimer); this._musicTimer = null;
    if (this._track) { this._track.pause(); this._track = null; this._trackUrl = null; }
    this._pendingTrack = null;
  }
  _tone(freq, t, dur, type, vol, cutoff) {
    const ctx = this.ctx;
    const o = ctx.createOscillator(), g = ctx.createGain(), f = ctx.createBiquadFilter();
    o.type = type; o.frequency.value = freq;
    f.type = 'lowpass'; f.frequency.value = cutoff;
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(f); f.connect(g); g.connect(this.musicGain);
    o.start(t); o.stop(t + dur + 0.05);
  }
  _kick(t) {
    const ctx = this.ctx;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(40, t + 0.12);
    g.gain.setValueAtTime(0.35, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.15);
    o.connect(g); g.connect(this.musicGain); o.start(t); o.stop(t + 0.2);
  }
  _hat(t, vol) {
    const ctx = this.ctx;
    if (!this._noise) {
      const b = ctx.createBuffer(1, ctx.sampleRate * 0.1, ctx.sampleRate);
      const d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      this._noise = b;
    }
    const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = this._noise; f.type = 'highpass'; f.frequency.value = 7000;
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.04);
    s.connect(f); f.connect(g); g.connect(this.musicGain); s.start(t); s.stop(t + 0.05);
  }
}

export const audio = new AudioSys();
