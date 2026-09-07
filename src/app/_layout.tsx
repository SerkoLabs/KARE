import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { AuthBootstrapProvider } from '@/features/auth/bootstrap/AuthBootstrapProvider';
import { QueryProvider } from '@/lib/query/QueryProvider';

export default function RootLayout() {
  return (
    <QueryProvider>
      <AuthBootstrapProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            contentStyle: { backgroundColor: '#101010' },
            headerShown: false,
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="quick-add" options={{ presentation: 'modal' }} />
        </Stack>
      </AuthBootstrapProvider>
    </QueryProvider>
  );
}
