import axios from 'axios';

interface ErrorResponse {
  message?: string;
}

export const getApiErrorMessage = (
  error: unknown,
  fallback = 'Error happened'
) => {
  if (axios.isAxiosError<ErrorResponse>(error)) {
    return error.response?.data?.message ?? error.message ?? fallback;
  }

  if (error instanceof Error) {
    return error.message || fallback;
  }

  return fallback;
};
