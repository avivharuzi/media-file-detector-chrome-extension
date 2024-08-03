console.log('react-chrome-extension-starter - scripts-background');

chrome.runtime.onInstalled.addListener(() => {
  console.log('react-chrome-extension-starter installed');
});
