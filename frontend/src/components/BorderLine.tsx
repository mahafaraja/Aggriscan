import React from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';

export function BorderLine(props: ViewProps) {
  return <View {...props} style={[styles.line, props.style]} />;
}

export function HomeIndicator(props: ViewProps) {
  return <View {...props} style={[styles.homeIndicator, props.style]} />;
}

const styles = StyleSheet.create({
  line: {
    height: 1,
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
  },
  homeIndicator: {
    width: 69,
    height: 3,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
  },
});
