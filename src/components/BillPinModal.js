import React, { useMemo } from 'react';
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../theme/ThemeProvider';

export default function BillPinModal({
  visible,
  pin,
  setPin,
  loading,
  onConfirm,
  onClose,
  title = 'Enter PIN',
  subtitle = 'Confirm this bill payment'
}) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.content}>
          <Ionicons name="lock-closed" size={42} color={colors.primary} />
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>

          <TextInput
            style={styles.input}
            value={pin}
            onChangeText={setPin}
            keyboardType="number-pad"
            maxLength={4}
            secureTextEntry
            placeholder="----"
            placeholderTextColor={colors.textMuted}
            textAlign="center"
            autoFocus
          />

          <TouchableOpacity
            style={[styles.primaryButton, (pin.length !== 4 || loading) && styles.disabledButton]}
            onPress={onConfirm}
            disabled={pin.length !== 4 || loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color={colors.black} />
            ) : (
              <Text style={styles.primaryButtonText}>Confirm</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryButton} onPress={onClose} disabled={loading}>
            <Text style={styles.secondaryButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (colors) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: colors.overlay,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20
    },
    content: {
      width: '100%',
      maxWidth: 380,
      backgroundColor: colors.surface,
      borderRadius: 20,
      padding: 24,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border
    },
    title: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.text,
      marginTop: 16
    },
    subtitle: {
      fontSize: 14,
      color: colors.textMuted,
      textAlign: 'center',
      marginTop: 8
    },
    input: {
      width: '100%',
      backgroundColor: colors.input,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      fontSize: 24,
      color: colors.text,
      letterSpacing: 8,
      marginTop: 24,
      paddingVertical: 14
    },
    primaryButton: {
      width: '100%',
      backgroundColor: colors.primary,
      borderRadius: 12,
      alignItems: 'center',
      paddingVertical: 14,
      marginTop: 20
    },
    disabledButton: {
      opacity: 0.6
    },
    primaryButtonText: {
      color: colors.black,
      fontSize: 16,
      fontWeight: '700'
    },
    secondaryButton: {
      paddingVertical: 12,
      marginTop: 8
    },
    secondaryButtonText: {
      color: colors.textMuted,
      fontSize: 14
    }
  });
