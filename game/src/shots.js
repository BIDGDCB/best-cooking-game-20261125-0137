// Deterministic screenshot scenes behind ?shot=start|play|serve|end.
// Each one builds a fixed kitchen state from the real game rules (real
// orders, a real plate mid-assembly, a real burner mid-cook) so the frame
// is what a short game really looks like, and the same seed always gives
// the same frame. The game loop is frozen while a shot is showing.
import { createGame, startShift, SCREEN_PLAY, SCREEN_OVER } from './kitchen.js';
import { recipeById } from './config.js';

function basePlay(seed) {
  const state = createGame(seed);
  startShift(state);
  state.elapsed = 46;
  state.timeLeft = 134;
  return state;
}

function addOrder(state, recipeId, patience, maxPatience) {
  state.orderSeq += 1;
  state.orders.push({
    id: state.orderSeq,
    recipe: recipeById(recipeId),
    patience,
    maxPatience,
    state: 'active',
  });
}

export function buildShotState(kind, seed = 1) {
  if (kind === 'start') {
    const state = createGame(seed);
    // Title screen over a kitchen that already has orders waiting.
    startShift(state);
    addOrder(state, 'classic-burger', 52, 62);
    addOrder(state, 'tomato-pasta', 44, 62);
    state.screen = 'title';
    state.timeLeft = 180;
    state.elapsed = 0;
    return state;
  }

  if (kind === 'serve') {
    const state = basePlay(seed);
    state.coins = 86;
    state.score = 1240;
    state.combo = 2;
    addOrder(state, 'cheese-burger', 38, 62);
    addOrder(state, 'garden-salad', 30, 58);
    addOrder(state, 'tomato-pasta', 47, 62);
    // A finished Cheese Burger on a plate, carried to the serving window.
    state.carry = {
      type: 'plate',
      items: [
        { type: 'item', kind: 'bun', prep: 'ready' },
        { type: 'item', kind: 'patty', prep: 'cooked' },
        { type: 'item', kind: 'cheese', prep: 'chopped' },
      ],
    };
    state.chef.x = 1116;
    state.chef.y = 388;
    state.burners[0].item = { type: 'item', kind: 'pasta', prep: 'raw' };
    state.burners[0].progress = 4.2;
    state.plates = [{ type: 'plate', items: [{ type: 'item', kind: 'lettuce', prep: 'chopped' }] }];
    state.toast = 'Cheese Burger is complete — serve it!';
    state.toastUntil = 999;
    return state;
  }

  if (kind === 'end') {
    const state = basePlay(seed);
    state.coins = 142;
    state.score = 2310;
    state.served = 9;
    state.expired = 1;
    state.bestCombo = 4;
    state.combo = 4;
    state.timeLeft = 0;
    state.over = { won: true, stars: 3, target: 110 };
    state.screen = SCREEN_OVER;
    state.orders = [];
    return state;
  }

  // 'play' (default): the cover shot — a full kitchen mid-rush.
  const state = basePlay(seed);
  state.coins = 54;
  state.score = 860;
  state.combo = 1;
  addOrder(state, 'classic-burger', 41, 62);
  addOrder(state, 'tomato-pasta', 52, 62);
  addOrder(state, 'garden-salad', 22, 58);
  // Dish mid-assembly on the counter: bun + cooked patty, lettuce coming.
  state.plates = [{
    type: 'plate',
    items: [
      { type: 'item', kind: 'bun', prep: 'ready' },
      { type: 'item', kind: 'patty', prep: 'cooked' },
    ],
  }];
  // Chef at the counter holding chopped lettuce, about to plate it.
  state.carry = { type: 'item', kind: 'lettuce', prep: 'chopped' };
  state.chef.x = 566;
  state.chef.y = 530;
  // A patty sizzling on the stove, a tomato half-chopped on the board.
  state.burners[0].item = { type: 'item', kind: 'patty', prep: 'raw' };
  state.burners[0].progress = 3.6;
  state.board.item = { type: 'item', kind: 'tomato', prep: 'raw' };
  state.board.chops = 1;
  state.toast = 'Classic Burger is nearly there — plate the lettuce!';
  state.toastUntil = 999;
  return state;
}

export { SCREEN_PLAY };
