/**
 * Simple className merger — no external deps. Use for conditional/luxury UI classes.
 */
type ClassValue = string | undefined | null | false | ClassValue[];

export function cn(...inputs: ClassValue[]): string {
  const out: string[] = [];
  for (const x of inputs) {
    if (x == null || x === false) continue;
    if (typeof x === 'string') {
      out.push(x);
    } else if (Array.isArray(x)) {
      out.push(cn(...x));
    }
  }
  return out.filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
}
