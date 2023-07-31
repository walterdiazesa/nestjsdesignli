import { MANY_JSON_REGEX, JSON_REGEX } from '../../constants/regex';
import {
  extractATagsFromHTML,
  extractHrefAttrValueFromATags,
  extractLinksFromString,
  requestHTMLPage,
  requestJSONFile,
} from '.';
const xss = require('xss');

const EXPECTED_PASTEBIN_JSON = {
  spam: 'spamVerdic a boolean, PASS = true',
  virus: 'virusVerdic a boolean, PASS = true',
  dns: 'spfVerdic, dkimVeredict, dmarcVeredict a boolean, si todos PASS = true',
  mes: 'mail.timestamp a mes como texto',
  retrasado: 'processingTimeMillis a boolean, > 1000 = true',
  emisor: 'mail.source a usuario de correo sin @dominio.com',
  receptor: ['mail.destination a usuarios de correo sin @domino.com'],
};

const EXPECTED_GH_JSON = {
  Records: [
    {
      eventVersion: '1.0',
      ses: {
        receipt: {
          timestamp: '2015-09-11T20:32:33.936Z',
          processingTimeMillis: 222,
          recipients: ['recipient@example.com'],
          spamVerdict: {
            status: 'PASS',
          },
          virusVerdict: {
            status: 'PASS',
          },
          spfVerdict: {
            status: 'PASS',
          },
          dkimVerdict: {
            status: 'PASS',
          },
          dmarcVerdict: {
            status: 'PASS',
          },
          dmarcPolicy: 'reject',
          action: {
            type: 'SNS',
            topicArn: 'arn:aws:sns:us-east-1:012345678912:example-topic',
          },
        },
        mail: {
          timestamp: '2015-09-11T20:32:33.936Z',
          source: '61967230-7A45-4A9D-BEC9-87CBCF2211C9@example.com',
          messageId: 'd6iitobk75ur44p8kdnnp7g2n800',
          destination: ['recipient@example.com'],
          headersTruncated: false,
          headers: [
            {
              name: 'Return-Path',
              value:
                '<0000014fbe1c09cf-7cb9f704-7531-4e53-89a1-5fa9744f5eb6-000000@amazonses.com>',
            },
            {
              name: 'Received',
              value:
                'from a9-183.smtp-out.amazonses.com (a9-183.smtp-out.amazonses.com [54.240.9.183]) by inbound-smtp.us-east-1.amazonaws.com with SMTP id d6iitobk75ur44p8kdnnp7g2n800 for recipient@example.com; Fri, 11 Sep 2015 20:32:33 +0000 (UTC)',
            },
            {
              name: 'DKIM-Signature',
              value:
                'v=1; a=rsa-sha256; q=dns/txt; c=relaxed/simple; s=ug7nbtf4gccmlpwj322ax3p6ow6yfsug; d=amazonses.com; t=1442003552; h=From:To:Subject:MIME-Version:Content-Type:Content-Transfer-Encoding:Date:Message-ID:Feedback-ID; bh=DWr3IOmYWoXCA9ARqGC/UaODfghffiwFNRIb2Mckyt4=; b=p4ukUDSFqhqiub+zPR0DW1kp7oJZakrzupr6LBe6sUuvqpBkig56UzUwc29rFbJF hlX3Ov7DeYVNoN38stqwsF8ivcajXpQsXRC1cW9z8x875J041rClAjV7EGbLmudVpPX 4hHst1XPyX5wmgdHIhmUuh8oZKpVqGi6bHGzzf7g=',
            },
            {
              name: 'From',
              value: 'sender@example.com',
            },
            {
              name: 'To',
              value: 'recipient@example.com',
            },
            {
              name: 'Subject',
              value: 'Example subject',
            },
            {
              name: 'MIME-Version',
              value: '1.0',
            },
            {
              name: 'Content-Type',
              value: 'text/plain; charset=UTF-8',
            },
            {
              name: 'Content-Transfer-Encoding',
              value: '7bit',
            },
            {
              name: 'Date',
              value: 'Fri, 11 Sep 2015 20:32:32 +0000',
            },
            {
              name: 'Message-ID',
              value: '<61967230-7A45-4A9D-BEC9-87CBCF2211C9@example.com>',
            },
            {
              name: 'X-SES-Outgoing',
              value: '2015.09.11-54.240.9.183',
            },
            {
              name: 'Feedback-ID',
              value:
                '1.us-east-1.Krv2FKpFdWV+KUYw3Qd6wcpPJ4Sv/pOPpEPSHn2u2o4=:AmazonSES',
            },
          ],
          commonHeaders: {
            returnPath:
              '0000014fbe1c09cf-7cb9f704-7531-4e53-89a1-5fa9744f5eb6-000000@amazonses.com',
            from: ['sender@example.com'],
            date: 'Fri, 11 Sep 2015 20:32:32 +0000',
            to: ['recipient@example.com'],
            messageId: '<61967230-7A45-4A9D-BEC9-87CBCF2211C9@example.com>',
            subject: 'Example subject',
          },
        },
      },
      eventSource: 'aws:ses',
    },
  ],
};

describe('extractLinksFromString', () => {
  it('should return null', () => {
    expect(
      extractLinksFromString(
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam ultricies nibh non cursus laoreet. Curabitur blandit ipsum vitae lobortis vehicula. Integer eget est lacinia sapien convallis semper vel et metus. Aliquam efficitur at augue nec consequat. Aliquam neque urna, vulputate non tempor ac, iaculis non purus. Cras consectetur, diam id elementum eleifend, lectus ipsum pulvinar purus, eget fermentum felis erat sed mauris. Aliquam augue mi, tincidunt ut nulla vel, aliquam aliquet urna. Donec sodales nisi id est consectetur porttitor. Curabitur in nulla nec urna ullamcorper interdum ut at nulla. Morbi felis nisl, ultrices ut lacus in, cursus sollicitudin nibh. Aliquam erat volutpat. Morbi nulla neque, varius ac ornare non, bibendum elementum dolor. Praesent dictum lacus nulla, in dapibus libero sollicitudin non.',
      ),
    ).toEqual([]);
  });
  it('should return a list of links', () => {
    expect(
      extractLinksFromString(
        'https://pastebin.com/bNgAT6RpLorem ipsum dolor sit amet, consectetur adipiscing shorturl.at/bwCDE elit. Aliquam ultricies nibh non jsonfromgithub<https://github.com/aws/aws-lambda-go/blob/main/events/testdata/ses-sns-event.json&gt cursus laoreet. Curabitur blandit ipsum vitae lobortis vehicula. Integer eget est lacinia sapien convallis semper vel et metus. Aliquam efficitur at augue nec consequat. Aliquam neque urna, vulputate non tempor ac, iaculis non purus. Cras consectetur, diam id elementum eleifend, lectus ipsum pulvinar purus, eget fermentum felis erat sed mauris. Aliquam augue mi, tincidunt ut nulla vel, aliquam aliquet urna. Donec sodales nisi id est consectetur porttitor. Curabitur in nulla nec urna ullamcorper interdum ut at nulla. Morbi felis nisl, ultrices ut lacus in, cursus sollicitudin nibh. Aliquam erat volutpat. Morbi nulla neque, varius ac ornare non, bibendum elementum dolor. Praesent dictum lacus nulla, in dapibus libero sollicitudin non.&lt;http://www.json.org/JSON_checker/test/pass1.json>',
      ),
    ).toMatchSnapshot();
  });
});

describe('requestJSONFile', () => {
  it('should return expected json from pastebin', async () => {
    const jsonFromPastebinRaw = await requestJSONFile(
      'https://pastebin.com/raw/riJjd0Hb',
    );
    expect(jsonFromPastebinRaw).toEqual(EXPECTED_PASTEBIN_JSON);
  });
  it('should return expected json from github', async () => {
    const jsonFromGithubRaw = await requestJSONFile(
      'https://github.com/aws/aws-lambda-go/raw/main/events/testdata/ses-sns-event.json',
    );
    expect(jsonFromGithubRaw).toEqual(EXPECTED_GH_JSON);
  });
  it('should return the same json as pastebin from a shortened url', async () => {
    const jsonFromShortenToPastebinRaw = await requestJSONFile(
      'http://shorturl.at/bwCDE',
    );
    expect(jsonFromShortenToPastebinRaw).toEqual(EXPECTED_PASTEBIN_JSON);
  });
});
