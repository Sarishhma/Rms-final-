import toast from "react-hot-toast";

export const useGlobalError = () => {
  const handleError = (error: any) => {
    const message =
      error?.response?.data?.message ||
      error?.message ||
      "Something went wrong";

    toast.error(message);
  };

  return { handleError };
};