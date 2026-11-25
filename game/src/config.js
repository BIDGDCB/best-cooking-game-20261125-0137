// The Golden Skillet: tuning, ingredients and recipes.
// Every ingredient has one prep step (chop, cook, or none) so a dish is a
// short route through the kitchen: pantry -> board or stove -> plate -> serve.
export const VIEW = { width: 1280, height: 800 };
export const HUD_H = 72;
export const BOARD_H = 104;
export const SHIFT_SECONDS = 180;
export const RUSH_DURATION = 20;
export const RUSH_TIP_MULT = 2;
export const CHEF_SPEED = 270;
export const CHEF_RADIUS = 22;
export const CHOPS_NEEDED = 3;
export const COOK_SECONDS = 6;
export const BURN_SECONDS = 8;

export const INGREDIENTS = {
  bun:     { name: 'Bun',     prep: 'none', color: '#e8b06a', dark: '#b97f3e', label: 'BUN' },
  patty:   { name: 'Patty',   prep: 'cook', color: '#8a5a3b', dark: '#5d3a24', label: 'PATTY' },
  lettuce: { name: 'Lettuce', prep: 'chop', color: '#7dc383', dark: '#4c8a52', label: 'LETTUCE' },
  tomato:  { name: 'Tomato',  prep: 'chop', color: '#e2574c', dark: '#a83228', label: 'TOMATO' },
  cheese:  { name: 'Cheese',  prep: 'chop', color: '#f2c94c', dark: '#c99a1e', label: 'CHEESE' },
  pasta:   { name: 'Pasta',   prep: 'cook', color: '#f0d089', dark: '#c9a24e', label: 'PASTA' },
  egg:     { name: 'Egg',     prep: 'cook', color: '#fdf3d8', dark: '#d9c48f', label: 'EGG' },
  sauce:   { name: 'Sauce',   prep: 'none', color: '#c0392b', dark: '#7e2318', label: 'SAUCE' },
};

// A recipe lists the finished items a plate must hold: kind + prepared state.
export const RECIPES = [
  {
    id: 'classic-burger', name: 'Classic Burger', price: 18,
    needs: [
      { kind: 'bun', prep: 'ready' },
      { kind: 'patty', prep: 'cooked' },
      { kind: 'lettuce', prep: 'chopped' },
    ],
  },
  {
    id: 'cheese-burger', name: 'Cheese Burger', price: 22,
    needs: [
      { kind: 'bun', prep: 'ready' },
      { kind: 'patty', prep: 'cooked' },
      { kind: 'cheese', prep: 'chopped' },
    ],
  },
  {
    id: 'garden-salad', name: 'Garden Salad', price: 14,
    needs: [
      { kind: 'lettuce', prep: 'chopped' },
      { kind: 'tomato', prep: 'chopped' },
      { kind: 'cheese', prep: 'chopped' },
    ],
  },
  {
    id: 'tomato-pasta', name: 'Tomato Pasta', price: 20,
    needs: [
      { kind: 'pasta', prep: 'cooked' },
      { kind: 'sauce', prep: 'ready' },
    ],
  },
  {
    id: 'golden-omelette', name: 'Golden Omelette', price: 16,
    needs: [
      { kind: 'egg', prep: 'cooked' },
      { kind: 'cheese', prep: 'chopped' },
    ],
  },
];

export function recipeById(id) {
  return RECIPES.find((r) => r.id === id) ?? null;
}

// Difficulty per day: orders arrive faster, patience shrinks, target grows.
export function dayTuning(day) {
  return {
    spawnInterval: Math.max(8, 15 - day),
    patience: Math.max(38, 62 - day * 4),
    targetCoins: 110 + (day - 1) * 45,
    maxOrders: 4,
  };
}
