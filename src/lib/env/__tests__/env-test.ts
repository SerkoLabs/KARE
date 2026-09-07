import { AppError } from '@/lib/errors';
import { parsePublicEnv, tryParsePublicEnv } from '@/lib/env';

describe('public environment parser', () => {
  test('accepts valid public Supabase configuration', () => {
    const value = parsePublicEnv({
      EXPO_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
      EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
        'sb_publishable_12345678901234567890',
    });

    expect(value.EXPO_PUBLIC_SUPABASE_URL).toBe(
      'https://example.supabase.co',
    );
  });

  test('rejects missing or invalid public configuration intentionally', () => {
    expect(() => parsePublicEnv({})).toThrow(AppError);

    const result = tryParsePublicEnv({
      EXPO_PUBLIC_SUPABASE_URL: 'http://not-secure.example.com',
      EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'short',
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('CONFIG');
    }
  });
});
