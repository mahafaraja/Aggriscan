import React from 'react';
import { StyleSheet, TextInput, TextInputProps, View } from 'react-native';
import { theme } from '../theme/Index';

type CodeInputRowProps = {
  length?: number;
  values?: string[];
  onChangeValue?: (value: string, index: number) => void;
};

export function CodeInputRow({ length = 5, values = [], onChangeValue }: CodeInputRowProps) {
  return (
    <View style={styles.row}>
      {Array.from({ length }).map((_, index) => (
        <CodeBox
          key={index}
          value={values[index] ?? ''}
          onChangeText={(value) => onChangeValue?.(value.slice(-1), index)}
        />
      ))}
    </View>
  );
}

function CodeBox(props: TextInputProps) {
  return (
    <TextInput
      keyboardType="number-pad"
      maxLength={1}
      textAlign="center"
      style={styles.box}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 11,
  },
  box: {
    width: 31,
    height: 36,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.92)',
    color: theme.colors.textOnDark,
    fontSize: 14,
    fontWeight: '700',
  },
});
