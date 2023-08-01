import { HttpStatus, Injectable } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Inject } from '@nestjs/common';
import { AxiosError } from 'axios';
import {
  extractATagsFromHTML,
  extractHrefAttrValueFromATags,
  extractJSONFromString,
  extractLinksFromString,
  getEML,
  isValidURL,
  requestHTMLPage,
  requestJSONFile,
} from './utils';
import { getJSONRawFromJSONProvider, parseEML } from './utils/parse';
import {
  prioritizeJSONEndedLinks,
  prioritizeRawRedirectLinks,
} from './utils/array/sort';
import { containsRawOrJSON } from './utils/array';
import {
  extractLinksFromMail,
  invalidEMLResponse,
  isJSONInMail,
  isValidAsset,
  JSONFromRawInfo,
  JSONInMail,
} from './handler';
import { ScrapJsonResponse } from './ts/definitions/Routes';

@Injectable()
export class AppService {
  constructor(@Inject(CACHE_MANAGER) private cache: Cache) {}

  async scrapJson(path: string): Promise<ScrapJsonResponse> {
    const eml = await getEML(path);
    if (!isValidAsset(eml)) return invalidEMLResponse(eml, path);
    const mailAssets = await parseEML(eml);

    // [Case 1]: The JSON is within the mail content
    // Check if the JSON is attached or, if not, in the body of the email.
    if (isJSONInMail(mailAssets))
      return {
        statusCode: HttpStatus.OK,
        payload: JSONInMail(mailAssets),
      };

    // If we couldn't obtain the json from the mail itself, try using links finded in the .eml
    const links = extractLinksFromMail(mailAssets);
    if (links.length === 0)
      return {
        payload: {
          error:
            'The provided .eml file does not contain any clue to obtain a JSON.',
          url: path,
        },
        statusCode: HttpStatus.BAD_REQUEST,
      };
    // Bring links that endup with .json at the begging, which gives more possibility for them being direct links to the json file
    links.sort(prioritizeJSONEndedLinks);

    // [Case 2]: The JSON is the response from one of the links of the mail
    // If the link directly returns a valid JSON and is not the unexpected response from the server
    for (const link of links) {
      const json = await requestJSONFile(link);
      if (isValidAsset(json))
        return {
          statusCode: HttpStatus.OK,
          payload: json,
        };
    }

    // [Case 3] The JSON is within a page obtained from one of the links of the mail

    // [Case 3.1] If the link has a native implementation of the raw json
    for (const link of links) {
      const rawInfo = await getJSONRawFromJSONProvider(link);
      if (!rawInfo) continue;
      const response = await JSONFromRawInfo(rawInfo);
      if (response) return response;
    }

    // [Case 3.2] From the founded links in the .eml that redirected to an html page, extract links within that page
    for (const link of links) {
      const html = await requestHTMLPage(link);
      if (isValidAsset(html)) {
        const scrapedHTMLRedirects = [
          ...extractLinksFromString(html, false).filter(containsRawOrJSON),
          ...extractHrefAttrValueFromATags(
            extractATagsFromHTML(html).filter(containsRawOrJSON),
          ),
        ].sort(prioritizeRawRedirectLinks);
        for (const redirect of scrapedHTMLRedirects) {
          // If the link scraped from the html page obtained from the link founded in the .eml,
          // directly returns a valid JSON and is not the unexpected response from the server
          const json = await requestJSONFile(
            isValidURL(redirect)
              ? redirect
              : `${
                  !redirect.startsWith('/') ? link : new URL(link).origin
                }${redirect}`,
          );
          if (isValidAsset(json)) {
            return {
              statusCode: HttpStatus.OK,
              payload: json,
            };
          }
        }
      }
    }

    // [Case 3.3] Try to find a json inside the page body
    for (const link of links) {
      const html = await requestHTMLPage(link);
      if (isValidAsset(html)) {
        const json = extractJSONFromString(html);
        if (json) {
          return {
            statusCode: HttpStatus.OK,
            payload: json,
          };
        }
      }
    }

    return {
      payload: { error: 'No valid json found on provided .eml', url: path },
      statusCode: HttpStatus.BAD_REQUEST,
    };
  }
}
