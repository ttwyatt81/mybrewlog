const ACCENTS = ["#b5603f", "#6b6a42", "#4c6b73", "#c98a2c", "#6f5a75", "#b8707a"];

// Stable accent per coffee so the same bean always keeps its colour.
export function coffeeAccent(key) {
  const text = String(key ?? "");
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
  return ACCENTS[hash % ACCENTS.length];
}
