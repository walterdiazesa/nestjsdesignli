import { CacheModule } from '@nestjs/cache-manager';
import { Test, TestingModule } from '@nestjs/testing';
import { Response } from 'express';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let app: TestingModule;

  const response: Partial<Response> = {
    // @ts-ignore
    status: jest
      .fn()
      .mockImplementation()
      .mockReturnValue({
        json: jest.fn().mockImplementation().mockReturnValue({}),
      }),
    json: jest.fn().mockImplementation().mockReturnValue({}),
  };

  beforeAll(async () => {
    app = await Test.createTestingModule({
      imports: [
        CacheModule.register({
          ttl: 0, // Never expire
        }),
      ],
      controllers: [AppController],
      providers: [AppService],
    }).compile();
  });

  describe('scrapJson', () => {
    it('should return json', async () => {
      const appController = app.get(AppController);
      const jsonScrapingResponse = await appController.scrapJson(
        response as Required<Response>,
        {
          path: '/',
        },
      );
      expect(jsonScrapingResponse).toEqual({});
    });
  });
});
