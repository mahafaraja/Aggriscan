import React from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { theme } from '../theme/Index';

type AuthBackgroundProps = ViewProps & {
  children: React.ReactNode;
};

export function AuthBackground({ children, style, ...props }: AuthBackgroundProps) {
  return (
    <View style={[styles.container, style]} {...props}>
      <Svg pointerEvents="none" style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id="authGradient" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={theme.colors.mint} stopOpacity="0.62" />
            <Stop offset="0.62" stopColor={theme.colors.deepTeal} stopOpacity="1" />
            <Stop offset="1" stopColor="#005E5E" stopOpacity="1" />
          </LinearGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#authGradient)" />
      </Svg>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: theme.colors.deepTeal,
  },
});
