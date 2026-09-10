import { QueryClient } from '@tanstack/react-query';

import { AppError } from '@/lib/errors';

export function shouldRetryQuery(failureCount: number, error: unknown) {
  if (failureCount >= 2) {
    return false;
  }

  if (error instanceof AppError) {
    if (error.code === 'AUTH' || error.code === 'VALIDATION' || error.code === 'CONFIG') {
      return false;
    }

    return error.retryable;
  }

  return failureCount < 1;
}

export function createAppQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: shouldRetryQuery,
        staleTime: 30_000,
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: false,
      },
    },
  });
}
