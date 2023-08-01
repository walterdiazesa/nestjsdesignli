const fs: typeof import('fs') = require('fs');

export const isValidURL = (url: string) => {
  try {
    const parsedUrl = new URL(url);
    if (parsedUrl.protocol === 'https:' || parsedUrl.protocol === 'http:') {
      return true;
    }
    // @ts-ignore
  } catch (error: TypeError) {
    return false;
  }
};

export const checkPathType = (path: string) => {
  if (!path || typeof path !== 'string') return 'invalid';

  // Check if the path is a valid URL
  if (isValidURL(path)) return 'url';

  // Check if the path is a directory
  try {
    const stats = fs.statSync(path);
    if (stats.isFile()) {
      return 'path';
    }
    // @ts-ignore
  } catch (error: Error) {}

  return 'invalid';
};
