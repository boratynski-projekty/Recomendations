/**
 * Sluggers: krótkie losowe identyfikatory i normalizacja stringów na slugi.
 */

const ALPHABET = "abcdefghijkmnpqrstuvwxyz23456789"; // bez 0/o/1/l

export function randomSlug(length = 6): string {
  let out = "";
  const arr = new Uint32Array(length);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(arr);
    for (let i = 0; i < length; i++) {
      out += ALPHABET[arr[i] % ALPHABET.length];
    }
    return out;
  }
  for (let i = 0; i < length; i++) {
    out += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return out;
}

export function normalizeSlug(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "") // usuń znaki diakrytyczne
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) && slug.length >= 2 && slug.length <= 48;
}
