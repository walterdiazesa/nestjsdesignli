import axios, { AxiosError } from 'axios';
import { GistResponse } from '../../../ts/definitions/Github';
import { isValidURL } from '../../../utils/path';

const memJSONRaw = new Map<
  Parameters<typeof getJSONRawFromJSONProvider>['0'],
  Awaited<ReturnType<typeof getJSONRawFromJSONProvider>>
>();
/**
 * If the link is coming from gist.github.com it would return a GistResponse
 */
export async function getJSONRawFromJSONProvider(
  link: string,
): Promise<string | null | GistResponse> {
  if (memJSONRaw.has(link)) return memJSONRaw.get(link);
  const cache = await (async () => {
    if (!link || typeof link !== 'string' || !isValidURL(link)) return null;
    const provider = new URL(link);
    if (provider.host === 'github.com' && provider.pathname.endsWith('.json'))
      provider.searchParams.append('raw', 'true');
    if (provider.host === 'gist.github.com') {
      const gistId = provider.pathname.split('/')?.pop();
      if (!gistId) return null;
      const response = await axios.get(
        `https://api.github.com/gists/${gistId}`,
      );
      if (
        response instanceof AxiosError ||
        response.status < 200 ||
        (response.status >= 299 && response.status !== 304)
      )
        return null;
      return response.data as GistResponse;
    }
    if (provider.host === 'jsonblob.com') {
      return `${provider.origin}/api/jsonBlob/${
        provider.pathname.split('/')?.pop() || ''
      }`;
    }
    if (provider.host === 'pastebin.com') {
      provider.pathname = `/raw${provider.pathname}`;
    }
    return provider.href;
  })();
  memJSONRaw.set(link, cache);
  return cache;
}
