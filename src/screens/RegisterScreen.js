import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

export default function RegisterScreen({ navigation }) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    username: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateStep1 = () => {
    if (!formData.firstName || !formData.lastName) {
      Alert.alert('Error', 'Please enter your full name');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!formData.email || !formData.phone || !formData.username) {
      Alert.alert('Error', 'Please enter email, phone number, and username');
      return false;
    }
    if (!/^[a-zA-Z0-9_]{3,30}$/.test(formData.username)) {
      Alert.alert('Error', 'Username must be 3-30 characters using only letters, numbers, and underscores');
      return false;
    }
    return true;
  };

  const validateStep3 = () => {
    if (!formData.password || formData.password.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) setStep(2);
    else if (step === 2 && validateStep2()) setStep(3);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
    else navigation.goBack();
  };

  const handleRegister = async () => {
    if (!validateStep3()) return;

    setLoading(true);
    const result = await register({
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      phone: formData.phone,
      username: formData.username,
      password: formData.password,
    });
    setLoading(false);

    if (result.success) {
      Alert.alert(
        'Wallet Created!',
        'IMPORTANT: Save your seed phrase in the Wallet > Keys section. This is the only way to recover your wallet.',
        [{ text: 'OK' }]
      );
    } else {
      Alert.alert('Registration Failed', result.error);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>What's your name?</Text>
            <View style={styles.inputContainer}>
              <Icon name="account" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="First Name"
                placeholderTextColor="#666"
                value={formData.firstName}
                onChangeText={(text) => updateField('firstName', text)}
              />
            </View>
            <View style={styles.inputContainer}>
              <Icon name="account" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Last Name"
                placeholderTextColor="#666"
                value={formData.lastName}
                onChangeText={(text) => updateField('lastName', text)}
              />
            </View>
          </View>
        );
      case 2:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Contact Information</Text>
            <View style={styles.inputContainer}>
              <Icon name="email" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="#666"
                value={formData.email}
                onChangeText={(text) => updateField('email', text)}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
            <View style={styles.inputContainer}>
              <Icon name="phone" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Phone Number"
                placeholderTextColor="#666"
                value={formData.phone}
                onChangeText={(text) => updateField('phone', text)}
                keyboardType="phone-pad"
              />
            </View>
            <View style={styles.inputContainer}>
              <Icon name="at" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Username"
                placeholderTextColor="#666"
                value={formData.username}
                onChangeText={(text) => updateField('username', text.replace(/[^a-zA-Z0-9_]/g, ''))}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>
        );
      case 3:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Create Password</Text>
            <View style={styles.inputContainer}>
              <Icon name="lock" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Password (min 8 characters)"
                placeholderTextColor="#666"
                value={formData.password}
                onChangeText={(text) => updateField('password', text)}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Icon
                  name={showPassword ? 'eye-off' : 'eye'}
                  size={20}
                  color="#666"
                />
              </TouchableOpacity>
            </View>
            <View style={styles.inputContainer}>
              <Icon name="lock-check" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Confirm Password"
                placeholderTextColor="#666"
                value={formData.confirmPassword}
                onChangeText={(text) => updateField('confirmPassword', text)}
                secureTextEntry={!showPassword}
              />
            </View>
            <Text style={styles.warningText}>
              ⚠️ You will receive a 12-word seed phrase. Write it down and store it safely. Never share it with anyone.
            </Text>
          </View>
        );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Header */}
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Icon name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>

        {/* Progress */}
        <View style={styles.progressContainer}>
          {[1, 2, 3].map((s) => (
            <View
              key={s}
              style={[
                styles.progressDot,
                s <= step && styles.progressDotActive,
              ]}
            />
          ))}
        </View>

        <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
          {renderStep()}
        </ScrollView>

        {/* Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={step === 3 ? handleRegister : handleNext}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading
                ? 'Creating Wallet...'
                : step === 3
                ? 'Create Wallet'
                : 'Continue'}
            </Text>
            {!loading && step !== 3 && (
              <Icon name="arrow-right" size={20} color="#0a0a0a" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  keyboardView: {
    flex: 1,
  },
  backButton: {
    padding: 20,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 20,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#333',
  },
  progressDotActive: {
    backgroundColor: '#FFB800',
    width: 24,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  stepContent: {
    gap: 16,
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 24,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
  },
  warningText: {
    color: '#FFB800',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 16,
    padding: 16,
    backgroundColor: 'rgba(255, 184, 0, 0.1)',
    borderRadius: 12,
  },
  footer: {
    padding: 20,
  },
  button: {
    backgroundColor: '#FFB800',
    borderRadius: 12,
    height: 56,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0a0a0a',
  },
});

