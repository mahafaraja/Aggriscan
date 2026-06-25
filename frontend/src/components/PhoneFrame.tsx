import React from 'react';
import { StyleSheet, View } from 'react-native';
import { HomeIndicator } from './BorderLine';

type PhoneFrameProps = {
  children: React.ReactNode;
};

export function PhoneFrame({ children }: PhoneFrameProps) {
  return (
    <View style={styles.frame}>
      <View style={styles.statusBar}>
        <View style={styles.timeDot} />
        <View style={styles.statusPills}>
          <View style={styles.statusPill} />
          <View style={[styles.statusPill, styles.shortPill]} />
          <View style={styles.battery} />
        </View>
      </View>
      {children}
      <View style={styles.indicatorWrap}>
        <HomeIndicator />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    width: 229,
    height: 493,
    borderRadius: 25,
    overflow: 'hidden',
    backgroundColor: '#005E5E',
  },
  statusBar: {
    height: 28,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timeDot: {
    width: 17,
    height: 5,
    borderRadius: 999,
    backgroundColor: '#001C1C',
    opacity: 0.72,
  },
  statusPills: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  statusPill: {
    width: 5,
    height: 5,
    borderRadius: 999,
    backgroundColor: '#001C1C',
    opacity: 0.72,
  },
  shortPill: {
    width: 8,
  },
  battery: {
    width: 13,
    height: 6,
    borderRadius: 2,
    backgroundColor: '#001C1C',
    opacity: 0.72,
  },
  indicatorWrap: {
    position: 'absolute',
    bottom: 8,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
});
