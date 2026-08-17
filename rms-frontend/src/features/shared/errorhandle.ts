import axios from "axios";

export const handleApiError = (error: unknown, context: string) => {
  console.error(`❌ ${context} failed`);

  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const message =
      error.response?.data?.message ||
      error.message ||
      `${context} failed`;

    const err = new Error(message);
    (err as any).status = status;

    console.error("Status:", status);
    console.error("Message:", message);

    throw err;
  }

  const err = new Error(`Unexpected error while ${context}`);
  console.error(error);

  throw err;
};