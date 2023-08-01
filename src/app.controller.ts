import { CacheInterceptor, CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import {
  All,
  Body,
  Controller,
  HttpStatus,
  Inject,
  Post,
  Res,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AppService } from './app.service';
import { USE_JSON_SCRAPING_URL } from './constants/routes';
import { BodyPathIsValid } from './guards/body-path.guard';
import { EMLCacheGuard } from './guards/eml-cache.guard';
import { isValidURL } from './utils';

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
  // BodyPathIsValid already handled that the path is either a valid URL (though not necessarily leading to an existing page) or a local path.
  async scrapJson(@Res() res: Response, @Body() { path }: Request['body']) {
    const { payload, statusCode } = await this.appService.scrapJson(path);
    if (statusCode === HttpStatus.OK && isValidURL(path)) {
      await this.cache.set(path, payload);
    }
    return res.status(statusCode).json(payload);
  }
}
