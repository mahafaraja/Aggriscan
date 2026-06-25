import React, { forwardRef, useRef } from 'react';
import { StyleSheet, TextInput, TextInputProps, View } from 'react-native';
import { theme } from '../theme/Index';

type CodeInputRowProps = {
  length?: number;
  values?: string[];
  onChangeValue?: (value: string, index: number) => void;
};

export function CodeInputRow({ length = 6, values = [], onChangeValue }: CodeInputRowProps) {
  const inputRefs = useRef<Array<TextInput | null>>([]);

  const handleChange = (value: string, index: number) => {
    const normalized = value.replace(/\D/g, '').slice(-1);
    onChangeValue?.(normalized, index);

    if (normalized && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (event: any, index: number) => {
    if (event.nativeEvent.key === 'Backspace' && !values[index] && index > 0) {
      const previousIndex = index - 1;
      const updatedValues = [...(values ?? [])];
      updatedValues[previousIndex] = '';
      onChangeValue?.('', previousIndex);
      inputRefs.current[previousIndex]?.focus();
    }
  };

  const handlePaste = (text: string, index: number) => {
    const digits = text.replace(/\D/g, '').slice(0, length);
    if (!digits) {
      return;
    }

    const nextValues = Array(length).fill('');
    for (let i = 0; i < digits.length; i += 1) {
      nextValues[index + i] = digits[i];
    }

    nextValues.forEach((digit, digitIndex) => {
      if (digit) {
        onChangeValue?.(digit, digitIndex);
      }
    });
  };

  return (
    <View style={styles.row}>
      {Array.from({ length }).map((_, index) => (
        <CodeBox
          key={index}
          ref={(ref) => {
            inputRefs.current[index] = ref;
          }}
          value={values[index] ?? ''}
          onChangeText={(value) => handleChange(value, index)}
          onKeyPress={(event) => handleKeyPress(event, index)}
          onSelectionChange={() => {}}
          onChange={(event) => {
            const pastedText = (event.nativeEvent as any)?.text ?? '';
            if (pastedText) {
              handlePaste(pastedText, index);
            }
          }}
        />
      ))}
    </View>
  );
}

const CodeBox = forwardRef<TextInput, TextInputProps>((props, ref) => {
  return (
    <TextInput
      ref={ref}
      keyboardType="number-pad"
      maxLength={1}
      textAlign="center"
      style={styles.box}
      autoCorrect={false}
      {...props}
    />
  );
});

CodeBox.displayName = 'CodeBox';

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
