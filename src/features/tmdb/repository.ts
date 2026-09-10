import type { Movie, RecommendationInput } from '../movies/domain';
import { mapTmdbMovie } from './mapper';

export class MovieDataError extends Error {
  constructor(
    message: string,
    readonly code:
      | 'configuration'
      | 'network'
      | 'upstream'
      | 'invalid-response',
  ) {
    super(message);
    this.name = 'MovieDataError';
  }
}

const RETRYABLE_STATUS = new Set([429, 500, 502, 503, 504]);

function wait(milliseconds: number, signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    const timer = setTimeout(resolve, milliseconds);
    signal?.addEventListener(
      'abort',
      () => {
        clearTimeout(timer);
        reject(new Error('aborted'));
      },
      { once: true },
    );
  });
}

async function requestWithRetry(url: string, signal?: AbortSignal) {
  let response: Response;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      response = await fetch(url, {
        headers: { Accept: 'application/json' },
        ...(signal ? { signal } : {}),
      });
    } catch {
      if (attempt === 0 && !signal?.aborted) {
        await wait(200, signal);
        continue;
      }
      throw new MovieDataError(
        'Film verisine ulaşılamadı. Bağlantını kontrol edip tekrar dene.',
        'network',
      );
    }

    if (!RETRYABLE_STATUS.has(response.status) || attempt === 1) {
      return response;
    }

    await wait(200, signal);
  }

  throw new MovieDataError(
    'Film servisi şu anda yanıt veremiyor.',
    'upstream',
  );
}

export async function discoverMovies(
  input: RecommendationInput,
  signal?: AbortSignal,
): Promise<Movie[]> {
  const base = process.env.EXPO_PUBLIC_KARE_API_URL?.replace(/\/$/, '');
  if (!base) {
    throw new MovieDataError(
      'Gerçek film verisi için KARE API adresi yapılandırılmalı.',
      'configuration',
    );
  }

  const query = new URLSearchParams({
    mood: input.mood,
    duration: input.duration,
    attention: input.attention,
  });
  if (input.context) query.set('context', input.context);

  const response = await requestWithRetry(
    `${base}/tmdb-discover?${query}`,
    signal,
  );

  if (!response.ok) {
    throw new MovieDataError(
      response.status === 429
        ? 'Film servisi kısa süreliğine yoğun.'
        : 'Film servisi şu anda yanıt veremiyor.',
      'upstream',
    );
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new MovieDataError(
      'Film servisinden geçersiz yanıt alındı.',
      'invalid-response',
    );
  }

  const raw =
    payload &&
    typeof payload === 'object' &&
    Array.isArray((payload as { movies?: unknown }).movies)
      ? (payload as { movies: unknown[] }).movies
      : [];
  const movies = raw
    .map(mapTmdbMovie)
    .filter((movie): movie is Movie => movie !== null);

  if (!movies.length) {
    throw new MovieDataError(
      'Bu seçimlere uygun doğrulanmış film bulunamadı.',
      'invalid-response',
    );
  }

  return movies;
}
