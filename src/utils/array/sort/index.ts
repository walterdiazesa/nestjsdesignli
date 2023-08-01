/**
 * @description A string[] sort handler that return the links ended with '.json' first
 */
export const prioritizeJSONEndedLinks = (a: string, b: string) =>
  // @ts-ignore
  a.endsWith('.json') * -1 || b.endsWith('.json') * 1 || 0;

/**
 * @description A string[] sort handler that return the links that contain 'raw' first
 */
export const prioritizeRawRedirectLinks = (a: string, b: string) =>
  // @ts-ignore
  a.includes('raw') * -1 || b.includes('raw') * 1 || 0;
