import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { walletAPI, withdrawalAPI } from '../../api/client';
import { currencyFormatter, tokenFormatter } from '../../lib/finance';
import { useAuthStore } from '../../store/authStore';
import { useAppTheme } from '../../theme/ThemeProvider';

const CRYPTO_OPTIONS = [
  { chainId: 'solana', token: 'SOL' },
  { chainId: 'ethereum', token: 'ETH' },
  { chainId: 'bsc', token: 'BNB' },
  { chainId: 'solana', token: 'USDT' },
  { chainId: 'solana', token: 'USDC' },
  { chainId: 'solana', token: 'FLAME' }
];

export default function WithdrawScreen({ navigation }) {
  const { user, fetchUserProfile } = useAuthStore();
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [mode, setMode] = useState('ngn');
  const [banks, setBanks] = useState([]);
  const [selectedBank, setSelectedBank] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [amount, setAmount] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [pin, setPin] = useState('');
  const [otp, setOtp] = useState('');
  const [otpRequired, setOtpRequired] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verifyingAccount, setVerifyingAccount] = useState(false);
  const [selectedCrypto, setSelectedCrypto] = useState(CRYPTO_OPTIONS[0]);
  const [destinationAddress, setDestinationAddress] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    withdrawalAPI
      .getBanks()
      .then((response) => setBanks(response.data.banks || []))
      .catch(() => setBanks([]));

    walletAPI
      .getWallet()
      .then((response) => setWallet(response.data))
      .catch(() => setWallet(null));
  }, []);

  const verifyAccount = async (bankCode, nextAccountNumber) => {
    if (!bankCode || nextAccountNumber.length !== 10) return;
    setVerifyingAccount(true);
    try {
      const response = await withdrawalAPI.verifyAccount(bankCode, nextAccountNumber);
      setAccountName(response.data.accountName || '');
    } catch (error) {
      setAccountName('');
    } finally {
      setVerifyingAccount(false);
    }
  };

  const handleFiatWithdraw = async () => {
    const numericAmount = Number(amount);
    if (!selectedBank || !numericAmount || pin.length !== 4) {
      return;
    }

    setLoading(true);
    setErrorMessage('');
    try {
      const withdraw = mode === 'usd' ? withdrawalAPI.withdrawUsd : withdrawalAPI.withdrawNgn;
      const response = await withdraw({
        amount: numericAmount,
        bankCode: selectedBank.code,
        accountNumber,
        accountName,
        pin,
        ...(otp ? { otp } : {})
      });
      if (response.status === 202 || response.data?.requiresOTP) {
        setOtpRequired(true);
        const requestOtp = mode === 'usd' ? withdrawalAPI.requestUsdOtp : withdrawalAPI.requestNgnOtp;
        await requestOtp(numericAmount);
        return;
      }

      await fetchUserProfile();
      navigation.goBack();
    } catch (error) {
      console.log('NGN withdrawal failed:', error);
      const message = error.response?.data?.message || 'Unable to withdraw funds.';
      setErrorMessage(message);
      Alert.alert('Withdrawal failed', message);
    } finally {
      setLoading(false);
    }
  };

  const handleCryptoWithdraw = async () => {
    const numericAmount = Number(amount);
    if (!destinationAddress || !numericAmount || pin.length !== 4) {
      return;
    }

    setLoading(true);
    setErrorMessage('');
    try {
      const response = await withdrawalAPI.withdrawCrypto({
        chainId: selectedCrypto.chainId,
        token: selectedCrypto.token,
        amount: numericAmount,
        toAddress: destinationAddress,
        pin,
        ...(otp ? { otp } : {})
      });
      if (response.status === 202 || response.data?.requiresOTP) {
        setOtpRequired(true);
        await withdrawalAPI.requestCryptoOtp(numericAmount);
        return;
      }
      await fetchUserProfile();
      navigation.goBack();
    } catch (error) {
      console.log('Crypto withdrawal failed:', error);
      const message = error.response?.data?.message || 'Unable to withdraw funds.';
      setErrorMessage(message);
      Alert.alert('Withdrawal failed', message);
    } finally {
      setLoading(false);
    }
  };

  const requestOtp = async () => {
    const numericAmount = Number(amount);
    if (!numericAmount) return;
    setLoading(true);
    try {
      const response = mode === 'ngn'
        ? await withdrawalAPI.requestNgnOtp(numericAmount)
        : mode === 'usd'
          ? await withdrawalAPI.requestUsdOtp(numericAmount)
        : await withdrawalAPI.requestCryptoOtp(numericAmount);
      setOtpRequired(Boolean(response.data?.requiresOTP));
    } catch (error) {
      console.log('Withdrawal OTP request failed:', error);
      const message = error.response?.data?.message || 'Unable to request a verification code.';
      setErrorMessage(message);
      Alert.alert('OTP request failed', message);
    } finally {
      setLoading(false);
    }
  };

  const cryptoBalance = wallet?.balances?.[selectedCrypto.token] || 0;

  return (
    <View style={styles.container}>
      <LinearGradient colors={colors.headerGradient} style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Withdraw</Text>
        <View style={styles.placeholder} />
      </LinearGradient>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.segmented}>
          {['ngn', 'usd', 'crypto'].map((item) => (
            <TouchableOpacity
              key={item}
              style={[styles.segment, mode === item && styles.segmentActive]}
              onPress={() => setMode(item)}
            >
              <Text style={[styles.segmentText, mode === item && styles.segmentTextActive]}>
                {item === 'ngn' ? 'NGN' : item === 'usd' ? 'USD' : 'Crypto'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

        {mode === 'ngn' || mode === 'usd' ? (
          <>
            <View style={styles.card}>
              <Text style={styles.balanceLabel}>Available {mode.toUpperCase()} balance</Text>
              <Text style={styles.balanceValue}>{currencyFormatter(user?.balances?.[mode.toUpperCase()] || 0, mode === 'usd' ? 'USD' : 'NGN')}</Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Transfer details</Text>

              <Text style={styles.label}>Amount</Text>
              <TextInput
                style={styles.input}
                value={amount}
                onChangeText={setAmount}
                keyboardType="number-pad"
                placeholder={mode === 'usd' ? 'Enter USD amount' : 'Enter NGN amount'}
                placeholderTextColor={colors.textMuted}
              />

              <Text style={styles.label}>Bank</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.bankRow}>
                {banks.map((bank) => (
                  <TouchableOpacity
                    key={bank.code}
                    style={[styles.bankChip, selectedBank?.code === bank.code && styles.bankChipActive]}
                    onPress={() => {
                      setSelectedBank(bank);
                      verifyAccount(bank.code, accountNumber);
                    }}
                  >
                    <Text style={[styles.bankChipText, selectedBank?.code === bank.code && styles.bankChipTextActive]}>
                      {bank.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.label}>Account number</Text>
              <TextInput
                style={styles.input}
                value={accountNumber}
                onChangeText={(value) => {
                  const nextValue = value.replace(/\D/g, '').slice(0, 10);
                  setAccountNumber(nextValue);
                  verifyAccount(selectedBank?.code, nextValue);
                }}
                keyboardType="number-pad"
                placeholder="10-digit account number"
                placeholderTextColor={colors.textMuted}
              />

              <Text style={styles.label}>Account name</Text>
              <View style={[styles.input, styles.readOnlyRow]}>
                {verifyingAccount ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <Text style={styles.readOnlyText}>{accountName || 'Account name will appear here'}</Text>
                )}
              </View>

              <Text style={styles.label}>Transaction PIN</Text>
              <TextInput
                style={styles.input}
                value={pin}
                onChangeText={setPin}
                keyboardType="number-pad"
                placeholder="Enter PIN"
                placeholderTextColor={colors.textMuted}
                secureTextEntry
                maxLength={4}
              />

              {otpRequired && (
                <>
                  <Text style={styles.label}>Email verification code</Text>
                  <TextInput
                    style={styles.input}
                    value={otp}
                    onChangeText={setOtp}
                    keyboardType="number-pad"
                    placeholder="Enter the code sent to your email"
                    placeholderTextColor={colors.textMuted}
                    maxLength={6}
                  />
                  <TouchableOpacity style={styles.secondaryButton} onPress={requestOtp} disabled={loading}>
                    <Text style={styles.secondaryButtonText}>Resend code</Text>
                  </TouchableOpacity>
                </>
              )}

              <TouchableOpacity style={styles.primaryButton} onPress={handleFiatWithdraw} disabled={loading}>
                {loading ? (
                  <ActivityIndicator size="small" color={colors.black} />
                ) : (
                  <Text style={styles.primaryButtonText}>Withdraw to bank</Text>
                )}
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            <View style={styles.card}>
              <Text style={styles.balanceLabel}>Crypto balance</Text>
              <Text style={styles.balanceValue}>{tokenFormatter(cryptoBalance, selectedCrypto.token)}</Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Select asset</Text>
              <View style={styles.cryptoRow}>
                {CRYPTO_OPTIONS.filter((option) => (wallet?.balances?.[option.token] || 0) > 0).map((option) => (
                  <TouchableOpacity
                    key={`${option.chainId}-${option.token}`}
                    style={[
                      styles.cryptoChip,
                      selectedCrypto.token === option.token && selectedCrypto.chainId === option.chainId && styles.cryptoChipActive
                    ]}
                    onPress={() => setSelectedCrypto(option)}
                  >
                    <Text
                      style={[
                        styles.cryptoChipText,
                        selectedCrypto.token === option.token && selectedCrypto.chainId === option.chainId && styles.cryptoChipTextActive
                      ]}
                    >
                      {option.token}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Destination address</Text>
              <TextInput
                style={styles.input}
                value={destinationAddress}
                onChangeText={setDestinationAddress}
                placeholder="Paste wallet address"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="none"
              />

              <Text style={styles.label}>Amount</Text>
              <TextInput
                style={styles.input}
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
                placeholder="0.00"
                placeholderTextColor={colors.textMuted}
              />

              <Text style={styles.label}>Transaction PIN</Text>
              <TextInput
                style={styles.input}
                value={pin}
                onChangeText={setPin}
                keyboardType="number-pad"
                placeholder="Enter PIN"
                placeholderTextColor={colors.textMuted}
                secureTextEntry
                maxLength={4}
              />

              {otpRequired && (
                <>
                  <Text style={styles.label}>Email verification code</Text>
                  <TextInput
                    style={styles.input}
                    value={otp}
                    onChangeText={setOtp}
                    keyboardType="number-pad"
                    placeholder="Enter the code sent to your email"
                    placeholderTextColor={colors.textMuted}
                    maxLength={6}
                  />
                  <TouchableOpacity style={styles.secondaryButton} onPress={requestOtp} disabled={loading}>
                    <Text style={styles.secondaryButtonText}>Resend code</Text>
                  </TouchableOpacity>
                </>
              )}

              <TouchableOpacity style={styles.primaryButton} onPress={handleCryptoWithdraw} disabled={loading}>
                {loading ? (
                  <ActivityIndicator size="small" color={colors.black} />
                ) : (
                  <Text style={styles.primaryButtonText}>Withdraw crypto</Text>
                )}
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const createStyles = (colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: 60,
      paddingHorizontal: 16,
      paddingBottom: 16
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.surface,
      justifyContent: 'center',
      alignItems: 'center'
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text
    },
    placeholder: {
      width: 40
    },
    scrollView: {
      flex: 1
    },
    content: {
      flexGrow: 1,
      padding: 16,
      gap: 16,
      paddingBottom: 120
    },
    segmented: {
      flexDirection: 'row',
      backgroundColor: colors.surface,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 4
    },
    errorText: {
      color: colors.danger || '#ef4444',
      fontWeight: '600'
    },
    segment: {
      flex: 1,
      borderRadius: 10,
      paddingVertical: 12,
      alignItems: 'center'
    },
    segmentActive: {
      backgroundColor: colors.primary
    },
    segmentText: {
      color: colors.textMuted,
      fontWeight: '600'
    },
    segmentTextActive: {
      color: colors.black
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border
    },
    balanceLabel: {
      color: colors.textMuted
    },
    balanceValue: {
      color: colors.text,
      fontSize: 28,
      fontWeight: '700',
      marginTop: 8
    },
    sectionTitle: {
      color: colors.text,
      fontSize: 16,
      fontWeight: '700',
      marginBottom: 12
    },
    label: {
      color: colors.textMuted,
      marginBottom: 6,
      marginTop: 10
    },
    input: {
      backgroundColor: colors.input,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      color: colors.text,
      paddingHorizontal: 14,
      paddingVertical: 14
    },
    bankRow: {
      gap: 10,
      paddingVertical: 4
    },
    bankChip: {
      backgroundColor: colors.cardAlt,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 14,
      paddingVertical: 10
    },
    bankChipActive: {
      borderColor: colors.primary
    },
    bankChipText: {
      color: colors.text
    },
    bankChipTextActive: {
      color: colors.primary,
      fontWeight: '700'
    },
    readOnlyRow: {
      justifyContent: 'center'
    },
    readOnlyText: {
      color: colors.text
    },
    primaryButton: {
      backgroundColor: colors.primary,
      borderRadius: 12,
      alignItems: 'center',
      paddingVertical: 15,
      marginTop: 18
    },
    primaryButtonText: {
      color: colors.black,
      fontWeight: '700'
    },
    secondaryButton: {
      alignItems: 'center',
      paddingVertical: 10,
      marginTop: 4
    },
    secondaryButtonText: {
      color: colors.primary,
      fontWeight: '600'
    },
    cryptoRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10
    },
    cryptoChip: {
      backgroundColor: colors.cardAlt,
      borderRadius: 999,
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderWidth: 1,
      borderColor: colors.border
    },
    cryptoChipActive: {
      borderColor: colors.primary
    },
    cryptoChipText: {
      color: colors.text
    },
    cryptoChipTextActive: {
      color: colors.primary,
      fontWeight: '700'
    }
  });
