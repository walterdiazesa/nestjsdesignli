import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  scrapJson(): string {
    return 'Hello World!';
  }
}
