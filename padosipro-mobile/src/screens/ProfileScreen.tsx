import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import client from '../api/client';

type Props = NativeStackScreenProps<RootStackParamList, 'Profile'>;

export default function ProfileScreen({ navigation }: Props) {
  const [name, setName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('+91');
  const [address, setAddress] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSaveProfile = async () => {
    const mobileRegex = /^\+91\d{10}$/;
    if (!mobileRegex.test(mobileNumber)) {
      Alert.alert('Invalid Mobile Number', 'Mobile number must be strictly +91 followed by 10 digits.');
      return;
    }

    if (!name.trim() || !address.trim()) {
      Alert.alert('Missing Fields', 'Please enter your full name and address.');
      return;
    }

    setIsLoading(true);
    try {
      await client.put('/profile', {
        name,
        mobileNumber,
        address,
        businessName: businessName || undefined,
      });

      navigation.replace('TaskSelection');
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || 'Failed to save profile. Please check your inputs.';
      Alert.alert('Profile Error', errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container}>
          <Text style={styles.locationTag}>Mumbai</Text>
          <Text style={styles.title}>A few details</Text>
          <Text style={styles.subtitle}>So your Lifestyle Manager can coordinate visits and deliveries smoothly.</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full name</Text>
            <TextInput
              style={styles.input}
              placeholder="As you would like us to use"
              placeholderTextColor="#94A3B8"
              value={name}
              onChangeText={setName}
              editable={!isLoading}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Mobile number (+91)</Text>
            <TextInput
              style={styles.input}
              placeholder="+919876543210"
              placeholderTextColor="#94A3B8"
              value={mobileNumber}
              onChangeText={setMobileNumber}
              keyboardType="phone-pad"
              editable={!isLoading}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Address & area</Text>
            <TextInput
              style={styles.input}
              placeholder="Road, area, landmark"
              placeholderTextColor="#94A3B8"
              value={address}
              onChangeText={setAddress}
              editable={!isLoading}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Business name (optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="Your company or shop name"
              placeholderTextColor="#94A3B8"
              value={businessName}
              onChangeText={setBusinessName}
              editable={!isLoading}
            />
          </View>

          <TouchableOpacity 
            style={[styles.button, isLoading && styles.buttonDisabled]} 
            onPress={handleSaveProfile}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Continue</Text>
            )}
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
    backgroundColor: '#F8F9FA',
  },
  locationTag: {
    fontSize: 14,
    fontWeight: '600',
    color: '#D97706',
    marginBottom: 4,
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
    lineHeight: 22,
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
  button: {
    backgroundColor: '#6B8E7B',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
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
});