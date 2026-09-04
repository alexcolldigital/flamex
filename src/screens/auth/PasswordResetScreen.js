import React, { useState } from 'react';
import { Alert, SafeAreaView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { useAppTheme } from '../../theme/ThemeProvider';

export default function PasswordResetScreen({ navigation }) {
  const { colors } = useAppTheme();
  const { requestPasswordResetOtp, resetPasswordWithOtp } = useAuthStore();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [isBusy, setIsBusy] = useState(false);

  const requestCode = async () => {
    if (!email.trim()) {
      Alert.alert('Email required', 'Enter your account email.');
      return;
    }
    setIsBusy(true);
    const result = await requestPasswordResetOtp(email.trim());
    setIsBusy(false);
    if (result.success) {
      setCodeSent(true);
      Alert.alert('Code sent', 'Check your email for the password reset code.');
    } else {
      Alert.alert('Unable to send code', result.error);
    }
  };

  const resetPassword = async () => {
    if (!/^\d{6}$/.test(code) || newPassword.length < 8) {
      Alert.alert('Invalid details', 'Enter the 6-digit code and a password with at least 8 characters.');
      return;
    }
    setIsBusy(true);
    const result = await resetPasswordWithOtp(email.trim(), code, newPassword);
    setIsBusy(false);
    if (result.success) {
      Alert.alert('Password reset', 'Your email was verified and password updated.', [
        { text: 'Sign in', onPress: () => navigation.navigate('Login') }
      ]);
    } else {
      Alert.alert('Reset failed', result.error);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" />
      <View style={styles.content}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Reset password</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>We will verify your email before changing your password.</Text>
        <TextInput
          style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.card }]}
          placeholder="Email address"
          placeholderTextColor={colors.textMuted}
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />
        {codeSent && <>
          <TextInput
            style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.card }]}
            placeholder="6-digit email code"
            placeholderTextColor={colors.textMuted}
            keyboardType="number-pad"
            maxLength={6}
            value={code}
            onChangeText={(value) => setCode(value.replace(/\D/g, ''))}
          />
          <TextInput
            style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.card }]}
            placeholder="New password"
            placeholderTextColor={colors.textMuted}
            secureTextEntry
            value={newPassword}
            onChangeText={setNewPassword}
          />
        </>}
        <TouchableOpacity style={[styles.button, { backgroundColor: colors.primary }]} onPress={codeSent ? resetPassword : requestCode} disabled={isBusy}>
          <Text style={styles.buttonText}>{isBusy ? 'Please wait...' : codeSent ? 'Reset password' : 'Email me a code'}</Text>
        </TouchableOpacity>
        {codeSent && <TouchableOpacity onPress={requestCode} style={styles.resend} disabled={isBusy}>
          <Text style={[styles.resendText, { color: colors.primary }]}>Resend code</Text>
        </TouchableOpacity>}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { flex: 1, padding: 24 },
  back: { padding: 8, alignSelf: 'flex-start', marginBottom: 44 },
  title: { fontSize: 28, fontWeight: '700' },
  subtitle: { fontSize: 15, lineHeight: 22, marginTop: 10, marginBottom: 28 },
  input: { borderWidth: 1, borderRadius: 12, padding: 15, fontSize: 16, marginBottom: 14 },
  button: { minHeight: 52, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 6 },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  resend: { alignItems: 'center', padding: 16 },
  resendText: { fontWeight: '600' }
});
