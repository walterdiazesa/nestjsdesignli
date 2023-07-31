import { CacheInterceptor, CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import {
  All,
  Body,
  Controller,
  Inject,
  Post,
  Res,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AxiosError } from 'axios';
import { Request } from 'express';
import { AppService } from './app.service';
import { USE_JSON_SCRAPING_URL } from './constants/routes';
import { BodyPathIsValid } from './guards/body-path.guard';
import { EMLCacheGuard } from './guards/eml-cache.guard';
import {
  extractATagsFromHTML,
  extractHrefAttrValueFromATags,
  extractJSONFromEMLAttachments,
  extractJSONFromString,
  extractLinksFromString,
  getEML,
  isValidURL,
  requestHTMLPage,
  requestJSONFile,
} from './utils';
import { getJSONRawFromJSONProvider, parseEML } from './utils/parse';
import { prioritizeJSONEndedLinks } from './utils/sort';

@Controller()
@UseInterceptors(CacheInterceptor)
export class AppController {
  constructor(
    private readonly appService: AppService,
    @Inject(CACHE_MANAGER) private cache: Cache,
  ) {}

  @All()
  lost(): typeof USE_JSON_SCRAPING_URL {
    return USE_JSON_SCRAPING_URL;
  }

  @Post('/json-scraping')
  @UseGuards(BodyPathIsValid, EMLCacheGuard)
  // With the help of BodyPathIsValid, we can rest assured that the path is either a valid URL (though not necessarily leading to an existing page) or a local path.
  async scrapJson(@Res() res, @Body() { path }: Request['body']) {
    const eml = await getEML(path);
    if (eml instanceof AxiosError)
      return res.status(404).json({
        error: "The provided url doesn't exist.",
        url: path,
        statusCode: 404,
      });
    if (!eml)
      return res.status(400).json({
        error: 'The provided url file is not a valid .eml file.',
        url: path,
        statusCode: 400,
      });
    const {
      attachments = [],
      text = '',
      textAsHtml = '',
      html = '',
    } = await parseEML(eml);
    const jsonAttached: object | null =
      // Try to obtain JSON from attachments
      extractJSONFromEMLAttachments(attachments) ||
      // Try to obtain JSON from the html of the mail (more secure format than plain text)
      (html && extractJSONFromString(html)) ||
      // Try to obtain JSON from the parsed html from the mail body
      extractJSONFromString(textAsHtml) ||
      // Try to obtain JSON from plain text of the mail body
      extractJSONFromString(text);

    if (jsonAttached) {
      return res.status(200).json(jsonAttached);
    }

    // If we couldn't obtain the json from the mail itself, try using links finded in the .eml
    const links =
      extractLinksFromString(text) ||
      extractLinksFromString(textAsHtml) ||
      (html && extractLinksFromString(html));
    if (links.length === 0)
      return res.status(400).json({
        error:
          'The provided .eml file does not contain any clue to obtain a JSON.',
        url: path,
        statusCode: 400,
      });
    // Bring links that endup with .json at the begging, which gives more possibility for them being direct links to the json file
    prioritizeJSONEndedLinks(links);

    // If the link directly returns a valid JSON and is not the unexpected response from the server
    for (const link of links) {
      const json = await requestJSONFile(link);
      if (json && !(json instanceof AxiosError)) {
        if (json) {
          return res.status(200).json(json);
        }
      }
    }

    // If the link has a native implementation of the raw json
    for (const link of links) {
      const rawInfo = await getJSONRawFromJSONProvider(link);
      if (!rawInfo) continue;

      if (typeof rawInfo === 'string') {
        // If the rawInfo is the link of the raw json
        const json = await requestJSONFile(rawInfo);
        if (json && !(json instanceof AxiosError)) {
          if (json) {
            return res.status(200).json(json);
          }
        }
      } else {
        // If the rawInfo is a GistResponseInfo
        for (const gistFileKey of prioritizeJSONEndedLinks(
          Object.keys(rawInfo.files),
        )) {
          // There are many ways of retrieving the json (if the file indeed is a json), like
          // await requestJSONFile(rawInfo.files[gistFileKey].raw_url)
          // But first, we need to make sure is a json, can have the name file ending up a '.json',
          // it can have rawInfo.files[gistFileKey].language as 'JSON', it can have the
          // rawInfo.files[gistFileKey].type as 'application/json', but still can be a wrong formatted json
          // so anyway we would need to *TRY* to parse the possible json and luckily we don't even have to request
          // the data from the raw_url, we can use directly the content retrieved from the call that returned the
          // GistResponse
          try {
            const json = JSON.parse(rawInfo.files[gistFileKey].content);
            if (json) {
              await this.cache.set(path, json);
              return res.status(200).json(json);
            }
          } catch {}
        }
      }
    }

    // From the founded link in the .eml that redirected to an html page, extract links within that page
    for (const link of links) {
      const html = await requestHTMLPage(link);
      if (html && !(html instanceof AxiosError)) {
        const scrapedHTMLRedirects = [
          ...extractLinksFromString(html, false).filter(
            (link) => link.includes('raw') || link.includes('.json'),
          ),
          ...extractHrefAttrValueFromATags(
            extractATagsFromHTML(html).filter(
              (tag) => tag.includes('raw') || tag.includes('.json'),
            ),
          ),
        ].sort(
          // @ts-ignore
          (a, b) => a.includes('raw') * -1 || b.includes('raw') * 1 || 0,
        );
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
          if (json && !(json instanceof AxiosError)) {
            if (json) {
              return res.status(200).json(json);
            }
          }
        }
      }
    }

    // Try to find a json inside the page body
    for (const link of links) {
      const html = await requestHTMLPage(link);
      if (html && !(html instanceof AxiosError)) {
        const json = extractJSONFromString(html);
        if (json) {
          return res.status(200).json(json);
        }
      }
    }

    return res.status(400).json({
      error: 'No valid json found on provided .eml',
      url: path,
      statusCode: 400,
    });
    // return this.appService.getHello();
  }
}
