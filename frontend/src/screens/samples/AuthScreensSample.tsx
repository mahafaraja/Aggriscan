import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { PhoneFrame } from '../../components';
import {
  PhoneAuthScreen,
  SuccessAuthScreen,
  VerificationAuthScreen,
  WelcomeAuthScreen,
} from '../auth/AuthScreens';
import { AuthStep } from '../auth/types';

const screens: Array<{ title: string; kind: AuthStep }> = [
  { title: 'WELCOME PAGE', kind: 'welcome' },
  { title: 'count main', kind: 'phone' },
  { title: 'FORGOT PASSWORD 1', kind: 'verification' },
  { title: 'LOGIN', kind: 'success' },
];

export default function AuthScreensSample() {
  return (
    <ScrollView
      horizontal
      contentContainerStyle={styles.gallery}
      showsHorizontalScrollIndicator={false}
    >
      {screens.map((screen) => (
        <View key={screen.kind} style={styles.sample}>
          <Text style={styles.sampleTitle}>{screen.title}</Text>
          <PhoneFrame>
            <AuthScreenPreview kind={screen.kind} />
          </PhoneFrame>
        </View>
      ))}
    </ScrollView>
  );
}

function AuthScreenPreview({ kind }: { kind: AuthStep }) {
  switch (kind) {
    case 'welcome':
      return <WelcomeAuthScreen size="preview" />;
    case 'phone':
      return <PhoneAuthScreen size="preview" />;
    case 'verification':
      return <VerificationAuthScreen size="preview" />;
    case 'success':
      return <SuccessAuthScreen size="preview" />;
  }
}

const styles = StyleSheet.create({
  gallery: {
    minHeight: '100%',
    alignItems: 'center',
    gap: 78,
    paddingHorizontal: 30,
    paddingVertical: 26,
    backgroundColor: '#202020',
  },
  sample: {
    gap: 14,
  },
  sampleTitle: {
    color: '#7F7F7F',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0,
  },
});
