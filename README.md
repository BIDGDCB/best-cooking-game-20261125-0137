# 🍳 The Golden Skillet

[![make.fun](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/c/best-cooking-game-20261125-0137)
[![Rank](https://make.fun/badge/best-cooking-game-20261125-0137/BIDGDCB/best-cooking-game-20261125-0137/rank.svg)](https://make.fun/c/best-cooking-game-20261125-0137)
[![Reward](https://make.fun/badge/best-cooking-game-20261125-0137/BIDGDCB/best-cooking-game-20261125-0137/reward.svg)](https://make.fun/c/best-cooking-game-20261125-0137)

A timed cooking game — entry for the [make.fun best cooking game bounty](https://make.fun/c/best-cooking-game-20261125-0137).

## The game

You are the chef of a tiny restaurant, The Golden Skillet, and the lunch rush is on. Orders land on the board with a patience bar; your job is to get each dish out before the customer walks away.

**How a dish gets made:**

1. **Pantry** — click a bin to grab an ingredient (bun, patty, lettuce, tomato, cheese, pasta, egg, sauce).
2. **Chopping board** — lettuce, tomato and cheese need 3 chops each. Click the board (or press Space) to chop.
3. **Stove** — patty, pasta and egg cook on the burners. Grab them when the ring turns gold — leave them too long and they burn (burnt food goes in the trash).
4. **Assembly counter** — add chopped and cooked food to a plate to build the dish.
5. **Serving window** — carry the finished plate to the window. Match the ticket, earn the coins plus a patience tip.

**Pressure that grows:** each day the orders arrive faster, patience shrinks and the coin target climbs. Serve dishes back-to-back to build a combo multiplier (up to ×1.5). A 3-minute shift ends with a star rating — hit the target to open the next day.

**Controls:** mouse (click a station and the chef walks over) or WASD / arrow keys to move and **E** to use the nearest station. **P** pauses, **M** mutes. Everything is drawn in code and all sound is synthesised with WebAudio — the game loads nothing over the network and plays offline from its own files.

## Recipes

| Dish | Needs | Price |
| --- | --- | --- |
| Classic Burger | bun + cooked patty + chopped lettuce | $18 |
| Cheese Burger | bun + cooked patty + chopped cheese | $22 |
| Garden Salad | chopped lettuce + chopped tomato + chopped cheese | $14 |
| Tomato Pasta | cooked pasta + sauce | $20 |
| Golden Omelette | cooked egg + chopped cheese | $16 |

## Play it

```sh
node serve.ts
# open http://localhost:8080
```

Or open `game/index.html` from any static server. `?shot=start|play|serve|end&seed=1` renders a frozen screenshot scene (used for the screenshots in this repo).

## Files

- `game/index.html` + `game/css/style.css` — the page shell
- `game/src/config.js` — ingredients, recipes, difficulty tuning
- `game/src/kitchen.js` — kitchen state: stations, orders, cooking, serving
- `game/src/render.js` — all drawing (kitchen, chef, food, HUD, overlays)
- `game/src/shots.js` — deterministic screenshot scenes
- `game/src/input.js` — keyboard + mouse
- `game/src/audio.js` — synthesised sound effects
- `game/src/random.js` — seeded RNG
- `game/src/main.js` — bootstrap + game loop
- `main.ts` — the make.fun entry program (copies `game/` + `screenshots/` and writes `dossier.json`)
- `screenshots/` — real renders of the game (cover first)

Built for make.fun — [best-cooking-game-20261125-0137](https://make.fun/c/best-cooking-game-20261125-0137). Original game, art, sounds and names; no assets borrowed from anywhere.
