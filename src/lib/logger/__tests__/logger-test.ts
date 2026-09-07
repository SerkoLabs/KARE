import { sanitizeMetadata } from '@/lib/logger';

describe('logger metadata policy', () => {
  test('keeps allowlisted operational metadata and drops sensitive fields', () => {
    const sanitized = sanitizeMetadata({
      action: 'movie_open',
      requestId: 'req-1',
      status: 200,
      token: 'must-not-log',
      email: 'private@example.com',
      reviewBody: 'private text',
    });

    expect(sanitized).toEqual({
      action: 'movie_open',
      requestId: 'req-1',
      status: 200,
    });
  });
});
