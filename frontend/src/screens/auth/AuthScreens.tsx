import React from 'react';
import { Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { ArrowLeft2, TickCircle } from 'iconsax-react-native';
import {
  AuthBackground,
  AuthButton,
  AuthTextField,
  BrandLogo,
  CodeInputRow,
} from '../../components';
import { theme } from '../../theme/Index';
import { AuthScreenSize } from './types';

type AuthScreenLayoutProps = {
  size: AuthScreenSize;
  showBack?: boolean;
  onBack?: () => void;
  children: React.ReactNode;
  contentStyle?: ViewStyle;
};

export function AuthScreenLayout({
  size,
  showBack = false,
  onBack,
  children,
  contentStyle,
}: AuthScreenLayoutProps) {
  const styles = size === 'preview' ? previewStyles : fullStyles;

  return (
    <AuthBackground>
      {showBack && (
        <Pressable
          accessibilityRole="button"
          onPress={onBack}
          style={styles.backButton}
        >
          <ArrowLeft2
            size={size === 'preview' ? 14 : 22}
            color="#001C1C"
            variant="Linear"
          />
        </Pressable>
      )}

      <View style={[styles.logoWrap, contentStyle]}>{children}</View>
    </AuthBackground>
  );
}

type WelcomeScreenProps = {
  size: AuthScreenSize;
  onSignUp?: () => void;
};

export function WelcomeAuthScreen({ size, onSignUp }: WelcomeScreenProps) {
  const styles = size === 'preview' ? previewStyles : fullStyles;

  return (
    <AuthScreenLayout size={size} contentStyle={styles.welcomeContent}>
      <BrandLogo style={styles.welcomeLogo} />
      <View style={styles.bottomAction}>
        <AuthButton label="Sign up" onPress={onSignUp} textStyle={styles.buttonText} />
      </View>
    </AuthScreenLayout>
  );
}

type PhoneScreenProps = {
  size: AuthScreenSize;
  phone?: string;
  onPhoneChange?: (value: string) => void;
  onVerify?: () => void;
  onBack?: () => void;
};

export function PhoneAuthScreen({
  size,
  phone = '',
  onPhoneChange,
  onVerify,
  onBack,
}: PhoneScreenProps) {
  const styles = size === 'preview' ? previewStyles : fullStyles;

  return (
    <AuthScreenLayout size={size} showBack onBack={onBack}>
      <BrandLogo style={styles.logo} />
      <View style={styles.formBlock}>
        <Text style={styles.heading}>New to agriscan ?</Text>
        <Text style={styles.helper}>Please enter your phone number to sign in</Text>
        <AuthTextField
          label="Your number"
          placeholder="Enter your number"
          value={phone}
          onChangeText={onPhoneChange}
          keyboardType="phone-pad"
          style={styles.input}
        />
        <AuthButton
          label="verify"
          onPress={onVerify}
          style={styles.formButton}
          textStyle={styles.buttonText}
        />
      </View>
    </AuthScreenLayout>
  );
}

type VerificationScreenProps = {
  size: AuthScreenSize;
  maskedPhone?: string;
  code?: string[];
  onCodeChange?: (value: string, index: number) => void;
  onVerify?: () => void;
  onBack?: () => void;
};

export function VerificationAuthScreen({
  size,
  maskedPhone = '07**********',
  code = [],
  onCodeChange,
  onVerify,
  onBack,
}: VerificationScreenProps) {
  const styles = size === 'preview' ? previewStyles : fullStyles;

  return (
    <AuthScreenLayout size={size} showBack onBack={onBack}>
      <BrandLogo style={styles.logo} />
      <View style={styles.formBlock}>
        <Text style={styles.heading}>Check your SMS</Text>
        <Text style={styles.mutedCopy}>We sent a reset link to {maskedPhone}</Text>
        <Text style={styles.helper}>enter 6 digit code that mentioned in SMS</Text>
        <View style={styles.codeSpacer}>
          <CodeInputRow values={code} onChangeValue={onCodeChange} />
        </View>
        <AuthButton
          label="verify"
          onPress={onVerify}
          style={styles.formButton}
          textStyle={styles.buttonText}
        />
      </View>
    </AuthScreenLayout>
  );
}

type SuccessScreenProps = {
  size: AuthScreenSize;
  onOk?: () => void;
  onBack?: () => void;
};

export function SuccessAuthScreen({ size, onOk, onBack }: SuccessScreenProps) {
  const styles = size === 'preview' ? previewStyles : fullStyles;

  return (
    <AuthScreenLayout size={size} showBack onBack={onBack}>
      <BrandLogo style={styles.logo} />
      <View style={styles.loginContent}>
        <View style={styles.successToast}>
          <TickCircle
            size={size === 'preview' ? 12 : 18}
            color="#FFFFFF"
            variant="Bold"
          />
          <Text style={styles.toastText}>your verification is successful !</Text>
        </View>
        <AuthButton label="Ok" compact onPress={onOk} textStyle={styles.buttonText} />
      </View>
    </AuthScreenLayout>
  );
}

const previewStyles = StyleSheet.create({
  backButton: {
    position: 'absolute',
    top: 46,
    left: 21,
    zIndex: 2,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoWrap: {
    alignItems: 'center',
    marginTop: 72,
  },
  welcomeContent: {
    marginTop: 82,
    alignItems: 'center',
    flex: 1,
  },
  logo: {
    width: 125,
    height: 92,
  },
  welcomeLogo: {
    width: 145,
    height: 106,
  },
  bottomAction: {
    position: 'absolute',
    left: 35,
    right: 35,
    bottom: 105,
  },
  formBlock: {
    marginTop: 54,
    paddingHorizontal: 14,
    width: '100%',
  },
  heading: {
    color: theme.colors.textOnDark,
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 9,
  },
  helper: {
    color: '#DCECA1',
    fontSize: 8,
    fontWeight: '800',
    marginBottom: 14,
  },
  mutedCopy: {
    color: theme.colors.textOnDark,
    fontSize: 8,
    fontWeight: '700',
    marginBottom: 5,
  },
  codeSpacer: {
    marginTop: 13,
    marginBottom: 45,
  },
  formButton: {
    alignSelf: 'center',
    width: 160,
    marginTop: 40,
  },
  loginContent: {
    marginTop: 135,
    alignItems: 'center',
    gap: 34,
  },
  successToast: {
    minHeight: 25,
    width: 158,
    borderRadius: 5,
    backgroundColor: theme.colors.darkTeal,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingHorizontal: 9,
  },
  toastText: {
    color: theme.colors.textOnDark,
    fontSize: 8,
    fontWeight: '700',
  },
  input: {
    minHeight: 38,
    fontSize: 9,
  },
  buttonText: {
    fontSize: 10,
  },
});

const fullStyles = StyleSheet.create({
  backButton: {
    position: 'absolute',
    top: 56,
    left: 24,
    zIndex: 2,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoWrap: {
    alignItems: 'center',
    marginTop: 96,
    flex: 1,
    width: '100%',
  },
  welcomeContent: {
    marginTop: 120,
    alignItems: 'center',
    flex: 1,
    width: '100%',
  },
  logo: {
    width: 180,
    height: 132,
  },
  welcomeLogo: {
    width: 200,
    height: 146,
  },
  bottomAction: {
    position: 'absolute',
    left: 32,
    right: 32,
    bottom: 64,
  },
  formBlock: {
    marginTop: 48,
    paddingHorizontal: 32,
    width: '100%',
  },
  heading: {
    color: theme.colors.textOnDark,
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 12,
  },
  helper: {
    color: '#DCECA1',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 24,
    lineHeight: 20,
  },
  mutedCopy: {
    color: theme.colors.textOnDark,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },
  codeSpacer: {
    marginTop: 20,
    marginBottom: 32,
    alignItems: 'center',
  },
  formButton: {
    alignSelf: 'center',
    width: 200,
    marginTop: 32,
    minHeight: 48,
  },
  loginContent: {
    marginTop: 80,
    alignItems: 'center',
    gap: 40,
    width: '100%',
    paddingHorizontal: 32,
  },
  successToast: {
    minHeight: 44,
    width: '100%',
    maxWidth: 320,
    borderRadius: 8,
    backgroundColor: theme.colors.darkTeal,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  toastText: {
    color: theme.colors.textOnDark,
    fontSize: 14,
    fontWeight: '700',
  },
  input: {
    minHeight: 52,
    fontSize: 16,
  },
  buttonText: {
    fontSize: 16,
  },
});
