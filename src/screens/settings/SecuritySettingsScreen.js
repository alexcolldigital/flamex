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
import { useAppTheme } from '../../theme/ThemeProvider';

export default function SecuritySettingsScreen({ navigation }) {
  const { user, changePin, verifyPin } = useAuthStore();
  const { colors } = useAppTheme();
  
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
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient colors={colors.headerGradient} style={styles.header}>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: colors.surface }]}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Security</Text>
        <View style={styles.placeholder} />
      </LinearGradient>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <View style={[styles.statusCard, { backgroundColor: colors.successSoft }]}>
          <View style={[styles.statusIcon, { backgroundColor: `${colors.success}30` }]}>
            <Ionicons name="shield-checkmark" size={32} color={colors.success} />
          </View>
          <View style={styles.statusText}>
            <Text style={[styles.statusTitle, { color: colors.success }]}>Your account is secure</Text>
            <Text style={[styles.statusSubtitle, { color: colors.textMuted }]}>
              PIN enabled • Last changed 30 days ago
            </Text>
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>Security Settings</Text>
        <View style={[styles.optionsContainer, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }]}>
          {SECURITY_OPTIONS.map((option) => (
            option.toggle ? (
              <View key={option.id} style={[styles.optionRow, { borderBottomColor: colors.border }]}>
                <View style={[styles.optionIcon, { backgroundColor: `${option.color}20` }]}>
                  <Ionicons name={option.icon} size={22} color={option.color} />
                </View>
                <View style={styles.optionText}>
                  <Text style={[styles.optionTitle, { color: colors.text }]}>{option.title}</Text>
                  <Text style={[styles.optionSubtitle, { color: colors.textMuted }]}>{option.subtitle}</Text>
                </View>
                <Switch
                  value={option.value}
                  onValueChange={option.onToggle}
                  trackColor={{ false: colors.border, true: option.color }}
                  thumbColor={colors.white}
                />
              </View>
            ) : (
              <TouchableOpacity key={option.id} style={[styles.optionRow, { borderBottomColor: colors.border }]} onPress={option.action}>
                <View style={[styles.optionIcon, { backgroundColor: `${option.color}20` }]}>
                  <Ionicons name={option.icon} size={22} color={option.color} />
                </View>
                <View style={styles.optionText}>
                  <Text style={[styles.optionTitle, { color: colors.text }]}>{option.title}</Text>
                  <Text style={[styles.optionSubtitle, { color: colors.textMuted }]}>{option.subtitle}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
              </TouchableOpacity>
            )
          ))}
        </View>

        <View style={[styles.tipsCard, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }]}>
          <Text style={[styles.tipsTitle, { color: colors.text }]}>Security Tips</Text>
          {[
            'Never share your PIN with anyone',
            'Use a unique PIN not used elsewhere',
            'Enable biometric for extra security',
            'Regularly review your transaction history',
          ].map((tip, index) => (
            <View key={index} style={styles.tipRow}>
              <Ionicons name="checkmark-circle" size={14} color={colors.success} />
              <Text style={[styles.tipText, { color: colors.textMuted }]}>{tip}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      <Modal
        visible={showChangePinModal}
        transparent
        animationType="slide"
        onRequestClose={closePinModal}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <TouchableOpacity style={styles.modalClose} onPress={closePinModal}>
              <Ionicons name="close" size={24} color={colors.textMuted} />
            </TouchableOpacity>

            <Ionicons name="lock-closed" size={48} color={colors.primary} />
            <Text style={[styles.modalTitle, { color: colors.text }]}>{getPinStepTitle()}</Text>
            <Text style={[styles.modalSubtitle, { color: colors.textMuted }]}>{getPinStepSubtitle()}</Text>

            <TextInput
              style={styles.pinInput}
              value={getPinValue()}
              onChangeText={setPinValue}
              keyboardType="number-pad"
              maxLength={6}
              secureTextEntry
              placeholder="------"
              placeholderTextColor={colors.textMuted}
              textAlign="center"
              autoFocus
            />

            <View style={styles.pinDots}>
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <View
                  key={i}
                  style={[
                    styles.pinDot,
                    { borderColor: colors.border },
                    getPinValue().length > i && { backgroundColor: colors.primary, borderColor: colors.primary },
                  ]}
                />
              ))}
            </View>

            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: colors.primary }, (isProcessing || getPinValue().length !== 6) && { opacity: 0.5 }]}
              onPress={handleChangePin}
              disabled={isProcessing || getPinValue().length !== 6}
            >
              {isProcessing ? (
                <ActivityIndicator size="small" color={colors.black} />
              ) : (
                <Text style={[styles.modalButtonText, { color: colors.black }]}>
                  {pinStep === 3 ? 'Confirm' : 'Continue'}
                </Text>
              )}
            </TouchableOpacity>

            {pinStep > 1 && (
              <TouchableOpacity
                style={styles.backStepButton}
                onPress={() => setPinStep(pinStep - 1)}
              >
                <Text style={[styles.backStepText, { color: colors.textMuted }]}>Back</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  backButton: {
    width: 40, height: 40, borderRadius: 20,
    justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '600' },
  placeholder: { width: 40 },
  scrollView: { flex: 1 },
  content: { padding: 16, flexGrow: 1, paddingBottom: 120 },
  statusCard: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 12, padding: 16, marginBottom: 20,
  },
  statusIcon: {
    width: 48, height: 48, borderRadius: 24,
    justifyContent: 'center', alignItems: 'center',
  },
  statusText: { marginLeft: 12 },
  statusTitle: { fontSize: 16, fontWeight: '600' },
  statusSubtitle: { fontSize: 13, marginTop: 2 },
  sectionTitle: {
    fontSize: 13, fontWeight: '600',
    textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12,
  },
  optionsContainer: { borderRadius: 12, overflow: 'hidden', marginBottom: 20 },
  optionRow: {
    flexDirection: 'row', alignItems: 'center',
    padding: 14, borderBottomWidth: 1,
  },
  optionIcon: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  optionText: { flex: 1, marginLeft: 12 },
  optionTitle: { fontSize: 15, fontWeight: '500' },
  optionSubtitle: { fontSize: 12, marginTop: 2 },
  tipsCard: { borderRadius: 12, padding: 16 },
  tipsTitle: { fontSize: 14, fontWeight: '600', marginBottom: 12 },
  tipRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  tipText: { fontSize: 13 },
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center', alignItems: 'center', padding: 20,
  },
  modalContent: { borderRadius: 20, padding: 32, width: '100%', alignItems: 'center' },
  modalClose: { position: 'absolute', top: 16, right: 16 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginTop: 16 },
  modalSubtitle: { fontSize: 14, marginTop: 8, textAlign: 'center' },
  pinInput: { position: 'absolute', opacity: 0, width: 1, height: 1 },
  pinDots: { flexDirection: 'row', gap: 12, marginTop: 24 },
  pinDot: { width: 16, height: 16, borderRadius: 8, borderWidth: 2 },
  modalButton: { width: '100%', paddingVertical: 14, borderRadius: 12, marginTop: 32, alignItems: 'center' },
  modalButtonText: { fontSize: 16, fontWeight: '600' },
  backStepButton: { marginTop: 16, paddingVertical: 8 },
  backStepText: { fontSize: 14 },
});
