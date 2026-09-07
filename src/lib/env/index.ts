import { z } from 'zod';

import { AppError } from '@/lib/errors';

const publicEnvSchema = z.object({
  EXPO_PUBLIC_SUPABASE_URL: z
    .string()
    .url()
    .refine((value) => value.startsWith('https://'), 'Supabase URL HTTPS olmalı.'),
  EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().trim().min(20),
});

export type PublicEnv = z.infer<typeof publicEnvSchema>;

export type PublicEnvResult =
  | { ok: true; value: PublicEnv }
  | { ok: false; error: AppError };

export function parsePublicEnv(
  source: Record<string, string | undefined> = process.env,
): PublicEnv {
  const parsed = publicEnvSchema.safeParse(source);

  if (!parsed.success) {
    throw new AppError({
      code: 'CONFIG',
      message:
        'KARE yapılandırması eksik veya geçersiz. .env.example dosyasındaki public Supabase değişkenlerini kontrol edin.',
      cause: parsed.error.flatten(),
    });
  }

  return parsed.data;
}

export function tryParsePublicEnv(
  source: Record<string, string | undefined> = process.env,
): PublicEnvResult {
  try {
    return { ok: true, value: parsePublicEnv(source) };
  } catch (error) {
    if (error instanceof AppError) {
      return { ok: false, error };
    }

    return {
      ok: false,
      error: new AppError({
        code: 'CONFIG',
        message: 'KARE yapılandırması okunamadı.',
        cause: error,
      }),
    };
  }
}
