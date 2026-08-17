import { Prisma } from "@prisma/client";
import type { ErrorHandler } from "hono";
import { ZodError } from "zod";
import { AppError } from "../utils/app-error.js";

// Maps a Prisma known-error code to a safe, user-facing response. The raw
// `error.meta` and `error.message` (which can contain table/column names
// and constraint identifiers) are intentionally never forwarded to clients.
const prismaErrorMap: Record<
  string,
  { status: 400 | 404 | 409; code: string; message: string }
> = {
  P2002: {
    status: 409,
    code: "CONFLICT",
    message: "A record with these values already exists.",
  },
  P2003: {
    status: 409,
    code: "FOREIGN_KEY_CONSTRAINT",
    message: "Related record is missing or still in use.",
  },
  P2014: {
    status: 409,
    code: "INVALID_REFERENCE",
    message: "Operation conflicts with existing relations.",
  },
  P2025: {
    status: 404,
    code: "NOT_FOUND",
    message: "The requested record was not found.",
  },
};

export const errorHandler: ErrorHandler = (error, c) => {
  if (error instanceof AppError) {
    return c.json(
      {
        success: false,
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        },
      },
      error.statusCode as 400,
    );
  }

  if (error instanceof ZodError) {
    return c.json(
      {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Validation failed",
          details: error.flatten(),
        },
      },
      400,
    );
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    console.error("[Prisma error]", {
      code: error.code,
      meta: error.meta,
      message: error.message,
    });
    const mapped = prismaErrorMap[error.code] ?? {
      status: 400 as const,
      code: "DATABASE_ERROR",
      message: "The database could not process this request.",
    };
    return c.json(
      {
        success: false,
        error: { code: mapped.code, message: mapped.message },
      },
      mapped.status,
    );
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    console.error("[Prisma validation]", error.message);
    return c.json(
      {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid request data.",
        },
      },
      400,
    );
  }

  if (
    error instanceof Prisma.PrismaClientInitializationError ||
    error instanceof Prisma.PrismaClientRustPanicError ||
    error instanceof Prisma.PrismaClientUnknownRequestError
  ) {
    console.error("[Prisma infrastructure error]", error);
    return c.json(
      {
        success: false,
        error: {
          code: "DATABASE_UNAVAILABLE",
          message: "The service is temporarily unavailable. Please try again.",
        },
      },
      503,
    );
  }

  console.error("[Unhandled error]", error);
  return c.json(
    {
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Something went wrong. Please try again later.",
      },
    },
    500,
  );
};
