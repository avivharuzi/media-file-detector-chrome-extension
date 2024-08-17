import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { nanoid } from 'nanoid';

import { getFileNameFromUrl } from './get-file-name-from-url';

export const downloadFilesAsZip = async (urls: string[]): Promise<void> => {
  const zip = new JSZip();
  const id = nanoid();

  // Fetch all files and add them to the zip
  const fetchPromises = urls.map(async (url, index) => {
    const response = await fetch(url);
    const blob = await response.blob();

    const fileName = getFileNameFromUrl(url);
    const extension = fileName.split('.').pop()?.toLowerCase();

    zip.file(
      `${id}_${(index + 1).toString().padStart(4, '0')}.${extension}`,
      blob
    );
  });

  // Wait for all files to be fetched and added to the zip
  await Promise.all(fetchPromises);

  // Generate the zip file and trigger the download
  zip.generateAsync({ type: 'blob' }).then((content) => {
    saveAs(content, `files_${id}.zip`);
  });
};
