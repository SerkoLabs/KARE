import type { PropsWithChildren } from 'react';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { tryParsePublicEnv } from '@/lib/env';

export type AuthBootstrapStatus =
  | 'loading'
  | 'config-error'
  | 'unauthenticated'
  | 'preview-authenticated';

type AuthBootstrapValue = {
  status: AuthBootstrapStatus;
  configErrorMessage?: string;
  enterDevelopmentPreview: () => void;
  leaveDevelopmentPreview: () => void;
};

const AuthBootstrapContext = createContext<AuthBootstrapValue | null>(null);

export function AuthBootstrapProvider({ children }: PropsWithChildren) {
  const [status, setStatus] = useState<AuthBootstrapStatus>('loading');
  const [configErrorMessage, setConfigErrorMessage] = useState<string>();

  useEffect(() => {
    const config = tryParsePublicEnv();

    if (!config.ok) {
      setConfigErrorMessage(config.error.message);
      setStatus('config-error');
      return;
    }

    // Phase 2 replaces this temporary boundary with the real Supabase session lifecycle.
    // Until then we deliberately resolve to unauthenticated instead of inventing a session.
    setStatus('unauthenticated');
  }, []);

  const enterDevelopmentPreview = useCallback(() => {
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      setStatus('preview-authenticated');
    }
  }, []);

  const leaveDevelopmentPreview = useCallback(() => {
    setStatus('unauthenticated');
  }, []);

  const value = useMemo<AuthBootstrapValue>(
    () => ({
      status,
      configErrorMessage,
      enterDevelopmentPreview,
      leaveDevelopmentPreview,
    }),
    [configErrorMessage, enterDevelopmentPreview, leaveDevelopmentPreview, status],
  );

  return (
    <AuthBootstrapContext.Provider value={value}>
      {children}
    </AuthBootstrapContext.Provider>
  );
}

export function useAuthBootstrap() {
  const value = useContext(AuthBootstrapContext);

  if (!value) {
    throw new Error('useAuthBootstrap must be used inside AuthBootstrapProvider');
  }

  return value;
}
