import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { useAppTheme } from '../../theme/ThemeProvider';

export default function TransactionPinSetupScreen() {
  const { setupPin } = useAuthStore();
  const { colors } = useAppTheme();
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async () => {
    if (pin.length !== 4 || confirmPin.length !== 4) {
      setError('Your PIN must be exactly 4 digits.');
      return;
    }
    if (pin !== confirmPin) {
      setError('PINs do not match.');
      setConfirmPin('');
      return;
    }

    setError('');
    setIsProcessing(true);
    const result = await setupPin(pin);
    setIsProcessing(false);
    if (!result.success) {
      setError(result.error || 'Failed to set your transaction PIN.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.content}>
        <View style={[styles.iconContainer, { backgroundColor: colors.primary }]}>
          <Ionicons name="lock-closed" size={34} color={colors.black} />
        </View>
        <Text style={[styles.title, { color: colors.text }]}>Set your transaction PIN</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>Create a 4-digit PIN to protect your transactions. You only need to do this once.</Text>

        <Text style={[styles.label, { color: colors.text }]}>New PIN</Text>
        <TextInput
          style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]}
          value={pin}
          onChangeText={(value) => { setPin(value.replace(/\D/g, '')); setError(''); }}
          keyboardType="number-pad"
          maxLength={4}
          secureTextEntry
          placeholder="Enter 4 digits"
          placeholderTextColor={colors.textMuted}
        />

        <Text style={[styles.label, { color: colors.text }]}>Confirm PIN</Text>
        <TextInput
          style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]}
          value={confirmPin}
          onChangeText={(value) => { setConfirmPin(value.replace(/\D/g, '')); setError(''); }}
          keyboardType="number-pad"
          maxLength={4}
          secureTextEntry
          placeholder="Re-enter your PIN"
          placeholderTextColor={colors.textMuted}
        />

        {error ? <Text style={[styles.error, { color: colors.danger }]}>{error}</Text> : null}

        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.primary }, (isProcessing || pin.length !== 4 || confirmPin.length !== 4) && styles.disabled]}
          onPress={handleSubmit}
          disabled={isProcessing || pin.length !== 4 || confirmPin.length !== 4}
        >
          {isProcessing ? <ActivityIndicator color={colors.black} /> : <Text style={[styles.buttonText, { color: colors.black }]}>Continue</Text>}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, justifyContent: 'center', padding: 24 },
  iconContainer: {
    alignItems: 'center',
    alignSelf: 'center',
    borderRadius: 32,
    height: 64,
    justifyContent: 'center',
    marginBottom: 24,
    width: 64
  },
  title: { fontSize: 26, fontWeight: '700', marginBottom: 12, textAlign: 'center' },
  subtitle: { fontSize: 15, lineHeight: 22, marginBottom: 32, textAlign: 'center' },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  input: { borderRadius: 10, borderWidth: 1, fontSize: 18, marginBottom: 18, padding: 14 },
  error: { fontSize: 14, marginBottom: 16, textAlign: 'center' },
  button: { alignItems: 'center', borderRadius: 10, justifyContent: 'center', minHeight: 52, marginTop: 8 },
  buttonText: { fontSize: 16, fontWeight: '700' },
  disabled: { opacity: 0.5 }
});
