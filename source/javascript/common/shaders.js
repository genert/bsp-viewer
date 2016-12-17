export function normalizeFactor (text, uppercase = false) {
  return (uppercase ? text.toUpperCase() : text.toLowerCase()).trim();
}