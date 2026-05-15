import React, { useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
  Switch,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';

export default function SecuritySettingsScreen({ navigation }) {
  const { user, changePin, verifyPin } = useAuthStore();
  
  const [showChangePinModal, setShowChangePinModal] = useState(false);
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinStep, setPinStep] = useState(1); // 1: current, 2: new, 3: confirm
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [transactionConfirmEnabled, setTransactionConfirmEnabled] = useState(true);
  const [autoLockEnabled, setAutoLockEnabled] = useState(true);

  const handleChangePin = async () => {
    if (pinStep === 1) {
      if (currentPin.length !== 6) {
        Alert.alert('Error', 'Please enter your current 6-digit PIN');
        return;
      }
      setIsProcessing(true);
      try {
        const isValid = await verifyPin(currentPin);
        if (isValid) {
          setPinStep(2);
        } else {
          Alert.alert('Error', 'Invalid PIN');
          setCurrentPin('');
        }
      } catch (error) {
        Alert.alert('Error', 'Failed to verify PIN');
      } finally {
        setIsProcessing(false);
      }
    } else if (pinStep === 2) {
      if (newPin.length !== 6) {
        Alert.alert('Error', 'PIN must be 6 digits');
        return;
      }
      if (newPin === currentPin) {
        Alert.alert('Error', 'New PIN must be different from current PIN');
        return;
      }
      setPinStep(3);
    } else if (pinStep === 3) {
      if (newPin !== confirmPin) {
        Alert.alert('Error', 'PINs do not match');
        setConfirmPin('');
        return;
      }
      
      setIsProcessing(true);
      try {
        const result = await changePin(currentPin, newPin);
        if (result.success) {
          Alert.alert(
            'Success',
            'Your PIN has been changed successfully',
            [{ text: 'OK', onPress: closePinModal }]
          );
        } else {
          Alert.alert('Error', result.message || 'Failed to change PIN');
        }
      } catch (error) {
        Alert.alert('Error', 'Failed to change PIN');
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const closePinModal = () => {
    setShowChangePinModal(false);
    setPinStep(1);
    setCurrentPin('');
    setNewPin('');
    setConfirmPin('');
  };

  const getPinStepTitle = () => {
    switch (pinStep) {
      case 1: return 'Enter Current PIN';
      case 2: return 'Enter New PIN';
      case 3: return 'Confirm New PIN';
      default: return '';
    }
  };

  const getPinStepSubtitle = () => {
    switch (pinStep) {
      case 1: return 'Please enter your current 6-digit PIN';
      case 2: return 'Create a new 6-digit PIN';
      case 3: return 'Re-enter your new PIN to confirm';
      default: return '';
    }
  };

  const getPinValue = () => {
    switch (pinStep) {
      case 1: return currentPin;
      case 2: return newPin;
      case 3: return confirmPin;
      default: return '';
    }
  };

  const setPinValue = (value) => {
    switch (pinStep) {
      case 1: setCurrentPin(value); break;
      case 2: setNewPin(value); break;
      case 3: setConfirmPin(value); break;
    }
  };

  const SECURITY_OPTIONS = [
    {
      id: 'changePin',
      icon: 'keypad-outline',
      title: 'Change PIN',
      subtitle: 'Update your 6-digit PIN',
      color: '#f59e0b',
      action: () => setShowChangePinModal(true),
    },
    {
      id: 'biometric',
      icon: 'finger-print-outline',
      title: 'Biometric Authentication',
      subtitle: 'Use Face ID or fingerprint',
      color: '#22c55e',
      toggle: true,
      value: biometricEnabled,
      onToggle: setBiometricEnabled,
    },
    {
      id: 'transactionConfirm',
      icon: 'shield-checkmark-outline',
      title: 'Transaction Confirmation',
      subtitle: 'Require PIN for all transactions',
      color: '#3b82f6',
      toggle: true,
      value: transactionConfirmEnabled,
      onToggle: setTransactionConfirmEnabled,
    },
    {
      id: 'autoLock',
      icon: 'lock-closed-outline',
      title: 'Auto-Lock',
      subtitle: 'Lock app after 5 minutes',
      color: '#8b5cf6',
      toggle: true,
      value: autoLockEnabled,
      onToggle: setAutoLockEnabled,
    },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#0a0a0f', '#1a1a2e']} style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Security</Text>
        <View style={styles.placeholder} />
      </LinearGradient>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Security Status */}
        <View style={styles.statusCard}>
          <View style={styles.statusIcon}>
            <Ionicons name="shield-checkmark" size={32} color="#22c55e" />
          </View>
          <View style={styles.statusText}>
            <Text style={styles.statusTitle}>Your account is secure</Text>
            <Text style={styles.statusSubtitle}>
              PIN enabled • Last changed 30 days ago
            </Text>
          </View>
        </View>

        {/* Security Options */}
        <Text style={styles.sectionTitle}>Security Settings</Text>
        <View style={styles.optionsContainer}>
          {SECURITY_OPTIONS.map((option) => (
            option.toggle ? (
              <View key={option.id} style={styles.optionRow}>
                <View style={[styles.optionIcon, { backgroundColor: `${option.color}20` }]}>

                    <Ionicons name={option.icon} size={22} color={option.color} />
                  </View>
                  <View style={styles.optionText}>
                    <Text style={styles.optionTitle}>{option.title}</Text>
                    <Text style={styles.optionSubtitle}>{option.subtitle}</Text>
                  </View>
                  <Switch
                    value={option.value}
                    onValueChange={option.onToggle}
                    trackColor={{ false: '#333', true: option.color }}
                    thumbColor="#fff"
                  />
                </View>
              ) : (
                <TouchableOpacity key={option.id} style={styles.optionRow} onPress={option.action}>
                  <View style={[styles.optionIcon, { backgroundColor: `${option.color}20` }]}> 
                    <Ionicons name={option.icon} size={22} color={option.color} />
                  </View>
                  <View style={styles.optionText}>
                    <Text style={styles.optionTitle}>{option.title}</Text>
                    <Text style={styles.optionSubtitle}>{option.subtitle}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#666" />
                </TouchableOpacity>
              )
          ))}
        </View>

        {/* Security Tips */}
        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>Security Tips</Text>
          {[
            'Never share your PIN with anyone',
            'Use a unique PIN not used elsewhere',
            'Enable biometric for extra security',
            'Regularly review your transaction history',
          ].map((tip, index) => (
            <View key={index} style={styles.tipRow}>
              <Ionicons name="checkmark-circle" size={14} color="#22c55e" />
              <Text style={styles.tipText}>{tip}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Change PIN Modal */}
      <Modal
        visible={showChangePinModal}
        transparent
        animationType="slide"
        onRequestClose={closePinModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity style={styles.modalClose} onPress={closePinModal}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>

            <Ionicons name="lock-closed" size={48} color="#f59e0b" />
            <Text style={styles.modalTitle}>{getPinStepTitle()}</Text>
            <Text style={styles.modalSubtitle}>{getPinStepSubtitle()}</Text>

            <TextInput
              style={styles.pinInput}
              value={getPinValue()}
              onChangeText={setPinValue}
              keyboardType="number-pad"
              maxLength={6}
              secureTextEntry
              placeholder="------"
              placeholderTextColor="#444"
              textAlign="center"
              autoFocus
            />

            {/* PIN Dots */}
            <View style={styles.pinDots}>
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <View
                  key={i}
                  style={[
                    styles.pinDot,
                    getPinValue().length > i && styles.pinDotFilled,
                  ]}
                />
              ))}
            </View>

            <TouchableOpacity
              style={styles.modalButton}
              onPress={handleChangePin}
              disabled={isProcessing || getPinValue().length !== 6}
            >
              {isProcessing ? (
                <ActivityIndicator size="small" color="#0a0a0f" />
              ) : (
                <Text style={styles.modalButtonText}>
                  {pinStep === 3 ? 'Confirm' : 'Continue'}
                </Text>
              )}
            </TouchableOpacity>

            {pinStep > 1 && (
              <TouchableOpacity
                style={styles.backStepButton}
                onPress={() => setPinStep(pinStep - 1)}
              >
                <Text style={styles.backStepText}>Back</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0f',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#222',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    flexGrow: 1,
    paddingBottom: 120,
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#22c55e20',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  statusIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#22c55e30',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusText: {
    marginLeft: 12,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#22c55e',
  },
  statusSubtitle: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  optionsContainer: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 20,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionText: {
    flex: 1,
    marginLeft: 12,
  },
  optionTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#fff',
  },
  optionSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  tipsCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  tipText: {
    fontSize: 13,
    color: '#888',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#1a1a2e',
    borderRadius: 20,
    padding: 32,
    width: '100%',
    alignItems: 'center',
  },
  modalClose: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 16,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#888',
    marginTop: 8,
    textAlign: 'center',
  },
  pinInput: {
    position: 'absolute',
    opacity: 0,
    width: 1,
    height: 1,
  },
  pinDots: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  pinDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#444',
  },
  pinDotFilled: {
    backgroundColor: '#f59e0b',
    borderColor: '#f59e0b',
  },
  modalButton: {
    width: '100%',
    backgroundColor: '#f59e0b',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 32,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#0a0a0f',
    fontSize: 16,
    fontWeight: '600',
  },
  backStepButton: {
    marginTop: 16,
    paddingVertical: 8,
  },
  backStepText: {
    color: '#888',
    fontSize: 14,
  },
});
