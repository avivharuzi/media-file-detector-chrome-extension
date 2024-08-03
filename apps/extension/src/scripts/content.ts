import { MediaFile } from '../shared/media-file';

console.log('react-chrome-extension-starter - scripts-content');

function uniqueByProperty<T, K extends keyof T>(array: T[], property: K): T[] {
  const seen = new Set<T[K]>();
  return array.filter((item) => {
    const value = item[property];
    if (seen.has(value)) {
      return false;
    }
    seen.add(value);
    return true;
  });
}

const findMediaFiles = (): MediaFile[] => {
  const images = Array.from(
    document.querySelectorAll<HTMLImageElement>('img')
  ).map((img) => ({
    type: 'image',
    src: img.src,
  }));

  const videos = [
    ...Array.from(document.querySelectorAll<HTMLSourceElement>('video')),
    ...Array.from(document.querySelectorAll<HTMLSourceElement>('video source')),
  ].map((video) => ({
    type: 'video',
    src: video.src,
  }));

  const mediaFiles = [...images, ...videos] as MediaFile[];

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
