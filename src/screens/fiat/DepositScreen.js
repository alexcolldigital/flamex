import * as Clipboard from 'expo-clipboard';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { depositAPI, walletAPI } from '../../api/client';
import { currencyFormatter } from '../../lib/finance';
import { useAppTheme } from '../../theme/ThemeProvider';

export default function DepositScreen({ navigation, route }) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [mode, setMode] = useState(route.params?.chainId ? 'crypto' : 'fiat');
  const [amount, setAmount] = useState('');
  const [fiatCurrency, setFiatCurrency] = useState('NGN');
  const [loading, setLoading] = useState(false);
  const [depositDetails, setDepositDetails] = useState(null);
  const depositMethod = 'checkout';
  const [wallet, setWallet] = useState(null);
  const [selectedChain, setSelectedChain] = useState(route.params?.chainId || 'solana');
  const [cryptoAddress, setCryptoAddress] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [loadingAddress, setLoadingAddress] = useState(false);
  const [checkoutPolling, setCheckoutPolling] = useState(false);
  const [checkoutPollingMessage, setCheckoutPollingMessage] = useState('');
  const initialCheckoutBalanceRef = useRef(null);
  const checkoutPollCountRef = useRef(0);
  const checkoutTimerRef = useRef(null);

  const loadWallet = async () => {
    try {
      const response = await walletAPI.getWallet();
      setWallet(response.data);
    } catch (error) {
      console.log('Load wallet error:', error);
    }
  };

  const loadAddress = async (chainId) => {
    setLoadingAddress(true);
    try {
      const response = await depositAPI.getAddress(chainId);
      setCryptoAddress(response.data);
    } catch (error) {
      setCryptoAddress(null);
    } finally {
      setLoadingAddress(false);
    }
  };

  const refreshWallet = async () => {
    try {
      const response = await walletAPI.getWallet();
      setWallet(response.data);
      return response.data;
    } catch (error) {
      console.log('Refresh wallet error:', error);
      return null;
    }
  };

  useEffect(() => {
    loadWallet();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      if (depositDetails?.method === 'checkout') {
        refreshWallet();
      }
    });

    return unsubscribe;
  }, [navigation, depositDetails]);

  useEffect(() => {
    if (mode === 'crypto') {
      loadAddress(selectedChain);
    }
  }, [mode, selectedChain]);

  const createDeposit = async (numericAmount) => {
    setLoading(true);
    setErrorMessage('');
    setDepositDetails(null);
    try {
      const response = await depositAPI.createFiatDeposit(numericAmount, fiatCurrency);
      const data = response.data;
      setDepositDetails(data);
      if (data?.checkoutUrl) {
        await openCheckout(data.checkoutUrl, data);
      }
    } catch (error) {
      console.log('Deposit error:', error);
      setErrorMessage(error.response?.data?.message || 'Unable to create payment link.');
    } finally {
      setLoading(false);
    }
  };

  const stopCheckoutPolling = () => {
    setCheckoutPolling(false);
    if (checkoutTimerRef.current) {
      clearInterval(checkoutTimerRef.current);
      checkoutTimerRef.current = null;
    }
    checkoutPollCountRef.current = 0;
    setCheckoutPollingMessage('');
  };

  const startCheckoutPolling = (checkoutDetails = depositDetails) => {
    if (checkoutDetails?.method !== 'checkout') {
      return;
    }

    const currency = checkoutDetails.currency || fiatCurrency;
    initialCheckoutBalanceRef.current = wallet?.balances?.[currency] ?? 0;
    checkoutPollCountRef.current = 0;
    setCheckoutPollingMessage('Waiting for payment confirmation...');
    setCheckoutPolling(true);
  };

  useEffect(() => {
    if (!checkoutPolling || depositDetails?.method !== 'checkout') {
      stopCheckoutPolling();
      return;
    }

    if (checkoutTimerRef.current) {
      clearInterval(checkoutTimerRef.current);
    }

    checkoutTimerRef.current = setInterval(async () => {
      checkoutPollCountRef.current += 1;
      if (checkoutPollCountRef.current > 12) {
        setCheckoutPollingMessage('Still waiting for confirmation. You can refresh manually.');
        stopCheckoutPolling();
        return;
      }

      try {
        if (depositDetails?.reference) {
          await depositAPI.verifyNgnDeposit(depositDetails.reference);
        }

        const updatedWallet = await refreshWallet();
        if (!updatedWallet) {
          return;
        }

        const currency = depositDetails.currency || fiatCurrency;
        const oldBalance = initialCheckoutBalanceRef.current ?? 0;
        const newBalance = updatedWallet.balances?.[currency] ?? oldBalance;
        if (newBalance > oldBalance) {
          setCheckoutPollingMessage('Payment confirmed. Balance has been updated.');
          setDepositDetails(null);
          stopCheckoutPolling();
        }
      } catch (error) {
        console.log('Checkout polling error:', error);
        if (error.response?.status >= 500) {
          stopCheckoutPolling();
        }
      }
    }, 5000);

    return () => {
      if (checkoutTimerRef.current) {
        clearInterval(checkoutTimerRef.current);
      }
    };
  }, [checkoutPolling, depositDetails]);

  const openCheckout = async (url, checkoutDetails = depositDetails) => {
    if (!url) return;
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
      startCheckoutPolling(checkoutDetails);
    } else {
      console.log('Cannot open checkout URL:', url);
    }
  };

  const copyValue = async (value) => {
    await Clipboard.setStringAsync(String(value || ''));
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={colors.headerGradient} style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Deposit</Text>
        <View style={styles.placeholder} />
      </LinearGradient>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.segmented}>
          {['fiat', 'crypto'].map((item) => (
            <TouchableOpacity
              key={item}
              style={[styles.segment, mode === item && styles.segmentActive]}
              onPress={() => setMode(item)}
            >
              <Text style={[styles.segmentText, mode === item && styles.segmentTextActive]}>
                {item === 'fiat' ? 'Fiat' : 'Crypto'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.card}>
          <Text style={styles.balanceLabel}>Current balances</Text>
          <Text style={styles.balanceValue}>{currencyFormatter(wallet?.balances?.NGN || 0)}</Text>
          <Text style={styles.helperText}>
            USD {currencyFormatter(wallet?.balances?.USD || 0, 'USD')} • SOL {(wallet?.balances?.SOL || 0).toFixed(4)}
          </Text>
        </View>

        {mode === 'fiat' ? (
          <>
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Deposit {fiatCurrency} via Flutterwave</Text>
              <View style={styles.currencyRow}>
                {['NGN', 'USD'].map((currency) => (
                  <TouchableOpacity
                    key={currency}
                    style={[styles.currencyChip, fiatCurrency === currency && styles.currencyChipActive]}
                    onPress={() => {
                      setFiatCurrency(currency);
                      setDepositDetails(null);
                      setErrorMessage('');
                    }}
                  >
                    <Text style={[styles.currencyChipText, fiatCurrency === currency && styles.currencyChipTextActive]}>
                      {currency}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TextInput
                style={styles.input}
                value={amount}
                onChangeText={setAmount}
                keyboardType="number-pad"
                placeholder={fiatCurrency === 'NGN' ? 'Enter amount (min ₦100)' : 'Enter USD amount (min $1)'}
                placeholderTextColor={colors.textMuted}
              />
              <TouchableOpacity
                style={[styles.primaryButton, (loading || Number(amount) < (fiatCurrency === 'NGN' ? 100 : 1)) && { opacity: 0.5 }]}
                onPress={() => createDeposit(Number(amount))}
                disabled={loading || Number(amount) < (fiatCurrency === 'NGN' ? 100 : 1)}
              >
                {loading ? (
                  <ActivityIndicator size="small" color={colors.black} />
                ) : (
                  <Text style={styles.primaryButtonText}>Generate payment link</Text>
                )}
              </TouchableOpacity>
            </View>

            {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

            {depositDetails?.checkoutUrl ? (
              <View style={styles.card}>
                <Text style={styles.sectionTitle}>Payment link ready</Text>
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={() => openCheckout(depositDetails.checkoutUrl)}
                >
                  <Text style={styles.primaryButtonText}>Open Flutterwave checkout</Text>
                </TouchableOpacity>
                <Text style={styles.hintText}>
                  Your balance will be updated automatically once payment is confirmed.
                </Text>
              </View>
            ) : null}
            {checkoutPolling ? (
              <View style={styles.card}>
                <Text style={styles.sectionTitle}>Payment confirmation</Text>
                <Text style={styles.hintText}>{checkoutPollingMessage}</Text>
              </View>
            ) : null}
          </>
        ) : (
          <>
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Choose network</Text>
              <View style={styles.chainRow}>
                {(wallet?.wallets || []).map((item) => (
                  <TouchableOpacity
                    key={item.chainId}
                    style={[styles.chainChip, selectedChain === item.chainId && styles.chainChipActive]}
                    onPress={() => setSelectedChain(item.chainId)}
                  >
                    <Text style={[styles.chainChipText, selectedChain === item.chainId && styles.chainChipTextActive]}>
                      {item.chain.symbol}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Deposit address</Text>
              {loadingAddress ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : cryptoAddress ? (
                <>
                  <Text style={styles.detailValue}>{cryptoAddress.address}</Text>
                  <Text style={styles.hintText}>{cryptoAddress.explorerUrl}</Text>
                  <TouchableOpacity style={styles.primaryButton} onPress={() => copyValue(cryptoAddress.address)}>
                    <Text style={styles.primaryButtonText}>Copy address</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <Text style={styles.hintText}>Address unavailable for this network.</Text>
              )}
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
    helperText: {
      color: colors.textMuted,
      marginTop: 6
    },
    errorText: {
      color: colors.danger || '#ef4444',
      fontWeight: '600'
    },
    sectionTitle: {
      color: colors.text,
      fontSize: 16,
      fontWeight: '700',
      marginBottom: 12
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
    primaryButton: {
      backgroundColor: colors.primary,
      borderRadius: 12,
      alignItems: 'center',
      paddingVertical: 15,
      marginTop: 14
    },
    primaryButtonText: {
      color: colors.black,
      fontWeight: '700'
    },
    detailRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border
    },
    detailLabel: {
      color: colors.textMuted,
      fontSize: 12
    },
    detailValue: {
      color: colors.text,
      fontSize: 15,
      fontWeight: '600',
      marginTop: 4
    },
    hintText: {
      color: colors.textMuted,
      lineHeight: 20,
      marginTop: 14
    },
    currencyRow: {
      flexDirection: 'row',
      gap: 10,
      marginBottom: 12
    },
    currencyChip: {
      backgroundColor: colors.cardAlt,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 16,
      paddingVertical: 10
    },
    currencyChipActive: {
      borderColor: colors.primary,
      backgroundColor: colors.primarySoft
    },
    currencyChipText: {
      color: colors.text,
      fontWeight: '600'
    },
    currencyChipTextActive: {
      color: colors.primary
    },

    chainRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10
    },
    chainChip: {
      backgroundColor: colors.cardAlt,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 14,
      paddingVertical: 10
    },
    chainChipActive: {
      borderColor: colors.primary
    },
    chainChipText: {
      color: colors.text
    },
    chainChipTextActive: {
      color: colors.primary,
      fontWeight: '700'
    }
  });
