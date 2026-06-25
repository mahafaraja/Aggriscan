import React from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { theme } from '../theme/Index';

type AuthTextFieldProps = TextInputProps & {
  label: string;
};

export function AuthTextField({ label, style, ...props }: AuthTextFieldProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        placeholderTextColor="rgba(255, 255, 255, 0.72)"
        style={[styles.input, style]}
        {...props}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 7,
  },
  label: {
    color: theme.colors.textOnDark,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0,
  },
  input: {
    minHeight: 38,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.92)',
    borderRadius: 7,
    paddingHorizontal: 12,
    color: theme.colors.textOnDark,
    fontSize: 9,
  },
});
