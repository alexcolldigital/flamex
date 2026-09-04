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
import { useAuthStore } from '../../store/authStore';
import { useAppTheme } from '../../theme/ThemeProvider';

const QUICK_AMOUNTS = [1000, 2000, 5000, 10000, 20000, 50000];

export default function ElectricityScreen({ navigation }) {
  const { user, fetchUserProfile } = useAuthStore();
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [discos, setDiscos] = useState([]);
  const [selectedDisco, setSelectedDisco] = useState('');
  const [meterType, setMeterType] = useState('prepaid');
  const [meterNumber, setMeterNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [customerInfo, setCustomerInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [pin, setPin] = useState('');
  const [showPinModal, setShowPinModal] = useState(false);

  useEffect(() => {
    billsAPI
      .getProviders('electricity')
      .then((response) => setDiscos(response.data.providers || []))
      .catch(() => setDiscos([]));
  }, []);

  const verifyMeter = async () => {
    if (!selectedDisco || meterNumber.length < 10) return;
    setIsVerifying(true);
    try {
      const response = await billsAPI.validateMeter(selectedDisco, meterNumber, meterType);
      setCustomerInfo(response.data.customerInfo || null);
    } catch (error) {
      setCustomerInfo(null);
      Alert.alert('Validation failed', error.response?.data?.message || 'Unable to validate meter.');
    } finally {
      setIsVerifying(false);
    }
  };

  const openPinModal = () => {
    if (!selectedDisco) {
      Alert.alert('Error', 'Please select a disco');
      return;
    }
    if (meterNumber.length < 10) {
      Alert.alert('Error', 'Please enter a valid meter number');
      return;
    }
    if (!amount || Number(amount) < 500) {
      Alert.alert('Error', 'Minimum amount is N500');
      return;
    }
    setShowPinModal(true);
  };

  const handlePurchase = async () => {
    setIsLoading(true);
    try {
      const response = await billsAPI.payElectricity({
        provider: selectedDisco,
        meterNumber,
        meterType,
        amount: Number(amount),
        pin
      });
      await fetchUserProfile();
      setShowPinModal(false);
      setPin('');
      const token = response.data.details?.token;
      Alert.alert(
        'Payment successful',
        token
          ? `Token: ${token}`
          : response.data.message || 'Your electricity bill was paid successfully.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      Alert.alert('Payment failed', error.response?.data?.message || 'Unable to pay electricity bill.');
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
        <Text style={styles.headerTitle}>Electricity Bill</Text>
        <View style={styles.placeholder} />
      </LinearGradient>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Available balance</Text>
          <Text style={styles.balanceValue}>N{Number(user?.balances?.NGN || 0).toLocaleString()}</Text>
        </View>

        <Text style={styles.sectionLabel}>Meter Type</Text>
        <View style={styles.meterTypeRow}>
          {['prepaid', 'postpaid'].map((type) => (
            <TouchableOpacity
              key={type}
              style={[styles.meterTypeBtn, meterType === type && styles.meterTypeBtnActive]}
              onPress={() => setMeterType(type)}
            >
              <Ionicons
                name={meterType === type ? 'radio-button-on' : 'radio-button-off'}
                size={20}
                color={meterType === type ? colors.primary : colors.textMuted}
              />
              <Text style={[styles.meterTypeText, meterType === type && styles.meterTypeTextActive]}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionLabel}>Select Distribution Company</Text>
        <View style={styles.discoList}>
          {discos.map((disco) => (
            <TouchableOpacity
              key={disco.id}
              style={[styles.discoCard, selectedDisco === disco.id && styles.discoCardActive]}
              onPress={() => setSelectedDisco(disco.id)}
            >
              <View style={styles.discoLeft}>
                <View style={styles.discoIcon}>
                  <Ionicons name="flash" size={20} color={colors.primary} />
                </View>
                <View>
                  <Text style={styles.discoName}>{disco.name}</Text>
                  <Text style={styles.discoStates}>{(disco.states || []).join(', ')}</Text>
                </View>
              </View>
              {selectedDisco === disco.id ? (
                <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
              ) : null}
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionLabel}>Meter Number</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.meterInput}
            value={meterNumber}
            onChangeText={(value) => {
              setMeterNumber(value.replace(/\D/g, '').slice(0, 13));
              setCustomerInfo(null);
            }}
            keyboardType="number-pad"
            placeholder="Enter meter number"
            placeholderTextColor={colors.textMuted}
            maxLength={13}
          />
          {isVerifying ? <ActivityIndicator size="small" color={colors.primary} /> : null}
        </View>
        <TouchableOpacity style={styles.verifyButton} onPress={verifyMeter} disabled={isVerifying}>
          <Text style={styles.verifyButtonText}>Validate meter</Text>
        </TouchableOpacity>

        {customerInfo ? (
          <View style={styles.customerCard}>
            <Ionicons name="checkmark-circle" size={20} color={colors.success} />
            <View style={styles.customerInfo}>
              <Text style={styles.customerName}>{customerInfo.name}</Text>
              <Text style={styles.customerAddress}>{customerInfo.address}</Text>
            </View>
          </View>
        ) : null}

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

        <TouchableOpacity
          style={[
            styles.payBtn,
            (!selectedDisco || !meterNumber || !amount || Number(amount) < 500) && styles.payBtnDisabled
          ]}
          onPress={openPinModal}
          disabled={!selectedDisco || !meterNumber || !amount || Number(amount) < 500}
        >
          <Text style={styles.payBtnText}>Pay Electricity Bill</Text>
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
        subtitle="Authorize your electricity payment"
      />
    </View>
  );
}

const createStyles = (colors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 60, paddingHorizontal: 16, paddingBottom: 16 },
    backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surface, justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '600', color: colors.text },
    placeholder: { width: 40 },
    scrollView: { flex: 1 },
    scrollContent: { padding: 16, paddingBottom: 60, flexGrow: 1 },
    balanceCard: { backgroundColor: colors.surface, borderRadius: 12, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: colors.border },
    balanceLabel: { color: colors.textMuted },
    balanceValue: { color: colors.success, fontSize: 24, fontWeight: '700', marginTop: 6 },
    sectionLabel: { fontSize: 14, fontWeight: '500', color: colors.text, marginBottom: 12 },
    meterTypeRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
    meterTypeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colors.surface, paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: colors.border },
    meterTypeBtnActive: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
    meterTypeText: { fontSize: 15, color: colors.textMuted },
    meterTypeTextActive: { color: colors.primary, fontWeight: '600' },
    discoList: { marginBottom: 20 },
    discoCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.surface, padding: 14, borderRadius: 12, marginBottom: 8, borderWidth: 1, borderColor: colors.border },
    discoCardActive: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
    discoLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    discoIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primarySoft, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    discoName: { fontSize: 14, fontWeight: '500', color: colors.text, flexShrink: 1 },
    discoStates: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
    inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: 12, paddingHorizontal: 16, height: 56, marginBottom: 12, borderWidth: 1, borderColor: colors.border },
    meterInput: { flex: 1, fontSize: 18, color: colors.text },
    verifyButton: { alignSelf: 'flex-start', backgroundColor: colors.primarySoft, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, marginBottom: 16 },
    verifyButtonText: { color: colors.primary, fontWeight: '700' },
    customerCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.successSoft, padding: 14, borderRadius: 12, marginBottom: 20, gap: 12 },
    customerInfo: { flex: 1 },
    customerName: { fontSize: 15, fontWeight: '500', color: colors.success },
    customerAddress: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
    amountInputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: 12, paddingHorizontal: 16, height: 56, marginBottom: 12, borderWidth: 1, borderColor: colors.border },
    currencySymbol: { fontSize: 20, fontWeight: '700', color: colors.primary, marginRight: 8 },
    amountInput: { flex: 1, fontSize: 24, color: colors.text, fontWeight: '600' },
    quickAmounts: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
    quickAmountBtn: { backgroundColor: colors.surface, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: colors.border },
    quickAmountBtnActive: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
    quickAmountText: { fontSize: 14, color: colors.textMuted },
    quickAmountTextActive: { color: colors.primary, fontWeight: '600' },
    payBtn: { backgroundColor: colors.primary, paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginBottom: 32 },
    payBtnDisabled: { opacity: 0.6 },
    payBtnText: { color: colors.black, fontSize: 16, fontWeight: '700' }
  });
