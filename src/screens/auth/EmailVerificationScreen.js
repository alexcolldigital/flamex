import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { useAppTheme } from '../../theme/ThemeProvider';

export default function EmailVerificationScreen({ navigation, route }) {
  const { colors } = useAppTheme();
  const { user, logout, requestEmailOtp, verifyEmailOtp } = useAuthStore();
  const isRequired = route?.params?.required === true;
  const [code, setCode] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const email = user?.email || '';

  const sendCode = async () => {
    setIsSending(true);
    const result = await requestEmailOtp(email);
    setIsSending(false);
    Alert.alert(result.success ? 'Code sent' : 'Unable to send code', result.success
      ? 'Check your inbox. The code expires in 10 minutes.'
      : result.error);
  };

  useEffect(() => {
    if (email && !user?.emailVerified) {
      sendCode();
    }
  }, [email, user?.emailVerified]);

  const verifyCode = async () => {
    if (!/^\d{6}$/.test(code)) {
      Alert.alert('Invalid code', 'Enter the 6-digit code from your email.');
      return;
    }

    setIsVerifying(true);
    const result = await verifyEmailOtp(email, code);
    setIsVerifying(false);
    if (result.success) {
      Alert.alert('Email verified', 'Your email address is now verified.', isRequired
        ? undefined
        : [{ text: 'Done', onPress: () => navigation.goBack() }]);
    } else {
      Alert.alert('Verification failed', result.error);
    }
  };

  if (user?.emailVerified) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <StatusBar barStyle={colors.background === '#FFFFFF' ? 'dark-content' : 'light-content'} />
        <View style={styles.center}>
          <Ionicons name="checkmark-circle" size={64} color={colors.success} />
          <Text style={[styles.title, { color: colors.text }]}>Email verified</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>Your account email is confirmed.</Text>
          <TouchableOpacity style={[styles.button, { backgroundColor: colors.primary }]} onPress={() => navigation.goBack()}>
            <Text style={styles.buttonText}>Back to Settings</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={colors.background === '#FFFFFF' ? 'dark-content' : 'light-content'} />
      <View style={styles.content}>
        {isRequired ? (
          <TouchableOpacity onPress={logout} style={styles.logoutButton}>
            <Text style={[styles.logoutText, { color: colors.textMuted }]}>Sign out</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={22} color={colors.text} />
          </TouchableOpacity>
        )}
        <Ionicons name="mail-open-outline" size={52} color={colors.primary} />
        <Text style={[styles.title, { color: colors.text }]}>Verify your email</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>We sent a 6-digit code to {email}.</Text>
        <TextInput
          style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.card }]}
          value={code}
          onChangeText={(value) => setCode(value.replace(/\D/g, '').slice(0, 6))}
          keyboardType="number-pad"
          maxLength={6}
          placeholder="000000"
          placeholderTextColor={colors.textMuted}
          textAlign="center"
        />
        <TouchableOpacity style={[styles.button, { backgroundColor: colors.primary }]} onPress={verifyCode} disabled={isVerifying}>
          {isVerifying ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.buttonText}>Verify email</Text>}
        </TouchableOpacity>
        <TouchableOpacity onPress={sendCode} disabled={isSending} style={styles.resendButton}>
          {isSending ? <ActivityIndicator color={colors.primary} /> : <Text style={[styles.resendText, { color: colors.primary }]}>Resend code</Text>}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { flex: 1, padding: 24, alignItems: 'center' },
  center: { flex: 1, padding: 24, alignItems: 'center', justifyContent: 'center' },
  backButton: { alignSelf: 'flex-start', padding: 8, marginBottom: 56 },
  logoutButton: { alignSelf: 'flex-end', padding: 8, marginBottom: 56 },
  logoutText: { fontSize: 14, fontWeight: '600' },
  title: { fontSize: 26, fontWeight: '700', marginTop: 24, textAlign: 'center' },
  subtitle: { fontSize: 15, lineHeight: 22, marginTop: 10, textAlign: 'center' },
  input: { width: '100%', borderWidth: 1, borderRadius: 12, fontSize: 28, letterSpacing: 8, padding: 14, marginTop: 32 },
  button: { width: '100%', minHeight: 52, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 20 },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  resendButton: { minHeight: 48, justifyContent: 'center', padding: 12 },
  resendText: { fontSize: 15, fontWeight: '600' }
});
