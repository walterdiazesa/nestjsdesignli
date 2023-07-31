import { Request as ExpressRequest } from 'express';

declare module 'express' {
  export interface Request extends ExpressRequest {
    body: { path: string };
    app: any;
  }
}
