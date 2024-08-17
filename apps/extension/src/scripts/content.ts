import { MediaFile } from '../shared/media-file';

const IMAGE_SUPPORTED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp'];

const VIDEO_SUPPORTED_EXTENSIONS = ['mp4', 'webm', 'ogg'];

const uniqueByProperty = <T, K extends keyof T>(
  array: T[],
  property: K
): T[] => {
  const seen = new Set<T[K]>();

  return array.filter((item) => {
    const value = item[property];

    if (seen.has(value)) {
      return false;
    }

    seen.add(value);

    return true;
  });
};

const getFileNameFromUrl = (url: string): string => {
  // Remove query parameters and hash fragments
  const cleanedUrl = url.split('?')?.[0]?.split('#')[0];

  // Extract the file name from the cleaned URL
  const parts = cleanedUrl?.split('/');

  return parts?.[parts.length - 1] || '';
};

const findMediaFiles = (): MediaFile[] => {
  const images = Array.from(
    document.querySelectorAll<HTMLImageElement>('img')
  ).map(
    (img) =>
      ({
        type: 'image',
        src: img.src,
        width: img.naturalWidth,
        height: img.naturalHeight,
      } as MediaFile)
  );

  const videos = [
    ...Array.from(document.querySelectorAll<HTMLSourceElement>('video')),
    ...Array.from(document.querySelectorAll<HTMLSourceElement>('video source')),
  ].map(
    (video) =>
      ({
        type: 'video',
        src: video.src,
      } as MediaFile)
  );

  const hrefUrls = Array.from(
    document.querySelectorAll<HTMLAnchorElement>('[href]')
  ).map((a) => a.href);

  const srcUrls = Array.from(
    document.querySelectorAll<HTMLImageElement>('[src]')
  ).map((img) => img.src);

  const mediaFilesFromUrls = [...hrefUrls, ...srcUrls]
    .map((url) => {
      if (!url) {
        return null;
      }

      const fileName = getFileNameFromUrl(url);

      if (!fileName) {
        return null;
      }

      const extension = fileName.split('.').pop()?.toLowerCase();

      if (!extension) {
        return null;
      }

      if (IMAGE_SUPPORTED_EXTENSIONS.includes(extension)) {
        return {
          type: 'image',
          src: url,
        } as MediaFile;
      }

      if (VIDEO_SUPPORTED_EXTENSIONS.includes(extension)) {
        return {
          type: 'video',
          src: url,
        } as MediaFile;
      }

      return null;
    })
    .filter((file) => file !== null) as MediaFile[];

  const mediaFiles = [...images, ...videos, ...mediaFilesFromUrls];

  return uniqueByProperty(
    mediaFiles.filter((file) => file.src),
    'src'
  );
};

chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request.action === 'getMediaFiles') {
    sendResponse(findMediaFiles());
  }
});
