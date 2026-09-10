import type { PropsWithChildren } from 'react';
import { SafeAreaView, StyleSheet, View, type ViewProps } from 'react-native';

import { colors, layout } from '@/design/tokens';

type ScreenProps = PropsWithChildren<
  ViewProps & {
    padded?: boolean;
  }
>;

export function Screen({ children, padded = true, style, ...props }: ScreenProps) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View
        {...props}
        style={[styles.content, padded && styles.padded, style]}
      >
        {children}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    backgroundColor: colors.background,
  },
  padded: {
    paddingHorizontal: layout.screenPadding,
  },
});
