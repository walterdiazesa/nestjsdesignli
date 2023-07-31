import { APP_PATH } from './host';

export const USE_JSON_SCRAPING_URL = {
  hint: "Lost? The endpoint you're looking for is 'POST /json-scraping'",
  instructions:
    "Send the url or absolute path as a body type JSON with the property 'path'",
  'example (remove backslashes before the quotes)': `curl -X POST -H "Content-Type: application/json" -d '{"path": "/Users/pcowner/Downloads/mail_with_attachment.eml"}' ${APP_PATH}`,
  /* mistakes: {
    "If you're passing a url, please make sure is a valid url and is already encoded":
      {
        invalid: '',
        valid: '',
      },
    "If you're passing a local path, please make sure is an absolute path and be aware that spaces are not allowed":
      {
        invalid:
          '/Users/pcowner/Downloads/Test JSON inside mail attachment.eml',
        valid: '/Users/pcowner/Downloads/Test_JSON_inside_mail_attachment.eml',
      },
  }, */
} as const;
