// The Golden Skillet: kitchen state and rules.
// The kitchen is a set of stations. The chef carries one thing at a time:
// a raw ingredient, a prepared item, an empty plate, or a plate with items.
// Click a station (or walk up and press E): the chef walks there and the
// station does its job. Burners cook over time; leave food on too long and
// it burns and must be trashed.
import {
  VIEW, HUD_H, BOARD_H, SHIFT_SECONDS, CHEF_SPEED, CHEF_RADIUS,
  CHOPS_NEEDED, COOK_SECONDS, BURN_SECONDS,
  INGREDIENTS, RECIPES, recipeById, dayTuning,
} from './config.js';
import { mulberry32, pick } from './random.js';
import { sfx } from './audio.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_OVER = 'over';

const FLOOR_TOP = HUD_H + BOARD_H;
const PANTRY_ORDER = ['bun', 'patty', 'lettuce', 'tomato', 'cheese', 'pasta', 'egg', 'sauce'];

// Station rectangles. The chef stops at the approach point just outside each.
export const STATIONS = {
  pantry: PANTRY_ORDER.map((kind, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    return {
      id: `pantry-${kind}`, kind: 'pantry', ingredient: kind,
      x: 16 + col * 96, y: FLOOR_TOP + 24 + row * 108, w: 88, h: 96,
      // Stand to the right of the pantry block, clear of every bin's collision zone.
      approach: { x: 232, y: FLOOR_TOP + 24 + row * 108 + 48 },
    };
  }),
  board: {
    id: 'board', kind: 'board', x: 268, y: FLOOR_TOP + 16, w: 280, h: 84,
    approach: { x: 408, y: FLOOR_TOP + 122 },
  },
  stove: [0, 1].map((i) => ({
    id: `stove-${i}`, kind: 'stove', burner: i,
    x: 588 + i * 140, y: FLOOR_TOP + 16, w: 128, h: 84,
    approach: { x: 588 + i * 140 + 64, y: FLOOR_TOP + 122 },
  })),
  counter: {
    id: 'counter', kind: 'counter', x: 268, y: FLOOR_TOP + 218, w: 596, h: 96,
    approach: { x: 566, y: FLOOR_TOP + 336 },
  },
  serve: {
    id: 'serve', kind: 'serve', x: 968, y: FLOOR_TOP + 16, w: 296, h: 150,
    approach: { x: 1116, y: FLOOR_TOP + 188 },
  },
  trash: {
    id: 'trash', kind: 'trash', x: 1096, y: FLOOR_TOP + 384, w: 110, h: 96,
    // Stand above the bin, clear of its collision zone.
    approach: { x: 1151, y: FLOOR_TOP + 344 },
  },
};

export function allStations() {
  return [
    ...STATIONS.pantry,
    STATIONS.board,
    ...STATIONS.stove,
    STATIONS.counter,
    STATIONS.serve,
    STATIONS.trash,
  ];
}

function pointInRect(px, py, r) {
  return px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h;
}

export function stationAt(px, py) {
  return allStations().find((s) => pointInRect(px, py, s)) ?? null;
}

export function nearestStation(px, py, maxDist = 150) {
  let best = null;
  let bestD = maxDist;
  for (const s of allStations()) {
    const cx = Math.max(s.x, Math.min(px, s.x + s.w));
    const cy = Math.max(s.y, Math.min(py, s.y + s.h));
    const d = Math.hypot(px - cx, py - cy);
    if (d < bestD) {
      bestD = d;
      best = s;
    }
  }
  return best;
}

function newItem(kind, prep = 'raw') {
  return { type: 'item', kind, prep };
}
function newPlate() {
  return { type: 'plate', items: [] };
}
function itemReady(item) {
  return item.prep === 'ready' || item.prep === 'chopped' || item.prep === 'cooked';
}
function finishPrep(item) {
  const def = INGREDIENTS[item.kind];
  if (def.prep === 'none') return { ...item, prep: 'ready' };
  return item;
}

export function createGame(seed = 1) {
  const rng = mulberry32(seed);
  const state = {
    screen: SCREEN_TITLE,
    seed,
    rng,
    day: 1,
    timeLeft: SHIFT_SECONDS,
    elapsed: 0,
    coins: 0,
    score: 0,
    combo: 0,
    bestCombo: 0,
    served: 0,
    expired: 0,
    orders: [],
    nextOrderIn: 2,
    orderSeq: 0,
    chef: { x: 640, y: 620, tx: null, ty: null, wx: null, wy: null, target: null, facing: 1, walkPhase: 0 },
    carry: null,
    board: { item: null, chops: 0 },
    burners: [{ item: null, progress: 0 }, { item: null, progress: 0 }],
    plates: [],
    toast: null,
    toastUntil: 0,
    flash: null,
    flashUntil: 0,
    paused: false,
    over: null, // { won, stars }
    muted: false,
  };
  return state;
}

function setToast(state, text) {
  state.toast = text;
  state.toastUntil = state.elapsed + 2.2;
}

function setFlash(state, text, color) {
  state.flash = { text, color };
  state.flashUntil = state.elapsed + 1.1;
}

export function startShift(state) {
  const tuning = dayTuning(state.day);
  state.screen = SCREEN_PLAY;
  state.timeLeft = SHIFT_SECONDS;
  state.elapsed = 0;
  state.coins = 0;
  state.score = 0;
  state.combo = 0;
  state.served = 0;
  state.expired = 0;
  state.orders = [];
  state.nextOrderIn = 2;
  state.carry = null;
  state.board = { item: null, chops: 0 };
  state.burners = [{ item: null, progress: 0 }, { item: null, progress: 0 }];
  state.plates = [newPlate()];
  state.over = null;
  state.paused = false;
  state.chef.x = 640;
  state.chef.y = 620;
  state.chef.target = null;
  state.chef.tx = null;
  state.chef.ty = null;
  state.chef.wx = null;
  state.chef.wy = null;
  setToast(state, `Day ${state.day} — earn ${tuning.targetCoins} coins before closing!`);
  sfx.order();
}

function spawnOrder(state) {
  const tuning = dayTuning(state.day);
  if (state.orders.filter((o) => o.state === 'active').length >= tuning.maxOrders) return;
  const recipe = pick(state.rng, RECIPES);
  state.orderSeq += 1;
  state.orders.push({
    id: state.orderSeq,
    recipe,
    patience: tuning.patience,
    maxPatience: tuning.patience,
    state: 'active',
  });
  sfx.order();
}

function plateMatchesRecipe(plate, recipe) {
  if (plate.items.length !== recipe.needs.length) return false;
  const have = plate.items.map((i) => `${i.kind}:${i.prep}`).sort().join('|');
  const want = recipe.needs.map((n) => `${n.kind}:${n.prep}`).sort().join('|');
  return have === want;
}

function finishShift(state) {
  const tuning = dayTuning(state.day);
  const won = state.coins >= tuning.targetCoins;
  const stars = !won ? 0 : state.coins >= tuning.targetCoins * 1.6 ? 3 : state.coins >= tuning.targetCoins * 1.25 ? 2 : 1;
  state.over = { won, stars, target: tuning.targetCoins };
  state.screen = SCREEN_OVER;
  if (won) sfx.star();
  else sfx.error();
}

// --- Station actions: what happens when the chef arrives at a station ---
export function interactWith(state, station) {
  const chef = state.chef;
  const carry = state.carry;

  if (station.kind === 'pantry') {
    if (carry) { setToast(state, 'Hands full — serve or trash something first.'); sfx.error(); return; }
    state.carry = finishPrep(newItem(station.ingredient));
    sfx.pickup();
    return;
  }

  if (station.kind === 'board') {
    if (state.board.item) {
      // Chop what is on the board.
      state.board.chops += 1;
      sfx.chop();
      if (state.board.chops >= CHOPS_NEEDED) {
        state.board.item.prep = 'chopped';
        state.carry = state.board.item;
        state.board.item = null;
        state.board.chops = 0;
        setToast(state, `${INGREDIENTS[state.carry.kind].name} chopped — ready to plate!`);
        sfx.chopped();
      }
      return;
    }
    if (carry && carry.type === 'item' && INGREDIENTS[carry.kind].prep === 'chop' && carry.prep === 'raw') {
      state.board.item = carry;
      state.board.chops = 0;
      state.carry = null;
      sfx.place();
      setToast(state, 'Chop it! Click the board (or press Space) 3 times.');
      return;
    }
    if (carry) { setToast(state, 'Only raw lettuce, tomato or cheese go on the board.'); sfx.error(); return; }
    setToast(state, 'Bring a raw ingredient to chop.');
    return;
  }

  if (station.kind === 'stove') {
    const burner = state.burners[station.burner];
    if (burner.item) {
      if (burner.progress >= COOK_SECONDS && burner.progress < COOK_SECONDS + BURN_SECONDS) {
        if (carry) { setToast(state, 'Hands full — put something down first.'); sfx.error(); return; }
        burner.item.prep = 'cooked';
        state.carry = burner.item;
        burner.item = null;
        burner.progress = 0;
        sfx.cooked();
        return;
      }
      if (burner.progress < COOK_SECONDS) {
        setToast(state, 'Still cooking — watch the ring fill up.');
        sfx.error();
        return;
      }
      // Burnt: pick it up only to trash it.
      if (carry) { setToast(state, 'Hands full — put something down first.'); sfx.error(); return; }
      state.carry = burner.item;
      burner.item = null;
      burner.progress = 0;
      setToast(state, 'Burnt! Toss it in the trash.');
      sfx.burnt();
      return;
    }
    if (carry && carry.type === 'item' && INGREDIENTS[carry.kind].prep === 'cook' && carry.prep === 'raw') {
      burner.item = carry;
      burner.progress = 0;
      state.carry = null;
      sfx.sizzle();
      setToast(state, 'Cooking… grab it when the ring turns gold.');
      return;
    }
    if (carry) { setToast(state, 'Only raw patty, pasta or egg go on the stove.'); sfx.error(); return; }
    setToast(state, 'Bring a raw ingredient to cook.');
    return;
  }

  if (station.kind === 'counter') {
    if (carry && carry.type === 'plate') {
      if (state.plates.length >= 3) { setToast(state, 'The counter is full.'); sfx.error(); return; }
      state.plates.push(carry);
      state.carry = null;
      sfx.place();
      return;
    }
    if (carry && carry.type === 'item') {
      if (!itemReady(carry)) { setToast(state, 'That still needs chopping or cooking.'); sfx.error(); return; }
      // Add to a plate that does not already hold this kind, else start a new plate.
      let plate = state.plates.find((p) => !p.items.some((i) => i.kind === carry.kind));
      if (!plate && state.plates.length < 3) {
        plate = newPlate();
        state.plates.push(plate);
      }
      if (!plate) { setToast(state, 'No plate can take that — serve one first.'); sfx.error(); return; }
      plate.items.push(carry);
      state.carry = null;
      sfx.place();
      const match = RECIPES.find((r) => plateMatchesRecipe(plate, r));
      if (match) setToast(state, `${match.name} is complete — serve it!`);
      return;
    }
    if (!carry && state.plates.length > 0) {
      // Pick up the fullest plate (the one closest to a finished dish).
      let best = state.plates[0];
      for (const p of state.plates) if (p.items.length > best.items.length) best = p;
      state.plates.splice(state.plates.indexOf(best), 1);
      state.carry = best;
      sfx.pickup();
      return;
    }
    setToast(state, 'Bring a chopped or cooked ingredient to plate it.');
    return;
  }

  if (station.kind === 'serve') {
    if (!carry || carry.type !== 'plate') {
      setToast(state, 'Bring a finished plate to the serving window.');
      sfx.error();
      return;
    }
    if (carry.items.length === 0) { setToast(state, 'That plate is empty!'); sfx.error(); return; }
    const order = state.orders.find((o) => o.state === 'active' && plateMatchesRecipe(carry, o.recipe));
    if (!order) {
      setToast(state, 'No open order matches this plate.');
      sfx.error();
      return;
    }
    const tip = Math.round(order.recipe.price * 0.5 * (order.patience / order.maxPatience));
    const mult = 1 + Math.min(state.combo, 5) * 0.1;
    const earned = Math.round((order.recipe.price + tip) * mult);
    state.coins += earned;
    state.score += earned * 10 + Math.round(order.patience);
    state.combo += 1;
    state.bestCombo = Math.max(state.bestCombo, state.combo);
    state.served += 1;
    order.state = 'served';
    state.orders = state.orders.filter((o) => o.state === 'active');
    state.carry = null;
    setFlash(state, `ORDER UP! +${earned} coins`, '#2f9e44');
    setToast(state, `${order.recipe.name} served — ${state.combo > 1 ? `combo x${mult.toFixed(1)}!` : 'nice!'}`);
    sfx.serve();
    return;
  }

  if (station.kind === 'trash') {
    if (!carry) { setToast(state, 'Nothing to throw away.'); return; }
    state.carry = null;
    sfx.place();
    setToast(state, 'Tossed.');
    return;
  }
}

// --- Per-frame update ---
// Move one step toward (to) without passing it.
function axisStep(from, to, maxStep) {
  const d = to - from;
  if (Math.abs(d) <= maxStep) return to;
  return from + Math.sign(d) * maxStep;
}

function inflatedRect(s) {
  const r = CHEF_RADIUS - 4;
  return { x: s.x - r, y: s.y - r, w: s.w + 2 * r, h: s.h + 2 * r };
}

function stationAtPoint(state, x, y) {
  for (const s of allStations()) {
    const R = inflatedRect(s);
    if (x > R.x && x < R.x + R.w && y > R.y && y < R.y + R.h) return s;
  }
  return null;
}

// The corner of the blocking station's inflated rectangle nearest the goal,
// pushed a little clear of it: the waypoint the chef walks around.
// The corner the chef already stands at is excluded, so a reached waypoint
// never re-picks itself and the chef cannot loop on one corner.
function detourWaypoint(state, blocker, gx, gy) {
  const R = inflatedRect(blocker);
  const m = 10;
  const corners = [
    { x: R.x - m, y: R.y - m },
    { x: R.x + R.w + m, y: R.y - m },
    { x: R.x - m, y: R.y + R.h + m },
    { x: R.x + R.w + m, y: R.y + R.h + m },
  ];
  let best = null;
  let bestD = Infinity;
  for (const c of corners) {
    if (c.x < 24 || c.x > VIEW.width - 24 || c.y < FLOOR_TOP + 8 || c.y > VIEW.height - 24) continue;
    if (Math.hypot(c.x - state.chef.x, c.y - state.chef.y) < 12) continue;
    if (stationAtPoint(state, c.x, c.y)) continue;
    const d = Math.hypot(c.x - gx, c.y - gy);
    if (d < bestD) {
      bestD = d;
      best = c;
    }
  }
  return best;
}

function moveChefToward(state, dt) {
  const chef = state.chef;
  if (chef.tx === null || chef.ty === null) return;
  // Current goal: a detour waypoint when one is set, else the real target.
  const gx = chef.wx ?? chef.tx;
  const gy = chef.wy ?? chef.ty;
  const dx = gx - chef.x;
  const dy = gy - chef.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 6) {
    if (chef.wx !== null) {
      chef.wx = null;
      chef.wy = null;
      return;
    }
    chef.tx = null;
    chef.ty = null;
    if (chef.target) {
      const target = chef.target;
      chef.target = null;
      interactWith(state, target);
    }
    return;
  }
  const step = CHEF_SPEED * dt;
  const nx = dist <= step ? gx : chef.x + (dx / dist) * step;
  const ny = dist <= step ? gy : chef.y + (dy / dist) * step;
  if (collide(state, nx, ny)) {
    chef.x = nx;
    chef.y = ny;
  } else {
    // Blocked: pick a corner to walk around, then slide along the free axes.
    if (chef.wx === null) {
      const blocker = stationAtPoint(state, nx, ny);
      if (blocker) {
        const wp = detourWaypoint(state, blocker, chef.tx, chef.ty);
        if (wp) {
          chef.wx = wp.x;
          chef.wy = wp.y;
        }
      }
    }
    const sx = axisStep(chef.x, gx, step);
    if (collide(state, sx, chef.y)) chef.x = sx;
    const sy = axisStep(chef.y, gy, step);
    if (collide(state, chef.x, sy)) chef.y = sy;
  }
  chef.facing = dx !== 0 ? Math.sign(dx) : chef.facing;
  chef.walkPhase += dt * 10;
}

function moveChefKeys(state, dt, input) {
  const chef = state.chef;
  const v = input ? input.moveVector() : { x: 0, y: 0 };
  if (v.x === 0 && v.y === 0) return;
  chef.target = null; // Steering by keys cancels a click-to-move order.
  chef.wx = null;
  chef.wy = null;
  const step = CHEF_SPEED * dt;
  const nx = chef.x + v.x * step;
  const ny = chef.y + v.y * step;
  if (collide(state, nx, ny)) {
    chef.x = nx;
    chef.y = ny;
  } else if (collide(state, nx, chef.y)) {
    chef.x = nx;
  } else if (collide(state, chef.x, ny)) {
    chef.y = ny;
  }
  chef.facing = v.x !== 0 ? Math.sign(v.x) : chef.facing;
  chef.walkPhase += dt * 10;
}

function collide(state, nx, ny) {
  // Keep the chef out of station rectangles and inside the kitchen floor.
  const r = CHEF_RADIUS - 4;
  if (nx < 24 + r || nx > VIEW.width - 24 - r) return false;
  if (ny < FLOOR_TOP + 8 + r || ny > VIEW.height - 24 - r) return false;
  for (const s of allStations()) {
    if (nx > s.x - r && nx < s.x + s.w + r && ny > s.y - r && ny < s.y + s.h + r) return false;
  }
  return true;
}

export function update(state, dt, input) {
  if (state.screen !== SCREEN_PLAY || state.paused) return;
  state.elapsed += dt;
  state.timeLeft = Math.max(0, SHIFT_SECONDS - state.elapsed);

  // Timer end.
  if (state.timeLeft <= 0) {
    finishShift(state);
    return;
  }
  if (state.timeLeft <= 10.5 && Math.ceil(state.timeLeft) !== Math.ceil(state.timeLeft + dt)) {
    sfx.tick();
  }

  // Orders.
  state.nextOrderIn -= dt;
  if (state.nextOrderIn <= 0) {
    spawnOrder(state);
    state.nextOrderIn = dayTuning(state.day).spawnInterval;
  }
  for (const order of state.orders) {
    if (order.state !== 'active') continue;
    order.patience -= dt;
    if (order.patience <= 0) {
      order.state = 'expired';
      state.expired += 1;
      state.combo = 0;
      setFlash(state, 'A customer walked out!', '#c0392b');
      setToast(state, `${order.recipe.name} expired — combo lost.`);
      sfx.error();
    }
  }
  state.orders = state.orders.filter((o) => o.state === 'active');

  // Burners cook.
  for (const burner of state.burners) {
    if (!burner.item) continue;
    burner.progress += dt;
    if (burner.progress >= COOK_SECONDS + BURN_SECONDS && burner.item.prep !== 'burnt') {
      burner.item.prep = 'burnt';
      setToast(state, 'Something burned on the stove!');
      sfx.burnt();
    }
  }

  // Chef movement: click target wins, then WASD.
  const chef = state.chef;
  if (chef.tx !== null && chef.ty !== null) {
    moveChefToward(state, dt);
  } else {
    moveChefKeys(state, dt, input);
  }
}

export function clickStation(state, px, py) {
  if (state.screen !== SCREEN_PLAY) return false;
  const station = stationAt(px, py);
  if (!station) {
    // Walk to the clicked floor spot.
    state.chef.tx = Math.max(30, Math.min(VIEW.width - 30, px));
    state.chef.ty = Math.max(FLOOR_TOP + 14, Math.min(VIEW.height - 30, py));
    state.chef.target = null;
    state.chef.wx = null;
    state.chef.wy = null;
    return true;
  }
  state.chef.tx = station.approach.x;
  state.chef.ty = station.approach.y;
  state.chef.target = station;
  state.chef.wx = null;
  state.chef.wy = null;
  return true;
}

export function interactKey(state) {
  if (state.screen !== SCREEN_PLAY) return;
  // Space on the chopping board chops in place; E uses the nearest station.
  const chef = state.chef;
  const board = STATIONS.board;
  const nearBoard = Math.hypot(chef.x - (board.x + board.w / 2), chef.y - (board.y + board.h + 30)) < 90;
  if (nearBoard && state.board.item) {
    interactWith(state, board);
    return;
  }
  const station = nearestStation(chef.x, chef.y, 170);
  if (station) {
    chef.tx = station.approach.x;
    chef.ty = station.approach.y;
    chef.target = station;
    chef.wx = null;
    chef.wy = null;
    // Already standing at the approach point: act at once.
    if (Math.hypot(chef.x - station.approach.x, chef.y - station.approach.y) < 24) {
      chef.tx = null;
      chef.ty = null;
      chef.target = null;
      interactWith(state, station);
    }
  }
}

export { VIEW, FLOOR_TOP, PANTRY_ORDER, newItem, newPlate, itemReady, recipeById };
