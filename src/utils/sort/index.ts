/**
 * @param links An array of links
 * @returns The same array reference mutated in place, with the links that ended with '.json' first
 */
export const prioritizeJSONEndedLinks = (links: string[]): string[] => {
  if (!links || !Array.isArray(links) || links.length === 0) return links;
  links.sort(
    // @ts-ignore
    (a, b) => a.endsWith('.json') * -1 || b.endsWith('.json') * 1 || 0,
  );
  return links;
};
