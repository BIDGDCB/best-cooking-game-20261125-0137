// Keyboard + mouse input. The canvas reports clicks in game coordinates and
// the current held keys; the game decides what a click or a key means.
export function createInput(canvas) {
  const keys = new Set();
  let click = null;
  let clickConsumed = true;

  function toGameCoords(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * canvas.width,
      y: ((event.clientY - rect.top) / rect.height) * canvas.height,
    };
  }

  window.addEventListener('keydown', (event) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(event.key)) {
      event.preventDefault();
    }
    keys.add(event.key.toLowerCase());
  });
  window.addEventListener('keyup', (event) => {
    keys.delete(event.key.toLowerCase());
  });
  canvas.addEventListener('pointerdown', (event) => {
    click = toGameCoords(event);
    clickConsumed = false;
  });

  return {
    keys,
    takeClick() {
      if (click === null || clickConsumed) return null;
      clickConsumed = true;
      return click;
    },
    // One-shot key: true once per physical press.
    pressed(key) {
      const k = key.toLowerCase();
      if (!keys.has(k)) return false;
      keys.delete(k);
      return true;
    },
    moveVector() {
      let x = 0;
      let y = 0;
      if (keys.has('a') || keys.has('arrowleft')) x -= 1;
      if (keys.has('d') || keys.has('arrowright')) x += 1;
      if (keys.has('w') || keys.has('arrowup')) y -= 1;
      if (keys.has('s') || keys.has('arrowdown')) y += 1;
      if (x !== 0 && y !== 0) {
        const len = Math.hypot(x, y);
        x /= len;
        y /= len;
      }
      return { x, y };
    },
  };
}
