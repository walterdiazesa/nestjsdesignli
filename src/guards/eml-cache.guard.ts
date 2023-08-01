// cache.guard.ts
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
} from '@nestjs/common';
import { Cache } from 'cache-manager';
import { Request, Response } from 'express';

@Injectable()
export class EMLCacheGuard implements CanActivate {
  constructor(@Inject(CACHE_MANAGER) private cache: Cache) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const http = ctx.switchToHttp();
    const req: Request = http.getRequest();
    const res: Response = http.getResponse();
    const { path } = req.body;
    const cachedData = await this.cache.get(path);

    if (cachedData) {
      res.header('X-Cache-Status', 'HIT');
      res.status(200).json(cachedData);
      return false;
    }

    return true;
  }
}
