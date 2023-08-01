export const containsRawOrJSON = (linkOrTag: string) =>
  linkOrTag.includes('raw') || linkOrTag.includes('.json');
