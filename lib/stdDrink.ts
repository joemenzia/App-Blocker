export const UNITS = ['oz'] as const;

// per-ounce multipliers (std drinks per 1 oz)
const PER_OUNCE_STD: Record<string, number> = {
  spirits: 1 / 1,   // 1 oz spirits = 1 std drink
  beer: 1 / 12,     // 12 oz beer   = 1 std drink
  wine: 1 / 5,      // 5 oz wine    = 1 std drink
  cocktail: 1 / 5,  // treat cocktails ~ wine for MVP
  seltzer: 1 / 12,  // like beer
  other: 1 / 12,    // safe fallback
};

export function estimateStd(
  type: string,
  quantity: number,
  unit: string
): number {
  // standardize on oz; ignore unit except for ml conversion in normalizeFromGuess
  const perOz = PER_OUNCE_STD[type] ?? PER_OUNCE_STD.other;

  const q = Number.isFinite(quantity) && quantity > 0 ? quantity : 0;
  const raw = q * perOz;

  // Round to nearest whole drink to avoid fractional entries, but never return 0 for nonzero input
  const rounded = Math.max(1, Math.round(raw));

  return Number.isFinite(rounded) && rounded >= 0 ? rounded : 0;
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
  return { type, quantity, unit: 'oz' };
}
