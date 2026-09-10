import { Tabs } from 'expo-router';

import { KareTabBar } from '@/components/navigation/KareTabBar';

export default function TabsLayout() {
  return (
    <Tabs
      backBehavior="history"
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <KareTabBar {...props} />}
    >
      <Tabs.Screen name="index" options={{ title: 'Keşfet' }} />
      <Tabs.Screen name="library" options={{ title: 'Kütüphanem' }} />
      <Tabs.Screen name="lists" options={{ title: 'Listeler' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profil' }} />
    </Tabs>
  );
}
