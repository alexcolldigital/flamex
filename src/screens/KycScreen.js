import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useAuthStore } from '../store/authStore';

const steps = ['bvn', 'nin', 'document', 'selfie', 'review'];

export default function KycScreen({ navigation }) {
  const submitKyc = useAuthStore((state) => state.submitKyc);
  const [currentStep, setCurrentStep] = useState(0);
  const [bvn, setBvn] = useState('');
  const [nin, setNin] = useState('');
  const [loading, setLoading] = useState(false);

  const validateBVN = () => {
    if (bvn.length !== 11) {
      Alert.alert('Error', 'Please enter a valid 11-digit BVN');
      return false;
    }
    return true;
  };

  const validateNIN = () => {
    if (nin.length !== 11) {
      Alert.alert('Error', 'Please enter a valid 11-digit NIN');
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (currentStep === 0 && !validateBVN()) return;
    if (currentStep === 1 && !validateNIN()) return;
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      submitKYC();
    }
  };

  const submitKYC = async () => {
    setLoading(true);
    try {
      const result = await submitKyc({ bvn, nin });
      if (!result.success) {
        throw new Error(result.error);
      }
      Alert.alert(
        'Success',
        result.kycVerified
          ? 'KYC verified successfully. Your account is ready for higher limits.'
          : 'KYC submitted successfully. We will notify you as soon as it is fully reviewed.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      Alert.alert('Error', error.message || error.response?.data?.message || 'KYC submission failed');
    }
    setLoading(false);
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <View style={styles.stepContent}>
            <View style={styles.stepIcon}>
              <Icon name="card-account-details" size={40} color="#FFB800" />
            </View>
            <Text style={styles.stepTitle}>Enter Your BVN</Text>
            <Text style={styles.stepDesc}>
              Your 11-digit Bank Verification Number is required for identity verification.
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Enter 11-digit BVN"
              placeholderTextColor="#666"
              value={bvn}
              onChangeText={(text) => setBvn(text.replace(/\D/g, '').slice(0, 11))}
              keyboardType="number-pad"
              maxLength={11}
            />
          </View>
        );
      case 1:
        return (
          <View style={styles.stepContent}>
            <View style={styles.stepIcon}>
              <Icon name="account-card" size={40} color="#FFB800" />
            </View>
            <Text style={styles.stepTitle}>Enter Your NIN</Text>
            <Text style={styles.stepDesc}>
              Your 11-digit National Identity Number helps verify your identity.
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Enter 11-digit NIN"
              placeholderTextColor="#666"
              value={nin}
              onChangeText={(text) => setNin(text.replace(/\D/g, '').slice(0, 11))}
              keyboardType="number-pad"
              maxLength={11}
            />
          </View>
        );
      case 2:
        return (
          <View style={styles.stepContent}>
            <View style={styles.stepIcon}>
              <Icon name="file-document" size={40} color="#FFB800" />
            </View>
            <Text style={styles.stepTitle}>Upload Documents</Text>
            <Text style={styles.stepDesc}>
              Please upload a valid government-issued ID (Passport, Driver's License, or Voter's Card).
            </Text>
            <TouchableOpacity style={styles.uploadButton}>
              <Icon name="camera" size={24} color="#fff" />
              <Text style={styles.uploadText}>Take Photo of ID</Text>
            </TouchableOpacity>
          </View>
        );
      case 3:
        return (
          <View style={styles.stepContent}>
            <View style={styles.stepIcon}>
              <Icon name="camera-face" size={40} color="#FFB800" />
            </View>
            <Text style={styles.stepTitle}>Selfie Verification</Text>
            <Text style={styles.stepDesc}>
              Take a clear selfie for face verification. Make sure your face is well-lit and visible.
            </Text>
            <TouchableOpacity style={styles.uploadButton}>
              <Icon name="camera" size={24} color="#fff" />
              <Text style={styles.uploadText}>Take Selfie</Text>
            </TouchableOpacity>
          </View>
        );
      case 4:
        return (
          <View style={styles.stepContent}>
            <View style={styles.stepIcon}>
              <Icon name="check-circle" size={40} color="#4CAF50" />
            </View>
            <Text style={styles.stepTitle}>Review & Submit</Text>
            <Text style={styles.stepDesc}>
              Please review your information before submitting.
            </Text>
            <View style={styles.reviewBox}>
              <View style={styles.reviewRow}>
                <Text style={styles.reviewLabel}>BVN</Text>
                <Text style={styles.reviewValue}>{bvn.replace(/(\d{3})(?=\d)/g, '$1 ')}</Text>
              </View>
              <View style={styles.reviewRow}>
                <Text style={styles.reviewLabel}>NIN</Text>
                <Text style={styles.reviewValue}>{nin.replace(/(\d{3})(?=\d)/g, '$1 ')}</Text>
              </View>
            </View>
          </View>
        );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Progress */}
      <View style={styles.progressContainer}>
        {steps.map((_, index) => (
          <View
            key={index}
            style={[
              styles.progressDot,
              index <= currentStep && styles.progressDotActive,
            ]}
          />
        ))}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderStep()}
      </ScrollView>

      {/* Buttons */}
      <View style={styles.footer}>
        {currentStep > 0 && (
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setCurrentStep(currentStep - 1)}
          >
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.nextButton, loading && styles.nextButtonDisabled]}
          onPress={handleNext}
          disabled={loading}
        >
          <Text style={styles.nextButtonText}>
            {loading
              ? 'Processing...'
              : currentStep === steps.length - 1
              ? 'Submit'
              : 'Continue'}
          </Text>
          {!loading && currentStep < steps.length - 1 && (
            <Icon name="arrow-right" size={20} color="#0a0a0a" />
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    padding: 20,
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
    alignItems: 'center',
    paddingTop: 40,
  },
  stepIcon: {
    width: 80,
    height: 80,
    backgroundColor: 'rgba(255, 184, 0, 0.1)',
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  stepDesc: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  input: {
    width: '100%',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
    letterSpacing: 2,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 20,
    gap: 12,
  },
  uploadText: {
    fontSize: 16,
    color: '#fff',
  },
  reviewBox: {
    width: '100%',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 20,
  },
  reviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  reviewLabel: {
    fontSize: 14,
    color: '#999',
  },
  reviewValue: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  backButton: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  nextButton: {
    flex: 2,
    flexDirection: 'row',
    backgroundColor: '#FFB800',
    borderRadius: 12,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  nextButtonDisabled: {
    opacity: 0.7,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0a0a0a',
  },
});

