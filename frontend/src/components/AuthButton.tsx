import React from 'react';
import {
  Pressable,
  PressableProps,
  StyleSheet,
  Text,
  TextStyle,
  ViewStyle,
} from 'react-native';
import { theme } from '../theme/Index';

type AuthButtonProps = PressableProps & {
  label: string;
  compact?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
};

export function AuthButton({ label, compact = false, style, textStyle, ...props }: AuthButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.button,
        compact && styles.compact,
        pressed && styles.pressed,
        style,
      ]}
      {...props}
    >
      <Text style={[styles.label, textStyle]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 34,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: theme.colors.darkTeal,
    paddingHorizontal: theme.spacing.md,
  },
  compact: {
    minHeight: 30,
    width: 116,
    alignSelf: 'center',
  },
  pressed: {
    opacity: 0.82,
  },
  label: {
    color: theme.colors.textOnDark,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0,
  },
});
