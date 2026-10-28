/** Optional numeric inputs. Empty/unknown is null — never silently coerced to zero. */
export type Opt = number | null;

export function isNum(n: Opt | undefined): n is number {
  return n != null && Number.isFinite(n);
}

export function isNonNeg(n: Opt | undefined): n is number {
  return isNum(n) && n >= 0;
}

export function isPositive(n: Opt | undefined): n is number {
  return isNum(n) && n > 0;
}

export function fmtOpt(n: Opt, fmt: (v: number) => string, missing = "Not recorded") {
  return isNum(n) ? fmt(n) : missing;
}
