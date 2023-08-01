import axios, { AxiosError } from 'axios';
import { Source, ParsedMail } from 'mailparser';
import {
  ANY_LINK_REGEX,
  HREF_ATTR_REGEX,
  JSON_REGEX,
  VALID_LINK_REGEX,
} from '../../constants/regex';
import { MIME_EML, MIME_JSON } from '../../constants/mime';
import { isValidURL } from '../path';
//import xss from 'xss';
const xss = require('xss');
const fs: typeof import('fs') = require('fs');

/**
 * @description An ".eml" file is a file format used for storing email messages. The ".eml" extension stands
 * for "Electronic Mail Message." It is a standard file format that contains the complete content of an email
 * message, including the message body, sender, recipients, subject, date, and any attachments.
 *
 * @argument {string} path a valid URL or a local absolute path that returns an .eml file
 *
 * @returns
 * AxiosError if the url is a valid url but the url doesn't exist
 * null if the file is either an invalid ".eml" or if it cannot be found.
 * The .eml file
 */
export const getEML = async (
  path: string,
): Promise<Source | AxiosError | null> => {
  if (isValidURL(path)) {
    const response = await axios.get(path);
    if (response instanceof AxiosError) return response as AxiosError;
    // Include 304 for cache hits
    if (
      response.status < 200 ||
      (response.status >= 299 && response.status !== 304)
    )
      return null;
    if (
      response.headers['Content-Type'] !== MIME_EML &&
      response.headers['content-type'] !== MIME_EML
    )
      return null;

    return response.data;
  }

  if (path.split('.').pop() === 'eml') {
    try {
      return fs.readFileSync(path);
    } catch {}
  }

  return null;
};

export const safelyParseJSON = (buffer: Buffer): Record<string, any> | null => {
  try {
    return JSON.parse(buffer.toString());
  } catch {
    return null;
  }
};

/**
 * @param attachments a valid list of attachments coming from an .eml file
 *
 * @returns
 * `null` if there were none attached files or none of them were of type and/or valid JSON
 * or the __first__ json attached
 */
export const extractJSONFromEMLAttachments = (
  attachments: ParsedMail['attachments'],
): null | Record<string, any> => {
  if (attachments.length === 0) return null;
  const nativeJson =
    attachments.find((attachment) => attachment.contentType === MIME_JSON) ??
    null;
  if (nativeJson && safelyParseJSON(nativeJson.content))
    return safelyParseJSON(nativeJson.content);

  const jsonFromName =
    attachments.find((attachment) =>
      attachment.filename.toLowerCase().endsWith('.json'),
    ) ?? null;
  if (jsonFromName && safelyParseJSON(jsonFromName.content))
    return safelyParseJSON(jsonFromName.content);

  const jsonFromParse =
    attachments.find((attachment) => {
      return !!safelyParseJSON(attachment.content);
    }) ?? null;
  return safelyParseJSON(jsonFromParse.content);
};

/**
 * @param text Any string that could possible contain a valid JSON
 *
 * @returns
 * `null` if there were no matches of a valid JSON in the string or the __first__ json attached
 */
export const extractJSONFromString = (
  text: string,
): null | Record<string, any> => {
  if (typeof text !== 'string' || !text) return null;
  const match = text.replace(/(\r\n|\n|\r)/gm, '').match(JSON_REGEX);
  if (!match) return null;
  const firstJson = match[0];

  // text is plain text
  try {
    return JSON.parse(firstJson);
  } catch {}

  // text is html text
  try {
    const sanitized = (
      xss(firstJson, {
        whiteList: {},
        stripIgnoreTag: true,
        stripIgnoreTagBody: ['script'],
        escapeHtml: (html) => html.replace(/&lt;/g, '<').replace(/&gt;/g, '>'),
      }) as string
    ).replace(/&quot;/g, '"');
    function removeSpacesOutsideQuotes(input) {
      return input.replace(/("[^"]*")|\s+/g, (match, group) =>
        group ? group : '',
      );
    }
    return JSON.parse(removeSpacesOutsideQuotes(sanitized));
  } catch {}

  return null;
};

export const extractLinksFromString = (
  text: string,
  sanitize = true,
): string[] => {
  const links = text.match(VALID_LINK_REGEX);

  text.match(ANY_LINK_REGEX)?.forEach((link) => {
    if (links && !links.find((_link) => link.includes(_link))) {
      links.push(`${sanitize ? 'http://' : ''}${link}`);
    }
  });

  return (
    links?.map((_link) => {
      let link = _link.replace(/&lt;|&gt;|&lt|&gt/, '').replace(/<|>/, '');
      const endOfValidLink = link.search(/'|"/);
      if (endOfValidLink !== -1) link = link.slice(0, endOfValidLink);
      return link;
    }) || []
  );
};

export const extractATagsFromHTML = (html: string): string[] => {
  return (
    xss(html, {
      whiteList: { a: ['href', 'title'] },
      stripIgnoreTag: true,
      stripIgnoreTagBody: ['script'],
      escapeHtml: (html) => html,
    })
      .split('\n')
      .join('')
      .match(/<a[^>]*>.*?<\/a>/g) || []
  );
};

export const extractHrefAttrValueFromATags = (aTags: string[]): string[] => {
  return aTags
    .map((aTag) => aTag.match(HREF_ATTR_REGEX)?.pop()?.slice(6, -1))
    .filter(Boolean);
};

const memRequestJSONFile = new Map<
  Parameters<typeof requestJSONFile>['0'],
  Awaited<ReturnType<typeof requestJSONFile>>
>();
export const requestJSONFile = async (
  link: string,
): Promise<Record<string, any> | AxiosError | null> => {
  if (memRequestJSONFile.has(link)) return memRequestJSONFile.get(link);
  const cache = await (async () => {
    try {
      const response = await axios.get(link, {
        transformResponse: [
          function transformResponse(data, headers) {
            // headers['Content-Type'] !== MIME_JSON && headers['content-type'] !== MIME_JSON
            // Usually a 'Content-Type' of type 'application/json' should be a valid json, but a bad agent could set the 'Content-Type' as
            // 'application/json' even if the data is not of type JSON, or sometimes a bad formatted endpoint can return a different
            // Content-Type for a content that is a valid JSON, so we tell this specific axios call to just return the plain response as text,
            // later we will *try* to parse it anyway, independently of the obtained Content-Type
            // Example of the described behaviour: https://pastebin.com/raw/bNgAT6Rp, EDIT: That's not a valid json, so it would be impossible to
            // parse it, we could try to pass it first on a reviver function but the test is asking explicitly for valid json, not for "almost"
            // valid json
            // A better example of the described behaviour
            // https://pastebin.com/raw/riJjd0Hb or https://github.com/aws/aws-lambda-go/raw/main/events/testdata/ses-sns-event.json which are
            // valid json but the Content-Type are text/html
            return data;
          },
        ],
      });
      if (response instanceof AxiosError) {
        return response;
      }
      // A response.status outside the range 200-299 could return a valid json, but is not the json we are expecting but the behaviour of the
      // provided server when the request is not successfull or the asset is not available
      // Also include 304 if the cache was hit
      if (
        response.status < 200 ||
        (response.status >= 299 && response.status !== 304)
      ) {
        return null;
      }
      try {
        return JSON.parse(response.data);
      } catch (e) {
        return null;
      }
    } catch {
      return null;
    }
  })();
  memRequestJSONFile.set(link, cache);
  return cache;
};

const memRequestHTMLPage = new Map<
  Parameters<typeof requestHTMLPage>['0'],
  Awaited<ReturnType<typeof requestHTMLPage>>
>();
export const requestHTMLPage = async (
  link: string,
): Promise<string | AxiosError | null> => {
  if (memRequestHTMLPage.has(link)) return memRequestHTMLPage.get(link);
  const cache = await (async () => {
    const response = await axios.get(link, {
      transformResponse: [
        function transformResponse(data, headers) {
          // headers['Content-Type'] should be text/html or text/plain, but any string would be enough
          return data;
        },
      ],
    });
    if (response instanceof AxiosError) {
      return response;
    }
    // A response.status outside the range 200-299 could return a valid json, but is not the json we are expecting but the behaviour of the
    // provided server when the request is not successfull or the asset is not available
    // Also include 304 if the cache was hit
    if (
      response.status < 200 ||
      (response.status >= 299 && response.status !== 304)
    ) {
      return null;
    }
    return response.data;
  })();

  memRequestHTMLPage.set(link, cache);
  return cache;
};
