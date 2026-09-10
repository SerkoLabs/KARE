export type AppErrorCode =
  | 'CONFIG'
  | 'AUTH'
  | 'NETWORK'
  | 'PROVIDER'
  | 'VALIDATION'
  | 'UNKNOWN';

type AppErrorOptions = {
  code: AppErrorCode;
  message: string;
  retryable?: boolean;
  cause?: unknown;
};

export class AppError extends Error {
  readonly code: AppErrorCode;
  readonly retryable: boolean;
  readonly cause?: unknown;

  constructor({
    code,
    message,
    retryable = false,
    cause,
  }: AppErrorOptions) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.retryable = retryable;
    this.cause = cause;
  }
}

export function normalizeUnknownError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }

  return new AppError({
    code: 'UNKNOWN',
    message: 'Beklenmeyen bir hata oluştu.',
    cause: error,
  });
}
