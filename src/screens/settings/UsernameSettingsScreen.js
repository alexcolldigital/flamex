import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { useAppTheme } from '../../theme/ThemeProvider';

export default function UsernameSettingsScreen({ navigation }) {
  const { user, setUsername, checkUsernameAvailability } = useAuthStore();
  const { colors } = useAppTheme();
  
  const [username, setUsernameInput] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [isAvailable, setIsAvailable] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [debounceTimer, setDebounceTimer] = useState(null);

  const hasExistingUsername = !!user?.username;

  useEffect(() => {
    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [debounceTimer]);

  const validateUsername = (value) => {
    // Username rules: 3-20 characters, alphanumeric and underscores only
    const regex = /^[a-zA-Z0-9_]{3,20}$/;
    return regex.test(value);
  };

  const checkAvailability = async (value) => {
    if (!validateUsername(value)) {
      setIsAvailable(false);
      return;
    }

    setIsChecking(true);
    try {
      const available = await checkUsernameAvailability(value.toLowerCase());
      setIsAvailable(available);
    } catch (error) {
      console.error('Failed to check username:', error);
    } finally {
      setIsChecking(false);
    }
  };

  const handleUsernameChange = (value) => {
    // Remove spaces and special characters
    const sanitized = value.replace(/[^a-zA-Z0-9_]/g, '');
    setUsernameInput(sanitized);
    setIsAvailable(null);

    // Debounce availability check
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    if (sanitized.length >= 3) {
      const timer = setTimeout(() => {
        checkAvailability(sanitized);
      }, 500);
      setDebounceTimer(timer);
    }
  };

  const handleSubmit = async () => {
    if (!validateUsername(username)) {
      Alert.alert(
        'Invalid Username',
        'Username must be 3-20 characters and can only contain letters, numbers, and underscores.'
      );
      return;
    }

    if (isAvailable === false) {
      Alert.alert('Username Taken', 'Please choose a different username.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await setUsername(username.toLowerCase());
      if (result.success) {
        Alert.alert(
          'Success',
          `Your username @${username.toLowerCase()} has been set!`,
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } else {
        Alert.alert('Error', result.message || 'Failed to set username');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to set username. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusIcon = () => {
    if (isChecking) {
      return <ActivityIndicator size="small" color="#f59e0b" />;
    }
    if (isAvailable === true) {
      return <Ionicons name="checkmark-circle" size={24} color="#22c55e" />;
    }
    if (isAvailable === false) {
      return <Ionicons name="close-circle" size={24} color="#ef4444" />;
    }
    return null;
  };

  const getStatusText = () => {
    if (username.length < 3) {
      return 'Username must be at least 3 characters';
    }
    if (!validateUsername(username)) {
      return 'Only letters, numbers, and underscores allowed';
    }
    if (isAvailable === false) {
      return 'This username is already taken';
    }
    if (isAvailable === true) {
      return 'This username is available!';
    }
    return '';
  };

  const getStatusColor = () => {
    if (isAvailable === true) return '#22c55e';
    if (isAvailable === false) return '#ef4444';
    return '#666';
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <LinearGradient colors={colors.headerGradient} style={styles.header}>
        <TouchableOpacity style={[styles.backButton, { backgroundColor: colors.surface }]} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {hasExistingUsername ? 'Change Username' : 'Set Username'}
        </Text>
        <View style={styles.placeholder} />
      </LinearGradient>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={[styles.infoCard, { backgroundColor: colors.surface }]}>
          <Ionicons name="at" size={32} color={colors.primary} />
          <Text style={[styles.infoTitle, { color: colors.text }]}>Choose Your Username</Text>
          <Text style={[styles.infoText, { color: colors.textMuted }]}>
            Your username is your unique identifier on FlameX. Others can use it to send you crypto without needing your wallet address.
          </Text>
        </View>

        {hasExistingUsername && (
          <View style={[styles.currentUsernameCard, { backgroundColor: colors.primarySoft }]}>
            <Text style={[styles.currentLabel, { color: colors.textMuted }]}>Current Username</Text>
            <Text style={[styles.currentValue, { color: colors.primary }]}>@{user.username}</Text>
          </View>
        )}

        <View style={styles.inputSection}>
          <Text style={[styles.inputLabel, { color: colors.text }]}>New Username</Text>
          <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }]}>
            <Text style={[styles.atSymbol, { color: colors.textMuted }]}>@</Text>
            <TextInput
              style={[styles.input, { color: colors.text }]}
              value={username}
              onChangeText={handleUsernameChange}
              placeholder="username"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={20}
              editable={!isSubmitting}
            />
            <View style={styles.statusIcon}>{getStatusIcon()}</View>
          </View>
          <Text style={[styles.statusText, { color: getStatusColor() }]}>{getStatusText()}</Text>
        </View>

        <View style={[styles.requirementsCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.requirementsTitle, { color: colors.text }]}>Requirements</Text>
          {[
            '3-20 characters long',
            'Letters, numbers, and underscores only',
            'Cannot be changed more than once per month',
            'Must be unique',
          ].map((req, index) => (
            <View key={index} style={styles.requirementRow}>
              <Ionicons name="checkmark" size={14} color={colors.success} />
              <Text style={[styles.requirementText, { color: colors.textMuted }]}>{req}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.submitButton, { backgroundColor: colors.primary }, (!isAvailable || isSubmitting) && { backgroundColor: colors.border }]}
          onPress={handleSubmit}
          disabled={!isAvailable || isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color={colors.black} />
          ) : (
            <Text style={[styles.submitButtonText, { color: colors.black }]}>
              {hasExistingUsername ? 'Update Username' : 'Set Username'}
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 60, paddingHorizontal: 16, paddingBottom: 16 },
  backButton: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '600' },
  placeholder: { width: 40 },
  scrollView: { flex: 1 },
  content: { padding: 16, paddingBottom: 120 },
  infoCard: { borderRadius: 16, padding: 24, alignItems: 'center', marginBottom: 20 },
  infoTitle: { fontSize: 18, fontWeight: '600', marginTop: 12 },
  infoText: { fontSize: 13, textAlign: 'center', marginTop: 8, lineHeight: 20 },
  currentUsernameCard: { borderRadius: 12, padding: 16, marginBottom: 20, alignItems: 'center' },
  currentLabel: { fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 },
  currentValue: { fontSize: 20, fontWeight: 'bold', marginTop: 4 },
  inputSection: { marginBottom: 20 },
  inputLabel: { fontSize: 14, fontWeight: '500', marginBottom: 8 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, paddingHorizontal: 16, height: 56 },
  atSymbol: { fontSize: 18, marginRight: 8 },
  input: { flex: 1, fontSize: 18 },
  statusIcon: { width: 24, height: 24, justifyContent: 'center', alignItems: 'center' },
  statusText: { fontSize: 12, marginTop: 8 },
  requirementsCard: { borderRadius: 12, padding: 16, marginBottom: 20 },
  requirementsTitle: { fontSize: 14, fontWeight: '600', marginBottom: 12 },
  requirementRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  requirementText: { fontSize: 13 },
  submitButton: { paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  submitButtonText: { fontSize: 16, fontWeight: '600' },
});
