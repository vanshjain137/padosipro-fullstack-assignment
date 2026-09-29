import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import client from '../api/client';

type Props = NativeStackScreenProps<RootStackParamList, 'VerifyOTP'>;

export default function VerifyOTPScreen({ route, navigation }: Props) {
  const { email } = route.params;
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [countdown, setCountdown] = useState(30);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    let timer: any;
    if (countdown > 0) {
      timer = setInterval(() => setCountdown(prev => prev - 1), 1000);
    } else {
      setCanResend(true);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  const handleVerify = async () => {
    if (otp.length !== 6) {
      Alert.alert('Invalid Code', 'Please enter a valid 6-digit verification code.');
      return;
    }

    setIsLoading(true);
    try {
      await client.post('/verify-otp', { email, otp });

      Alert.alert('Success', 'Email verified successfully!', [
        { text: 'OK', onPress: () => navigation.replace('Login') }
      ]);
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || 'Verification failed. Please check the code.';
      Alert.alert('Verification Error', errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend) return;

    try {
      await client.post('/resend-otp', { email });
      Alert.alert('Code Sent', 'A new verification code has been sent to your email.');
      setCountdown(30);
      setCanResend(false);
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || 'Could not resend code. Please try again.';
      Alert.alert('Error', errorMsg);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>&lt; Back</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Enter OTP</Text>
        <Text style={styles.subtitle}>We've sent a code to {email}. It expires in 10 minutes.</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>6-digit code</Text>
          <TextInput
            style={styles.input}
            placeholder="------"
            placeholderTextColor="#94A3B8"
            value={otp}
            onChangeText={setOtp}
            keyboardType="number-pad"
            maxLength={6}
            editable={!isLoading}
          />
        </View>

        <TouchableOpacity
          onPress={handleResend}
          disabled={!canResend}
        >
          <Text style={[styles.resendText, !canResend && styles.resendDisabled]}>
            {canResend ? 'Resend code' : `Resend code in ${countdown}s`}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, (isLoading || otp.length !== 6) && styles.buttonDisabled]}
          onPress={handleVerify}
          disabled={isLoading || otp.length !== 6}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Verify</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#F8F9FA',
  },
  backButton: {
    marginBottom: 24,
  },
  backText: {
    color: '#6B8E7B',
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#64748B',
    marginBottom: 32,
    lineHeight: 22,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#475569',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    padding: 16,
    borderRadius: 12,
    fontSize: 20,
    letterSpacing: 4,
    backgroundColor: '#FFFFFF',
    color: '#1E293B',
  },
  resendText: {
    color: '#6B8E7B',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 32,
  },
  resendDisabled: {
    color: '#94A3B8',
  },
  button: {
    backgroundColor: '#6B8E7B',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    position: 'absolute',
    bottom: 24,
    left: 24,
    right: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});