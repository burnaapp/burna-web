// The rank badges, as SVG, ported line for line from the app's own drawing code
// (burna-ios/Burna/Sport/SportRankBadge.swift, the still badge with no animation). Nothing here is new artwork:
// every point comes from that file. Run with `node img-src/badges.mjs` from the site folder; it writes img/ranks/*.svg
// and the starred badge used by the rank-up screen render.
import { writeFileSync, mkdirSync } from 'node:fs';

const NAMES = ['ROOKIE', 'MOVER', 'CHARGER', 'GRINDER', 'ATHLETE', 'BEAST', 'BURNA'];
const COLOR = { ROOKIE: '#6EBEFF', MOVER: '#2F80FF', CHARGER: '#2EA854', GRINDER: '#8847FF', ATHLETE: '#D32CE6', BEAST: '#EB4B4B', BURNA: '#FFDD00' };
const FACE = '#101013';
const f = (n) => +n.toFixed(2);

const poly = (pts, fill, extra = '') => `<path${extra} fill="${fill}" d="M${pts.map(([x, y]) => `${f(x)} ${f(y)}`).join('L')}Z"/>`;
const line = (a, b, stroke, w) => `<path fill="none" stroke="${stroke}" stroke-width="${w}" d="M${f(a[0])} ${f(a[1])}L${f(b[0])} ${f(b[1])}"/>`;
const chevron = (y, w, h, t) => [[-w, y + h], [0, y], [w, y + h], [w, y + h + t], [0, y + t], [-w, y + h + t]];
const star = (cx, cy, ro, ri) => Array.from({ length: 10 }, (_, i) => {
  const r = i % 2 === 1 ? ri : ro, a = -Math.PI / 2 + i * Math.PI / 5;
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
});
const gear = (ro, ri) => {
  const pts = [];
  for (let i = 0; i < 8; i++) {
    const a = i * 45;
    for (const [da, r] of [[-11, ri], [-7, ro], [7, ro], [11, ri]]) {
      const rad = (a + da) * Math.PI / 180;
      pts.push([r * Math.cos(rad), r * Math.sin(rad)]);
    }
  }
  return pts;
};
const FLAME = 'M0 -52C6 -34 30 -20 30 10C30 34 16 48 0 48C-16 48 -30 34 -30 10C-30 -2 -24 -12 -18 -18C-16 -8 -10 -4 -6 -4C-10 -24 -6 -40 0 -52Z';
const FLAME_INNER = 'M0 6C6 16 14 22 14 31C14 40 8 46 0 46C-8 46 -14 40 -14 31C-14 22 -6 16 0 6Z';

function emblem(name, c) {
  switch (name) {
    case 'ROOKIE':
      return poly(chevron(-18, 38, 28, 17), c);
    case 'MOVER':
      return `<g transform="scale(1.12) translate(0 -2)">${
        poly([[-46, 16], [-46, -12], [-36, -26], [-20, -26], [-14, -10], [2, -8], [22, 2], [40, 6], [46, 12], [46, 16]], c)
      }${poly([[-46, 20], [46, 20], [44, 28], [-44, 28]], c)}${
        [[[-8, -12], [-4, -4]], [[2, -10], [6, -2]], [[12, -6], [16, 2]]].map(([a, b]) => line(a, b, FACE, 3)).join('')
      }</g>`;
    case 'CHARGER':
      return `<g transform="scale(1.05)">${poly([[-6, -48], [24, -48], [8, -12], [30, -12], [-16, 48], [-4, 6], [-28, 6]], c)}</g>`;
    case 'GRINDER': {
      const g = gear(46, 36).map(([x, y]) => `${f(x)} ${f(y)}`).join('L');
      // The gear with a round hole (even-odd), then a small dark chevron in the hole.
      return `<path fill="${c}" fill-rule="evenodd" d="M${g}Z M19 0A19 19 0 1 0 -19 0A19 19 0 1 0 19 0Z"/>${poly(chevron(-12, 15, 10, 8), FACE)}`;
    }
    case 'ATHLETE':
      return poly([[-34, -50], [-18, -50], [-2, -8], [-18, -8]], c) + poly([[34, -50], [18, -50], [2, -8], [18, -8]], c) +
        `<circle cx="0" cy="16" r="28" fill="${c}"/><circle cx="0" cy="16" r="19" fill="none" stroke="${FACE}" stroke-width="3.5"/>` +
        poly(star(0, 16, 11, 4.6), FACE);
    case 'BEAST': {
      let s = poly([[-34, -46], [-14, -30], [0, -33], [14, -30], [34, -46], [42, -14], [44, 6], [30, 30], [12, 44], [-12, 44], [-30, 30], [-44, 6], [-42, -14]], c);
      for (const k of [-1, 1]) {
        s += poly([[k * 32, -34], [k * 22, -27], [k * 35, -18]], FACE);
        s += poly([[k * 32, -10], [k * 12, -2], [k * 16, 6], [k * 30, 0]], FACE);
        s += line([k * 21, 8], [k * 25, 24], FACE, 3.5);
      }
      s += poly([[-8, 12], [8, 12], [0, 22]], FACE);
      s += line([0, 22], [0, 29], FACE, 3) + line([0, 29], [-10, 35], FACE, 3) + line([0, 29], [10, 35], FACE, 3);
      return `<g transform="scale(1.05) translate(0 2)">${s}</g>`;
    }
    case 'BURNA':
      return `<path fill="${c}" d="${FLAME}"/><path fill="${FACE}" d="${FLAME_INNER}"/>`;
  }
  return '';
}

/** One badge. `step` 1 to 5 draws that many stars above it (none for BURNA); `reserve` keeps their room. */
export function badge(name, { step = 0, reserve = false } = {}) {
  const c = COLOR[name];
  const tier = NAMES.indexOf(name) + 1;
  const top = name === 'BURNA';
  const stars = top ? 0 : Math.min(Math.max(step, 0), 5);
  const room = (stars > 0 || reserve) && !top ? 30 : 0;
  let s = '';
  if (tier === 4) for (const k of [-1, 1]) s += poly([[100 + k * 90, 62], [100 + k * 100, 74], [100 + k * 90, 86]], c);
  if (tier >= 5) for (const k of [-1, 1]) for (const [yc, len] of [[50, 56], [76, 46], [102, 36]]) {
    const x0 = 100 + k * 90, rise = len / 2;
    s += poly([[x0, yc - 8], [x0 + k * len, yc - 8 - rise], [x0, yc + 8]], c);
  }
  if (tier === 6) for (const k of [-1, 1]) s += poly([[100 + k * 36, 16], [100 + k * 68, -12], [100 + k * 66, 32]], c);
  if (tier === 7) for (const [x, sc, bottom] of [[100, 0.7, 14], [56, 0.5, 20], [144, 0.5, 20]]) {
    s += `<path fill="${c}" transform="translate(${x} ${f(bottom - 48 * sc)}) scale(${sc})" d="${FLAME}"/>`;
  }
  s += poly([[100, 4], [190, 30], [190, 126], [100, 216], [10, 126], [10, 30]], c);
  s += poly([[100, 17], [178, 40], [178, 121], [100, 203], [22, 121], [22, 40]], FACE);
  s += `<g transform="translate(100 96)">${emblem(name, c)}</g>`;
  for (let i = 0; i < stars; i++) {
    const a = (i - (stars - 1) / 2) * 18 * Math.PI / 180;
    s += poly(star(100 + 130 * Math.sin(a), -64 + 130 * (1 - Math.cos(a)), 14, 6), COLOR.BURNA);
  }
  const h = 288 + room;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-50 ${-(62 + room)} 300 ${h}" width="300" height="${h}" role="img" aria-label="${name[0] + name.slice(1).toLowerCase()}">${s}</svg>\n`;
}

const site = new URL('..', import.meta.url);
mkdirSync(new URL('img/ranks/', site), { recursive: true });
for (const n of NAMES) writeFileSync(new URL(`img/ranks/${n.toLowerCase()}.svg`, site), badge(n));
writeFileSync(new URL('img-src/screens/rank-athlete-2.svg', site), badge('ATHLETE', { step: 2 }));
console.log('badges written');
