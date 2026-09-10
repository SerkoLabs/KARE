import type { AppErrorCode } from '@/lib/errors';

type LogLevel = 'info' | 'warn' | 'error';

type SafeMetadataValue = string | number | boolean | null | undefined;
type LogMetadata = Record<string, SafeMetadataValue>;

const allowedMetadataKeys = new Set([
  'action',
  'code',
  'durationMs',
  'feature',
  'requestId',
  'route',
  'screen',
  'status',
]);

const forbiddenKeyPattern =
  /(token|password|secret|authorization|cookie|review|body|email)/i;

export function sanitizeMetadata(
  metadata: LogMetadata | undefined,
): Record<string, SafeMetadataValue> {
  if (!metadata) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(metadata).filter(([key]) => {
      return allowedMetadataKeys.has(key) && !forbiddenKeyPattern.test(key);
    }),
  );
}

export type Logger = {
  info: (message: string, metadata?: LogMetadata) => void;
  warn: (message: string, metadata?: LogMetadata) => void;
  error: (
    message: string,
    metadata?: LogMetadata & { code?: AppErrorCode },
  ) => void;
};

function write(level: LogLevel, message: string, metadata?: LogMetadata) {
  if (typeof __DEV__ === 'undefined' || !__DEV__) {
    return;
  }

  const payload = sanitizeMetadata(metadata);

  if (level === 'error') {
    console.error(`[KARE] ${message}`, payload);
    return;
  }

  if (level === 'warn') {
    console.warn(`[KARE] ${message}`, payload);
    return;
  }
}

export const logger: Logger = {
  info: (message, metadata) => write('info', message, metadata),
  warn: (message, metadata) => write('warn', message, metadata),
  error: (message, metadata) => write('error', message, metadata),
};
