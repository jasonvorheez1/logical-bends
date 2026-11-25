// FIGHTWIRE — procedurally painted stages (no external art).
import { VIEW_W, VIEW_H, GROUND_Y } from './fight.js';

function rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
function layer(w, h, paint) { const c = document.createElement('canvas'); c.width = w; c.height = h; paint(c.getContext('2d'), w, h); return c; }

// world x range drawn: [-420, 420] plus parallax margin
const WORLD_W = 840;

function rooftop() {
  const r = rng(7);
  const sky = layer(VIEW_W, VIEW_H, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h);
    gr.addColorStop(0, '#0a0b24'); gr.addColorStop(0.55, '#2a1240'); gr.addColorStop(1, '#ff4f6e');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 80; i++) { g.fillStyle = `rgba(255,255,255,${0.2 + r() * 0.6})`; g.fillRect(r() * w, r() * h * 0.5, 1, 1); }
    // moon
    g.fillStyle = '#ffe9a8'; g.beginPath(); g.arc(w * 0.72, 52, 20, 0, 7); g.fill();
    g.fillStyle = 'rgba(255,233,168,0.15)'; g.beginPath(); g.arc(w * 0.72, 52, 34, 0, 7); g.fill();
  });
  const far = layer(WORLD_W * 0.5 + VIEW_W, 140, (g, w, h) => {
    let x = 0;
    while (x < w) {
      const bw = 20 + r() * 40, bh = 40 + r() * 90;
      g.fillStyle = '#1b1336'; g.fillRect(x, h - bh, bw, bh);
      for (let yy = h - bh + 6; yy < h - 4; yy += 7) for (let xx = x + 3; xx < x + bw - 3; xx += 6) if (r() < 0.25) { g.fillStyle = r() < 0.5 ? '#ffd23f' : '#3ad6ff'; g.globalAlpha = 0.5; g.fillRect(xx, yy, 2, 3); g.globalAlpha = 1; }
      x += bw + 2;
    }
  });
  const mid = layer(WORLD_W * 0.75 + VIEW_W, 170, (g, w, h) => {
    let x = 0;
    while (x < w) {
      const bw = 40 + r() * 60, bh = 60 + r() * 100;
      g.fillStyle = '#120c22'; g.fillRect(x, h - bh, bw, bh);
      if (r() < 0.35) { // neon sign
        const col = ['#ff3b3b', '#3ad6ff', '#ffd23f'][Math.floor(r() * 3)];
        g.strokeStyle = col; g.lineWidth = 2; g.shadowColor = col; g.shadowBlur = 8;
        g.strokeRect(x + 6, h - bh + 10, bw - 12, 14); g.shadowBlur = 0;
      }
      for (let yy = h - bh + 30; yy < h - 4; yy += 9) for (let xx = x + 4; xx < x + bw - 4; xx += 8) if (r() < 0.3) { g.fillStyle = 'rgba(255,210,63,0.55)'; g.fillRect(xx, yy, 3, 4); }
      // water tower
      if (r() < 0.15) { g.fillStyle = '#120c22'; g.fillRect(x + bw / 2 - 10, h - bh - 22, 20, 16); g.fillRect(x + bw / 2 - 8, h - bh - 6, 2, 6); g.fillRect(x + bw / 2 + 6, h - bh - 6, 2, 6); }
      x += bw + 6;
    }
  });
  const floor = layer(WORLD_W + VIEW_W, VIEW_H - GROUND_Y + 40, (g, w, h) => {
    g.fillStyle = '#1d1a2a'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#2b2740'; g.fillRect(0, 0, w, 4);
    g.fillStyle = '#ffd23f'; for (let x = 0; x < w; x += 28) g.fillRect(x, 1, 14, 2);
    for (let x = 0; x < w; x += 40) { g.fillStyle = '#16131f'; g.fillRect(x, 6, 1, h); }
    g.fillStyle = '#0f0d16'; g.fillRect(0, 14, w, h);
  });
  const props = layer(WORLD_W + VIEW_W, 90, (g, w, h) => {
    // railing + AC units
    g.fillStyle = '#0f0c1c';
    for (let x = 0; x < w; x += 60) {
      if (r() < 0.45) { g.fillRect(x + 10, h - 30, 36, 30); g.fillStyle = '#231e37'; g.fillRect(x + 14, h - 26, 28, 10); g.fillStyle = '#0f0c1c'; }
    }
    g.fillRect(0, h - 44, w, 3);
    for (let x = 0; x < w; x += 18) g.fillRect(x, h - 44, 2, 44);
  });
  return {
    name: 'Neon Rooftop', id: 'rooftop', music: 'fight',
    draw(g, f) {
      const cx = f ? f.camX : 0, cy = f ? f.camY : 0;
      g.drawImage(sky, 0, Math.min(0, -cy * 0.05));
      const px = (img, fac, y) => { const x = -(cx * fac) - (img.width - VIEW_W) / 2; g.drawImage(img, Math.round(x), Math.round(y - cy * fac)); };
      px(far, 0.25, GROUND_Y - 150);
      px(mid, 0.5, GROUND_Y - 165);
      px(props, 0.9, GROUND_Y - 88);
      px(floor, 1, GROUND_Y - 2);
    },
    thumb: '#ff4f6e',
  };
}

function apartment() {
  const r = rng(42);
  const wall = layer(WORLD_W * 0.9 + VIEW_W, VIEW_H + 60, (g, w, h) => {
    g.fillStyle = '#d9c27a'; g.fillRect(0, 0, w, h);
    // wallpaper stripes
    for (let x = 0; x < w; x += 16) { g.fillStyle = x % 32 ? '#cdb56b' : '#e2cd8a'; g.fillRect(x, 0, 8, h); }
    // dado rail
    g.fillStyle = '#7a3b2a'; g.fillRect(0, h - 120, w, 8);
    g.fillStyle = '#9a5038'; g.fillRect(0, h - 112, w, 112);
    // window with night city
    const wx = w * 0.18;
    g.fillStyle = '#5a3221'; g.fillRect(wx - 6, 30, 112, 92);
    g.fillStyle = '#1a1840'; g.fillRect(wx, 36, 100, 80);
    for (let i = 0; i < 9; i++) { g.fillStyle = '#0f0e28'; const bh = 20 + r() * 50; g.fillRect(wx + i * 11, 116 - bh, 10, bh); }
    for (let i = 0; i < 25; i++) { g.fillStyle = '#ffd23f'; g.fillRect(wx + r() * 98, 60 + r() * 54, 2, 2); }
    g.fillStyle = '#5a3221'; g.fillRect(wx + 48, 36, 4, 80); g.fillRect(wx, 74, 100, 4);
    // framed posters
    const poster = (x, y, col, txt) => { g.fillStyle = '#2a1a10'; g.fillRect(x - 3, y - 3, 56, 72); g.fillStyle = col; g.fillRect(x, y, 50, 66); g.fillStyle = '#111'; g.font = 'bold 10px sans-serif'; g.fillText(txt, x + 4, y + 60); };
    poster(w * 0.42, 40, '#3a6ad6', 'HAM'); poster(w * 0.62, 50, '#d63a3a', 'BOUT');
    // broken TV shelf
    g.fillStyle = '#3b2416'; g.fillRect(w * 0.78, h - 160, 110, 10);
    g.fillStyle = '#222'; g.fillRect(w * 0.78 + 20, h - 210, 70, 50);
    g.fillStyle = '#3ad6ff'; g.globalAlpha = 0.35; g.fillRect(w * 0.78 + 26, h - 204, 58, 38); g.globalAlpha = 1;
  });
  const props = layer(WORLD_W + VIEW_W, 110, (g, w, h) => {
    // couch (broken), lamp, hamster cage, thanksgiving table
    const baseY = h;
    g.fillStyle = '#5b2a6e'; g.fillRect(80, baseY - 40, 120, 40); g.fillRect(80, baseY - 62, 20, 30); g.fillRect(180, baseY - 52, 20, 30);
    g.fillStyle = '#4a2259'; g.save(); g.translate(140, baseY - 56); g.rotate(0.25); g.fillRect(-40, -8, 70, 16); g.restore();
    // table
    g.fillStyle = '#6b3a1f'; g.fillRect(420, baseY - 46, 150, 8); g.fillRect(430, baseY - 38, 8, 38); g.fillRect(552, baseY - 38, 8, 38);
    g.fillStyle = '#c47a2c'; g.beginPath(); g.ellipse(495, baseY - 54, 22, 12, 0, 0, 7); g.fill();
    g.fillStyle = '#eee'; for (let i = 0; i < 4; i++) { g.beginPath(); g.ellipse(445 + i * 33, baseY - 48, 9, 3, 0, 0, 7); g.fill(); }
    // hamster cage (wrecked) RIP Mistah Ham Ham
    g.strokeStyle = '#999'; g.lineWidth = 1.5;
    g.save(); g.translate(720, baseY - 6); g.rotate(-0.2);
    g.strokeRect(-30, -30, 60, 30); for (let x = -26; x < 30; x += 6) { g.beginPath(); g.moveTo(x, -30); g.lineTo(x, 0); g.stroke(); }
    g.restore();
    g.fillStyle = '#d4a05a'; g.beginPath(); g.ellipse(760, baseY - 5, 7, 4, 0, 0, 7); g.fill();
    // lamp knocked over
    g.fillStyle = '#c9b037'; g.save(); g.translate(900, baseY - 4); g.rotate(1.3); g.fillRect(-2, -40, 4, 40); g.beginPath(); g.moveTo(-12, -40); g.lineTo(12, -40); g.lineTo(7, -56); g.lineTo(-7, -56); g.fill(); g.restore();
    // door (busted)
    g.fillStyle = '#6b3a1f'; g.save(); g.translate(1100, baseY); g.rotate(-1.45); g.fillRect(0, -12, 90, 40); g.restore();
  });
  const floor = layer(WORLD_W + VIEW_W, VIEW_H - GROUND_Y + 40, (g, w, h) => {
    for (let x = 0; x < w; x += 24) { g.fillStyle = (x / 24) % 2 ? '#7a4a2a' : '#6b3f23'; g.fillRect(x, 0, 24, h); }
    g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(0, 0, w, 3);
    // rug
    g.fillStyle = '#a33'; g.fillRect(w / 2 - 160, 4, 320, 20); g.fillStyle = '#ffd23f'; g.fillRect(w / 2 - 150, 8, 300, 2); g.fillRect(w / 2 - 150, 18, 300, 2);
  });
  return {
    name: "Dee Bee's Apartment", id: 'apartment', music: 'fight',
    draw(g, f) {
      const cx = f ? f.camX : 0, cy = f ? f.camY : 0;
      const px = (img, fac, y) => { const x = -(cx * fac) - (img.width - VIEW_W) / 2; g.drawImage(img, Math.round(x), Math.round(y - cy * fac)); };
      px(wall, 0.85, GROUND_Y - wall.height + 30);
      px(props, 0.95, GROUND_Y - 108);
      px(floor, 1, GROUND_Y - 2);
      // ceiling light glow
      const gr = g.createRadialGradient(VIEW_W / 2, -20, 10, VIEW_W / 2, -20, 260);
      gr.addColorStop(0, 'rgba(255,240,190,0.25)'); gr.addColorStop(1, 'rgba(255,240,190,0)');
      g.fillStyle = gr; g.fillRect(0, 0, VIEW_W, VIEW_H);
    },
    thumb: '#d9c27a',
  };
}

function grid() {
  const floor = layer(WORLD_W + VIEW_W, VIEW_H - GROUND_Y + 40, (g, w, h) => {
    g.fillStyle = '#0d1424'; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#3ad6ff'; g.globalAlpha = 0.6; g.beginPath(); g.moveTo(0, 0.5); g.lineTo(w, 0.5); g.stroke();
    g.globalAlpha = 0.25;
    for (let x = 0; x <= w; x += 32) { g.beginPath(); g.moveTo(x + 0.5, 0); g.lineTo(x + 0.5, h); g.stroke(); }
    g.globalAlpha = 1;
  });
  return {
    name: 'Training Grid', id: 'grid', music: 'menu',
    draw(g, f) {
      const cx = f ? f.camX : 0, cy = f ? f.camY : 0;
      g.fillStyle = '#121a2e'; g.fillRect(0, 0, VIEW_W, VIEW_H);
      g.strokeStyle = 'rgba(58,214,255,0.12)'; g.lineWidth = 1;
      const off = (-cx * 0.6) % 32;
      for (let x = off; x < VIEW_W; x += 32) { g.beginPath(); g.moveTo(x + 0.5, 0); g.lineTo(x + 0.5, GROUND_Y); g.stroke(); }
      for (let y = (GROUND_Y - cy * 0.6) % 32; y < GROUND_Y; y += 32) { g.beginPath(); g.moveTo(0, y + 0.5); g.lineTo(VIEW_W, y + 0.5); g.stroke(); }
      // distance marks
      g.fillStyle = 'rgba(255,210,63,0.5)'; g.font = '6px monospace';
      for (let wx = -400; wx <= 400; wx += 50) { const sx = wx - cx + VIEW_W / 2; if (sx > -10 && sx < VIEW_W + 10) g.fillText(String(wx), sx - 6, GROUND_Y + 12 - cy); }
      const x = -(cx) - (floor.width - VIEW_W) / 2; g.drawImage(floor, Math.round(x), Math.round(GROUND_Y - 2 - cy));
    },
    thumb: '#3ad6ff',
  };
}

export function makeStages() { return [rooftop(), apartment(), grid()]; }
