import React, { useState, useRef } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Alert, View } from 'react-native';
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
import { validatePhoneNumber } from '../../config/yolla';

interface AuthFlowProps {
  onAuthSuccess: () => void;
}

const normalizePhoneNumber = (value: string) => {
  const digits = value.replace(/\D/g, '');
  if (!digits) return value.trim();

  if (digits.startsWith('256')) {
    return digits;
  }

  if (digits.startsWith('0')) {
    return `256${digits.slice(1)}`;
  }

  if (digits.startsWith('7') || digits.startsWith('8')) {
    return `256${digits}`;
  }

  return digits;
};

export default function AuthFlow({ onAuthSuccess }: AuthFlowProps) {
  const [step, setStep] = useState<AuthStep>('welcome');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState<string[]>(Array(6).fill(''));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    const normalizedPhone = normalizePhoneNumber(phone);
    
    // Validate phone number
    if (!validatePhoneNumber(normalizedPhone)) {
      Alert.alert('Error', 'Please enter a valid phone number');
      return;
    }
    
    // Auto-advance when 10 digits reached
    if (normalizedPhone.replace(/\D/g, '').length >= 10) {
      setPhone(normalizedPhone);
      setLoading(true);
      setError(null);
      try {
        // Call backend to send OTP via YoolaSMS
        const response = await fetch(`${API_BASE_URL}/api/v1/auth/sms/send`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            phone_number: normalizedPhone,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ detail: 'Failed to send verification code' }));
          throw new Error(errorData.detail || 'Failed to send verification code');
        }

        goToVerification();
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to send verification code. Please try again.';
        Alert.alert('Error', errorMessage);
        console.error('SMS send error:', error);
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    }
  };

  const verifySMSCode = async () => {
    const codeString = code.join('');
    
    // Auto-verify when 6 digits entered
    if (codeString.length === 6) {
      setLoading(true);
      setError(null);
      try {
        // Call backend to verify OTP and get JWT
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
          const errorData = await response.json().catch(() => ({ detail: 'Invalid verification code' }));
          throw new Error(errorData.detail || 'Invalid verification code');
        }

        const data = await response.json();
        
        // Store auth token and phone number
        await SecureStore.setItemAsync('auth_token', data.access_token);
        await SecureStore.setItemAsync('user_phone', phone);
        
        goToSuccess();
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Invalid verification code. Please try again.';
        Alert.alert('Error', errorMessage);
        console.error('SMS verify error:', error);
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
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
            loading={loading}
            error={error}
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
            loading={loading}
            error={error}
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
