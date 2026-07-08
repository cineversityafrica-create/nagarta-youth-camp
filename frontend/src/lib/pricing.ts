// Central pricing for NAGARTA Youth Camp 2026
// Prices are quoted in USD on the register page; payment is by bank transfer in GH₵.
export const USD_TO_GHS = 12;

export const EARLY_BIRD_USD = 285;
export const REGULAR_USD = 310;

export const EARLY_BIRD_GHS = EARLY_BIRD_USD * USD_TO_GHS; // 3,420
export const REGULAR_GHS = REGULAR_USD * USD_TO_GHS; //       3,720

// Standard full camp fee used to compute the balance a parent still owes.
// (Registrations don't store the chosen package, so we use the regular fee.)
export const CAMP_FEE_GHS = REGULAR_GHS;

export function formatGhs(n: number): string {
  return `GH₵ ${Math.max(0, Math.round(n)).toLocaleString()}`;
}
