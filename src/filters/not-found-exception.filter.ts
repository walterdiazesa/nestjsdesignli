import { Catch, NotFoundException, ArgumentsHost } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { USE_JSON_SCRAPING_URL } from '../constants/routes';

@Catch(NotFoundException)
export class NotFoundExceptionFilter extends BaseExceptionFilter {
  catch(exception: NotFoundException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    response.status(404).json({
      ...USE_JSON_SCRAPING_URL,
      error: 'Not Found',
      statusCode: 404,
    });
  }
}
