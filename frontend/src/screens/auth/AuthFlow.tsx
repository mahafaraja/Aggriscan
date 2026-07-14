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
import { FirebaseRecaptchaVerifierModal } from 'expo-firebase-recaptcha';
import firebaseConfig from '../../config/firebase';
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, signInWithPhoneNumber } from 'firebase/auth';

interface AuthFlowProps {
  onAuthSuccess: () => void;
}

const normalizePhoneNumber = (value: string) => {
  const digits = value.replace(/\D/g, '');
  if (!digits) return value.trim();

  if (digits.startsWith('256')) {
    return `+${digits}`;
  }

  if (digits.startsWith('0')) {
    return `+256${digits.slice(1)}`;
  }

  if (digits.startsWith('7')) {
    return `+256${digits}`;
  }

  return value.startsWith('+') ? value : `+${digits}`;
};

export default function AuthFlow({ onAuthSuccess }: AuthFlowProps) {
  const recaptchaVerifier = useRef<any>(null);
  const confirmationResultRef = useRef<any>(null);

  // Initialize firebase app/auth when possible
  if (typeof window !== 'undefined' && !getApps().length) {
    try {
      initializeApp(firebaseConfig);
    } catch (e) {
      // ignore init errors if already initialized
    }
  }
  const firebaseAuth = getAuth();
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
    const normalizedPhone = normalizePhoneNumber(phone);
    
    // Auto-advance when 10 digits reached
    if (normalizedPhone.replace(/\D/g, '').length >= 10) {
      setPhone(normalizedPhone);
      setLoading(true);
      try {
        // Use Firebase client SDK to send SMS (handles reCAPTCHA via the verifier modal)
        try {
          const confirmation = await signInWithPhoneNumber(firebaseAuth, normalizedPhone, recaptchaVerifier.current);
          confirmationResultRef.current = confirmation;
          goToVerification();
        } catch (err) {
          console.error('Firebase send SMS error:', err);
          throw new Error('Failed to send SMS code');
        }
      } catch (error) {
        Alert.alert('Error', 'Failed to send verification code. Please try again.');
        console.error('SMS send error:', error);
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
      try {
        if (!confirmationResultRef.current) throw new Error('No confirmation result available');
        const userCredential = await confirmationResultRef.current.confirm(codeString);
        const idToken = await userCredential.user.getIdToken();

        // Exchange Firebase ID token for backend JWT
        const resp = await fetch(`${API_BASE_URL}/api/v1/auth/firebase/verify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id_token: idToken }),
        });

        if (!resp.ok) {
          throw new Error('Backend verification failed');
        }

        const data = await resp.json();
        await SecureStore.setItemAsync('auth_token', data.access_token);
        await SecureStore.setItemAsync('user_phone', userCredential.user.phoneNumber || normalizePhoneNumber(phone));

        goToSuccess();
      } catch (error) {
        Alert.alert('Error', 'Invalid verification code. Please try again.');
        console.error('SMS verify error:', error);
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
        {/* Invisible reCAPTCHA modal (expo-firebase-recaptcha) */}
        <FirebaseRecaptchaVerifierModal
          ref={recaptchaVerifier}
          firebaseConfig={firebaseConfig}
        />
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
