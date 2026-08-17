export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: unknown;

  public constructor(statusCode: number, code: string, message: string, details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export const badRequest = (message: string, details?: unknown) =>
  new AppError(400, "BAD_REQUEST", message, details);

export const unauthorized = (message = "Authentication required") =>
  new AppError(401, "UNAUTHORIZED", message);

export const forbidden = (message = "Permission denied") =>
  new AppError(403, "FORBIDDEN", message);

export const notFound = (resource: string) => new AppError(404, "NOT_FOUND", `${resource} not found`);

export const conflict = (message: string, details?: unknown) =>
  new AppError(409, "CONFLICT", message, details);

export const tooManyRequests = (message = "Too many requests") =>
  new AppError(429, "RATE_LIMITED", message);

export const internalServerError = (message = "Something went wrong") =>
  new AppError(500, "INTERNAL_SERVER_ERROR", message);
