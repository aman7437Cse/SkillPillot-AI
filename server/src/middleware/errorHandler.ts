import { Request, Response, NextFunction } from 'express';

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    success: false,
    message: `Resource not found: ${req.method} ${req.originalUrl}`
  });
}

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  const statusCode = err.status || err.statusCode || 500;
  console.error(`[Error] ${req.method} ${req.originalUrl} -`, err);

  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
}
