import { AppError } from '@/lib/errors';
import { shouldRetryQuery } from '@/lib/query/client';

describe('query retry policy', () => {
  test('does not retry auth or validation failures', () => {
    expect(
      shouldRetryQuery(
        0,
        new AppError({ code: 'AUTH', message: 'expired', retryable: true }),
      ),
    ).toBe(false);

    expect(
      shouldRetryQuery(
        0,
        new AppError({
          code: 'VALIDATION',
          message: 'bad input',
          retryable: true,
        }),
      ),
    ).toBe(false);
  });

  test('allows bounded retry for retryable network/provider failures', () => {
    expect(
      shouldRetryQuery(
        0,
        new AppError({
          code: 'NETWORK',
          message: 'offline',
          retryable: true,
        }),
      ),
    ).toBe(true);

    expect(
      shouldRetryQuery(
        2,
        new AppError({
          code: 'NETWORK',
          message: 'offline',
          retryable: true,
        }),
      ),
    ).toBe(false);
  });
});
