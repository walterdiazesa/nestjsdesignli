import { Source, simpleParser, ParsedMail } from 'mailparser';

type MailProps = Pick<
  ParsedMail,
  'attachments' | 'html' | 'text' | 'textAsHtml'
>;

/**
 * @param {Source} eml a valid .eml file
 *
 * @returns
 * `null` if there was an error parsing the .eml file or the properties defined on {MailProps}
 */
export const parseEML = (eml: Source): Promise<null | MailProps> => {
  return new Promise<null | MailProps>((r) =>
    simpleParser(
      eml,
      async (err, { attachments = [], text, textAsHtml, html }) => {
        if (err) return r(null);
        r({ attachments, text, textAsHtml, html });
      },
    ),
  );
};
