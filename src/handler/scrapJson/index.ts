import { HttpStatus } from '@nestjs/common';
import { AxiosError } from 'axios';
import { ScrapJsonResponse } from '../../ts/definitions/Routes';
import {
  extractJSONFromEMLAttachments,
  extractJSONFromString,
  extractLinksFromString,
  getEML,
  getJSONRawFromJSONProvider,
  parseEML,
  prioritizeJSONEndedLinks,
  requestJSONFile,
} from '../../utils';

type GetEmlReturnType = Awaited<ReturnType<typeof getEML>>;
type ParseEmlReturnType = Awaited<ReturnType<typeof parseEML>>;
type GetJSONRawFromJSONProviderReturnType = Awaited<
  ReturnType<typeof getJSONRawFromJSONProvider>
>;

export const isValidAsset = <T>(value: T | AxiosError): value is T =>
  !!value && !(value instanceof AxiosError);

export const invalidEMLResponse = (
  eml: GetEmlReturnType,
  path: string,
): ScrapJsonResponse => {
  if (!eml)
    return {
      payload: {
        error: 'The provided url file is not a valid .eml file.',
        url: path,
      },
      statusCode: HttpStatus.BAD_REQUEST,
    };
  // eml is instanceof AxiosError
  return {
    payload: {
      error: "The provided eml url doesn't exist.",
      url: path,
    },
    statusCode: HttpStatus.NOT_FOUND,
  };
};

export const JSONInMail = ({
  attachments = [],
  text = '',
  textAsHtml = '',
  html = '',
}: ParseEmlReturnType): object | null =>
  // Try to obtain JSON from the attachments (if any)
  extractJSONFromEMLAttachments(attachments) ||
  // Try to obtain JSON from the html of the mail (more secure format than plain text)
  (html && extractJSONFromString(html)) ||
  // Try to obtain JSON from the parsed html from the mail body
  extractJSONFromString(textAsHtml) ||
  // Try to obtain JSON from plain text of the mail body
  extractJSONFromString(text);

export const isJSONInMail = (mailAssets: ParseEmlReturnType) =>
  !!JSONInMail(mailAssets);

export const extractLinksFromMail = ({
  text = '',
  textAsHtml = '',
  html = '',
}: ParseEmlReturnType) =>
  extractLinksFromString(text) ||
  extractLinksFromString(textAsHtml) ||
  (html && extractLinksFromString(html));

export const JSONFromRawInfo = async (
  rawInfo: GetJSONRawFromJSONProviderReturnType,
): Promise<ScrapJsonResponse> | null => {
  // If the rawInfo is the link of the raw json
  if (typeof rawInfo === 'string') {
    const json = await requestJSONFile(rawInfo);
    if (isValidAsset(json))
      return {
        statusCode: HttpStatus.OK,
        payload: json,
      };
  } else {
    // If the rawInfo is a GistResponseInfo
    for (const gistFileKey of Object.keys(rawInfo.files).sort(
      prioritizeJSONEndedLinks,
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
        return {
          statusCode: HttpStatus.OK,
          payload: JSON.parse(rawInfo.files[gistFileKey].content),
        };
      } catch {}
    }
  }
  return null;
};
