import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { nanoid } from 'nanoid';

import { getFileNameFromUrl } from './get-file-name-from-url';
import { buildTitleBaseNames, sanitizeFileName } from './build-download-names';

export interface DownloadOptions {
  /** When set, files are named "<title> <nn>.<ext>" and the zip "<title>.zip". */
  title?: string | undefined;
  /** Put files under a folder inside the zip instead of at its root. */
  inFolder: boolean;
}

const MIME_EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'image/svg+xml': 'svg',
  'image/avif': 'avif',
  'video/mp4': 'mp4',
  'video/webm': 'webm',
  'video/ogg': 'ogg',
};

const getExtension = (url: string, blob: Blob): string => {
  const fromUrl = getFileNameFromUrl(url).split('.');

  if (fromUrl.length > 1) {
    const extension = fromUrl.pop()?.toLowerCase();

    if (extension && /^[a-z0-9]{1,5}$/.test(extension)) {
      return extension;
    }
  }

  return MIME_EXTENSIONS[blob.type] || 'bin';
};

export const downloadFilesAsZip = async (
  urls: string[],
  { title, inFolder }: DownloadOptions
): Promise<void> => {
  const zip = new JSZip();
  const id = nanoid();
  const safeTitle = title !== undefined ? sanitizeFileName(title) || 'files' : undefined;

  const baseName = safeTitle ?? `files_${id}`;
  const target = inFolder ? zip.folder(baseName) ?? zip : zip;

  const baseNames = safeTitle
    ? buildTitleBaseNames(safeTitle, urls.length)
    : urls.map((_, index) => `${id}_${(index + 1).toString().padStart(4, '0')}`);

  // Fetch all files and add them to the zip
  await Promise.all(
    urls.map(async (url, index) => {
      const response = await fetch(url);
      const blob = await response.blob();

      target.file(`${baseNames[index]}.${getExtension(url, blob)}`, blob);
    })
  );

  const content = await zip.generateAsync({ type: 'blob' });

  saveAs(content, `${baseName}.zip`);
};
