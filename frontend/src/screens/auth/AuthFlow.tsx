import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  PhoneAuthScreen,
  SuccessAuthScreen,
  VerificationAuthScreen,
  WelcomeAuthScreen,
} from './AuthScreens';
import { maskPhone } from './maskPhone';
import { AuthStep } from './types';
import { API_BASE_URL } from '../../config/api';
import * as SecureStore from 'expo-secure-store';

interface AuthFlowProps {
  onAuthSuccess: () => void;
}

export default function AuthFlow({ onAuthSuccess }: AuthFlowProps) {
  const [step, setStep] = useState<AuthStep>('welcome');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState<string[]>(Array(6).fill(''));
  const [loading, setLoading] = useState(false);

  const goToPhone = () => setStep('phone');
  const goToVerification = () => setStep('verification');
  const goToSuccess = () => setStep('success');
  const goToWelcome = () => setStep('welcome');

  const handleCodeChange = (value: string, index: number) => {
    setCode((current) => {
      const next = [...current];
      next[index] = value;
      return next;
    });
  };

  const resetFlow = () => {
    setPhone('');
    setCode(Array(6).fill(''));
    setStep('welcome');
  };

  const sendSMSCode = async () => {
    if (!phone || phone.length < 10) {
      Alert.alert('Error', 'Please enter a valid phone number');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/sms/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone_number: phone }),
      });

      if (!response.ok) {
        throw new Error('Failed to send SMS code');
      }

      goToVerification();
    } catch (error) {
      Alert.alert('Error', 'Failed to send verification code. Please try again.');
      console.error('SMS send error:', error);
    } finally {
      setLoading(false);
    }
  };

  const verifySMSCode = async () => {
    const codeString = code.join('');
    if (codeString.length !== 6) {
      Alert.alert('Error', 'Please enter the complete 6-digit code');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/sms/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone_number: phone,
          code: codeString,
        }),
      });

      if (!response.ok) {
        throw new Error('Invalid verification code');
      }

      const data = await response.json();
      
      // Store the token
      await SecureStore.setItemAsync('auth_token', data.access_token);
      await SecureStore.setItemAsync('user_phone', phone);
      
      goToSuccess();
    } catch (error) {
      Alert.alert('Error', 'Invalid verification code. Please try again.');
      console.error('SMS verify error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAuthComplete = () => {
    onAuthSuccess();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {step === 'welcome' && <WelcomeAuthScreen size="full" onSignUp={goToPhone} />}

        {step === 'phone' && (
          <PhoneAuthScreen
            size="full"
            phone={phone}
            onPhoneChange={setPhone}
            onVerify={sendSMSCode}
            onBack={goToWelcome}
          />
        )}

        {step === 'verification' && (
          <VerificationAuthScreen
            size="full"
            maskedPhone={maskPhone(phone)}
            code={code}
            onCodeChange={handleCodeChange}
            onVerify={verifySMSCode}
            onBack={goToPhone}
          />
        )}

        {step === 'success' && (
          <SuccessAuthScreen
            size="full"
            onOk={handleAuthComplete}
            onBack={goToVerification}
          />
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
