import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import client from '../api/client';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Register'>;
};

export default function RegisterScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmError, setConfirmError] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);

  const validate = () => {
    let isValid = true;
    setEmailError('');
    setPasswordError('');
    setConfirmError('');

    if (!email.includes('@') || !email.includes('.')) {
      setEmailError('Please enter a valid email address.');
      isValid = false;
    }
    if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters.');
      isValid = false;
    }
    if (password !== confirmPassword) {
      setConfirmError('Passwords do not match.');
      isValid = false;
    }

    return isValid;
  };

  const handleRegister = async () => {
    if (!validate()) return;

    setIsLoading(true);
    try {
      await client.post('/register', { email, password });
      navigation.replace('VerifyOTP', { email });
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || 'Registration failed. Please check your connection.';
      Alert.alert('Registration Error', errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container}>
          <Text style={styles.title}>Welcome</Text>
          <Text style={styles.subtitle}>Enter your email and password. We'll send the OTP to your email.</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={[styles.input, emailError ? styles.inputError : null]}
              placeholder="you@example.com"
              placeholderTextColor="#94A3B8"
              value={email}
              onChangeText={(text) => { setEmail(text); if (emailError) setEmailError(''); }}
              autoCapitalize="none"
              keyboardType="email-address"
              editable={!isLoading}
            />
            {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={[styles.input, passwordError ? styles.inputError : null]}
              placeholder="At least 6 characters"
              placeholderTextColor="#94A3B8"
              value={password}
              onChangeText={(text) => { setPassword(text); if (passwordError) setPasswordError(''); }}
              secureTextEntry
              editable={!isLoading}
            />
            {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Confirm Password</Text>
            <TextInput
              style={[styles.input, confirmError ? styles.inputError : null]}
              placeholder="Re-enter password"
              placeholderTextColor="#94A3B8"
              value={confirmPassword}
              onChangeText={(text) => { setConfirmPassword(text); if (confirmError) setConfirmError(''); }}
              secureTextEntry
              editable={!isLoading}
            />
            {confirmError ? <Text style={styles.errorText}>{confirmError}</Text> : null}
          </View>

          <TouchableOpacity 
            style={[styles.button, isLoading && styles.buttonDisabled]} 
            onPress={handleRegister}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Get OTP</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.linkButton} 
            onPress={() => navigation.navigate('Login')}
            disabled={isLoading}
          >
            <Text style={styles.linkText}>Already registered? Log in</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  container: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
    backgroundColor: '#F8F9FA',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748B',
    marginBottom: 32,
  },
  inputGroup: {
    marginBottom: 20,
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
    fontSize: 16,
    backgroundColor: '#FFFFFF',
    color: '#1E293B',
  },
  inputError: {
    borderColor: '#EF4444',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  button: {
    backgroundColor: '#6B8E7B',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity:-0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  linkButton: {
    alignItems: 'center',
    marginTop: 20,
  },
  linkText: {
    color: '#6B8E7B',
    fontSize: 14,
    fontWeight: '500',
  },
});