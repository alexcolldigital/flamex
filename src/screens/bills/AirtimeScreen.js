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
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { billsAPI } from '../../api/client';
import BillPinModal from '../../components/BillPinModal';
import { cleanPhoneNumber, formatPhoneNumber } from '../../lib/bills';
import { useAuthStore } from '../../store/authStore';
import { useAppTheme } from '../../theme/ThemeProvider';

const QUICK_AMOUNTS = [100, 200, 500, 1000, 2000, 5000];

export default function AirtimeScreen({ navigation }) {
  const { user, fetchUserProfile } = useAuthStore();
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [networks, setNetworks] = useState([]);
  const [selectedNetwork, setSelectedNetwork] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isValidatingPhone, setIsValidatingPhone] = useState(false);
  const [pin, setPin] = useState('');
  const [showPinModal, setShowPinModal] = useState(false);

  useEffect(() => {
    billsAPI
      .getProviders('airtime')
      .then((response) => setNetworks(response.data.providers || []))
      .catch(() => setNetworks([]));
  }, []);

  useEffect(() => {
    const cleaned = cleanPhoneNumber(phoneNumber);
    if (cleaned.length !== 11) return;

    const timeout = setTimeout(async () => {
      setIsValidatingPhone(true);
      try {
        const response = await billsAPI.validatePhone(cleaned);
        if (response.data.network) {
          setSelectedNetwork(response.data.network);
        }
      } catch (error) {
        console.log('Phone validation failed:', error);
      } finally {
        setIsValidatingPhone(false);
      }
    }, 350);

    return () => clearTimeout(timeout);
  }, [phoneNumber]);

  const openPinModal = () => {
    const cleanedNumber = cleanPhoneNumber(phoneNumber);
    if (cleanedNumber.length !== 11) {
      Alert.alert('Error', 'Please enter a valid 11-digit phone number');
      return;
    }
    if (!selectedNetwork) {
      Alert.alert('Error', 'Please select a network');
      return;
    }
    if (!amount || Number(amount) < 50) {
      Alert.alert('Error', 'Minimum amount is N50');
      return;
    }
    setShowPinModal(true);
  };

  const handlePurchase = async () => {
    setIsLoading(true);
    try {
      const cleanedNumber = cleanPhoneNumber(phoneNumber);
      const response = await billsAPI.buyAirtime({
        provider: selectedNetwork,
        phoneNumber: cleanedNumber,
        amount: Number(amount),
        pin
      });
      await fetchUserProfile();
      setShowPinModal(false);
      setPin('');
      Alert.alert('Success', response.data.message || 'Airtime purchase successful', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      Alert.alert('Purchase failed', error.response?.data?.message || 'Unable to buy airtime.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={colors.headerGradient} style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Buy Airtime</Text>
        <View style={styles.placeholder} />
      </LinearGradient>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Available balance</Text>
          <Text style={styles.balanceValue}>N{Number(user?.balances?.NGN || 0).toLocaleString()}</Text>
        </View>

        <Text style={styles.sectionLabel}>Select Network</Text>
        <View style={styles.networksRow}>
          {networks.map((network) => (
            <TouchableOpacity
              key={network.id}
              style={[
                styles.networkCard,
                selectedNetwork === network.id && { borderColor: colors.primary, borderWidth: 2 }
              ]}
              onPress={() => setSelectedNetwork(network.id)}
            >
              <View style={[styles.networkIcon, { backgroundColor: colors.primarySoft }]}>
                <Text style={[styles.networkInitial, { color: colors.primary }]}>
                  {network.name.charAt(0)}
                </Text>
              </View>
              <Text style={[styles.networkName, selectedNetwork === network.id && { color: colors.primary }]}>
                {network.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionLabel}>Phone Number</Text>
        <View style={styles.inputContainer}>
          <Text style={styles.phonePrefix}>+234</Text>
          <TextInput
            style={styles.phoneInput}
            value={phoneNumber}
            onChangeText={(text) => setPhoneNumber(formatPhoneNumber(text))}
            keyboardType="phone-pad"
            placeholder="80X XXX XXXX"
            placeholderTextColor={colors.textMuted}
            maxLength={13}
          />
          {isValidatingPhone ? <ActivityIndicator size="small" color={colors.primary} /> : null}
        </View>

        <Text style={styles.sectionLabel}>Amount (N)</Text>
        <View style={styles.amountInputContainer}>
          <Text style={styles.currencySymbol}>N</Text>
          <TextInput
            style={styles.amountInput}
            value={amount}
            onChangeText={setAmount}
            keyboardType="number-pad"
            placeholder="0.00"
            placeholderTextColor={colors.textMuted}
          />
        </View>

        <View style={styles.quickAmounts}>
          {QUICK_AMOUNTS.map((amt) => (
            <TouchableOpacity
              key={amt}
              style={[styles.quickAmountBtn, amount === amt.toString() && styles.quickAmountBtnActive]}
              onPress={() => setAmount(amt.toString())}
            >
              <Text style={[styles.quickAmountText, amount === amt.toString() && styles.quickAmountTextActive]}>
                N{amt.toLocaleString()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {amount ? (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Transaction Summary</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Amount</Text>
              <Text style={styles.summaryValue}>N{Number(amount || 0).toLocaleString()}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Network</Text>
              <Text style={styles.summaryValue}>
                {networks.find((item) => item.id === selectedNetwork)?.name || 'Auto-detect'}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Phone</Text>
              <Text style={styles.summaryValue}>+234 {phoneNumber}</Text>
            </View>
          </View>
        ) : null}

        <TouchableOpacity
          style={[
            styles.purchaseBtn,
            (!phoneNumber || !amount || cleanPhoneNumber(phoneNumber).length !== 11) && styles.purchaseBtnDisabled
          ]}
          onPress={openPinModal}
          disabled={!phoneNumber || !amount || cleanPhoneNumber(phoneNumber).length !== 11}
        >
          <Text style={styles.purchaseBtnText}>Buy Airtime</Text>
        </TouchableOpacity>
      </ScrollView>

      <BillPinModal
        visible={showPinModal}
        pin={pin}
        setPin={setPin}
        loading={isLoading}
        onConfirm={handlePurchase}
        onClose={() => {
          setShowPinModal(false);
          setPin('');
        }}
        subtitle="Authorize your airtime purchase"
      />
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
      flex: 1,
      padding: 16
    },
    balanceCard: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: colors.border
    },
    balanceLabel: {
      color: colors.textMuted
    },
    balanceValue: {
      color: colors.success,
      fontSize: 24,
      fontWeight: '700',
      marginTop: 6
    },
    sectionLabel: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.text,
      marginBottom: 12
    },
    networksRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 20
    },
    networkCard: {
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 12,
      width: '23%',
      borderWidth: 1,
      borderColor: colors.border
    },
    networkIcon: {
      width: 44,
      height: 44,
      borderRadius: 22,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 8
    },
    networkInitial: {
      fontSize: 18,
      fontWeight: '700'
    },
    networkName: {
      fontSize: 11,
      color: colors.textMuted,
      textAlign: 'center'
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: 12,
      paddingHorizontal: 16,
      height: 56,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: colors.border
    },
    phonePrefix: {
      fontSize: 16,
      color: colors.textMuted,
      marginRight: 8
    },
    phoneInput: {
      flex: 1,
      fontSize: 18,
      color: colors.text
    },
    amountInputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: 12,
      paddingHorizontal: 16,
      height: 56,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border
    },
    currencySymbol: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.primary,
      marginRight: 8
    },
    amountInput: {
      flex: 1,
      fontSize: 24,
      color: colors.text,
      fontWeight: '600'
    },
    quickAmounts: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 20
    },
    quickAmountBtn: {
      backgroundColor: colors.surface,
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border
    },
    quickAmountBtnActive: {
      backgroundColor: colors.primarySoft,
      borderColor: colors.primary
    },
    quickAmountText: {
      fontSize: 14,
      color: colors.textMuted
    },
    quickAmountTextActive: {
      color: colors.primary,
      fontWeight: '600'
    },
    summaryCard: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: colors.border
    },
    summaryTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 12
    },
    summaryRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: colors.border
    },
    summaryLabel: {
      fontSize: 13,
      color: colors.textMuted
    },
    summaryValue: {
      fontSize: 14,
      color: colors.text,
      fontWeight: '500'
    },
    purchaseBtn: {
      backgroundColor: colors.primary,
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: 'center',
      marginBottom: 32
    },
    purchaseBtnDisabled: {
      opacity: 0.6
    },
    purchaseBtnText: {
      color: colors.black,
      fontSize: 16,
      fontWeight: '700'
    }
  });
