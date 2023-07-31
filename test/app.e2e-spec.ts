import * as request from 'supertest';
import { Test } from '@nestjs/testing';
import { AppModule } from './../src/app.module';
import { INestApplication } from '@nestjs/common';

const EXPECTED_JSON = {
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

const EXPECTED_PASTEBIN_JSON = {
  spam: 'spamVerdic a boolean, PASS = true',
  virus: 'virusVerdic a boolean, PASS = true',
  dns: 'spfVerdic, dkimVeredict, dmarcVeredict a boolean, si todos PASS = true',
  mes: 'mail.timestamp a mes como texto',
  retrasado: 'processingTimeMillis a boolean, > 1000 = true',
  emisor: 'mail.source a usuario de correo sin @dominio.com',
  receptor: ['mail.destination a usuarios de correo sin @domino.com'],
};

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/json-scraping (POST) on mail attachment', () => {
    return request(app.getHttpServer())
      .post('/json-scraping')
      .send({
        path: 'https://proud-of.s3.filebase.com/Test JSON inside mail attachment.eml',
      })
      .expect(200)
      .expect(EXPECTED_JSON);
  });
  it('/json-scraping (POST) on mail attachment from absolute path', () => {
    return request(app.getHttpServer())
      .post('/json-scraping')
      .send({
        path:
          process.env.LOCAL_EML_PATH ||
          '/Users/walterdiaz/Downloads/Test_JSON_inside_mail_attachment.eml',
      })
      .expect(200)
      .expect(EXPECTED_JSON);
  });
  it('/json-scraping (POST) on mail body', () => {
    return request(app.getHttpServer())
      .post('/json-scraping')
      .send({
        path: 'https://proud-of.s3.filebase.com/Test JSON inside mail text.eml',
      })
      .expect(200)
      .expect(EXPECTED_JSON);
  });
  it('/json-scraping (POST) on mail link to json', () => {
    return request(app.getHttpServer())
      .post('/json-scraping')
      .send({
        path: 'https://proud-of.s3.filebase.com/Test JSON inside mail link.eml',
      })
      .expect(200)
      .expect(EXPECTED_JSON);
  });
  it('/json-scraping (POST) on mail raw link to json', () => {
    return request(app.getHttpServer())
      .post('/json-scraping')
      .send({
        path: 'https://proud-of.s3.filebase.com/Test JSON inside mail raw link.eml',
      })
      .expect(200)
      .expect(EXPECTED_JSON);
  });
  it('/json-scraping (POST) on mail link to json page scrap in body (Github)', () => {
    return request(app.getHttpServer())
      .post('/json-scraping')
      .send({
        path: 'https://proud-of.s3.filebase.com/Test JSON from link of Github JSON.eml',
      })
      .expect(200)
      .expect(EXPECTED_GH_JSON);
  });
  it('/json-scraping (POST) on mail link to json page scrap in body (Github Gist)', () => {
    return request(app.getHttpServer())
      .post('/json-scraping')
      .send({
        path: 'https://proud-of.s3.filebase.com/Test JSON from link of Github Gist.eml',
      })
      .expect(200)
      .expect({
        source: 'gist.github.com',
      });
  });
  it('/json-scraping (POST) on mail link to json page scrap in body (Pastebin)', () => {
    return request(app.getHttpServer())
      .post('/json-scraping')
      .send({
        path: 'https://proud-of.s3.filebase.com/Test JSON from link of Pastebin JSON (1).eml',
      })
      .expect(200)
      .expect(EXPECTED_PASTEBIN_JSON);
  });
  it('/json-scraping (POST) on mail link to json page scrap in body (Jsonblob)', () => {
    return request(app.getHttpServer())
      .post('/json-scraping')
      .send({
        path: 'https://proud-of.s3.filebase.com/Test JSON from link of JSONBlob.eml',
      })
      .expect(200)
      .expect({
        array: [1, 2, 3],
        boolean: true,
        null: null,
        number: 123,
        object: {
          a: 'b',
          c: 'd',
          e: 'f',
        },
        string: 'Hello World',
      });
  });
  it('/json-scraping (POST) on mail link to json page scrap in body (Jsonformatter)', () => {
    return request(app.getHttpServer())
      .post('/json-scraping')
      .send({
        path: 'https://proud-of.s3.filebase.com/Test JSON from JSONFormatter.eml',
      })
      .expect(200);
  });
});
