import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { QueryProvider } from '@/lib/query/QueryProvider';

export default function RootLayout() {
  return (
    <QueryProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          contentStyle: { backgroundColor: '#101010' },
          headerShown: false,
        }}
      />
    </QueryProvider>
  );
}
