import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  SafeAreaView, StatusBar, Alert, TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import InlineError from '../../components/common/InlineError';

const C = {
  bg: '#080B12', card: '#111722', border: '#1E293B',
  text: '#FFFFFF', muted: '#94A3B8', sub: '#475569',
  green: '#f59e2c', greenSoft: 'rgba(245,158,44,0.12)',
  red: '#EF4444',
};

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [focused, setFocused] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const { login, isLoading } = useAuthStore();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }
    setErrorMessage('');
    try {
      const result = await login(email.trim(), password);
      if (!result.success) {
        setErrorMessage(result.error);
        Alert.alert('Login failed', result.error);
      }
    } catch (error) {
      const message = error?.message || 'Unable to sign in. Please try again.';
      setErrorMessage(message);
      Alert.alert('Login failed', message);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={C.text} />
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in to your wallet</Text>
        </View>

        <View style={styles.form}>
          <InlineError message={errorMessage} onRetry={handleLogin} />
          <View style={styles.fieldWrap}>
            <Text style={styles.label}>Email</Text>
            <View style={[styles.inputRow, focused === 'email' && styles.inputFocused]}>
              <Ionicons name="mail-outline" size={18} color={C.sub} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="you@example.com"
                placeholderTextColor={C.sub}
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
                onFocus={() => setFocused('email')}
                onBlur={() => setFocused(null)}
              />
            </View>
          </View>

          <View style={styles.fieldWrap}>
            <Text style={styles.label}>Password</Text>
            <View style={[styles.inputRow, focused === 'password' && styles.inputFocused]}>
              <Ionicons name="lock-closed-outline" size={18} color={C.sub} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor={C.sub}
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
                onFocus={() => setFocused('password')}
                onBlur={() => setFocused(null)}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color={C.sub} />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.loginBtn, isLoading && styles.loginBtnDisabled]}
            onPress={handleLogin}
            disabled={isLoading}
            activeOpacity={0.85}
          >
            {isLoading
              ? <Text style={styles.loginBtnText}>Signing In…</Text>
              : <>
                  <Text style={styles.loginBtnText}>Sign In</Text>
                  <Ionicons name="arrow-forward" size={18} color={C.bg} />
                </>
            }
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('PasswordReset')} style={styles.forgotButton}>
            <Text style={styles.forgotText}>Forgot password?</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.securityRow}>
          <Ionicons name="shield-checkmark" size={14} color={C.green} />
          <Text style={styles.securityText}>Secured with 256-bit encryption</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  scroll: { flex: 1, paddingHorizontal: 24 },
  scrollContent: { paddingBottom: 40, flexGrow: 1 },
  backBtn: {
    marginTop: 20, marginBottom: 32,
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: C.card, borderWidth: 1, borderColor: C.border,
    justifyContent: 'center', alignItems: 'center',
  },
  header: { marginBottom: 36 },
  title: { fontSize: 30, fontWeight: '800', color: C.text, marginBottom: 6, letterSpacing: -0.3 },
  subtitle: { fontSize: 15, color: C.muted },

  form: { gap: 20 },
  fieldWrap: {},
  label: { fontSize: 13, fontWeight: '500', color: C.muted, marginBottom: 8, letterSpacing: 0.3 },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.card, borderRadius: 14,
    borderWidth: 1, borderColor: C.border,
    paddingHorizontal: 14, height: 54,
  },
  inputFocused: { borderColor: C.green },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, color: C.text, fontSize: 15 },

  loginBtn: {
    backgroundColor: C.green, borderRadius: 16, height: 54,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    marginTop: 8,
  },
  loginBtnDisabled: { opacity: 0.6 },
  loginBtnText: { color: C.bg, fontSize: 16, fontWeight: '700' },
  forgotButton: { alignItems: 'center', padding: 10 },
  forgotText: { color: C.green, fontSize: 14, fontWeight: '600' },

  securityRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, marginTop: 32, marginBottom: 24,
  },
  securityText: { fontSize: 12, color: C.sub },
});
