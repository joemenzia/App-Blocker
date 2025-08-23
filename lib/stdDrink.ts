export const UNITS = [
  'bottle',
  'can',
  'glass',
  'shot',
  'pint',
  'cup',
  'ml',
  'oz',
] as const;

export const DEFAULT_STD: Record<string, number> = {
  beer: 1.5, // 12oz beer
  wine: 0.6, // 5oz wine
  spirits: 0.6, // 1.5oz spirits
  cocktail: 1.0, // varies
  seltzer: 1.0, // 12oz seltzer
  other: 1.0, // default
};

export function estimateStd(
  type: string,
  quantity: number,
  unit: string
): number {
  const baseStd = DEFAULT_STD[type] || 1.0;

  // Convert common units to standard drinks
  const unitMultipliers: Record<string, number> = {
    bottle: 1.0,
    can: 1.0,
    glass: 1.0,
    shot: 1.0,
    pint: 1.33, // 16oz vs 12oz
    cup: 1.0,
    ml: 0.0338, // 1oz = 29.57ml
    oz: 1.0,
  };

  const multiplier = unitMultipliers[unit] || 1.0;
  return baseStd * quantity * multiplier;
}

export function normalizeFromGuess(
  type: string,
  quantity: number,
  unit: string
): { type: string; quantity: number; unit: string } {
  // Normalize to standard units
  if (unit === 'ml') {
    return { type, quantity: quantity / 29.57, unit: 'oz' };
  }

  return { type, quantity, unit };
}
