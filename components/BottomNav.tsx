import { Feather } from '@expo/vector-icons';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../constants/theme';

const NAV_ITEMS: Record<string, { icon: keyof typeof Feather.glyphMap; label: string }> = {
  index: { icon: 'home', label: 'Home' },
  transactions: { icon: 'file-text', label: 'Transações' },
  reports: { icon: 'bar-chart-2', label: 'Relatórios' },
  simulator: { icon: 'percent', label: 'Simulador' },
  profile: { icon: 'user', label: 'Perfil' },
};

export function BottomNav({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.nav, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      <View style={styles.inner}>
        {state.routes.map((route, index) => {
          const item = NAV_ITEMS[route.name] ?? { icon: 'circle', label: route.name };
          const isActive = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isActive && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <Pressable key={route.key} onPress={onPress} style={styles.item}>
              <Feather name={item.icon} size={24} color={isActive ? colors.emerald600 : colors.gray400} />
              <Text style={[styles.label, { color: isActive ? colors.emerald600 : colors.gray400 }]}>
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  nav: {
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    height: 64,
    maxWidth: 448,
    width: '100%',
    alignSelf: 'center',
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 2,
    paddingVertical: 8,
  },
  label: {
    fontSize: 11,
  },
});
