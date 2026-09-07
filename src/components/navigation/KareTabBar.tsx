import type { ComponentProps } from 'react';
import { Fragment } from 'react';
import { Tabs, useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { colors, radius, spacing } from '@/design/tokens';

type TabsProps = ComponentProps<typeof Tabs>;
type KareTabBarProps = Parameters<NonNullable<TabsProps['tabBar']>>[0];

type TabRouteName = 'index' | 'library' | 'lists' | 'profile';

const tabMeta: Record<
  TabRouteName,
  { label: string; symbol: string; href: '/(tabs)' | '/(tabs)/library' | '/(tabs)/lists' | '/(tabs)/profile' }
> = {
  index: { label: 'Keşfet', symbol: '⌂', href: '/(tabs)' },
  library: { label: 'Kütüphanem', symbol: '▦', href: '/(tabs)/library' },
  lists: { label: 'Listeler', symbol: '≡', href: '/(tabs)/lists' },
  profile: { label: 'Profil', symbol: '◎', href: '/(tabs)/profile' },
};

function isTabRouteName(value: string): value is TabRouteName {
  return value in tabMeta;
}

export function KareTabBar({ state }: KareTabBarProps) {
  const router = useRouter();
  const visibleRoutes = state.routes.filter((route) => isTabRouteName(route.name));

  return (
    <View accessibilityRole="tablist" style={styles.container}>
      {visibleRoutes.map((route, visibleIndex) => {
        const routeIndex = state.routes.findIndex((candidate) => candidate.key === route.key);
        const focused = state.index === routeIndex;
        const meta = tabMeta[route.name as TabRouteName];
        const tab = (
          <Pressable
            accessibilityLabel={meta.label}
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
            key={route.key}
            onPress={() => router.navigate(meta.href)}
            style={styles.tab}
          >
            <AppText tone={focused ? 'accent' : 'secondary'} variant="heading">
              {meta.symbol}
            </AppText>
            <AppText tone={focused ? 'accent' : 'secondary'} variant="caption">
              {meta.label}
            </AppText>
          </Pressable>
        );

        if (visibleIndex === 2) {
          return (
            <Fragment key={`with-add-${route.key}`}>
              <Pressable
                accessibilityLabel="Film ekle"
                accessibilityRole="button"
                onPress={() => router.push('/quick-add')}
                style={styles.addButton}
              >
                <AppText variant="title">＋</AppText>
              </Pressable>
              {tab}
            </Fragment>
          );
        }

        return tab;
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    minHeight: 72,
    paddingHorizontal: spacing.xs,
    paddingBottom: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  tab: {
    flex: 1,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
    marginHorizontal: spacing.xs,
  },
});
