import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { checkPathType } from '../utils';

@Injectable()
export class BodyPathIsValid implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const body = request.body;

    if (checkPathType(body.path) === 'invalid')
      throw new BadRequestException(
        'Missing or invalid "path" property in the request body. It should be an local absolute path or a url that returns a .eml file',
      );
    return true;
  }
}
