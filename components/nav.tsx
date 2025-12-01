import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Image, Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Props = {
  onMenuPress?: () => void;
  onLogoPress?: () => void;
};

export default function StickyHeader({ onMenuPress, onLogoPress }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrapper, { paddingTop: insets.top }]}>
      <View style={styles.inner}>
        <Pressable onPress={onLogoPress} hitSlop={10} style={styles.left}>
          {/* Replace with your logo asset */}
          <Image
            source={require('../assets/images/trustmedlogo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </Pressable>

        <Pressable onPress={onMenuPress} hitSlop={12} style={styles.right}>
          <Ionicons name="menu" size={26} color="#11181C" />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute', // sticks to the top over scroll content
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    zIndex: 100, // above page content
    // subtle shadow
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.07,
        shadowOffset: { width: 0, height: 3 },
        shadowRadius: 6,
      },
      android: {
        elevation: 3,
      },
      default: {},
    }),
  },
  inner: {
    height: 56,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  left: { flexDirection: 'row', alignItems: 'center' },
  right: { paddingLeft: 8 },
  logo: { width: 140, height: 24 }, // tweak to your logo proportions
});
