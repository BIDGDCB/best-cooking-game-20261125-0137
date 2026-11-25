// The Golden Skillet: every pixel is drawn here with canvas shapes —
// the kitchen, the order board, the chef, the food and the overlays.
// No images, no fonts fetched: the game loads nothing over the network.
import { VIEW, HUD_H, BOARD_H, FLOOR_TOP, STATIONS, SCREEN_TITLE, SCREEN_OVER } from './kitchen.js';
import { INGREDIENTS, RECIPES, SHIFT_SECONDS, CHOPS_NEEDED, COOK_SECONDS, BURN_SECONDS, dayTuning } from './config.js';

const CREAM = '#fdf6e9';
const WOOD = '#b07a45';
const WOOD_DARK = '#8a5c31';
const TEAL = '#2a9d8f';
const TEAL_DARK = '#1f7a70';
const RED = '#e2574c';
const INK = '#3a2e26';

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, str, x, y, size, color, weight = '700', align = 'left') {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px "Trebuchet MS", "Segoe UI", Verdana, sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(str, x, y);
}

function formatTime(seconds) {
  const s = Math.max(0, Math.ceil(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

// --- Food icons: small vector drawings, one per ingredient + prep state ---
export function drawIngredient(ctx, kind, prep, cx, cy, size) {
  const def = INGREDIENTS[kind];
  const s = size;
  ctx.save();
  ctx.translate(cx, cy);
  if (kind === 'bun') {
    ctx.fillStyle = def.color;
    ctx.beginPath();
    ctx.arc(0, s * 0.08, s * 0.42, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = def.dark;
    ctx.fillRect(-s * 0.42, s * 0.08, s * 0.84, s * 0.1);
    ctx.fillStyle = '#fff3d6';
    for (const [dx, dy] of [[-0.2, -0.18], [0.05, -0.28], [0.24, -0.12]]) {
      ctx.beginPath();
      ctx.ellipse(dx * s, dy * s, s * 0.05, s * 0.03, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (kind === 'patty') {
    ctx.fillStyle = prep === 'burnt' ? '#2b1d16' : prep === 'cooked' ? '#6e4527' : def.color;
    rr(ctx, -s * 0.44, -s * 0.16, s * 0.88, s * 0.32, s * 0.14);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    rr(ctx, -s * 0.34, -s * 0.12, s * 0.68, s * 0.08, s * 0.04);
    ctx.fill();
  } else if (kind === 'lettuce') {
    ctx.fillStyle = def.color;
    for (let i = 0; i < 3; i += 1) {
      ctx.beginPath();
      ctx.ellipse(-s * 0.24 + i * s * 0.24, 0, s * 0.26, s * 0.2, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.strokeStyle = def.dark;
    ctx.lineWidth = s * 0.04;
    ctx.beginPath();
    ctx.moveTo(-s * 0.3, 0);
    ctx.quadraticCurveTo(0, s * 0.12, s * 0.3, 0);
    ctx.stroke();
  } else if (kind === 'tomato') {
    ctx.fillStyle = def.color;
    ctx.beginPath();
    ctx.arc(0, 0, s * 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f6a09a';
    ctx.beginPath();
    ctx.arc(-s * 0.12, -s * 0.12, s * 0.16, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = def.dark;
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.4);
    ctx.lineTo(-s * 0.08, -s * 0.52);
    ctx.lineTo(s * 0.08, -s * 0.52);
    ctx.closePath();
    ctx.fill();
  } else if (kind === 'cheese') {
    ctx.fillStyle = def.color;
    ctx.beginPath();
    ctx.moveTo(-s * 0.42, s * 0.28);
    ctx.lineTo(s * 0.42, s * 0.28);
    ctx.lineTo(s * 0.42, -s * 0.1);
    ctx.lineTo(-s * 0.42, -s * 0.28);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = def.dark;
    for (const [dx, dy] of [[-0.18, 0.08], [0.12, 0.14], [0.22, -0.02]]) {
      ctx.beginPath();
      ctx.arc(dx * s, dy * s, s * 0.06, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (kind === 'pasta') {
    ctx.strokeStyle = def.color;
    ctx.lineWidth = s * 0.09;
    ctx.lineCap = 'round';
    for (let i = 0; i < 3; i += 1) {
      ctx.beginPath();
      ctx.arc(0, (i - 1) * s * 0.16, s * (0.3 - i * 0.05), 0.3, Math.PI * 2 - 0.3);
      ctx.stroke();
    }
  } else if (kind === 'egg') {
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(0, 0, s * 0.44, s * 0.34, 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = prep === 'burnt' ? '#5a3a1a' : '#f6b93b';
    ctx.beginPath();
    ctx.arc(s * 0.06, s * 0.02, s * 0.2, 0, Math.PI * 2);
    ctx.fill();
  } else if (kind === 'sauce') {
    ctx.fillStyle = def.color;
    rr(ctx, -s * 0.2, -s * 0.42, s * 0.4, s * 0.84, s * 0.1);
    ctx.fill();
    ctx.fillStyle = '#7e2318';
    rr(ctx, -s * 0.12, -s * 0.52, s * 0.24, s * 0.14, s * 0.05);
    ctx.fill();
    ctx.fillStyle = CREAM;
    ctx.fillRect(-s * 0.2, -s * 0.08, s * 0.4, s * 0.2);
  }
  if (prep === 'burnt') {
    ctx.strokeStyle = '#1d120c';
    ctx.lineWidth = s * 0.05;
    ctx.beginPath();
    ctx.moveTo(-s * 0.3, -s * 0.3);
    ctx.lineTo(s * 0.3, s * 0.3);
    ctx.moveTo(s * 0.3, -s * 0.3);
    ctx.lineTo(-s * 0.3, s * 0.3);
    ctx.stroke();
  }
  ctx.restore();
}

function drawPlate(ctx, plate, cx, cy, scale = 1) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);
  ctx.fillStyle = '#e8e2d4';
  ctx.beginPath();
  ctx.ellipse(0, 0, 46, 16, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.ellipse(0, -2, 40, 13, 0, 0, Math.PI * 2);
  ctx.fill();
  // Stack the items so a dish mid-assembly reads at a glance.
  const n = plate.items.length;
  plate.items.forEach((item, i) => {
    drawIngredient(ctx, item.kind, item.prep, 0, -6 - (n - 1 - i) * 7, 34);
  });
  ctx.restore();
}

function drawCarried(ctx, carry, x, y) {
  if (!carry) return;
  ctx.save();
  ctx.translate(x, y - 34);
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.beginPath();
  ctx.ellipse(0, 40, 26, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  if (carry.type === 'plate') drawPlate(ctx, carry, 0, 0, 0.85);
  else drawIngredient(ctx, carry.kind, carry.prep, 0, 0, 40);
  ctx.restore();
}

function drawChef(ctx, chef) {
  const bob = Math.sin(chef.walkPhase) * 2;
  ctx.save();
  ctx.translate(chef.x, chef.y + bob * 0.4);
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.beginPath();
  ctx.ellipse(0, 24, 24, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  // Body + apron.
  ctx.fillStyle = '#f4f1ea';
  rr(ctx, -17, -8, 34, 32, 12);
  ctx.fill();
  ctx.fillStyle = TEAL;
  rr(ctx, -13, 4, 26, 20, 8);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(-13, 2, 26, 4);
  // Arms.
  ctx.fillStyle = '#f4f1ea';
  ctx.beginPath();
  ctx.arc(-19, 4, 7, 0, Math.PI * 2);
  ctx.arc(19, 4, 7, 0, Math.PI * 2);
  ctx.fill();
  // Head + toque.
  ctx.fillStyle = '#f2c79b';
  ctx.beginPath();
  ctx.arc(0, -22, 13, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(-8, -34, 8, 0, Math.PI * 2);
  ctx.arc(0, -38, 9, 0, Math.PI * 2);
  ctx.arc(8, -34, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(-14, -36, 28, 8);
  // Eyes look the way the chef walks.
  ctx.fillStyle = INK;
  ctx.beginPath();
  ctx.arc(chef.facing * 3 - 4, -22, 1.8, 0, Math.PI * 2);
  ctx.arc(chef.facing * 3 + 4, -22, 1.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawHud(ctx, state) {
  const tuning = dayTuning(state.day);
  ctx.fillStyle = '#2b2118';
  ctx.fillRect(0, 0, VIEW.width, HUD_H);
  ctx.fillStyle = '#f6b93b';
  text(ctx, '🍳 THE GOLDEN SKILLET', 20, HUD_H / 2 + 1, 24, '#f6b93b', '800');
  text(ctx, `DAY ${state.day}`, 330, HUD_H / 2 + 1, 18, CREAM, '700');
  // Shift timer: big, and red when it is nearly over.
  const low = state.timeLeft <= 30;
  const timerColor = low ? '#ff6b5e' : CREAM;
  ctx.fillStyle = low ? 'rgba(255,107,94,0.16)' : 'rgba(255,255,255,0.08)';
  rr(ctx, 420, 12, 150, 48, 10);
  ctx.fill();
  text(ctx, '⏱ ' + formatTime(state.timeLeft), 495, HUD_H / 2 + 1, 26, timerColor, '800', 'center');
  // Coins + target.
  text(ctx, `🪙 ${state.coins}`, 610, HUD_H / 2 + 1, 24, '#ffd76a', '800');
  const pct = Math.min(1, state.coins / tuning.targetCoins);
  ctx.fillStyle = 'rgba(255,255,255,0.15)';
  rr(ctx, 700, 26, 170, 18, 9);
  ctx.fill();
  ctx.fillStyle = pct >= 1 ? '#7dc383' : '#f6b93b';
  rr(ctx, 700, 26, Math.max(18, 170 * pct), 18, 9);
  ctx.fill();
  text(ctx, `target ${tuning.targetCoins}`, 785, HUD_H / 2 + 1, 14, CREAM, '700', 'center');
  text(ctx, `SCORE ${state.score}`, 920, HUD_H / 2 + 1, 18, CREAM, '700');
  if (state.combo > 1) {
    text(ctx, `🔥 COMBO x${(1 + Math.min(state.combo, 5) * 0.1).toFixed(1)}`, 1080, HUD_H / 2 + 1, 18, '#ff9f43', '800');
  }
  text(ctx, state.muted ? '🔇 M' : '🔊 M', 1236, HUD_H / 2 + 1, 15, '#cbb9a3', '700', 'right');
}

function drawOrderBoard(ctx, state) {
  ctx.fillStyle = '#4a3423';
  ctx.fillRect(0, HUD_H, VIEW.width, BOARD_H);
  ctx.fillStyle = '#6b4a2f';
  ctx.fillRect(0, HUD_H, VIEW.width, 4);
  text(ctx, 'ORDER BOARD', 20, HUD_H + 26, 15, '#e8c98f', '800');
  text(ctx, 'serve the ticket, earn the tip — patience pays', 20, HUD_H + 52, 13, '#cbb9a3', '600');
  if (state.orders.length === 0) {
    text(ctx, 'No orders yet — the lunch rush is coming…', 300, HUD_H + BOARD_H / 2, 18, '#e8c98f', '600');
    return;
  }
  state.orders.forEach((order, i) => {
    const x = 300 + i * 232;
    const y = HUD_H + 10;
    const w = 220;
    const h = BOARD_H - 20;
    const urgent = order.patience < 15;
    ctx.fillStyle = '#fffdf6';
    rr(ctx, x, y, w, h, 10);
    ctx.fill();
    ctx.strokeStyle = urgent ? RED : '#d8c9a8';
    ctx.lineWidth = urgent ? 3 : 1.5;
    rr(ctx, x, y, w, h, 10);
    ctx.stroke();
    text(ctx, `#${order.id}  ${order.recipe.name.toUpperCase()}`, x + 12, y + 16, 14, INK, '800');
    order.recipe.needs.forEach((need, j) => {
      drawIngredient(ctx, need.kind, need.prep, x + 28 + j * 44, y + 46, 30);
    });
    text(ctx, `$${order.recipe.price}`, x + w - 12, y + 46, 16, '#2f9e44', '800', 'right');
    // Patience bar.
    const pw = w - 24;
    ctx.fillStyle = '#eee5d3';
    rr(ctx, x + 12, y + h - 18, pw, 9, 4);
    ctx.fill();
    const frac = Math.max(0, order.patience / order.maxPatience);
    ctx.fillStyle = frac > 0.5 ? '#7dc383' : frac > 0.25 ? '#f6b93b' : RED;
    rr(ctx, x + 12, y + h - 18, Math.max(9, pw * frac), 9, 4);
    ctx.fill();
  });
}

function drawPantry(ctx, state) {
  ctx.fillStyle = '#7a4a26';
  rr(ctx, 8, FLOOR_TOP + 8, 200, 452, 12);
  ctx.fill();
  text(ctx, 'PANTRY', 108, FLOOR_TOP + 30, 15, '#f6d9a0', '800', 'center');
  for (const station of STATIONS.pantry) {
    const def = INGREDIENTS[station.ingredient];
    ctx.fillStyle = '#fdf6e9';
    rr(ctx, station.x, station.y, station.w, station.h, 10);
    ctx.fill();
    ctx.strokeStyle = '#d8c9a8';
    ctx.lineWidth = 1.5;
    rr(ctx, station.x, station.y, station.w, station.h, 10);
    ctx.stroke();
    drawIngredient(ctx, station.ingredient, 'raw', station.x + station.w / 2, station.y + 34, 44);
    text(ctx, def.name.toUpperCase(), station.x + station.w / 2, station.y + 74, 12, INK, '800', 'center');
    text(ctx, def.prep === 'none' ? 'ready' : def.prep === 'chop' ? 'chop ✂' : 'cook 🍳', station.x + station.w / 2, station.y + 88, 10, '#8a7a68', '600', 'center');
  }
}

function drawBoard(ctx, state) {
  const b = STATIONS.board;
  ctx.fillStyle = WOOD_DARK;
  rr(ctx, b.x - 8, b.y - 8, b.w + 16, b.h + 16, 12);
  ctx.fill();
  ctx.fillStyle = WOOD;
  rr(ctx, b.x, b.y, b.w, b.h, 10);
  ctx.fill();
  text(ctx, '✂ CHOPPING BOARD', b.x + 14, b.y + 18, 13, '#fff3d6', '800');
  if (state.board.item) {
    drawIngredient(ctx, state.board.item.kind, state.board.item.prep, b.x + 90, b.y + 52, 52);
    for (let i = 0; i < CHOPS_NEEDED; i += 1) {
      ctx.fillStyle = i < state.board.chops ? '#7dc383' : '#e8dcc4';
      ctx.beginPath();
      ctx.arc(b.x + 170 + i * 26, b.y + 52, 9, 0, Math.PI * 2);
      ctx.fill();
    }
    text(ctx, 'click to chop!', b.x + 150, b.y + 30, 12, '#fff3d6', '700', 'center');
  } else {
    text(ctx, 'bring lettuce, tomato or cheese', b.x + 14, b.y + 52, 13, '#ffe9c4', '600');
  }
}

function drawStove(ctx, state) {
  for (const station of STATIONS.stove) {
    const burner = state.burners[station.burner];
    ctx.fillStyle = '#3c3f45';
    rr(ctx, station.x - 8, station.y - 8, station.w + 16, station.h + 16, 12);
    ctx.fill();
    ctx.fillStyle = '#22242a';
    rr(ctx, station.x, station.y, station.w, station.h, 10);
    ctx.fill();
    const cx = station.x + station.w / 2;
    const cy = station.y + station.h / 2 + 6;
    ctx.fillStyle = '#55585f';
    ctx.beginPath();
    ctx.arc(cx, cy, 34, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#2a2c31';
    ctx.beginPath();
    ctx.arc(cx, cy, 28, 0, Math.PI * 2);
    ctx.fill();
    if (burner.item) {
      const cooking = burner.progress < COOK_SECONDS;
      const done = !cooking && burner.progress < COOK_SECONDS + BURN_SECONDS;
      // Flame.
      if (cooking) {
        ctx.fillStyle = '#ff9f43';
        ctx.beginPath();
        ctx.ellipse(cx, cy + 26, 22, 8, 0, Math.PI, 0);
        ctx.fill();
        ctx.fillStyle = '#f6b93b';
        ctx.beginPath();
        ctx.ellipse(cx, cy + 24, 13, 5, 0, Math.PI, 0);
        ctx.fill();
      }
      drawIngredient(ctx, burner.item.kind, burner.item.prep, cx, cy - 4, 46);
      // Progress ring.
      const frac = Math.min(1, burner.progress / COOK_SECONDS);
      ctx.strokeStyle = done ? '#7dc383' : '#f6b93b';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(cx, cy, 40, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2);
      ctx.stroke();
      if (burner.item.prep === 'burnt') {
        text(ctx, 'BURNT!', cx, cy - 46, 13, RED, '800', 'center');
      } else if (done) {
        text(ctx, 'READY!', cx, cy - 46, 13, '#7dc383', '800', 'center');
      }
    } else {
      text(ctx, 'STOVE', cx, cy, 12, '#9aa0a8', '800', 'center');
    }
  }
}

function drawCounter(ctx, state) {
  const c = STATIONS.counter;
  ctx.fillStyle = WOOD_DARK;
  rr(ctx, c.x - 8, c.y - 8, c.w + 16, c.h + 16, 12);
  ctx.fill();
  ctx.fillStyle = WOOD;
  rr(ctx, c.x, c.y, c.w, c.h, 10);
  ctx.fill();
  text(ctx, '🍽 ASSEMBLY COUNTER', c.x + 14, c.y + 18, 13, '#fff3d6', '800');
  if (state.plates.length === 0) {
    text(ctx, 'plates appear here — add chopped & cooked food to build a dish', c.x + 14, c.y + 58, 13, '#ffe9c4', '600');
  }
  state.plates.forEach((plate, i) => {
    const cx = c.x + 90 + i * 200;
    drawPlate(ctx, plate, cx, c.y + 62, 1);
    const match = RECIPES.find((r) => plate.items.length === r.needs.length
      && plate.items.map((x) => `${x.kind}:${x.prep}`).sort().join('|')
        === r.needs.map((n) => `${n.kind}:${n.prep}`).sort().join('|'));
    if (match) {
      ctx.fillStyle = '#2f9e44';
      rr(ctx, cx - 62, c.y + 76, 124, 18, 9);
      ctx.fill();
      text(ctx, `✓ ${match.name}`, cx, c.y + 85, 11, '#ffffff', '800', 'center');
    } else if (plate.items.length > 0) {
      text(ctx, `${plate.items.length} item${plate.items.length > 1 ? 's' : ''} on plate`, cx, c.y + 85, 11, '#ffe9c4', '700', 'center');
    }
  });
}

function drawServe(ctx, state) {
  const s = STATIONS.serve;
  ctx.fillStyle = '#5d3a24';
  rr(ctx, s.x - 8, s.y - 8, s.w + 16, s.h + 16, 12);
  ctx.fill();
  ctx.fillStyle = '#2b2118';
  rr(ctx, s.x, s.y, s.w, s.h, 10);
  ctx.fill();
  ctx.fillStyle = '#f6b93b';
  rr(ctx, s.x + 14, s.y + 12, 120, 26, 8);
  ctx.fill();
  text(ctx, '🔔 SERVE', s.x + 74, s.y + 25, 15, '#2b2118', '800', 'center');
  text(ctx, 'bring the finished plate here', s.x + 14, s.y + 58, 13, '#e8c98f', '600');
  // A little queue of waiting customers, drawn as heads.
  const heads = ['#f2c79b', '#8a5a3b', '#f6d7a8'];
  heads.forEach((color, i) => {
    const hx = s.x + 60 + i * 60;
    const hy = s.y + 108;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(hx, hy, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = ['#e2574c', '#2a9d8f', '#f6b93b'][i];
    ctx.beginPath();
    ctx.arc(hx, hy - 10, 18, Math.PI, 0);
    ctx.fill();
  });
  text(ctx, 'hungry customers wait…', s.x + s.w / 2, s.y + s.h - 12, 12, '#cbb9a3', '600', 'center');
}

function drawTrash(ctx) {
  const t = STATIONS.trash;
  ctx.fillStyle = '#7d8a96';
  rr(ctx, t.x, t.y, t.w, t.h, 10);
  ctx.fill();
  ctx.fillStyle = '#5d6b76';
  rr(ctx, t.x + 8, t.y + 8, t.w - 16, t.h - 16, 8);
  ctx.fill();
  text(ctx, '🗑', t.x + t.w / 2, t.y + 34, 26, '#ffffff', '700', 'center');
  text(ctx, 'TRASH', t.x + t.w / 2, t.y + 72, 12, '#ffffff', '800', 'center');
}

function drawDecor(ctx) {
  // Wall poster + plant for a kitchen with a look of its own.
  ctx.fillStyle = '#fffdf6';
  rr(ctx, 980, FLOOR_TOP + 210, 140, 96, 8);
  ctx.fill();
  ctx.strokeStyle = TEAL;
  ctx.lineWidth = 3;
  rr(ctx, 980, FLOOR_TOP + 210, 140, 96, 8);
  ctx.stroke();
  text(ctx, 'MENU', 1050, FLOOR_TOP + 234, 16, TEAL_DARK, '800', 'center');
  text(ctx, 'Burger $18', 1050, FLOOR_TOP + 258, 12, INK, '600', 'center');
  text(ctx, 'Pasta $20', 1050, FLOOR_TOP + 276, 12, INK, '600', 'center');
  text(ctx, 'Salad $14', 1050, FLOOR_TOP + 294, 12, INK, '600', 'center');
  ctx.fillStyle = '#c0392b';
  ctx.beginPath();
  ctx.arc(1180, FLOOR_TOP + 330, 26, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#7dc383';
  ctx.beginPath();
  ctx.ellipse(1180, FLOOR_TOP + 300, 10, 20, -0.4, 0, Math.PI * 2);
  ctx.ellipse(1180, FLOOR_TOP + 300, 10, 20, 0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#8a5c31';
  rr(ctx, 1156, FLOOR_TOP + 348, 48, 18, 6);
  ctx.fill();
  text(ctx, 'WASD / click to move  •  E or click a station to use it', 640, VIEW.height - 14, 13, '#8a7a68', '600', 'center');
}

function drawToast(ctx, state) {
  if (!state.toast || state.elapsed > state.toastUntil) return;
  ctx.fillStyle = 'rgba(43,33,24,0.88)';
  const w = Math.min(560, 20 + state.toast.length * 8.4);
  rr(ctx, VIEW.width / 2 - w / 2, VIEW.height - 64, w, 34, 17);
  ctx.fill();
  text(ctx, state.toast, VIEW.width / 2, VIEW.height - 46, 15, CREAM, '700', 'center');
}

function drawFlash(ctx, state) {
  if (!state.flash || state.elapsed > state.flashUntil) return;
  const alpha = Math.min(1, (state.flashUntil - state.elapsed) / 0.4);
  ctx.save();
  ctx.globalAlpha = alpha;
  text(ctx, state.flash.text, VIEW.width / 2, 260, 44, state.flash.color, '800', 'center');
  ctx.restore();
}

function drawFloor(ctx) {
  ctx.fillStyle = '#e9dcc3';
  ctx.fillRect(0, FLOOR_TOP, VIEW.width, VIEW.height - FLOOR_TOP);
  const tile = 64;
  for (let y = FLOOR_TOP; y < VIEW.height; y += tile) {
    for (let x = 0; x < VIEW.width; x += tile) {
      const odd = ((x / tile) + (y / tile)) % 2 === 0;
      ctx.fillStyle = odd ? '#efe3cb' : '#e2d2b2';
      ctx.fillRect(x, y, tile, tile);
    }
  }
  ctx.strokeStyle = 'rgba(0,0,0,0.05)';
  ctx.lineWidth = 1;
  for (let y = FLOOR_TOP; y < VIEW.height; y += tile) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(VIEW.width, y);
    ctx.stroke();
  }
  for (let x = 0; x < VIEW.width; x += tile) {
    ctx.beginPath();
    ctx.moveTo(x, FLOOR_TOP);
    ctx.lineTo(x, VIEW.height);
    ctx.stroke();
  }
}

function drawTitle(ctx, state) {
  ctx.fillStyle = 'rgba(43,33,24,0.72)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  ctx.fillStyle = '#fffdf6';
  rr(ctx, 290, 130, 700, 500, 20);
  ctx.fill();
  ctx.strokeStyle = TEAL;
  ctx.lineWidth = 4;
  rr(ctx, 290, 130, 700, 500, 20);
  ctx.stroke();
  text(ctx, '🍳', 640, 200, 64, INK, '700', 'center');
  text(ctx, 'THE GOLDEN SKILLET', 640, 262, 44, TEAL_DARK, '800', 'center');
  text(ctx, 'a timed cooking game', 640, 300, 20, '#8a7a68', '600', 'center');
  const lines = [
    '1 · Click the pantry to grab an ingredient.',
    '2 · Chop lettuce, tomato & cheese on the board —',
    '     cook patty, pasta & egg on the stove.',
    '3 · Build the dish on a plate at the counter.',
    '4 · Serve it at the window before patience runs out!',
  ];
  lines.forEach((line, i) => {
    text(ctx, line, 640, 348 + i * 28, 17, INK, '600', 'center');
  });
  text(ctx, 'Burnt food goes in the trash. Combos pay extra. Good luck, chef!', 640, 508, 15, '#8a7a68', '600', 'center');
  ctx.fillStyle = TEAL;
  rr(ctx, 490, 540, 300, 56, 14);
  ctx.fill();
  text(ctx, '▶  START THE SHIFT', 640, 568, 22, '#ffffff', '800', 'center');
  text(ctx, 'Enter / click to start  •  WASD or mouse to move  •  E to use a station', 640, 612, 13, '#8a7a68', '600', 'center');
}

function drawOver(ctx, state) {
  const over = state.over;
  ctx.fillStyle = 'rgba(43,33,24,0.72)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  ctx.fillStyle = '#fffdf6';
  rr(ctx, 340, 150, 600, 470, 20);
  ctx.fill();
  ctx.strokeStyle = over.won ? TEAL : RED;
  ctx.lineWidth = 4;
  rr(ctx, 340, 150, 600, 470, 20);
  ctx.stroke();
  text(ctx, over.won ? '🎉 SHIFT COMPLETE!' : '😮 SHIFT OVER', 640, 210, 36, over.won ? TEAL_DARK : RED, '800', 'center');
  const stars = '★'.repeat(over.stars) + '☆'.repeat(3 - over.stars);
  text(ctx, stars, 640, 268, 44, '#f6b93b', '800', 'center');
  text(ctx, `Day ${state.day} — you earned ${state.coins} coins (target ${over.target})`, 640, 322, 19, INK, '700', 'center');
  text(ctx, `Dishes served: ${state.served}   •   Walk-outs: ${state.expired}   •   Best combo: x${(1 + Math.min(state.bestCombo, 5) * 0.1).toFixed(1)}`, 640, 356, 16, '#8a7a68', '600', 'center');
  text(ctx, `Final score: ${state.score}`, 640, 392, 20, INK, '800', 'center');
  if (over.won) {
    ctx.fillStyle = TEAL;
    rr(ctx, 490, 430, 300, 56, 14);
    ctx.fill();
    text(ctx, '▶  NEXT DAY', 640, 458, 22, '#ffffff', '800', 'center');
  } else {
    ctx.fillStyle = RED;
    rr(ctx, 490, 430, 300, 56, 14);
    ctx.fill();
    text(ctx, '↻  TRY AGAIN', 640, 458, 22, '#ffffff', '800', 'center');
  }
  text(ctx, 'Enter / click to continue', 640, 520, 14, '#8a7a68', '600', 'center');
  text(ctx, 'Tip: chop while the patty cooks — never stand still in a rush.', 640, 580, 14, '#8a7a68', '600', 'center');
}

export function render(ctx, state) {
  ctx.clearRect(0, 0, VIEW.width, VIEW.height);
  drawFloor(ctx);
  drawHud(ctx, state);
  drawOrderBoard(ctx, state);
  drawPantry(ctx, state);
  drawBoard(ctx, state);
  drawStove(ctx, state);
  drawCounter(ctx, state);
  drawServe(ctx, state);
  drawTrash(ctx);
  drawDecor(ctx);
  drawChef(ctx, state.chef);
  drawCarried(ctx, state.carry, state.chef.x, state.chef.y);
  drawToast(ctx, state);
  drawFlash(ctx, state);
  if (state.screen === SCREEN_TITLE) drawTitle(ctx, state);
  else if (state.screen === SCREEN_OVER) drawOver(ctx, state);
  if (state.paused && state.screen === 'play') {
    ctx.fillStyle = 'rgba(43,33,24,0.6)';
    ctx.fillRect(0, 0, VIEW.width, VIEW.height);
    text(ctx, '⏸ PAUSED — press P to resume', 640, 400, 32, CREAM, '800', 'center');
  }
}
