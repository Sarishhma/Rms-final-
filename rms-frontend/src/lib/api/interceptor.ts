import type {
  InternalAxiosRequestConfig,
  AxiosResponse,
  AxiosError,
} from "axios";

type ApiErrorResponse = {
  success: false;
  error?: {
    code?: string;
    message?: string;
    details?: {
      formErrors?: string[];
      fieldErrors?: Record<string, string[]>;
    };
  };
};

export type NormalizedError = {
  status: number;
  message: string;
  type: string;
  raw?: unknown;
  fieldErrors?: Record<string, string[]>;
};

type GetToken = (options?: {
  template?: string;
  skipCache?: boolean;
}) => Promise<string | null>;

function parseApiError(data?: ApiErrorResponse) {
  const fieldErrors = data?.error?.details?.fieldErrors;

  // Flatten all field errors into a single readable message
  const fieldErrorMessage = fieldErrors
    ? Object.values(fieldErrors).flat().join(", ")
    : undefined;

  return {
    message: fieldErrorMessage || data?.error?.message,
    code: data?.error?.code,
    fieldErrors,
  };
}

export const apiMiddleware = {
  onRequest: async (
    config: InternalAxiosRequestConfig,
    getToken: GetToken,
  ): Promise<InternalAxiosRequestConfig> => {
    const token = await getToken({ skipCache: true });

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },

  onResponse: (response: AxiosResponse) => {
    return response;
  },

  onError: (error: AxiosError): Promise<never> => {
    const isNetworkError = !error.response;

    const status = error.response?.status ?? 0;
    const data = error.response?.data as ApiErrorResponse | undefined;

    const { message, code, fieldErrors } = parseApiError(data);

    const normalizedError: NormalizedError = {
      status,
      message: "",
      type: "",
      raw: error,
      fieldErrors,
    };

    // Network Error
    if (isNetworkError) {
      return Promise.reject({
        ...normalizedError,
        message: "No internet or server unreachable",
        type: "NETWORK_ERROR",
      });
    }

    switch (status) {
      case 400:
        return Promise.reject({
          ...normalizedError,
          message: message || "Bad request",
          type: code || "BAD_REQUEST",
        });

      case 401:
        return Promise.reject({
          ...normalizedError,
          message: message || "Session expired. Please login again.",
          type: "AUTH_ERROR",
        });

      case 403:
        return Promise.reject({
          ...normalizedError,
          message: message || "You don’t have permission.",
          type: "FORBIDDEN",
        });

      case 404:
        return Promise.reject({
          ...normalizedError,
          message: message || "Resource not found.",
          type: "NOT_FOUND",
        });

      case 409:
        return Promise.reject({
          ...normalizedError,
          message: message || "Conflict occurred.",
          type: code || "CONFLICT",
        });

      case 422:
        return Promise.reject({
          ...normalizedError,
          message: message || "Validation error",
          type: "VALIDATION",
        });

      case 500:
        return Promise.reject({
          ...normalizedError,
          message: message || "Server error. Try again later.",
          type: "SERVER_ERROR",
        });

      default:
        return Promise.reject({
          ...normalizedError,
          message: message || "Something went wrong",
          type: code || "UNKNOWN",
        });
    }
  },
};
