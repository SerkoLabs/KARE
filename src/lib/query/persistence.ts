import type { QueryKey } from '@tanstack/react-query';

export type PersistedCacheAdapter = {
  remove: (storageKey: string) => Promise<void>;
};

const persistableFamilies = new Set<string>();

export function shouldPersistQueryKey(queryKey: QueryKey) {
  const family = queryKey[0];
  return typeof family === 'string' && persistableFamilies.has(family);
}

export function registerPersistableQueryFamily(family: string) {
  persistableFamilies.add(family);
}

export async function clearOwnerPrivatePersistedCache(
  adapter: PersistedCacheAdapter,
  userId: string,
) {
  await Promise.all([
    adapter.remove(`kare:library:${userId}`),
    adapter.remove(`kare:profile:${userId}`),
    adapter.remove(`kare:recommendation:${userId}`),
  ]);
}
