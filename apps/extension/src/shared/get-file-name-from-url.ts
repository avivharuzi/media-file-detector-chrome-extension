export const getFileNameFromUrl = (url: string): string => {
  // Remove query parameters and hash fragments
  const cleanedUrl = url.split('?')?.[0]?.split('#')[0];

  // Extract the file name from the cleaned URL
  const parts = cleanedUrl?.split('/');

  return parts?.[parts.length - 1] || '';
};
