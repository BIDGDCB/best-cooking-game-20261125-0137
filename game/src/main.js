// The Golden Skillet: bootstrap + game loop.
// Opens game/index.html in a desktop browser and plays offline.
// ?shot=start|play|serve|end&seed=N renders one frozen screenshot scene.
import { VIEW } from './config.js';
import { createGame, startShift, update, clickStation, interactKey, SCREEN_TITLE, SCREEN_OVER } from './kitchen.js';
import { render } from './render.js';
import { createInput } from './input.js';
import { buildShotState } from './shots.js';
import { sfx, setMuted, isMuted } from './audio.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = VIEW.width;
canvas.height = VIEW.height;

const params = new URLSearchParams(window.location.search);
const shotKind = params.get('shot');
const seed = Number(params.get('seed') ?? '1') || 1;

const input = createInput(canvas);
let state;

if (shotKind) {
  state = buildShotState(shotKind, seed);
  render(ctx, state);
} else {
  state = createGame(1);
  let last = performance.now();

  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;

    // Global keys.
    if (input.pressed('m')) {
      setMuted(!isMuted());
      state.muted = isMuted();
    }
    if (input.pressed('p') && state.screen === 'play') {
      state.paused = !state.paused;
    }
    if (input.pressed('enter') || input.pressed(' ')) {
      if (state.screen === SCREEN_TITLE) {
        sfx.click();
        startShift(state);
      } else if (state.screen === SCREEN_OVER) {
        sfx.click();
        if (state.over && state.over.won) state.day += 1;
        startShift(state);
      }
    }
    if (input.pressed('e')) interactKey(state);

    const click = input.takeClick();
    if (click) {
      if (state.screen === SCREEN_TITLE) {
        if (click.y > 540 && click.y < 596 && click.x > 490 && click.x < 790) {
          sfx.click();
          startShift(state);
        }
      } else if (state.screen === SCREEN_OVER) {
        if (click.y > 430 && click.y < 486 && click.x > 490 && click.x < 790) {
          sfx.click();
          if (state.over && state.over.won) state.day += 1;
          startShift(state);
        }
      } else {
        clickStation(state, click.x, click.y);
      }
    }

    if (!state.paused) update(state, dt, input);
    render(ctx, state);
    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
}
