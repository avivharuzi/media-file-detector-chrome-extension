console.log('media-file-detector-chrome-extension - scripts-background');

chrome.runtime.onInstalled.addListener(() => {
  console.log('media-file-detector-chrome-extension installed');
});
