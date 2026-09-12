import { randomUUID } from 'crypto';
import { NextFunction, Request, Response } from 'express';

export class RequestIdMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const incoming = req.headers['x-request-id'];
    const requestId = typeof incoming === 'string' ? incoming : randomUUID();
    (req as any).id = requestId;
    res.setHeader('x-request-id', requestId);
    next();
  }
}
