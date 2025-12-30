import type { Request, Response, NextFunction } from "express";

/**
 * Custom error class for application-specific errors.
 * Includes HTTP status code for proper response handling.
 */
export class AppError extends Error {
  constructor(public statusCode: number, public message: string) {
    super(message);
    this.name = "AppError";
  }
}

/**
 * Global error handling middleware for Express.
 * Catches all errors and returns consistent JSON responses.
 * Must have 4 parameters for Express to recognize it as an error handler.
 */
export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error("Error:", err);

  // Handle custom AppError
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: err.message,
    });
    return;
  }

  // Handle Prisma database errors
  if (err.name === "PrismaClientKnownRequestError") {
    res.status(400).json({
      success: false,
      error: "Database operation failed",
    });
    return;
  }

  // Handle unknown errors (hide details in production)
  res.status(500).json({
    success: false,
    error:
      process.env.NODE_ENV === "development"
        ? err.message
        : "Internal server error",
  });
}

/**
 * Wrapper for async route handlers.
 * Catches Promise rejections and passes them to the error handler.
 * Eliminates the need for try-catch in every route.
 *
 * @example
 * router.get('/users', asyncHandler(async (req, res) => {
 *   const users = await userService.findAll();
 *   res.json(users);
 * }));
 */
export function asyncHandler<T>(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<T>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
