/** Characters that are invalid in file names on Windows/macOS/Linux. */
const INVALID_FILE_NAME_CHARS = /[\\/:*?"<>|]/g;

export const sanitizeFileName = (name: string): string =>
  Array.from(name, (char) => (char.charCodeAt(0) < 32 ? ' ' : char))
    .join('')
    .replace(INVALID_FILE_NAME_CHARS, ' ')
    .replace(/\s+/g, ' ')
    .trim();

/** 2 digits for fewer than 100 files, otherwise 3 (or more if ever needed). */
export const getSequencePadding = (count: number): number =>
  count < 100 ? 2 : Math.max(3, String(count).length);

/**
 * Builds "<title> <padded-number>" base names (no extension) for `count` files.
 * A single file gets just "<title>".
 */
export const buildTitleBaseNames = (title: string, count: number): string[] => {
  const safeTitle = sanitizeFileName(title) || 'files';

  if (count === 1) {
    return [safeTitle];
  }

  const padding = getSequencePadding(count);

  return Array.from(
    { length: count },
    (_, index) => `${safeTitle} ${String(index + 1).padStart(padding, '0')}`
  );
};
