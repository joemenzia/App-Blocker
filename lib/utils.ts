// Utility function for combining styles (simplified version)
export function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
